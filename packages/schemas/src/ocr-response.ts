import { z } from 'zod';

export const ocrTokenSchema = z.object({
  text: z.string(),
  confidence: z.number().finite().min(0).max(1),
  cx: z.number().finite(),
  cy: z.number().finite(),
  width: z.number().finite().nonnegative(),
  height: z.number().finite().nonnegative(),
  lineBreak: z.boolean().optional(),
  type: z.string().optional(),
});
export type OcrToken = z.infer<typeof ocrTokenSchema>;

export const ocrAnalysisSchema = z.array(ocrTokenSchema);
export type OcrAnalysis = z.infer<typeof ocrAnalysisSchema>;
