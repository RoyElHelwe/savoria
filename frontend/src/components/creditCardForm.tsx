import React, { useState } from 'react';

interface CreditCardFormProps {
  onPaymentComplete: (paymentData: PaymentResult) => void;
  amount: number;
  onCancel: () => void;
  isProcessing: boolean;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  cardLast4?: string;
  error?: string;
}

interface CardData {
  cardNumber: string;
  cardHolder: string;
  expiryDate: string;
  cvv: string;
}

const CreditCardForm: React.FC<CreditCardFormProps> = ({ 
  onPaymentComplete, 
  amount, 
  onCancel,
  isProcessing
}) => {
  const [cardData, setCardData] = useState<CardData>({
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    cvv: ''
  });
  const [errors, setErrors] = useState<Partial<CardData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  // Format expiry date MM/YY
  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    
    if (v.length >= 3) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    } 
    return v;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Apply formatting based on field
    let formattedValue = value;
    if (name === 'cardNumber') {
      formattedValue = formatCardNumber(value);
    } else if (name === 'expiryDate') {
      formattedValue = formatExpiryDate(value);
    } else if (name === 'cvv') {
      formattedValue = value.replace(/[^0-9]/g, '').substring(0, 4);
    }

    setCardData({
      ...cardData,
      [name]: formattedValue
    });

    // Clear error for this field if user is typing
    if (errors[name as keyof CardData]) {
      setErrors({
        ...errors,
        [name]: undefined
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<CardData> = {};
    let isValid = true;

    // Card number validation (simple check: 16 digits)
    const cardNumberDigits = cardData.cardNumber.replace(/\s/g, '');
    if (!cardNumberDigits || cardNumberDigits.length !== 16) {
      newErrors.cardNumber = 'Please enter a valid 16-digit card number';
      isValid = false;
    }

    // Card holder validation
    if (!cardData.cardHolder.trim()) {
      newErrors.cardHolder = 'Please enter the cardholder name';
      isValid = false;
    }

    // Expiry date validation (MM/YY format)
    const expiryPattern = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
    if (!expiryPattern.test(cardData.expiryDate)) {
      newErrors.expiryDate = 'Please enter a valid expiry date (MM/YY)';
      isValid = false;
    } else {
      // Check if card is expired
      const [month, year] = cardData.expiryDate.split('/');
      const expiryDate = new Date(2000 + parseInt(year), parseInt(month) - 1, 1);
      const today = new Date();
      
      if (expiryDate < today) {
        newErrors.expiryDate = 'Card has expired';
        isValid = false;
      }
    }

    // CVV validation (3-4 digits)
    if (!cardData.cvv || cardData.cvv.length < 3 || cardData.cvv.length > 4) {
      newErrors.cvv = 'Please enter a valid 3 or 4 digit CVV';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting || isProcessing) return;
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // In a real implementation, you would call your payment gateway API here
      // For this example, we'll simulate a successful payment with a timeout
      setTimeout(() => {
        // Simulate successful payment (in real app, this would be the response from payment API)
        const cardLast4 = cardData.cardNumber.replace(/\s/g, '').slice(-4);
        
        const paymentResult: PaymentResult = {
          success: true,
          transactionId: 'txn_' + Math.random().toString(36).substring(2, 10),
          cardLast4
        };
        
        onPaymentComplete(paymentResult);
        setIsSubmitting(false);
      }, 2000);
    } catch (error) {
      console.error('Payment error:', error);
      onPaymentComplete({
        success: false,
        error: 'Payment processing failed. Please try again.'
      });
      setIsSubmitting(false);
    }
  };

  const getCardType = (cardNumber: string): string => {
    // This is a simplified check for demo purposes
    const number = cardNumber.replace(/\s+/g, '');
    
    if (number.startsWith('4')) {
      return 'visa';
    } else if (number.startsWith('5')) {
      return 'mastercard';
    } else if (number.startsWith('3')) {
      return 'amex';
    } else if (number.startsWith('6')) {
      return 'discover';
    }
    return '';
  };

  const cardType = getCardType(cardData.cardNumber);

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold">Credit Card Payment</h3>
        <div className="text-amber-600 font-bold">${amount.toFixed(2)}</div>
      </div>
      
      {/* Card icons */}
      <div className="flex space-x-2 mb-6">
        <div className={`h-6 w-10 rounded border ${cardType === 'visa' ? 'border-blue-500' : 'border-gray-300'} p-0.5`}>
          <div className="text-xs font-bold text-blue-700">VISA</div>
        </div>
        <div className={`h-6 w-10 rounded border ${cardType === 'mastercard' ? 'border-red-500' : 'border-gray-300'} p-0.5`}>
          <div className="text-xs font-bold text-red-700">MC</div>
        </div>
        <div className={`h-6 w-10 rounded border ${cardType === 'amex' ? 'border-green-500' : 'border-gray-300'} p-0.5`}>
          <div className="text-xs font-bold text-green-700">AMEX</div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {/* Card Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Card Number
            </label>
            <input
              type="text"
              name="cardNumber"
              value={cardData.cardNumber}
              onChange={handleInputChange}
              placeholder="1234 5678 9012 3456"
              className={`w-full px-3 py-2 border ${errors.cardNumber ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500`}
              maxLength={19} // 16 digits + 3 spaces
              autoComplete="cc-number"
            />
            {errors.cardNumber && (
              <p className="mt-1 text-sm text-red-600">{errors.cardNumber}</p>
            )}
          </div>
          
          {/* Card Holder */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cardholder Name
            </label>
            <input
              type="text"
              name="cardHolder"
              value={cardData.cardHolder}
              onChange={handleInputChange}
              placeholder="John Smith"
              className={`w-full px-3 py-2 border ${errors.cardHolder ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500`}
              autoComplete="cc-name"
            />
            {errors.cardHolder && (
              <p className="mt-1 text-sm text-red-600">{errors.cardHolder}</p>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Expiry Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expiry Date
              </label>
              <input
                type="text"
                name="expiryDate"
                value={cardData.expiryDate}
                onChange={handleInputChange}
                placeholder="MM/YY"
                className={`w-full px-3 py-2 border ${errors.expiryDate ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500`}
                maxLength={5} // MM/YY format
                autoComplete="cc-exp"
              />
              {errors.expiryDate && (
                <p className="mt-1 text-sm text-red-600">{errors.expiryDate}</p>
              )}
            </div>
            
            {/* CVV */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CVV
              </label>
              <input
                type="text"
                name="cvv"
                value={cardData.cvv}
                onChange={handleInputChange}
                placeholder="123"
                className={`w-full px-3 py-2 border ${errors.cvv ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500`}
                maxLength={4}
                autoComplete="cc-csc"
              />
              {errors.cvv && (
                <p className="mt-1 text-sm text-red-600">{errors.cvv}</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex justify-between mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
            disabled={isSubmitting || isProcessing}
          >
            Cancel
          </button>
          
          <button
            type="submit"
            className="px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-colors disabled:opacity-50"
            disabled={isSubmitting || isProcessing}
          >
            {isSubmitting || isProcessing ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing
              </div>
            ) : (
              `Pay $${amount.toFixed(2)}`
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreditCardForm;