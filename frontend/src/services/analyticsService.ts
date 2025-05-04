// API service for analytics data
const API_BASE_URL = 'http://localhost/savoria/backend/api/admin/analytics';

// Helper function for API requests
const fetchWithAuth = async (endpoint: string, params: Record<string, string> = {}) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('Authentication required');
  }

  // Build URL with query parameters
  const url = new URL(`${API_BASE_URL}/${endpoint}.php`);
  Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
  
  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'API request failed');
    }
    
    return data;
  } catch (error) {
    console.error(`Error fetching analytics data from ${endpoint}:`, error);
    throw error;
  }
};

// Get sales data
export const getSalesData = async (timeframe: 'week' | 'month' | 'year' = 'week') => {
  return fetchWithAuth('get_sales_data', { timeframe });
};

// Get reservation data
export const getReservationData = async (timeframe: 'week' | 'month' | 'year' = 'week') => {
  return fetchWithAuth('get_reservation_data', { timeframe });
};

// Get popular menu items
export const getPopularItems = async (
  timeframe: 'week' | 'month' | 'year' = 'month',
  limit: number = 5
) => {
  return fetchWithAuth('get_popular_items', { 
    timeframe, 
    limit: limit.toString() 
  });
};

// Get user growth data
export const getUserGrowth = async (timeframe: 'week' | 'month' | 'year' = 'year') => {
  return fetchWithAuth('get_user_growth', { timeframe });
}; 