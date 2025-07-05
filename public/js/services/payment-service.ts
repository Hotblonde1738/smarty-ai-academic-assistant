// PAYMENT SERVICE - Business Logic for Payment Processing
console.log("💳 PAYMENT SERVICE LOADING...");

interface PlanInfo {
  level: string;
  price: number;
  name: string;
  displayName: string;
}

interface Subscription {
  id: string;
  plan: string;
  price: number;
  planName: string;
  startDate: string;
  nextBilling: string;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  customerSchool: string;
  customerGrade: string;
  status: "active" | "cancelled";
  createdAt: string;
  updatedAt: string;
}

interface SubscriptionStatus {
  active: boolean;
  subscription: Subscription | null;
}

class PaymentService {
  private prices: Record<string, number>;
  private planNames: Record<string, string>;

  constructor() {
    this.prices = {
      elementary: 35,
      middle: 35,
      high: 35,
      college: 45,
      nursing: 45,
      tech: 45,
      rotc: 45,
      christian: 45,
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
  }

  // Get plan information
  getPlanInfo(level: string): PlanInfo {
    return {
      level: level,
      price: this.prices[level] || 0,
      name: this.planNames[level] || "Unknown Plan",
      displayName: this.planNames[level] || "Academic Plan",
    };
  }

  // Get all available plans
  getAllPlans(): PlanInfo[] {
    return Object.keys(this.prices).map((level) => this.getPlanInfo(level));
  }

  // Validate plan level
  isValidPlan(level: string): boolean {
    return this.prices.hasOwnProperty(level);
  }

  // Create subscription record
  createSubscription(
    planData: PlanInfo,
    customerData: {
      name: string;
      email: string;
      phone?: string;
      school?: string;
      grade?: string;
    }
  ): Subscription {
    const subscription: Subscription = {
      id: this.generateSubscriptionId(),
      plan: planData.level,
      price: planData.price,
      planName: planData.name,
      startDate: new Date().toISOString(),
      nextBilling: this.getNextBillingDate(),
      customerEmail: customerData.email,
      customerName: customerData.name,
      customerPhone: customerData.phone || "",
      customerSchool: customerData.school || "",
      customerGrade: customerData.grade || "",
      status: "active",
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

  // Get next billing date
  private getNextBillingDate(): string {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return nextMonth.toISOString();
  }

  // Store subscription in local storage
  storeSubscription(subscription: Subscription): boolean {
    try {
      localStorage.setItem(
        "smartypants_subscription",
        JSON.stringify(subscription)
      );
      console.log("✅ Subscription stored locally");
      return true;
    } catch (error) {
      console.error("❌ Failed to store subscription:", error);
      return false;
    }
  }

  // Get stored subscription
  getStoredSubscription(): Subscription | null {
    try {
      const data = localStorage.getItem("smartypants_subscription");
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("❌ Failed to retrieve subscription:", error);
      return null;
    }
  }

  // Check if subscription is active
  isSubscriptionActive(subscription: Subscription | null): boolean {
    if (!subscription) return false;

    // Check if subscription is marked as active
    if (subscription.status !== "active") return false;

    // Check if subscription hasn't expired (optional future enhancement)
    // For now, we'll just check the status

    return true;
  }

  // Cancel subscription
  cancelSubscription(subscriptionId: string): boolean {
    try {
      const subscription = this.getStoredSubscription();
      if (subscription && subscription.id === subscriptionId) {
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

  // Get subscription status
  getSubscriptionStatus(): SubscriptionStatus {
    const subscription = this.getStoredSubscription();
    if (!subscription) {
      return { active: false, subscription: null };
    }

    return {
      active: this.isSubscriptionActive(subscription),
      subscription: subscription,
    };
  }
}

// Create global instance
(window as any).paymentService = new PaymentService();

console.log("✅ PAYMENT SERVICE LOADED SUCCESSFULLY!");
