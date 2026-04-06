import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import DashboardClient from "@/components/dashboard/dashboard-client";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex justify-end mb-6">
        <Link 
          href="/pricing" 
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          Upgrade to Pro
        </Link>
      </div>
      
      <DashboardClient 
        initialProfile={{ 
          plan: 'Free', 
          free_analyses_used: 0, 
          free_analyses_limit: 3 
        }}
        initialCredits={{ 
          remaining_credits: 3 
        }}
      />
    </div>
  );
}
