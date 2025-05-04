import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Settings types
export interface OpeningHours {
  monday: { open: string; close: string; closed: boolean };
  tuesday: { open: string; close: string; closed: boolean };
  wednesday: { open: string; close: string; closed: boolean };
  thursday: { open: string; close: string; closed: boolean };
  friday: { open: string; close: string; closed: boolean };
  saturday: { open: string; close: string; closed: boolean };
  sunday: { open: string; close: string; closed: boolean };
}

export interface SocialMedia {
  facebook: string;
  instagram: string;
  twitter: string;
}

export interface ReservationSettings {
  max_days_in_advance: number;
  min_hours_in_advance: number;
  time_slot_interval: number;
  default_reservation_duration: number;
}

export interface RestaurantSettings {
  restaurant_name: string;
  address: string;
  phone: string;
  email: string;
  opening_hours: OpeningHours;
  social_media: SocialMedia;
  reservation_settings: ReservationSettings;
}

// Default settings
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

interface SettingsContextType {
  settings: RestaurantSettings;
  loading: boolean;
  error: string | null;
  refreshSettings: () => Promise<void>;
}

// Create the context
const SettingsContext = createContext<SettingsContextType | null>(null);

// Create a custom hook for using the settings context
export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<RestaurantSettings>(defaultSettings);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost/savoria/backend/api/settings/get_settings.php');
      
      if (!response.ok) {
        throw new Error(`Error fetching settings: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.settings) {
        setSettings(data.settings);
      } else {
        console.warn('Using default settings due to API error', data.error || 'Unknown error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred fetching settings');
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  const refreshSettings = async () => {
    await fetchSettings();
  };

  return (
    <SettingsContext.Provider value={{ settings, loading, error, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}; 