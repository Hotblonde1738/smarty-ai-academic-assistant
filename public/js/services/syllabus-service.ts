// SYLLABUS SERVICE - Unified Syllabus Management for Authenticated & Non-Authenticated Users
console.log("📚 SYLLABUS SERVICE LOADING...");

interface SyllabusMetadata {
  subject?: string;
  pages?: number;
  wordCount?: number;
  extractedText?: string;
}

interface Syllabus {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  type: string;
  uploadDate: string;
  lastModified: string;
  status: "active" | "inactive";
  storageMode: "local" | "database";
  sessionId: string;
  userId?: string;
  url?: string;
  fileData?: string;
  metadata: SyllabusMetadata;
}

interface UploadResult {
  success: boolean;
  syllabus?: Syllabus;
  storageMode?: string;
  error?: string;
  isDuplicate?: boolean;
  existingFile?: Syllabus;
}

interface ValidationResult {
  isValid: boolean;
  isDuplicate: boolean;
  message?: string;
  existingFile?: Syllabus;
}

interface SyllabusStats {
  totalSyllabi: number;
  activeSyllabi: number;
  totalSize: number;
  subjects: Record<string, number>;
  storageMode: string;
}

interface ServiceConfig {
  maxFileSize: number;
  maxFileSizeMB: number;
  allowedTypes: string[];
  maxSyllabiPerUser: number;
  storageMode: string;
  isAuthenticated: boolean;
  sessionId: string;
  userId?: string;
  isInitialized: boolean;
}

class SyllabusService {
  private uploadedSyllabi: Syllabus[];
  private maxFileSize: number;
  private allowedTypes: string[];
  private maxSyllabiPerUser: number;
  private storageMode: "local" | "database";
  private sessionId: string;
  private userId?: string;
  private isAuthenticated: boolean;
  private isInitialized: boolean;

  constructor() {
    this.uploadedSyllabi = [];
    this.maxFileSize = 5 * 1024 * 1024; // 5MB
    this.allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    this.maxSyllabiPerUser = 10;

    // Unified storage management
    this.storageMode = "local"; // 'local' or 'database'
    this.sessionId = this.getOrCreateSessionId();
    this.userId = undefined;
    this.isAuthenticated = false;

    // Initialize storage mode detection
    this.detectStorageMode();

    // Initialization state
    this.isInitialized = false;
  }

  // Detect if user is authenticated and set storage mode
  private detectStorageMode(): void {
    // Check for authentication token or user session
    const authToken = localStorage.getItem("smartypants_auth_token");
    const userData = localStorage.getItem("smartypants_user_data");

    if (authToken && userData) {
      try {
        const user = JSON.parse(userData);
        this.userId = user.id || user.email;
        this.isAuthenticated = true;
        this.storageMode = "database";
        console.log("🔐 Authenticated user detected, using database storage");
      } catch (error) {
        console.warn("⚠️ Invalid user data, falling back to local storage");
        this.storageMode = "local";
      }
    } else {
      this.storageMode = "local";
      console.log("👤 Non-authenticated user, using local storage");
    }
  }

  // Get or create session ID for non-authenticated users
  private getOrCreateSessionId(): string {
    let sessionId = localStorage.getItem("smartypants_session_id");
    if (!sessionId) {
      sessionId =
        "session_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
      localStorage.setItem("smartypants_session_id", sessionId);
    }
    return sessionId;
  }

  // Upload syllabus file - unified interface
  async uploadSyllabus(file: File): Promise<UploadResult> {
    console.log("📚 Uploading syllabus:", file.name, "Mode:", this.storageMode);
    console.log("🔍 Service state:", {
      storageMode: this.storageMode,
      isAuthenticated: this.isAuthenticated,
      userId: this.userId,
      sessionId: this.sessionId,
    });

    try {
      // Validate file
      console.log("🔍 Validating file...");
      const validationResult = this.validateFile(file);

      if (validationResult.isDuplicate) {
        console.warn("⚠️ Duplicate file detected:", validationResult.message);
        return {
          success: false,
          error: validationResult.message,
          isDuplicate: true,
          existingFile: validationResult.existingFile,
        };
      }

      console.log("✅ File validation passed");

      // Create syllabus record
      console.log("🔍 Creating syllabus record...");
      const syllabus = this.createSyllabusRecord(file);
      console.log("✅ Syllabus record created:", syllabus);

      // Store based on authentication status
      if (this.storageMode === "database") {
        console.log("🔄 Saving to database...");
        await this.saveToDatabase(syllabus);
      } else {
        console.log("💾 Using local storage only");
      }

      // Always save to local storage (as cache or primary storage)
      console.log("💾 Saving to local storage...");
      await this.saveToLocalStorage(syllabus);

      console.log("✅ Syllabus uploaded successfully:", syllabus);
      return {
        success: true,
        syllabus: syllabus,
        storageMode: this.storageMode,
      };
    } catch (error) {
      console.error("❌ Syllabus upload failed:", error);
      console.error("❌ Error details:", {
        message: (error as Error).message,
        stack: (error as Error).stack,
        name: (error as Error).name,
      });
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  // Save to database (for authenticated users)
  private async saveToDatabase(syllabus: Syllabus): Promise<void> {
    try {
      console.log("🔄 Attempting database upload...");

      // Convert file to base64 for upload
      const fileData = await this.fileToBase64(syllabus.fileData as string);

      const uploadData = {
        userId: this.userId || "anonymous",
        filename: syllabus.filename,
        fileData: fileData,
        fileSize: syllabus.size,
        fileType: syllabus.type,
        metadata: syllabus.metadata,
      };

      console.log("📤 Upload data:", {
        userId: uploadData.userId,
        filename: uploadData.filename,
        fileSize: uploadData.fileSize,
        fileType: uploadData.fileType,
        metadata: uploadData.metadata,
      });

      const response = await fetch("/.netlify/functions/upload-syllabus", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(uploadData),
      });

      console.log("📥 Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Response error:", errorText);
        throw new Error(
          `Database upload failed: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log("✅ Database response:", data);

      syllabus.id = data.id || syllabus.id;
      syllabus.url = data.url;
      syllabus.storageMode = "database";

      console.log("✅ Syllabus saved to database");
    } catch (error) {
      console.warn(
        "⚠️ Database upload failed, using local storage only:",
        error
      );
      syllabus.storageMode = "local";
      // Don't throw - fallback to local storage
    }
  }

  // Save to local storage
  private async saveToLocalStorage(syllabus: Syllabus): Promise<void> {
    try {
      // Convert file to base64 for localStorage storage
      const fileData = await this.fileToBase64(syllabus.fileData as string);
      syllabus.fileData = fileData;
      syllabus.storageMode = "local";

      // Add to local collection first
      this.uploadedSyllabi.push(syllabus);

      // Save to localStorage
      this.saveSyllabi();

      console.log("✅ Syllabus saved to local storage");
    } catch (error) {
      console.error("❌ Failed to save to local storage:", error);
      throw error;
    }
  }

  // Validate file
  private validateFile(file: File): ValidationResult {
    // Check file size
    if (file.size > this.maxFileSize) {
      return {
        isValid: false,
        isDuplicate: false,
        message: `File size (${(file.size / 1024 / 1024).toFixed(
          2
        )}MB) exceeds maximum limit (${this.maxFileSize / 1024 / 1024}MB)`,
      };
    }

    // Check file type
    if (!this.allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        isDuplicate: false,
        message: `File type "${file.type}" is not supported. Please upload a PDF or Word document.`,
      };
    }

    // Check for duplicates
    const existingFile = this.uploadedSyllabi.find(
      (syllabus) => syllabus.filename === file.name
    );

    if (existingFile) {
      return {
        isValid: false,
        isDuplicate: true,
        message: `A file with the name "${file.name}" already exists.`,
        existingFile: existingFile,
      };
    }

    // Check maximum syllabi limit
    if (this.uploadedSyllabi.length >= this.maxSyllabiPerUser) {
      return {
        isValid: false,
        isDuplicate: false,
        message: `Maximum number of syllabi (${this.maxSyllabiPerUser}) reached. Please remove some syllabi before uploading new ones.`,
      };
    }

    return {
      isValid: true,
      isDuplicate: false,
    };
  }

  // Create syllabus record
  private createSyllabusRecord(file: File): Syllabus {
    const syllabus: Syllabus = {
      id: this.generateSyllabusId(),
      filename: file.name,
      originalName: file.name,
      size: file.size,
      type: file.type,
      uploadDate: new Date().toISOString(),
      lastModified: new Date(file.lastModified).toISOString(),
      status: "inactive",
      storageMode: "local",
      sessionId: this.sessionId,
      userId: this.userId,
      metadata: {
        subject: this.extractSubjectFromFilename(file.name),
      },
    };

    return syllabus;
  }

  // Extract subject from filename
  private extractSubjectFromFilename(filename: string): string {
    const filenameLower = filename.toLowerCase();

    const subjectKeywords: Record<string, string[]> = {
      math: [
        "math",
        "mathematics",
        "algebra",
        "calculus",
        "geometry",
        "statistics",
      ],
      science: [
        "science",
        "biology",
        "chemistry",
        "physics",
        "anatomy",
        "physiology",
      ],
      english: ["english", "literature", "writing", "composition", "grammar"],
      history: ["history", "social studies", "geography", "political science"],
      computer: ["computer", "programming", "coding", "software", "technology"],
      business: [
        "business",
        "economics",
        "accounting",
        "finance",
        "management",
      ],
      nursing: ["nursing", "medical", "health", "clinical", "patient"],
      psychology: ["psychology", "psych", "behavior", "mental health"],
      education: ["education", "teaching", "pedagogy", "curriculum"],
      theology: ["theology", "religion", "biblical", "ministry", "faith"],
    };

    for (const [subject, keywords] of Object.entries(subjectKeywords)) {
      if (keywords.some((keyword) => filenameLower.includes(keyword))) {
        return subject;
      }
    }

    return "general";
  }

  // Remove syllabus
  async removeSyllabus(syllabusId: string): Promise<boolean> {
    try {
      console.log("🗑️ Removing syllabus:", syllabusId);

      // Find syllabus
      const syllabusIndex = this.uploadedSyllabi.findIndex(
        (s) => s.id === syllabusId
      );

      if (syllabusIndex === -1) {
        console.warn("⚠️ Syllabus not found:", syllabusId);
        return false;
      }

      const syllabus = this.uploadedSyllabi[syllabusIndex];

      // Remove from database if stored there
      if (syllabus.storageMode === "database") {
        try {
          const response = await fetch("/.netlify/functions/remove-syllabus", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              syllabusId: syllabusId,
              userId: this.userId,
            }),
          });

          if (!response.ok) {
            console.warn("⚠️ Failed to remove from database:", response.status);
          }
        } catch (error) {
          console.warn("⚠️ Database removal failed:", error);
        }
      }

      // Remove from local array
      this.uploadedSyllabi.splice(syllabusIndex, 1);

      // Save updated list
      this.saveSyllabi();

      console.log("✅ Syllabus removed successfully");
      return true;
    } catch (error) {
      console.error("❌ Failed to remove syllabus:", error);
      return false;
    }
  }

  // Toggle syllabus active status
  toggleSyllabus(syllabusId: string): boolean {
    const syllabus = this.uploadedSyllabi.find((s) => s.id === syllabusId);
    if (!syllabus) {
      console.warn("⚠️ Syllabus not found:", syllabusId);
      return false;
    }

    // Deactivate all other syllabi
    this.uploadedSyllabi.forEach((s) => {
      s.status = "inactive";
    });

    // Toggle the selected syllabus
    syllabus.status = syllabus.status === "active" ? "inactive" : "active";

    // Save changes
    this.saveSyllabi();

    console.log(`✅ Syllabus ${syllabusId} ${syllabus.status}`);
    return true;
  }

  // Get active syllabus
  getActiveSyllabus(): Syllabus | null {
    return this.uploadedSyllabi.find((s) => s.status === "active") || null;
  }

  // Get all syllabi
  getAllSyllabi(): Syllabus[] {
    return this.uploadedSyllabi;
  }

  // Get syllabus by ID
  getSyllabusById(syllabusId: string): Syllabus | undefined {
    return this.uploadedSyllabi.find((s) => s.id === syllabusId);
  }

  // Get syllabi by subject
  getSyllabiBySubject(subject: string): Syllabus[] {
    return this.uploadedSyllabi.filter((s) => s.metadata.subject === subject);
  }

  // Update syllabus metadata
  updateSyllabusMetadata(
    syllabusId: string,
    metadata: Partial<SyllabusMetadata>
  ): boolean {
    const syllabus = this.getSyllabusById(syllabusId);
    if (!syllabus) {
      console.warn("⚠️ Syllabus not found:", syllabusId);
      return false;
    }

    syllabus.metadata = { ...syllabus.metadata, ...metadata };
    syllabus.lastModified = new Date().toISOString();

    this.saveSyllabi();
    console.log("✅ Syllabus metadata updated");
    return true;
  }

  // Search syllabi
  searchSyllabi(query: string): Syllabus[] {
    const searchTerm = query.toLowerCase();
    return this.uploadedSyllabi.filter((syllabus) => {
      return (
        syllabus.filename.toLowerCase().includes(searchTerm) ||
        syllabus.metadata.subject?.toLowerCase().includes(searchTerm) ||
        syllabus.metadata.extractedText?.toLowerCase().includes(searchTerm)
      );
    });
  }

  // Get syllabus statistics
  getSyllabusStats(): SyllabusStats {
    const stats: SyllabusStats = {
      totalSyllabi: this.uploadedSyllabi.length,
      activeSyllabi: this.uploadedSyllabi.filter((s) => s.status === "active")
        .length,
      totalSize: this.uploadedSyllabi.reduce((sum, s) => sum + s.size, 0),
      subjects: {},
      storageMode: this.storageMode,
    };

    // Count subjects
    this.uploadedSyllabi.forEach((syllabus) => {
      const subject = syllabus.metadata.subject || "general";
      stats.subjects[subject] = (stats.subjects[subject] || 0) + 1;
    });

    return stats;
  }

  // Migrate local syllabi to database
  async migrateToDatabase(): Promise<{ success: boolean; migrated: number }> {
    if (!this.isAuthenticated || !this.userId) {
      console.warn("⚠️ Not authenticated, cannot migrate to database");
      return { success: false, migrated: 0 };
    }

    try {
      console.log("🔄 Migrating local syllabi to database...");

      const localSyllabi = this.uploadedSyllabi.filter(
        (s) => s.storageMode === "local"
      );

      if (localSyllabi.length === 0) {
        console.log("✅ No local syllabi to migrate");
        return { success: true, migrated: 0 };
      }

      let migratedCount = 0;

      for (const syllabus of localSyllabi) {
        try {
          // Upload to database
          await this.saveToDatabase(syllabus);
          migratedCount++;
        } catch (error) {
          console.warn("⚠️ Failed to migrate syllabus:", syllabus.id, error);
        }
      }

      // Save updated list
      this.saveSyllabi();
      console.log(`✅ Migrated ${migratedCount} syllabi to database`);

      return { success: true, migrated: migratedCount };
    } catch (error) {
      console.error("❌ Migration failed:", error);
      return { success: false, migrated: 0 };
    }
  }

  // Save syllabi to localStorage
  private saveSyllabi(): void {
    try {
      const storageKey = this.isAuthenticated
        ? `smartypants_syllabi_${this.userId}`
        : `smartypants_syllabi_${this.sessionId}`;

      const dataToSave = JSON.stringify(this.uploadedSyllabi);
      localStorage.setItem(storageKey, dataToSave);

      console.log("✅ Syllabi saved to localStorage:", {
        storageKey,
        count: this.uploadedSyllabi.length,
        dataSize: dataToSave.length,
        syllabi: this.uploadedSyllabi.map((s) => ({
          id: s.id,
          filename: s.filename,
        })),
      });
    } catch (error) {
      console.error("❌ Failed to save syllabi:", error);
    }
  }

  // Load syllabi from localStorage
  private loadSyllabi(): void {
    try {
      const storageKey = this.isAuthenticated
        ? `smartypants_syllabi_${this.userId}`
        : `smartypants_syllabi_${this.sessionId}`;

      const data = localStorage.getItem(storageKey);
      this.uploadedSyllabi = data ? JSON.parse(data) : [];
      console.log(
        `📚 Loaded ${this.uploadedSyllabi.length} syllabi from localStorage`
      );

      // If authenticated, also try to load from database
      if (this.isAuthenticated) {
        this.loadSyllabiFromDatabase();
      }
    } catch (error) {
      console.error("❌ Failed to load syllabi:", error);
      this.uploadedSyllabi = [];
    }
  }

  // Load syllabi from database (for authenticated users)
  private async loadSyllabiFromDatabase(): Promise<void> {
    if (!this.isAuthenticated || !this.userId) {
      console.log("⚠️ Not authenticated, skipping database load");
      return;
    }

    try {
      console.log("🔄 Loading syllabi from database...");

      const response = await fetch(`/.netlify/functions/list-syllabi`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: this.userId,
        }),
      });

      if (!response.ok) {
        console.warn("⚠️ Failed to load from database:", response.status);
        return;
      }

      const data = await response.json();
      console.log("📥 Database syllabi:", data);

      if (data.success && data.syllabi) {
        // Merge database syllabi with local ones, avoiding duplicates
        const databaseSyllabi = data.syllabi.map((dbSyllabus: any) => ({
          id: dbSyllabus.id,
          filename: dbSyllabus.original_name || dbSyllabus.filename,
          originalName: dbSyllabus.original_name || dbSyllabus.filename,
          size: dbSyllabus.file_size,
          type: dbSyllabus.file_type,
          uploadDate: dbSyllabus.upload_date,
          lastModified: dbSyllabus.last_modified,
          status: dbSyllabus.status || "inactive",
          storageMode: "database",
          sessionId: this.sessionId,
          userId: this.userId,
          url: dbSyllabus.file_url,
          metadata: {
            pages: dbSyllabus.metadata?.pages || null,
            wordCount: dbSyllabus.metadata?.word_count || null,
            extractedText: dbSyllabus.metadata?.extracted_text || null,
            subject: dbSyllabus.metadata?.subject || "general",
          },
        }));

        // Merge with existing local syllabi, preferring database versions
        const existingIds = new Set(this.uploadedSyllabi.map((s) => s.id));
        const newSyllabi = databaseSyllabi.filter(
          (s: any) => !existingIds.has(s.id)
        );

        this.uploadedSyllabi = [...this.uploadedSyllabi, ...newSyllabi];

        console.log(`✅ Loaded ${newSyllabi.length} syllabi from database`);
        this.saveSyllabi(); // Save merged data to localStorage
      }
    } catch (error) {
      console.error("❌ Failed to load syllabi from database:", error);
    }
  }

  // Clear all syllabi
  clearAllSyllabi(): void {
    this.uploadedSyllabi = [];
    this.saveSyllabi();
    console.log("✅ All syllabi cleared");
  }

  // Generate unique syllabus ID
  private generateSyllabusId(): string {
    return (
      "SYL-" +
      Date.now() +
      "-" +
      Math.random().toString(36).substr(2, 9).toUpperCase()
    );
  }

  // Convert file to base64
  private fileToBase64(fileData: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () =>
        reject(new Error("Failed to convert file to base64"));
      reader.readAsDataURL(new Blob([fileData]));
    });
  }

  // Validate syllabus data structure
  private validateSyllabusData(syllabus: Syllabus): void {
    const requiredFields = ["id", "filename", "size", "type", "uploadDate"];

    for (const field of requiredFields) {
      if (!(syllabus as any)[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    if (syllabus.size > this.maxFileSize) {
      throw new Error("File size exceeds maximum limit");
    }

    if (!this.allowedTypes.includes(syllabus.type)) {
      throw new Error("Invalid file type");
    }
  }

  // Initialize service
  async init(): Promise<void> {
    console.log("🔄 Initializing syllabus service...");
    this.loadSyllabi();

    // If authenticated, also load from database
    if (this.isAuthenticated) {
      await this.loadSyllabiFromDatabase();
    }

    console.log(
      "✅ Syllabus service initialized with",
      this.uploadedSyllabi.length,
      "syllabi"
    );

    // Signal that initialization is complete
    this.isInitialized = true;

    // Dispatch custom event for other components to listen to
    window.dispatchEvent(
      new CustomEvent("syllabusServiceReady", {
        detail: {
          syllabiCount: this.uploadedSyllabi.length,
          storageMode: this.storageMode,
          isAuthenticated: this.isAuthenticated,
        },
      })
    );
  }

  // Refresh syllabi from all sources
  async refreshSyllabi(): Promise<Syllabus[]> {
    console.log("🔄 Refreshing syllabi from all sources...");

    // Store current count for comparison
    const currentCount = this.uploadedSyllabi.length;
    console.log(`📊 Current syllabi count: ${currentCount}`);

    // Load from local storage (this will update the array)
    this.loadSyllabi();

    // If authenticated, also load from database
    if (this.isAuthenticated) {
      await this.loadSyllabiFromDatabase();
    }

    console.log(
      `✅ Refreshed syllabi: ${this.uploadedSyllabi.length} total (was ${currentCount})`
    );
    return this.uploadedSyllabi;
  }

  // Get service configuration
  getConfig(): ServiceConfig {
    return {
      maxFileSize: this.maxFileSize,
      maxFileSizeMB: this.maxFileSize / (1024 * 1024),
      allowedTypes: this.allowedTypes,
      maxSyllabiPerUser: this.maxSyllabiPerUser,
      storageMode: this.storageMode,
      isAuthenticated: this.isAuthenticated,
      sessionId: this.sessionId,
      userId: this.userId,
      isInitialized: this.isInitialized,
    };
  }

  // Check if service is ready
  isReady(): boolean {
    return this.isInitialized && this.uploadedSyllabi !== undefined;
  }

  // Update authentication status (called when user logs in/out)
  updateAuthStatus(isAuthenticated: boolean, userData: any = null): void {
    this.isAuthenticated = isAuthenticated;

    if (isAuthenticated && userData) {
      this.userId = userData.id || userData.email;
      this.storageMode = "database";
      console.log("🔐 User authenticated, switching to database mode");

      // Load syllabi with new storage key
      this.loadSyllabi();

      // Migrate existing syllabi to database
      this.migrateToDatabase();
    } else {
      this.userId = undefined;
      this.storageMode = "local";
      console.log("👤 User logged out, switching to local mode");

      // Reload syllabi with new storage key
      this.loadSyllabi();
    }
  }
}

// Create global instance
console.log("🔧 Creating syllabus service instance...");
(window as any).syllabusService = new SyllabusService();

// Initialize when page loads
document.addEventListener("DOMContentLoaded", async () => {
  console.log("📚 Initializing syllabus service on DOM ready...");
  await (window as any).syllabusService.init();
});

console.log("✅ SYLLABUS SERVICE LOADED SUCCESSFULLY!");
