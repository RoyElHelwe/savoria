import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  getUserReservations, 
  cancelReservation,
  getReservationStatusInfo,
  isReservationInPast,
  formatReservationDateTime,
  Reservation,
  Pagination 
} from '../../services/reservationServicev2';
import { formatDate, formatTime } from '../../utils/dateUtils';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  AlertCircle,
  Calendar,
  Clock,
  Users,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  X,
  CheckCircle,
  MessageSquare,
  MapPin
} from 'lucide-react';
import { Textarea } from '../../components/ui/textarea';

type ReservationStatus = 'all' | 'upcoming' | 'past' | 'confirmed' | 'pending' | 'cancelled';

const MyReservations = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ReservationStatus>('upcoming');
  
  // Cancellation dialog state
  const [cancellationDialogOpen, setCancellationDialogOpen] = useState(false);
  const [reservationToCancel, setReservationToCancel] = useState<Reservation | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  
  // Pagination state
  const [pagination, setPagination] = useState<Pagination>({
    current_page: 1,
    per_page: 5,
    total_items: 0,
    total_pages: 0
  });
  
  // Load reservations on component mount and when tab or page changes
  useEffect(() => {
    const fetchReservations = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Map tab values to API status filter
        let statusFilter: string | undefined;
        let upcomingFilter = false;
        
        switch (activeTab) {
          case 'upcoming':
            upcomingFilter = true;
            break;
          case 'past':
            upcomingFilter = false;
            // We don't set a status filter here, as we want all past reservations
            break;
          case 'confirmed':
            statusFilter = 'confirmed';
            break;
          case 'pending':
            statusFilter = 'pending';
            break;
          case 'cancelled':
            statusFilter = 'cancelled';
            break;
          default:
            // 'all' tab - no filters
            break;
        }
        
        const response = await getUserReservations(
          pagination.current_page, 
          pagination.per_page, 
          statusFilter,
          upcomingFilter
        );
        
        setReservations(response.reservations);
        setPagination(response.pagination);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load reservations');
        console.error('Error loading reservations:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchReservations();
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
  
  // Open cancellation dialog
  const openCancellationDialog = (reservation: Reservation) => {
    setReservationToCancel(reservation);
    setCancellationReason('');
    setCancellationDialogOpen(true);
  };
  
  // Handle reservation cancellation
  const handleCancelReservation = async () => {
    if (!reservationToCancel) return;
    
    setCancelling(true);
    
    try {
      const response = await cancelReservation(
        reservationToCancel.id,
        cancellationReason.trim() ? cancellationReason : undefined
      );
      
      // Update the reservation in the local state
      setReservations(prevReservations =>
        prevReservations.map(res =>
          res.id === reservationToCancel.id
            ? { ...res, status: 'cancelled', can_be_cancelled: false }
            : res
        )
      );
      
      // Close the dialog
      setCancellationDialogOpen(false);
      
      // Show success toast

    } catch (err) {
      // Show error toast
      
    } finally {
      setCancelling(false);
    }
  };
  
  // Render pagination controls
  const renderPagination = () => {
    if (pagination.total_pages <= 1) return null;
    
    return (
      <div className="flex items-center justify-between mt-6">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            Showing {reservations.length} of {pagination.total_items} reservations
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
            {Array.from({ length: Math.min(pagination.total_pages, 5) }, (_, i) => {
              // For many pages, show first page, last page, current page and pages around current page
              if (pagination.total_pages <= 5) {
                return i + 1;
              }
              
              const currentPage = pagination.current_page;
              
              if (i === 0) return 1;
              if (i === 4) return pagination.total_pages;
              
              if (currentPage <= 2) return i + 1;
              if (currentPage >= pagination.total_pages - 1) return pagination.total_pages - 4 + i;
              
              return currentPage - 1 + i;
            }).map(page => (
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
          <CalendarDays className="h-12 w-12 text-gray-400" />
        </div>
      </div>
      <h3 className="mt-6 text-lg font-medium text-gray-900">No reservations found</h3>
      <p className="mt-2 text-gray-500 max-w-md mx-auto">
        {activeTab === 'upcoming' 
          ? "You don't have any upcoming reservations."
          : activeTab === 'past'
          ? "You don't have any past reservations."
          : activeTab === 'confirmed'
          ? "You don't have any confirmed reservations."
          : activeTab === 'pending'
          ? "You don't have any pending reservations."
          : activeTab === 'cancelled'
          ? "You don't have any cancelled reservations."
          : "You haven't made any reservations yet."
        }
      </p>
      <div className="mt-6">
        <Button asChild>
          <Link to="/reservations">Make a Reservation</Link>
        </Button>
      </div>
    </div>
  );
  
  // Render reservation card
  const renderReservationCard = (reservation: Reservation) => {
    const { label, color } = getReservationStatusInfo(reservation.status);
    const isPast = isReservationInPast(reservation.date, reservation.time);
    
    return (
      <Card key={reservation.id} className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">Reservation #{reservation.id}</CardTitle>
              <CardDescription>
                Booked on {formatDate(reservation.created_at)}
              </CardDescription>
            </div>
            <Badge className={color}>{label}</Badge>
          </div>
        </CardHeader>
        
        <CardContent className="pb-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-500 mb-1 flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                Date
              </p>
              <p className="text-sm font-medium">{formatDate(reservation.date)}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 mb-1 flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                Time
              </p>
              <p className="text-sm font-medium">{formatTime(reservation.time)}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 mb-1 flex items-center">
                <Users className="h-4 w-4 mr-1" />
                Party Size
              </p>
              <p className="text-sm font-medium">{reservation.guests} {reservation.guests === 1 ? 'person' : 'people'}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 mb-1 flex items-center">
                <Phone className="h-4 w-4 mr-1" />
                Contact
              </p>
              <p className="text-sm font-medium">{reservation.phone}</p>
            </div>
          </div>
          
          {/* Special requests */}
          {reservation.special_requests && (
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-1 flex items-center">
                <MessageSquare className="h-4 w-4 mr-1" />
                Special Requests
              </p>
              <p className="text-sm bg-gray-50 p-2 rounded">
                {reservation.special_requests}
              </p>
            </div>
          )}
          
          {/* Reservation info message based on status */}
          <div className={`p-3 rounded-md ${
            reservation.status === 'confirmed' 
              ? 'bg-green-50 text-green-800'
              : reservation.status === 'pending'
              ? 'bg-yellow-50 text-yellow-800'
              : 'bg-gray-50 text-gray-800'
          }`}>
            {reservation.status === 'confirmed' ? (
              <p className="text-sm flex items-start">
                <CheckCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                <span>
                  Your reservation is confirmed for {formatReservationDateTime(reservation.date, reservation.time)}.
                  {!isPast && " Please arrive on time. If you need to cancel, please do so at least 2 hours before your reservation."}
                </span>
              </p>
            ) : reservation.status === 'pending' ? (
              <p className="text-sm flex items-start">
                <Clock className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                <span>
                  Your reservation is pending confirmation. We'll notify you when it's confirmed.
                  You can cancel this reservation if needed.
                </span>
              </p>
            ) : (
              <p className="text-sm flex items-start">
                <X className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                <span>
                  This reservation has been cancelled.
                </span>
              </p>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="pt-0">
          <div className="flex flex-col sm:flex-row w-full gap-2">
            {reservation.can_be_cancelled && (
              <Button 
                variant="outline" 
                className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={() => openCancellationDialog(reservation)}
              >
                Cancel Reservation
              </Button>
            )}
            
            {reservation.status === 'cancelled' && (
              <Button 
                variant="default" 
                className="w-full"
                asChild
              >
                <Link to="/reservations">
                  Make New Reservation
                </Link>
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    );
  };
  
  return (
    <div className="container mx-auto px-4 py-16 max-w-5xl">
      <h1 className="text-3xl font-bold mb-2">My Reservations</h1>
      <p className="text-gray-600 mb-8">View and manage your dining reservations</p>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}
      
      <div className="flex justify-between mb-6">
        <Tabs 
          defaultValue="upcoming" 
          value={activeTab} 
          onValueChange={(value) => setActiveTab(value as ReservationStatus)}
          className="w-full"
        >
          <TabsList className="grid grid-cols-3 md:grid-cols-6">
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="confirmed" className="hidden md:block">Confirmed</TabsTrigger>
            <TabsTrigger value="pending" className="hidden md:block">Pending</TabsTrigger>
            <TabsTrigger value="cancelled" className="hidden md:block">Cancelled</TabsTrigger>
          </TabsList>
          
          {/* Mobile filter tabs - only visible on small screens */}
          <div className="md:hidden mt-2">
            <div className="grid grid-cols-3 gap-1">
              <Button 
                variant={activeTab === 'confirmed' ? 'default' : 'outline'} 
                size="sm" 
                className="text-xs"
                onClick={() => setActiveTab('confirmed')}
              >
                Confirmed
              </Button>
              <Button 
                variant={activeTab === 'pending' ? 'default' : 'outline'} 
                size="sm" 
                className="text-xs"
                onClick={() => setActiveTab('pending')}
              >
                Pending
              </Button>
              <Button 
                variant={activeTab === 'cancelled' ? 'default' : 'outline'} 
                size="sm" 
                className="text-xs"
                onClick={() => setActiveTab('cancelled')}
              >
                Cancelled
              </Button>
            </div>
          </div>
          
          <div className="mt-6">
            {/* Tab content */}
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
                <span className="ml-3 text-gray-600">Loading reservations...</span>
              </div>
            ) : reservations.length === 0 ? (
              renderEmptyState()
            ) : (
              <>
                {reservations.map(renderReservationCard)}
                {renderPagination()}
              </>
            )}
          </div>
        </Tabs>
      </div>
      
      {/* Actions */}
      <div className="mt-8 flex justify-center">
        <Button asChild className="px-8">
          <Link to="/reservations">Make a New Reservation</Link>
        </Button>
      </div>
      
      {/* Cancellation Dialog */}
      <Dialog open={cancellationDialogOpen} onOpenChange={setCancellationDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Reservation</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this reservation? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {reservationToCancel && (
            <div className="py-4">
              <div className="mb-4 bg-gray-50 p-4 rounded-md">
                <p className="font-medium">Reservation Details</p>
                <p className="text-sm text-gray-600">
                  {formatDate(reservationToCancel.date)} at {formatTime(reservationToCancel.time)} for {reservationToCancel.guests} {reservationToCancel.guests === 1 ? 'person' : 'people'}
                </p>
              </div>
              
              <div className="mb-4">
                <label htmlFor="cancellation-reason" className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for Cancellation (Optional)
                </label>
                <Textarea
                  id="cancellation-reason"
                  placeholder="Please let us know why you're cancelling..."
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          )}
          
          <DialogFooter className="flex flex-col sm:flex-row sm:justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => setCancellationDialogOpen(false)}
              disabled={cancelling}
            >
              Keep Reservation
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleCancelReservation}
              disabled={cancelling}
            >
              {cancelling ? (
                <>
                  <span className="mr-2">Cancelling</span>
                  <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                </>
              ) : (
                'Cancel Reservation'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyReservations;