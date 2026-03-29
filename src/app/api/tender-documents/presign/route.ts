import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

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
    const originalFilename = body?.originalFilename;
    const contentType = body?.contentType;
    const fileSize = body?.fileSize;

    if (!originalFilename || typeof originalFilename !== "string") {
      return NextResponse.json(
        { message: "originalFilename is required" },
        { status: 400 }
      );
    }

    const bucket = process.env.TENDER_DOCS_BUCKET ?? "tender-docs";
    const documentId = crypto.randomUUID();
    const safeFilename = sanitizeFilename(originalFilename);
    const storagePath = `${user.id}/${documentId}_${safeFilename}`;

    // Create a DB row so we can associate the uploaded object.
    const insertResp = await supabaseAdmin.from("tender_documents").insert({
      id: documentId,
      user_id: user.id,
      storage_path: storagePath,
      original_filename: originalFilename,
      content_type: contentType ?? "application/octet-stream",
      size_bytes: typeof fileSize === "number" ? fileSize : null,
    });

    if (insertResp.error) {
      return NextResponse.json(
        { message: insertResp.error.message },
        { status: 500 }
      );
    }

    // If storage bucket doesn't exist yet, Supabase will fail on upload.
    return NextResponse.json({ bucket, documentId, storagePath });
  } catch (e: unknown) {
    const message =
      e instanceof Error ? e.message : "Failed to prepare document upload";
    return NextResponse.json(
      { message },
      { status: 500 }
    );
  }
}

