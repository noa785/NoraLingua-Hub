/*
  Supabase Browser Client
  Used in client components for authentication and any browser
  side Supabase calls. Reads only public env vars (anon key).
*/

import { createBrowserClient } from "@supabase/ssr";


export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
