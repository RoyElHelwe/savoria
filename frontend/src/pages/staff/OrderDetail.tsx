import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { Order, updateOrderStatus } from '../../services/orderService';
import LoadingSpinner from '../../components/LoadingSpinner';
import { API_BASE_URL } from '../../config';

const OrderDetail: React.FC = () => {
  // Get ID from both URL params and query params
  const { id: urlParamId } = useParams<{ id: string }>();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const queryParamId = queryParams.get('id');
  
  // Use either URL param or query param for the ID
  const orderId = urlParamId || queryParamId;
  
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updateStatus, setUpdateStatus] = useState('');
  const [updateMessage, setUpdateMessage] = useState('');
  
  // Status options for different order types
  const statusOptions = {
    'delivery': ['Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'],
    'pickup': ['Pending', 'Confirmed', 'Preparing', 'Ready for Pickup', 'Completed', 'Cancelled'],
    'dine-in': ['Pending', 'Confirmed', 'Preparing', 'Served', 'Completed', 'Cancelled']
  };
  
  // Redirect to path parameter format if query parameter is used
  useEffect(() => {
    // Only redirect if we're accessing via query param and not path param
    if (queryParamId && !urlParamId) {
      navigate(`/staff/orders/${queryParamId}`, { replace: true });
    }
  }, [queryParamId, urlParamId, navigate]);
  
  useEffect(() => {
    const fetchOrderDetails = async () => {
      // Check for id existence with better error handling
      if (!orderId) {
        setError('Order ID is missing. Please ensure the URL includes an ID parameter.');
        setLoading(false);
        return;
      }
      
      console.log(`Attempting to fetch order with ID: ${orderId} (URL param: ${urlParamId}, Query param: ${queryParamId})`);
      
      try {
        setLoading(true);
        setError(null);
        setUpdateMessage('');
        
        // Enhanced: Better error handling for non-numeric IDs
        const orderIdNumber = parseInt(orderId);
        if (isNaN(orderIdNumber)) {
          setError(`Invalid order ID: ${orderId}`);
          setLoading(false);
          return;
        }
        
        // Get token for authentication
        const token = localStorage.getItem('token');
        
        if (!token) {
          setError('Authentication required. Please log in again.');
          setLoading(false);
          navigate('/login', { state: { from: location.pathname + location.search } });
          return;
        }
        
        // Enhanced: Added more detailed console logging for debugging
        console.log(`Fetching order details for ID: ${orderIdNumber}`);
        
        const response = await fetch(`${API_BASE_URL}/staff/orders/get_order_details.php?id=${orderIdNumber}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          // Enhanced: Better handling of HTTP errors
          throw new Error(`Server responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.order) {
          console.log('Order details retrieved successfully:', data.order);
          setOrder(data.order);
        } else {
          setError(data.error || `Failed to load order details for ID: ${orderIdNumber}`);
        }
      } catch (err) {
        // Enhanced: Better error handling with details
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(`An error occurred while loading the order details: ${errorMessage}`);
        console.error('Order fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrderDetails();
  }, [orderId, navigate, location.pathname, location.search, urlParamId, queryParamId]); // Updated dependencies
  
  // Handle order status update
  const handleStatusUpdate = async () => {
    // Fixed: Added check for id existence
    if (!orderId || !order || !updateStatus) {
      setError('Please select a status to update');
      return;
    }
    
    try {
      setUpdatingStatus(true);
      setError(null);
      setUpdateMessage('');
      
      console.log(`Updating order ${order.order_id} status to ${updateStatus}`);
      
      const response = await updateOrderStatus(order.order_id, updateStatus);
      
      if (response.success) {
        setUpdateMessage('Order status updated successfully');
        // Refresh the order data
        const refreshOrder = async () => {
          const token = localStorage.getItem('token');
          if (!token) return;
          
          try {
            const response = await fetch(`${API_BASE_URL}/staff/orders/get_order_details.php?id=${order.order_id}`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (!response.ok) {
              throw new Error(`Server responded with status: ${response.status}`);
            }
            
            const data = await response.json();
            if (data.success && data.order) {
              setOrder(data.order);
              setUpdateStatus('');
            }
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            console.error(`Error refreshing order data: ${errorMessage}`, err);
          }
        };
        
        setTimeout(() => {
          refreshOrder();
        }, 1000);
      } else {
        setError(response.error || 'Failed to update order status');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`An error occurred while updating the order status: ${errorMessage}`);
      console.error('Status update error:', err);
    } finally {
      setUpdatingStatus(false);
    }
  };
  
  // Function to format date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).format(date);
  };
  
  // Function to determine status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'delivered':
      case 'ready for pickup':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'out for delivery':
      case 'preparing':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };
  
  // Enhanced: Added debug information component
  const DebugInfo = () => {
    return (
      <div className="bg-gray-100 p-4 rounded-md mt-6 text-xs">
        <h3 className="font-bold mb-2">Debug Information</h3>
        <div>
          <p>URL Parameter ID: {urlParamId || 'None'}</p>
          <p>Query Parameter ID: {queryParamId || 'None'}</p>
          <p>Active Order ID: {orderId || 'None'}</p>
          <p>Order ID from State: {order?.order_id || 'None'}</p>
          <p>Current Path: {location.pathname}</p>
          <p>Current Search: {location.search}</p>
          <p>Current Environment: {process.env.NODE_ENV}</p>
        </div>
      </div>
    );
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading order details...</p>
          {/* Enhanced: Added ID visibility during loading */}
          <p className="mt-2 text-gray-500">Order ID: {orderId || 'Not available'}</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 text-red-700 p-4 rounded-lg shadow mb-4">
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p>{error}</p>
          {/* Enhanced: Added ID visibility in error state */}
          <p className="mt-2 text-sm">Order ID: {orderId || 'Not available'}</p>
          <p className="mt-1 text-xs text-gray-500">URL: {location.pathname + location.search}</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => navigate(-1)}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md"
          >
            Go Back
          </button>
          {/* Enhanced: Added retry button */}
          <button
            onClick={() => window.location.reload()}
            className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-md"
          >
            Retry
          </button>
        </div>
        <DebugInfo />
      </div>
    );
  }
  
  if (!order) {
    return (
      <div className="p-6">
        <div className="bg-gray-50 p-4 rounded-lg shadow mb-4">
          <h2 className="text-xl font-semibold mb-2">Order Not Found</h2>
          <p>The order with ID {orderId} does not exist or you don't have permission to view it.</p>
        </div>
        <button
          onClick={() => navigate('/staff/orders')}
          className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-md"
        >
          Back to Orders
        </button>
        <DebugInfo />
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="text-amber-600 hover:text-amber-700 mb-2 flex items-center"
          >
            ← Back to Orders
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Order #{order.order_id}</h1>
          <p className="text-gray-600">Placed on {formatDate(order.created_at)}</p>
        </div>
        <span className={`px-3 py-1 rounded-full ${getStatusColor(order.status)}`}>
          {order.status.toUpperCase()}
        </span>
      </div>
      
      <div className="h-1 w-20 bg-amber-500 mb-6"></div>
      
      {updateMessage && (
        <div className="bg-green-50 text-green-700 p-3 rounded-md mb-4">
          {updateMessage}
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
        
          {/* Delivery Information */}
          {order.delivery_address && (
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Delivery Information</h2>
              <div>
                <p className="text-gray-500 text-sm">Delivery Address</p>
                <p className="font-medium">{order.delivery_address}</p>
              </div>
              {order.notes && (
                <div className="mt-4">
                  <p className="text-gray-500 text-sm">Delivery Instructions</p>
                  <p className="font-medium">{order.notes}</p>
                </div>
              )}
            </div>
          )}
          
          {/* Order Items */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Order Items</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Item</th>
                    <th className="px-4 py-2 text-center text-sm font-medium text-gray-500">Quantity</th>
                    <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">Price</th>
                    <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {order.items && order.items.length > 0 ? (
                    order.items.map(item => (
                      <tr key={item.order_item_id}>
                        <td className="px-4 py-3">
                          <div className="font-medium">{item.name}</div>
                          {item.special_instructions && (
                            <div className="text-sm text-gray-500 mt-1">
                              Note: {item.special_instructions}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">{item.quantity}</td>
                        <td className="px-4 py-3 text-right">${item.price.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right font-medium">${item.subtotal.toFixed(2)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-3 text-center text-gray-500">
                        No items found for this order
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={3} className="px-4 py-2 text-right text-sm font-medium">Subtotal</td>
                    <td className="px-4 py-2 text-right font-medium">${order.total_amount?.toFixed(2) || order.total_amount.toFixed(2)}</td>
                  </tr>
                  {order.delivery_fee > 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-2 text-right text-sm font-medium">Delivery Fee</td>
                      <td className="px-4 py-2 text-right font-medium">${order.delivery_fee.toFixed(2)}</td>
                    </tr>
                  )}
                  <tr>
                    <td colSpan={3} className="px-4 py-2 text-right text-sm font-medium">Tax</td>
                    <td className="px-4 py-2 text-right font-medium">${order.tax_amount.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="px-4 py-2 text-right text-sm font-bold">Total</td>
                    <td className="px-4 py-2 text-right font-bold">${order.total_amount.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
          
          {/* Order Tracking Timeline - Enhanced with proper timeline implementation */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Order Timeline</h2>
            <div className="border-l-2 border-gray-200 pl-4 ml-4 space-y-6">
              {/* Created status */}
              <div className="relative">
                <div className="absolute -left-6 mt-1 w-4 h-4 rounded-full bg-amber-500"></div>
                <div>
                  <p className="font-medium">Order Received</p>
                  <p className="text-sm text-gray-500">{formatDate(order.created_at)}</p>
                </div>
              </div>
              
              {/* Current status */}
              <div className="relative">
                <div className="absolute -left-6 mt-1 w-4 h-4 rounded-full bg-green-500"></div>
                <div>
                  <p className="font-medium">Current Status: {order.status}</p>
                  <p className="text-sm text-gray-500">Last updated: {formatDate(order.updated_at || order.created_at)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-1">
          {/* Update Status */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Update Status</h2>
            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4">
                {error}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Current Status: <span className="font-bold">{order.status}</span>
                </label>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  New Status
                </label>
                <select
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                  value={updateStatus}
                  onChange={(e) => setUpdateStatus(e.target.value)}
                  disabled={updatingStatus}
                >
                  <option value="">Select Status</option>
                  {statusOptions[order.order_type as keyof typeof statusOptions]?.map(status => (
                    <option 
                      key={status} 
                      value={status.toLowerCase()}
                      disabled={status.toLowerCase() === order.status.toLowerCase()}
                    >
                      {status}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleStatusUpdate}
                className="w-full px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 transition flex justify-center items-center disabled:bg-gray-300 disabled:cursor-not-allowed"
                disabled={updatingStatus || !updateStatus || updateStatus.toLowerCase() === order.status.toLowerCase()}
              >
                {updatingStatus ? (
                  <>
                    <LoadingSpinner size="sm" color="white" />
                    <span className="ml-2">Updating...</span>
                  </>
                ) : (
                  'Update Status'
                )}
              </button>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link 
                to={`/order-tracking/${order.order_id}`} 
                target="_blank"
                className="block w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-center rounded-md transition"
              >
                View Order Tracking Page
              </Link>
              
              <button
                onClick={() => window.print()}
                className="block w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-center rounded-md transition"
              >
                Print Order
              </button>
              
              {/* Enhanced: Added contact customer option */}
            </div>
          </div>
          
          {/* Payment Information */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Payment Information</h2>
            <div className="space-y-3">
              <div>
                <p className="text-gray-500 text-sm">Payment Method</p>
                <p className="font-medium capitalize">{order.payment_method?.replace('_', ' ') || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Payment Status</p>
                <p className={`font-medium capitalize ${
                  order.payment_status === 'paid' 
                    ? 'text-green-600' 
                    : order.payment_status === 'failed' 
                    ? 'text-red-600' 
                    : 'text-amber-600'
                }`}>
                  {order.payment_status || 'Pending'}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Total Amount</p>
                <p className="font-bold text-lg">${order.total_amount.toFixed(2)}</p>
              </div>
            </div>
          </div>
          
          {/* Development environment only: Debug information */}
          {process.env.NODE_ENV === 'development' && <DebugInfo />}
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;