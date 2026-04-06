import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import DashboardClient from "@/components/dashboard/dashboard-client";

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <DashboardClient 
        initialProfile={{ plan: 'Free', free_analyses_used: 0, free_analyses_limit: 3 }}
        initialCredits={{ remaining_credits: 3 }}
      />
    </div>
  );
}
