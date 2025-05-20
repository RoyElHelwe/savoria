import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  getUserOrders, 
  getOrderStatusInfo, 
  formatCurrency, 
  Order, 
  Pagination 
} from '../../services/orderServiceV2';
import { formatDate, formatDateTime } from '../../utils/dateUtils';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  AlertCircle,
  ShoppingBag,
  Calendar,
  Clock,
  MapPin,
  CreditCard,
  Truck,
  Package,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

type OrderStatus = 'all' | 'active' | 'completed' | 'cancelled';

const MyOrders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<OrderStatus>('all');
  
  // Pagination state
  const [pagination, setPagination] = useState<Pagination>({
    current_page: 1,
    per_page: 5,
    total_items: 0,
    total_pages: 0
  });
  
  // Load orders on component mount and when tab or page changes
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Map tab values to API status filter
        let statusFilter: string | undefined;
        
        switch (activeTab) {
          case 'active':
            statusFilter = 'pending,confirmed,preparing,out for delivery,ready for pickup';
            break;
          case 'completed':
            statusFilter = 'completed,delivered';
            break;
          case 'cancelled':
            statusFilter = 'cancelled';
            break;
          default:
            statusFilter = undefined;
        }
        
        const response = await getUserOrders(
          pagination.current_page, 
          pagination.per_page, 
          statusFilter
        );
        
        setOrders(response.orders);
        setPagination(response.pagination);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load orders');
        console.error('Error loading orders:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrders();
  }, [activeTab, pagination.current_page, pagination.per_page]);
  
  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      setPagination(prev => ({
        ...prev,
        current_page: newPage
      }));
    }
  };
  
  // Handle items per page change
  const handlePerPageChange = (value: string) => {
    setPagination(prev => ({
      ...prev,
      per_page: parseInt(value),
      current_page: 1 // Reset to first page when changing items per page
    }));
  };
  
  // Navigate to order detail
  const viewOrderDetail = (orderId: number) => {
    navigate(`/orders/${orderId}`);
  };
  
  // Render pagination controls
  const renderPagination = () => {
    if (pagination.total_pages <= 1) return null;
    
    return (
      <div className="flex items-center justify-between mt-6">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            Showing {orders.length} of {pagination.total_items} orders
          </span>
          <div className="flex items-center gap-1 ml-4">
            <span className="text-sm text-gray-600">Show</span>
            <Select 
              value={String(pagination.per_page)} 
              onValueChange={handlePerPageChange}
            >
              <SelectTrigger className="h-8 w-16">
                <SelectValue placeholder={pagination.per_page} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-gray-600">per page</span>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => handlePageChange(pagination.current_page - 1)}
            disabled={pagination.current_page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center gap-1 mx-2">
            {Array.from({ length: pagination.total_pages }, (_, i) => i + 1).map(page => (
              <Button
                key={page}
                variant={page === pagination.current_page ? "default" : "outline"}
                size="icon"
                className="h-8 w-8"
                onClick={() => handlePageChange(page)}
              >
                {page}
              </Button>
            ))}
          </div>
          
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => handlePageChange(pagination.current_page + 1)}
            disabled={pagination.current_page === pagination.total_pages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };
  
  // Render empty state
  const renderEmptyState = () => (
    <div className="text-center py-12">
      <div className="flex justify-center">
        <div className="bg-gray-100 rounded-full p-6">
          <ShoppingBag className="h-12 w-12 text-gray-400" />
        </div>
      </div>
      <h3 className="mt-6 text-lg font-medium text-gray-900">No orders found</h3>
      <p className="mt-2 text-gray-500 max-w-md mx-auto">
        {activeTab === 'all' 
          ? "You haven't placed any orders yet. Browse our menu and place your first order!"
          : activeTab === 'active'
          ? "You don't have any active orders at the moment."
          : activeTab === 'completed'
          ? "You don't have any completed orders yet."
          : "You don't have any cancelled orders."
        }
      </p>
      <div className="mt-6">
        <Button asChild>
          <Link to="/order-online">Browse Menu</Link>
        </Button>
      </div>
    </div>
  );
  
  // Render order card
  const renderOrderCard = (order: Order) => {
    const { label, color } = getOrderStatusInfo(order.status);
    const hasTrackingInfo = order.tracking && order.tracking.length > 0;
    
    return (
      <Card key={order.order_id} className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">Order #{order.order_id}</CardTitle>
              <CardDescription>
                Placed on {formatDateTime(order.created_at)}
              </CardDescription>
            </div>
            <Badge className={color}>{label}</Badge>
          </div>
        </CardHeader>
        
        <CardContent className="pb-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-500 mb-1 flex items-center">
                <ShoppingBag className="h-4 w-4 mr-1" />
                Order Type
              </p>
              <p className="text-sm font-medium">{order.order_type.charAt(0).toUpperCase() + order.order_type.slice(1)}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 mb-1 flex items-center">
                <CreditCard className="h-4 w-4 mr-1" />
                Payment
              </p>
              <p className="text-sm font-medium">
                {order.payment_method.charAt(0).toUpperCase() + order.payment_method.slice(1)} 
                <span className="text-xs ml-1">
                  ({order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)})
                </span>
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 mb-1 flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                Items
              </p>
              <p className="text-sm font-medium">{order.items.length} items</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 mb-1 flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                Total
              </p>
              <p className="text-sm font-medium text-amber-600">{formatCurrency(order.total_amount)}</p>
            </div>
          </div>
          
          {/* Order items preview - show first 2 items with a count of remaining */}
          <div className="mb-4">
            <p className="text-sm font-medium mb-2">Items:</p>
            <div className="space-y-2">
              {order.items.slice(0, 2).map(item => (
                <div key={item.item_id} className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gray-200 rounded-md overflow-hidden mr-2 flex-shrink-0">
                      {item.image_url && (
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <p className="text-sm">{formatCurrency(item.price_per_unit * item.quantity)}</p>
                </div>
              ))}
              
              {order.items.length > 2 && (
                <p className="text-xs text-gray-500">
                  + {order.items.length - 2} more items
                </p>
              )}
            </div>
          </div>
          
          {/* Delivery address (if delivery order) */}
          {order.order_type === 'delivery' && order.delivery_address && (
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-1 flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                Delivery Address
              </p>
              <p className="text-sm">{order.delivery_address}</p>
            </div>
          )}
          
          {/* Latest tracking event */}
          {hasTrackingInfo && (
            <div className="mb-2">
              <p className="text-sm text-gray-500 mb-1 flex items-center">
                <Truck className="h-4 w-4 mr-1" />
                Latest Update
              </p>
              <p className="text-sm">
                {order.tracking[order.tracking.length - 1].details || 
                  `Order ${order.tracking[order.tracking.length - 1].status}`}
              </p>
              <p className="text-xs text-gray-500">
                {formatDateTime(order.tracking[order.tracking.length - 1].timestamp)}
              </p>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="pt-0">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => viewOrderDetail(order.order_id)}
          >
            View Order Details
          </Button>
        </CardFooter>
      </Card>
    );
  };
  
  return (
    <div className="container mx-auto px-4 py-16 max-w-5xl">
      <h1 className="text-3xl font-bold mb-2">My Orders</h1>
      <p className="text-gray-600 mb-8">View and track your orders</p>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}
      
      <Tabs defaultValue="all" value={activeTab} onValueChange={(value) => setActiveTab(value as OrderStatus)}>
        <TabsList className="mb-6">
          <TabsTrigger value="all" className="flex-1">All Orders</TabsTrigger>
          <TabsTrigger value="active" className="flex-1">Active</TabsTrigger>
          <TabsTrigger value="completed" className="flex-1">Completed</TabsTrigger>
          <TabsTrigger value="cancelled" className="flex-1">Cancelled</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
              <span className="ml-3 text-gray-600">Loading orders...</span>
            </div>
          ) : orders.length === 0 ? (
            renderEmptyState()
          ) : (
            <>
              {orders.map(renderOrderCard)}
              {renderPagination()}
            </>
          )}
        </TabsContent>
        
        <TabsContent value="active">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
              <span className="ml-3 text-gray-600">Loading orders...</span>
            </div>
          ) : orders.length === 0 ? (
            renderEmptyState()
          ) : (
            <>
              {orders.map(renderOrderCard)}
              {renderPagination()}
            </>
          )}
        </TabsContent>
        
        <TabsContent value="completed">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
              <span className="ml-3 text-gray-600">Loading orders...</span>
            </div>
          ) : orders.length === 0 ? (
            renderEmptyState()
          ) : (
            <>
              {orders.map(renderOrderCard)}
              {renderPagination()}
            </>
          )}
        </TabsContent>
        
        <TabsContent value="cancelled">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
              <span className="ml-3 text-gray-600">Loading orders...</span>
            </div>
          ) : orders.length === 0 ? (
            renderEmptyState()
          ) : (
            <>
              {orders.map(renderOrderCard)}
              {renderPagination()}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MyOrders;