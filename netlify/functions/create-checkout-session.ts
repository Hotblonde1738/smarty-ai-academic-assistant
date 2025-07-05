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
    const {
      planLevel,
      planInfo,
      customerData,
      sessionId,
      successUrl,
      cancelUrl,
      useStripeProducts,
      stripeProductId,
      stripePriceId,
    } = body;

    if (!planLevel || !planInfo) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing required parameters" }),
      };
    }

    // Create line items using Stripe Price IDs
    let lineItems;

    if (stripePriceId) {
      // Use real Stripe price ID (recommended approach)
      lineItems = [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ];
    } else {
      // Fallback to product-based pricing if no price ID
      lineItems = [
        {
          price_data: {
            currency: "usd",
            product: stripeProductId,
            recurring: {
              interval: "month" as const,
            },
            unit_amount: planInfo.price, // Amount in cents
          },
          quantity: 1,
        },
      ];
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "subscription", // Always subscription mode now
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        planLevel,
        sessionId,
        customerEmail: customerData.email || "",
        customerName: customerData.name || "",
        planName: planInfo.name,
      },
      customer_email: customerData.email,
      billing_address_collection: "auto",
      allow_promotion_codes: true,
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        sessionUrl: session.url,
        sessionId: session.id,
      }),
    };
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Failed to create checkout session",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
};
