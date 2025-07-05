// PRICING HELPER - Dedicated pricing functionality
// This handles all pricing page operations including plan loading and management

console.log("💰 PRICING HELPER LOADING...");

interface PricingPlan {
  level: string;
  name: string;
  priceDisplay: string;
  features: string[];
}

interface PlanCard {
  plan: PricingPlan;
  isPopular: boolean;
}

interface PaymentMethod {
  type: "stripe" | "paypal" | "cashapp";
  icon: string;
  text: string;
}

class PricingHelper {
  private plans: PricingPlan[];

  constructor() {
    this.plans = [
      {
        level: "elementary",
        name: "Elementary School",
        priceDisplay: "$35",
        features: [
          "Unlimited Essay Writing",
          "24/7 Tutoring Help",
          "All Subjects Support",
          "Interactive Learning Games",
          "Progress Tracking",
          "Mobile Access",
        ],
      },
      {
        level: "middle",
        name: "Middle School",
        priceDisplay: "$35",
        features: [
          "Unlimited Essay Writing",
          "24/7 Tutoring Help",
          "All Subjects Support",
          "Study Skills Training",
          "Progress Tracking",
          "Mobile Access",
        ],
      },
      {
        level: "high",
        name: "High School",
        priceDisplay: "$35",
        features: [
          "Advanced Essay Writing",
          "24/7 Expert Tutoring",
          "SAT/ACT Prep",
          "College Application Help",
          "Progress Tracking",
          "Mobile Access",
        ],
      },
      {
        level: "college",
        name: "College",
        priceDisplay: "$45",
        features: [
          "Research Paper Support",
          "Advanced Topic Coverage",
          "Career Guidance",
          "Thesis Development",
          "Progress Tracking",
          "Mobile Access",
        ],
      },
      {
        level: "nursing",
        name: "Nursing Excellence",
        priceDisplay: "$45",
        features: [
          "NCLEX Exam Preparation",
          "Clinical Case Studies",
          "Medical Terminology",
          "Anatomy & Physiology",
          "Progress Tracking",
          "Mobile Access",
        ],
      },
      {
        level: "tech",
        name: "Technical School",
        priceDisplay: "$45",
        features: [
          "Programming Support",
          "Engineering Help",
          "Technical Writing",
          "Project Guidance",
          "Progress Tracking",
          "Mobile Access",
        ],
      },
      {
        level: "rotc",
        name: "ROTC Excellence",
        priceDisplay: "$45",
        features: [
          "Physical Fitness Training",
          "Leadership Development",
          "Military Science Support",
          "Field Training Prep",
          "Progress Tracking",
          "Mobile Access",
        ],
      },
      {
        level: "christian",
        name: "Faith-Based Education",
        priceDisplay: "$45",
        features: [
          "Faith-Integrated Learning",
          "Biblical Studies Support",
          "Theology & Ministry Help",
          "Character Development",
          "Progress Tracking",
          "Mobile Access",
        ],
      },
    ];

    console.log(
      "✅ Pricing helper initialized with",
      this.plans.length,
      "plans"
    );
  }

  // Initialize pricing page
  initializePricing(): boolean {
    console.log("🎯 Initializing pricing page...");

    try {
      const plansGrid = document.getElementById("plansGrid");
      if (!plansGrid) {
        console.error("❌ Plans grid not found");
        return false;
      }

      console.log("🔧 Populating pricing plans...");

      // Create plan cards HTML
      const plansHTML = this.plans
        .map((plan) => this.createPlanCard(plan))
        .join("");

      // Set the HTML
      plansGrid.innerHTML = plansHTML;

      // Add global functions
      this.setupGlobalFunctions();

      console.log("✅ Pricing plans populated successfully");
      return true;
    } catch (error) {
      console.error("❌ Error initializing pricing:", error);
      return false;
    }
  }

  // Create a single plan card
  private createPlanCard(plan: PricingPlan): string {
    const isPopular = plan.level === "college";
    const features = plan.features
      .map(
        (feature) =>
          `<div class="feature"><span class="feature-text">${feature}</span></div>`
      )
      .join("");

    return `
      <div class="plan-card ${isPopular ? "popular" : ""}">
        ${isPopular ? '<div class="popular-badge">Most Popular</div>' : ""}
        <div class="plan-header">
          <h3>${plan.name}</h3>
          <div class="plan-price">
            <span class="price-amount">${plan.priceDisplay}</span>
            <span class="price-period">/month</span>
          </div>
        </div>
        <div class="plan-features">
          ${features}
        </div>
        <button class="plan-button" onclick="selectPlan('${plan.level}')">
          Choose ${plan.name}
        </button>
      </div>
    `;
  }

  // Setup global functions for pricing
  private setupGlobalFunctions(): void {
    // Global function for plan selection
    (window as any).selectPlan = (planLevel: string) => {
      console.log("🎯 Plan selected:", planLevel);
      this.selectPlan(planLevel);
    };

    // Global function for payment processing
    (window as any).processPayment = (
      planLevel: string,
      paymentMethod: string
    ) => {
      console.log(
        "💳 Processing payment for plan:",
        planLevel,
        "method:",
        paymentMethod
      );
      this.processPayment(planLevel, paymentMethod);
    };

    // Global function for showing pricing page
    (window as any).showPricingPage = () => {
      console.log("📄 Showing pricing page...");
      this.showPricingPage();
    };

    // Global function for scrolling to plans
    (window as any).scrollToPlans = () => {
      const plansGrid = document.getElementById("plansGrid");
      if (plansGrid) {
        plansGrid.scrollIntoView({ behavior: "smooth" });
      }
    };

    console.log("✅ Global pricing functions setup");
  }

  // Handle plan selection
  selectPlan(planLevel: string): void {
    console.log("🎯 Plan selected:", planLevel);

    // Find the selected plan
    const selectedPlan = this.plans.find((plan) => plan.level === planLevel);
    if (!selectedPlan) {
      console.error("❌ Plan not found:", planLevel);
      return;
    }

    // Use UI controller if available
    if (
      (window as any).uiController &&
      (window as any).uiController.selectPlan
    ) {
      (window as any).uiController.selectPlan(planLevel);
    } else {
      console.warn(
        "⚠️ UI Controller not available, showing plan details directly"
      );
      this.showPlanDetails(selectedPlan);
    }
  }

  // Show plan details page
  private showPlanDetails(plan: PricingPlan): void {
    console.log("📋 Showing plan details for:", plan.name);

    const mainContent = document.getElementById("mainContent");
    if (!mainContent) {
      console.error("❌ Main content not found");
      return;
    }

    const features = plan.features
      .map(
        (feature) =>
          `<div class="feature-item"><span class="feature-text">${feature}</span></div>`
      )
      .join("");

    const planDetailsHTML = `
      <div class="plan-detail-container">
        <div class="plan-detail-header">
          <button class="back-to-pricing" onclick="showPricingPage()">
            ← Back to All Plans
          </button>
          <h2>${plan.name} Plan</h2>
          <p class="plan-description">Comprehensive academic support for ${plan.name.toLowerCase()} students</p>
        </div>
        
        <div class="plan-detail-content">
          <div class="plan-overview">
            <div class="plan-price-large">
              <span class="price-amount">${plan.priceDisplay}</span>
              <span class="price-period">/month</span>
            </div>
            <div class="plan-features-detailed">
              <h3>What's Included:</h3>
              ${features}
            </div>
          </div>
          
          <div class="payment-options">
            <h3>Choose Your Payment Method</h3>
            <div class="payment-methods">
              <button class="payment-method-btn stripe" onclick="processPayment('${
                plan.level
              }', 'stripe')">
                <span class="payment-icon">💳</span>
                <span class="payment-text">Pay with Card (Stripe)</span>
              </button>
              <button class="payment-method-btn paypal" onclick="processPayment('${
                plan.level
              }', 'paypal')">
                <span class="payment-icon">💰</span>
                <span class="payment-text">Pay with PayPal</span>
              </button>
              <button class="payment-method-btn cashapp" onclick="processPayment('${
                plan.level
              }', 'cashapp')">
                <span class="payment-icon">💸</span>
                <span class="payment-text">Pay with Cash App</span>
              </button>
            </div>
          </div>
          
          <div class="plan-guarantee">
            <div class="guarantee-badge">
              <span>🎯 30-Day Money Back Guarantee</span>
            </div>
            <p>Try SmartyPants-AI risk-free. If you're not satisfied within 30 days, we'll provide a full refund.</p>
          </div>
        </div>
      </div>
    `;

    mainContent.innerHTML = planDetailsHTML;
    console.log("✅ Plan details page loaded");
  }

  // Show the main pricing page
  showPricingPage(): void {
    console.log("📄 Loading pricing page...");

    // Load pricing content
    fetch("/partials/pricing.html")
      .then((response) => response.text())
      .then((html) => {
        const mainContent = document.getElementById("mainContent");
        if (mainContent) {
          mainContent.innerHTML = html;
          console.log("✅ Pricing content loaded");

          // Initialize pricing after content loads
          setTimeout(() => {
            this.initializePricing();
          }, 100);
        }
      })
      .catch((error) => {
        console.error("❌ Failed to load pricing content:", error);
      });
  }

  // Process payment for selected plan
  processPayment(planLevel: string, paymentMethod: string): void {
    console.log(
      "💳 Processing payment for plan:",
      planLevel,
      "method:",
      paymentMethod
    );

    // Use UI controller if available
    if (
      (window as any).uiController &&
      (window as any).uiController.selectPlan
    ) {
      (window as any).uiController.selectPlan(planLevel);
    } else {
      console.warn("⚠️ UI Controller not available");
      alert("Please try again or contact support.");
    }
  }

  // Get all plans
  getAllPlans(): PricingPlan[] {
    return this.plans;
  }

  // Get plan by level
  getPlanByLevel(level: string): PricingPlan | undefined {
    return this.plans.find((plan) => plan.level === level);
  }
}

// Create global instance
console.log("💰 Creating pricing helper instance...");
(window as any).PricingHelper = new PricingHelper();

console.log("✅ PRICING HELPER LOADED SUCCESSFULLY!");
