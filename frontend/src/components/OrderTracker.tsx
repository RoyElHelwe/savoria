import React, { useState, useEffect } from 'react';
import { Order } from '../services/orderService';

interface OrderTrackerProps {
  order: Order;
  refreshOrder?: () => void;
}

const OrderTracker: React.FC<OrderTrackerProps> = ({ order, refreshOrder }) => {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  
  // Status steps for different order types
  const deliverySteps = ['Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered'];
  const pickupSteps = ['Pending', 'Confirmed', 'Preparing', 'Ready for Pickup', 'Completed'];
  const dineInSteps = ['Pending', 'Confirmed', 'Preparing', 'Served', 'Completed'];
  
  const getSteps = () => {
    switch (order.order_type) {
      case 'pickup': return pickupSteps;
      case 'dine-in': return dineInSteps;
      default: return deliverySteps;
    }
  };
  
  const steps = getSteps();
  
  // Get current step index based on order status
  const getCurrentStepIndex = () => {
    const status = order.status;
    const statusIndex = steps.findIndex(step => 
      step.toLowerCase() === status.toLowerCase()
    );
    return statusIndex !== -1 ? statusIndex : 0;
  };
  
  const currentStepIndex = getCurrentStepIndex();
  
  // Calculate progress percentage
  const progressPercentage = Math.min(
    ((currentStepIndex + 1) / steps.length) * 100,
    100
  );
  
  useEffect(() => {
    // Estimate time remaining based on order status
    // This is a simplified example - in a real app, you'd get this from the backend
    const calculateTimeRemaining = () => {
      const createdTime = new Date(order.created_at).getTime();
      const now = new Date().getTime();
      const elapsedMinutes = Math.floor((now - createdTime) / (1000 * 60));
      
      // Simplified logic - could be more sophisticated based on restaurant data
      let estimatedTotal;
      
      if (order.order_type === 'delivery') {
        estimatedTotal = 45; // 45 minutes for delivery
      } else if (order.order_type === 'pickup') {
        estimatedTotal = 20; // 20 minutes for pickup
      } else {
        estimatedTotal = 15; // 15 minutes for dine-in
      }
      
      const remaining = Math.max(0, estimatedTotal - elapsedMinutes);
      return remaining;
    };
    
    if (currentStepIndex < steps.length - 1) {
      setTimeRemaining(calculateTimeRemaining());
    } else {
      setTimeRemaining(0);
    }
  }, [order, currentStepIndex, steps]);
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Order Status</h3>
        {refreshOrder && (
          <button 
            onClick={refreshOrder}
            className="text-amber-500 hover:text-amber-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        )}
      </div>
      
      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
        <div 
          className="bg-amber-500 h-2.5 rounded-full transition-all duration-500"
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
      
      {/* Status steps */}
      <div className="flex justify-between mb-8">
        {steps.map((step, index) => (
          <div key={step} className="flex flex-col items-center">
            <div 
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                index <= currentStepIndex 
                  ? 'bg-amber-500 text-white' 
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {index < currentStepIndex ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                index + 1
              )}
            </div>
            <span className={`text-xs mt-2 text-center ${
              index <= currentStepIndex ? 'text-gray-900 font-medium' : 'text-gray-500'
            }`}>
              {step}
            </span>
          </div>
        ))}
      </div>
      
      {/* Time estimation */}
      {timeRemaining !== null && timeRemaining > 0 && currentStepIndex < steps.length - 1 && (
        <div className="text-center p-3 bg-amber-50 rounded-md">
          <p className="text-amber-800">
            {order.order_type === 'delivery' ? 'Estimated delivery' : 'Estimated ready'} in <span className="font-bold">{timeRemaining} minutes</span>
          </p>
        </div>
      )}
      
      {/* Order completed message */}
      {currentStepIndex >= steps.length - 1 && (
        <div className="text-center p-3 bg-green-50 rounded-md">
          <p className="text-green-800 font-medium">
            {order.order_type === 'delivery' ? 'Your order has been delivered!' : 'Your order has been completed!'}
          </p>
        </div>
      )}
    </div>
  );
};

export default OrderTracker; 