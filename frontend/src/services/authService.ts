import { 
  LoginCredentials, 
  RegisterData, 
  AuthResponse, 
  User,
  ProfileUpdateData 
} from '../contexts/AuthContext';

const BASE_URL = 'http://localhost/savoria/backend/api/auth';

/**
 * Login a user
 * @param credentials - The login credentials
 * @returns - The authentication response
 */
export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${BASE_URL}/login.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    });
    
    const data = await response.json();
    
    if (data.success && data.user) {
      // Save to localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    
    return data;
  } catch (error) {
    console.error('Error during login:', error);
    return { 
      success: false, 
      error: 'Network error or server unavailable. Please try again later.' 
    };
  }
};

/**
 * Register a new user
 * @param userData - The user data for registration
 * @returns - The authentication response
 */
export const register = async (userData: RegisterData): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${BASE_URL}/register.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    
    const data = await response.json();
    
    return data;
  } catch (error) {
    console.error('Error during registration:', error);
    return { 
      success: false, 
      error: 'Network error or server unavailable. Please try again later.' 
    };
  }
};

/**
 * Logout the current user
 */
export const logout = async (): Promise<void> => {
  try {
    // Get the token
    const token = localStorage.getItem('token');
    
    if (token) {
      // Call the logout endpoint
      await fetch(`${BASE_URL}/logout.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
    }
    
    // Always clear localStorage, even if the API call fails
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  } catch (error) {
    console.error('Error during logout:', error);
    // Still clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

/**
 * Update user profile
 * @param profileData - The profile data to update
 * @returns - The authentication response
 */
export const updateProfile = async (profileData: ProfileUpdateData): Promise<AuthResponse> => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      return { 
        success: false, 
        error: 'User not authenticated' 
      };
    }
    
    const response = await fetch(`${BASE_URL}/update_profile.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(profileData)
    });
    
    const data = await response.json();
    
    if (data.success && data.user) {
      // Update in localStorage
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    
    return data;
  } catch (error) {
    console.error('Error updating profile:', error);
    return { 
      success: false, 
      error: 'Network error or server unavailable. Please try again later.' 
    };
  }
};    