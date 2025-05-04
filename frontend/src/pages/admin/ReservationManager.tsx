import { useState, useEffect } from 'react';
import { getAllReservations, cancelReservation } from '../../services/reservationService';

interface Reservation {
  id: number;
  user_id: number;
  table_id: number;
  date: string;
  time_slot: string;
  guest_count: number;
  status: 'confirmed' | 'cancelled' | 'completed';
  special_request?: string;
  created_at: string;
  user: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
  table?: {
    table_number: number;
    capacity: number;
    location: string;
  };
}

interface ReservationFilter {
  date?: string;
  status?: 'confirmed' | 'cancelled' | 'completed' | 'all';
}

const ReservationManager = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [filter, setFilter] = useState<ReservationFilter>({
    date: new Date().toISOString().split('T')[0],
    status: 'confirmed'
  });

  useEffect(() => {
    const loadReservations = async () => {
      setLoading(true);
      
      try {
        const response = await getAllReservations();
        
        if (response.success) {
          setReservations(response.reservations);
          applyFilters(response.reservations);
        } else {
          setError(response.error || 'Failed to load reservations');
        }
      } catch (err) {
        setError('An error occurred while loading reservations');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    loadReservations();
  }, []);

  useEffect(() => {
    applyFilters(reservations);
  }, [filter, reservations]);

  const applyFilters = (reservationList: Reservation[]) => {
    let filtered = [...reservationList];
    
    // Filter by date
    if (filter.date) {
      filtered = filtered.filter(reservation => 
        reservation.date === filter.date
      );
    }
    
    // Filter by status
    if (filter.status && filter.status !== 'all') {
      filtered = filtered.filter(reservation => 
        reservation.status === filter.status
      );
    }
    
    setFilteredReservations(filtered);
  };

  const handleFilterChange = (name: keyof ReservationFilter, value: string) => {
    setFilter(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCancelReservation = async (id: number) => {
    if (window.confirm('Are you sure you want to cancel this reservation?')) {
      setLoading(true);
      
      try {
        const response = await cancelReservation(id);
        
        if (response.success) {
          // Update the reservation status in the local state
          setReservations(prev => 
            prev.map(reservation => 
              reservation.id === id 
                ? { ...reservation, status: 'cancelled' } 
                : reservation
            )
          );
          
          // Close modal if the cancelled reservation is currently selected
          if (selectedReservation?.id === id) {
            setSelectedReservation(null);
          }
        } else {
          setError(response.error || 'Failed to cancel reservation');
        }
      } catch (err) {
        setError('An error occurred while cancelling reservation');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  const getStatusBadgeClass = (status: Reservation['status']) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (timeSlot: string) => {
    return timeSlot.replace(':00', '');
  };

  if (loading && reservations.length === 0) {
    return <div className="p-4">Loading reservations...</div>;
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-6">Reservation Management</h1>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input
            type="date"
            value={filter.date || ''}
            onChange={(e) => handleFilterChange('date', e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={filter.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
          >
            <option value="all">All</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Table</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guests</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredReservations.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                  No reservations found for the selected filters.
                </td>
              </tr>
            ) : (
              filteredReservations.map(reservation => (
                <tr key={reservation.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {reservation.user.first_name} {reservation.user.last_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {reservation.user.phone || reservation.user.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(reservation.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatTime(reservation.time_slot)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {reservation.table ? `#${reservation.table.table_number} (${reservation.table.location})` : 'Not assigned'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {reservation.guest_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(reservation.status)}`}>
                      {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => setSelectedReservation(reservation)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      View
                    </button>
                    
                    {reservation.status === 'confirmed' && (
                      <button
                        onClick={() => handleCancelReservation(reservation.id)}
                        className="text-red-600 hover:text-red-900"
                        disabled={loading}
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Reservation details modal */}
      {selectedReservation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h2 className="text-xl font-semibold mb-4">Reservation Details</h2>
            
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Guest</h3>
                <p>{selectedReservation.user.first_name} {selectedReservation.user.last_name}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Contact</h3>
                <p>{selectedReservation.user.phone || selectedReservation.user.email}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Date & Time</h3>
                <p>
                  {new Date(selectedReservation.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} 
                  {' at '} 
                  {formatTime(selectedReservation.time_slot)}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Table</h3>
                <p>
                  {selectedReservation.table 
                    ? `#${selectedReservation.table.table_number} (${selectedReservation.table.location}, Capacity: ${selectedReservation.table.capacity})` 
                    : 'Not assigned'}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Number of Guests</h3>
                <p>{selectedReservation.guest_count}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Status</h3>
                <p className="capitalize">{selectedReservation.status}</p>
              </div>
              
              {selectedReservation.special_request && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Special Request</h3>
                  <p className="text-sm">{selectedReservation.special_request}</p>
                </div>
              )}
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Booked On</h3>
                <p>{new Date(selectedReservation.created_at).toLocaleString()}</p>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              {selectedReservation.status === 'confirmed' && (
                <button
                  onClick={() => handleCancelReservation(selectedReservation.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  disabled={loading}
                >
                  Cancel Reservation
                </button>
              )}
              
              <button
                onClick={() => setSelectedReservation(null)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReservationManager; 