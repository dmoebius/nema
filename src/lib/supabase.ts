import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  const missing = [!supabaseUrl && "VITE_SUPABASE_URL", !supabaseAnonKey && "VITE_SUPABASE_ANON_KEY"]
    .filter(Boolean)
    .join(", ");
  const msg = `Missing env variable(s): ${missing}\n\nSet them in your .env.local file.`;
  // Show visibly in the browser instead of silently dying with a white page
  document.body.style.cssText = "margin:2rem;font-family:monospace;font-size:1rem;color:#c00";
  document.body.innerHTML = `<pre>⚠️ ${msg}</pre>`;
  throw new Error(msg);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
