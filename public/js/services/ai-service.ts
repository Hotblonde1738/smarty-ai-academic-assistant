// AI SERVICE - Business Logic for AI Interactions
console.log("🤖 AI SERVICE LOADING...");

interface SyllabusContext {
  activeSyllabus: any | null;
  syllabusData: any | null;
  customInstructions: string;
}

interface AIRequestOptions {
  subject?: string;
  difficulty?: string;
  helpType?: string;
  essayType?: string;
  citationStyle?: string;
  minReferences?: number;
}

interface AIRequestData {
  question: string;
  timestamp: string;
  subject?: string;
  difficulty?: string;
  helpType?: string;
  essayType?: string;
  citationStyle?: string;
  minReferences?: number;
  syllabusContext?: {
    filename: string;
    subject: string;
    customInstructions: string;
  };
}

interface AIResponse {
  success: boolean;
  answer?: string;
  timestamp: string;
  model?: string;
  metadata?: {
    responseTime?: number;
    tokens?: number;
    confidence?: number;
  };
  error?: string;
}

interface FormattedResponse {
  type: "success" | "error";
  content: string;
  timestamp: string;
  model?: string;
  metadata?: any;
}

class AIService {
  private endpoints: string[];
  private maxRetries: number;
  private timeout: number;
  private syllabusContext: SyllabusContext;

  constructor() {
    this.endpoints = ["/.netlify/functions/ask", "/ask"];
    this.maxRetries = 3;
    this.timeout = 30000; // 30 seconds

    // Syllabus context management
    this.syllabusContext = {
      activeSyllabus: null,
      syllabusData: null,
      customInstructions: "",
    };
  }

  // Send chat request to AI
  async sendChatRequest(
    question: string,
    options: AIRequestOptions = {}
  ): Promise<AIResponse> {
    console.log("🤖 Sending AI request:", question);

    try {
      // Validate question
      this.validateQuestion(question);

      // Prepare request data
      const requestData = this.prepareRequestData(question, options);

      // Try multiple endpoints with retry logic
      const response = await this.tryEndpoints(requestData);

      // Process response
      const processedResponse = await this.processResponse(response);

      console.log("✅ AI request successful");
      return {
        success: true,
        answer: processedResponse.answer,
        timestamp: processedResponse.timestamp,
        model: processedResponse.model,
        metadata: processedResponse.metadata,
      };
    } catch (error) {
      console.error("❌ AI request failed:", error);
      return {
        success: false,
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Validate question input
  private validateQuestion(question: string): void {
    if (!question || typeof question !== "string") {
      throw new Error("Question must be a non-empty string");
    }

    const trimmedQuestion = question.trim();
    if (trimmedQuestion.length < 3) {
      throw new Error("Question must be at least 3 characters long");
    }

    if (trimmedQuestion.length > 2000) {
      throw new Error("Question is too long (maximum 2000 characters)");
    }
  }

  // Prepare request data
  private prepareRequestData(
    question: string,
    options: AIRequestOptions
  ): AIRequestData {
    const baseData: AIRequestData = {
      question: question.trim(),
      timestamp: new Date().toISOString(),
    };

    // Add optional parameters
    if (options.subject) baseData.subject = options.subject;
    if (options.difficulty) baseData.difficulty = options.difficulty;
    if (options.helpType) baseData.helpType = options.helpType;
    if (options.essayType) baseData.essayType = options.essayType;
    if (options.citationStyle) baseData.citationStyle = options.citationStyle;
    if (options.minReferences) baseData.minReferences = options.minReferences;

    // Add syllabus context if available
    if (this.hasSyllabusContext()) {
      const context = this.getSyllabusContext();
      baseData.syllabusContext = {
        filename: context.activeSyllabus.filename,
        subject: context.activeSyllabus.metadata?.subject || "general",
        customInstructions: context.customInstructions,
      };
      console.log("📚 Including syllabus context in AI request");
    }

    return baseData;
  }

  // Try multiple endpoints with retry logic
  private async tryEndpoints(requestData: AIRequestData): Promise<Response> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      for (const endpoint of this.endpoints) {
        try {
          console.log(`🔄 Attempt ${attempt}: Trying endpoint ${endpoint}`);

          const response = await this.makeRequest(endpoint, requestData);

          if (response.ok) {
            console.log(`✅ Success with endpoint: ${endpoint}`);
            return response;
          } else {
            const errorText = await response.text();
            lastError = new Error(
              `${endpoint}: ${response.status} - ${errorText}`
            );
            console.warn(`⚠️ ${endpoint} failed:`, lastError.message);
          }
        } catch (fetchError) {
          lastError = new Error(
            `${endpoint}: ${(fetchError as Error).message}`
          );
          console.warn(`⚠️ ${endpoint} error:`, lastError.message);
        }
      }

      // Wait before retry (exponential backoff)
      if (attempt < this.maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError || new Error("All endpoints failed after maximum retries");
  }

  // Make individual request
  private async makeRequest(
    endpoint: string,
    requestData: AIRequestData
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify(requestData),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if ((error as Error).name === "AbortError") {
        throw new Error("Request timeout");
      }
      throw error;
    }
  }

  // Process AI response
  private async processResponse(response: Response): Promise<{
    answer: string;
    timestamp: string;
    model: string;
    metadata: any;
  }> {
    try {
      // Parse the JSON response
      const data = await response.json();

      console.log("📥 Parsed response data:", data);

      return {
        answer: data.answer || "No answer received",
        timestamp: data.timestamp || new Date().toISOString(),
        model: data.model || "unknown",
        metadata: {
          responseTime: data.responseTime,
          tokens: data.tokens,
          confidence: data.confidence,
        },
      };
    } catch (error) {
      console.error("❌ Failed to parse response:", error);
      throw new Error("Failed to parse AI response");
    }
  }

  // ===== SYLLABUS CONTEXT MANAGEMENT =====

  // Set active syllabus for AI context
  setSyllabusContext(syllabus: any): void {
    console.log("📚 Setting syllabus context:", syllabus?.filename);

    this.syllabusContext.activeSyllabus = syllabus;

    if (syllabus) {
      // Create context instructions based on syllabus
      this.syllabusContext.customInstructions =
        this.createSyllabusInstructions(syllabus);
      console.log("✅ Syllabus context set");
    } else {
      this.syllabusContext.customInstructions = "";
      console.log("✅ Syllabus context cleared");
    }
  }

  // Create custom instructions based on syllabus
  private createSyllabusInstructions(syllabus: any): string {
    if (!syllabus) return "";

    const subject = syllabus.metadata?.subject || "general";
    const filename = syllabus.filename;

    return `You are now assisting with coursework related to: ${filename}

**Course Context:**
- Subject: ${subject}
- Syllabus: ${filename}
- Please tailor your responses to align with this specific course

**Guidelines:**
- Reference specific topics from this syllabus when relevant
- Use terminology and concepts appropriate for this course level
- Consider the course structure and learning objectives
- Provide examples that would be relevant to this specific course

**Response Style:**
- Be specific to this course context
- Reference syllabus content when helpful
- Maintain academic rigor appropriate for this subject area`;
  }

  // Get current syllabus context
  getSyllabusContext(): SyllabusContext {
    return this.syllabusContext;
  }

  // Check if syllabus context is active
  hasSyllabusContext(): boolean {
    return !!this.syllabusContext.activeSyllabus;
  }

  // Clear syllabus context
  clearSyllabusContext(): void {
    console.log("📚 Clearing syllabus context");
    this.syllabusContext.activeSyllabus = null;
    this.syllabusContext.syllabusData = null;
    this.syllabusContext.customInstructions = "";
  }

  // Format response for display
  formatResponse(response: AIResponse): FormattedResponse {
    if (!response.success) {
      return {
        type: "error",
        content: response.error || "Unknown error",
        timestamp: response.timestamp,
      };
    }

    return {
      type: "success",
      content: response.answer || "No response received",
      timestamp: response.timestamp,
      model: response.model,
      metadata: response.metadata,
    };
  }
}

// Create global instance
(window as any).aiService = new AIService();

console.log("✅ AI SERVICE LOADED SUCCESSFULLY!");
