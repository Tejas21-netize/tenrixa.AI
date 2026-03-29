import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { consumeAnalysisEntitlement } from "@/lib/tenrixa/entitlements";
import { extractTextFromTenderFile } from "@/lib/ai/extractText";
import { analyzeTenderRisk } from "@/lib/ai/analyzeTender";

export async function POST(req: Request) {
  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const documentId = body?.documentId as string | undefined;

    if (!documentId) {
      return NextResponse.json(
        { message: "documentId is required" },
        { status: 400 }
      );
    }

    const bucket = process.env.TENDER_DOCS_BUCKET ?? "tender-docs";

    const docResp = await supabaseAdmin
      .from("tender_documents")
      .select(
        "id,user_id,storage_path,original_filename,content_type"
      )
      .eq("id", documentId)
      .maybeSingle();

    const doc = docResp.data;
    if (!doc || doc.user_id !== user.id) {
      return NextResponse.json({ message: "Document not found" }, { status: 404 });
    }

    // Download the private object and extract text.
    const downloadRes = await supabaseAdmin.storage
      .from(bucket)
      .download(doc.storage_path);

    if (downloadRes.error) {
      return NextResponse.json(
        { message: downloadRes.error.message },
        { status: 500 }
      );
    }

    type ArrayBufferBlob = { arrayBuffer: () => Promise<ArrayBuffer> };
    const blob = downloadRes.data as unknown as ArrayBufferBlob;
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const extractedText = await extractTextFromTenderFile({
      buffer,
      filename: doc.original_filename,
      contentType: doc.content_type ?? "application/octet-stream",
    });

    if (!extractedText || extractedText.length < 50) {
      return NextResponse.json(
        { message: "Couldn't extract meaningful text from the document." },
        { status: 400 }
      );
    }

    // Consume quota/credits only after successful extraction.
    const decision = await consumeAnalysisEntitlement(user.id);
    if (!decision.allowed) {
      return NextResponse.json(
        { message: "Quota exhausted. Upgrade to Pro or buy credits." },
        { status: 402 }
      );
    }

    const analysis = await analyzeTenderRisk({
      extractedText,
      filename: doc.original_filename,
    });

    const insertResp = await supabaseAdmin
      .from("tender_analyses")
      .insert({
        user_id: user.id,
        document_id: documentId,
        original_filename: doc.original_filename,
        risk_level: analysis.overall.level,
        overall_score: analysis.overall.score,
        analysis_json: analysis,
        status: "completed",
      })
      .select("id, created_at, original_filename, overall_score, risk_level, analysis_json")
      .single();

    if (insertResp.error) {
      return NextResponse.json(
        { message: insertResp.error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(insertResp.data);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "AI analysis failed";
    return NextResponse.json(
      { message },
      { status: 500 }
    );
  }
}

