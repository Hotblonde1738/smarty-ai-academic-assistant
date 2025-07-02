// AI SERVICE - Business Logic for AI Interactions
console.log("🤖 AI SERVICE LOADING...");

class AIService {
  constructor() {
    this.endpoints = ["/.netlify/functions/ask", "/ask"];

    this.maxRetries = 3;
    this.timeout = 30000; // 30 seconds
  }

  // Send chat request to AI
  async sendChatRequest(question, options = {}) {
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
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Validate question input
  validateQuestion(question) {
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
  prepareRequestData(question, options) {
    const baseData = {
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

    return baseData;
  }

  // Try multiple endpoints with retry logic
  async tryEndpoints(requestData) {
    let lastError = null;

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
          lastError = new Error(`${endpoint}: ${fetchError.message}`);
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
  async makeRequest(endpoint, requestData) {
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
      if (error.name === "AbortError") {
        throw new Error("Request timeout");
      }
      throw error;
    }
  }

  // Process AI response
  async processResponse(response) {
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

  // Generate demo response (for demo mode)
  generateDemoResponse(question, subject = "general") {
    console.log("🎯 Generating demo response for:", question);

    const demoResponses = {
      math: `**Math Support Response**

I'd be happy to help you with your math question: "${question}"

**Key Concepts:**
- Understanding the problem
- Breaking it down step by step
- Using appropriate formulas
- Checking your work

**Problem-Solving Steps:**
1. Read the problem carefully
2. Identify what's given and what's asked
3. Choose the right approach
4. Solve step by step
5. Verify your answer

**Study Tips:**
- Practice regularly
- Review fundamental concepts
- Use visual aids when helpful
- Check your work systematically

Would you like me to help you work through this specific problem?`,

      science: `**Science Support Response**

Great question about science! Let me help you understand: "${question}"

**Scientific Method:**
- Observation and questioning
- Hypothesis formation
- Experimentation
- Data analysis
- Conclusion drawing

**Key Concepts:**
- Evidence-based reasoning
- Critical thinking
- Systematic approach
- Peer review process

**Study Strategies:**
- Create concept maps
- Practice with examples
- Connect to real life
- Review vocabulary

Understanding these fundamentals will help you excel in science. Which part would you like to explore further?`,

      general: `**Academic Support Response**

I'm here to help you succeed in your studies!

**Learning Strategies:**
1. **Active Learning** - Engage with material
2. **Spaced Practice** - Review regularly
3. **Connect Ideas** - Link new to known
4. **Self-Test** - Check understanding

**Study Tips:**
- Set specific goals
- Create a schedule
- Use multiple resources
- Stay organized

**Critical Thinking:**
- Ask questions
- Analyze from different angles
- Practice problem-solving
- Reflect on learning

**Next Steps:**
1. Identify your objectives
2. Break down complex topics
3. Practice applying concepts
4. Monitor your progress

I'm here to support your academic journey. What would you like to focus on next?`,
    };

    const response = demoResponses[subject] || demoResponses.general;

    // Simulate processing time
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          answer: response,
          timestamp: new Date().toISOString(),
          model: "demo-mode",
          metadata: {
            demo: true,
            subject: subject,
          },
        });
      }, 2000);
    });
  }

  // Format response for display
  formatResponse(response) {
    if (!response.success) {
      return {
        type: "error",
        content: response.error,
        timestamp: response.timestamp,
      };
    }

    return {
      type: "success",
      content: response.answer,
      timestamp: response.timestamp,
      model: response.model,
      metadata: response.metadata,
    };
  }

  // Get response statistics
  getResponseStats() {
    // This would track response times, success rates, etc.
    return {
      totalRequests: 0,
      successfulRequests: 0,
      averageResponseTime: 0,
      lastRequestTime: null,
    };
  }

  // Check AI service health
  async checkHealth() {
    try {
      const response = await fetch("/health", {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        return {
          healthy: true,
          status: data.status,
          timestamp: new Date().toISOString(),
        };
      } else {
        return {
          healthy: false,
          status: "unhealthy",
          error: `HTTP ${response.status}`,
          timestamp: new Date().toISOString(),
        };
      }
    } catch (error) {
      return {
        healthy: false,
        status: "unreachable",
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

// Create global instance
window.aiService = new AIService();

console.log("✅ AI SERVICE LOADED SUCCESSFULLY!");
