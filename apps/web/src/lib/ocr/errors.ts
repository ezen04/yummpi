export type OcrInferResult = 'SUCCESS' | 'FAILURE' | 'ERROR';

export type OcrFailureKind =
  | 'TRANSPORT'
  | 'INFER_FAILURE'
  | 'INFER_ERROR'
  | 'CONFIG'
  | 'MALFORMED_RESPONSE';

export class OcrFailedError extends Error {
  readonly kind: OcrFailureKind;
  readonly cause?: unknown;

  constructor(kind: OcrFailureKind, message: string, cause?: unknown) {
    super(message);
    this.name = 'OcrFailedError';
    this.kind = kind;
    this.cause = cause;
  }
}
