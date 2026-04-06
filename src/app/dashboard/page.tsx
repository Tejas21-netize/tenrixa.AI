import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import DashboardClient from "@/components/dashboard/dashboard-client";

export default async function DashboardPage() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetching initial data to prevent layout shift or empty states
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: credits } = await supabase
    .from("tender_credits")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <DashboardClient 
        initialProfile={profile || { plan: 'Free', free_analyses_used: 0, free_analyses_limit: 3 }}
        initialCredits={credits || { remaining_credits: 3 }}
      />
    </div>
  );
}
