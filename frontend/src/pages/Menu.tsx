import { useState, useEffect } from 'react';
import MenuCard, { MenuItem, CartItem } from '../components/MenuCard';
import { getMenu, getCategories, Category } from '../services/menuService';

const Menu = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setIsLoading(true);
        // Fetch menu items from backend
        const menuData = await getMenu();
        
        // Flatten menu items from all categories
        const allItems: MenuItem[] = [];
        menuData.menu.forEach(category => {
          allItems.push(...category.items);
        });
        setMenuItems(allItems);
        
        // Fetch categories
        const categoryData = await getCategories();
        setCategories(categoryData.categories);
        
        // Set first category as active by default
        if (categoryData.categories.length > 0) {
          setActiveCategory(categoryData.categories[0].id);
        }
      } catch (error) {
        console.error('Failed to fetch menu:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMenu();
  }, []);

  const handleAddToCart = (item: CartItem) => {
    setCart(prevCart => {
      // Check if item already exists in cart
      const existingItemIndex = prevCart.findIndex(cartItem => cartItem.item_id === item.item_id);
      
      if (existingItemIndex >= 0) {
        // Update quantity of existing item
        const updatedCart = [...prevCart];
        updatedCart[existingItemIndex].quantity += item.quantity;
        return updatedCart;
      } else {
        // Add new item to cart
        return [...prevCart, item];
      }
    });
  };

  const filteredItems = activeCategory 
    ? menuItems.filter(item => item.category_id === activeCategory)
    : menuItems;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold text-center mb-4">Our Menu</h1>
      <p className="text-gray-600 text-center mb-10 max-w-2xl mx-auto">
        Discover our carefully crafted dishes made with the freshest ingredients and prepared with passion by our expert chefs.
      </p>
      
      {/* Categories navigation */}
      <div className="flex justify-center mb-12 overflow-x-auto pb-2">
        <div className="flex space-x-2">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`px-4 py-2 rounded-md whitespace-nowrap transition ${
                activeCategory === category.id
                  ? 'bg-amber-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>
      
      {/* Menu grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map(item => (
          <MenuCard
            key={item.item_id}
            {...item}
            onAddToCart={handleAddToCart}
          />
        ))}
      </div>
      
      {/* Empty state */}
      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No menu items found in this category.</p>
        </div>
      )}
      
      {/* Cart summary (floating) */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 right-6 bg-white rounded-lg shadow-lg p-4 z-50 border border-gray-200">
          <div className="flex items-center">
            <div className="mr-4">
              <span className="bg-amber-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                {cart.reduce((total, item) => total + item.quantity, 0)}
              </span>
            </div>
            <div>
              <p className="font-semibold">Your Cart</p>
              <p className="text-amber-600 font-bold">
                ${cart.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2)}
              </p>
            </div>
            <button className="ml-4 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-md text-sm">
              Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Menu;
