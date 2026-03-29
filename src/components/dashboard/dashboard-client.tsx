"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { TenderRiskAnalysis } from "@/lib/ai/tender-risk-schema";
import { LogoutButton } from "@/components/auth/logout-button";
import { LogoHomeLink } from "@/components/brand/logo";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

type RiskLevel = "Low" | "Medium" | "High";

type AnalysisRow = {
  id: string;
  user_id?: string;
  created_at?: string;
  original_filename?: string;
  overall_score?: number | null;
  risk_level?: RiskLevel | null;
  analysis_json?: TenderRiskAnalysis | null;
};

export function DashboardClient({
  initialProfile,
  initialCredits,
}: {
  initialProfile: {
    plan?: "free" | "pro" | null;
    free_analyses_used?: number | null;
    free_analyses_limit?: number | null;
    pro_subscription_ends_at?: string | null;
  } | null;
  initialCredits: { remaining_credits?: number | null } | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [analyses, setAnalyses] = useState<AnalysisRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState<RiskLevel | "All">("All");

  const plan = initialProfile?.plan ?? "free";
  const freeUsed = initialProfile?.free_analyses_used ?? 0;
  const freeLimit = initialProfile?.free_analyses_limit ?? 3;
  const credits = initialCredits?.remaining_credits ?? 0;

  const proActive = useMemo(() => {
    const endsAt = initialProfile?.pro_subscription_ends_at;
    if (!endsAt) return false;
    return new Date(endsAt).getTime() > Date.now();
  }, [initialProfile?.pro_subscription_ends_at]);

  const selected = useMemo(
    () => analyses.find((a) => a.id === selectedId) ?? null,
    [analyses, selectedId]
  );

  const riskCounts = useMemo(() => {
    const counts: Record<RiskLevel, number> = { Low: 0, Medium: 0, High: 0 };
    for (const a of analyses) {
      const r = a.risk_level;
      if (r === "Low" || r === "Medium" || r === "High") counts[r] += 1;
    }
    return counts;
  }, [analyses]);

  const filteredAnalyses = useMemo(() => {
    const q = search.trim().toLowerCase();
    return analyses
      .filter((a) => {
        if (!q) return true;
        const name = a.original_filename ?? "";
        return name.toLowerCase().includes(q);
      })
      .filter((a) => {
        if (riskFilter === "All") return true;
        return a.risk_level === riskFilter;
      });
  }, [analyses, search, riskFilter]);

  const fetchAnalyses = async () => {
    const { data, error } = await supabase
      .from("tender_analyses")
      .select("id, created_at, original_filename, overall_score, risk_level, analysis_json")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      toast.error(error.message);
      return;
    }
    setAnalyses((data as unknown as AnalysisRow[]) ?? []);
  };

  useEffect(() => {
    fetchAnalyses();
  }, []);

  const uploadAndAnalyze = async (file: File) => {
    setLoading(true);
    try {
      // 1) Create a document row + a storage path (server generates it).
      const presignRes = await fetch("/api/tender-documents/presign", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          originalFilename: file.name,
          contentType: file.type || "application/octet-stream",
          fileSize: file.size,
        }),
      });
      if (!presignRes.ok) {
        const err = await presignRes.json().catch(() => null);
        throw new Error(err?.message ?? "Unable to prepare upload");
      }
      const presign = (await presignRes.json()) as {
        bucket: string;
        documentId: string;
        storagePath: string;
      };

      // 2) Upload to Supabase private storage.
      const bucket = presign.bucket;
      const storagePath = presign.storagePath;
      const uploadRes = await supabase.storage
        .from(bucket)
        .upload(storagePath, file, { contentType: file.type, upsert: false });

      if (uploadRes.error) throw uploadRes.error;

      // 3) Trigger AI analysis.
      toast.loading("Analyzing tender with AI...", { id: "analysis" });
      const analyzeRes = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ documentId: presign.documentId }),
      });

      if (!analyzeRes.ok) {
        const err = await analyzeRes.json().catch(() => null);
        throw new Error(err?.message ?? "AI analysis failed");
      }

      const analysis = (await analyzeRes.json()) as { id: string };
      toast.success("Analysis complete", { id: "analysis" });
      setSelectedId(analysis.id);
      await fetchAnalyses();

      // Refresh billing data (credits/free quota) in the background.
      router.refresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Upload/analyze failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          <LogoHomeLink heightPx={40} />
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Dashboard</h1>
            <p className="mt-1 text-muted-foreground">
              Upload a tender and get structured risk insights.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="inline-flex cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-purple-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:opacity-60">
            {loading ? "Working..." : "Upload New Tender"}
            <input
              className="hidden"
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
              disabled={loading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadAndAnalyze(f);
                e.currentTarget.value = "";
              }}
            />
          </label>
          <LogoutButton />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-3xl border border-border/60 bg-card/50 p-6 lg:col-span-1">
          <div className="text-sm font-semibold">Latest Summary</div>
          <div className="mt-2 text-xs text-muted-foreground">
            Plan:{" "}
            <span className="font-semibold">
              {plan === "pro" && proActive ? "Pro" : "Free"}
            </span>
            {" · "}
            Credits: <span className="font-semibold">{credits}</span>
            {" · "}
            Free remaining: <span className="font-semibold">{Math.max(0, freeLimit - freeUsed)}</span>
          </div>
          {selected ? (
            <div className="mt-4 grid gap-4">
              <div>
                <div className="text-xs text-muted-foreground">Overall Risk</div>
                <div className="mt-1 text-2xl font-semibold">
                  <span
                    className={
                      selected.risk_level === "High"
                        ? "text-red-600"
                        : selected.risk_level === "Medium"
                          ? "text-amber-500"
                          : "text-emerald-600"
                    }
                  >
                    {selected.risk_level}
                  </span>
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Score: {selected.overall_score ?? "-"}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    k: "Financial",
                    v: selected.analysis_json?.financialRisk?.level,
                  },
                  { k: "Legal", v: selected.analysis_json?.legalRisk?.level },
                  {
                    k: "Timeline",
                    v: selected.analysis_json?.timelineRisk?.level,
                  },
                  {
                    k: "Eligibility",
                    v: selected.analysis_json?.contractorEligibilityRisk?.level,
                  },
                ].map((x) => (
                  <div key={x.k} className="rounded-2xl bg-background/50 p-3">
                    <div className="text-xs text-muted-foreground">{x.k}</div>
                    <div className="mt-1 text-sm font-semibold">{x.v ?? "-"}</div>
                  </div>
                ))}
              </div>

              <div>
                <a
                  href={selected ? `/api/ai/analyses/${selected.id}/pdf` : "#"}
                  className="inline-flex w-full items-center justify-center rounded-full border border-border/60 bg-background px-4 py-2.5 text-sm font-semibold hover:bg-secondary/60"
                >
                  Download PDF Report
                </a>
              </div>
            </div>
          ) : (
            <div className="mt-4 text-sm text-muted-foreground">
              Upload a tender to generate your first report.
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-border/60 bg-card/50 p-6 lg:col-span-2">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-sm font-semibold">Risk Distribution</div>
              <div className="mt-1 text-sm text-muted-foreground">
                Counts by overall risk level.
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tenders..."
                className="w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/60 sm:w-56"
              />
              <select
                value={riskFilter}
                onChange={(e) =>
                  setRiskFilter(e.target.value as RiskLevel | "All")
                }
                className="w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/60 sm:w-44"
              >
                <option value="All">All risks</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          <div className="mt-6 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { risk: "Low", count: riskCounts.Low },
                { risk: "Medium", count: riskCounts.Medium },
                { risk: "High", count: riskCounts.High },
              ]}>
                <XAxis dataKey="risk" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#7c3aed" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-3xl border border-border/60 bg-card/50 p-6 lg:col-span-1">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">History</div>
            <div className="text-xs text-muted-foreground">{filteredAnalyses.length} results</div>
          </div>

          <div className="mt-4 grid gap-3">
            {filteredAnalyses.length ? (
              filteredAnalyses.map((a) => (
                <button
                  key={a.id}
                  className={`text-left rounded-2xl border px-4 py-3 transition ${
                    a.id === selectedId
                      ? "border-primary/60 bg-primary/10"
                      : "border-border/60 bg-background/30 hover:bg-secondary/60"
                  }`}
                  onClick={() => setSelectedId(a.id)}
                >
                  <div className="text-sm font-semibold">
                    {a.original_filename ?? "Untitled"}
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {a.risk_level ? `Risk: ${a.risk_level}` : "Risk: -"}
                    </span>
                    <span>{a.created_at ? new Date(a.created_at).toLocaleDateString() : ""}</span>
                  </div>
                </button>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">
                No analyses found. Upload a tender to get started.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-border/60 bg-card/50 p-6 lg:col-span-2">
          <div className="text-sm font-semibold">Detailed Insights</div>
          {selected ? (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {[
                {
                  title: "Financial Risk",
                  data: selected.analysis_json?.financialRisk,
                },
                { title: "Legal Risk", data: selected.analysis_json?.legalRisk },
                {
                  title: "Timeline Risk",
                  data: selected.analysis_json?.timelineRisk,
                },
                {
                  title: "Contractor Eligibility Risk",
                  data: selected.analysis_json?.contractorEligibilityRisk,
                },
              ].map((section) => (
                <div key={section.title} className="rounded-2xl border border-border/60 bg-background/30 p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">{section.title}</div>
                    <div className="text-xs font-semibold text-muted-foreground">
                      {section.data?.level ?? "-"}
                    </div>
                  </div>
                  {section.data?.summary ? (
                    <div className="mt-2 text-sm text-muted-foreground">{section.data.summary}</div>
                  ) : (
                    <div className="mt-2 text-sm text-muted-foreground">-</div>
                  )}
                  {Array.isArray(section.data?.keyFactors) && section.data.keyFactors.length ? (
                    <ul className="mt-3 list-disc pl-5 text-sm text-muted-foreground">
                      {section.data.keyFactors.slice(0, 5).map((f: string, idx: number) => (
                        <li key={idx}>{f}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ))}

              <div className="md:col-span-2 rounded-2xl border border-border/60 bg-background/30 p-4">
                <div className="text-sm font-semibold">Recommendations</div>
                {Array.isArray(selected.analysis_json?.recommendations) ? (
                  <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground">
                    {selected.analysis_json.recommendations.slice(0, 8).map((r: string, idx: number) => (
                      <li key={idx}>{r}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="mt-2 text-sm text-muted-foreground">-</div>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-4 text-sm text-muted-foreground">
              Select a tender from the history list to view insights.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

