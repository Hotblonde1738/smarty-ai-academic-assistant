import { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import {
  supabase,
  SyllabusRecord,
  STORAGE_BUCKET,
  MAX_FILE_SIZE,
  ALLOWED_FILE_TYPES,
} from "./supabase-client";

interface UploadRequest {
  userId: string;
  filename: string;
  fileData: string; // Base64 encoded file
  fileType: string;
  fileSize: number;
  metadata?: {
    pages?: number;
    wordCount?: number;
    extractedText?: string;
    subject?: string;
  };
}

interface UploadResponse {
  id: string;
  filename: string;
  url: string;
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
    // Parse request body
    const body = event.isBase64Encoded
      ? Buffer.from(event.body!, "base64").toString("utf-8")
      : event.body!;

    const requestData: UploadRequest = JSON.parse(body);
    console.log("📋 Request data:", {
      userId: requestData.userId,
      filename: requestData.filename,
      fileType: requestData.fileType,
      fileSize: requestData.fileSize,
    });

    // Validate file
    if (requestData.fileSize > MAX_FILE_SIZE) {
      throw new Error(
        `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`
      );
    }

    if (!ALLOWED_FILE_TYPES.includes(requestData.fileType)) {
      throw new Error(
        "Invalid file type. Only PDF and Word documents are allowed"
      );
    }

    // Generate unique filename
    const fileExtension = requestData.filename.split(".").pop();
    const uniqueFilename = `${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}.${fileExtension}`;
    const filePath = `${requestData.userId}/${uniqueFilename}`;

    console.log("📁 File path:", filePath);

    // Convert base64 to buffer
    const fileBuffer = Buffer.from(
      requestData.fileData.split(",")[1],
      "base64"
    );

    // Upload file to Supabase Storage
    console.log("📤 Uploading file to Supabase Storage...");
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, fileBuffer, {
        contentType: requestData.fileType,
        upsert: false,
      });

    if (uploadError) {
      console.error("❌ Storage upload error:", uploadError);
      throw new Error(`File upload failed: ${uploadError.message}`);
    }

    console.log("✅ File uploaded to storage:", uploadData);

    // Get public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;
    console.log("🔗 Public URL:", publicUrl);

    // Create database record
    const syllabusId = `syl_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const now = new Date().toISOString();

    const syllabusRecord: Omit<SyllabusRecord, "created_at" | "updated_at"> = {
      id: syllabusId,
      user_id: requestData.userId,
      filename: uniqueFilename,
      original_name: requestData.filename,
      file_size: requestData.fileSize,
      file_type: requestData.fileType,
      file_url: publicUrl,
      upload_date: now,
      last_modified: now,
      status: "inactive",
      metadata: {
        pages: requestData.metadata?.pages || undefined,
        word_count: requestData.metadata?.wordCount || undefined,
        extracted_text: requestData.metadata?.extractedText || undefined,
        subject: requestData.metadata?.subject || "general",
      },
    };

    console.log("💾 Saving to database...");
    const { data: dbData, error: dbError } = await supabase
      .from("syllabi")
      .insert([syllabusRecord])
      .select()
      .single();

    if (dbError) {
      console.error("❌ Database error:", dbError);
      // Try to clean up the uploaded file
      await supabase.storage.from(STORAGE_BUCKET).remove([filePath]);
      throw new Error(`Database save failed: ${dbError.message}`);
    }

    console.log("✅ Database record created:", dbData);

    const uploadResponse: UploadResponse = {
      id: syllabusId,
      filename: requestData.filename,
      url: publicUrl,
      message: "Syllabus uploaded successfully!",
      timestamp: now,
      metadata: {
        pages: requestData.metadata?.pages || undefined,
        wordCount: requestData.metadata?.wordCount || undefined,
        extractedText: requestData.metadata?.extractedText || undefined,
        subject: requestData.metadata?.subject || "general",
      },
    };

    console.log(
      `✅ Syllabus uploaded successfully: ${syllabusId} for user: ${requestData.userId}`
    );
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
