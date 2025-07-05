// NavManager: Controls the top navigation bar, navchange events, and layout awareness

interface NavManagerConfig {
  navbarSelector: string;
  sidebarSelector: string;
  mainContentSelector: string;
}

class NavManager {
  private navbarSelector: string;
  private sidebarSelector: string;
  private mainContentSelector: string;

  constructor(
    navbarSelector: string = "#navbar",
    sidebarSelector: string = "#sidebar",
    mainContentSelector: string = "#mainContent"
  ) {
    this.navbarSelector = navbarSelector;
    this.sidebarSelector = sidebarSelector;
    this.mainContentSelector = mainContentSelector;
  }

  /** Initialize the navigation manager and render the navbar */
  init(): void {
    this.renderNavbar();
    this.setupMobileMenu();
    this.setupNavigation();
    this.dispatchNavChange("navbar");
  }

  /** Render the top navigation bar */
  renderNavbar(): void {
    const navbar = document.querySelector(this.navbarSelector);
    if (navbar) {
      console.log("🎯 Rendering navbar...");
      navbar.innerHTML = this.getNavbarHTML();
      console.log("✅ Navbar rendered successfully");
    } else {
      console.error("❌ Navbar element not found:", this.navbarSelector);
    }
  }

  /** Get the HTML for the top navigation bar */
  private getNavbarHTML(): string {
    return `
      <nav class="main-nav">
        <div class="nav-container">
          <div class="nav-brand">
            <img src="https://images.pexels.com/photos/267885/pexels-photo-267885.jpeg?auto=compress&cs=tinysrgb&w=32" alt="SmartyPants-AI" class="nav-logo" />
            <span class="nav-brand-name">SmartyPants-AI</span>
          </div>
          <div class="nav-menu">
            <a href="#" data-nav="home" class="nav-link">Home</a>
            <a href="#" data-nav="pricing" class="nav-link">Pricing</a>
            <a href="#" data-nav="terms" class="nav-link">Terms</a>
            <a href="#" data-nav="privacy" class="nav-link">Privacy</a>
          </div>
          <button class="mobile-menu-toggle" id="mobileMenuToggle">
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>
    `;
  }

  /** Dispatch a navchange event for the given area */
  dispatchNavChange(area: string): void {
    const event = new CustomEvent("navchange", { detail: { area } });
    window.dispatchEvent(event);
  }

  /** Listen for navchange events */
  onNavChange(callback: (area: string) => void): void {
    window.addEventListener("navchange", (e) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.area) {
        callback(customEvent.detail.area);
      }
    });
  }

  /** Get references to layout areas */
  getNavbarElement(): HTMLElement | null {
    return document.querySelector(this.navbarSelector);
  }

  getSidebarElement(): HTMLElement | null {
    return document.querySelector(this.sidebarSelector);
  }

  getMainContentElement(): HTMLElement | null {
    return document.querySelector(this.mainContentSelector);
  }

  // Stub: update sidebar (to be implemented)
  updateSidebar(): void {
    // TODO: Implement sidebar rendering logic
    this.dispatchNavChange("sidebar");
  }

  // Stub: update main content (to be implemented)
  updateMainContent(): void {
    // TODO: Implement main content rendering logic
    this.dispatchNavChange("main-content");
  }

  /** Setup mobile menu toggle functionality */
  private setupMobileMenu(): void {
    const mobileToggle = document.getElementById("mobileMenuToggle");
    if (mobileToggle) {
      mobileToggle.addEventListener("click", () => {
        const navMenu = document.querySelector(".nav-menu");
        if (navMenu) {
          navMenu.classList.toggle("active");
        }
      });
    }
  }

  /** Setup navigation event handlers */
  private setupNavigation(): void {
    console.log("🔧 Setting up navigation handlers...");
    const navLinks = document.querySelectorAll(".nav-link");
    console.log("📋 Found nav links:", navLinks.length);

    navLinks.forEach((link) => {
      console.log("🔗 Setting up link:", link.getAttribute("data-nav"));
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const navType = link.getAttribute("data-nav");
        console.log("🎯 Navigation clicked:", navType);
        if (navType) {
          this.handleNavigation(navType);
        }
      });
    });
  }

  /** Handle navigation to different sections */
  async handleNavigation(navType: string): Promise<void> {
    console.log("🎯 Navigation requested:", navType);

    // Update active nav link
    this.setActiveNavLink(navType);

    // Load content based on navigation type
    switch (navType) {
      case "home":
        await this.loadHomeContent();
        break;
      case "pricing":
        await this.loadPricingContent();
        break;
      case "terms":
        await this.loadTermsContent();
        break;
      case "privacy":
        await this.loadPrivacyContent();
        break;
      default:
        console.warn("⚠️ Unknown navigation type:", navType);
        await this.loadHomeContent();
    }
  }

  /** Set active navigation link */
  private setActiveNavLink(activeNav: string): void {
    const navLinks = document.querySelectorAll(".nav-link");
    navLinks.forEach((link) => {
      link.classList.remove("active");
      if (link.getAttribute("data-nav") === activeNav) {
        link.classList.add("active");
      }
    });
  }

  /** Load home content */
  private async loadHomeContent(): Promise<void> {
    try {
      const response = await fetch("/partials/home.html");
      if (response.ok) {
        const html = await response.text();
        const mainContent = document.querySelector(this.mainContentSelector);
        if (mainContent) {
          mainContent.innerHTML = html;
          console.log("✅ Home content loaded");
        } else {
          console.error("❌ Main content element not found");
        }
      } else {
        console.error("❌ Failed to fetch home content:", response.status);
      }
    } catch (error) {
      console.error("❌ Failed to load home content:", error);
    }
  }

  /** Load pricing content */
  private async loadPricingContent(): Promise<void> {
    try {
      const response = await fetch("/partials/pricing.html");
      if (response.ok) {
        const html = await response.text();
        const mainContent = document.querySelector(this.mainContentSelector);
        if (mainContent) {
          mainContent.innerHTML = html;
          console.log("✅ Pricing content loaded");

          // Use pricing helper for initialization
          if ((window as any).PricingHelper) {
            console.log("🔧 Using pricing helper to initialize...");
            (window as any).PricingHelper.initializePricing();
            console.log("✅ Pricing helper initialization completed");
          } else {
            console.warn("⚠️ Pricing helper not available");
          }
        } else {
          console.error("❌ Main content element not found");
        }
      } else {
        console.error("❌ Failed to fetch pricing content:", response.status);
      }
    } catch (error) {
      console.error("❌ Failed to load pricing content:", error);
    }
  }

  /** Load terms content */
  private async loadTermsContent(): Promise<void> {
    try {
      const response = await fetch("/partials/terms.html");
      if (response.ok) {
        const html = await response.text();
        const mainContent = document.querySelector(this.mainContentSelector);
        if (mainContent) {
          mainContent.innerHTML = html;
          console.log("✅ Terms content loaded");
        } else {
          console.error("❌ Main content element not found");
        }
      } else {
        console.error("❌ Failed to fetch terms content:", response.status);
      }
    } catch (error) {
      console.error("❌ Failed to load terms content:", error);
    }
  }

  /** Load privacy content */
  private async loadPrivacyContent(): Promise<void> {
    try {
      const response = await fetch("/partials/privacy.html");
      if (response.ok) {
        const html = await response.text();
        const mainContent = document.querySelector(this.mainContentSelector);
        if (mainContent) {
          mainContent.innerHTML = html;
          console.log("✅ Privacy content loaded");
        } else {
          console.error("❌ Main content element not found");
        }
      } else {
        console.error("❌ Failed to fetch privacy content:", response.status);
      }
    } catch (error) {
      console.error("❌ Failed to load privacy content:", error);
    }
  }

  /** Get current configuration */
  getConfig(): NavManagerConfig {
    return {
      navbarSelector: this.navbarSelector,
      sidebarSelector: this.sidebarSelector,
      mainContentSelector: this.mainContentSelector,
    };
  }
}

// Make NavManager available globally
(window as any).NavManager = NavManager;

// Example usage (to be called from UI controller):
// const navManager = new NavManager();
// navManager.init();
// navManager.onNavChange((area) => { console.log('Nav changed:', area); });
