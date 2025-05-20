import axios from 'axios';
import { API_BASE_URL } from '../config';

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  address: string | null;
  role: 'customer' | 'staff' | 'manager' | 'admin';
  created_at: string;
  updated_at: string;
  stats?: {
    total_orders: number;
    total_reservations: number;
  };
}

export interface ProfileUpdateData {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  address?: string;
}

/**
 * Fetch user profile from API
 */
export const getProfile = async (): Promise<UserProfile> => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await axios.get(`${API_BASE_URL}/user/get_profile.php`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    if (response.data.success) {
      return response.data.profile;
    } else {
      throw new Error(response.data.error || 'Failed to fetch profile');
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
    
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || 'Failed to fetch profile');
    }
    
    throw new Error('An error occurred while fetching profile');
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (profileData: ProfileUpdateData): Promise<UserProfile> => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await axios.post(`${API_BASE_URL}/user/update_profile.php`, profileData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data.success) {
      return response.data.profile;
    } else {
      throw new Error(response.data.error || 'Failed to update profile');
    }
  } catch (error) {
    console.error('Error updating profile:', error);
    
    if (axios.isAxiosError(error) && error.response) {
      const errorMessage = error.response.data.error || 'Failed to update profile';
      const errorDetails = error.response.data.details || [];
      
      if (errorDetails.length > 0) {
        throw new Error(`${errorMessage}: ${errorDetails.join(', ')}`);
      }
      
      throw new Error(errorMessage);
    }
    
    throw new Error('An error occurred while updating profile');
  }
};

/**
 * Update user password
 */
export const updatePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await axios.post(
      `${API_BASE_URL}/user/update_password.php`,
      { current_password: currentPassword, new_password: newPassword },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data.success;
  } catch (error) {
    console.error('Error updating password:', error);
    
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || 'Failed to update password');
    }
    
    throw new Error('An error occurred while updating password');
  }
};