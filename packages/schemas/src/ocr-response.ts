import { z } from 'zod';

export const ocrTokenSchema = z.object({
  text: z.string(),
  confidence: z.number(),
  cx: z.number(),
  cy: z.number(),
  width: z.number(),
  height: z.number(),
  lineBreak: z.boolean().optional(),
  type: z.string().optional(),
});
export type OcrToken = z.infer<typeof ocrTokenSchema>;

export const ocrAnalysisSchema = z.array(ocrTokenSchema);
export type OcrAnalysis = z.infer<typeof ocrAnalysisSchema>;
