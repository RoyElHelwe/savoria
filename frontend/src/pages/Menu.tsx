import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MenuCard, { MenuItem } from '../components/MenuCard';
import { getMenu, getCategories, Category } from '../services/menuService';

const Menu = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  // Filter items by active category
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
          <div key={item.item_id} className="bg-white rounded-lg shadow-md overflow-hidden">
            {item.image_url && (
              <div className="h-48 w-full overflow-hidden">
                <img 
                  src={item.image_url} 
                  alt={item.name} 
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                />
              </div>
            )}
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-bold">{item.name}</h3>
                <span className="font-bold text-amber-600">${item.price.toFixed(2)}</span>
              </div>
              <p className="text-gray-600 text-sm mb-3">{item.description}</p>
              
              {/* Dietary icons */}
              <div className="flex space-x-2 mb-4">
                {item.is_vegetarian && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Vegetarian</span>
                )}
                {item.is_vegan && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Vegan</span>
                )}
                {item.is_gluten_free && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Gluten-Free</span>
                )}
                {item.contains_nuts && (
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">Contains Nuts</span>
                )}
                {item.spice_level > 0 && (
                  <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                    Spicy {Array(item.spice_level).fill('🌶️').join('')}
                  </span>
                )}
              </div>
              
              <Link 
                to="/order-online" 
                className="w-full bg-amber-500 hover:bg-amber-600 text-white py-2 px-4 rounded-md text-center block transition"
              >
                Order Online
              </Link>
            </div>
          </div>
        ))}
      </div>
              
      {/* Empty state */}
      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No menu items found in this category.</p>
        </div>
      )}
      
      {/* Call-to-action section */}
      <div className="mt-16 bg-amber-50 p-8 rounded-lg text-center">
        <h2 className="text-2xl font-bold mb-3">Ready to enjoy our food at home?</h2>
        <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
          You can order our delicious dishes for delivery or pickup. Fast, fresh, and convenient!
        </p>
        <Link
          to="/order-online"
          className="bg-amber-500 hover:bg-amber-600 text-white px-8 py-3 rounded-md inline-block font-medium transition"
        >
          Order Online Now
        </Link>
      </div>
    </div>
  );
};

export default Menu;