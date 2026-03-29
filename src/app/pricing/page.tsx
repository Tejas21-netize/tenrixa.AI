import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">Pricing</h1>
          <p className="text-muted-foreground">
            Choose a subscription plan or pay per tender analysis.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-border/60 bg-card/50 p-6">
            <div className="text-sm font-semibold">Free</div>
            <div className="mt-3 text-3xl font-semibold">₹0</div>
            <div className="mt-2 text-sm text-muted-foreground">
              Includes limited analyses for new users.
            </div>

            <div className="mt-5 grid gap-2 text-sm">
              <div>• Up to 3 analyses (quota)</div>
              <div>• PDF/DOCX parsing</div>
              <div>• Risk insights + report</div>
            </div>

            <Link
              href="/signup"
              className="mt-7 block rounded-full bg-background px-5 py-2.5 text-center text-sm font-semibold hover:bg-secondary/60"
            >
              Start Free
            </Link>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-primary/40 bg-gradient-to-b from-primary/10 to-transparent p-6">
            <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br from-blue-600 to-purple-700/30 blur-xl" />
            <div className="text-sm font-semibold">Pro</div>
            <div className="mt-3 text-3xl font-semibold">₹4,999</div>
            <div className="mt-2 text-sm text-muted-foreground">per month</div>

            <div className="mt-5 grid gap-2 text-sm">
              <div>• Unlimited analyses</div>
              <div>• Priority risk insights</div>
              <div>• Unlimited downloads</div>
            </div>

            <Link
              href="/billing"
              className="mt-7 block rounded-full bg-gradient-to-br from-blue-600 to-purple-700 px-5 py-2.5 text-center text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
            >
              Upgrade to Pro
            </Link>
          </div>

          <div className="rounded-3xl border border-border/60 bg-card/50 p-6">
            <div className="text-sm font-semibold">Pay Per Tender</div>
            <div className="mt-3 text-3xl font-semibold">₹999</div>
            <div className="mt-2 text-sm text-muted-foreground">per analysis</div>

            <div className="mt-5 grid gap-2 text-sm">
              <div>• Buy 1 credit = 1 analysis</div>
              <div>• Works with Free quota</div>
              <div>• Razorpay checkout</div>
            </div>

            <Link
              href="/billing"
              className="mt-7 block rounded-full bg-background px-5 py-2.5 text-center text-sm font-semibold hover:bg-secondary/60"
            >
              Buy Credits
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
