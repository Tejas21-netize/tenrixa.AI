import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { BillingClient } from "@/components/billing/billing-client";

export default async function BillingPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // These tables are created in your Supabase SQL setup (see README).
  const profileResp = await supabase
    .from("user_profiles")
    .select("role, plan, free_analyses_used, free_analyses_limit, pro_subscription_ends_at")
    .eq("id", user.id)
    .maybeSingle();

  const creditsResp = await supabase
    .from("tender_credits")
    .select("remaining_credits")
    .eq("user_id", user.id)
    .maybeSingle();

  const txResp = await supabase
    .from("payment_transactions")
    .select(
      "type,status,amount_inr,credits_awarded,razorpay_order_id,razorpay_payment_id,created_at"
    )
    .order("created_at", { ascending: false })
    .limit(20);

  const profile = profileResp.data ?? null;
  const credits = creditsResp.data ?? null;
  const transactions = txResp.data ?? [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <BillingClient
        initialProfile={profile}
        initialCredits={credits}
        initialTransactions={transactions}
        userId={user.id}
      />
    </div>
  );
}

