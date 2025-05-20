import { CartItem } from "../components/MenuCard";

/**
 * Order Service
 *
 * Handles all API calls related to orders
 */

const BASE_URL = "http://localhost/savoria/backend/api/order";

export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  delivery_instructions?: string;
}

export interface OrderRequest {
  items: CartItem[];
  customer_info: CustomerInfo;
  order_type: "delivery" | "pickup" | "dine-in";
  payment_method: "cash" | "credit_card" | "debit_card" | "paypal" | "other";
}

export interface PlaceOrderResponse {
  success: boolean;
  order_id?: number;
  total_amount?: number;
  message?: string;
  error?: string;
}

export interface OrderItem {
  order_item_id: number;
  item_id: number;
  name: string;
  description?: string;
  image_url?: string;
  quantity: number;
  price: number;
  subtotal: number;
  special_instructions?: string;
}

export interface Order {
  order_id: number;
  user_id: number;
  order_type: string;
  status: string;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  delivery_address: string;
  delivery_fee: number;
  tax_amount: number;
  notes: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  items: {
    order_item_id: number;
    item_id: number;
    name: string;
    description: string;
    image_url: string;
    quantity: number;
    price: number;
    subtotal: number;
    special_instructions: string | null;
  }[];
}

export interface OrderList {
    created_at: string;
    customer_email: string;
    customer_name: string;
    customer_phone: string;
    delivery_address: string;
    id: number;
    item_count: number;
    payment_method: string;
    payment_status: string;
    special_instructions: string;
    status: string;
    total_amount: number;
    updated_at: string;
    user_id: number;
  }
  

export interface GetOrderResponse {
  success: boolean;
  order?: Order;
  error?: string;
}

export interface GetUserOrdersResponse {
  success: boolean;
  orders: Order[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
  error?: string;
}

/**
 * Place a new order
 *
 * @param {OrderRequest} orderData - Order details including items and customer info
 * @returns {Promise<PlaceOrderResponse>} - Promise with order confirmation
 */
export const placeOrder = async (
  orderData: OrderRequest
): Promise<PlaceOrderResponse> => {
  try {
    // Get token for authentication if available
    const token = localStorage.getItem("token");

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}/place_order.php`, {
      method: "POST",
      headers,
      body: JSON.stringify(orderData),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error placing order:", error);
    return {
      success: false,
      error: "Failed to place order. Please try again later.",
    };
  }
};

/**
 * Get order details by ID
 *
 * @param {number} orderId - The order ID to retrieve
 * @returns {Promise<GetOrderResponse>} - Promise resolving to order details
 */
export const getOrder = async (orderId: number): Promise<GetOrderResponse> => {
  try {
    // Get token for authentication if available
    const token = localStorage.getItem("token");

    const headers: Record<string, string> = {};

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(
      `${BASE_URL}/get_order.php?order_id=${orderId}`,
      {
        headers,
      }
    );

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching order ${orderId}:`, error);
    return {
      success: false,
      error: "Failed to retrieve order details",
    };
  }
};

/**
 * Get user's order history
 *
 * @param {number} page - Page number for pagination
 * @param {number} limit - Number of orders per page
 * @returns {Promise<GetUserOrdersResponse>} - Promise resolving to user's orders
 */
export const getUserOrders = async (
  page = 1,
  limit = 10
): Promise<GetUserOrdersResponse> => {
  try {
    // Get token for authentication
    const token = localStorage.getItem("token");

    if (!token) {
      return {
        success: false,
        orders: [],
        pagination: {
          total: 0,
          page,
          limit,
          total_pages: 0,
        },
        error: "Authentication required",
      };
    }

    const response = await fetch(
      `${BASE_URL}/get_user_orders.php?page=${page}&limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching user orders:", error);
    return {
      success: false,
      orders: [],
      pagination: {
        total: 0,
        page,
        limit,
        total_pages: 0,
      },
      error: "Failed to retrieve order history",
    };
  }
};

// Cart functions using localStorage

/**
 * Save cart to localStorage
 *
 * @param {CartItem[]} cartItems - Array of cart items
 */
export const saveCartToLocalStorage = (cartItems: CartItem[]): void => {
  localStorage.setItem("cart", JSON.stringify(cartItems));
};

/**
 * Get cart from localStorage
 *
 * @returns {CartItem[]} - Array of cart items
 */
export const getCartFromLocalStorage = (): CartItem[] => {
  const cartData = localStorage.getItem("cart");
  if (cartData) {
    try {
      return JSON.parse(cartData);
    } catch (e) {
      console.error("Error parsing cart data", e);
      return [];
    }
  }
  return [];
};

/**
 * Add item to cart in localStorage
 *
 * @param {CartItem} item - Cart item to add
 * @returns {CartItem[]} - Updated cart
 */
export const addToCart = (item: CartItem): CartItem[] => {
  const cart = getCartFromLocalStorage();
  const existingItemIndex = cart.findIndex(
    (cartItem) => cartItem.item_id === item.item_id
  );

  if (existingItemIndex >= 0) {
    // Update quantity of existing item
    cart[existingItemIndex].quantity += item.quantity;
  } else {
    // Add new item to cart
    cart.push(item);
  }

  saveCartToLocalStorage(cart);
  return cart;
};

/**
 * Remove item from cart in localStorage
 *
 * @param {number} itemId - ID of item to remove
 * @returns {CartItem[]} - Updated cart
 */
export const removeFromCart = (itemId: number): CartItem[] => {
  const cart = getCartFromLocalStorage();
  const updatedCart = cart.filter((item) => item.item_id !== itemId);
  saveCartToLocalStorage(updatedCart);
  return updatedCart;
};

/**
 * Update item quantity in cart
 *
 * @param {number} itemId - ID of item to update
 * @param {number} quantity - New quantity
 * @returns {CartItem[]} - Updated cart
 */
export const updateCartItemQuantity = (
  itemId: number,
  quantity: number
): CartItem[] => {
  if (quantity < 1) return getCartFromLocalStorage();

  const cart = getCartFromLocalStorage();
  const updatedCart = cart.map((item) =>
    item.item_id === itemId ? { ...item, quantity } : item
  );

  saveCartToLocalStorage(updatedCart);
  return updatedCart;
};

/**
 * Clear cart in localStorage
 */
export const clearCart = (): void => {
  localStorage.removeItem("cart");
};

export const countCartItems = (): number => {
  const cart = getCartFromLocalStorage();
  return cart.reduce((count, item) => count + item.quantity, 0);
};

/**
 * Update order status (admin/staff only)
 *
 * @param {number} orderId - The order ID to update
 * @param {string} status - The new status
 * @returns {Promise<{success: boolean, message?: string, error?: string}>} - Promise with the result
 */
export const updateOrderStatus = async (
  orderId: number,
  status: string
): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // Get token for authentication
    const token = localStorage.getItem("token");

    if (!token) {
      return {
        success: false,
        error: "Authentication required",
      };
    }

    const response = await fetch(`${BASE_URL}/update_order_status.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        order_id: orderId,
        status,
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error updating order status:", error);
    return {
      success: false,
      error: "Failed to update order status",
    };
  }
};
