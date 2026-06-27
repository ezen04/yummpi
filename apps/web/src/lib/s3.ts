import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';

import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import 'server-only';

const s3 = new S3Client({ region: process.env.AWS_REGION! });

const BUCKET = process.env.AWS_S3_BUCKET!;

export async function getPresignedPutUrl(
  objectKey: string,
  contentType: string,
  expiresIn = 300
): Promise<string> {
  return getSignedUrl(
    s3,
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: objectKey,
      ContentType: contentType,
    }),
    { expiresIn }
  );
}

// CLOVA OCR이 S3 오브젝트를 직접 fetch할 수 있도록 단기 presigned GET URL 발급.
export async function getPresignedGetUrl(
  objectKey: string,
  expiresIn = 120
): Promise<string> {
  return getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: BUCKET, Key: objectKey }),
    { expiresIn }
  );
}
