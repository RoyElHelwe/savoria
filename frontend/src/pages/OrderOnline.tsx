import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MenuCard, { MenuItem, CartItem } from '../components/MenuCard';
import { getMenu, getCategories, Category } from '../services/menuService';
import { useAuth } from '../contexts/AuthContext';

interface OrderFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  delivery_instructions: string;
  payment_method: 'cash' | 'card';
}

const OrderOnline = () => {
  const { user, isAuthenticated } = useAuth();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  
  // Form data state
  const [formData, setFormData] = useState<OrderFormData>({
    name: user ? `${user.first_name} ${user.last_name}` : '',
    email: user ? user.email : '',
    phone: user?.phone || '',
    address: user?.address || '',
    delivery_instructions: '',
    payment_method: 'card'
  });
  
  const [formError, setFormError] = useState('');

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
  
  const handleRemoveFromCart = (itemId: number) => {
    setCart(prevCart => prevCart.filter(item => item.item_id !== itemId));
  };
  
  const updateItemQuantity = (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setCart(prevCart => 
      prevCart.map(item => 
        item.item_id === itemId 
          ? { ...item, quantity: newQuantity } 
          : item
      )
    );
  };
  
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleCheckout = () => {
    if (cart.length === 0) return;
    setShowCheckout(true);
  };
  
  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    
    // Basic validation
    if (!formData.name || !formData.email || !formData.phone || !formData.address) {
      setFormError('Please fill in all required fields');
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setFormError('Please enter a valid email address');
      return;
    }
    
    // Phone validation (simple validation)
    const phoneRegex = /^\+?[0-9\s\-()]{8,}$/;
    if (!phoneRegex.test(formData.phone)) {
      setFormError('Please enter a valid phone number');
      return;
    }
    
    // Mock API call for placing order
    setTimeout(() => {
      setOrderSuccess(true);
      // Clear cart after successful order
      setCart([]);
    }, 1500);
  };
  
  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // Filter items by active category
  const filteredItems = activeCategory 
    ? menuItems.filter(item => item.category_id === activeCategory)
    : menuItems;

  if (orderSuccess) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8 text-center">
          <svg className="mx-auto h-16 w-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <h2 className="text-2xl font-bold mt-4 mb-2">Order Placed Successfully!</h2>
          <p className="text-gray-600 mb-6">
            Thank you for your order. We've sent a confirmation to your email with all the details.
          </p>
          <Link to="/" className="bg-amber-500 hover:bg-amber-600 text-white font-medium px-6 py-3 rounded-md inline-block transition">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

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
      <h1 className="text-4xl font-bold text-center mb-4">Order Online</h1>
      <p className="text-gray-600 text-center mb-10 max-w-2xl mx-auto">
        Enjoy our delicious food from the comfort of your home. Browse our menu and place your order for delivery or pickup.
      </p>
      
      {showCheckout ? (
        <div className="max-w-2xl mx-auto">
          <button 
            onClick={() => setShowCheckout(false)} 
            className="mb-6 flex items-center text-amber-600 hover:text-amber-700"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Menu
          </button>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-6">Checkout</h2>
            
            {formError && (
              <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4">
                {formError}
              </div>
            )}
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Order Summary</h3>
              {cart.map(item => (
                <div key={item.item_id} className="flex justify-between items-center py-2 border-b">
                  <div>
                    <span className="font-medium">{item.name}</span>
                    <span className="text-gray-600 ml-2">x{item.quantity}</span>
                  </div>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="flex justify-between items-center py-3 font-bold mt-3">
                <span>Total</span>
                <span>${calculateTotal().toFixed(2)}</span>
              </div>
            </div>
            
            <form onSubmit={handlePlaceOrder}>
              <h3 className="text-lg font-semibold mb-3">Delivery Information</h3>
              
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="name" className="block text-gray-700 text-sm font-medium mb-1">
                    Full Name*
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="phone" className="block text-gray-700 text-sm font-medium mb-1">
                    Phone Number*
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label htmlFor="email" className="block text-gray-700 text-sm font-medium mb-1">
                  Email Address*
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="address" className="block text-gray-700 text-sm font-medium mb-1">
                  Delivery Address*
                </label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  value={formData.address}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="delivery_instructions" className="block text-gray-700 text-sm font-medium mb-1">
                  Delivery Instructions
                </label>
                <textarea
                  id="delivery_instructions"
                  name="delivery_instructions"
                  value={formData.delivery_instructions}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                  rows={2}
                  placeholder="E.g., Apartment number, gate code, etc."
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-medium mb-1">
                  Payment Method*
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="payment_method"
                      value="card"
                      checked={formData.payment_method === 'card'}
                      onChange={handleFormChange}
                      className="mr-2"
                    />
                    Pay with Card
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="payment_method"
                      value="cash"
                      checked={formData.payment_method === 'cash'}
                      onChange={handleFormChange}
                      className="mr-2"
                    />
                    Cash on Delivery
                  </label>
                </div>
              </div>
              
              <button 
                type="submit" 
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-md transition"
              >
                Place Order
              </button>
            </form>
          </div>
        </div>
      ) : (
        <>
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
          
          {/* Menu and Cart layout */}
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Menu grid */}
            <div className="lg:w-3/4">
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
            </div>
            
            {/* Cart */}
            <div className="lg:w-1/4">
              <div className="bg-white rounded-lg shadow p-6 sticky top-8">
                <h2 className="text-xl font-bold mb-4">Your Order</h2>
                
                {cart.length === 0 ? (
                  <p className="text-gray-500 mb-4">Your cart is empty</p>
                ) : (
                  <>
                    <div className="divide-y max-h-96 overflow-y-auto mb-4">
                      {cart.map(item => (
                        <div key={item.item_id} className="py-3">
                          <div className="flex justify-between">
                            <div className="flex-1">
                              <h3 className="font-medium">{item.name}</h3>
                              <p className="text-gray-600">${item.price.toFixed(2)} each</p>
                            </div>
                            <button
                              onClick={() => handleRemoveFromCart(item.item_id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                          <div className="flex items-center mt-2">
                            <button
                              onClick={() => updateItemQuantity(item.item_id, item.quantity - 1)}
                              className="w-8 h-8 rounded-md border border-gray-300 flex items-center justify-center"
                            >
                              -
                            </button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateItemQuantity(item.item_id, item.quantity + 1)}
                              className="w-8 h-8 rounded-md border border-gray-300 flex items-center justify-center"
                            >
                              +
                            </button>
                            <span className="ml-auto font-medium">
                              ${(item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="border-t pt-3 mb-4">
                      <div className="flex justify-between font-bold">
                        <span>Total</span>
                        <span>${calculateTotal().toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={handleCheckout}
                      disabled={cart.length === 0}
                      className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Proceed to Checkout
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default OrderOnline;
