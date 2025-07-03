import { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import { supabase } from "./supabase-client";

interface ListRequest {
  userId: string;
}

interface ListResponse {
  success: boolean;
  syllabi: any[];
  count: number;
  timestamp: string;
}

interface ErrorResponse {
  error: string;
  timestamp: string;
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
  console.log("📋 List syllabi function called");
  console.log("📊 Request details:", {
    method: event.httpMethod,
    headers: event.headers,
    bodyLength: event.body?.length || 0,
    isBase64Encoded: event.isBase64Encoded,
  });

  // Handle preflight requests
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: "CORS preflight successful" }),
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed. Use POST." }),
    };
  }

  try {
    // Parse request body
    const body = event.isBase64Encoded
      ? Buffer.from(event.body!, "base64").toString("utf-8")
      : event.body!;

    const requestData: ListRequest = JSON.parse(body);
    console.log("📋 List request:", requestData);

    if (!requestData.userId) {
      throw new Error("User ID is required");
    }

    // Fetch syllabi from database
    console.log("🔍 Fetching syllabi from database...");
    const { data: syllabi, error: fetchError } = await supabase
      .from("syllabi")
      .select("*")
      .eq("user_id", requestData.userId)
      .order("upload_date", { ascending: false });

    if (fetchError) {
      console.error("❌ Database fetch error:", fetchError);
      throw new Error(`Database fetch failed: ${fetchError.message}`);
    }

    console.log(`✅ Found ${syllabi?.length || 0} syllabi`);

    const listResponse: ListResponse = {
      success: true,
      syllabi: syllabi || [],
      count: syllabi?.length || 0,
      timestamp: new Date().toISOString(),
    };

    console.log("📤 Response:", listResponse);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(listResponse),
    };
  } catch (error) {
    console.error("❌ List syllabi function error:", error);
    console.error("❌ Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });

    const errorResponse: ErrorResponse = {
      error:
        "List failed: " +
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
