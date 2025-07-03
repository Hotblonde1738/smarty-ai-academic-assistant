import { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import { OpenAI } from "openai";

const handler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext
) => {
  // Enhanced CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, X-Requested-With, Accept, Origin",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Content-Type": "application/json",
  };

  // Handle preflight requests
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: "CORS preflight successful" }),
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed. Use POST." }),
    };
  }

  try {
    console.log("🤖 AI function called");
    console.log("📝 Request body:", event.body);

    // Parse request body
    let requestData: { question?: string };
    try {
      requestData = JSON.parse(event.body || "{}") as { question?: string };
    } catch (parseError) {
      console.error("❌ JSON parse error:", parseError);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Invalid JSON in request body" }),
      };
    }

    const { question } = requestData;

    // Validate input
    if (
      !question ||
      typeof question !== "string" ||
      question.trim().length === 0
    ) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: "Question is required and must be a non-empty string",
        }),
      };
    }

    // Check API key
    if (!process.env.OPENAI_API_KEY) {
      console.error("❌ OpenAI API key not found in environment");
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error:
            "OpenAI API key not configured. Please set OPENAI_API_KEY in Netlify environment variables, or else.",
        }),
      };
    }

    console.log("🔑 API key found, creating OpenAI client...");

    // Create OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 30000,
      maxRetries: 2,
    });

    console.log("📤 Sending request to OpenAI...");

    // Make OpenAI request
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are SmartyPants-AI, a helpful academic assistant. Provide clear, educational responses that help students learn. Always be encouraging and supportive. Keep responses concise but informative.",
        },
        {
          role: "user",
          content: question.trim(),
        },
      ],
      max_tokens: 1500,
      temperature: 0.7,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });

    const answer = completion.choices[0]?.message?.content;

    if (!answer) {
      throw new Error("No response generated from OpenAI");
    }

    console.log("✅ OpenAI response received successfully");

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        answer: answer,
        timestamp: new Date().toISOString(),
        model: "gpt-3.5-turbo",
      }),
    };
  } catch (error: any) {
    console.error("❌ Function error:", error);

    let errorMessage = "An unexpected error occurred";
    let statusCode = 500;

    if (error.status === 401) {
      errorMessage =
        "Invalid OpenAI API key. Please check your API key configuration.";
      statusCode = 401;
    } else if (error.status === 429) {
      errorMessage =
        "OpenAI rate limit exceeded or quota reached. Please try again later.";
      statusCode = 429;
    } else if (error.status === 400) {
      errorMessage = "Invalid request to OpenAI. Please check your input.";
      statusCode = 400;
    } else if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
      errorMessage = "Cannot connect to OpenAI servers. Please try again.";
      statusCode = 503;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return {
      statusCode: statusCode,
      headers,
      body: JSON.stringify({
        error: errorMessage,
        timestamp: new Date().toISOString(),
      }),
    };
  }
};

export { handler };
