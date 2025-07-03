import { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import { supabase, STORAGE_BUCKET } from "./supabase-client";

interface RemoveRequest {
  syllabusId: string;
  userId: string;
}

interface RemoveResponse {
  success: boolean;
  message: string;
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
  console.log("🗑️ Syllabus removal function called");
  console.log("📊 Request details:", {
    method: event.httpMethod,
    headers: event.headers,
    bodyLength: event.body?.length || 0,
  });

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
    // Parse request body
    const body = event.isBase64Encoded
      ? Buffer.from(event.body!, "base64").toString("utf-8")
      : event.body!;

    const requestData: RemoveRequest = JSON.parse(body);
    console.log("📋 Remove request:", requestData);

    // First, get the syllabus record to find the file path
    console.log("🔍 Fetching syllabus record...");
    const { data: syllabus, error: fetchError } = await supabase
      .from("syllabi")
      .select("*")
      .eq("id", requestData.syllabusId)
      .eq("user_id", requestData.userId)
      .single();

    if (fetchError || !syllabus) {
      console.error("❌ Syllabus not found:", fetchError);
      throw new Error("Syllabus not found or access denied");
    }

    console.log("📄 Found syllabus:", syllabus);

    // Delete the file from storage
    const filePath = `${requestData.userId}/${syllabus.filename}`;
    console.log("🗑️ Removing file from storage:", filePath);

    const { error: storageError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([filePath]);

    if (storageError) {
      console.warn("⚠️ Storage removal failed:", storageError);
      // Continue with database removal even if storage fails
    } else {
      console.log("✅ File removed from storage");
    }

    // Delete the database record
    console.log("🗑️ Removing database record...");
    const { error: dbError } = await supabase
      .from("syllabi")
      .delete()
      .eq("id", requestData.syllabusId)
      .eq("user_id", requestData.userId);

    if (dbError) {
      console.error("❌ Database removal error:", dbError);
      throw new Error(`Database removal failed: ${dbError.message}`);
    }

    console.log("✅ Database record removed");

    const removeResponse: RemoveResponse = {
      success: true,
      message: "Syllabus removed successfully",
      timestamp: new Date().toISOString(),
    };

    console.log(`✅ Syllabus removed successfully: ${requestData.syllabusId}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(removeResponse),
    };
  } catch (error) {
    console.error("❌ Remove function error:", error);
    console.error("❌ Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });

    const errorResponse: ErrorResponse = {
      error:
        "Removal failed: " +
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
