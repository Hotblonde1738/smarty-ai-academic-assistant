import { createClient } from "@supabase/supabase-js";

// Get environment variables
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Database table types
export interface SyllabusRecord {
  id: string;
  user_id: string;
  filename: string;
  original_name: string;
  file_size: number;
  file_type: string;
  file_url: string;
  upload_date: string;
  last_modified: string;
  status: "active" | "inactive";
  metadata: {
    pages?: number;
    word_count?: number;
    extracted_text?: string;
    subject?: string;
  };
  created_at: string;
  updated_at: string;
}

// Storage bucket configuration
export const STORAGE_BUCKET = "syllabi";
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

console.log("✅ Supabase client initialized");
