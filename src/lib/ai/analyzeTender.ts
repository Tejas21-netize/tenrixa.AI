import OpenAI from "openai";
import { TenderRiskSchema, type TenderRiskAnalysis } from "./tender-risk-schema";

function extractJsonObject(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  return text.slice(start, end + 1);
}

export async function analyzeTenderRisk({
  extractedText,
  filename,
}: {
  extractedText: string;
  filename: string;
}): Promise<TenderRiskAnalysis> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY");

  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  const client = new OpenAI({ apiKey });

  // Limit input to reduce cost/time; prompt remains structured.
  const truncated = extractedText.slice(0, 120_000);

  const instructions = `You are Tenrixa, an expert tender risk analyst.
Analyze the provided tender document text and produce STRICT JSON only.

Return risk levels as one of: Low, Medium, High.
Rules:
- Use evidence from the text when possible; if a point is not found, be conservative but do not invent.
- Financial risk: price escalation, payment terms, liquidated damages, guarantees, penalties, taxes and cost recovery.
- Legal risk: liability allocation, indemnities, termination rights, dispute resolution/arbitration, compliance obligations, force majeure.
- Timeline risk: start/mobilization timeline, milestones, completion deadlines, extensions, delay penalties, interim acceptance.
- Contractor eligibility risk: registration/licensing requirements, past experience thresholds, mandatory documents, exclusion/disqualification clauses.

Ensure:
- overall.score is an integer 0-100 (higher => more risk).
- Recommendations are actionable steps to reduce or mitigate the identified risks.
- Output must match the JSON schema exactly.`;

  const response = await client.responses.create({
    model,
    instructions,
    input: `Filename: ${filename}\n\nTender text:\n${truncated}`,
  });

  const outputText = response.output_text ?? "";
  const jsonText = extractJsonObject(outputText);
  if (!jsonText) throw new Error("AI returned no parsable JSON");

  const parsed = JSON.parse(jsonText);
  return TenderRiskSchema.parse(parsed);
}

