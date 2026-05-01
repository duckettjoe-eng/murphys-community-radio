import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const hasSupabaseConfig =
  supabaseUrl?.startsWith("http://") || supabaseUrl?.startsWith("https://");
const resolvedSupabaseUrl =
  hasSupabaseConfig && supabaseUrl
    ? supabaseUrl
    : "https://example.supabase.co";

export const supabase = createClient(
  resolvedSupabaseUrl,
  supabaseAnonKey || "placeholder-anon-key",
);
