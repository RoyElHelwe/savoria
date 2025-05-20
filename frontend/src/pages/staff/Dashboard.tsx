import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { 
  getDashboardSummary, 
  getTodayReservations, 
  getActiveOrders,
  searchCustomers,
  getDailyReport 
} from "../../services/staffService";

const StaffDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("overview");
  
  // Dashboard data states
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Overview data
  const [reservationStats, setReservationStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    cancelled: 0
  });
  const [orderStats, setOrderStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    cancelled: 0
  });
  const [tableStats, setTableStats] = useState({
    total: 0,
    available: 0
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  
  // Reservations data
  const [todayReservations, setTodayReservations] = useState<any[]>([]);
  
  // Orders data
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  
  // Customer search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [customers, setCustomers] = useState<any[]>([]);
  const [searchPerformed, setSearchPerformed] = useState<boolean>(false);
  
  // Reports data
  const [reportDate, setReportDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState<any | null>(null);

  // Load dashboard summary data
  useEffect(() => {
    if (activeTab === "overview") {
      loadDashboardSummary();
    }
  }, [activeTab]);

  // Load tab-specific data
  useEffect(() => {
    if (activeTab === "reservations") {
      loadTodayReservations();
    } else if (activeTab === "orders") {
      loadActiveOrders();
    } else if (activeTab === "reports") {
      loadReportData(reportDate);
    }
  }, [activeTab, reportDate]);

  // Load dashboard summary data
  const loadDashboardSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getDashboardSummary();
      if (response.success && response.data) {
        setReservationStats(response.data.reservations);
        setOrderStats(response.data.orders);
        setTableStats(response.data.tables);
        setRecentActivity(response.data.recent_activity || []);
      } else {
        setError(response.error || "Failed to load dashboard data");
      }
    } catch (err) {
      setError("An error occurred while loading dashboard data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Load today's reservations
  const loadTodayReservations = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getTodayReservations();
      if (response.success) {
        setTodayReservations(response.reservations || []);
      } else {
        setError(response.error || "Failed to load today's reservations");
      }
    } catch (err) {
      setError("An error occurred while loading reservations");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Load active orders
  const loadActiveOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getActiveOrders();
      if (response.success) {
        setActiveOrders(response.orders || []);
      } else {
        setError(response.error || "Failed to load active orders");
      }
    } catch (err) {
      setError("An error occurred while loading orders");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle customer search
  const handleCustomerSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setError(null);
    setSearchPerformed(true);
    
    try {
      const response = await searchCustomers(searchQuery);
      if (response.success) {
        setCustomers(response.customers || []);
      } else {
        setError(response.error || "Failed to search customers");
        setCustomers([]);
      }
    } catch (err) {
      setError("An error occurred while searching customers");
      setCustomers([]);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Load report data
  const loadReportData = async (date: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getDailyReport(date);
      if (response.success && response.data) {
        setReportData(response.data);
      } else {
        setError(response.error || "Failed to load report data");
        setReportData(null);
      }
    } catch (err) {
      setError("An error occurred while loading report data");
      setReportData(null);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Format time from 24-hour to 12-hour format
  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  // Format timestamp (relative time like "15 minutes ago")
  const formatRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds} seconds ago`;
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  // Reservation action handlers
  const handleConfirmReservation = async (reservationId: number) => {
    setLoading(true);
    try {
      // Replace with your actual API call
      const response = await fetch(`http://localhost/savoria/backend/api/staff/reservations/update_status.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          reservation_id: reservationId,
          status: 'confirmed'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update the local state to reflect the change
        setTodayReservations(prev => 
          prev.map(res => 
            res.id === reservationId ? {...res, status: 'confirmed'} : res
          )
        );
      } else {
        setError(data.error || 'Failed to confirm reservation');
      }
    } catch (err) {
      console.error('Error confirming reservation:', err);
      setError('An error occurred while confirming the reservation');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectReservation = async (reservationId: number) => {
    setLoading(true);
    try {
      // Replace with your actual API call
      const response = await fetch(`http://localhost/savoria/backend/api/staff/reservations/update_status.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          reservation_id: reservationId,
          status: 'cancelled'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update the local state to reflect the change
        setTodayReservations(prev => 
          prev.map(res => 
            res.id === reservationId ? {...res, status: 'cancelled'} : res
          )
        );
      } else {
        setError(data.error || 'Failed to reject reservation');
      }
    } catch (err) {
      console.error('Error rejecting reservation:', err);
      setError('An error occurred while rejecting the reservation');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReservation = async (reservationId: number) => {
    setLoading(true);
    try {
      // Replace with your actual API call
      const response = await fetch(`http://localhost/savoria/backend/api/staff/reservations/update_status.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          reservation_id: reservationId,
          status: 'cancelled'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update the local state to reflect the change
        setTodayReservations(prev => 
          prev.map(res => 
            res.id === reservationId ? {...res, status: 'cancelled'} : res
          )
        );
      } else {
        setError(data.error || 'Failed to cancel reservation');
      }
    } catch (err) {
      console.error('Error cancelling reservation:', err);
      setError('An error occurred while cancelling the reservation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Staff Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Welcome back, {user?.first_name || "Staff"}! Here's what needs your attention today.
          </p>
        </header>

        {/* Dashboard Navigation */}
        <nav className="mb-8">
          <ul className="flex border-b border-gray-200">
            <li className="mr-1">
              <button
                className={`inline-block py-2 px-4 ${
                  activeTab === "overview"
                    ? "border-b-2 border-amber-500 text-amber-600 font-medium"
                    : "text-gray-600 hover:text-amber-500"
                }`}
                onClick={() => setActiveTab("overview")}
              >
                Overview
              </button>
            </li>
            <li className="mr-1">
              <button
                className={`inline-block py-2 px-4 ${
                  activeTab === "reservations"
                    ? "border-b-2 border-amber-500 text-amber-600 font-medium"
                    : "text-gray-600 hover:text-amber-500"
                }`}
                onClick={() => setActiveTab("reservations")}
              >
                Reservations
              </button>
            </li>
            <li className="mr-1">
              <button
                className={`inline-block py-2 px-4 ${
                  activeTab === "orders"
                    ? "border-b-2 border-amber-500 text-amber-600 font-medium"
                    : "text-gray-600 hover:text-amber-500"
                }`}
                onClick={() => setActiveTab("orders")}
              >
                Orders
              </button>
            </li>
            <li className="mr-1">
              <button
                className={`inline-block py-2 px-4 ${
                  activeTab === "customers"
                    ? "border-b-2 border-amber-500 text-amber-600 font-medium"
                    : "text-gray-600 hover:text-amber-500"
                }`}
                onClick={() => setActiveTab("customers")}
              >
                Customers
              </button>
            </li>
            <li className="mr-1">
              <button
                className={`inline-block py-2 px-4 ${
                  activeTab === "reports"
                    ? "border-b-2 border-amber-500 text-amber-600 font-medium"
                    : "text-gray-600 hover:text-amber-500"
                }`}
                onClick={() => setActiveTab("reports")}
              >
                Reports
              </button>
            </li>
          </ul>
        </nav>

        {/* Dashboard Content */}
        <div className="dashboard-content">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}
          
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {loading ? (
                <div className="col-span-3 text-center py-20">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500"></div>
                  <p className="mt-3 text-gray-600">Loading dashboard data...</p>
                </div>
              ) : (
                <>
                  {/* Quick Stats Cards */}
                  <div className="bg-amber-50 p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Today's Reservations</h3>
                    <p className="text-3xl font-bold text-amber-600">{reservationStats.total}</p>
                    <Link to="/staff/reservations" className="text-amber-600 hover:text-amber-800 text-sm mt-2 inline-block">
                      View all reservations →
                    </Link>
                  </div>

                  <div className="bg-green-50 p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Active Orders</h3>
                    <p className="text-3xl font-bold text-green-600">{orderStats.active}</p>
                    <Link to="/staff/orders" className="text-green-600 hover:text-green-800 text-sm mt-2 inline-block">
                      View all orders →
                    </Link>
                  </div>

                  <div className="bg-blue-50 p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Tables Available</h3>
                    <p className="text-3xl font-bold text-blue-600">{tableStats.available}</p>
                    <span className="text-sm text-gray-500">Out of {tableStats.total} total tables</span>
                  </div>

                  {/* Recent Activity */}
                  <div className="col-span-1 md:col-span-3 bg-white p-6 rounded-lg shadow mt-6">
                    <h3 className="text-xl font-medium text-gray-900 mb-4">Recent Activity</h3>
                    {recentActivity.length === 0 ? (
                      <p className="text-gray-500">No recent activity found.</p>
                    ) : (
                      <div className="space-y-4">
                        {recentActivity.map((activity, index) => (
                          <div key={index} className="flex">
                            <div className={`mr-4 flex-shrink-0 ${
                              activity.type === 'reservation' 
                                ? activity.description.includes('confirmed') 
                                  ? 'text-green-500' 
                                  : activity.description.includes('cancelled') 
                                    ? 'text-red-500' 
                                    : 'text-blue-500'
                                : 'text-amber-500'
                            }`}>
                              {activity.type === 'reservation' ? (
                                activity.description.includes('confirmed') ? (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                ) : activity.description.includes('cancelled') ? (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                  </svg>
                                ) : (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                  </svg>
                                )
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                                </svg>
                              )}
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">{activity.description}</p>
                              <p className="text-xs text-gray-400">{formatRelativeTime(activity.timestamp)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === "reservations" && (
            <div>
              <div className="flex justify-between mb-4">
                <h2 className="text-xl font-medium">Today's Reservations</h2>
                <Link 
                  to="/staff/reservations" 
                  className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Manage All Reservations
                </Link>
              </div>
              <p className="text-gray-500 mb-4">
                Showing upcoming reservations for today. Click "Manage All Reservations" for more options.
              </p>
              
              {loading ? (
                <div className="text-center py-20">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500"></div>
                  <p className="mt-3 text-gray-600">Loading reservations...</p>
                </div>
              ) : todayReservations.length === 0 ? (
                <div className="bg-gray-50 p-6 text-center rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <h3 className="mt-4 text-gray-800 font-medium">No reservations for today</h3>
                  <p className="mt-2 text-gray-500">There are no reservations scheduled for today.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guests</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {todayReservations.map((reservation) => (
                        <tr key={reservation.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{reservation.name}</div>
                            <div className="text-sm text-gray-500">{reservation.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{formatTime(reservation.time)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{reservation.guests}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              reservation.status === 'confirmed' 
                                ? 'bg-green-100 text-green-800' 
                                : reservation.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Link 
                              to={`/staff/reservations?id=${reservation.id}`}
                              className="text-indigo-600 hover:text-indigo-900 mr-3"
                            >
                              View
                            </Link>
                            
                            {reservation.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleConfirmReservation(reservation.id)}
                                  className="text-green-600 hover:text-green-900 mr-3"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => handleRejectReservation(reservation.id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            
                            {reservation.status === 'confirmed' && (
                              <button
                                onClick={() => handleCancelReservation(reservation.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Cancel
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === "orders" && (
            <div>
              <div className="flex justify-between mb-4">
                <h2 className="text-xl font-medium">Active Orders</h2>
              </div>
              <p className="text-gray-500 mb-4">
                Showing currently active orders that need attention. Click an order to view details.
              </p>
              
              {loading ? (
                <div className="text-center py-20">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500"></div>
                  <p className="mt-3 text-gray-600">Loading orders...</p>
                </div>
              ) : activeOrders.length === 0 ? (
                <div className="bg-gray-50 p-6 text-center rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <h3 className="mt-4 text-gray-800 font-medium">No active orders</h3>
                  <p className="mt-2 text-gray-500">There are no active orders at the moment.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeOrders.map((order) => (
                    <div 
                      key={order.id}
                      className={`bg-white p-6 rounded-lg shadow border-l-4 ${
                        order.status === 'pending' 
                          ? 'border-yellow-500' 
                          : 'border-blue-500'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">Order #{order.id}</h3>
                          <p className="text-sm text-gray-500">
                            {formatRelativeTime(order.created_at)}
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          order.status === 'pending' 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>
                      <div className="mt-4">
                        <p className="text-sm text-gray-600">
                          {order.payment_method ? order.payment_method.charAt(0).toUpperCase() + order.payment_method.slice(1) : 'Unknown'} • {order.item_count} items
                        </p>
                        <p className="text-sm font-medium text-gray-900 mt-1">${order.total_amount.toFixed(2)}</p>
                      </div>
                      <div className="mt-4">
                        <Link
                          to={`/staff/orders/${order.id}`}
                          className="w-full bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-md text-sm font-medium block text-center"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "customers" && (
            <div>
              <h2 className="text-xl font-medium mb-4">Customer Information</h2>
              <p className="text-gray-500 mb-4">
                Search for customers to view their information and reservation history.
              </p>
              <div className="mb-6">
                <div className="max-w-md">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by name, email, or phone..."
                      className="w-full py-2 pl-3 pr-10 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleCustomerSearch()}
                    />
                    <div 
                      className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer"
                      onClick={handleCustomerSearch}
                    >
                      <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              
              {loading ? (
                <div className="text-center py-20">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500"></div>
                  <p className="mt-3 text-gray-600">Searching for customers...</p>
                </div>
              ) : !searchPerformed ? (
                <div className="bg-gray-100 p-8 rounded-lg text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <h3 className="mt-4 text-gray-900 font-medium">Search for a customer</h3>
                  <p className="mt-2 text-gray-500 text-sm">
                    Enter a name, email address, or phone number to find customer information
                  </p>
                </div>
              ) : customers.length === 0 ? (
                <div className="bg-gray-100 p-8 rounded-lg text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <h3 className="mt-4 text-gray-900 font-medium">No customers found</h3>
                  <p className="mt-2 text-gray-500 text-sm">
                    No customers match your search criteria. Try a different search term.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {customers.map((customer) => (
                    <div key={customer.id} className="bg-white p-6 rounded-lg shadow border-l-4 border-gray-200">
                      <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                        <div className="mb-4 md:mb-0">
                          <h3 className="text-lg font-medium text-gray-900">
                            {customer.first_name} {customer.last_name}
                          </h3>
                          <p className="text-gray-500 text-sm">@{customer.username}</p>
                          
                          <div className="mt-4 space-y-2">
                            <div className="flex items-center text-sm">
                              <span className="text-gray-500 w-20">Email:</span>
                              <span className="text-gray-900">{customer.email}</span>
                            </div>
                            {customer.phone && (
                              <div className="flex items-center text-sm">
                                <span className="text-gray-500 w-20">Phone:</span>
                                <span className="text-gray-900">{customer.phone}</span>
                              </div>
                            )}
                            {customer.address && (
                              <div className="flex items-center text-sm">
                                <span className="text-gray-500 w-20">Address:</span>
                                <span className="text-gray-900">{customer.address}</span>
                              </div>
                            )}
                            <div className="flex items-center text-sm">
                              <span className="text-gray-500 w-20">Joined:</span>
                              <span className="text-gray-900">{new Date(customer.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-amber-50 p-4 rounded">
                            <h4 className="text-sm font-medium text-gray-900 mb-1">Reservations</h4>
                            <p className="text-2xl font-bold text-amber-600">{customer.reservations.total}</p>
                            <div className="mt-2 text-xs text-gray-500">
                              <span className="text-green-600">{customer.reservations.confirmed} confirmed</span> • <span className="text-yellow-600">{customer.reservations.pending} pending</span>
                            </div>
                          </div>
                          
                          <div className="bg-blue-50 p-4 rounded">
                            <h4 className="text-sm font-medium text-gray-900 mb-1">Orders</h4>
                            <p className="text-2xl font-bold text-blue-600">{customer.orders.total}</p>
                            <div className="mt-2 text-xs text-gray-500">
                              <span className="text-amber-600">{customer.orders.active} active</span> • <span className="text-green-600">{customer.orders.completed} completed</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-6 flex justify-end space-x-2">
                        <Link 
                          to={`/staff/customers/${customer.id}`}
                          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-md"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "reports" && (
            <div>
              <h2 className="text-xl font-medium mb-4">Daily Reports</h2>
              <p className="text-gray-500 mb-4">
                View reports for today's operations. More detailed reports are available to managers.
              </p>
              
              <div className="mb-6">
                <div className="max-w-xs">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Date
                  </label>
                  <input
                    type="date"
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                  />
                </div>
              </div>
              
              {loading ? (
                <div className="text-center py-20">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500"></div>
                  <p className="mt-3 text-gray-600">Loading report data...</p>
                </div>
              ) : !reportData ? (
                <div className="bg-gray-100 p-8 rounded-lg text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <h3 className="mt-4 text-gray-900 font-medium">No report data found</h3>
                  <p className="mt-2 text-gray-500 text-sm">
                    No data available for the selected date. Try selecting another date.
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-lg shadow">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Reservations Summary</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Total Reservations</p>
                          <p className="text-2xl font-bold text-gray-900">{reportData.reservations.total}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Seated</p>
                          <p className="text-2xl font-bold text-green-600">{reportData.reservations.completed}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Upcoming</p>
                          <p className="text-2xl font-bold text-amber-600">{reportData.reservations.pending + reportData.reservations.confirmed}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Cancelled</p>
                          <p className="text-2xl font-bold text-red-600">{reportData.reservations.cancelled}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white p-6 rounded-lg shadow">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Total Orders</p>
                          <p className="text-2xl font-bold text-gray-900">{reportData.orders.total}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Completed</p>
                          <p className="text-2xl font-bold text-green-600">{reportData.orders.completed}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">In Progress</p>
                          <p className="text-2xl font-bold text-amber-600">{reportData.orders.active}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Cancelled</p>
                          <p className="text-2xl font-bold text-red-600">{reportData.orders.cancelled}</p>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-sm text-gray-500">Total Sales</p>
                        <p className="text-2xl font-bold text-gray-900">${reportData.orders.total_sales.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-6 rounded-lg shadow mb-8">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Busiest Hours Today</h3>
                    {reportData.hourly_breakdown.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No hourly data available for this date.</p>
                    ) : (
                      <div className="h-60 flex items-end justify-between px-4">
                        {reportData.hourly_breakdown.map((hourData: { hour: number; reservation_count: number }) => {
                          // Find the max count to calculate relative heights
                          const maxCount = Math.max(...reportData.hourly_breakdown.map((h: { reservation_count: number }) => h.reservation_count));
                          const relativeHeight = maxCount > 0 
                            ? (hourData.reservation_count / maxCount) * 100 
                            : 0;
                          
                          // Get color intensity based on count
                          const colorIndex = Math.min(
                            Math.floor((hourData.reservation_count / maxCount) * 7) + 2, 
                            7
                          );
                          
                          return (
                            <div key={hourData.hour} className="flex flex-col items-center">
                              <div 
                                className={`w-8 bg-amber-${colorIndex}00 rounded-t`} 
                                style={{ height: `${Math.max(relativeHeight, 5)}%` }}
                              ></div>
                              <span className="text-xs mt-2">{hourData.hour > 12 ? (hourData.hour - 12) + 'PM' : hourData.hour + 'AM'}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  
                  {reportData.popular_items.length > 0 && (
                    <div className="bg-white p-6 rounded-lg shadow mb-8">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Popular Items Today</h3>
                      <div className="space-y-4">
                        {reportData.popular_items.map((item: { id: number; name: string; price: number; order_count: number }) => (
                          <div key={item.id} className="flex items-center">
                            <div className="w-full">
                              <div className="flex justify-between mb-1">
                                <span className="text-sm font-medium text-gray-700">{item.name}</span>
                                <span className="text-sm text-gray-500">{item.order_count} orders</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-amber-500 h-2 rounded-full" 
                                  style={{ 
                                    width: `${(item.order_count / reportData.popular_items[0].order_count) * 100}%` 
                                  }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard; 