import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import * as authService from '../services/authService';

export type UserRole = 'customer' | 'staff' | 'manager' | 'admin';

export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  first_name: string;
  last_name: string;
  phone?: string;
  address?: string;
}

export interface AuthResponse {
  success: boolean;
  error?: string;
}

export interface LoginCredentials {
  login: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  address?: string;
}

export interface ProfileUpdateData {
  first_name?: string;
  last_name?: string;
  phone?: string;
  address?: string;
  email?: string;
  password?: string;
  current_password?: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<AuthResponse>;
  register: (userData: RegisterData) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  hasRole: (requiredRoles: UserRole | UserRole[]) => boolean;
  updateProfile: (profileData: ProfileUpdateData) => Promise<AuthResponse>;
}

export interface AuthProviderProps {
  children: ReactNode;
}

// Create the context
const AuthContext = createContext<AuthContextType | null>(null);

// Create a custom hook for using the auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Provider component
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Initialize authentication state on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');

      if (token && userData) {
        try {
          // Parse the user data
          const parsedUser = JSON.parse(userData) as User;
          
          // Set the auth state
          setUser(parsedUser);
          setIsAuthenticated(true);
        } catch (err) {
          // If there's an error parsing user data, clear localStorage
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          console.error('Error parsing user data:', err);
        }
      }
      
      // Set loading to false once we've checked authentication
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authService.login(credentials);
      
      if (response.success) {
        // Get the user data from localStorage (the service saved it there)
        const userData = localStorage.getItem('user');
        if (userData) {
          const parsedUser = JSON.parse(userData) as User;
          setUser(parsedUser);
          setIsAuthenticated(true);
        }
      } else if (response.error) {
        setError(response.error);
      }
      
      setLoading(false);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  // Register function
  const register = async (userData: RegisterData): Promise<AuthResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authService.register(userData);
      
      if (!response.success && response.error) {
        setError(response.error);
      }
      
      setLoading(false);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    setLoading(true);
    
    try {
      await authService.logout();
      
      // Update auth state
      setUser(null);
      setIsAuthenticated(false);
      
      // Redirect to home page
      navigate('/');
    } catch (err) {
      console.error('Error during logout:', err);
    } finally {
      setLoading(false);
    }
  };

  // Check if user has a specific role
  const hasRole = (requiredRoles: UserRole | UserRole[]): boolean => {
    if (!isAuthenticated || !user) return false;
    
    // Convert to array if it's a single role
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    
    // Role hierarchy: admin > manager > staff > customer
    const roleValues: Record<UserRole, number> = {
      'admin': 4,
      'manager': 3,
      'staff': 2,
      'customer': 1
    };
    
    const userRoleValue = roleValues[user.role];
    
    return roles.some(role => {
      // Admin can do anything
      if (user.role === 'admin') return true;
      
      // Exact match
      if (user.role === role) return true;
      
      // Manager can do staff roles
      if (user.role === 'manager' && role === 'staff') return true;
      
      // To implement more complex role hierarchies
      return roleValues[user.role] >= roleValues[role];
    });
  };

  // Update user profile
  const updateProfile = async (profileData: ProfileUpdateData): Promise<AuthResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authService.updateProfile(profileData);
      
      if (response.success) {
        // Get the updated user data from localStorage
        const userData = localStorage.getItem('user');
        if (userData) {
          const parsedUser = JSON.parse(userData) as User;
          setUser(parsedUser);
        }
      } else if (response.error) {
        setError(response.error);
      }
      
      setLoading(false);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  // Context value
  const value: AuthContextType = {
    user,
    isAuthenticated,
    loading,
    error,
    login,
    register,
    logout,
    hasRole,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
