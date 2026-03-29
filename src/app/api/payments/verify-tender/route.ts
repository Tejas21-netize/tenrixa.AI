import crypto from "crypto";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const razorpay_order_id = body?.razorpay_order_id as string | undefined;
  const razorpay_payment_id = body?.razorpay_payment_id as string | undefined;
  const razorpay_signature = body?.razorpay_signature as string | undefined;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ message: "Missing payment fields" }, { status: 400 });
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    return NextResponse.json({ message: "Razorpay not configured" }, { status: 500 });
  }

  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  const isValid = expected === razorpay_signature;
  if (!isValid) {
    await supabaseAdmin.from("payment_transactions").update({
      status: "failed",
      razorpay_payment_id,
    }).eq("razorpay_order_id", razorpay_order_id);
    return NextResponse.json({ message: "Invalid signature" }, { status: 400 });
  }

  // Mark successful and grant 1 credit.
  await supabaseAdmin.from("payment_transactions").update({
    status: "successful",
    razorpay_payment_id,
    raw: body,
  }).eq("razorpay_order_id", razorpay_order_id);

  // Simple credit increment. For high concurrency, use a SQL RPC.
  const creditsResp = await supabaseAdmin
    .from("tender_credits")
    .select("remaining_credits")
    .eq("user_id", user.id)
    .maybeSingle();

  const remaining = creditsResp.data?.remaining_credits ?? 0;
  await supabaseAdmin.from("tender_credits").upsert(
    {
      user_id: user.id,
      remaining_credits: remaining + 1,
    },
    { onConflict: "user_id" }
  );

  return NextResponse.json({ ok: true });
}

