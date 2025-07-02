// SYLLABUS SERVICE - Business Logic for Syllabus Management
console.log("📚 SYLLABUS SERVICE LOADING...");

class SyllabusService {
  constructor() {
    this.uploadedSyllabi = [];
    this.maxFileSize = 5 * 1024 * 1024; // 5MB
    this.allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    this.maxSyllabiPerUser = 10;
  }

  // Upload syllabus file
  async uploadSyllabus(file) {
    console.log("📚 Uploading syllabus:", file.name);

    try {
      // Validate file
      this.validateFile(file);

      // Prepare form data
      const formData = new FormData();
      formData.append("syllabus", file);

      // Upload to server
      const response = await fetch("/upload-syllabus", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        // Add to local collection
        const syllabus = this.createSyllabusRecord(data, file);
        this.uploadedSyllabi.push(syllabus);

        // Save to localStorage
        this.saveSyllabi();

        console.log("✅ Syllabus uploaded successfully:", syllabus);
        return {
          success: true,
          syllabus: syllabus,
        };
      } else {
        throw new Error(data.error || "Failed to upload syllabus");
      }
    } catch (error) {
      console.error("❌ Syllabus upload failed:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Validate file before upload
  validateFile(file) {
    if (!file) {
      throw new Error("No file selected");
    }

    if (file.size > this.maxFileSize) {
      throw new Error(
        `File size exceeds ${this.maxFileSize / (1024 * 1024)}MB limit`
      );
    }

    if (!this.allowedTypes.includes(file.type)) {
      throw new Error(
        "Invalid file type. Only PDF and Word documents are allowed"
      );
    }

    if (this.uploadedSyllabi.length >= this.maxSyllabiPerUser) {
      throw new Error(
        `Maximum ${this.maxSyllabiPerUser} syllabi allowed per user`
      );
    }

    // Check for duplicate filenames
    const existingFile = this.uploadedSyllabi.find(
      (s) => s.filename === file.name
    );
    if (existingFile) {
      throw new Error("A file with this name already exists");
    }
  }

  // Create syllabus record
  createSyllabusRecord(serverData, file) {
    return {
      id: serverData.id || this.generateSyllabusId(),
      filename: file.name,
      originalName: file.name,
      size: file.size,
      type: file.type,
      uploadDate: new Date().toISOString(),
      lastModified: new Date(file.lastModified).toISOString(),
      status: "uploaded",
      url: serverData.url || null,
      metadata: {
        pages: serverData.pages || null,
        wordCount: serverData.wordCount || null,
        extractedText: serverData.extractedText || null,
      },
    };
  }

  // Remove syllabus
  removeSyllabus(syllabusId) {
    console.log("📚 Removing syllabus:", syllabusId);

    const index = this.uploadedSyllabi.findIndex((s) => s.id === syllabusId);
    if (index === -1) {
      throw new Error("Syllabus not found");
    }

    const removedSyllabus = this.uploadedSyllabi.splice(index, 1)[0];
    this.saveSyllabi();

    console.log("✅ Syllabus removed:", removedSyllabus);
    return {
      success: true,
      syllabus: removedSyllabus,
    };
  }

  // Get all syllabi
  getAllSyllabi() {
    return [...this.uploadedSyllabi];
  }

  // Get syllabus by ID
  getSyllabusById(syllabusId) {
    return this.uploadedSyllabi.find((s) => s.id === syllabusId);
  }

  // Get syllabi by subject (if metadata available)
  getSyllabiBySubject(subject) {
    return this.uploadedSyllabi.filter(
      (s) => s.metadata && s.metadata.subject === subject
    );
  }

  // Update syllabus metadata
  updateSyllabusMetadata(syllabusId, metadata) {
    const syllabus = this.getSyllabusById(syllabusId);
    if (!syllabus) {
      throw new Error("Syllabus not found");
    }

    syllabus.metadata = { ...syllabus.metadata, ...metadata };
    syllabus.lastModified = new Date().toISOString();
    this.saveSyllabi();

    return {
      success: true,
      syllabus: syllabus,
    };
  }

  // Search syllabi by content
  searchSyllabi(query) {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const searchTerm = query.toLowerCase().trim();

    return this.uploadedSyllabi.filter((syllabus) => {
      // Search in filename
      if (syllabus.filename.toLowerCase().includes(searchTerm)) {
        return true;
      }

      // Search in extracted text (if available)
      if (syllabus.metadata && syllabus.metadata.extractedText) {
        return syllabus.metadata.extractedText
          .toLowerCase()
          .includes(searchTerm);
      }

      return false;
    });
  }

  // Get syllabus statistics
  getSyllabusStats() {
    const totalSize = this.uploadedSyllabi.reduce((sum, s) => sum + s.size, 0);
    const fileTypes = this.uploadedSyllabi.reduce((types, s) => {
      types[s.type] = (types[s.type] || 0) + 1;
      return types;
    }, {});

    return {
      totalSyllabi: this.uploadedSyllabi.length,
      totalSize: totalSize,
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
      fileTypes: fileTypes,
      oldestUpload:
        this.uploadedSyllabi.length > 0
          ? Math.min(...this.uploadedSyllabi.map((s) => new Date(s.uploadDate)))
          : null,
      newestUpload:
        this.uploadedSyllabi.length > 0
          ? Math.max(...this.uploadedSyllabi.map((s) => new Date(s.uploadDate)))
          : null,
    };
  }

  // Export syllabi data
  exportSyllabiData() {
    return {
      syllabi: this.uploadedSyllabi,
      exportDate: new Date().toISOString(),
      stats: this.getSyllabusStats(),
    };
  }

  // Import syllabi data
  importSyllabiData(data) {
    if (!data || !Array.isArray(data.syllabi)) {
      throw new Error("Invalid syllabus data format");
    }

    // Validate each syllabus
    data.syllabi.forEach((syllabus) => {
      if (!syllabus.id || !syllabus.filename) {
        throw new Error("Invalid syllabus record");
      }
    });

    this.uploadedSyllabi = data.syllabi;
    this.saveSyllabi();

    console.log("✅ Syllabus data imported successfully");
    return {
      success: true,
      count: this.uploadedSyllabi.length,
    };
  }

  // Save syllabi to localStorage
  saveSyllabi() {
    try {
      localStorage.setItem(
        "smartypants_syllabi",
        JSON.stringify(this.uploadedSyllabi)
      );
      console.log("✅ Syllabi saved to localStorage");
    } catch (error) {
      console.error("❌ Failed to save syllabi:", error);
    }
  }

  // Load syllabi from localStorage
  loadSyllabi() {
    try {
      const data = localStorage.getItem("smartypants_syllabi");
      this.uploadedSyllabi = data ? JSON.parse(data) : [];
      console.log(
        `📚 Loaded ${this.uploadedSyllabi.length} syllabi from localStorage`
      );
    } catch (error) {
      console.error("❌ Failed to load syllabi:", error);
      this.uploadedSyllabi = [];
    }
  }

  // Clear all syllabi
  clearAllSyllabi() {
    this.uploadedSyllabi = [];
    this.saveSyllabi();
    console.log("✅ All syllabi cleared");
  }

  // Generate unique syllabus ID
  generateSyllabusId() {
    return (
      "SYL-" +
      Date.now() +
      "-" +
      Math.random().toString(36).substr(2, 9).toUpperCase()
    );
  }

  // Validate syllabus data structure
  validateSyllabusData(syllabus) {
    const requiredFields = ["id", "filename", "size", "type", "uploadDate"];

    for (const field of requiredFields) {
      if (!syllabus[field]) {
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
  init() {
    this.loadSyllabi();
    console.log("✅ Syllabus service initialized");
  }

  // Get service configuration
  getConfig() {
    return {
      maxFileSize: this.maxFileSize,
      maxFileSizeMB: this.maxFileSize / (1024 * 1024),
      allowedTypes: this.allowedTypes,
      maxSyllabiPerUser: this.maxSyllabiPerUser,
    };
  }
}

// Create global instance
window.syllabusService = new SyllabusService();

// Initialize when page loads
document.addEventListener("DOMContentLoaded", () => {
  window.syllabusService.init();
});

console.log("✅ SYLLABUS SERVICE LOADED SUCCESSFULLY!");
