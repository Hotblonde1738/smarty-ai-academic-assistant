"use strict";
// PAYMENT SERVICE - Business Logic for Payment Processing
console.log("💳 PAYMENT SERVICE LOADING...");
class PaymentService {
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
    getPlanInfo(level) {
        return {
            level: level,
            price: this.prices[level] || 0,
            name: this.planNames[level] || "Unknown Plan",
            displayName: this.planNames[level] || "Academic Plan",
        };
    }
    // Get all available plans
    getAllPlans() {
        return Object.keys(this.prices).map((level) => this.getPlanInfo(level));
    }
    // Validate plan level
    isValidPlan(level) {
        return this.prices.hasOwnProperty(level);
    }
    // Create subscription record
    createSubscription(planData, customerData) {
        const subscription = {
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
    generateSubscriptionId() {
        return ("SUB-" +
            Date.now() +
            "-" +
            Math.random().toString(36).substr(2, 9).toUpperCase());
    }
    // Get next billing date
    getNextBillingDate() {
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        return nextMonth.toISOString();
    }
    // Store subscription in local storage
    storeSubscription(subscription) {
        try {
            localStorage.setItem("smartypants_subscription", JSON.stringify(subscription));
            console.log("✅ Subscription stored locally");
            return true;
        }
        catch (error) {
            console.error("❌ Failed to store subscription:", error);
            return false;
        }
    }
    // Get stored subscription
    getStoredSubscription() {
        try {
            const data = localStorage.getItem("smartypants_subscription");
            return data ? JSON.parse(data) : null;
        }
        catch (error) {
            console.error("❌ Failed to retrieve subscription:", error);
            return null;
        }
    }
    // Check if subscription is active
    isSubscriptionActive(subscription) {
        if (!subscription)
            return false;
        // Check if subscription is marked as active
        if (subscription.status !== "active")
            return false;
        // Check if subscription hasn't expired (optional future enhancement)
        // For now, we'll just check the status
        return true;
    }
    // Cancel subscription
    cancelSubscription(subscriptionId) {
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
        }
        catch (error) {
            console.error("❌ Failed to cancel subscription:", error);
            return false;
        }
    }
    // Get subscription status
    getSubscriptionStatus() {
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
window.paymentService = new PaymentService();
console.log("✅ PAYMENT SERVICE LOADED SUCCESSFULLY!");
