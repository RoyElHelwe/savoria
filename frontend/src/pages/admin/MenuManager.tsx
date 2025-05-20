import { useState, useEffect, useRef } from 'react';
import { getMenu, getCategories, Category as ServiceCategory } from '../../services/menuService';

// Import the type from MenuCard but alias it to avoid confusion
import { MenuItem as MenuCardItem } from '../../components/MenuCard';

// Our admin menu item interface
interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category_id: number;
  image_url: string;
  is_available: boolean;
  is_featured: boolean;
}

interface Category {
  id: number;
  name: string;
  description: string;
}

// Admin API endpoints for menu management
const adminMenuApi = async (endpoint: string, method: string, data?: any) => {
  const token = localStorage.getItem('token');
  try {
    const response = await fetch(`http://localhost/savoria/backend/api/admin/menu/${endpoint}.php`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: data ? JSON.stringify(data) : undefined
    });
    return await response.json();
  } catch (error) {
    console.error(`Error with admin menu API (${endpoint}):`, error);
    return { success: false, error: 'API request failed' };
  }
};

// Image upload function
const uploadImage = async (file: File) => {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('image', file);
  
  try {
    const response = await fetch('http://localhost/savoria/backend/api/admin/upload_image.php', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    return await response.json();
  } catch (error) {
    console.error('Error uploading image:', error);
    return { success: false, error: 'Image upload failed' };
  }
};

// Admin menu service functions
const getAllMenuItems = async () => {
  const response = await getMenu();
  if (!response.success) {
    return { success: false, error: response.error, data: [] };
  }
  
  // Flatten menu items from categories
  const allItems: MenuItem[] = [];
  response.menu.forEach(category => {
    category.items.forEach((item: MenuCardItem) => {
      // Convert from MenuCard.MenuItem to our MenuItem type
      allItems.push({
        id: item.item_id, // Map item_id to id
        name: item.name,
        description: item.description,
        price: item.price,
        category_id: item.category_id,
        image_url: item.image_url || '',
        is_available: item.is_active !== false, // Map is_active to is_available
        is_featured: item.is_featured === true
      });
    });
  });
  
  return { success: true, data: allItems };
};

const updateMenuItem = async (id: number, item: MenuItem) => {
  return await adminMenuApi(`update_item`, 'PUT', item);
};

const addMenuItem = async (item: MenuItem) => {
  return await adminMenuApi(`add_item`, 'POST', item);
};

const deleteMenuItem = async (id: number) => {
  return await adminMenuApi(`delete_item`, 'DELETE', { id });
};

const getAllCategories = async () => {
  const response = await getCategories();
  
  // Convert from ServiceCategory to our Category type
  const convertedCategories: Category[] = response.categories.map(cat => ({
    id: cat.id,
    name: cat.name,
    description: cat.description || '' // Provide default value for possibly undefined description
  }));
  
  return { 
    success: response.success, 
    data: convertedCategories,
    error: response.error 
  };
};

const MenuManager = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form state for editing or adding
  const [formData, setFormData] = useState<Partial<MenuItem>>({
    name: '',
    description: '',
    price: 0,
    category_id: 0,
    image_url: '',
    is_available: true,
    is_featured: false
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [menuResponse, categoriesResponse] = await Promise.all([
          getAllMenuItems(),
          getAllCategories()
        ]);

        if (menuResponse.success) {
          setMenuItems(menuResponse.data);
        }

        if (categoriesResponse.success) {
          setCategories(categoriesResponse.data);
        }
      } catch (err) {
        setError('Failed to load menu data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSelectItem = (item: MenuItem) => {
    setSelectedItem(item);
    setFormData(item);
    setIsEditing(true);
    setIsAdding(false);
    setImagePreview(item.image_url || null);
    setUploadedImage(null);
  };

  const handleAddNew = () => {
    setSelectedItem(null);
    setFormData({
      name: '',
      description: '',
      price: 0,
      category_id: categories.length > 0 ? categories[0].id : 0,
      image_url: '',
      is_available: true,
      is_featured: false
    });
    setIsAdding(true);
    setIsEditing(false);
    setImagePreview(null);
    setUploadedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData({
        ...formData,
        [name]: checked
      });
    } else if (name === 'price') {
      setFormData({
        ...formData,
        [name]: parseFloat(value)
      });
    } else if (name === 'category_id') {
      setFormData({
        ...formData,
        [name]: parseInt(value, 10)
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageDelete = () => {
    setUploadedImage(null);
    setImagePreview(null);
    setFormData({
      ...formData,
      image_url: ''
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Step 1: Upload image if there's a new one
      let finalImageUrl = formData.image_url || '';
      
      if (uploadedImage) {
        setUploading(true);
        const uploadResponse = await uploadImage(uploadedImage);
        setUploading(false);
        
        if (uploadResponse.success) {
          finalImageUrl = uploadResponse.image_url;
        } else {
          setError(uploadResponse.error || 'Failed to upload image');
          setLoading(false);
          return;
        }
      }
      
      // Step 2: Update or add menu item with the image URL
      const itemData = {
        ...formData,
        image_url: finalImageUrl
      };
      
      if (isEditing && selectedItem) {
        // Update existing item
        const response = await updateMenuItem(selectedItem.id, itemData as MenuItem);
        
        if (response.success) {
          setMenuItems(prev => 
            prev.map(item => item.id === selectedItem.id ? { ...item, ...itemData } : item)
          );
          setSelectedItem(null);
          setIsEditing(false);
        } else {
          setError(response.error || 'Failed to update menu item');
        }
      } else if (isAdding) {
        // Add new item
        const response = await addMenuItem(itemData as MenuItem);
        
        if (response.success) {
          setMenuItems(prev => [...prev, response.data]);
          setIsAdding(false);
        } else {
          setError(response.error || 'Failed to add menu item');
        }
      }
    } catch (err) {
      setError('An error occurred while saving');
      console.error(err);
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this menu item?')) {
      setLoading(true);
      
      try {
        const response = await deleteMenuItem(id);
        
        if (response.success) {
          setMenuItems(prev => prev.filter(item => item.id !== id));
          if (selectedItem?.id === id) {
            setSelectedItem(null);
            setIsEditing(false);
          }
        } else {
          setError(response.error || 'Failed to delete menu item');
        }
      } catch (err) {
        setError('An error occurred while deleting');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCancel = () => {
    setSelectedItem(null);
    setIsEditing(false);
    setIsAdding(false);
    setError(null);
    setImagePreview(null);
    setUploadedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Find category name by id
  const getCategoryName = (categoryId: number) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Unknown';
  };

  if (loading && menuItems.length === 0) {
    return <div className="p-4">Loading menu data...</div>;
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Menu Management</h1>
        <button 
          onClick={handleAddNew}
          className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors"
        >
          Add New Item
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {(isEditing || isAdding) && (
        <div className="mb-6 p-4 border border-gray-200 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">
            {isEditing ? 'Edit Menu Item' : 'Add New Menu Item'}
          </h2>
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price || 0}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  name="category_id"
                  value={formData.category_id || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                <div className="flex items-center">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/jpeg, image/png, image/webp, image/gif"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  {(imagePreview || formData.image_url) && (
                    <button
                      type="button"
                      onClick={handleImageDelete}
                      className="ml-2 p-2 text-red-600 hover:text-red-900"
                      title="Remove image"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
                {/* Image Preview */}
                {imagePreview && (
                  <div className="mt-2">
                    <img 
                      src={"http://localhost/savoria/backend/api/public"+imagePreview} 
                      alt="Preview" 
                      className="h-24 w-auto object-cover rounded-md"
                    />
                    <p className="text-xs text-gray-500 mt-1">Image preview</p>
                  </div>
                )}
                {!imagePreview && formData.image_url && (
                  <div className="mt-2">
                    <img 
                      src={formData.image_url} 
                      alt="Current" 
                      className="h-24 w-auto object-cover rounded-md"
                    />
                    <p className="text-xs text-gray-500 mt-1">Current image</p>
                  </div>
                )}
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description || ''}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_available"
                    checked={formData.is_available}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Available</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_featured"
                    checked={formData.is_featured}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Featured</span>
                </label>
              </div>
            </div>
            
            <div className="mt-4 flex space-x-3">
              <button
                type="submit"
                className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors"
                disabled={loading || uploading}
              >
                {loading || uploading ? (uploading ? 'Uploading...' : 'Saving...') : 'Save'}
              </button>
              
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                disabled={loading || uploading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {menuItems.map(item => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  {item.image_url ? (
                    <img 
                      src={"http://localhost/savoria/backend/api/public"+item.image_url} 
                      alt={item.name} 
                      className="h-12 w-12 object-cover rounded-md"
                    />
                  ) : (
                    <div className="h-12 w-12 bg-gray-200 rounded-md flex items-center justify-center text-gray-400">
                      No img
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {item.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ${item.price.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {getCategoryName(item.category_id)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex space-x-2">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      item.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {item.is_available ? 'Available' : 'Unavailable'}
                    </span>
                    {item.is_featured && (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        Featured
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => handleSelectItem(item)}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MenuManager;