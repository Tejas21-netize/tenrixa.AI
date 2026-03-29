import { z } from "zod";

export const RiskLevelSchema = z.enum(["Low", "Medium", "High"]);

export const RiskSectionSchema = z.object({
  level: RiskLevelSchema,
  summary: z.string(),
  keyFactors: z.array(z.string()).max(12),
});

export const TenderRiskSchema = z.object({
  overall: z.object({
    level: RiskLevelSchema,
    score: z.number().int().min(0).max(100),
  }),
  financialRisk: RiskSectionSchema,
  legalRisk: RiskSectionSchema,
  timelineRisk: RiskSectionSchema,
  contractorEligibilityRisk: RiskSectionSchema,
  recommendations: z.array(z.string()).max(20),
});

export type TenderRiskAnalysis = z.infer<typeof TenderRiskSchema>;

