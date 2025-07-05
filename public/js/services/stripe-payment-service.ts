// STRIPE PAYMENT SERVICE - Stripe Integration for SmartyPants-AI
console.log("💳 STRIPE PAYMENT SERVICE LOADING...");

interface StripePlanInfo {
  level: string;
  price: number;
  priceDisplay: string;
  name: string;
  description: string;
  displayName: string;
  stripeProductId: string;
  stripePriceId: string;
  useStripeProducts: boolean;
}

interface CustomerData {
  name?: string;
  email: string;
  phone?: string;
}

interface SessionData {
  planLevel: string;
  planInfo: StripePlanInfo;
  customerData: CustomerData;
  createdAt: string;
  status: string;
}

interface StripeSubscription {
  id: string;
  plan: string;
  price: number;
  priceDisplay: string;
  planName: string;
  startDate: string;
  expiryDate: string;
  customerEmail: string;
  customerName: string;
  status: "active" | "cancelled";
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
}

interface StripeSubscriptionStatus {
  active: boolean;
  subscription: StripeSubscription | null;
}

interface CheckoutSessionResult {
  success: boolean;
  sessionUrl?: string;
  sessionId?: string;
  error?: string;
}

interface PaymentValidationResult {
  success: boolean;
  subscription?: StripeSubscription;
  sessionData?: SessionData;
  error?: string;
}

interface PaymentReturnResult {
  success: boolean;
  sessionId?: string;
  plan?: string;
  canceled?: boolean;
}

class StripePaymentService {
  private baseUrl: string;
  private stripeProducts: Record<string, string>;
  private stripePrices: Record<string, string>;
  private planPrices: Record<string, number>;
  private planNames: Record<string, string>;
  private planDescriptions: Record<string, string>;

  constructor() {
    this.baseUrl = window.location.origin;

    // Stripe Product IDs - Live Mode
    this.stripeProducts = {
      elementary: "prod_ScndmmFdO79wHt", // Elementary School | Monthly Subscription
      middle: "prod_ScnccqcxbaAdCd", // Middle School | Monthly Subscription
      high: "prod_ScnagjhPveOLiE", // High School | Monthly Subscription
      college: "prod_ScnZnoUxbWdFmc", // College | Monthly Subscription
      nursing: "prod_ScnYoGo8b44wuY", // Nursing Excellence | Monthly Subscription
      tech: "prod_ScnXQ0rATsMicd", // Technical School | Monthly Subscription
      rotc: "prod_ScnVce4EJhIBbg", // ROTC Excellence | Monthly Subscription
      christian: "prod_ScneQFP71aYeTQ", // Faith-Based Education | Monthly Subscription
    };

    // Stripe Price IDs - Live Mode
    this.stripePrices = {
      elementary: "price_1RhY26JBFSNMjE4bzy8YEp7M", // $35.00/month
      middle: "price_1RhY1OJBFSNMjE4b5cGCGxBp", // $35.00/month
      high: "price_1RhXzmJBFSNMjE4b5Ga3oqnv", // $35.00/month
      college: "price_1RhXyYJBFSNMjE4bhbphqpqY", // $45.00/month
      nursing: "price_1RhXxPJBFSNMjE4bxzrdzGi6", // $45.00/month
      tech: "price_1RhXwDJBFSNMjE4b7IHXTTMh", // $45.00/month
      rotc: "price_1RhXuJJBFSNMjE4bJ6jOeFAH", // $45.00/month
      christian: "price_1RhY3BJBFSNMjE4bcP20tHn0", // $45.00/month
    };

    // Plan prices (for display purposes)
    this.planPrices = {
      elementary: 3500, // $35.00 in cents
      middle: 3500, // $35.00 in cents
      high: 3500, // $35.00 in cents
      college: 4500, // $45.00 in cents
      nursing: 4500, // $45.00 in cents
      tech: 4500, // $45.00 in cents
      rotc: 4500, // $45.00 in cents
      christian: 4500, // $45.00 in cents
    };

    this.planNames = {
      elementary: "Elementary School",
      middle: "Middle School",
      high: "High School",
      college: "College",
      nursing: "Nursing Excellence",
      tech: "Technical School",
      rotc: "ROTC Excellence",
      christian: "Faith-Based Education",
    };

    this.planDescriptions = {
      elementary:
        "Unlimited Essay Writing, 24/7 Tutoring Help, All Subjects Support, Interactive Learning Games",
      middle:
        "Unlimited Essay Writing, 24/7 Tutoring Help, All Subjects Support, Study Skills Training",
      high: "Advanced Essay Writing, 24/7 Expert Tutoring, SAT/ACT Prep, College Application Help",
      college:
        "Research Paper Support, Advanced Topic Coverage, Career Guidance, Thesis Development",
      nursing:
        "NCLEX Exam Preparation, Clinical Case Studies, Medical Terminology, Anatomy & Physiology",
      tech: "Programming Support, Engineering Help, Technical Writing, Project Guidance",
      rotc: "Physical Fitness Training, Leadership Development, Military Science Support, Field Training Prep",
      christian:
        "Faith-Integrated Learning, Biblical Studies Support, Theology & Ministry Help, Character Development",
    };
  }

  // Get plan information
  getPlanInfo(level: string): StripePlanInfo {
    const stripeProductId = this.stripeProducts[level];
    const stripePriceId = this.stripePrices[level];
    const price = this.planPrices[level];

    return {
      level: level,
      price: price,
      priceDisplay: `$${(price / 100).toFixed(2)}`,
      name: this.planNames[level],
      description: this.planDescriptions[level],
      displayName: this.planNames[level] || "Academic Plan",
      stripeProductId: stripeProductId,
      stripePriceId: stripePriceId,
      useStripeProducts: true,
    };
  }

  // Get all available plans
  getAllPlans(): StripePlanInfo[] {
    return Object.keys(this.planPrices).map((level) => this.getPlanInfo(level));
  }

  // Validate plan level
  isValidPlan(level: string): boolean {
    return this.planPrices.hasOwnProperty(level);
  }

  // Create Stripe checkout session
  async createCheckoutSession(
    planLevel: string,
    customerData?: CustomerData
  ): Promise<CheckoutSessionResult> {
    try {
      console.log(`💳 Creating Stripe checkout session for ${planLevel} plan`);

      const planInfo = this.getPlanInfo(planLevel);
      if (!planInfo) {
        throw new Error(`Invalid plan level: ${planLevel}`);
      }

      // Generate session ID for tracking
      const sessionId = this.generateSessionId();

      // Store session data for validation
      this.storeSessionData(sessionId, {
        planLevel,
        planInfo,
        customerData: customerData || {
          email: "",
          name: undefined,
          phone: undefined,
        },
        createdAt: new Date().toISOString(),
        status: "pending",
      });

      const response = await fetch(
        "/.netlify/functions/create-checkout-session",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            planLevel,
            planInfo,
            customerData,
            sessionId,
            useStripeProducts: planInfo.useStripeProducts,
            stripeProductId: planInfo.stripeProductId,
            stripePriceId: planInfo.stripePriceId,
            successUrl: `${this.baseUrl}/?session_id={CHECKOUT_SESSION_ID}&plan=${planLevel}`,
            cancelUrl: `${this.baseUrl}/?canceled=true`,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.sessionUrl) {
        console.log("✅ Stripe checkout session created successfully");
        return {
          success: true,
          sessionUrl: result.sessionUrl,
          sessionId: sessionId,
        };
      } else {
        throw new Error(result.error || "Failed to create checkout session");
      }
    } catch (error) {
      console.error("❌ Failed to create checkout session:", error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  // Redirect to Stripe checkout
  async redirectToCheckout(
    planLevel: string,
    customerData?: CustomerData
  ): Promise<void> {
    const result = await this.createCheckoutSession(planLevel, customerData);

    if (result.success && result.sessionUrl && result.sessionId) {
      // Store the session ID for validation after payment
      localStorage.setItem("stripe_session_id", result.sessionId);

      // Redirect to Stripe checkout
      window.location.href = result.sessionUrl;
    } else {
      throw new Error(result.error || "Failed to create checkout session");
    }
  }

  // Validate payment completion
  async validatePayment(sessionId: string): Promise<PaymentValidationResult> {
    try {
      console.log(`💳 Validating payment for session: ${sessionId}`);

      const response = await fetch("/.netlify/functions/validate-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.paymentValid) {
        // Create subscription record
        const subscription = this.createSubscription(result.sessionData);

        // Store subscription locally
        this.storeSubscription(subscription);

        // Clear session data
        this.clearSessionData(sessionId);

        console.log("✅ Payment validated successfully");
        return {
          success: true,
          subscription,
          sessionData: result.sessionData,
        };
      } else {
        throw new Error(result.error || "Payment validation failed");
      }
    } catch (error) {
      console.error("❌ Payment validation failed:", error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  // Check if user has active subscription
  hasActiveSubscription(): boolean {
    const subscription = this.getStoredSubscription();
    if (!subscription) return false;

    // Check if subscription is active and not expired
    if (subscription.status !== "active") return false;

    // Check if subscription hasn't expired (1 month from start date)
    const startDate = new Date(subscription.startDate);
    const expiryDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
    const now = new Date();

    return now < expiryDate;
  }

  // Get subscription status
  getSubscriptionStatus(): StripeSubscriptionStatus {
    const subscription = this.getStoredSubscription();
    if (!subscription) {
      return { active: false, subscription: null };
    }

    const isActive = this.hasActiveSubscription();
    return {
      active: isActive,
      subscription: subscription,
    };
  }

  // Create subscription record
  private createSubscription(sessionData: SessionData): StripeSubscription {
    const subscription: StripeSubscription = {
      id: this.generateSubscriptionId(),
      plan: sessionData.planLevel,
      price: sessionData.planInfo.price,
      priceDisplay: sessionData.planInfo.priceDisplay,
      planName: sessionData.planInfo.name,
      startDate: new Date().toISOString(),
      expiryDate: this.getExpiryDate(),
      customerEmail: sessionData.customerData.email || "",
      customerName: sessionData.customerData.name || "",
      status: "active",
      paymentMethod: "stripe",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return subscription;
  }

  // Generate unique subscription ID
  private generateSubscriptionId(): string {
    return (
      "SUB-" +
      Date.now() +
      "-" +
      Math.random().toString(36).substr(2, 9).toUpperCase()
    );
  }

  // Generate session ID
  private generateSessionId(): string {
    return (
      "SESS-" +
      Date.now() +
      "-" +
      Math.random().toString(36).substr(2, 9).toUpperCase()
    );
  }

  // Get expiry date (1 month from now)
  private getExpiryDate(): string {
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 1);
    return expiryDate.toISOString();
  }

  // Store session data
  private storeSessionData(sessionId: string, data: SessionData): void {
    try {
      const sessions = JSON.parse(
        localStorage.getItem("stripe_sessions") || "{}"
      );
      sessions[sessionId] = data;
      localStorage.setItem("stripe_sessions", JSON.stringify(sessions));
      console.log("✅ Session data stored locally");
    } catch (error) {
      console.error("❌ Failed to store session data:", error);
    }
  }

  // Get session data
  private getSessionData(sessionId: string): SessionData | null {
    try {
      const sessions = JSON.parse(
        localStorage.getItem("stripe_sessions") || "{}"
      );
      return sessions[sessionId] || null;
    } catch (error) {
      console.error("❌ Failed to retrieve session data:", error);
      return null;
    }
  }

  // Clear session data
  private clearSessionData(sessionId: string): void {
    try {
      const sessions = JSON.parse(
        localStorage.getItem("stripe_sessions") || "{}"
      );
      delete sessions[sessionId];
      localStorage.setItem("stripe_sessions", JSON.stringify(sessions));
      console.log("✅ Session data cleared");
    } catch (error) {
      console.error("❌ Failed to clear session data:", error);
    }
  }

  // Store subscription in local storage
  private storeSubscription(subscription: StripeSubscription): boolean {
    try {
      localStorage.setItem(
        "smartypants_stripe_subscription",
        JSON.stringify(subscription)
      );
      console.log("✅ Stripe subscription stored locally");
      return true;
    } catch (error) {
      console.error("❌ Failed to store subscription:", error);
      return false;
    }
  }

  // Get stored subscription
  private getStoredSubscription(): StripeSubscription | null {
    try {
      const data = localStorage.getItem("smartypants_stripe_subscription");
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("❌ Failed to retrieve subscription:", error);
      return null;
    }
  }

  // Cancel subscription
  cancelSubscription(): boolean {
    try {
      const subscription = this.getStoredSubscription();
      if (subscription) {
        subscription.status = "cancelled";
        subscription.updatedAt = new Date().toISOString();
        this.storeSubscription(subscription);
        console.log("✅ Subscription cancelled");
        return true;
      }
      return false;
    } catch (error) {
      console.error("❌ Failed to cancel subscription:", error);
      return false;
    }
  }

  // Handle URL parameters for payment completion
  handlePaymentReturn(): PaymentReturnResult {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get("session_id");
    const plan = urlParams.get("plan");
    const canceled = urlParams.get("canceled");

    if (canceled === "true") {
      console.log("❌ Payment was canceled");
      // Clear any stored session data
      const storedSessionId = localStorage.getItem("stripe_session_id");
      if (storedSessionId) {
        this.clearSessionData(storedSessionId);
        localStorage.removeItem("stripe_session_id");
      }
      return { success: false, canceled: true };
    }

    if (sessionId && plan) {
      console.log(
        `💳 Payment completed for plan: ${plan}, session: ${sessionId}`
      );
      return { success: true, sessionId, plan };
    }

    return { success: false };
  }
}

// Create global instance
(window as any).stripePaymentService = new StripePaymentService();

console.log("✅ STRIPE PAYMENT SERVICE LOADED SUCCESSFULLY!");
