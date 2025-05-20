import axios from 'axios';
import { API_BASE_URL } from '../config';

export interface OrderItem {
  item_id: number;
  name: string;
  quantity: number;
  price_per_unit: number;
  special_instructions: string | null;
  image_url: string | null;
  description?: string;
  subtotal?: number;
}

export interface TrackingEvent {
  id: number;
  event_type: 'order_placed' | 'status_update' | 'payment_update' | 'note_added' | 'order_completed';
  status: string | null;
  details: string | null;
  timestamp: string;
}

export interface Order {
  order_id: number;
  order_type: 'delivery' | 'pickup' | 'dine-in';
  status: 'pending' | 'confirmed' | 'preparing' | 'out for delivery' | 'delivered' | 'ready for pickup' | 'completed' | 'cancelled';
  total_amount: number;
  payment_method: string;
  payment_status: 'pending' | 'paid' | 'failed';
  delivery_address: string | null;
  delivery_fee: number;
  tax_amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  items: OrderItem[];
  tracking: TrackingEvent[];
  subtotal?: number;
}

export interface Pagination {
  current_page: number;
  per_page: number;
  total_items: number;
  total_pages: number;
}

export interface GetOrdersResponse {
  success: boolean;
  orders: Order[];
  pagination: Pagination;
  error?: string;
}

export interface GetOrderDetailResponse {
  success: boolean;
  order: Order;
  error?: string;
}

/**
 * Get user's orders with pagination and optional filtering
 */
export const getUserOrders = async (
  page: number = 1,
  limit: number = 10,
  status?: string
): Promise<GetOrdersResponse> => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    // Build query parameters
    const params: Record<string, string | number> = { page, limit };
    if (status) params.status = status;
    
    const response = await axios.get(`${API_BASE_URL}/user/get_user_orders.php`, {
      params,
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    if (response.data.success) {
      return response.data;
    } else {
      throw new Error(response.data.error || 'Failed to fetch orders');
    }
  } catch (error) {
    console.error('Error fetching user orders:', error);
    
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || 'Failed to fetch orders');
    }
    
    throw new Error('An error occurred while fetching orders');
  }
};

/**
 * Get order details by ID
 */
export const getOrderDetail = async (orderId: number): Promise<GetOrderDetailResponse> => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await axios.get(`${API_BASE_URL}/user/get_order_detail.php`, {
      params: { id: orderId },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    if (response.data.success) {
      return response.data;
    } else {
      throw new Error(response.data.error || 'Failed to fetch order details');
    }
  } catch (error) {
    console.error('Error fetching order details:', error);
    
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || 'Failed to fetch order details');
    }
    
    throw new Error('An error occurred while fetching order details');
  }
};

/**
 * Get order status label and color
 */
export const getOrderStatusInfo = (status: string): { label: string; color: string } => {
  switch (status) {
    case 'pending':
      return { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' };
    case 'confirmed':
      return { label: 'Confirmed', color: 'bg-blue-100 text-blue-800' };
    case 'preparing':
      return { label: 'Preparing', color: 'bg-blue-100 text-blue-800' };
    case 'out for delivery':
      return { label: 'Out for Delivery', color: 'bg-purple-100 text-purple-800' };
    case 'delivered':
      return { label: 'Delivered', color: 'bg-green-100 text-green-800' };
    case 'ready for pickup':
      return { label: 'Ready for Pickup', color: 'bg-purple-100 text-purple-800' };
    case 'completed':
      return { label: 'Completed', color: 'bg-green-100 text-green-800' };
    case 'cancelled':
      return { label: 'Cancelled', color: 'bg-red-100 text-red-800' };
    default:
      return { label: status.charAt(0).toUpperCase() + status.slice(1), color: 'bg-gray-100 text-gray-800' };
  }
};

/**
 * Format currency for display
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
};

/**
 * Get cart items count from local storage
 */
export const countCartItems = (): number => {
  try {
    const cartString = localStorage.getItem('cart');
    if (!cartString) return 0;
    
    const cart = JSON.parse(cartString);
    return Array.isArray(cart) ? cart.reduce((total, item) => total + item.quantity, 0) : 0;
  } catch (error) {
    console.error('Error counting cart items:', error);
    return 0;
  }
};

/**
 * Get cart from local storage
 */
export const getCartFromLocalStorage = (): any[] => {
  try {
    const cartString = localStorage.getItem('cart');
    return cartString ? JSON.parse(cartString) : [];
  } catch (error) {
    console.error('Error getting cart from localStorage:', error);
    return [];
  }
};

/**
 * Save cart to local storage
 */
export const saveCartToLocalStorage = (cart: any[]): void => {
  try {
    localStorage.setItem('cart', JSON.stringify(cart));
  } catch (error) {
    console.error('Error saving cart to localStorage:', error);
  }
};

/**
 * Clear cart from local storage
 */
export const clearCart = (): void => {
  try {
    localStorage.removeItem('cart');
  } catch (error) {
    console.error('Error clearing cart from localStorage:', error);
  }
};

/**
 * Place an order
 */
export const placeOrder = async (orderData: any): Promise<any> => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      return { success: false, error: 'No authentication token found' };
    }
    
    const response = await axios.post(`${API_BASE_URL}/orders/place_order.php`, orderData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error placing order:', error);
    
    if (axios.isAxiosError(error) && error.response) {
      return { 
        success: false, 
        error: error.response.data.error || 'Failed to place order' 
      };
    }
    
    return { 
      success: false, 
      error: 'An error occurred while placing your order' 
    };
  }
};