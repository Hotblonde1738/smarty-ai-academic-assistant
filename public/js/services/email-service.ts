// EMAIL SERVICE - Business Logic for Email Operations
console.log("📧 EMAIL SERVICE LOADING...");

interface CustomerData {
  email: string;
  name?: string;
  planName?: string;
  amount?: number;
  paymentMethod?: string;
}

interface EmailTemplateParams {
  to_email: string;
  customer_name: string;
  plan_name?: string;
  amount?: number;
  payment_method?: string;
  transaction_date?: string;
  transaction_id?: string;
  next_billing_date?: string;
  support_email?: string;
  website_url?: string;
  login_url?: string;
  welcome_message?: string;
  next_steps?: string[];
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

interface EmailStats {
  totalSent: number;
  totalFailed: number;
  lastSent: string | null;
}

class EmailService {
  private serviceId: string;
  private templateId: string;
  private welcomeTemplateId: string;
  private publicKey: string;
  private initialized: boolean;

  constructor() {
    this.serviceId = "service_smartypants";
    this.templateId = "template_receipt";
    this.welcomeTemplateId = "template_welcome";
    this.publicKey = "your_public_key_here"; // You'll get this from EmailJS
    this.initialized = false;
  }

  // Initialize EmailJS
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Load EmailJS library
      if (!(window as any).emailjs) {
        await this.loadEmailJSLibrary();
      }

      // Initialize EmailJS
      // emailjs.init(this.publicKey); // Uncomment when you have your key
      this.initialized = true;
      console.log("✅ Email service initialized");
    } catch (error) {
      console.error("❌ Email service initialization failed:", error);
      throw error;
    }
  }

  // Load EmailJS library
  private async loadEmailJSLibrary(): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src =
        "https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js";
      script.onload = () => resolve();
      script.onerror = () =>
        reject(new Error("Failed to load EmailJS library"));
      document.head.appendChild(script);
    });
  }

  // Send receipt email
  async sendReceipt(customerData: CustomerData): Promise<EmailResult> {
    console.log("📧 Sending receipt email to:", customerData.email);

    try {
      await this.initialize();

      const templateParams = this.prepareReceiptTemplate(customerData);
      const emailResult = await this.sendEmail(this.templateId, templateParams);

      console.log("✅ Receipt sent successfully:", emailResult);
      return { success: true, messageId: emailResult.text };
    } catch (error) {
      console.error("❌ Failed to send receipt:", error);
      return { success: false, error: (error as Error).message };
    }
  }

  // Send welcome email
  async sendWelcomeEmail(customerData: CustomerData): Promise<EmailResult> {
    console.log("📧 Sending welcome email to:", customerData.email);

    try {
      await this.initialize();

      const templateParams = this.prepareWelcomeTemplate(customerData);
      const emailResult = await this.sendEmail(
        this.welcomeTemplateId,
        templateParams
      );

      console.log("✅ Welcome email sent successfully:", emailResult);
      return { success: true, messageId: emailResult.text };
    } catch (error) {
      console.error("❌ Failed to send welcome email:", error);
      return { success: false, error: (error as Error).message };
    }
  }

  // Prepare receipt email template
  private prepareReceiptTemplate(
    customerData: CustomerData
  ): EmailTemplateParams {
    return {
      to_email: customerData.email,
      customer_name: customerData.name || "Valued Customer",
      plan_name: customerData.planName,
      amount: customerData.amount,
      payment_method: customerData.paymentMethod,
      transaction_date: new Date().toLocaleDateString(),
      transaction_id: this.generateTransactionId(),
      next_billing_date: this.getNextBillingDate(),
      support_email: "getsmartyai@gmail.com",
      website_url: "https://getsmartyai.space",
    };
  }

  // Prepare welcome email template
  private prepareWelcomeTemplate(
    customerData: CustomerData
  ): EmailTemplateParams {
    return {
      to_email: customerData.email,
      customer_name: customerData.name || "New Student",
      plan_name: customerData.planName,
      login_url: "https://getsmartyai.space",
      support_email: "getsmartyai@gmail.com",
      welcome_message: this.getWelcomeMessage(customerData.planName),
      next_steps: this.getNextSteps(customerData.planName),
    };
  }

  // Get personalized welcome message
  private getWelcomeMessage(planName?: string): string {
    const messages: Record<string, string> = {
      "Elementary School":
        "Welcome to your elementary school learning journey!",
      "Middle School": "Welcome to your middle school academic adventure!",
      "High School": "Welcome to your high school success path!",
      College: "Welcome to your college academic excellence journey!",
      "Nursing Excellence": "Welcome to your nursing education journey!",
      "Technical School": "Welcome to your technical education path!",
      "ROTC Excellence": "Welcome to your ROTC leadership journey!",
      "Faith-Based Education": "Welcome to your faith-based learning journey!",
    };

    return (
      messages[planName || ""] ||
      "Welcome to your SmartyPants-AI learning journey!"
    );
  }

  // Get next steps based on plan
  private getNextSteps(planName?: string): string[] {
    const steps: Record<string, string[]> = {
      "Elementary School": [
        "Start with basic subjects",
        "Practice reading and math",
        "Ask questions anytime",
        "Have fun learning!",
      ],
      "Middle School": [
        "Explore different subjects",
        "Develop study skills",
        "Ask for help when needed",
        "Stay organized",
      ],
      "High School": [
        "Focus on your goals",
        "Prepare for college",
        "Build strong foundations",
        "Ask challenging questions",
      ],
      College: [
        "Dive deep into subjects",
        "Research and analyze",
        "Develop critical thinking",
        "Prepare for your career",
      ],
      "Nursing Excellence": [
        "Study medical terminology",
        "Practice clinical scenarios",
        "Prepare for NCLEX",
        "Build patient care skills",
      ],
      "Technical School": [
        "Master technical concepts",
        "Practice programming",
        "Build projects",
        "Stay updated with technology",
      ],
      "ROTC Excellence": [
        "Develop leadership skills",
        "Study military science",
        "Maintain physical fitness",
        "Prepare for field training",
      ],
      "Faith-Based Education": [
        "Integrate faith and learning",
        "Study biblical principles",
        "Develop character",
        "Serve others",
      ],
    };

    return (
      steps[planName || ""] || [
        "Start learning immediately",
        "Ask questions anytime",
        "Track your progress",
        "Stay motivated",
      ]
    );
  }

  // Send email using EmailJS
  private async sendEmail(
    templateId: string,
    templateParams: EmailTemplateParams
  ): Promise<any> {
    // TODO: Implement real email sending with EmailJS
    console.log("📧 Email sending not yet implemented:", {
      templateId,
      templateParams,
    });

    return {
      text: "message-id-" + Date.now(),
      status: 200,
    };
  }

  // Generate transaction ID
  private generateTransactionId(): string {
    return (
      "SP-" +
      Date.now() +
      "-" +
      Math.random().toString(36).substr(2, 9).toUpperCase()
    );
  }

  // Get next billing date
  private getNextBillingDate(): string {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return nextMonth.toLocaleDateString();
  }

  // Send both receipt and welcome emails
  async sendSubscriptionEmails(customerData: CustomerData): Promise<{
    receipt: EmailResult | null;
    welcome: EmailResult | null;
    success: boolean;
    error?: string;
  }> {
    console.log("📧 Sending subscription emails to:", customerData.email);

    const results = {
      receipt: null as EmailResult | null,
      welcome: null as EmailResult | null,
      success: false,
    };

    try {
      // Send receipt first
      results.receipt = await this.sendReceipt(customerData);

      if (results.receipt.success) {
        // Send welcome email
        results.welcome = await this.sendWelcomeEmail(customerData);
      }

      results.success =
        results.receipt.success && (results.welcome?.success ?? false);

      return results;
    } catch (error) {
      console.error("❌ Failed to send subscription emails:", error);
      return {
        ...results,
        success: false,
        error: (error as Error).message,
      };
    }
  }

  // Get email statistics
  getEmailStats(): EmailStats {
    return {
      totalSent: 0,
      totalFailed: 0,
      lastSent: null,
    };
  }

  // Validate email address
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Initialize service
  async init(): Promise<void> {
    await this.initialize();
  }
}

// Create global instance
(window as any).emailService = new EmailService();

// Initialize when page loads
document.addEventListener("DOMContentLoaded", () => {
  (window as any).emailService.init();
});

console.log("✅ EMAIL SERVICE LOADED SUCCESSFULLY!");
