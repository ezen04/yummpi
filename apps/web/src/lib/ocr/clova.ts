import 'server-only';

import axios from 'axios';
import { randomUUID } from 'node:crypto';

import type { OcrToken } from '@yummpi/schemas';

import { OcrFailedError } from './errors';
import { normalizeFields, type ClovaField } from './normalize';

const TIMEOUT_MS = 3000;

type ClovaImageResult = {
  inferResult: string;
  message?: string;
  fields?: ClovaField[];
};

type ClovaResponse = {
  images?: ClovaImageResult[];
};

export type CallClovaResult =
  | { status: 'SUCCESS'; tokens: OcrToken[] }
  | { status: 'FAILURE'; message?: string }
  | { status: 'ERROR'; message?: string };

export async function callClovaGeneralOcr(
  imageBase64: string,
  format: 'jpg' | 'png' | 'jpeg'
): Promise<CallClovaResult> {
  const url = process.env.CLOVA_OCR_INVOKE_URL;
  const secret = process.env.CLOVA_OCR_SECRET;
  if (!url || !secret) {
    throw new OcrFailedError('CONFIG', 'CLOVA OCR env not configured');
  }

  const response = await axios.post<ClovaResponse>(
    url,
    {
      version: 'V2',
      requestId: randomUUID(),
      timestamp: Date.now(),
      images: [{ format, name: 'receipt', data: imageBase64 }],
    },
    {
      headers: { 'X-OCR-SECRET': secret },
      timeout: TIMEOUT_MS,
    }
  );

  const image = response.data.images?.[0];
  if (!image) {
    throw new OcrFailedError(
      'MALFORMED_RESPONSE',
      'CLOVA response missing images[]'
    );
  }

  if (image.inferResult === 'SUCCESS') {
    return { status: 'SUCCESS', tokens: normalizeFields(image.fields ?? []) };
  }
  if (image.inferResult === 'FAILURE') {
    return { status: 'FAILURE', message: image.message };
  }
  if (image.inferResult === 'ERROR') {
    return { status: 'ERROR', message: image.message };
  }
  throw new OcrFailedError(
    'MALFORMED_RESPONSE',
    `unexpected inferResult: ${image.inferResult}`
  );
}
