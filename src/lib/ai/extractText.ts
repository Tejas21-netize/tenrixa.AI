import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

export async function extractTextFromTenderFile({
  buffer,
  filename,
  contentType,
}: {
  buffer: Buffer;
  filename: string;
  contentType: string;
}) {
  const lower = filename.toLowerCase();

  if (lower.endsWith(".pdf") || contentType.includes("pdf")) {
    const parser = new PDFParse({ data: buffer });
    const parsed = await parser.getText();
    await parser.destroy();
    return (parsed.text ?? "").trim();
  }

  // Mammoth supports DOCX reliably. .doc (legacy Word) can fail.
  if (
    lower.endsWith(".docx") ||
    contentType.includes(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return (result.value ?? "").trim();
  }

  throw new Error("Unsupported file type. Please upload a PDF or DOCX.");
}

