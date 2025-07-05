// ContentManager: Controls the main content area (#mainContent)

interface ContentManagerConfig {
  mainContentSelector: string;
}

class ContentManager {
  private mainContentSelector: string;

  constructor(mainContentSelector: string = "#mainContent") {
    this.mainContentSelector = mainContentSelector;
  }

  /** Set the main content HTML */
  setContent(html: string): void {
    const mainContent = document.querySelector(this.mainContentSelector);
    if (mainContent) {
      mainContent.innerHTML = html;
    }
  }

  /** Get the main content element */
  getMainContentElement(): HTMLElement | null {
    return document.querySelector(this.mainContentSelector);
  }

  /** Get current configuration */
  getConfig(): ContentManagerConfig {
    return {
      mainContentSelector: this.mainContentSelector,
    };
  }
}

// Make ContentManager available globally
(window as any).ContentManager = ContentManager;

// Example usage:
// const contentManager = new ContentManager();
// contentManager.setContent('<h1>Welcome!</h1>');
