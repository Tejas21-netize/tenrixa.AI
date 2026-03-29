import { NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ analysisId: string }> }
) {
  const { analysisId } = await params;
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const analysisResp = await supabase
    .from("tender_analyses")
    .select("id, original_filename, risk_level, overall_score, analysis_json, user_id, created_at")
    .eq("id", analysisId)
    .maybeSingle();

  const analysis = analysisResp.data;
  if (!analysis || analysis.user_id !== user.id) {
    return NextResponse.json({ message: "Analysis not found" }, { status: 404 });
  }

  const json = analysis.analysis_json ?? {};

  const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 42 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(20).font("Helvetica-Bold").text("Tenrixa", { align: "left" });
    doc
      .fontSize(12)
      .text("Smart AI for Safer Bidding", { align: "left" })
      .moveDown();

    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .text(`Risk Report: ${analysis.original_filename ?? "Tender"}`);
    doc
      .fontSize(10)
      .fillColor("#555")
      .text(
        `Generated: ${analysis.created_at ? new Date(analysis.created_at).toLocaleString() : new Date().toLocaleString()}`
      )
      .fillColor("black")
      .moveDown();

    const level = analysis.risk_level ?? "-";
    const score = typeof analysis.overall_score === "number" ? analysis.overall_score : "-";
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text(`Overall Risk: ${level} (Score: ${score})`)
      .moveDown();

    const sections = [
      { title: "Financial Risk", data: json.financialRisk },
      { title: "Legal Risk", data: json.legalRisk },
      { title: "Timeline Risk", data: json.timelineRisk },
      { title: "Contractor Eligibility Risk", data: json.contractorEligibilityRisk },
    ];

    for (const s of sections) {
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text(s.title);
      doc.fontSize(10).fillColor("#333");
      doc.text(`Level: ${s.data?.level ?? "-"}`);
      doc.moveDown(0.2);
      if (s.data?.summary) doc.text(String(s.data.summary));
      const factors: string[] = Array.isArray(s.data?.keyFactors) ? s.data.keyFactors : [];
      if (factors.length) {
        doc.text("Key factors:");
        for (const f of factors.slice(0, 8)) {
          doc.text(`- ${f}`);
        }
      }
      doc.moveDown();
      doc.fillColor("black");
    }

    const recs: string[] = Array.isArray(json.recommendations) ? json.recommendations : [];
    doc.fontSize(12).font("Helvetica-Bold").text("Recommendations").moveDown(0.2);
    if (recs.length) {
      for (const r of recs.slice(0, 12)) {
        doc.text(`- ${r}`);
      }
    } else {
      doc.fontSize(10).fillColor("#555").text("No recommendations were produced.").fillColor("black");
    }

    doc.end();
  });

  const pdfBytes = new Uint8Array(pdfBuffer);
  return new NextResponse(pdfBytes, {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="Tenrixa-Risk-${analysisId}.pdf"`,
    },
  });
}

