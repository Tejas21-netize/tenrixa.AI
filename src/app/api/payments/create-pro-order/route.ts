import Razorpay from "razorpay";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    return NextResponse.json({ message: "Razorpay not configured" }, { status: 500 });
  }

  const razorpay = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });

  const amountPaise = 499900;
  const currency = "INR";

  const order = await razorpay.orders.create({
    amount: amountPaise,
    currency,
    receipt: `tenrixa-pro-${user.id}-${Date.now()}`,
    notes: {
      user_id: user.id,
      plan: "pro",
      type: "subscription_monthly",
    },
    payment_capture: true,
  });

  await supabaseAdmin.from("payment_transactions").insert({
    user_id: user.id,
    razorpay_order_id: order.id,
    type: "subscription",
    status: "created",
    amount_inr: 4999,
    credits_awarded: 0,
    raw: order,
  });

  return NextResponse.json({
    keyId,
    orderId: order.id,
    amountPaise,
    currency,
  });
}

