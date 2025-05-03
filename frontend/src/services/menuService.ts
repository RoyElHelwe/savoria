import { MenuItem, SpiceLevel } from '../components/MenuCard';

/**
 * Menu Service
 * 
 * Handles all API calls related to the restaurant menu
 */

const BASE_URL = 'http://localhost/savoria/backend/api/menu';

export interface Category {
  id: number;
  name: string;
  description?: string;
  image_url?: string;
  display_order: number;
}

export interface MenuResponse {
  success: boolean;
  menu: {
    id: number;
    name: string;
    items: MenuItem[];
  }[];
  error?: string;
}

export interface CategoryResponse {
  success: boolean;
  categories: Category[];
  error?: string;
}

export interface MenuItemResponse {
  success: boolean;
  item?: MenuItem;
  error?: string;
}

export interface MenuSearchResponse {
  success: boolean;
  results: MenuItem[];
  error?: string;
}

export interface MenuFilterParams {
  is_vegetarian?: boolean;
  is_vegan?: boolean;
  is_gluten_free?: boolean;
  contains_nuts?: boolean;
  spice_level?: SpiceLevel;
}

/**
 * Fetch all menu items, optionally filtered by category
 * 
 * @param {number} categoryId - Optional category ID to filter by
 * @param {boolean} featuredOnly - Optional flag to get only featured items
 * @returns {Promise<MenuResponse>} - Promise resolving to menu data
 */
export const getMenu = async (categoryId?: number, featuredOnly = false): Promise<MenuResponse> => {
  try {
    let url = `${BASE_URL}/get_menu.php`;
    const params = new URLSearchParams();
    
    if (categoryId) {
      params.append('category_id', categoryId.toString());
    }
    
    if (featuredOnly) {
      params.append('featured', 'true');
    }
    
    // Add query parameters if there are any
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const response = await fetch(url);
    const data = await response.json();
    
    return data;
  } catch (error) {
    console.error('Error fetching menu:', error);
    return {
      success: false,
      menu: [],
      error: 'Failed to fetch menu'
    };
  }
};

/**
 * Fetch menu categories
 * 
 * @returns {Promise<CategoryResponse>} - Promise resolving to categories data
 */
export const getCategories = async (): Promise<CategoryResponse> => {
  try {
    const response = await fetch(`${BASE_URL}/get_categories.php`);
    const data = await response.json();
    
    return data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return {
      success: false,
      categories: [],
      error: 'Failed to fetch categories'
    };
  }
};

/**
 * Fetch a single menu item by ID
 * 
 * @param {number} itemId - Menu item ID
 * @returns {Promise<MenuItemResponse>} - Promise resolving to menu item data
 */
export const getMenuItem = async (itemId: number): Promise<MenuItemResponse> => {
  try {
    const response = await fetch(`${BASE_URL}/get_item.php?id=${itemId}`);
    const data = await response.json();
    
    return data;
  } catch (error) {
    console.error(`Error fetching menu item ${itemId}:`, error);
    return {
      success: false,
      error: 'Failed to fetch menu item'
    };
  }
};

/**
 * Search menu items by name or description
 * 
 * @param {string} query - Search query
 * @returns {Promise<MenuSearchResponse>} - Promise resolving to search results
 */
export const searchMenu = async (query: string): Promise<MenuSearchResponse> => {
  try {
    const response = await fetch(`${BASE_URL}/search.php?q=${encodeURIComponent(query)}`);
    const data = await response.json();
    
    return data;
  } catch (error) {
    console.error('Error searching menu:', error);
    return {
      success: false,
      results: [],
      error: 'Failed to search menu'
    };
  }
};

/**
 * Filter menu items by dietary preferences
 * 
 * @param {MenuFilterParams} filters - Dietary filters (e.g., {is_vegetarian: true, is_gluten_free: true})
 * @returns {Promise<MenuResponse>} - Promise resolving to filtered menu items
 */
export const filterMenu = async (filters: MenuFilterParams): Promise<MenuResponse> => {
  try {
    // Build query parameters
    const params = new URLSearchParams();
    
    if (filters.is_vegetarian) {
      params.append('is_vegetarian', 'true');
    }
    
    if (filters.is_vegan) {
      params.append('is_vegan', 'true');
    }
    
    if (filters.is_gluten_free) {
      params.append('is_gluten_free', 'true');
    }
    
    if (filters.contains_nuts === false) {
      params.append('contains_nuts', 'false');
    }
    
    if (filters.spice_level !== undefined) {
      params.append('spice_level', filters.spice_level.toString());
    }
    
    const response = await fetch(`${BASE_URL}/filter.php?${params.toString()}`);
    const data = await response.json();
    
    return data;
  } catch (error) {
    console.error('Error filtering menu:', error);
    return {
      success: false,
      menu: [],
      error: 'Failed to filter menu'
    };
  }
};
