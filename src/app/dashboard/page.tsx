import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Basic entitlement preview. Full enforcement happens in API routes.
  const profileResp = await supabase
    .from("user_profiles")
    .select("plan, free_analyses_used, free_analyses_limit")
    .eq("id", user.id)
    .maybeSingle();

  const creditsResp = await supabase
    .from("tender_credits")
    .select("remaining_credits")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <DashboardClient
        initialProfile={profileResp.data ?? null}
        initialCredits={creditsResp.data ?? null}
      />
    </div>
  );
}

