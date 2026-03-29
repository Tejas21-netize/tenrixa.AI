import { supabaseAdmin } from "@/lib/supabase/admin";

export type EntitlementDecision =
  | { allowed: true; mode: "pro" }
  | { allowed: true; mode: "free_quota" }
  | { allowed: true; mode: "pay_per_tender" }
  | { allowed: false; reason: "quota_exhausted" };

export async function consumeAnalysisEntitlement(userId: string): Promise<EntitlementDecision> {
  // If you haven't set up the SQL functions, this RPC call will fail at runtime.
  const profileResp = await supabaseAdmin
    .from("user_profiles")
    .select("plan, pro_subscription_ends_at")
    .eq("id", userId)
    .maybeSingle();

  const profile = profileResp.data;
  const plan = profile?.plan ?? "free";

  const proActive =
    plan === "pro" &&
    !!profile?.pro_subscription_ends_at &&
    new Date(profile.pro_subscription_ends_at).getTime() > Date.now();

  if (proActive) return { allowed: true, mode: "pro" };

  // Try consuming free quota first (atomic via RPC).
  const freeResp = await supabaseAdmin.rpc("consume_free_analysis", {
    uid: userId,
  });
  if (freeResp.data === true) return { allowed: true, mode: "free_quota" };

  // Then consume pay-per-tender credit (atomic via RPC).
  const creditResp = await supabaseAdmin.rpc("consume_tender_credit", {
    uid: userId,
  });
  if (creditResp.data === true) {
    return { allowed: true, mode: "pay_per_tender" };
  }

  return { allowed: false, reason: "quota_exhausted" };
}

