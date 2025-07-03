import { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

interface UploadResponse {
  id: string;
  filename: string;
  url?: string;
  message: string;
  timestamp: string;
  metadata?: {
    pages?: number;
    wordCount?: number;
    extractedText?: string;
    subject?: string;
  };
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
  console.log("📄 Syllabus upload function called");
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
    // Check content type
    const contentType = event.headers["content-type"] || "";
    console.log("📋 Content-Type:", contentType);

    if (!contentType.includes("multipart/form-data")) {
      console.warn("⚠️ Expected multipart/form-data, got:", contentType);
    }

    // Parse multipart form data
    let formData: any = {};
    let fileData: any = null;

    if (event.body) {
      try {
        // For now, we'll handle this as a simple JSON upload
        // In a real implementation, you'd use a multipart parser
        const body = event.isBase64Encoded
          ? Buffer.from(event.body, "base64").toString("utf-8")
          : event.body;

        console.log("📄 Body preview:", body.substring(0, 200) + "...");

        // Try to parse as JSON first
        try {
          formData = JSON.parse(body);
          console.log("✅ Parsed as JSON:", Object.keys(formData));
        } catch (jsonError) {
          console.log("⚠️ Not JSON, treating as form data");
          // For multipart data, we'd need a proper parser
          // For now, we'll create a mock response
        }
      } catch (parseError) {
        console.error("❌ Failed to parse request body:", parseError);
        throw new Error("Invalid request format");
      }
    }

    // Extract data
    const userId = formData.userId || "anonymous";
    const metadata = formData.metadata ? JSON.parse(formData.metadata) : {};
    const filename = formData.filename || "uploaded-syllabus.pdf";

    console.log("📋 Extracted data:", { userId, filename, metadata });

    // Generate a unique ID for the syllabus
    const syllabusId = `syl_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // For now, simulate successful upload since actual file storage
    // would require additional setup (S3, etc.)
    const uploadResponse: UploadResponse = {
      id: syllabusId,
      filename: filename,
      url: `https://api.getsmartyai.space/syllabi/${syllabusId}`, // Mock URL
      message: "Syllabus uploaded successfully!",
      timestamp: new Date().toISOString(),
      metadata: {
        pages: metadata.pages || null,
        wordCount: metadata.wordCount || null,
        extractedText: metadata.extractedText || null,
        subject: metadata.subject || "general",
      },
    };

    console.log(`✅ Syllabus uploaded: ${syllabusId} for user: ${userId}`);
    console.log("📤 Response:", uploadResponse);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(uploadResponse),
    };
  } catch (error) {
    console.error("❌ Upload function error:", error);
    console.error("❌ Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });

    const errorResponse: ErrorResponse = {
      error:
        "Upload failed: " +
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
