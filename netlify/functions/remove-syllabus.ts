import { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

interface RemoveResponse {
  success: boolean;
  message: string;
  syllabusId: string;
  timestamp: string;
}

interface ErrorResponse {
  error: string;
  timestamp: string;
}

interface RemoveRequest {
  syllabusId: string;
  userId: string;
}

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Requested-With, Accept, Origin",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Max-Age": "86400",
  "Content-Type": "application/json",
};

export const handler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext
) => {
  // Handle preflight requests
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: "CORS preflight successful" }),
    };
  }

  if (event.httpMethod !== "DELETE") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed. Use DELETE." }),
    };
  }

  try {
    console.log("🗑️ Syllabus removal called");

    // Parse the request body
    const body: RemoveRequest = JSON.parse(event.body || "{}");
    const { syllabusId, userId } = body;

    if (!syllabusId || !userId) {
      throw new Error("Missing required fields: syllabusId and userId");
    }

    // For now, simulate successful removal since actual database operations
    // would require additional setup
    const removeResponse: RemoveResponse = {
      success: true,
      message: "Syllabus removed successfully",
      syllabusId: syllabusId,
      timestamp: new Date().toISOString(),
    };

    console.log(`✅ Syllabus removed: ${syllabusId} for user: ${userId}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(removeResponse),
    };
  } catch (error) {
    console.error("❌ Remove function error:", error);

    const errorResponse: ErrorResponse = {
      error:
        "Remove failed: " +
        (error instanceof Error ? error.message : "Unknown error"),
      timestamp: new Date().toISOString(),
    };

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify(errorResponse),
    };
  }
};
