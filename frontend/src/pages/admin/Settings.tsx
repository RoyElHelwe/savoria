import { useState, useEffect } from 'react';

interface RestaurantSettings {
  restaurant_name: string;
  address: string;
  phone: string;
  email: string;
  opening_hours: {
    monday: { open: string; close: string; closed: boolean };
    tuesday: { open: string; close: string; closed: boolean };
    wednesday: { open: string; close: string; closed: boolean };
    thursday: { open: string; close: string; closed: boolean };
    friday: { open: string; close: string; closed: boolean };
    saturday: { open: string; close: string; closed: boolean };
    sunday: { open: string; close: string; closed: boolean };
  };
  social_media: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
  reservation_settings: {
    max_days_in_advance: number;
    min_hours_in_advance: number;
    time_slot_interval: number;
    default_reservation_duration: number;
  };
}

// API functions for settings management
const fetchSettings = async (): Promise<{ success: boolean; settings?: RestaurantSettings; error?: string }> => {
  const token = localStorage.getItem('token');
  try {
    const response = await fetch('http://localhost/savoria/backend/api/admin/settings/get_settings.php', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching settings:', error);
    return { success: false, error: 'Failed to fetch settings' };
  }
};

const updateSettings = async (
  settings: RestaurantSettings
): Promise<{ success: boolean; error?: string }> => {
  const token = localStorage.getItem('token');
  try {
    const response = await fetch('http://localhost/savoria/backend/api/admin/settings/update_settings.php', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(settings)
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error updating settings:', error);
    return { success: false, error: 'Failed to update settings' };
  }
};

// Default restaurant settings
const defaultSettings: RestaurantSettings = {
  restaurant_name: 'Savoria Restaurant',
  address: '123 Main Street, Cityville',
  phone: '(123) 456-7890',
  email: 'contact@savoria.com',
  opening_hours: {
    monday: { open: '11:00', close: '22:00', closed: false },
    tuesday: { open: '11:00', close: '22:00', closed: false },
    wednesday: { open: '11:00', close: '22:00', closed: false },
    thursday: { open: '11:00', close: '22:00', closed: false },
    friday: { open: '11:00', close: '23:00', closed: false },
    saturday: { open: '10:00', close: '23:00', closed: false },
    sunday: { open: '10:00', close: '22:00', closed: false }
  },
  social_media: {
    facebook: 'https://facebook.com/savoria',
    instagram: 'https://instagram.com/savoria',
    twitter: 'https://twitter.com/savoria'
  },
  reservation_settings: {
    max_days_in_advance: 30,
    min_hours_in_advance: 2,
    time_slot_interval: 30,
    default_reservation_duration: 90
  }
};

const Settings = () => {
  const [settings, setSettings] = useState<RestaurantSettings>(defaultSettings);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('general');

  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      
      try {
        const response = await fetchSettings();
        
        if (response.success && response.settings) {
          setSettings(response.settings);
        } else if (response.error) {
          setError(response.error);
        }
      } catch (err) {
        setError('An error occurred while loading settings');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    loadSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(null);
    setError(null);
    
    try {
      const response = await updateSettings(settings);
      
      if (response.success) {
        setSuccess('Settings updated successfully');
      } else {
        setError(response.error || 'Failed to update settings');
      }
    } catch (err) {
      setError('An error occurred while saving settings');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // General settings input handler
  const handleGeneralChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  // Social media input handler
  const handleSocialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      social_media: {
        ...prev.social_media,
        [name]: value
      }
    }));
  };

  // Reservation settings input handler
  const handleReservationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseInt(value, 10);
    
    if (!isNaN(numValue)) {
      setSettings(prev => ({
        ...prev,
        reservation_settings: {
          ...prev.reservation_settings,
          [name]: numValue
        }
      }));
    }
  };

  // Hours input handler
  const handleHoursChange = (
    day: keyof RestaurantSettings['opening_hours'], 
    field: 'open' | 'close' | 'closed', 
    value: string | boolean
  ) => {
    setSettings(prev => ({
      ...prev,
      opening_hours: {
        ...prev.opening_hours,
        [day]: {
          ...prev.opening_hours[day],
          [field]: value
        }
      }
    }));
  };

  if (loading) {
    return <div className="p-4">Loading settings...</div>;
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-6">Restaurant Settings</h1>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
          {success}
        </div>
      )}
      
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              className={`py-2 px-4 font-medium text-sm border-b-2 ${
                activeTab === 'general' 
                  ? 'border-amber-500 text-amber-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('general')}
            >
              General
            </button>
            <button
              className={`py-2 px-4 font-medium text-sm border-b-2 ${
                activeTab === 'hours' 
                  ? 'border-amber-500 text-amber-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('hours')}
            >
              Business Hours
            </button>
            <button
              className={`py-2 px-4 font-medium text-sm border-b-2 ${
                activeTab === 'reservation' 
                  ? 'border-amber-500 text-amber-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('reservation')}
            >
              Reservations
            </button>
            <button
              className={`py-2 px-4 font-medium text-sm border-b-2 ${
                activeTab === 'social' 
                  ? 'border-amber-500 text-amber-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('social')}
            >
              Social Media
            </button>
          </nav>
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        {/* General Settings */}
        {activeTab === 'general' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Restaurant Name
              </label>
              <input
                type="text"
                name="restaurant_name"
                value={settings.restaurant_name}
                onChange={handleGeneralChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <textarea
                name="address"
                value={settings.address}
                onChange={handleGeneralChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="text"
                  name="phone"
                  value={settings.phone}
                  onChange={handleGeneralChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={settings.email}
                  onChange={handleGeneralChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Business Hours */}
        {activeTab === 'hours' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 mb-4">
              Set your restaurant's opening hours for each day of the week.
            </p>
            
            {Object.entries(settings.opening_hours).map(([day, hours]) => (
              <div key={day} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center border-b pb-3">
                <div className="font-medium capitalize">{day}</div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={hours.closed}
                    onChange={(e) => handleHoursChange(day as keyof RestaurantSettings['opening_hours'], 'closed', e.target.checked)}
                    className="mr-2"
                  />
                  <label className="text-sm">Closed</label>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Open</label>
                  <input
                    type="time"
                    value={hours.open}
                    onChange={(e) => handleHoursChange(day as keyof RestaurantSettings['opening_hours'], 'open', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    disabled={hours.closed}
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Close</label>
                  <input
                    type="time"
                    value={hours.close}
                    onChange={(e) => handleHoursChange(day as keyof RestaurantSettings['opening_hours'], 'close', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    disabled={hours.closed}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Reservation Settings */}
        {activeTab === 'reservation' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 mb-4">
              Configure how reservations work in your restaurant.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum days in advance
                </label>
                <input
                  type="number"
                  name="max_days_in_advance"
                  value={settings.reservation_settings.max_days_in_advance}
                  onChange={handleReservationChange}
                  min="1"
                  max="90"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
                <p className="mt-1 text-sm text-gray-500">
                  How many days in advance customers can make reservations
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum hours in advance
                </label>
                <input
                  type="number"
                  name="min_hours_in_advance"
                  value={settings.reservation_settings.min_hours_in_advance}
                  onChange={handleReservationChange}
                  min="0"
                  max="48"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
                <p className="mt-1 text-sm text-gray-500">
                  How many hours before customers must make reservations
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time slot interval (minutes)
                </label>
                <input
                  type="number"
                  name="time_slot_interval"
                  value={settings.reservation_settings.time_slot_interval}
                  onChange={handleReservationChange}
                  min="15"
                  max="60"
                  step="15"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
                <p className="mt-1 text-sm text-gray-500">
                  Interval between reservation time slots (15, 30, 45, or 60 minutes)
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Default reservation duration (minutes)
                </label>
                <input
                  type="number"
                  name="default_reservation_duration"
                  value={settings.reservation_settings.default_reservation_duration}
                  onChange={handleReservationChange}
                  min="30"
                  max="240"
                  step="15"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
                <p className="mt-1 text-sm text-gray-500">
                  How long a typical reservation lasts
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Social Media */}
        {activeTab === 'social' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 mb-4">
              Add your social media profiles to help customers connect with you.
            </p>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Facebook Page URL
              </label>
              <input
                type="url"
                name="facebook"
                value={settings.social_media.facebook || ''}
                onChange={handleSocialChange}
                placeholder="https://facebook.com/yourrestaurant"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Instagram Profile URL
              </label>
              <input
                type="url"
                name="instagram"
                value={settings.social_media.instagram || ''}
                onChange={handleSocialChange}
                placeholder="https://instagram.com/yourrestaurant"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Twitter Profile URL
              </label>
              <input
                type="url"
                name="twitter"
                value={settings.social_media.twitter || ''}
                onChange={handleSocialChange}
                placeholder="https://twitter.com/yourrestaurant"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        )}
        
        <div className="mt-6">
          <button
            type="submit"
            className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings; 