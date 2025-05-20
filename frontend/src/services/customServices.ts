import axios from 'axios';
import { API_BASE_URL } from '../config';

// Add this function to your existing staffService.ts file
export const getCustomerDetails = async (customerId: string | number) => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      return { success: false, error: 'No authentication token found' };
    }
    
    const response = await axios.get(`${API_BASE_URL}/staff/customers/get_customer_details.php`, {
      params: { id: customerId },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching customer details:', error);
    
    if (axios.isAxiosError(error) && error.response) {
      return { 
        success: false, 
        error: error.response.data.error || 'Failed to fetch customer details' 
      };
    }
    
    return { 
      success: false, 
      error: 'An error occurred while fetching customer details' 
    };
  }
};