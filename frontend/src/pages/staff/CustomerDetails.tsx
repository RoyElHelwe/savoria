import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getCustomerDetails } from '@/services/customServices';

// Define types for the customer details data
interface CustomerDetails {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
  reservation_stats: {
    total: number;
    confirmed: number;
    pending: number;
    cancelled: number;
    avg_guests: number;
  };
  order_stats: {
    total: number;
    active: number;
    completed: number;
    cancelled: number;
    total_spent: number;
    avg_order_value: number;
  };
  recent_reservations: Array<{
    id: number;
    date: string;
    time: string;
    guests: number;
    status: string;
    special_requests: string | null;
    created_at: string;
  }>;
  recent_orders: Array<{
    order_id: number;
    order_type: string;
    status: string;
    total_amount: number;
    payment_method: string;
    payment_status: string;
    created_at: string;
    items: Array<{
      item_id: number;
      quantity: number;
      price_per_unit: number;
      item_name: string;
    }>;
  }>;
  favorite_items: Array<{
    item_id: number;
    name: string;
    price: number;
    category_id: number;
    category_name: string;
    order_count: number;
    total_quantity: number;
  }>;
  customer_metrics: {
    lifetime_value: number;
    average_order_value: number;
    total_visits: number;
    first_visit_date: string;
    days_since_first_visit: number;
  };
}

const CustomerDetails: React.FC = () => {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [customerData, setCustomerData] = useState<CustomerDetails | null>(null);
  const [activeTab, setActiveTab] = useState<string>("overview");

  useEffect(() => {
    if (!id) {
      setError('Customer ID is required');
      setLoading(false);
      return;
    }

    const loadCustomerDetails = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await getCustomerDetails(id);
        
        if (response.success && response.data) {
          setCustomerData(response.data);
        } else {
          setError(response.error || 'Failed to load customer details');
        }
      } catch (err) {
        setError('An error occurred while loading customer details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadCustomerDetails();
  }, [id]);

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
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  // Format relative time (e.g., "2 days ago")
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
    if (diffInDays < 30) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    }
    
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
    }
    
    const diffInYears = Math.floor(diffInMonths / 12);
    return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`;
  };

  // Calculate the percentage for visual representations
  const calculatePercentage = (value: number, max: number) => {
    if (max === 0) return 0;
    return Math.min(100, Math.round((value / max) * 100));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
          <p className="mt-4 text-gray-600">Loading customer details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            <p>{error}</p>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-md"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!customerData) {
    return (
      <div className="min-h-screen bg-white p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-50 p-6 text-center rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <h3 className="mt-4 text-gray-900 font-medium">Customer not found</h3>
            <p className="mt-2 text-gray-500">The customer you're looking for doesn't exist or you don't have permission to view it.</p>
            <button
              onClick={() => navigate(-1)}
              className="mt-4 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-md"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Customer Details</h1>
            <p className="mt-2 text-gray-600">
              Viewing detailed information for {customerData.first_name} {customerData.last_name}
            </p>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-md flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back
          </button>
        </div>

        {/* Customer Profile Card */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="flex items-center mb-4 md:mb-0">
                <div className="bg-amber-100 text-amber-800 rounded-full h-16 w-16 flex items-center justify-center text-2xl font-bold mr-4">
                  {customerData.first_name.charAt(0)}{customerData.last_name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {customerData.first_name} {customerData.last_name}
                  </h2>
                  <p className="text-gray-500">@{customerData.username}</p>
                </div>
              </div>

              <div className="flex flex-col space-y-2 text-sm md:text-right">
                <div>
                  <span className="text-gray-500">Customer since:</span>
                  <span className="ml-2 font-medium">{formatDate(customerData.created_at)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Total Visits:</span>
                  <span className="ml-2 font-medium">{customerData.customer_metrics.total_visits}</span>
                </div>
                <div>
                  <span className="text-gray-500">Lifetime Value:</span>
                  <span className="ml-2 font-medium">${customerData.customer_metrics.lifetime_value.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
                <div className="space-y-3">
                  <div className="flex">
                    <span className="text-gray-500 w-24">Email:</span>
                    <span className="text-gray-900">{customerData.email}</span>
                  </div>
                  {customerData.phone && (
                    <div className="flex">
                      <span className="text-gray-500 w-24">Phone:</span>
                      <span className="text-gray-900">{customerData.phone}</span>
                    </div>
                  )}
                  {customerData.address && (
                    <div className="flex">
                      <span className="text-gray-500 w-24">Address:</span>
                      <span className="text-gray-900">{customerData.address}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Summary</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-amber-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Reservations</p>
                    <p className="text-xl font-bold text-amber-600">{customerData.reservation_stats.total}</p>
                    <div className="mt-2 text-xs">
                      <span className="text-green-600">{customerData.reservation_stats.confirmed} confirmed</span>
                      {' • '}
                      <span className="text-yellow-600">{customerData.reservation_stats.pending} pending</span>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Orders</p>
                    <p className="text-xl font-bold text-blue-600">{customerData.order_stats.total}</p>
                    <div className="mt-2 text-xs">
                      <span className="text-green-600">${customerData.order_stats.total_spent.toFixed(2)} total spent</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="mb-8">
          <nav className="flex border-b border-gray-200">
            <button
              className={`py-4 px-6 ${
                activeTab === "overview"
                  ? "border-b-2 border-amber-500 text-amber-600 font-medium"
                  : "text-gray-600 hover:text-amber-500"
              }`}
              onClick={() => setActiveTab("overview")}
            >
              Overview
            </button>
            <button
              className={`py-4 px-6 ${
                activeTab === "reservations"
                  ? "border-b-2 border-amber-500 text-amber-600 font-medium"
                  : "text-gray-600 hover:text-amber-500"
              }`}
              onClick={() => setActiveTab("reservations")}
            >
              Reservations
            </button>
            <button
              className={`py-4 px-6 ${
                activeTab === "orders"
                  ? "border-b-2 border-amber-500 text-amber-600 font-medium"
                  : "text-gray-600 hover:text-amber-500"
              }`}
              onClick={() => setActiveTab("orders")}
            >
              Orders
            </button>
            <button
              className={`py-4 px-6 ${
                activeTab === "preferences"
                  ? "border-b-2 border-amber-500 text-amber-600 font-medium"
                  : "text-gray-600 hover:text-amber-500"
              }`}
              onClick={() => setActiveTab("preferences")}
            >
              Preferences
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Metrics</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">Lifetime Value</span>
                        <span className="text-sm font-medium text-gray-700">${customerData.customer_metrics.lifetime_value.toFixed(2)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${calculatePercentage(customerData.customer_metrics.lifetime_value, 1000)}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">Average Order Value</span>
                        <span className="text-sm font-medium text-gray-700">${customerData.customer_metrics.average_order_value.toFixed(2)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${calculatePercentage(customerData.customer_metrics.average_order_value, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">Total Visits</span>
                        <span className="text-sm font-medium text-gray-700">{customerData.customer_metrics.total_visits}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-amber-500 h-2 rounded-full" 
                          style={{ width: `${calculatePercentage(customerData.customer_metrics.total_visits, 50)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <h4 className="text-md font-medium text-gray-900 mb-2">First Visit</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-700">{formatDate(customerData.customer_metrics.first_visit_date)}</p>
                      <p className="text-sm text-gray-500 mt-1">{customerData.customer_metrics.days_since_first_visit} days ago</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
                  <div className="space-y-4">
                    {customerData.recent_reservations.length > 0 && (
                      <div className="border-l-4 border-amber-500 pl-4">
                        <p className="text-amber-600 font-medium">Reservation</p>
                        <p className="text-gray-900">
                          {formatDate(customerData.recent_reservations[0].date)} at {formatTime(customerData.recent_reservations[0].time)}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {customerData.recent_reservations[0].guests} guests • {customerData.recent_reservations[0].status}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatRelativeTime(customerData.recent_reservations[0].created_at)}
                        </p>
                      </div>
                    )}
                    
                    {customerData.recent_orders.length > 0 && (
                      <div className="border-l-4 border-blue-500 pl-4">
                        <p className="text-blue-600 font-medium">Order</p>
                        <p className="text-gray-900">
                          {customerData.recent_orders[0].order_type} • ${customerData.recent_orders[0].total_amount.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {customerData.recent_orders[0].status} • {customerData.recent_orders[0].payment_status}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatRelativeTime(customerData.recent_orders[0].created_at)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Reservations Tab */}
          {activeTab === "reservations" && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Reservation History</h3>
                <div className="text-sm text-gray-500">
                  Total: {customerData.reservation_stats.total} reservations
                </div>
              </div>
              
              {customerData.recent_reservations.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guests</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Special Requests</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {customerData.recent_reservations.map((reservation) => (
                        <tr key={reservation.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{formatDate(reservation.date)}</div>
                            <div className="text-sm text-gray-500">{formatTime(reservation.time)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{reservation.guests}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              reservation.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                              reservation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {reservation.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">{reservation.special_requests || '-'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{formatRelativeTime(reservation.created_at)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Link to={`/reservations/${reservation.id}`} className="text-amber-600 hover:text-amber-900">View</Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No reservations</h3>
                  <p className="mt-1 text-sm text-gray-500">This customer hasn't made any reservations yet.</p>
                </div>
              )}
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === "orders" && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Order History</h3>
                <div className="text-sm text-gray-500">
                  Total: {customerData.order_stats.total} orders
                </div>
              </div>
              
              {customerData.recent_orders.length > 0 ? (
                <div className="space-y-6">
                  {customerData.recent_orders.map((order) => (
                    <div key={order.order_id} className="bg-gray-50 rounded-lg overflow-hidden">
                      <div className="bg-gray-100 px-6 py-4 flex items-center justify-between">
                        <div>
                          <span className="text-sm text-gray-500">Order #{order.order_id}</span>
                          <h4 className="text-lg font-medium text-gray-900">{order.order_type}</h4>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900">${order.total_amount.toFixed(2)}</div>
                          <div className="text-sm text-gray-500">{formatRelativeTime(order.created_at)}</div>
                        </div>
                      </div>
                      
                      <div className="px-6 py-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex space-x-4">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              order.status === 'completed' ? 'bg-green-100 text-green-800' :
                              order.status === 'active' ? 'bg-blue-100 text-blue-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {order.status}
                            </span>
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              order.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {order.payment_status}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.payment_method}
                          </div>
                        </div>
                        
                        <div className="mt-4">
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Order Items</h5>
                          <div className="space-y-2">
                            {order.items.map((item) => (
                              <div key={item.item_id} className="flex justify-between items-center">
                                <div className="flex items-center">
                                  <span className="text-gray-900">{item.quantity}x</span>
                                  <span className="ml-2 text-gray-900">{item.item_name}</span>
                                </div>
                                <div className="text-gray-900">${(item.price_per_unit * item.quantity).toFixed(2)}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="px-6 py-3 bg-gray-100 border-t border-gray-200">
                        <Link to={`/orders/${order.order_id}`} className="text-amber-600 hover:text-amber-900 text-sm font-medium">
                          View complete order
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No orders</h3>
                  <p className="mt-1 text-sm text-gray-500">This customer hasn't placed any orders yet.</p>
                </div>
              )}
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === "preferences" && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Customer Preferences</h3>
              </div>
              
              {customerData.favorite_items.length > 0 ? (
                <div>
                  <h4 className="text-md font-medium text-gray-700 mb-4">Favorite Items</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {customerData.favorite_items.map((item) => (
                      <div key={item.item_id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                          <div>
                            <h5 className="text-gray-900 font-medium">{item.name}</h5>
                            <p className="text-gray-500 text-sm">{item.category_name}</p>
                          </div>
                          <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full">
                            ${item.price.toFixed(2)}
                          </span>
                        </div>
                        <div className="mt-4 flex justify-between items-center text-sm">
                          <span className="text-gray-500">Ordered {item.order_count} times</span>
                          <span className="text-gray-500">Total qty: {item.total_quantity}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No preferences</h3>
                  <p className="mt-1 text-sm text-gray-500">This customer hasn't ordered enough to establish preferences.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerDetails;