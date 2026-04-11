// Supabase configuration for file storage (resumes, etc.)
// All user data is stored in Neon PostgreSQL, only files are stored in Supabase Storage

// Use dynamic require for server-side to avoid bundling issues
let createClientFn: any = null;

function getCreateClient() {
  if (!createClientFn) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const supabase = require("@supabase/supabase-js");
      createClientFn = supabase.createClient;
    } catch (error) {
      console.warn("Supabase package not available:", error);
      throw new Error("Supabase package is not installed. Run: npm install @supabase/supabase-js");
    }
  }
  return createClientFn;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Bucket name for resume storage
export const RESUME_BUCKET = "resumes";

// Check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && (supabaseAnonKey || supabaseServiceRoleKey));
}

// Create a Supabase client for client-side operations (limited permissions)
export function getSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      "Supabase client not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
    throw new Error("Supabase is not configured");
  }
  const createClient = getCreateClient();
  return createClient(supabaseUrl, supabaseAnonKey);
}

// Create a Supabase admin client for server-side operations (full permissions)
// This uses the service role key and should ONLY be used in server-side code
export function getSupabaseAdmin() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.warn(
      "Supabase admin not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
    throw new Error("Supabase admin is not configured");
  }
  const createClient = getCreateClient();
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Helper to get public URL for a file in storage
export function getPublicUrl(bucket: string, path: string): string {
  if (!supabaseUrl) {
    throw new Error("Supabase URL not configured");
  }
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}

// Helper to upload a file to Supabase storage
export async function uploadFile(
  bucket: string,
  path: string,
  file: Buffer | Blob,
  contentType: string
): Promise<{ url: string; error: string | null }> {
  try {
    const supabase = getSupabaseAdmin();
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        contentType,
        upsert: true,
      });

    if (error) {
      return { url: "", error: error.message };
    }

    const publicUrl = getPublicUrl(bucket, path);
    return { url: publicUrl, error: null };
  } catch (err) {
    return {
      url: "",
      error: err instanceof Error ? err.message : "Failed to upload file",
    };
  }
}

// Helper to delete a file from Supabase storage
export async function deleteFile(
  bucket: string,
  path: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = getSupabaseAdmin();
    
    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete file",
    };
  }
}
