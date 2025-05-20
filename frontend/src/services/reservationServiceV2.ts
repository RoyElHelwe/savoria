import axios from 'axios';
import { API_BASE_URL } from '../config';

export interface Reservation {
  id: number;
  date: string;
  time: string;
  name: string;
  email: string;
  phone: string;
  guests: number;
  special_requests: string | null;
  status: 'pending' | 'confirmed' | 'cancelled';
  user_id: number | null;
  created_at: string;
  updated_at: string;
  can_be_cancelled: boolean;
}

export interface Pagination {
  current_page: number;
  per_page: number;
  total_items: number;
  total_pages: number;
}

export interface GetReservationsResponse {
  success: boolean;
  reservations: Reservation[];
  pagination: Pagination;
  error?: string;
}

export interface CancelReservationResponse {
  success: boolean;
  message?: string;
  reservation_id?: number;
  error?: string;
}

/**
 * Get user's reservations with pagination and optional filtering
 */
export const getUserReservations = async (
  page: number = 1,
  limit: number = 10,
  status?: string,
  upcoming: boolean = false
): Promise<GetReservationsResponse> => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    // Build query parameters
    const params: Record<string, string | number | boolean> = { page, limit };
    if (status) params.status = status;
    if (upcoming) params.upcoming = upcoming;
    
    const response = await axios.get(`${API_BASE_URL}/user/get_user_reservations.php`, {
      params,
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    if (response.data.success) {
      return response.data;
    } else {
      throw new Error(response.data.error || 'Failed to fetch reservations');
    }
  } catch (error) {
    console.error('Error fetching user reservations:', error);
    
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || 'Failed to fetch reservations');
    }
    
    throw new Error('An error occurred while fetching reservations');
  }
};

/**
 * Cancel a reservation
 */
export const cancelReservation = async (
  reservationId: number,
  reason?: string
): Promise<CancelReservationResponse> => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await axios.post(
      `${API_BASE_URL}/user/cancel_reservation.php`,
      { reservation_id: reservationId, reason },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data.success) {
      return response.data;
    } else {
      throw new Error(response.data.error || 'Failed to cancel reservation');
    }
  } catch (error) {
    console.error('Error cancelling reservation:', error);
    
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || 'Failed to cancel reservation');
    }
    
    throw new Error('An error occurred while cancelling reservation');
  }
};

/**
 * Make a new reservation
 */
export const makeReservation = async (
  reservationData: {
    date: string;
    time: string;
    guests: number;
    name: string;
    email: string;
    phone: string;
    special_requests?: string;
  }
): Promise<any> => {
  try {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await axios.post(
      `${API_BASE_URL}/reservations/make_reservation.php`,
      reservationData,
      { headers }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error making reservation:', error);
    
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || 'Failed to make reservation');
    }
    
    throw new Error('An error occurred while making reservation');
  }
};

/**
 * Get reservation status info (label and color)
 */
export const getReservationStatusInfo = (status: string): { label: string; color: string } => {
  switch (status) {
    case 'pending':
      return { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' };
    case 'confirmed':
      return { label: 'Confirmed', color: 'bg-green-100 text-green-800' };
    case 'cancelled':
      return { label: 'Cancelled', color: 'bg-red-100 text-red-800' };
    default:
      return { label: status.charAt(0).toUpperCase() + status.slice(1), color: 'bg-gray-100 text-gray-800' };
  }
};

/**
 * Check if reservation date is in the past
 */
export const isReservationInPast = (date: string, time: string): boolean => {
  const reservationDateTime = new Date(`${date}T${time}`);
  const now = new Date();
  return reservationDateTime < now;
};

/**
 * Format date and time for display
 */
export const formatReservationDateTime = (date: string, time: string): string => {
  try {
    const dateObj = new Date(`${date}T${time}`);
    
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(dateObj);
  } catch (error) {
    console.error('Error formatting reservation date time:', error);
    return `${date} at ${time}`;
  }
};