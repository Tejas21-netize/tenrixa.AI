import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function createSupabaseServerClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://localhost:54321",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "public-anon-key",
    {
      cookies: {
        async getAll() {
          const cookieStore = await cookies();
          return cookieStore.getAll().map((c) => ({
            name: c.name,
            value: c.value,
          }));
        },
        async setAll(cookiesToSet) {
          const cookieStore = await cookies();
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set({ name, value, ...options });
          }
        },
      },
    }
  );
}

