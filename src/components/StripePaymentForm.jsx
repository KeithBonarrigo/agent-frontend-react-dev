import { useState } from "react";
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

export default function StripePaymentForm({ clientSecret, onSuccess, onError }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setMessage("");

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + "/payment-success",
        },
        redirect: "if_required",
      });

      if (error) {
        setMessage(error.message || "An error occurred during payment");
        onError(error.message || "Payment failed");
        setIsProcessing(false);
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        setMessage("Payment successful!");
        onSuccess({
          paymentIntentId: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          created: paymentIntent.created
        });
      } else {
        setMessage("Payment processing...");
        setIsProcessing(false);
      }
    } catch (err) {
      console.error("Payment error:", err);
      setMessage("An unexpected error occurred");
      onError("An unexpected error occurred");
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: "100%" }}>
      <PaymentElement 
        options={{
          layout: "tabs"
        }}
      />
      
      {message && (
        <div
          style={{
            marginTop: "15px",
            padding: "10px",
            borderRadius: "4px",
            backgroundColor: message.includes("successful") ? "#d4edda" : "#f8d7da",
            color: message.includes("successful") ? "#155724" : "#721c24",
            border: `1px solid ${message.includes("successful") ? "#c3e6cb" : "#f5c6cb"}`,
            fontSize: "14px"
          }}
        >
          {message}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        style={{
          width: "100%",
          marginTop: "20px",
          padding: "14px",
          backgroundColor: isProcessing ? "#6c757d" : "#28a745",
          color: "white",
          border: "none",
          borderRadius: "4px",
          fontSize: "16px",
          fontWeight: "bold",
          cursor: isProcessing ? "not-allowed" : "pointer",
          opacity: isProcessing ? 0.7 : 1,
          transition: "all 0.2s"
        }}
      >
        {isProcessing ? "Processing..." : "Pay Now"}
      </button>

      <p style={{ 
        marginTop: "15px", 
        fontSize: "12px", 
        color: "#666", 
        textAlign: "center" 
      }}>
        🔒 Your payment information is secure and encrypted
      </p>
    </form>
  );
}
