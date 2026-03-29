"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { LogoutButton } from "@/components/auth/logout-button";
import { LogoHomeLink } from "@/components/brand/logo";

type ProfileRow = {
  role?: string | null;
  plan?: string | null;
  free_analyses_used?: number | null;
  free_analyses_limit?: number | null;
  pro_subscription_ends_at?: string | null;
} | null;

type RazorpayPaymentHandlerResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayCheckoutOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: {
    email?: string;
  };
  handler: (response: RazorpayPaymentHandlerResponse) => void;
  modal?: {
    ondismiss: () => void;
  };
  [key: string]: unknown;
};

type TransactionRow = {
  type?: string | null;
  status?: string | null;
  amount_inr?: number | null;
  credits_awarded?: number | null;
  razorpay_order_id?: string | null;
  razorpay_payment_id?: string | null;
  created_at?: string | null;
};

export function BillingClient({
  initialProfile,
  initialCredits,
  initialTransactions,
  userId,
}: {
  initialProfile: ProfileRow;
  initialCredits: { remaining_credits?: number | null } | null;
  initialTransactions: TransactionRow[];
  userId: string;
}) {
  const router = useRouter();
  const [updating, setUpdating] = useState(false);

  const profile = initialProfile ?? {};
  const plan = profile.plan ?? "free";

  const freeUsed = profile.free_analyses_used ?? 0;
  const freeLimit = profile.free_analyses_limit ?? 3;
  const credits = initialCredits?.remaining_credits ?? 0;

  const proActive = useMemo(() => {
    const endsAt = profile.pro_subscription_ends_at;
    if (!endsAt) return false;
    return new Date(endsAt).getTime() > Date.now();
  }, [profile.pro_subscription_ends_at]);

  const openCheckout = async ({
    createOrderEndpoint,
    verifyEndpoint,
    creditLabel,
  }: {
    createOrderEndpoint: "/api/payments/create-pro-order" | "/api/payments/create-tender-order";
    verifyEndpoint: "/api/payments/verify-pro" | "/api/payments/verify-tender";
    creditLabel: string;
  }) => {
    setUpdating(true);
    try {
      const res = await fetch(createOrderEndpoint, { method: "POST" });
      if (!res.ok) throw new Error("Unable to start checkout");
      const order = (await res.json()) as {
        keyId: string;
        orderId: string;
        amountPaise: number;
        currency: string;
      };

      const scriptId = "razorpay-sdk";
      if (!document.getElementById(scriptId)) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement("script");
          s.id = scriptId;
          s.src = "https://checkout.razorpay.com/v1/checkout.js";
          s.onload = () => resolve();
          s.onerror = () => reject(new Error("Failed to load Razorpay SDK"));
          document.body.appendChild(s);
        });
      }

      const RazorpayCtor = (window as unknown as {
        Razorpay?: new (options: RazorpayCheckoutOptions) => { open: () => void };
      }).Razorpay;
      if (!RazorpayCtor) throw new Error("Razorpay SDK unavailable");

      const options = {
        key: order.keyId,
        amount: order.amountPaise,
        currency: order.currency,
        name: "Tenrixa",
        description: creditLabel,
        order_id: order.orderId,
        prefill: {
          // Razorpay can prefill from your auth; keeping generic here.
          email: "",
        },
        handler: async function (response: RazorpayPaymentHandlerResponse) {
          try {
            const verifyRes = await fetch(verifyEndpoint, {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                userId,
              }),
            });
            if (!verifyRes.ok) throw new Error("Payment verification failed");
            toast.success("Payment successful");
            router.refresh();
          } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : "Payment verification failed");
          } finally {
            setUpdating(false);
          }
        },
        modal: {
          ondismiss: () => {
            setUpdating(false);
            toast.error("Payment cancelled");
          },
        },
      };

      const checkout = new RazorpayCtor(options);
      checkout.open();
    } catch (e: unknown) {
      setUpdating(false);
      toast.error(e instanceof Error ? e.message : "Unable to start checkout");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          <LogoHomeLink heightPx={40} />
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Profile & Billing
            </h1>
            <p className="text-muted-foreground">
              Manage your subscription and pay-per-tender credits.
            </p>
          </div>
        </div>
        <LogoutButton />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-border/60 bg-card/50 p-6">
          <div className="text-sm font-semibold">Current Plan</div>
          <div className="mt-3 text-2xl font-semibold">
            {plan === "pro" && proActive ? "Pro" : "Free"}
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            {plan === "pro" && proActive
              ? "Unlimited analyses enabled"
              : `Free quota: ${freeLimit - freeUsed} remaining`}
          </div>
        </div>

        <div className="rounded-3xl border border-border/60 bg-card/50 p-6">
          <div className="text-sm font-semibold">Pay-Per-Tender Credits</div>
          <div className="mt-3 text-2xl font-semibold">{credits}</div>
          <div className="mt-2 text-sm text-muted-foreground">
            Credits let you analyze additional tenders ({credits} available).
          </div>
        </div>

        <div className="rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent p-6">
          <div className="text-sm font-semibold">Actions</div>
          <div className="mt-4 flex flex-col gap-3">
            <button
              disabled={updating}
              onClick={() =>
                openCheckout({
                  createOrderEndpoint: "/api/payments/create-pro-order",
                  verifyEndpoint: "/api/payments/verify-pro",
                  creditLabel: "Tenrixa Pro (₹4,999 / month)",
                })
              }
              className="rounded-full bg-gradient-to-br from-blue-600 to-purple-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:opacity-60"
            >
              {updating ? "Redirecting..." : "Upgrade to Pro"}
            </button>

            <button
              disabled={updating}
              onClick={() =>
                openCheckout({
                  createOrderEndpoint: "/api/payments/create-tender-order",
                  verifyEndpoint: "/api/payments/verify-tender",
                  creditLabel: "Pay Per Tender (₹999)",
                })
              }
              className="rounded-full border border-border/60 bg-background px-5 py-2.5 text-sm font-semibold hover:bg-secondary/60 disabled:opacity-60"
            >
              {updating ? "Processing..." : "Buy 1 credit (₹999)"}
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-border/60 bg-card/50 p-6">
        <div className="text-sm font-semibold">Usage Limits</div>
        <div className="mt-2 text-sm text-muted-foreground">
          Free plan is limited to {freeLimit} analyses. Pro plan is unlimited. When free quota is
          exhausted, credits can be used for additional analyses.
        </div>
      </div>

      <div className="rounded-3xl border border-border/60 bg-card/50 p-6">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">Transaction History</div>
          <div className="text-xs text-muted-foreground">
            Showing latest {initialTransactions.length} items
          </div>
        </div>

        <div className="mt-4 grid gap-3">
          {initialTransactions.length ? (
            initialTransactions.map((t, idx) => (
              <div
                key={`${t.razorpay_order_id ?? "tx"}-${idx}`}
                className="rounded-2xl border border-border/60 bg-background/30 p-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="text-sm font-semibold">{t.type ?? "-"}</div>
                  <div className="text-xs font-semibold text-muted-foreground">
                    {t.status ?? "-"}
                  </div>
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Amount: ₹{t.amount_inr ?? 0}{" "}
                  {typeof t.credits_awarded === "number" && t.credits_awarded > 0
                    ? `· Credits: ${t.credits_awarded}`
                    : null}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {t.created_at ? new Date(t.created_at).toLocaleString() : ""}
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground">
              No transactions yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

