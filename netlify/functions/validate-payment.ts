import { Handler } from "@netlify/functions";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

export const handler: Handler = async (event) => {
  // Enable CORS
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  // Handle preflight requests
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const { sessionId } = body;

    if (!sessionId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Session ID is required" }),
      };
    }

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Check if payment was successful
    if (session.payment_status === "paid") {
      // Extract metadata
      const metadata = session.metadata || {};
      const planLevel = metadata.planLevel;
      const customerEmail = metadata.customerEmail;
      const customerName = metadata.customerName;

      // Create session data for the frontend
      const sessionData = {
        planLevel,
        planInfo: {
          level: planLevel,
          price: session.amount_total || 0,
          priceDisplay: `$${((session.amount_total || 0) / 100).toFixed(2)}`,
          name: metadata.planName || "Academic Plan",
        },
        customerData: {
          email: customerEmail,
          name: customerName,
        },
        paymentId: session.payment_intent as string,
        sessionId: session.id,
        amountPaid: session.amount_total,
        currency: session.currency,
        paymentStatus: session.payment_status,
        createdAt: new Date().toISOString(),
      };

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          paymentValid: true,
          sessionData,
        }),
      };
    } else {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          paymentValid: false,
          error: "Payment not completed",
        }),
      };
    }
  } catch (error) {
    console.error("Error validating payment:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Failed to validate payment",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
};
