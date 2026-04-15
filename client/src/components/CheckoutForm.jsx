import React, { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { Lock, Loader2 } from 'lucide-react';

export default function CheckoutForm({ onSuccess, lockedPrice, returnUrl }) {
  const stripe = useStripe();
  const elements = useElements();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // We added a new "isReady" state to track when Stripe is fully mounted and ready to handle payments.
    if (!stripe || !elements || !isReady) return;

    setIsProcessing(true);
    setErrorMessage('');

    try {
        // First, we call elements.submit() to trigger any client-side validation and tokenization of payment details.
        const { error: submitError } = await elements.submit();
        if (submitError) {
            setErrorMessage(submitError.message);
            setIsProcessing(false);
            return;
        }

        // Once validated, securely confirm the payment
        const { error, paymentIntent } = await stripe.confirmPayment({
          elements,
          confirmParams: {
            // The return_url is where Stripe will redirect the user after payment confirmation.
            return_url: returnUrl || `${window.location.origin}/success`, 
          },
          redirect: 'if_required', 
        });

        if (error) {
          setErrorMessage(error.message);
          setIsProcessing(false);
        } else if (paymentIntent && paymentIntent.status === 'succeeded') {
          onSuccess(); 
        } else {
          setErrorMessage("Payment requires further action.");
          setIsProcessing(false);
        }
    } catch (err) {
        setErrorMessage(err.message || "An unexpected error occurred.");
        setIsProcessing(false);
        console.error("Stripe Error:", err);
    }
  };
  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-2xl border border-gray-200 mt-2">
      <div className="mb-4">
        {/* PaymentElement will call this function once it's fully loaded and ready */}
        <PaymentElement onReady={() => setIsReady(true)} />
      </div>
      
      {errorMessage && (
        <div className="text-red-500 text-sm mb-4 font-bold text-center">
          {errorMessage}
        </div>
      )}
      
      <button 
        disabled={isProcessing || !stripe || !elements || !isReady}
        className="w-full bg-green-600 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-green-700 transition disabled:opacity-50"
      >
        {/* Dynamic button text so the user knows what is happening */}
        {!isReady ? (
            <><Loader2 size={16} className="animate-spin" /> Loading Secure Checkout...</>
        ) : isProcessing ? (
            <><Loader2 size={16} className="animate-spin" /> Processing...</>
        ) : (
            <><Lock size={16} /> Pay £{lockedPrice}</>
        )}
      </button>
    </form>
  );
}