/**
 * Reservation Service
 * 
 * Handles all API calls related to restaurant reservations
 */

const BASE_URL = 'http://localhost/savoria/backend/api/reservation';

export interface Reservation {
  created_at: string;
  date: string;
  email: string;
  guests: number;
  id: number;
  name: string;
  phone: string;
  special_requests: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  time: string;
  updated_at: string;
  user_email: string | null;
  user_id: number | null;
  username: string | null;
}

export interface ReservationRequest {
  date: string;
  time: string;
  name: string;
  email: string;
  phone: string;
  guests: number;
  special_requests?: string;
  user_id?: number;
}

export interface ReservationResponse {
  success: boolean;
  reservation?: Reservation;
  error?: string;
}

export interface ReservationsResponse {
  success: boolean;
  reservations: Reservation[];
  error?: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface TimeSlotResponse {
  success: boolean;
  timeSlots: TimeSlot[];
  error?: string;
}

/**
 * Get all available time slots for a specific date
 * 
 * @param date - The date to check availability for (YYYY-MM-DD)
 * @returns Promise resolving to available time slots
 */
export const getAvailableTimeSlots = async (date: string): Promise<TimeSlotResponse> => {
  try {
    const response = await fetch(`${BASE_URL}/get_time_slots.php?date=${date}`);
    const data = await response.json();
    
    return data;
  } catch (error) {
    console.error(`Error fetching time slots for ${date}:`, error);
    return {
      success: false,
      timeSlots: [],
      error: 'Failed to fetch available time slots'
    };
  }
};

/**
 * Create a new reservation
 * 
 * @param reservationData - The reservation data
 * @returns Promise resolving to the created reservation
 */
export const createReservation = async (reservationData: ReservationRequest): Promise<ReservationResponse> => {
  try {
    // Get the token if the user is logged in
    const token = localStorage.getItem('token');
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${BASE_URL}/create_reservation.php`, {
      method: 'POST',
      headers,
      body: JSON.stringify(reservationData)
    });
    
    const data = await response.json();
    
    return data;
  } catch (error) {
    console.error('Error creating reservation:', error);
    return {
      success: false,
      error: 'Failed to create reservation'
    };
  }
};

/**
 * Get all reservations for a user
 * 
 * @param userId - The user ID
 * @returns Promise resolving to user's reservations
 */
export const getUserReservations = async (): Promise<ReservationsResponse> => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      return {
        success: false,
        reservations: [],
        error: 'User not authenticated'
      };
    }
    
    const response = await fetch(`${BASE_URL}/get_user_reservations.php`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    return data;
  } catch (error) {
    console.error('Error fetching user reservations:', error);
    return {
      success: false,
      reservations: [],
      error: 'Failed to fetch user reservations'
    };
  }
};

/**
 * Cancel a reservation
 * 
 * @param reservationId - The reservation ID to cancel
 * @returns Promise resolving to cancellation result
 */
export const cancelReservation = async (reservationId: number): Promise<ReservationResponse> => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      return {
        success: false,
        error: 'User not authenticated'
      };
    }
    
    const response = await fetch(`${BASE_URL}/cancel_reservation.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ reservation_id: reservationId })
    });
    
    const data = await response.json();
    
    return data;
  } catch (error) {
    console.error(`Error cancelling reservation ${reservationId}:`, error);
    return {
      success: false,
      error: 'Failed to cancel reservation'
    };
  }
};

/**
 * Get all reservations (admin only)
 * 
 * @returns Promise resolving to all reservations
 */
export const getAllReservations = async (): Promise<ReservationsResponse> => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      return {
        success: false,
        reservations: [],
        error: 'User not authenticated'
      };
    }
    
    const response = await fetch(`${BASE_URL}/get_all_reservations.php`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    return data;
  } catch (error) {
    console.error('Error fetching all reservations:', error);
    return {
      success: false,
      reservations: [],
      error: 'Failed to fetch reservations'
    };
  }
};

/**
 * Confirms a reservation
 * 
 * @param reservationId - The reservation ID to confirm
 * @returns Promise resolving to confirmation result
 */
export const confirmReservation = async (reservationId: number): Promise<ReservationResponse> => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      return {
        success: false,
        error: 'User not authenticated'
      };
    }
    
    const response = await fetch(`${BASE_URL}/update_reservation_status.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ 
        reservation_id: reservationId,
        status: 'confirmed',
        send_notification: true
      })
    });
    
    const data = await response.json();
    
    return data;
  } catch (error) {
    console.error(`Error confirming reservation ${reservationId}:`, error);
    return {
      success: false,
      error: 'Failed to confirm reservation'
    };
  }
};

/**
 * Rejects a reservation
 * 
 * @param reservationId - The reservation ID to reject
 * @returns Promise resolving to rejection result
 */
export const rejectReservation = async (reservationId: number): Promise<ReservationResponse> => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      return {
        success: false,
        error: 'User not authenticated'
      };
    }
    
    const response = await fetch(`${BASE_URL}/update_reservation_status.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ 
        reservation_id: reservationId,
        status: 'cancelled',
        rejection_reason: 'Rejected by administrator',
        send_notification: true
      })
    });
    
    const data = await response.json();
    
    return data;
  } catch (error) {
    console.error(`Error rejecting reservation ${reservationId}:`, error);
    return {
      success: false,
      error: 'Failed to reject reservation'
    };
  }
};
