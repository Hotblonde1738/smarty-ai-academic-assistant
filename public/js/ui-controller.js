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

    // Sidebar state management
    this.sidebarState = {
      isCollapsed: false,
      isLoggedIn: false,
      activeSyllabus: null,
      userData: {
        name: "Student User",
        email: "student@example.com",
        plan: "college",
        price: "$65",
        nextBilling: "Jan 15, 2025",
      },
      syllabi: [], // Empty array - no more placeholder syllabi
    };

    // Initialize services
    this.paymentService = window.paymentService;
    this.aiService = window.aiService;
    this.emailService = window.emailService;
    this.syllabusService = window.syllabusService;

    console.log("🔍 Services loaded:", {
      payment: !!this.paymentService,
      ai: !!this.aiService,
      email: !!this.emailService,
      syllabus: !!this.syllabusService,
    });

    // Use payment service for plan data
    this.prices = this.paymentService.prices;
    this.planNames = this.paymentService.planNames;

    this.init();
  }

  async init() {
    console.log("🚀 Initializing UI Controller...");

    // Initialize syllabus service
    this.syllabusService = window.syllabusService;
    if (this.syllabusService) {
      console.log("✅ Syllabus service found");
      await this.loadSyllabiFromService();
    } else {
      console.warn("⚠️ Syllabus service not found");
    }

    // Setup UI components
    this.setupSidebar();
    this.setupNavigationButtons();
    this.setupPaymentButtons();
    this.setupChatInterface();
    this.setupFormDropdowns();
    this.setupEventListeners();
    this.setupPWAInstall();

    // Check for existing subscription
    await this.checkExistingSubscription();

    // Set initial state
    this.setState("landing");

    console.log("✅ UI Controller initialized");
  }

  // Load syllabi from the unified syllabus service
  async loadSyllabiFromService() {
    console.log("📚 Loading syllabi from service...");

    if (this.syllabusService) {
      try {
        // Get all syllabi from service (no need to refresh since upload already adds to collection)
        const syllabi = this.syllabusService.getAllSyllabi();
        console.log("📋 Service syllabi:", syllabi);

        // Update sidebar state
        this.sidebarState.syllabi = syllabi;

        // Update the active syllabus
        const activeSyllabus = this.syllabusService.getActiveSyllabus();
        this.sidebarState.activeSyllabus = activeSyllabus
          ? activeSyllabus.id
          : null;

        // Update the UI
        this.updateSyllabusList();
        this.updateSidebarState();

        console.log("✅ Syllabi loaded and UI updated");
      } catch (error) {
        console.error("❌ Failed to load syllabi:", error);
        // Fallback to basic loading
        const syllabi = this.syllabusService.getAllSyllabi();
        this.sidebarState.syllabi = syllabi;
        this.updateSyllabusList();
        this.updateSidebarState();
      }
    } else {
      console.warn("⚠️ Syllabus service not available");
    }
  }

  // ===== SIDEBAR MANAGEMENT =====

  setupSidebar() {
    console.log("📱 Setting up sidebar...");

    // Sidebar toggle for mobile
    const sidebarToggle = document.getElementById("sidebarToggle");
    if (sidebarToggle) {
      sidebarToggle.addEventListener("click", () => this.toggleSidebar());
    }

    // Sidebar overlay for mobile
    const sidebarOverlay = document.getElementById("sidebarOverlay");
    if (sidebarOverlay) {
      sidebarOverlay.addEventListener("click", () => this.toggleSidebar());
    }

    // Mobile menu button
    const mobileMenuBtn = document.getElementById("mobileMenuBtn");
    if (mobileMenuBtn) {
      mobileMenuBtn.addEventListener("click", () => this.toggleSidebar());
    }

    // Authentication buttons
    const loginBtn = document.getElementById("loginBtn");
    const registerBtn = document.getElementById("registerBtn");
    const logoutBtn = document.getElementById("logoutBtn");

    if (loginBtn) {
      loginBtn.addEventListener("click", () => this.handleLogin());
    }
    if (registerBtn) {
      registerBtn.addEventListener("click", () => this.handleRegister());
    }
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => this.handleLogout());
    }

    // Quick action buttons
    const quickChatBtn = document.getElementById("quickChatBtn");
    const quickEssayBtn = document.getElementById("quickEssayBtn");
    const quickTutoringBtn = document.getElementById("quickTutoringBtn");

    if (quickChatBtn) {
      quickChatBtn.addEventListener("click", () => this.quickAction("chat"));
    }
    if (quickEssayBtn) {
      quickEssayBtn.addEventListener("click", () => this.quickAction("essay"));
    }
    if (quickTutoringBtn) {
      quickTutoringBtn.addEventListener("click", () =>
        this.quickAction("tutoring")
      );
    }

    // Syllabus management
    const uploadSyllabusBtn = document.getElementById("uploadSyllabusBtn");
    console.log("🔍 Upload button found:", !!uploadSyllabusBtn);
    if (uploadSyllabusBtn) {
      uploadSyllabusBtn.addEventListener("click", (e) => {
        console.log("🖱️ Upload button clicked!");
        console.log("🔍 User gesture detected:", e.isTrusted);
        this.uploadSyllabus();
      });
      console.log("✅ Upload button event listener attached");
    }

    // Settings buttons
    const settingsButtons = document.querySelectorAll(
      ".settings-btn:not(.logout-btn)"
    );
    settingsButtons.forEach((btn) => {
      btn.addEventListener("click", () => this.handleSettings(btn.id));
    });

    // Initialize sidebar state
    this.updateSidebarState();
    console.log("✅ Sidebar setup complete");
  }

  toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebarOverlay");
    const isCollapsed = this.sidebarState.isCollapsed;

    if (isCollapsed) {
      sidebar.classList.remove("slide-out");
      sidebar.classList.add("slide-in", "active");
      if (overlay) overlay.classList.add("active");
      this.sidebarState.isCollapsed = false;
    } else {
      sidebar.classList.remove("slide-in", "active");
      sidebar.classList.add("slide-out");
      if (overlay) overlay.classList.remove("active");
      this.sidebarState.isCollapsed = true;
    }
  }

  async handleLogin() {
    console.log("🔐 Mock login process...");

    // Mock login - in real app, this would show login modal
    this.sidebarState.isLoggedIn = true;

    // Update syllabus service authentication status
    if (this.syllabusService) {
      this.syllabusService.updateAuthStatus(true, {
        id: "user_123",
        email: "student@example.com",
      });
    }

    this.updateSidebarState();
    await this.loadSyllabiFromService();

    // Show success message
    this.showSuccess("Successfully logged in!");
  }

  async handleRegister() {
    console.log("📝 Mock registration process...");

    // Mock registration - in real app, this would show registration modal
    this.sidebarState.isLoggedIn = true;
    this.sidebarState.userData.name = "New Student";
    this.sidebarState.userData.email = "newstudent@example.com";

    // Update syllabus service authentication status
    if (this.syllabusService) {
      this.syllabusService.updateAuthStatus(true, {
        id: "user_456",
        email: "newstudent@example.com",
      });
    }

    this.updateSidebarState();
    await this.loadSyllabiFromService();

    // Show success message
    this.showSuccess("Successfully registered and logged in!");
  }

  async handleLogout() {
    console.log("🚪 Logging out...");

    this.sidebarState.isLoggedIn = false;

    // Update syllabus service authentication status
    if (this.syllabusService) {
      this.syllabusService.updateAuthStatus(false);
    }

    this.updateSidebarState();
    await this.loadSyllabiFromService();

    // Show success message
    this.showSuccess("Successfully logged out!");
  }

  quickAction(action) {
    console.log(`⚡ Quick action: ${action}`);

    // Switch to chat state and pre-select the action
    this.setState("chat");

    // Pre-select the appropriate dropdown option
    setTimeout(() => {
      const dropdown = document.getElementById("helpType");
      if (dropdown) {
        switch (action) {
          case "chat":
            dropdown.value = "general";
            break;
          case "essay":
            dropdown.value = "essay";
            break;
          case "tutoring":
            dropdown.value = "tutoring";
            break;
        }
      }
    }, 100);

    this.showSuccess(`Starting ${action} session...`);
  }

  async toggleSyllabus(syllabusId) {
    console.log(`📚 Toggling syllabus: ${syllabusId}`);

    try {
      // Use syllabus service to toggle
      if (this.syllabusService) {
        const result = this.syllabusService.toggleSyllabus(syllabusId);

        // Update local state
        this.sidebarState.activeSyllabus = syllabusId;
        await this.loadSyllabiFromService();

        // Show success message
        const syllabus = this.syllabusService.getSyllabusById(syllabusId);
        if (syllabus) {
          this.showSuccess(`Switched to ${syllabus.filename} syllabus`);
        }
      }
    } catch (error) {
      console.error("❌ Failed to toggle syllabus:", error);
      this.showError("Failed to switch syllabus");
    }
  }

  updateSyllabusList() {
    const syllabusList = document.getElementById("syllabusList");
    if (!syllabusList) return;

    syllabusList.innerHTML = "";

    if (this.sidebarState.syllabi.length === 0) {
      // Show empty state with consistent height
      const emptyState = document.createElement("div");
      emptyState.className = "syllabus-empty-state";
      emptyState.innerHTML = `
        <div class="syllabus-icon">📚</div>
        <div class="syllabus-info">
          <div class="syllabus-name">No syllabi uploaded</div>
          <div class="syllabus-status">Upload your first syllabus to get started</div>
        </div>
      `;
      syllabusList.appendChild(emptyState);
      return;
    }

    this.sidebarState.syllabi.forEach((syllabus) => {
      const isActive = syllabus.status === "active";
      const syllabusItem = document.createElement("div");
      syllabusItem.className = `syllabus-item ${isActive ? "active" : ""}`;
      syllabusItem.setAttribute("data-syllabus-id", syllabus.id);

      // Extract display name from filename
      const displayName = syllabus.filename.replace(/\.[^/.]+$/, "");

      syllabusItem.innerHTML = `
        <div class="syllabus-icon">📖</div>
        <div class="syllabus-info">
          <div class="syllabus-name">${displayName}</div>
          <div class="syllabus-status">${
            syllabus.status === "active" ? "Active" : "Inactive"
          }</div>
        </div>
        <button class="syllabus-toggle" data-syllabus-id="${syllabus.id}">
          ${isActive ? "✓" : "○"}
        </button>
        <button class="syllabus-remove" data-syllabus-id="${
          syllabus.id
        }" title="Remove syllabus">
          ×
        </button>
      `;

      // Add click events
      const toggleBtn = syllabusItem.querySelector(".syllabus-toggle");
      const removeBtn = syllabusItem.querySelector(".syllabus-remove");

      toggleBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.toggleSyllabus(syllabus.id);
      });

      removeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.removeSyllabus(syllabus.id);
      });

      syllabusList.appendChild(syllabusItem);
    });
  }

  updateSidebarState() {
    // Update authentication section visibility
    const authSection = document.getElementById("authSection");
    const accountSection = document.getElementById("accountSection");

    if (this.sidebarState.isLoggedIn) {
      authSection.classList.add("hidden");
      accountSection.classList.remove("hidden");

      // Update user info
      const userName = document.getElementById("userName");
      const userEmail = document.getElementById("userEmail");
      const planInfo = document.getElementById("planInfo");
      const priceInfo = document.getElementById("priceInfo");
      const nextBilling = document.getElementById("nextBilling");

      if (userName) userName.textContent = this.sidebarState.userData.name;
      if (userEmail) userEmail.textContent = this.sidebarState.userData.email;
      if (planInfo)
        planInfo.textContent =
          this.planNames[this.sidebarState.userData.plan] || "Premium Plan";
      if (priceInfo)
        priceInfo.textContent = this.sidebarState.userData.price + "/month";
      if (nextBilling)
        nextBilling.textContent =
          "Next: " + this.sidebarState.userData.nextBilling;
    } else {
      authSection.classList.remove("hidden");
      accountSection.classList.add("hidden");
    }

    // Update syllabus list
    this.updateSyllabusList();
  }

  handleSettings(settingId) {
    console.log(`⚙️ Settings: ${settingId}`);

    // Mock settings handling
    switch (settingId) {
      case "notificationsBtn":
        this.showSuccess("Notifications settings opened");
        break;
      case "emailPrefsBtn":
        this.showSuccess("Email preferences opened");
        break;
      case "accountSettingsBtn":
        this.showSuccess("Account settings opened");
        break;
    }
  }

  uploadSyllabus() {
    console.log("📤 Starting syllabus upload...");

    // Create a hidden file input
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".pdf,.doc,.docx";
    fileInput.style.cssText = `
      position: absolute;
      left: -9999px;
      opacity: 0;
      pointer-events: none;
    `;

    // Add change event listener
    fileInput.addEventListener("change", (e) => {
      console.log("📁 File selected:", e.target.files[0]);
      const file = e.target.files[0];
      if (file) {
        this.processSyllabusUpload(file);
      }
      // Remove the input after file selection
      if (document.body.contains(fileInput)) {
        document.body.removeChild(fileInput);
      }
    });

    // Add cancel handling
    fileInput.addEventListener("cancel", () => {
      console.log("❌ File dialog cancelled by user");
      if (document.body.contains(fileInput)) {
        document.body.removeChild(fileInput);
      }
    });

    // Add to DOM and trigger click
    document.body.appendChild(fileInput);
    console.log("🖱️ Triggering file dialog...");
    fileInput.click();
  }

  async processSyllabusUpload(file) {
    console.log(`📚 Processing syllabus upload: ${file.name}`);
    console.log(`📊 File details:`, {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: new Date(file.lastModified).toISOString(),
    });

    try {
      this.showLoading("Uploading syllabus...");

      // Validate file first
      if (!file) {
        throw new Error("No file selected");
      }

      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        throw new Error("File size exceeds 5MB limit");
      }

      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];

      if (!allowedTypes.includes(file.type)) {
        throw new Error(
          "Invalid file type. Only PDF and Word documents are allowed"
        );
      }

      console.log("✅ File validation passed");

      // Use the unified syllabus service
      if (!this.syllabusService) {
        throw new Error("Syllabus service not available");
      }

      console.log("🔄 Calling syllabus service upload...");
      const uploadResult = await this.syllabusService.uploadSyllabus(file);
      console.log("📤 Upload result:", uploadResult);

      if (uploadResult.success) {
        // Reload syllabi from service
        await this.loadSyllabiFromService();

        this.showSuccess(
          `Syllabus "${uploadResult.syllabus.filename}" uploaded successfully!`
        );

        console.log("✅ Upload completed successfully");
      } else {
        // Handle duplicate file case
        if (uploadResult.isDuplicate) {
          const shouldReplace = confirm(
            `${uploadResult.error}\n\nWould you like to replace the existing file?`
          );

          if (shouldReplace) {
            // Remove existing file and retry upload
            if (uploadResult.existingFile) {
              await this.syllabusService.removeSyllabus(
                uploadResult.existingFile.id
              );
              // Retry upload
              const retryResult = await this.syllabusService.uploadSyllabus(
                file
              );
              if (retryResult.success) {
                await this.loadSyllabiFromService();
                this.showSuccess(
                  `Syllabus "${retryResult.syllabus.filename}" replaced successfully!`
                );
                return;
              } else {
                throw new Error(retryResult.error || "Failed to replace file");
              }
            }
          } else {
            this.showError("Upload cancelled by user");
            return;
          }
        }

        throw new Error(uploadResult.error || "Upload failed");
      }
    } catch (error) {
      console.error("❌ Syllabus upload failed:", error);
      console.error("❌ Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
      this.showError(error.message);
    } finally {
      this.hideLoading();
    }
  }

  async removeSyllabus(syllabusId) {
    console.log(`🗑️ Removing syllabus: ${syllabusId}`);

    try {
      if (this.syllabusService) {
        const result = await this.syllabusService.removeSyllabus(syllabusId);

        // Reload syllabi from service
        await this.loadSyllabiFromService();

        this.showSuccess(`Syllabus removed successfully`);
      }
    } catch (error) {
      console.error("❌ Failed to remove syllabus:", error);
      this.showError("Failed to remove syllabus");
    }
  }

  // ===== EXISTING METHODS (Updated) =====

  async checkExistingSubscription() {
    try {
      const subscriptionData = localStorage.getItem("smartypants_subscription");
      if (subscriptionData) {
        const subscription = JSON.parse(subscriptionData);
        console.log("📋 Found existing subscription:", subscription);

        // If subscription is active, go directly to chat and update sidebar
        if (subscription.status === "active") {
          this.selectedPlan = {
            level: subscription.plan,
            price: subscription.price,
            name: this.planNames[subscription.plan] || "Premium Plan",
          };

          // Update sidebar state for logged in user
          this.sidebarState.isLoggedIn = true;
          this.sidebarState.userData.plan = subscription.plan;
          this.sidebarState.userData.price = subscription.price;

          // Update syllabus service authentication status
          if (this.syllabusService) {
            this.syllabusService.updateAuthStatus(true, {
              id: subscription.userId || "subscriber",
              email: subscription.email || "subscriber@example.com",
            });
          }

          this.updateSidebarState();
          await this.loadSyllabiFromService();

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
        const landingPage = document.getElementById("landingPage");
        if (landingPage) landingPage.style.display = "block";
        break;
      case "payment":
        const paymentPage = document.getElementById("paymentPage");
        if (paymentPage) paymentPage.style.display = "block";
        this.updatePaymentDisplay();
        break;
      case "chat":
        const chatPage = document.getElementById("chatPage");
        if (chatPage) chatPage.style.display = "block";
        this.updateChatDisplay();
        break;
    }
  }

  // ===== NAVIGATION =====

  setupNavigationButtons() {
    // Demo button
    const demoButton = document.getElementById("demoButton");
    if (demoButton) {
      demoButton.addEventListener("click", () => this.startDemo());
    }

    // Back to landing button
    const backToLandingBtn = document.getElementById("backToLandingBtn");
    if (backToLandingBtn) {
      backToLandingBtn.addEventListener("click", () =>
        this.setState("landing")
      );
    }

    // Back to payment button
    const backToPaymentBtn = document.getElementById("backToPaymentBtn");
    if (backToPaymentBtn) {
      backToPaymentBtn.addEventListener("click", () =>
        this.setState("payment")
      );
    }
  }

  selectPlan(level) {
    this.selectedPlan = { level, price: this.prices[level] };
    this.setState("payment");
  }

  startDemo() {
    console.log("🎯 Starting demo mode...");
    this.setState("chat");
    this.showSuccess("Demo mode activated! Try asking SmartyPants anything.");
  }

  // ===== PAYMENT HANDLING =====

  setupPaymentButtons() {
    // Plan selection buttons
    const planButtons = document.querySelectorAll("[data-level]");
    planButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const level = button.getAttribute("data-level");
        this.selectPlan(level);
      });
    });

    // Payment method buttons
    const paymentButtons = document.querySelectorAll(".payment-button");
    paymentButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const method = button.classList.contains("paypal")
          ? "paypal"
          : "cashapp";
        this.processPayment(method);
      });
    });
  }

  updatePaymentDisplay() {
    if (this.selectedPlan) {
      const planName = this.planNames[this.selectedPlan.level];
      const planPrice = this.selectedPlan.price;

      // Update payment page content
      const paymentTitle = document.getElementById("paymentTitle");
      const paymentDescription = document.getElementById("paymentDescription");
      const selectedPlanDisplay = document.getElementById("selectedPlan");

      if (paymentTitle) {
        paymentTitle.textContent = `Complete Your ${planName} Subscription`;
      }
      if (paymentDescription) {
        paymentDescription.textContent = `You're just one step away from accessing SmartyPants-AI's ${planName.toLowerCase()} features!`;
      }
      if (selectedPlanDisplay) {
        selectedPlanDisplay.innerHTML = `
          <strong>Selected Plan:</strong> ${planName}<br>
          <strong>Price:</strong> ${planPrice}/month
        `;
      }
    }
  }

  async processPayment(method) {
    console.log(`💳 Processing ${method} payment...`);

    try {
      this.showLoading("Processing payment...");

      // Collect customer information first
      const customerInfo = await this.collectCustomerInfo();
      if (!customerInfo) {
        this.hideLoading();
        return; // User cancelled
      }

      // Process payment through service
      const paymentResult = await this.paymentService.processPayment(
        method,
        this.selectedPlan,
        customerInfo
      );

      if (paymentResult.success) {
        this.showSuccess("Payment successful! Welcome to SmartyPants-AI!");

        // Update sidebar for logged in user
        this.sidebarState.isLoggedIn = true;
        this.sidebarState.userData.plan = this.selectedPlan.level;
        this.sidebarState.userData.price = this.selectedPlan.price;

        // Update syllabus service authentication status
        if (this.syllabusService) {
          this.syllabusService.updateAuthStatus(true, {
            id: paymentResult.userId || "new_user",
            email: customerInfo.email,
          });
        }

        this.updateSidebarState();
        this.loadSyllabiFromService();

        // Switch to chat
        setTimeout(() => {
          this.setState("chat");
        }, 2000);
      } else {
        throw new Error(paymentResult.error);
      }
    } catch (error) {
      console.error("❌ Payment failed:", error);
      this.showError(error.message);
    } finally {
      this.hideLoading();
    }
  }

  async collectCustomerInfo() {
    return new Promise((resolve) => {
      this.showCustomerInfoModal();

      // Store resolve function to be called when modal is submitted
      this.customerModalResolve = resolve;
    });
  }

  showCustomerInfoModal() {
    if (!this.customerModal) {
      this.createCustomerModal();
    }
    this.customerModal.style.display = "flex";
  }

  createCustomerModal() {
    this.customerModal = document.createElement("div");
    this.customerModal.className = "customer-modal";
    this.customerModal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>Complete Your Registration</h3>
          <p>Please provide your information to complete your subscription</p>
        </div>
        <form class="customer-form" id="customerForm">
          <div class="form-group">
            <label for="customerName">Full Name *</label>
            <input type="text" id="customerName" name="name" required>
          </div>
          <div class="form-group">
            <label for="customerEmail">Email Address *</label>
            <input type="email" id="customerEmail" name="email" required>
          </div>
          <div class="form-group">
            <label for="customerPhone">Phone Number</label>
            <input type="tel" id="customerPhone" name="phone">
          </div>
          <div class="form-group">
            <label for="customerSchool">School/Institution</label>
            <input type="text" id="customerSchool" name="school">
          </div>
          <div class="form-group">
            <label for="customerLevel">Education Level</label>
            <select id="customerLevel" name="level">
              <option value="high-school">High School</option>
              <option value="college" selected>College/University</option>
              <option value="graduate">Graduate School</option>
              <option value="professional">Professional Development</option>
            </select>
          </div>
          <div class="form-actions">
            <button type="button" class="cancel-btn" id="cancelCustomerInfo">Cancel</button>
            <button type="submit" class="continue-btn">Continue to Payment</button>
          </div>
        </form>
        <div class="privacy-note">
          <p>🔒 Your information is secure and will only be used for account management and support.</p>
        </div>
      </div>
    `;

    document.body.appendChild(this.customerModal);

    // Add event listeners
    const form = this.customerModal.querySelector("#customerForm");
    const cancelBtn = this.customerModal.querySelector("#cancelCustomerInfo");

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const customerData = Object.fromEntries(formData.entries());

      if (this.validateCustomerData(customerData)) {
        this.customerData = customerData;
        this.hideCustomerModal();
        if (this.customerModalResolve) {
          this.customerModalResolve(customerData);
        }
      }
    });

    cancelBtn.addEventListener("click", () => {
      this.hideCustomerModal();
      if (this.customerModalResolve) {
        this.customerModalResolve(null);
      }
    });
  }

  validateCustomerData(customerData) {
    if (!customerData.name || customerData.name.trim().length < 2) {
      this.showError("Please enter a valid name");
      return false;
    }

    if (!this.isValidEmail(customerData.email)) {
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

  // ===== CHAT INTERFACE =====

  setupChatInterface() {
    // Form submission
    const chatForm = document.getElementById("chatForm");
    if (chatForm) {
      chatForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleChatRequest();
      });
    }

    // Setup form dropdowns
    this.setupFormDropdowns();
  }

  setupFormDropdowns() {
    // Education level dropdown
    const educationLevel = document.getElementById("educationLevel");
    if (educationLevel) {
      educationLevel.addEventListener("change", () => {
        this.updateChatDisplay();
      });
    }

    // Help type dropdown
    const helpType = document.getElementById("helpType");
    if (helpType) {
      helpType.addEventListener("change", () => {
        this.updateChatDisplay();
      });
    }
  }

  updateChatDisplay() {
    // Update form based on selections
    const educationLevel = document.getElementById("educationLevel");
    const helpType = document.getElementById("helpType");
    const questionInput = document.getElementById("question");

    if (educationLevel && helpType && questionInput) {
      const level = educationLevel.value;
      const type = helpType.value;

      // Update placeholder based on selections
      const placeholders = {
        "high-school": {
          general: "Ask me anything about your high school studies...",
          essay: "Tell me about your essay topic or writing assignment...",
          tutoring: "What subject or topic do you need help with?",
          homework: "What homework problem are you working on?",
          "test-prep": "What test or exam are you preparing for?",
        },
        college: {
          general: "Ask me anything about your college coursework...",
          essay: "Tell me about your college essay or research paper...",
          tutoring: "What college subject or concept do you need help with?",
          homework: "What college assignment are you working on?",
          "test-prep": "What college exam are you studying for?",
        },
        graduate: {
          general: "Ask me anything about your graduate studies...",
          essay: "Tell me about your graduate thesis or research...",
          tutoring: "What graduate-level concept do you need help with?",
          homework: "What graduate assignment are you working on?",
          "test-prep": "What graduate exam are you preparing for?",
        },
        professional: {
          general: "Ask me anything about your professional development...",
          essay: "Tell me about your professional writing project...",
          tutoring: "What professional skill do you need help with?",
          homework: "What professional project are you working on?",
          "test-prep": "What professional certification are you studying for?",
        },
      };

      const placeholder = placeholders[level]?.[type] || "Ask me anything...";
      questionInput.placeholder = placeholder;
    }
  }

  updateDemoDisplay() {
    // Update demo-specific content
    const demoTitle = document.getElementById("demoTitle");
    if (demoTitle) {
      demoTitle.textContent = "🎯 SmartyPants-AI Demo Mode";
    }

    const demoDescription = document.getElementById("demoDescription");
    if (demoDescription) {
      demoDescription.textContent =
        "Try out SmartyPants-AI's capabilities with this demo. No subscription required!";
    }
  }

  async handleChatRequest() {
    const questionInput = document.getElementById("question");
    const educationLevel = document.getElementById("educationLevel");
    const helpType = document.getElementById("helpType");
    const responseDiv = document.getElementById("response");

    if (!questionInput || !responseDiv) return;

    const question = questionInput.value.trim();
    if (!question) {
      this.showError("Please enter your question");
      return;
    }

    // Get selected options
    const level = educationLevel ? educationLevel.value : "college";
    const type = helpType ? helpType.value : "general";

    // Show loading state
    this.showChatLoading(responseDiv);

    try {
      // Get active syllabus for context
      const activeSyllabus = this.syllabusService
        ? this.syllabusService.getActiveSyllabus()
        : null;

      // Prepare request data
      const requestData = {
        question: question,
        educationLevel: level,
        helpType: type,
        syllabus: activeSyllabus
          ? {
              id: activeSyllabus.id,
              filename: activeSyllabus.filename,
              subject: activeSyllabus.metadata?.subject,
            }
          : null,
        isDemo: this.currentState === "demo",
      };

      // Send to AI service
      const response = await this.aiService.askQuestion(requestData);

      if (response.success) {
        this.showChatResponse(responseDiv, response.answer, response.timestamp);
        questionInput.value = ""; // Clear input
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error("❌ Chat request failed:", error);
      this.showChatError(responseDiv, error.message);
    }
  }

  getChatOptions() {
    const educationLevel = document.getElementById("educationLevel");
    const helpType = document.getElementById("helpType");

    return {
      level: educationLevel ? educationLevel.value : "college",
      type: helpType ? helpType.value : "general",
    };
  }

  showChatLoading(responseDiv) {
    responseDiv.innerHTML = `
      <div class="thinking-indicator">
        <h4>🤔 SmartyPants is thinking...</h4>
        <div class="thinking-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <p>Analyzing your question and preparing a helpful response...</p>
      </div>
    `;
  }

  showChatResponse(responseDiv, answer, timestamp) {
    const formattedTime = new Date(timestamp).toLocaleTimeString();

    responseDiv.innerHTML = `
      <div class="response-header">
        <h4>💡 SmartyPants Response</h4>
        <div class="response-actions">
          <button class="copy-response-btn" onclick="uiController.copyResponse()">Copy</button>
          <button class="clear-response-btn" onclick="uiController.clearResponse()">Clear</button>
        </div>
      </div>
      <div class="response-content">${answer}</div>
      <div class="response-timestamp">Generated at ${formattedTime}</div>
    `;
  }

  showChatError(responseDiv, errorMessage) {
    responseDiv.innerHTML = `
      <div class="error-response">
        <h4>❌ Error</h4>
        <p>${errorMessage}</p>
        <button class="retry-btn" onclick="uiController.handleChatRequest()">Try Again</button>
      </div>
    `;
  }

  // ===== UTILITY METHODS =====

  showLoading(message = "Processing...") {
    const loadingOverlay = document.querySelector(".loading-overlay");
    if (loadingOverlay) {
      const messageElement = loadingOverlay.querySelector("p");
      if (messageElement) {
        messageElement.textContent = message;
      }
      loadingOverlay.classList.remove("hidden");
    }
  }

  hideLoading() {
    const loadingOverlay = document.querySelector(".loading-overlay");
    if (loadingOverlay) {
      loadingOverlay.classList.add("hidden");
    }
  }

  showError(message) {
    const statusDiv = document.getElementById("statusMessage");
    if (statusDiv) {
      statusDiv.innerHTML = `<div class="status-message error">❌ ${message}</div>`;
      setTimeout(() => {
        statusDiv.innerHTML = "";
      }, 5000);
    }
  }

  showSuccess(message) {
    const statusDiv = document.getElementById("statusMessage");
    if (statusDiv) {
      statusDiv.innerHTML = `<div class="status-message success">✅ ${message}</div>`;
      setTimeout(() => {
        statusDiv.innerHTML = "";
      }, 5000);
    }
  }

  copyResponse() {
    const responseContent = document.querySelector(".response-content");
    if (responseContent) {
      navigator.clipboard
        .writeText(responseContent.textContent)
        .then(() => {
          this.showSuccess("Response copied to clipboard!");
        })
        .catch(() => {
          this.showError("Failed to copy response");
        });
    }
  }

  clearResponse() {
    const responseDiv = document.getElementById("response");
    if (responseDiv) {
      responseDiv.innerHTML = `
        <div class="response-placeholder">
          <h4>💡 SmartyPants will respond here!</h4>
          <p>Fill out the form above and click "Ask SmartyPants Now!" to get your personalized help.</p>
        </div>
      `;
    }
  }

  // ===== EVENT LISTENERS =====

  setupEventListeners() {
    // Global event listeners
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.hideCustomerModal();
      }
    });

    // PWA install setup
    this.setupPWAInstall();
  }

  setupPWAInstall() {
    let deferredPrompt;

    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      deferredPrompt = e;

      const installBanner = document.getElementById("installBanner");
      if (installBanner) {
        installBanner.classList.remove("hidden");
      }
    });

    const installButton = document.getElementById("installButton");
    if (installButton) {
      installButton.addEventListener("click", async () => {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          console.log(`User response to install prompt: ${outcome}`);
          deferredPrompt = null;

          const installBanner = document.getElementById("installBanner");
          if (installBanner) {
            installBanner.classList.add("hidden");
          }
        }
      });
    }

    const dismissInstall = document.getElementById("dismissInstall");
    if (dismissInstall) {
      dismissInstall.addEventListener("click", () => {
        const installBanner = document.getElementById("installBanner");
        if (installBanner) {
          installBanner.classList.add("hidden");
        }
      });
    }
  }
}

// Create global instance
console.log("🎮 Creating UI controller instance...");
window.uiController = new UIController();

// Global function for demo button
window.startDemo = () => {
  window.uiController.startDemo();
};

console.log("✅ UI CONTROLLER LOADED SUCCESSFULLY!");

// Add debug methods for testing
window.debugUpload = () => {
  console.log("🔍 Debug: Testing upload button...");
  const uploadBtn = document.getElementById("uploadSyllabusBtn");
  if (uploadBtn) {
    console.log("✅ Upload button found, clicking...");
    uploadBtn.click();
  } else {
    console.log("❌ Upload button not found");
  }
};

window.debugSyllabusService = () => {
  console.log("🔍 Debug: Syllabus service status...");
  if (window.uiController && window.uiController.syllabusService) {
    console.log("✅ Syllabus service available");
    console.log(
      "📚 Current syllabi:",
      window.uiController.syllabusService.getAllSyllabi()
    );
  } else {
    console.log("❌ Syllabus service not available");
  }
};

window.debugSidebarState = () => {
  console.log("🔍 Debug: Sidebar state...");
  if (window.uiController) {
    console.log("📊 Sidebar state:", window.uiController.sidebarState);
  } else {
    console.log("❌ UI controller not available");
  }
};

window.testFileUpload = () => {
  console.log("🧪 Testing file upload functionality...");
  if (window.uiController) {
    window.uiController.uploadSyllabus();
  } else {
    console.log("❌ UI controller not available");
  }
};

window.debugSyllabusStorage = () => {
  console.log("🔍 Debug: Syllabus storage status...");
  if (window.syllabusService) {
    const debugInfo = window.syllabusService.debugLocalStorage();
    console.log("📊 Debug info:", debugInfo);

    if (window.uiController) {
      console.log(
        "📋 UI Controller syllabi:",
        window.uiController.sidebarState.syllabi
      );
    }
  } else {
    console.log("❌ Syllabus service not available");
  }
};
