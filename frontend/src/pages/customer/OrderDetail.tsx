import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  getOrderDetail, 
  getOrderStatusInfo, 
  formatCurrency, 
  Order 
} from '../../services/orderServiceV2';
import { formatDate, formatDateTime } from '../../utils/dateUtils';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Separator } from '../../components/ui/separator';
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import {
  AlertCircle,
  ShoppingBag,
  Calendar,
  Clock,
  MapPin,
  CreditCard,
  Truck,
  Package,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Phone,
  Mail
} from 'lucide-react';

const OrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Load order details on component mount
  useEffect(() => {
    const fetchOrderDetail = async () => {
      if (!id) {
        setError('Order ID is required');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        const orderId = parseInt(id);
        const response = await getOrderDetail(orderId);
        
        setOrder(response.order);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load order details');
        console.error('Error loading order details:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrderDetail();
  }, [id]);
  
  // Go back to orders list
  const goBack = () => {
    navigate('/orders');
  };
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
          <span className="ml-3 text-gray-600">Loading order details...</span>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <button 
          onClick={goBack}
          className="flex items-center text-amber-600 hover:text-amber-800 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Orders
        </button>
        
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          <p>{error}</p>
        </div>
        
        <div className="text-center py-12">
          <div className="bg-red-50 rounded-full p-6 inline-flex">
            <AlertTriangle className="h-12 w-12 text-red-500" />
          </div>
          <h3 className="mt-6 text-lg font-medium text-gray-900">Order Not Found</h3>
          <p className="mt-2 text-gray-500 max-w-md mx-auto">
            The order you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <div className="mt-6">
            <Button onClick={goBack}>
              Return to My Orders
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  if (!order) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <button 
          onClick={goBack}
          className="flex items-center text-amber-600 hover:text-amber-800 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Orders
        </button>
        
        <div className="text-center py-12">
          <div className="bg-gray-100 rounded-full p-6 inline-flex">
            <AlertTriangle className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="mt-6 text-lg font-medium text-gray-900">Order Not Found</h3>
          <p className="mt-2 text-gray-500 max-w-md mx-auto">
            The order you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <div className="mt-6">
            <Button onClick={goBack}>
              Return to My Orders
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  // Get status info
  const { label, color } = getOrderStatusInfo(order.status);
  
  // Organize tracking events by date
  const trackingEventsByDate: Record<string, typeof order.tracking> = {};
  
  if (order.tracking && order.tracking.length > 0) {
    order.tracking.forEach(event => {
      const date = event.timestamp.split(' ')[0]; // Get date part of timestamp
      if (!trackingEventsByDate[date]) {
        trackingEventsByDate[date] = [];
      }
      trackingEventsByDate[date].push(event);
    });
  }
  
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <button 
        onClick={goBack}
        className="flex items-center text-amber-600 hover:text-amber-800 mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Orders
      </button>
      
      <div className="flex flex-col md:flex-row justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-1">Order #{order.order_id}</h1>
          <p className="text-gray-600">Placed on {formatDateTime(order.created_at)}</p>
        </div>
        <Badge className={`mt-2 md:mt-0 ${color}`}>{label}</Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Order details */}
        <div className="md:col-span-2 space-y-6">
          {/* Order items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map(item => (
                  <div key={item.item_id} className="flex items-start">
                    <div className="w-12 h-12 bg-gray-100 rounded-md overflow-hidden mr-4 flex-shrink-0">
                      {item.image_url && (
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-grow">
                      <div className="flex justify-between">
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="font-medium">{formatCurrency(item.price_per_unit * item.quantity)}</p>
                      </div>
                      <div className="flex justify-between text-sm text-gray-500">
                        <p>{item.quantity} × {formatCurrency(item.price_per_unit)}</p>
                      </div>
                      {item.special_instructions && (
                        <p className="text-sm text-gray-500 mt-1">
                          <span className="font-medium">Special Instructions:</span> {item.special_instructions}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Order tracking */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              {order.tracking && order.tracking.length > 0 ? (
                <div className="space-y-6">
                  {Object.entries(trackingEventsByDate).map(([date, events]) => (
                    <div key={date}>
                      <h4 className="text-sm font-medium mb-3">{formatDate(date)}</h4>
                      <div className="ml-2 space-y-4">
                        {events.map((event, index) => (
                          <div key={event.id} className="relative flex">
                            {/* Timeline connector */}
                            {index < events.length - 1 && (
                              <div className="absolute top-5 left-2.5 bottom-0 w-0.5 bg-gray-200"></div>
                            )}
                            
                            {/* Event marker */}
                            <div className="z-10 flex items-center justify-center w-5 h-5 bg-white rounded-full border-2 border-amber-500 mr-3 mt-1"></div>
                            
                            {/* Event content */}
                            <div className="flex-grow pb-5">
                              <div className="flex justify-between">
                                <p className="font-medium">
                                  {event.details || `Order ${event.status}`}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {event.timestamp.split(' ')[1].split(':').slice(0, 2).join(':')}
                                </p>
                              </div>
                              <p className="text-sm text-gray-500">
                                {event.event_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-500">No tracking information available for this order.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Order summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-1 flex items-center">
                  <ShoppingBag className="h-4 w-4 mr-1" />
                  Order Type
                </p>
                <p className="font-medium">{order.order_type.charAt(0).toUpperCase() + order.order_type.slice(1)}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 mb-1 flex items-center">
                  <CreditCard className="h-4 w-4 mr-1" />
                  Payment Method
                </p>
                <p className="font-medium">
                  {order.payment_method.split('_').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                  ).join(' ')}
                </p>
                <p className="text-sm text-gray-500">
                  Status: {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                </p>
              </div>
              
              {order.order_type === 'delivery' && order.delivery_address && (
                <div>
                  <p className="text-sm text-gray-500 mb-1 flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    Delivery Address
                  </p>
                  <p>{order.delivery_address}</p>
                </div>
              )}
              
              {order.notes && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Additional Notes</p>
                  <p>{order.notes}</p>
                </div>
              )}
              
              <Separator />
              
              <div>
                <div className="flex justify-between mb-2">
                  <p className="text-gray-600">Subtotal</p>
                  <p>{formatCurrency(order.subtotal || 0)}</p>
                </div>
                
                {order.delivery_fee > 0 && (
                  <div className="flex justify-between mb-2">
                    <p className="text-gray-600">Delivery Fee</p>
                    <p>{formatCurrency(order.delivery_fee)}</p>
                  </div>
                )}
                
                <div className="flex justify-between mb-2">
                  <p className="text-gray-600">Tax</p>
                  <p>{formatCurrency(order.tax_amount)}</p>
                </div>
                
                <Separator />
                
                <div className="flex justify-between mt-2">
                  <p className="font-bold">Total</p>
                  <p className="font-bold text-amber-600">{formatCurrency(order.total_amount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Order actions */}
          {(order.status === 'completed' || order.status === 'delivered') && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full">Reorder</Button>
                <Button variant="outline" className="w-full">
                  Contact Support
                </Button>
              </CardContent>
            </Card>
          )}
          
          {/* Order support */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600">
                If you have any questions or issues with your order, please contact our customer support team.
              </p>
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-2 text-amber-600" />
                <a href="tel:123-456-7890" className="text-amber-600 hover:text-amber-800">
                  123-456-7890
                </a>
              </div>
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-2 text-amber-600" />
                <a href="mailto:support@savoria.com" className="text-amber-600 hover:text-amber-800">
                  support@savoria.com
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;