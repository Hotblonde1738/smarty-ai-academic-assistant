// UI CONTROLLER - MVC Style State Management
// This consolidates all UI interactions, button handling, and state management

console.log("🎮 UI CONTROLLER LOADING...");

// Import NavManager (assume it is loaded globally or via import if using modules)
// import { NavManager } from './services/nav-manager';

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
    this.stripePaymentService = window.stripePaymentService;
    this.aiService = window.aiService;
    this.emailService = window.emailService;
    this.syllabusService = window.syllabusService;

    console.log("🔍 Services loaded:", {
      payment: !!this.paymentService,
      stripe: !!this.stripePaymentService,
      ai: !!this.aiService,
      email: !!this.emailService,
      syllabus: !!this.syllabusService,
    });

    // Use payment service for plan data
    this.prices = this.paymentService.prices;
    this.planNames = this.paymentService.planNames;

    // Syllabus navigation state
    this.syllabusNavState = {
      currentPage: 0,
      itemsPerPage: 3,
    };

    // PDF viewer state
    this.pdfViewerState = {
      isOpen: false,
      currentSyllabus: null,
      currentPage: 1,
      totalPages: 0,
      fileType: null, // 'pdf' or 'word'
      convertedUrl: null, // URL for converted PDF
    };

    // AI context management
    this.aiContext = {
      activeSyllabus: null,
      syllabusContext: "",
      customInstructions: "",
    };

    // NavManager integration
    this.navManager = window.NavManager ? new window.NavManager() : null;
    window.navManager = this.navManager; // Attach instance globally
    console.log(
      "🔍 NavManager available:",
      !!window.NavManager,
      "Instance:",
      !!this.navManager
    );

    // ContentManager integration
    this.contentManager = window.ContentManager
      ? new window.ContentManager()
      : null;

    console.log("🔍 ContentManager available:", !!this.contentManager);

    this.init();
  }

  async init() {
    console.log("🚀 Initializing UI Controller...");

    // Ensure #navbar container exists
    if (!document.getElementById("navbar")) {
      const navbarDiv = document.createElement("div");
      navbarDiv.id = "navbar";
      document.body.prepend(navbarDiv);
    }

    // Load main content and sidebar
    await this.loadContent();

    // Initialize NavManager and render navbar
    if (this.navManager) {
      console.log("✅ Initializing NavManager...");
      this.navManager.init();
      this.navManager.onNavChange((area) => {
        console.log("NavManager navchange event:", area);
        // Optionally handle nav changes here
      });
    } else {
      console.warn("⚠️ NavManager not available, trying to create it...");
      // Try to create NavManager if it's available now
      if (window.NavManager) {
        this.navManager = new window.NavManager();
        console.log("✅ NavManager created successfully");
        this.navManager.init();
        this.navManager.onNavChange((area) => {
          console.log("NavManager navchange event:", area);
        });
      } else {
        console.error("❌ NavManager still not available");
      }
    }

    // Wait for syllabus service to be available and initialized
    await this.waitForSyllabusService();

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
    this.setupMainNavigation();
    this.setupNavigationButtons();
    this.setupPaymentButtons();
    this.setupChatInterface();
    this.setupFormDropdowns();
    this.setupEventListeners();
    this.setupPWAInstall();

    // Listen for syllabus service ready event
    window.addEventListener("syllabusServiceReady", async (event) => {
      console.log("📚 Syllabus service ready event received in UI controller");
      if (this.syllabusService) {
        await this.loadSyllabiFromService();
      }
    });

    // Check for existing subscription
    await this.checkExistingSubscription();

    // Check for Stripe payment return
    await this.handleStripePaymentReturn();

    // Set initial state
    this.setState("landing");

    console.log("✅ UI Controller initialized");
  }

  // Load main content and sidebar
  async loadContent() {
    console.log("📄 Loading content...");

    try {
      // Load sidebar content
      const sidebarResponse = await fetch("/partials/sidebar.html");
      if (sidebarResponse.ok) {
        const sidebarHtml = await sidebarResponse.text();
        const sidebar = document.getElementById("sidebar");
        if (sidebar) {
          sidebar.innerHTML = sidebarHtml;
          console.log("✅ Sidebar content loaded");
        }
      }

      // Load main content
      const mainResponse = await fetch("/partials/home.html");
      if (mainResponse.ok) {
        const mainHtml = await mainResponse.text();
        const mainContent = document.getElementById("mainContent");
        if (mainContent) {
          mainContent.innerHTML = mainHtml;
          console.log("✅ Main content loaded");
        }
      }
    } catch (error) {
      console.error("❌ Failed to load content:", error);
      // Fallback: create basic content structure
      this.createFallbackContent();
    }
  }

  // Load pricing content as fallback
  async loadPricingContent() {
    console.log("📄 Loading pricing content directly...");
    try {
      const response = await fetch("/partials/pricing.html");
      if (response.ok) {
        const pricingHtml = await response.text();
        const mainContent = document.getElementById("mainContent");
        if (mainContent) {
          mainContent.innerHTML = pricingHtml;
          console.log("✅ Pricing content loaded directly");

          // Initialize pricing functionality immediately
          this.initializePricingPage();

          // Also execute the pricing script to ensure plans are populated
          setTimeout(() => {
            this.executePricingScript();
          }, 100);
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error("❌ Failed to load pricing content:", error);
      this.showError("Failed to load pricing page");
    }
  }

  // Initialize pricing page functionality
  initializePricingPage() {
    console.log("🔧 Initializing pricing page functionality...");

    // Execute the pricing page JavaScript manually
    this.executePricingScript();

    // Initialize pricing page if stripe service is available
    if (window.stripePaymentService) {
      console.log("✅ Stripe service available for pricing");
    } else {
      console.warn("⚠️ Stripe service not available for pricing");
    }

    // Debug: Check if plans grid exists and populate if empty
    setTimeout(() => {
      const plansGrid = document.getElementById("plansGrid");
      if (plansGrid) {
        console.log("✅ Plans grid found, content:", plansGrid.innerHTML);

        // If plans grid is empty, force populate it
        if (
          plansGrid.innerHTML.trim() ===
          "<!-- Plans will be dynamically populated by JavaScript -->"
        ) {
          console.log("🔄 Plans grid is empty, forcing population...");
          this.executePricingScript();
        }
      } else {
        console.error("❌ Plans grid not found");
      }
    }, 200);
  }

  // Execute pricing page JavaScript
  executePricingScript() {
    console.log("🎯 Executing pricing script via helper...");

    try {
      // Use pricing helper if available
      if (window.PricingHelper) {
        console.log("🔧 Using pricing helper to initialize...");
        window.PricingHelper.initializePricing();
        console.log("✅ Pricing helper initialization completed");
      } else {
        console.warn("⚠️ Pricing helper not available");
      }
    } catch (error) {
      console.error("❌ Error executing pricing script:", error);
    }
  }

  // Wait for syllabus service to be available and initialized
  async waitForSyllabusService() {
    console.log("⏳ Waiting for syllabus service to be ready...");

    // Wait for syllabus service to be created
    let attempts = 0;
    const maxAttempts = 50; // 5 seconds max wait

    while (!window.syllabusService && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      attempts++;
    }

    if (!window.syllabusService) {
      console.warn("⚠️ Syllabus service not found after waiting");
      return;
    }

    // Wait for syllabus service to finish initialization
    if (!window.syllabusService.isInitialized) {
      console.log("⏳ Waiting for syllabus service initialization...");

      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.warn("⚠️ Syllabus service initialization timeout");
          resolve();
        }, 5000); // 5 second timeout

        window.addEventListener(
          "syllabusServiceReady",
          (event) => {
            clearTimeout(timeout);
            console.log(
              "✅ Syllabus service ready event received:",
              event.detail
            );
            resolve();
          },
          { once: true }
        );
      });
    } else {
      console.log("✅ Syllabus service already initialized");
    }
  }

  // ===== PDF VIEWER METHODS =====

  openPdfViewer(syllabus) {
    console.log("📄 Opening document viewer for:", syllabus.filename);

    this.pdfViewerState.isOpen = true;
    this.pdfViewerState.currentSyllabus = syllabus;
    this.pdfViewerState.currentPage = 1;
    this.pdfViewerState.convertedUrl = null;

    // Determine file type
    const fileExtension = syllabus.filename.split(".").pop()?.toLowerCase();
    this.pdfViewerState.fileType = fileExtension === "pdf" ? "pdf" : "word";

    this.createPdfViewer();
    this.loadDocumentContent(syllabus);
  }

  createPdfViewer() {
    // Remove existing viewer if any
    const existingViewer = document.getElementById("pdfViewer");
    if (existingViewer) {
      existingViewer.remove();
    }

    const viewer = document.createElement("div");
    viewer.id = "pdfViewer";
    viewer.className = "pdf-viewer-overlay";

    const fileIcon = this.pdfViewerState.fileType === "pdf" ? "📄" : "📝";
    const loadingText =
      this.pdfViewerState.fileType === "pdf"
        ? "Loading PDF..."
        : "Loading document...";

    viewer.innerHTML = `
      <div class="pdf-viewer-container">
        <div class="pdf-viewer-header">
          <div class="pdf-viewer-title">
            <span class="pdf-icon">${fileIcon}</span>
            <span class="pdf-filename">${
              this.pdfViewerState.currentSyllabus.filename
            }</span>
            <span class="file-type-badge">${this.pdfViewerState.fileType.toUpperCase()}</span>
          </div>
          <div class="pdf-viewer-controls">
            <button class="pdf-control-btn" id="pdfPrevPage" title="Previous page">‹</button>
            <span class="pdf-page-info" id="pdfPageInfo">Page 1</span>
            <button class="pdf-control-btn" id="pdfNextPage" title="Next page">›</button>
            <button class="pdf-control-btn" id="pdfZoomOut" title="Zoom out">−</button>
            <button class="pdf-control-btn" id="pdfZoomIn" title="Zoom in">+</button>
            <button class="pdf-control-btn" id="pdfClose" title="Close">×</button>
          </div>
        </div>
        <div class="pdf-viewer-content">
          <div class="pdf-loading" id="pdfLoading">
            <div class="pdf-loading-spinner"></div>
            <p>${loadingText}</p>
          </div>
          <iframe id="pdfFrame" class="pdf-frame" style="display: none;"></iframe>
          <div id="wordViewer" class="word-viewer" style="display: none;"></div>
        </div>
        <div class="pdf-viewer-footer">
          <div class="pdf-ai-integration">
            <button class="pdf-ai-btn" id="pdfAiContext" title="Use this syllabus for AI context">
              🤖 Use for AI Context
            </button>
            <button class="pdf-ai-btn" id="pdfAiAnalyze" title="Analyze syllabus with AI">
              🔍 AI Analysis
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(viewer);

    // Add event listeners
    this.setupPdfViewerEvents();
  }

  setupPdfViewerEvents() {
    const viewer = document.getElementById("pdfViewer");
    const closeBtn = document.getElementById("pdfClose");
    const prevBtn = document.getElementById("pdfPrevPage");
    const nextBtn = document.getElementById("pdfNextPage");
    const zoomInBtn = document.getElementById("pdfZoomIn");
    const zoomOutBtn = document.getElementById("pdfZoomOut");
    const aiContextBtn = document.getElementById("pdfAiContext");
    const aiAnalyzeBtn = document.getElementById("pdfAiAnalyze");

    // Close viewer
    closeBtn.addEventListener("click", () => this.closePdfViewer());

    // Close on overlay click
    viewer.addEventListener("click", (e) => {
      if (e.target === viewer) {
        this.closePdfViewer();
      }
    });

    // Close on escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.pdfViewerState.isOpen) {
        this.closePdfViewer();
      }
    });

    // Navigation controls
    prevBtn.addEventListener("click", () => this.pdfPrevPage());
    nextBtn.addEventListener("click", () => this.pdfNextPage());
    zoomInBtn.addEventListener("click", () => this.pdfZoomIn());
    zoomOutBtn.addEventListener("click", () => this.pdfZoomOut());

    // AI integration
    aiContextBtn.addEventListener("click", () => this.setAiContext());
    aiAnalyzeBtn.addEventListener("click", () => this.analyzeSyllabus());
  }

  async loadDocumentContent(syllabus) {
    const loading = document.getElementById("pdfLoading");
    const frame = document.getElementById("pdfFrame");
    const wordViewer = document.getElementById("wordViewer");

    try {
      // Show loading
      loading.style.display = "flex";
      frame.style.display = "none";
      wordViewer.style.display = "none";

      if (this.pdfViewerState.fileType === "pdf") {
        await this.loadPdfDocument(syllabus);
      } else {
        await this.loadWordDocument(syllabus);
      }
    } catch (error) {
      console.error("❌ Failed to load document:", error);
      loading.innerHTML = `
        <div class="pdf-error">
          <p>❌ Failed to load document</p>
          <p>${error.message}</p>
          <button class="retry-btn" onclick="uiController.loadDocumentContent(uiController.pdfViewerState.currentSyllabus)">
            🔄 Retry
          </button>
        </div>
      `;
    }
  }

  async loadPdfDocument(syllabus) {
    const loading = document.getElementById("pdfLoading");
    const frame = document.getElementById("pdfFrame");

    // Get PDF URL
    let pdfUrl;
    if (syllabus.url) {
      pdfUrl = syllabus.url;
    } else if (syllabus.fileData) {
      pdfUrl = syllabus.fileData;
    } else {
      throw new Error("No PDF data available");
    }

    // Set iframe source
    frame.src = pdfUrl;

    // Wait for iframe to load
    frame.onload = () => {
      loading.style.display = "none";
      frame.style.display = "block";
      console.log("✅ PDF loaded successfully");
    };

    frame.onerror = () => {
      throw new Error("Failed to load PDF");
    };
  }

  async loadWordDocument(syllabus) {
    const loading = document.getElementById("pdfLoading");
    const wordViewer = document.getElementById("wordViewer");

    try {
      // Try to convert Word to PDF first
      const convertedPdf = await this.convertWordToPdf(syllabus);

      if (convertedPdf) {
        // Use converted PDF in iframe
        const frame = document.getElementById("pdfFrame");
        frame.src = convertedPdf;

        frame.onload = () => {
          loading.style.display = "none";
          frame.style.display = "block";
          console.log("✅ Word document converted and loaded successfully");
        };
      } else {
        // Fallback to Word viewer
        await this.showWordViewer(syllabus);
      }
    } catch (error) {
      console.warn("⚠️ Word to PDF conversion failed, using fallback:", error);
      await this.showWordViewer(syllabus);
    }
  }

  async convertWordToPdf(syllabus) {
    console.log("🔄 Attempting to convert Word document to PDF...");

    try {
      // Get the Word file data
      let fileData;
      if (syllabus.file) {
        fileData = syllabus.file;
      } else if (syllabus.fileData) {
        // Convert base64 to blob if needed
        const response = await fetch(syllabus.fileData);
        fileData = await response.blob();
      } else {
        throw new Error("No Word file data available");
      }

      // Use mammoth.js to convert Word to HTML first
      const mammoth = await this.loadMammoth();
      const result = await mammoth.convertToHtml({
        arrayBuffer: await fileData.arrayBuffer(),
      });

      if (result.value) {
        // Convert HTML to PDF using html2pdf.js
        const html2pdf = await this.loadHtml2Pdf();

        const element = document.createElement("div");
        element.innerHTML = `
          <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6;">
            <h1 style="color: #333; border-bottom: 2px solid #38bdf8; padding-bottom: 10px;">
              ${syllabus.filename}
            </h1>
            ${result.value}
          </div>
        `;

        const pdfBlob = await html2pdf().from(element).outputPdf("blob");
        const pdfUrl = URL.createObjectURL(pdfBlob);

        // Store the converted URL for cleanup
        this.pdfViewerState.convertedUrl = pdfUrl;

        console.log("✅ Word document converted to PDF successfully");
        return pdfUrl;
      } else {
        throw new Error("Failed to convert Word document content");
      }
    } catch (error) {
      console.error("❌ Word to PDF conversion failed:", error);
      return null;
    }
  }

  async showWordViewer(syllabus) {
    const loading = document.getElementById("pdfLoading");
    const wordViewer = document.getElementById("wordViewer");

    try {
      // Get the Word file data
      let fileData;
      if (syllabus.file) {
        fileData = syllabus.file;
      } else if (syllabus.fileData) {
        const response = await fetch(syllabus.fileData);
        fileData = await response.blob();
      } else {
        throw new Error("No Word file data available");
      }

      // Use mammoth.js to convert to HTML for display
      const mammoth = await this.loadMammoth();
      const result = await mammoth.convertToHtml({
        arrayBuffer: await fileData.arrayBuffer(),
      });

      if (result.value) {
        wordViewer.innerHTML = `
          <div class="word-content">
            <div class="word-header">
              <h1>${syllabus.filename}</h1>
            </div>
            <div class="word-body">
              ${result.value}
            </div>
          </div>
        `;

        loading.style.display = "none";
        wordViewer.style.display = "block";
        console.log("✅ Word document displayed in HTML viewer");
      } else {
        throw new Error("Failed to convert Word document content");
      }
    } catch (error) {
      console.error("❌ Word viewer failed:", error);
      throw error;
    }
  }

  async loadMammoth() {
    // Load mammoth.js dynamically
    if (window.mammoth) {
      return window.mammoth;
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js";
      script.onload = () => resolve(window.mammoth);
      script.onerror = () => reject(new Error("Failed to load mammoth.js"));
      document.head.appendChild(script);
    });
  }

  async loadHtml2Pdf() {
    // Load html2pdf.js dynamically
    if (window.html2pdf) {
      return window.html2pdf;
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
      script.onload = () => resolve(window.html2pdf);
      script.onerror = () => reject(new Error("Failed to load html2pdf.js"));
      document.head.appendChild(script);
    });
  }

  closePdfViewer() {
    console.log("📄 Closing document viewer");

    // Clean up converted PDF URL if exists
    if (this.pdfViewerState.convertedUrl) {
      URL.revokeObjectURL(this.pdfViewerState.convertedUrl);
      this.pdfViewerState.convertedUrl = null;
    }

    this.pdfViewerState.isOpen = false;
    this.pdfViewerState.currentSyllabus = null;
    this.pdfViewerState.fileType = null;

    const viewer = document.getElementById("pdfViewer");
    if (viewer) {
      viewer.remove();
    }
  }

  pdfPrevPage() {
    // PDF.js navigation would go here
    console.log("📄 Previous page");
  }

  pdfNextPage() {
    // PDF.js navigation would go here
    console.log("📄 Next page");
  }

  pdfZoomIn() {
    const frame = document.getElementById("pdfFrame");
    // Implement zoom functionality
    console.log("📄 Zoom in");
  }

  pdfZoomOut() {
    const frame = document.getElementById("pdfFrame");
    // Implement zoom functionality
    console.log("📄 Zoom out");
  }

  setAiContext() {
    const syllabus = this.pdfViewerState.currentSyllabus;
    console.log("🤖 Setting AI context for:", syllabus.filename);

    // Update AI context
    this.aiContext.activeSyllabus = syllabus;
    this.aiContext.syllabusContext = `Current syllabus: ${syllabus.filename}`;

    // Update AI service context
    if (this.aiService) {
      this.aiService.setSyllabusContext(syllabus);
    }

    // Update syllabus service
    if (this.syllabusService) {
      this.syllabusService.toggleSyllabus(syllabus.id);
    }

    // Show success message
    this.showSuccess(`AI context set to: ${syllabus.filename}`);

    // Update chat interface to show context
    this.updateChatContext();

    // Close viewer
    this.closePdfViewer();
  }

  async analyzeSyllabus() {
    const syllabus = this.pdfViewerState.currentSyllabus;
    console.log("🔍 Analyzing syllabus:", syllabus.filename);

    try {
      this.showLoading("Analyzing syllabus with AI...");

      // Create analysis prompt
      const analysisPrompt = `
        Please analyze this syllabus and provide:
        1. Course overview and objectives
        2. Key topics and learning outcomes
        3. Assessment methods and grading
        4. Important dates and deadlines
        5. Required materials and resources
        6. Study recommendations
        
        Syllabus: ${syllabus.filename}
      `;

      // Use AI service to analyze
      if (this.aiService) {
        const response = await this.aiService.sendChatRequest(analysisPrompt, {
          helpType: "analysis",
          subject: syllabus.metadata?.subject || "general",
        });

        // Show analysis in a modal
        if (response.success) {
          this.showSyllabusAnalysis(response.answer);
        } else {
          throw new Error(response.error || "Failed to analyze syllabus");
        }
      } else {
        throw new Error("AI service not available");
      }
    } catch (error) {
      console.error("❌ Syllabus analysis failed:", error);
      this.showError("Failed to analyze syllabus: " + error.message);
    } finally {
      this.hideLoading();
    }
  }

  showSyllabusAnalysis(analysis) {
    const modal = document.createElement("div");
    modal.className = "analysis-modal-overlay";

    modal.innerHTML = `
      <div class="analysis-modal">
        <div class="analysis-header">
          <h3>📋 Syllabus Analysis</h3>
          <button class="analysis-close" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
        </div>
        <div class="analysis-content">
          <div class="analysis-text">${analysis}</div>
        </div>
        <div class="analysis-actions">
          <button class="analysis-btn" onclick="uiController.copyAnalysis()">📋 Copy</button>
          <button class="analysis-btn" onclick="uiController.closeAnalysis()">Close</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  }

  copyAnalysis() {
    const analysisText = document.querySelector(".analysis-text").textContent;
    navigator.clipboard.writeText(analysisText).then(() => {
      this.showSuccess("Analysis copied to clipboard!");
    });
  }

  closeAnalysis() {
    const modal = document.querySelector(".analysis-modal-overlay");
    if (modal) {
      modal.remove();
    }
  }

  // Update chat interface to show syllabus context
  updateChatContext() {
    const chatContainer = document.querySelector(".chat-container");
    if (!chatContainer) return;

    // Remove existing context indicator
    const existingContext = chatContainer.querySelector(
      ".syllabus-context-indicator"
    );
    if (existingContext) {
      existingContext.remove();
    }

    // Add context indicator if syllabus is active
    if (this.aiContext.activeSyllabus) {
      const contextIndicator = document.createElement("div");
      contextIndicator.className = "syllabus-context-indicator";
      contextIndicator.innerHTML = `
        <div class="context-header">
          <span class="context-icon">📚</span>
          <span class="context-text">AI Context: ${this.aiContext.activeSyllabus.filename}</span>
          <button class="context-clear" onclick="uiController.clearAiContext()" title="Clear context">×</button>
        </div>
      `;

      // Insert at the top of chat container
      chatContainer.insertBefore(contextIndicator, chatContainer.firstChild);
    }
  }

  // Clear AI context
  clearAiContext() {
    console.log("🤖 Clearing AI context");

    this.aiContext.activeSyllabus = null;
    this.aiContext.syllabusContext = "";

    // Clear AI service context
    if (this.aiService) {
      this.aiService.clearSyllabusContext();
    }

    // Update UI
    this.updateChatContext();
    this.showSuccess("AI context cleared");
  }

  // Load syllabi from the unified syllabus service
  async loadSyllabiFromService() {
    console.log("📚 Loading syllabi from service...");

    if (this.syllabusService) {
      try {
        // Ensure service is ready
        if (!this.syllabusService.isReady()) {
          console.log("⏳ Syllabus service not ready, waiting...");
          await this.waitForSyllabusService();
        }

        // Get all syllabi from service
        const syllabi = this.syllabusService.getAllSyllabi();
        console.log("📋 Service syllabi:", syllabi);

        // Update sidebar state
        this.sidebarState.syllabi = syllabi;

        // Update the active syllabus
        const activeSyllabus = this.syllabusService.getActiveSyllabus();
        this.sidebarState.activeSyllabus = activeSyllabus
          ? activeSyllabus.id
          : null;

        // Update the UI (with error handling)
        try {
          this.updateSyllabusList();
          this.updateSidebarState();
        } catch (uiError) {
          console.warn("⚠️ UI update failed:", uiError);
        }

        console.log("✅ Syllabi loaded and UI updated");
      } catch (error) {
        console.error("❌ Failed to load syllabi:", error);
        // Fallback to basic loading
        try {
          const syllabi = this.syllabusService.getAllSyllabi();
          this.sidebarState.syllabi = syllabi;
          this.updateSyllabusList();
          this.updateSidebarState();
        } catch (fallbackError) {
          console.error("❌ Fallback loading also failed:", fallbackError);
          this.sidebarState.syllabi = [];
          try {
            this.updateSyllabusList();
            this.updateSidebarState();
          } catch (uiError) {
            console.warn("⚠️ Final UI update failed:", uiError);
          }
        }
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

    // Initialize sidebar state (only if elements exist)
    try {
      this.updateSidebarState();
    } catch (error) {
      console.warn("⚠️ Sidebar state update failed:", error);
    }
    console.log("✅ Sidebar setup complete");
  }

  setupMainNavigation() {
    console.log("🔧 Setting up main navigation...");

    // Mobile navigation toggle
    const mobileMenuToggle = document.getElementById("mobileMenuToggle");
    if (mobileMenuToggle) {
      mobileMenuToggle.addEventListener("click", () => this.toggleMobileNav());
    }

    // Set active nav link based on current page
    this.setActiveNavLink();

    // Listen for navigation events from NavManager
    window.addEventListener("navchange", (event) => {
      console.log("🎯 Navigation change event received:", event.detail);
      // Handle any additional UI updates needed when navigation changes
    });
  }

  toggleMobileNav() {
    const navMenu = document.querySelector(".nav-menu");
    if (navMenu) {
      navMenu.classList.toggle("active");
    }
  }

  setActiveNavLink() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll(".nav-link");

    navLinks.forEach((link) => {
      link.classList.remove("active");
      // Check both href and data-nav attributes
      const href = link.getAttribute("href");
      const dataNav = link.getAttribute("data-nav");

      if (
        href === currentPath ||
        (currentPath === "/" && dataNav === "home") ||
        (currentPath === "/pricing.html" && dataNav === "pricing")
      ) {
        link.classList.add("active");
      }
    });
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
    if (!syllabusList) {
      console.warn("⚠️ Syllabus list element not found");
      return;
    }

    // Clear existing content
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

    // Create scrollable container for syllabi
    const scrollContainer = document.createElement("div");
    scrollContainer.className = "syllabus-scroll-container";

    // Add navigation controls if more than 3 syllabi
    if (this.sidebarState.syllabi.length > 3) {
      const navContainer = document.createElement("div");
      navContainer.className = "syllabus-nav-container";

      const prevBtn = document.createElement("button");
      prevBtn.className = "syllabus-nav-btn syllabus-nav-prev";
      prevBtn.innerHTML = "‹";
      prevBtn.title = "Previous syllabi";

      const nextBtn = document.createElement("button");
      nextBtn.className = "syllabus-nav-btn syllabus-nav-next";
      nextBtn.innerHTML = "›";
      nextBtn.title = "Next syllabi";

      const counter = document.createElement("div");
      counter.className = "syllabus-counter";
      counter.innerHTML = `1-3 of ${this.sidebarState.syllabi.length}`;

      navContainer.appendChild(prevBtn);
      navContainer.appendChild(counter);
      navContainer.appendChild(nextBtn);

      syllabusList.appendChild(navContainer);

      // Add navigation event listeners
      let currentPage = 0;
      const itemsPerPage = 3;
      const totalPages = Math.ceil(
        this.sidebarState.syllabi.length / itemsPerPage
      );

      const updateDisplay = () => {
        const startIndex = currentPage * itemsPerPage;
        const endIndex = Math.min(
          startIndex + itemsPerPage,
          this.sidebarState.syllabi.length
        );

        // Update counter
        counter.innerHTML = `${startIndex + 1}-${endIndex} of ${
          this.sidebarState.syllabi.length
        }`;

        // Update button states
        prevBtn.disabled = currentPage === 0;
        nextBtn.disabled = currentPage === totalPages - 1;

        // Clear and repopulate scroll container
        scrollContainer.innerHTML = "";

        for (let i = startIndex; i < endIndex; i++) {
          const syllabus = this.sidebarState.syllabi[i];
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
            <div class="syllabus-actions">
              <button class="syllabus-view" data-syllabus-id="${
                syllabus.id
              }" title="View syllabus">
                👁️
              </button>
              <button class="syllabus-toggle" data-syllabus-id="${syllabus.id}">
                ${isActive ? "✓" : "○"}
              </button>
              <button class="syllabus-remove" data-syllabus-id="${
                syllabus.id
              }" title="Remove syllabus">
                ×
              </button>
            </div>
          `;

          // Add click events
          const viewBtn = syllabusItem.querySelector(".syllabus-view");
          const toggleBtn = syllabusItem.querySelector(".syllabus-toggle");
          const removeBtn = syllabusItem.querySelector(".syllabus-remove");

          viewBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            this.openPdfViewer(syllabus);
          });

          toggleBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            this.toggleSyllabus(syllabus.id);
          });

          removeBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            this.removeSyllabus(syllabus.id);
          });

          scrollContainer.appendChild(syllabusItem);
        }
      };

      prevBtn.addEventListener("click", () => {
        if (currentPage > 0) {
          currentPage--;
          updateDisplay();
        }
      });

      nextBtn.addEventListener("click", () => {
        if (currentPage < totalPages - 1) {
          currentPage++;
          updateDisplay();
        }
      });

      // Initial display
      updateDisplay();
    } else {
      // For 3 or fewer syllabi, show all without navigation
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
          <div class="syllabus-actions">
            <button class="syllabus-view" data-syllabus-id="${
              syllabus.id
            }" title="View syllabus">
              👁️
            </button>
            <button class="syllabus-toggle" data-syllabus-id="${syllabus.id}">
              ${isActive ? "✓" : "○"}
            </button>
            <button class="syllabus-remove" data-syllabus-id="${
              syllabus.id
            }" title="Remove syllabus">
              ×
            </button>
          </div>
        `;

        // Add click events
        const viewBtn = syllabusItem.querySelector(".syllabus-view");
        const toggleBtn = syllabusItem.querySelector(".syllabus-toggle");
        const removeBtn = syllabusItem.querySelector(".syllabus-remove");

        viewBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          this.openPdfViewer(syllabus);
        });

        toggleBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          this.toggleSyllabus(syllabus.id);
        });

        removeBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          this.removeSyllabus(syllabus.id);
        });

        scrollContainer.appendChild(syllabusItem);
      });
    }

    syllabusList.appendChild(scrollContainer);
  }

  updateSidebarState() {
    // Update authentication section visibility
    const authSection = document.getElementById("authSection");
    const accountSection = document.getElementById("accountSection");

    // Handle missing elements gracefully
    if (!authSection || !accountSection) {
      console.warn("⚠️ Sidebar elements not found, skipping state update");
      return;
    }

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
      // Check both payment services
      const paymentStatus = this.paymentService.getSubscriptionStatus();
      const stripeStatus = this.stripePaymentService
        ? this.stripePaymentService.getSubscriptionStatus()
        : { active: false };

      console.log("Payment status:", paymentStatus);
      console.log("Stripe status:", stripeStatus);

      if (paymentStatus.active || stripeStatus.active) {
        console.log("✅ Active subscription found");

        // Use the active subscription data
        const activeSubscription =
          paymentStatus.subscription || stripeStatus.subscription;

        if (activeSubscription) {
          this.selectedPlan = {
            level: activeSubscription.plan,
            price: activeSubscription.price,
            name: this.planNames[activeSubscription.plan] || "Premium Plan",
          };

          // Update sidebar state for logged in user
          this.sidebarState.isLoggedIn = true;
          this.sidebarState.userData.plan = activeSubscription.plan;
          this.sidebarState.userData.price =
            activeSubscription.priceDisplay || activeSubscription.price;

          // Update syllabus service authentication status
          if (this.syllabusService) {
            this.syllabusService.updateAuthStatus(true, {
              id: activeSubscription.id || "subscriber",
              email:
                activeSubscription.customerEmail || "subscriber@example.com",
            });
          }

          this.updateSidebarState();
          await this.loadSyllabiFromService();

          this.setState("chat");
          return true;
        }
      } else {
        console.log("❌ No active subscription found");
        return false;
      }
    } catch (error) {
      console.error("❌ Error checking subscription:", error);
      return false;
    }
  }

  async handleStripePaymentReturn() {
    console.log("💳 Handling Stripe payment return...");

    if (!this.stripePaymentService) {
      console.log("❌ Stripe payment service not available");
      return;
    }

    try {
      const result = this.stripePaymentService.handlePaymentReturn();

      if (result.success && result.sessionId) {
        console.log("✅ Payment completed, validating...");

        // Show loading
        this.showLoading("Validating your payment...");

        // Validate the payment
        const validationResult =
          await this.stripePaymentService.validatePayment(result.sessionId);

        if (validationResult.success && validationResult.subscription) {
          console.log("✅ Payment validated successfully");

          // Update sidebar state
          this.sidebarState.userData = {
            name: validationResult.subscription.customerName || "Student User",
            email:
              validationResult.subscription.customerEmail ||
              "student@example.com",
            plan: validationResult.subscription.plan,
            price: validationResult.subscription.priceDisplay,
            nextBilling: this.formatNextBilling(
              validationResult.subscription.expiryDate
            ),
          };

          this.sidebarState.isLoggedIn = true;

          // Update syllabus service authentication status
          if (this.syllabusService) {
            this.syllabusService.updateAuthStatus(true, {
              id: validationResult.subscription.id,
              email: validationResult.subscription.customerEmail,
            });
          }

          // Hide loading and show success
          this.hideLoading();
          this.showSuccess("Payment successful! Welcome to SmartyPants-AI!");

          // Switch to chat page
          this.setState("chat");

          // Clear URL parameters
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname
          );
        } else {
          throw new Error(
            validationResult.error || "Payment validation failed"
          );
        }
      } else if (result.canceled) {
        console.log("❌ Payment was canceled");
        // Clear URL parameters
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );
      }
    } catch (error) {
      console.error("❌ Error handling Stripe payment return:", error);
      this.hideLoading();
      this.showError(
        "There was an issue validating your payment. Please contact support."
      );

      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }

  formatNextBilling(dateString) {
    if (!dateString) return "Next: Jan 15, 2025";

    try {
      const date = new Date(dateString);
      return `Next: ${date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })}`;
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Next: Jan 15, 2025";
    }
  }

  // ===== STATE MANAGEMENT =====

  setState(newState) {
    console.log(`🔄 State change: ${this.currentState} → ${newState}`);
    this.currentState = newState;
    this.updateUI();
  }

  updateUI() {
    console.log("🔄 Updating UI for state:", this.currentState);

    // Handle different states by loading appropriate content
    switch (this.currentState) {
      case "landing":
        // Load home content
        this.loadHomeContent();
        break;
      case "payment":
        // Load payment content
        this.loadPaymentContent();
        break;
      case "chat":
        // Load chat content
        this.loadChatContent();
        break;
    }
  }

  // Load home content
  async loadHomeContent() {
    try {
      const response = await fetch("/partials/home.html");
      if (response.ok) {
        const html = await response.text();
        const mainContent = document.getElementById("mainContent");
        if (mainContent) {
          mainContent.innerHTML = html;
          console.log("✅ Home content loaded");

          // Re-setup navigation buttons after loading content
          this.setupNavigationButtons();
        }
      }
    } catch (error) {
      console.error("❌ Failed to load home content:", error);
    }
  }

  // Load payment content
  async loadPaymentContent() {
    try {
      // Create payment page content
      const paymentHTML = this.createPaymentPage();
      const mainContent = document.getElementById("mainContent");
      if (mainContent) {
        mainContent.innerHTML = paymentHTML;
        console.log("✅ Payment content loaded");
        this.updatePaymentDisplay();

        // Re-setup navigation buttons after loading content
        this.setupNavigationButtons();
      }
    } catch (error) {
      console.error("❌ Failed to load payment content:", error);
    }
  }

  // Load chat content
  async loadChatContent() {
    try {
      const chatHTML = this.createChatPage();
      const mainContent = document.getElementById("mainContent");
      if (mainContent) {
        mainContent.innerHTML = chatHTML;
        console.log("✅ Chat content loaded");
        this.setupChatInterface();

        // Re-setup navigation buttons after loading content
        this.setupNavigationButtons();
      }
    } catch (error) {
      console.error("❌ Failed to load chat content:", error);
    }
  }

  // Create payment page HTML
  createPaymentPage() {
    return `
      <div class="payment-container">
        <div class="payment-header">
          <h2 id="paymentTitle">Complete Your Subscription</h2>
          <p id="paymentDescription">You're just one step away from accessing SmartyPants-AI's features!</p>
        </div>
        
        <div class="payment-content">
          <div class="selected-plan-info">
            <h3>Selected Plan</h3>
            <div id="selectedPlan">Loading plan details...</div>
          </div>
          
          <div class="payment-methods">
            <h3>Choose Payment Method</h3>
            <div class="payment-options">
              <button class="payment-button stripe" onclick="uiController.processPayment('stripe')">
                <span class="payment-icon">💳</span>
                <span class="payment-text">Pay with Card (Stripe)</span>
              </button>
              <button class="payment-button paypal" onclick="uiController.processPayment('paypal')">
                <span class="payment-icon">💰</span>
                <span class="payment-text">Pay with PayPal</span>
              </button>
              <button class="payment-button cashapp" onclick="uiController.processPayment('cashapp')">
                <span class="payment-icon">💸</span>
                <span class="payment-text">Pay with Cash App</span>
              </button>
            </div>
          </div>
          
          <div class="payment-guarantee">
            <div class="guarantee-badge">
              <span>🎯 30-Day Money Back Guarantee</span>
            </div>
            <p>Try SmartyPants-AI risk-free. If you're not satisfied within 30 days, we'll provide a full refund.</p>
          </div>
        </div>
        
        <div class="payment-actions">
          <button class="back-button" onclick="uiController.setState('landing')">
            ← Back to Plans
          </button>
        </div>
      </div>
    `;
  }

  // Create chat page HTML
  createChatPage() {
    return `
      <div class="chat-container">
        <div class="chat-header">
          <h2>SmartyPants-AI Assistant</h2>
          <p>Your 24/7 academic companion</p>
        </div>
        <form id="chatForm" class="chat-form">
          <div class="form-group">
            <label for="question">Your Question</label>
            <textarea
              id="question"
              name="question"
              placeholder="Ask me anything about your studies, essays, or academic topics..."
              rows="4"
              required
            ></textarea>
          </div>
          <button type="submit" class="submit-button">
            🤖 Ask SmartyPants Now!
          </button>
        </form>
        <div id="response" class="response-area">
          <div class="response-placeholder">
            <h4>💡 SmartyPants will respond here!</h4>
            <p>Fill out the form above and click "Ask SmartyPants Now!" to get your personalized help.</p>
          </div>
        </div>
        <div class="chat-actions">
          <button class="demo-button" onclick="uiController.startDemo()">
            🎯 Start Demo
          </button>
          <button class="back-button" onclick="uiController.setState('landing')">
            ← Back to Home
          </button>
        </div>
      </div>
    `;
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
    this.selectedPlan = {
      level,
      price: this.prices[level],
      name: this.planNames[level],
    };
    console.log("🎯 Plan selected:", this.selectedPlan);
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
      const planName = this.selectedPlan.name;
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
          <strong>Price:</strong> $${planPrice}/month
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

      let paymentResult;

      // Handle Stripe payments differently
      if (method === "stripe") {
        if (!this.stripePaymentService) {
          throw new Error("Stripe payment service not available");
        }

        // For Stripe, we redirect to checkout and don't return here
        // The payment result will be handled when user returns from Stripe
        await this.stripePaymentService.redirectToCheckout(
          this.selectedPlan.level,
          customerInfo
        );

        // The redirect should happen above, so we shouldn't reach here
        // If we do reach here, something went wrong
        console.warn("⚠️ Stripe redirect didn't happen as expected");
        return; // Exit early, don't throw error
      } else {
        // Use regular payment service for other methods
        paymentResult = await this.paymentService.processPayment(
          this.selectedPlan,
          customerInfo,
          method
        );
      }

      if (paymentResult && paymentResult.success) {
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

    console.log("💬 Chat request:", {
      question: question,
      level: level,
      type: type,
      aiService: !!this.aiService,
      aiServiceMethods: this.aiService
        ? Object.getOwnPropertyNames(Object.getPrototypeOf(this.aiService))
        : null,
    });

    // Show loading state
    this.showChatLoading(responseDiv);

    try {
      // Check if AI service is available
      if (!this.aiService) {
        throw new Error("AI service not available");
      }

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
      const response = await this.aiService.sendChatRequest(
        requestData.question,
        {
          helpType: requestData.helpType,
          subject: requestData.syllabus?.subject,
          educationLevel: requestData.educationLevel,
        }
      );

      if (response.success) {
        this.showChatResponse(responseDiv, response.answer, response.timestamp);
        questionInput.value = ""; // Clear input
      } else {
        throw new Error(response.error || "Failed to get response from AI");
      }
    } catch (error) {
      console.error("❌ Chat request failed:", error);

      // Fallback to demo response if AI service fails
      if (this.aiService && this.aiService.generateDemoResponse) {
        console.log("🔄 Falling back to demo response...");
        try {
          const demoResponse = await this.aiService.generateDemoResponse(
            question,
            "general"
          );
          if (demoResponse.success) {
            this.showChatResponse(
              responseDiv,
              demoResponse.answer,
              demoResponse.timestamp
            );
            questionInput.value = ""; // Clear input
            return;
          }
        } catch (demoError) {
          console.error("❌ Demo response also failed:", demoError);
        }
      }

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

    // Listen for nav link clicks (delegated)
    document.body.addEventListener("click", (e) => {
      const target = e.target.closest(".nav-link");
      if (target) {
        // Remove 'active' from all nav links
        document
          .querySelectorAll(".nav-link")
          .forEach((link) => link.classList.remove("active"));
        // Add 'active' to the clicked nav link
        target.classList.add("active");
      }
      if (target && target.getAttribute("href") === "/pricing.html") {
        e.preventDefault();
        console.log("🎯 Pricing link clicked, loading pricing content...");
        if (this.contentManager) {
          this.contentManager
            .loadContentFromUrl("/partials/pricing.html")
            .then(() => {
              console.log("✅ Pricing content loaded via ContentManager");
              // Initialize pricing after content loads
              this.initializePricingPage();
              // Force execute pricing script to ensure plans are populated
              setTimeout(() => {
                this.executePricingScript();
              }, 100);
            })
            .catch((error) => {
              console.error("❌ Error loading pricing content:", error);
              // Fallback: load pricing content directly
              this.loadPricingContent().then(() => {
                this.initializePricingPage();
              });
            });
        } else {
          console.warn("⚠️ ContentManager not available, trying fallback...");
          // Fallback: load pricing content directly
          this.loadPricingContent().then(() => {
            this.initializePricingPage();
          });
        }
        // Update active nav state (already handled above)
      }
    });

    // Listen for demo button clicks (delegated)
    document.body.addEventListener("click", (e) => {
      const demoButton = e.target.closest("#demoButton");
      if (demoButton) {
        e.preventDefault();
        console.log("🎯 Demo button clicked via event delegation");
        this.startDemo();
      }
    });
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

window.debugInitializationOrder = () => {
  console.log("🔍 Debug: Initialization order check...");
  console.log("📚 Syllabus service:", {
    exists: !!window.syllabusService,
    isInitialized: window.syllabusService?.isInitialized,
    isReady: window.syllabusService?.isReady(),
    syllabiCount: window.syllabusService?.getAllSyllabi()?.length || 0,
  });
  console.log("🎮 UI Controller:", {
    exists: !!window.uiController,
    syllabiCount: window.uiController?.sidebarState?.syllabi?.length || 0,
  });
};

window.forceRefreshSyllabi = async () => {
  console.log("🔄 Force refreshing syllabi display...");
  if (window.uiController && window.uiController.syllabusService) {
    await window.uiController.loadSyllabiFromService();
    console.log("✅ Syllabi display refreshed");
  } else {
    console.log("❌ UI Controller or Syllabus service not available");
  }
};

window.forceInitializePricing = () => {
  console.log("🔄 Force initializing pricing page...");
  if (window.uiController) {
    window.uiController.executePricingScript();
    console.log("✅ Pricing script executed");
  } else {
    console.log("❌ UI Controller not available");
  }
};

// Global function for pricing page
window.scrollToPlans = () => {
  const plansGrid = document.getElementById("plansGrid");
  if (plansGrid) {
    plansGrid.scrollIntoView({ behavior: "smooth" });
  }
};

window.debugPricing = () => {
  console.log("🔍 Debug: Pricing page status...");
  const plansGrid = document.getElementById("plansGrid");
  console.log("📋 Plans grid:", {
    exists: !!plansGrid,
    content: plansGrid?.innerHTML,
    isEmpty:
      plansGrid?.innerHTML.trim() ===
      "<!-- Plans will be dynamically populated by JavaScript -->",
  });

  if (window.uiController) {
    console.log("✅ UI Controller available");
    console.log(
      "🔧 Pricing script execution available:",
      !!window.uiController.executePricingScript
    );
  } else {
    console.log("❌ UI Controller not available");
  }
};
