import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-4">
        <section className="relative overflow-hidden py-14 md:py-20">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-blue-600/20 blur-3xl" />
            <div className="absolute -right-20 top-40 h-72 w-72 rounded-full bg-purple-700/20 blur-3xl" />
          </div>

          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-secondary/60 px-3 py-1 text-xs text-secondary-foreground">
                <span className="h-2 w-2 rounded-full bg-gradient-to-br from-blue-600 to-purple-700" />
                AI Tender Risk Analysis Platform
              </div>

              <h1 className="mt-5 text-4xl font-semibold tracking-tight md:text-5xl">
                Smart AI for Safer Bidding.
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
                Upload tender documents and instantly get risk insights across
                financial, legal, timeline, and contractor eligibility.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/login"
                  className="rounded-full bg-gradient-to-br from-blue-600 to-purple-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
                >
                  Analyze a Tender
                </Link>
                <Link
                  href="/pricing"
                  className="rounded-full border border-border/60 bg-background px-6 py-3 text-sm font-semibold hover:bg-secondary/60"
                >
                  View Pricing
                </Link>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {[
                  { label: "Secure Docs", value: "Private Storage" },
                  { label: "Structured Insights", value: "JSON-driven UI" },
                  { label: "Risk Scoring", value: "Low / Medium / High" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-border/60 bg-card/60 p-4"
                  >
                    <div className="text-xs text-muted-foreground">{item.label}</div>
                    <div className="mt-1 text-sm font-semibold">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-border/60 bg-card/60 p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div className="text-sm font-semibold">Preview: Risk Report</div>
                <div className="rounded-full bg-secondary/70 px-3 py-1 text-xs text-secondary-foreground">
                  Typical output
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {[
                  { k: "Financial", level: "High" },
                  { k: "Legal", level: "Medium" },
                  { k: "Timeline", level: "Medium" },
                  { k: "Eligibility", level: "Low" },
                ].map((x) => (
                  <div key={x.k} className="rounded-2xl bg-background/50 p-4">
                    <div className="text-xs text-muted-foreground">{x.k} Risk</div>
                    <div className="mt-1 text-lg font-semibold">
                      <span
                        className={
                          x.level === "High"
                            ? "text-red-600"
                            : x.level === "Medium"
                              ? "text-amber-500"
                              : "text-emerald-600"
                        }
                      >
                        {x.level}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Actionable insights and recommendations.
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-2xl border border-border/60 bg-background/40 p-4">
                <div className="text-xs text-muted-foreground">Downloadable report</div>
                <div className="mt-1 text-sm font-semibold">
                  Summarized PDF with risk breakdown
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-8 md:py-12">
          <h2 className="text-2xl font-semibold">Why Tenrixa?</h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Faster bid decisions with a structured, consistent risk framework.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              {
                title: "Document-first analysis",
                desc: "PDF and DOCX tenders are parsed and assessed for risk drivers.",
              },
              {
                title: "Plan-aware usage",
                desc: "Free and Pro plans with quota enforcement and pay-per-tender credits.",
              },
              {
                title: "Enterprise-grade security",
                desc: "Private storage, strict RLS, and user-scoped access to documents.",
              },
            ].map((card) => (
              <div key={card.title} className="rounded-3xl border border-border/60 bg-card/50 p-6">
                <div className="text-sm font-semibold">{card.title}</div>
                <div className="mt-2 text-sm text-muted-foreground">{card.desc}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="py-10 md:py-14">
          <div className="rounded-3xl border border-border/60 bg-gradient-to-br from-blue-600/10 via-purple-700/10 to-transparent p-6 md:p-8">
            <div className="grid gap-4 md:grid-cols-2 md:items-center">
              <div>
                <h3 className="text-2xl font-semibold">Ready to bid smarter?</h3>
                <p className="mt-2 text-muted-foreground">
                  Try Tenrixa with a limited free quota, then upgrade for unlimited analyses.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Link
                  href="/pricing"
                  className="rounded-full border border-border/60 bg-background px-6 py-3 text-sm font-semibold hover:bg-secondary/60"
                >
                  See Plans
                </Link>
                <Link
                  href="/signup"
                  className="rounded-full bg-gradient-to-br from-blue-600 to-purple-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
                >
                  Start Free
                </Link>
              </div>
            </div>
          </div>
        </section>

        <footer className="py-10 text-sm text-muted-foreground">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>© {new Date().getFullYear()} Tenrixa. All rights reserved.</div>
            <div className="flex items-center gap-4">
              <Link className="hover:text-foreground" href="/pricing">
                Pricing
              </Link>
              <Link className="hover:text-foreground" href="/login">
                Login
              </Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
