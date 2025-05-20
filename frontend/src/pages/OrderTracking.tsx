import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Order, getOrder } from '../services/orderService';
import LoadingSpinner from '../components/LoadingSpinner';

const OrderTracking: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const orderIdNumber = parseInt(orderId);
        if (isNaN(orderIdNumber)) {
          setError('Invalid order ID');
          setLoading(false);
          return;
        }
        
        const response = await getOrder(orderIdNumber);
        
        if (response.success && response.order) {
          setOrder(response.order);
        } else {
          setError(response.error || 'Failed to load order details');
        }
      } catch (err) {
        setError('An error occurred while loading the order details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrderDetails();
  }, [orderId]);
  
  // Function to format date
  const formatDate = (dateString: string) => {
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
  
  // Function to get step number based on status
  const getProgressStep = (status: string) => {
    const steps = {
      'pending': 1,
      'confirmed': 2,
      'preparing': 3,
      'out for delivery': 4,
      'delivered': 5,
      'ready for pickup': 4,
      'completed': 5,
      'cancelled': -1
    };
    
    return steps[status.toLowerCase() as keyof typeof steps] || 1;
  };
  
  // Define steps for different order types
  const deliverySteps = ['Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered'];
  const pickupSteps = ['Pending', 'Confirmed', 'Preparing', 'Ready for Pickup', 'Completed'];
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-red-50 text-red-700 p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p>{error}</p>
          <Link to="/" className="mt-4 inline-block text-amber-600 hover:text-amber-700">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }
  
  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-gray-50 p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Order Not Found</h2>
          <p>The order you are looking for does not exist or you don't have permission to view it.</p>
          <Link to="/" className="mt-4 inline-block text-amber-600 hover:text-amber-700">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }
  
  // Determine which steps to use based on order type
  const steps = order.order_type === 'delivery' ? deliverySteps : pickupSteps;
  const currentStep = getProgressStep(order.status);
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <Link to="/" className="text-amber-600 hover:text-amber-700">
          &larr; Back to Home
        </Link>
      </div>
      
      <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
        <div className="bg-amber-500 p-4 text-white">
          <h1 className="text-2xl font-bold">Order #{order.order_id}</h1>
          <p>Placed on {formatDate(order.created_at)}</p>
        </div>
        
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Order Status</h2>
            <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(order.status)}`}>
              {order.status.toUpperCase()}
            </span>
          </div>
          
          {order.status !== 'cancelled' && (
            <div className="mb-8">
              <div className="relative">
                <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -translate-y-1/2"></div>
                <div 
                  className="absolute top-1/2 left-0 h-1 bg-amber-500 -translate-y-1/2"
                  style={{ width: `${Math.max(0, (currentStep - 1) / (steps.length - 1) * 100)}%` }}
                ></div>
                <div className="relative flex justify-between">
                  {steps.map((step, index) => (
                    <div key={step} className="flex flex-col items-center">
                      <div 
                        className={`w-8 h-8 rounded-full flex items-center justify-center z-10 
                          ${index < currentStep ? 'bg-amber-500 text-white' : 'bg-white border-2 border-gray-300 text-gray-500'}`}
                      >
                        {index + 1}
                      </div>
                      <div className="text-sm mt-2 text-center">{step}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Order Tracking Timeline */}
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-4">Order Updates</h3>
            <div className="border-l-2 border-gray-200 pl-4 ml-4 space-y-6">
              {order.tracking && order.tracking.length > 0 ? (
                order.tracking.map((track, index) => (
                  <div key={index} className="relative">
                    <div className="absolute -left-6 mt-1 w-4 h-4 rounded-full bg-amber-500"></div>
                    <div>
                      <p className="font-medium">{track.details}</p>
                      <p className="text-sm text-gray-500">{formatDate(track.timestamp)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="relative">
                  <div className="absolute -left-6 mt-1 w-4 h-4 rounded-full bg-amber-500"></div>
                  <div>
                    <p className="font-medium">Order received</p>
                    <p className="text-sm text-gray-500">{formatDate(order.created_at)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Order Details */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Order Details</h3>
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-500 text-sm">Order Type</p>
                    <p className="font-medium capitalize">{order.order_type}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Payment Method</p>
                    <p className="font-medium capitalize">{order.payment_method.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Payment Status</p>
                    <p className="font-medium capitalize">{order.payment_status}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Delivery Information</h3>
              <div className="bg-gray-50 p-4 rounded-md">
                {order.delivery_address ? (
                  <>
                    <p className="text-gray-500 text-sm">Delivery Address</p>
                    <p className="font-medium">{order.delivery_address}</p>
                    {order.notes && (
                      <>
                        <p className="text-gray-500 text-sm mt-2">Delivery Instructions</p>
                        <p className="font-medium">{order.notes}</p>
                      </>
                    )}
                  </>
                ) : (
                  <p className="font-medium">
                    {order.order_type === 'pickup' ? 'Customer will pick up this order' : 'Dine-in order'}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          {/* Order Items */}
          <div>
            <h3 className="text-lg font-medium mb-2">Order Items</h3>
            <div className="bg-gray-50 rounded-md overflow-hidden">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Item</th>
                    <th className="text-center py-3 px-4">Qty</th>
                    <th className="text-right py-3 px-4">Price</th>
                    <th className="text-right py-3 px-4">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map(item => (
                    <tr key={item.order_item_id} className="border-b">
                      <td className="py-3 px-4">
                        <div className="font-medium">{item.name}</div>
                        {item.special_instructions && (
                          <div className="text-sm text-gray-500 mt-1">
                            Note: {item.special_instructions}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">{item.quantity}</td>
                      <td className="py-3 px-4 text-right">${item.price.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right">${item.subtotal.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-b">
                    <td colSpan={3} className="text-right py-3 px-4 font-medium">Subtotal</td>
                    <td className="text-right py-3 px-4 font-medium">${order.subtotal.toFixed(2)}</td>
                  </tr>
                  {order.delivery_fee > 0 && (
                    <tr className="border-b">
                      <td colSpan={3} className="text-right py-3 px-4">Delivery Fee</td>
                      <td className="text-right py-3 px-4">${order.delivery_fee.toFixed(2)}</td>
                    </tr>
                  )}
                  <tr className="border-b">
                    <td colSpan={3} className="text-right py-3 px-4">Tax</td>
                    <td className="text-right py-3 px-4">${order.tax_amount.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="text-right py-3 px-4 font-bold">Total</td>
                    <td className="text-right py-3 px-4 font-bold">${order.total_amount.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>
      
      <div className="text-center mt-8">
        <p className="text-gray-500">Thank you for your order!</p>
        <p className="text-gray-500">If you have any questions, please contact us.</p>
        <div className="mt-4">
          <Link to="/" className="text-amber-600 hover:text-amber-700 font-medium">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking; 