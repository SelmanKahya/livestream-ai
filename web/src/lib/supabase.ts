import { createClient } from "@supabase/supabase-js";

// Debug logging
console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log(
  "Supabase Anon Key exists:",
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_URL");
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
    },
  }
);
