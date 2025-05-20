/**
 * Staff Service
 * 
 * Handles all API calls related to staff operations
 */

const BASE_URL = 'http://localhost/savoria/backend/api/staff';

// Types for dashboard
export interface DashboardSummary {
  reservations: {
    total: number;
    confirmed: number;
    pending: number;
    cancelled: number;
  };
  orders: {
    total: number;
    active: number;
    completed: number;
    cancelled: number;
  };
  tables: {
    total: number;
    available: number;
  };
  recent_activity: {
    type: string;
    description: string;
    timestamp: string;
  }[];
}

export interface DashboardSummaryResponse {
  success: boolean;
  data?: DashboardSummary;
  error?: string;
}

// Types for reservations
export interface TodayReservation {
  id: number;
  date: string;
  time: string;
  name: string;
  email: string;
  phone: string;
  guests: number;
  special_requests: string | null;
  status: string;
  user_id: number | null;
  username: string | null;
  created_at: string;
  updated_at: string;
}

export interface TodayReservationsResponse {
  success: boolean;
  reservations: TodayReservation[];
  error?: string;
}

// Types for orders
export interface ActiveOrder {
  id: number;
  user_id: number | null;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  status: string;
  total_amount: number;
  payment_method: string | null;
  payment_status: string;
  delivery_address: string | null;
  delivery_time: string | null;
  special_instructions: string | null;
  item_count: number;
  created_at: string;
  updated_at: string;
}

export interface ActiveOrdersResponse {
  success: boolean;
  orders: ActiveOrder[];
  error?: string;
}

// Types for customer search
export interface Customer {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  address: string | null;
  role: string;
  created_at: string;
  reservations: {
    total: number;
    confirmed: number;
    pending: number;
  };
  orders: {
    total: number;
    active: number;
    completed: number;
  };
}

export interface CustomersResponse {
  success: boolean;
  customers: Customer[];
  error?: string;
}

// Types for daily reports
export interface DailyReport {
  date: string;
  reservations: {
    total: number;
    confirmed: number;
    pending: number;
    cancelled: number;
    completed: number;
    total_guests: number;
  };
  orders: {
    total: number;
    active: number;
    completed: number;
    cancelled: number;
    total_sales: number;
  };
  hourly_breakdown: {
    hour: number;
    reservation_count: number;
  }[];
  popular_items: {
    id: number;
    name: string;
    price: number;
    order_count: number;
  }[];
}

export interface DailyReportResponse {
  success: boolean;
  data?: DailyReport;
  error?: string;
}

/**
 * Get dashboard summary for staff
 * 
 * @returns Promise resolving to dashboard summary
 */
export const getDashboardSummary = async (): Promise<DashboardSummaryResponse> => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      return {
        success: false,
        error: 'User not authenticated'
      };
    }
    
    const response = await fetch(`${BASE_URL}/dashboard/get_summary.php`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    return data;
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    return {
      success: false,
      error: 'Failed to fetch dashboard summary'
    };
  }
};

/**
 * Get today's reservations
 * 
 * @returns Promise resolving to today's reservations
 */
export const getTodayReservations = async (): Promise<TodayReservationsResponse> => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      return {
        success: false,
        reservations: [],
        error: 'User not authenticated'
      };
    }
    
    const response = await fetch(`${BASE_URL}/reservations/get_today_reservations.php`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    return data;
  } catch (error) {
    console.error('Error fetching today\'s reservations:', error);
    return {
      success: false,
      reservations: [],
      error: 'Failed to fetch today\'s reservations'
    };
  }
};

/**
 * Get active orders
 * 
 * @returns Promise resolving to active orders
 */
export const getActiveOrders = async (): Promise<ActiveOrdersResponse> => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      return {
        success: false,
        orders: [],
        error: 'User not authenticated'
      };
    }
    
    const response = await fetch(`${BASE_URL}/orders/get_active_orders.php`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    return data;
  } catch (error) {
    console.error('Error fetching active orders:', error);
    return {
      success: false,
      orders: [],
      error: 'Failed to fetch active orders'
    };
  }
};

/**
 * Search for customers
 * 
 * @param searchQuery - The search query
 * @returns Promise resolving to matching customers
 */
export const searchCustomers = async (searchQuery: string): Promise<CustomersResponse> => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      return {
        success: false,
        customers: [],
        error: 'User not authenticated'
      };
    }
    
    const response = await fetch(`${BASE_URL}/customers/search_customers.php?search=${encodeURIComponent(searchQuery)}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    return data;
  } catch (error) {
    console.error('Error searching customers:', error);
    return {
      success: false,
      customers: [],
      error: 'Failed to search customers'
    };
  }
};

/**
 * Get daily reports
 * 
 * @param date - The date to get reports for (YYYY-MM-DD)
 * @returns Promise resolving to daily reports
 */
export const getDailyReport = async (date: string): Promise<DailyReportResponse> => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      return {
        success: false,
        error: 'User not authenticated'
      };
    }
    
    const response = await fetch(`${BASE_URL}/dashboard/get_daily_reports.php?date=${date}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    return data;
  } catch (error) {
    console.error('Error fetching daily report:', error);
    return {
      success: false,
      error: 'Failed to fetch daily report'
    };
  }
}; 