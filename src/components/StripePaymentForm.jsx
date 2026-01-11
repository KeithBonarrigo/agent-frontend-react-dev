import { useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";
import { useState } from "react";

export default function StripePaymentForm({ clientSecret, onSuccess, onError, isSetupIntent = false }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage("");

    try {
      let result;

      if (isSetupIntent) {
        // For subscriptions with trial - we're saving a payment method
        result = await stripe.confirmSetup({
          elements,
          confirmParams: {
            return_url: window.location.href,
          },
          redirect: "if_required"
        });
      } else {
        // For immediate payments
        result = await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: window.location.href,
          },
          redirect: "if_required"
        });
      }

      if (result.error) {
        setErrorMessage(result.error.message);
        onError(result.error.message);
      } else {
        const intent = result.setupIntent || result.paymentIntent;
        onSuccess({
          paymentIntentId: intent.id,
          status: intent.status,
          amount: intent.amount,
          currency: intent.currency,
          created: intent.created
        });
      }
    } catch (err) {
      setErrorMessage(err.message);
      onError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      
      {errorMessage && (
        <p style={{ color: "red", marginTop: "10px" }}>{errorMessage}</p>
      )}

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        style={{
          width: "100%",
          padding: "12px",
          marginTop: "20px",
          backgroundColor: isProcessing ? "#ccc" : "#1e3a8a",
          color: "white",
          border: "none",
          borderRadius: "4px",
          fontSize: "16px",
          cursor: isProcessing ? "not-allowed" : "pointer"
        }}
      >
        {isProcessing ? "Processing..." : (isSetupIntent ? "Start Free Trial" : "Pay Now")}
      </button>
    </form>
  );
}