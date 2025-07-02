// UI CONTROLLER - MVC Style State Management
// This consolidates all UI interactions, button handling, and state management

console.log("🎮 UI CONTROLLER LOADING...");

class UIController {
  constructor() {
    this.currentState = "landing"; // landing, payment, chat, demo
    this.selectedPlan = null;
    this.customerData = {};
    this.isLoading = false;
    this.customerModal = null;

    // Initialize services
    this.paymentService = window.paymentService;
    this.aiService = window.aiService;
    this.emailService = window.emailService;
    this.syllabusService = window.syllabusService;

    // Use payment service for plan data
    this.prices = this.paymentService.prices;
    this.planNames = this.paymentService.planNames;

    this.init();
  }

  init() {
    console.log("🎮 Initializing UI Controller...");

    try {
      this.setupEventListeners();
      this.setupNavigationButtons();
      this.setupPaymentButtons();
      this.setupChatInterface();
      this.setupSyllabusUpload();
      this.setupDemoMode();

      // Check for existing subscription
      this.checkExistingSubscription();

      console.log("✅ UI Controller initialized successfully");
    } catch (error) {
      console.error("❌ UI Controller initialization failed:", error);
    }
  }

  checkExistingSubscription() {
    try {
      const subscriptionData = localStorage.getItem("smartypants_subscription");
      if (subscriptionData) {
        const subscription = JSON.parse(subscriptionData);
        console.log("📋 Found existing subscription:", subscription);

        // If subscription is active, go directly to chat
        if (subscription.status === "active") {
          this.selectedPlan = {
            level: subscription.plan,
            price: subscription.price,
            name: this.planNames[subscription.plan] || "Premium Plan",
          };
          this.setState("chat");
        }
      }
    } catch (error) {
      console.error("❌ Error checking subscription:", error);
    }
  }

  // ===== STATE MANAGEMENT =====

  setState(newState) {
    console.log(`🔄 State change: ${this.currentState} → ${newState}`);
    this.currentState = newState;
    this.updateUI();
  }

  updateUI() {
    // Hide all pages
    const pages = ["landingPage", "paymentPage", "chatPage"];
    pages.forEach((pageId) => {
      const page = document.getElementById(pageId);
      if (page) page.style.display = "none";
    });

    // Show current page
    switch (this.currentState) {
      case "landing":
        document.getElementById("landingPage").style.display = "block";
        break;
      case "payment":
        document.getElementById("paymentPage").style.display = "block";
        this.updatePaymentDisplay();
        break;
      case "chat":
        document.getElementById("chatPage").style.display = "block";
        this.updateChatDisplay();
        break;
      case "demo":
        document.getElementById("chatPage").style.display = "block";
        this.updateDemoDisplay();
        break;
    }

    window.scrollTo(0, 0);
  }

  // ===== NAVIGATION BUTTONS =====

  setupNavigationButtons() {
    console.log("🎯 Setting up navigation buttons...");

    // Demo button
    const demoBtn = document.getElementById("demoButton");
    if (demoBtn) {
      demoBtn.onclick = () => this.startDemo();
      console.log("✅ Demo button ready");
    }

    // Level cards
    const cards = document.querySelectorAll("[data-level]");
    console.log(`🔍 Found ${cards.length} level cards`);

    cards.forEach((card, index) => {
      const level = card.getAttribute("data-level");
      console.log(`🎯 Setting up card ${index} for level: ${level}`);

      card.onclick = () => this.selectPlan(level);
      card.style.cursor = "pointer";
    });

    // Special buttons
    const specialButtons = {
      ".christian-btn": "christian",
      ".special-nursing-btn": "nursing",
      ".special-tech-btn": "tech",
    };

    Object.entries(specialButtons).forEach(([selector, level]) => {
      const btn = document.querySelector(selector);
      if (btn) {
        btn.onclick = () => this.selectPlan(level);
        console.log(`✅ ${level} button ready`);
      }
    });

    console.log("🎉 All navigation buttons ready!");
  }

  selectPlan(level) {
    console.log(`✅ Plan selected: ${level}`);
    this.selectedPlan = this.paymentService.getPlanInfo(level);
    this.setState("payment");
  }

  startDemo() {
    console.log("🎯 Starting demo mode...");
    this.setState("demo");
  }

  // ===== PAYMENT HANDLING =====

  setupPaymentButtons() {
    const paymentButtons = document.querySelectorAll(".payment-button");
    paymentButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const method = btn.getAttribute("data-method");
        this.processPayment(method);
      });
    });
  }

  updatePaymentDisplay() {
    if (!this.selectedPlan) return;

    const planDisplay = document.getElementById("planDisplay");
    const priceDisplay = document.getElementById("priceDisplay");

    if (planDisplay) {
      planDisplay.textContent = `Selected Plan: ${this.selectedPlan.name}`;
    }
    if (priceDisplay) {
      priceDisplay.textContent = `Monthly Fee: $${this.selectedPlan.price}/month`;
    }
  }

  async processPayment(method) {
    console.log(`💳 Processing payment: ${method}`);

    try {
      // Show loading
      this.showLoading("Processing your payment...");

      // Collect customer info
      const customerData = await this.collectCustomerInfo();
      if (!customerData) {
        this.hideLoading();
        return;
      }

      // Use payment service to process payment
      const paymentResult = await this.paymentService.processPayment(
        this.selectedPlan,
        customerData,
        method
      );

      if (paymentResult.success) {
        // Store subscription using payment service
        this.paymentService.storeSubscription(paymentResult.subscription);

        // Send emails using email service
        await this.emailService.sendSubscriptionEmails({
          email: customerData.email,
          name: customerData.name,
          planName: this.selectedPlan.name,
          amount: `$${this.selectedPlan.price}`,
          paymentMethod: method,
        });

        // Transition to chat
        this.setState("chat");
      } else {
        throw new Error(paymentResult.error);
      }
    } catch (error) {
      console.error("❌ Payment failed:", error);
      this.showError(`Payment failed: ${error.message}`);
    } finally {
      this.hideLoading();
    }
  }

  async collectCustomerInfo() {
    // Use the customer info modal for better UX
    return new Promise((resolve, reject) => {
      this.showCustomerInfoModal()
        .then((customerData) => {
          resolve(customerData);
        })
        .catch((error) => {
          console.log("Customer info collection cancelled:", error.message);
          reject(error);
        });
    });
  }

  showCustomerInfoModal() {
    return new Promise((resolve, reject) => {
      this.createCustomerModal();
      this.customerModal.style.display = "flex";

      // Handle form submission
      const form = this.customerModal.querySelector("#customerForm");
      form.onsubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(form);

        const customerData = {
          name: formData.get("name"),
          email: formData.get("email"),
          phone: formData.get("phone") || "",
          school: formData.get("school") || "",
          grade: formData.get("grade") || "",
        };

        if (this.validateCustomerData(customerData)) {
          this.hideCustomerModal();
          resolve(customerData);
        }
      };

      // Handle cancel
      const cancelBtn = this.customerModal.querySelector(".cancel-btn");
      cancelBtn.onclick = () => {
        this.hideCustomerModal();
        reject(new Error("User cancelled"));
      };
    });
  }

  createCustomerModal() {
    if (this.customerModal) {
      document.body.removeChild(this.customerModal);
    }

    this.customerModal = document.createElement("div");
    this.customerModal.className = "customer-modal";
    this.customerModal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>Complete Your Subscription</h3>
          <p>Plan: ${this.selectedPlan.name} - $${this.selectedPlan.price}/month</p>
        </div>
        
        <form id="customerForm" class="customer-form">
          <div class="form-group">
            <label for="name">Full Name *</label>
            <input type="text" id="name" name="name" required 
                   placeholder="Enter your full name">
          </div>
          
          <div class="form-group">
            <label for="email">Email Address *</label>
            <input type="email" id="email" name="email" required 
                   placeholder="Enter your email for receipts">
          </div>
          
          <div class="form-group">
            <label for="phone">Phone Number (Optional)</label>
            <input type="tel" id="phone" name="phone" 
                   placeholder="Enter your phone number">
          </div>
          
          <div class="form-group">
            <label for="school">School/Institution (Optional)</label>
            <input type="text" id="school" name="school" 
                   placeholder="Enter your school name">
          </div>
          
          <div class="form-group">
            <label for="grade">Grade Level (Optional)</label>
            <select id="grade" name="grade">
              <option value="">Select grade level</option>
              <option value="K-5">Elementary (K-5)</option>
              <option value="6-8">Middle School (6-8)</option>
              <option value="9-12">High School (9-12)</option>
              <option value="college">College</option>
              <option value="graduate">Graduate School</option>
              <option value="adult">Adult Learner</option>
            </select>
          </div>
          
          <div class="form-actions">
            <button type="button" class="cancel-btn">Cancel</button>
            <button type="submit" class="continue-btn">Continue to Payment</button>
          </div>
        </form>
        
        <div class="privacy-note">
          <p>🔒 Your information is secure and will only be used for account management and receipts.</p>
        </div>
      </div>
    `;

    // Add modal styles
    const modalStyle = document.createElement("style");
    modalStyle.textContent = `
      .customer-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
      }
      .modal-content {
        background: white;
        padding: 30px;
        border-radius: 15px;
        max-width: 500px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
      }
      .modal-header {
        text-align: center;
        margin-bottom: 20px;
        border-bottom: 2px solid #e9ecef;
        padding-bottom: 15px;
      }
      .form-group {
        margin-bottom: 15px;
      }
      .form-group label {
        display: block;
        margin-bottom: 5px;
        font-weight: 600;
        color: #374151;
      }
      .form-group input,
      .form-group select {
        width: 100%;
        padding: 10px;
        border: 2px solid #e5e7eb;
        border-radius: 8px;
        font-size: 16px;
      }
      .form-actions {
        display: flex;
        gap: 10px;
        margin-top: 20px;
      }
      .cancel-btn {
        background: #6b7280;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        cursor: pointer;
        flex: 1;
      }
      .continue-btn {
        background: #1e3a8a;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        cursor: pointer;
        flex: 2;
      }
      .privacy-note {
        margin-top: 15px;
        padding: 10px;
        background: #f3f4f6;
        border-radius: 8px;
        font-size: 14px;
        color: #6b7280;
      }
    `;
    document.head.appendChild(modalStyle);

    document.body.appendChild(this.customerModal);
  }

  validateCustomerData(customerData) {
    const { name, email } = customerData;

    if (!name || name.trim().length < 2) {
      this.showError("Please enter a valid name");
      return false;
    }

    if (!email || !this.isValidEmail(email)) {
      this.showError("Please enter a valid email address");
      return false;
    }

    return true;
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  hideCustomerModal() {
    if (this.customerModal) {
      this.customerModal.style.display = "none";
    }
  }

  // Payment methods are now handled by the payment service

  // ===== CHAT INTERFACE =====

  setupChatInterface() {
    // Set up the generate button with unified handler
    const generateButton = document.querySelector(".generate-button");
    if (generateButton) {
      generateButton.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.handleChatRequest();
      });
      console.log("✅ Chat interface ready");
    }

    // Set up form dropdowns
    this.setupFormDropdowns();
  }

  setupFormDropdowns() {
    const helpTypeDropdown = document.getElementById("helpType");
    if (helpTypeDropdown) {
      helpTypeDropdown.addEventListener("change", () => {
        const essayTypeDropdown = document.getElementById("essayType");
        const referenceOptions = document.getElementById("referenceOptions");

        if (helpTypeDropdown.value === "essay") {
          essayTypeDropdown.classList.remove("hidden");
          referenceOptions.classList.remove("hidden");
        } else {
          essayTypeDropdown.classList.add("hidden");
          referenceOptions.classList.add("hidden");
        }
      });
    }
  }

  updateChatDisplay() {
    const activePlanDisplay = document.getElementById("activePlanDisplay");
    const activePriceDisplay = document.getElementById("activePriceDisplay");
    const nextBillingDate = document.getElementById("nextBillingDate");

    if (activePlanDisplay) {
      activePlanDisplay.textContent = `Active Plan: ${
        this.selectedPlan?.name || "Premium Plan"
      }`;
    }
    if (activePriceDisplay) {
      activePriceDisplay.textContent = `Monthly Fee: $${
        this.selectedPlan?.price || 45
      }/month`;
    }
    if (nextBillingDate) {
      nextBillingDate.textContent = this.getNextBillingDate().split("T")[0];
    }
  }

  updateDemoDisplay() {
    const activePlanDisplay = document.getElementById("activePlanDisplay");
    const activePriceDisplay = document.getElementById("activePriceDisplay");

    if (activePlanDisplay) {
      activePlanDisplay.textContent = "Demo Mode - Testing SmartyPants-AI";
    }
    if (activePriceDisplay) {
      activePriceDisplay.textContent = "Free Demo - No Payment Required";
    }
  }

  async handleChatRequest() {
    console.log("🎯 UNIFIED CHAT REQUEST - Single function call");

    const responseDiv = document.getElementById("response");
    const userInput = document.getElementById("userInput");

    // Validate inputs
    if (!userInput || !userInput.value.trim()) {
      this.showError("Please enter a question first!");
      if (userInput) userInput.focus();
      return;
    }

    const question = userInput.value.trim();
    console.log("📝 Question:", question);

    // Show loading
    this.showChatLoading(responseDiv);

    try {
      // Get form options
      const options = this.getChatOptions();

      // Use AI service to send request
      const aiResponse = await this.aiService.sendChatRequest(
        question,
        options
      );

      if (aiResponse.success) {
        this.showChatResponse(
          responseDiv,
          aiResponse.answer,
          aiResponse.timestamp
        );
        console.log("✅ SUCCESS! SmartyPants responded successfully!");
      } else {
        throw new Error(aiResponse.error);
      }
    } catch (error) {
      console.error("❌ SmartyPants failed:", error);
      this.showChatError(responseDiv, error.message);
    }
  }

  getChatOptions() {
    const options = {};

    const helpType = document.getElementById("helpType")?.value;
    const subject = document.getElementById("subject")?.value;
    const difficulty = document.getElementById("difficulty")?.value;
    const essayType = document.getElementById("essayType")?.value;
    const citationStyle = document.getElementById("citationStyle")?.value;
    const minReferences = document.getElementById("minReferences")?.value;

    if (helpType) options.helpType = helpType;
    if (subject) options.subject = subject;
    if (difficulty) options.difficulty = difficulty;
    if (essayType) options.essayType = essayType;
    if (citationStyle) options.citationStyle = citationStyle;
    if (minReferences) options.minReferences = parseInt(minReferences);

    return options;
  }

  showChatLoading(responseDiv) {
    if (responseDiv) {
      responseDiv.innerHTML = `
        <div style="text-align: center; padding: 30px; background: linear-gradient(145deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 15px; border: 2px solid #0ea5e9; color: #0c4a6e;">
          <h4>🤖 SmartyPants is thinking...</h4>
          <div style="margin: 20px 0;">
            <div style="display: inline-block; width: 20px; height: 20px; border: 3px solid #0ea5e9; border-top: 3px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
          </div>
          <p>Processing your question...</p>
        </div>
      `;
    }
  }

  showChatResponse(responseDiv, answer, timestamp) {
    if (responseDiv) {
      responseDiv.innerHTML = `
        <div style="background: linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%); padding: 25px; border-radius: 15px; border: 2px solid #e9ecef;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #e9ecef; padding-bottom: 15px;">
            <h4 style="color: #1e3a8a; margin: 0; font-size: 1.3em;">🤖 SmartyPants Says:</h4>
            <button onclick="uiController.copyResponse()" style="background: #6b7280; color: white; border: none; padding: 8px 15px; border-radius: 20px; cursor: pointer; font-size: 0.9em;">📋 Copy</button>
          </div>
          <div id="responseContent" style="line-height: 1.8; color: #374151; font-size: 1.1em; font-weight: 500;">${answer}</div>
          <div style="text-align: center; padding-top: 15px; border-top: 1px solid #e9ecef; color: #6b7280; margin-top: 20px; font-size: 0.9em;">
            ✅ Response generated successfully! • ${
              timestamp ? new Date(timestamp).toLocaleTimeString() : "Now"
            }
          </div>
        </div>
      `;
    }
  }

  showChatError(responseDiv, errorMessage) {
    if (responseDiv) {
      responseDiv.innerHTML = `
        <div style="background: linear-gradient(145deg, #fef2f2 0%, #fee2e2 100%); padding: 25px; border-radius: 15px; border: 2px solid #fca5a5; color: #dc2626; text-align: center;">
          <h4 style="margin-bottom: 15px;">❌ SmartyPants Error</h4>
          <p style="font-weight: 600; margin: 15px 0; padding: 15px; background: rgba(220, 38, 38, 0.1); border-radius: 10px;">
            <strong>Error:</strong> ${errorMessage}
          </p>
          <div style="margin-top: 20px;">
            <button onclick="location.reload()" style="background: #1e3a8a; color: white; border: none; padding: 12px 24px; border-radius: 25px; cursor: pointer; margin: 5px; font-weight: 600;">🔄 Refresh Page</button>
          </div>
        </div>
      `;
    }
  }

  // ===== SYLLABUS UPLOAD =====

  setupSyllabusUpload() {
    const uploadButton = document.querySelector(".upload-button");
    if (uploadButton) {
      uploadButton.addEventListener("click", () => this.uploadSyllabus());
    }
  }

  async uploadSyllabus() {
    const fileInput = document.getElementById("syllabusFile");
    const file = fileInput.files[0];

    if (!file) {
      this.showError("Please select a file to upload");
      return;
    }

    try {
      this.showLoading("Uploading syllabus...");

      // Use syllabus service to upload
      const uploadResult = await this.syllabusService.uploadSyllabus(file);

      if (uploadResult.success) {
        this.updateSyllabusList();
        this.showSuccess("Syllabus uploaded successfully!");
        fileInput.value = "";
      } else {
        throw new Error(uploadResult.error);
      }
    } catch (error) {
      this.showError(error.message);
    } finally {
      this.hideLoading();
    }
  }

  updateSyllabusList() {
    const listDiv = document.getElementById("activeSyllabi");
    if (listDiv) {
      const syllabi = this.syllabusService.getAllSyllabi();

      listDiv.innerHTML = syllabi
        .map(
          (syllabus) => `
        <div class="syllabus-item">
          <span>${syllabus.filename}</span>
          <button onclick="uiController.removeSyllabus('${syllabus.id}')" class="remove-syllabus" aria-label="Remove syllabus">&times;</button>
        </div>
      `
        )
        .join("");
    }
  }

  removeSyllabus(syllabusId) {
    if (confirm("Are you sure you want to remove this syllabus?")) {
      try {
        const result = this.syllabusService.removeSyllabus(syllabusId);
        if (result.success) {
          this.updateSyllabusList();
          this.showSuccess("Syllabus removed successfully");
        }
      } catch (error) {
        console.error("❌ Failed to remove syllabus:", error);
        this.showError(`Failed to remove syllabus: ${error.message}`);
      }
    }
  }

  // ===== DEMO MODE =====

  setupDemoMode() {
    // Demo mode is handled by the chat interface
    // but with different responses
    console.log("🎯 Demo mode ready");
  }

  // ===== UTILITY FUNCTIONS =====

  showLoading(message = "Processing...") {
    this.isLoading = true;
    const overlay = document.querySelector(".loading-overlay");
    if (overlay) {
      overlay.classList.remove("hidden");
      const messageEl = overlay.querySelector("p");
      if (messageEl) messageEl.textContent = message;
    }
  }

  hideLoading() {
    this.isLoading = false;
    const overlay = document.querySelector(".loading-overlay");
    if (overlay) {
      overlay.classList.add("hidden");
    }
  }

  showError(message) {
    console.error("❌ Error:", message);
    const statusDiv = document.getElementById("syllabusStatus");
    if (statusDiv) {
      statusDiv.textContent = message;
      statusDiv.className = "status-message error";
    } else {
      alert(message);
    }
    this.hideLoading();
  }

  showSuccess(message) {
    console.log("✅ Success:", message);
    const statusDiv = document.getElementById("syllabusStatus");
    if (statusDiv) {
      statusDiv.textContent = message;
      statusDiv.className = "status-message success";
    }
  }

  copyResponse() {
    const responseContent = document.getElementById("responseContent");
    if (responseContent) {
      navigator.clipboard
        .writeText(responseContent.textContent)
        .then(() => {
          alert("✅ Response copied to clipboard!");
        })
        .catch(() => {
          const textArea = document.createElement("textarea");
          textArea.value = responseContent.textContent;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand("copy");
          document.body.removeChild(textArea);
          alert("✅ Response copied to clipboard!");
        });
    }
  }

  // ===== EVENT LISTENERS =====

  setupEventListeners() {
    // Global error handler
    window.addEventListener("error", (e) => {
      console.error("🚨 Global error caught:", e.error);
    });

    // Backup click handler for navigation
    document.addEventListener("click", (e) => {
      // Handle any missed navigation clicks
      if (e.target.hasAttribute("data-level")) {
        const level = e.target.getAttribute("data-level");
        this.selectPlan(level);
      }
    });

    // PWA Install functionality
    this.setupPWAInstall();
  }

  setupPWAInstall() {
    let deferredPrompt;
    const installBanner = document.getElementById("installBanner");
    const installButton = document.getElementById("installButton");
    const dismissInstall = document.getElementById("dismissInstall");

    // Listen for the beforeinstallprompt event
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      deferredPrompt = e;

      // Show the install banner
      if (installBanner) {
        installBanner.classList.remove("hidden");
      }
    });

    // Handle install button click
    if (installButton) {
      installButton.addEventListener("click", async () => {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          console.log(`User response to install prompt: ${outcome}`);
          deferredPrompt = null;

          // Hide the banner
          if (installBanner) {
            installBanner.classList.add("hidden");
          }
        }
      });
    }

    // Handle dismiss button click
    if (dismissInstall) {
      dismissInstall.addEventListener("click", () => {
        if (installBanner) {
          installBanner.classList.add("hidden");
        }
      });
    }

    // Listen for successful installation
    window.addEventListener("appinstalled", () => {
      console.log("PWA was installed");
      if (installBanner) {
        installBanner.classList.add("hidden");
      }
    });
  }
}

// Create global instance
window.uiController = new UIController();

// Add CSS for animations
const style = document.createElement("style");
style.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);

console.log("✅ UI CONTROLLER LOADED SUCCESSFULLY!");
