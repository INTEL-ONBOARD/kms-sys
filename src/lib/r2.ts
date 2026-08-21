import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || process.env.CLOUDFLARE_R2_ACCOUNT_ID || "";
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || "";
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || "";
export const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || process.env.CLOUDFLARE_R2_BUCKET_NAME || "kms-materials";
export const R2_PUBLIC_DOMAIN = (process.env.R2_PUBLIC_DOMAIN || process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN || "").replace(/\/$/, "");

/**
 * Singleton Cloudflare R2 S3 Client
 * Cloudflare R2 uses the S3-compatible API with an endpoint format of:
 * https://<accountid>.r2.cloudflarestorage.com
 */
export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

/**
 * Generate a short-lived pre-signed PUT URL for direct browser-to-R2 upload
 * @param key - The unique object storage key
 * @param contentType - Expected MIME type (e.g. application/pdf)
 * @param expiresIn - URL expiration time in seconds (default: 900 = 15 mins)
 */
export async function generatePresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 900
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  return await getSignedUrl(r2Client, command, { expiresIn });
}

/**
 * Uploads a binary buffer directly to Cloudflare R2 from server
 */
export async function uploadBufferToR2(
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<void> {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await r2Client.send(command);
}

/**
 * Generate a pre-signed GET URL for secure, temporary file downloads and in-browser viewing
 * (Used when the R2 bucket is private and not exposed via public domain)
 */
export async function generatePresignedDownloadUrl(
  key: string,
  options?: {
    expiresIn?: number;
    contentDisposition?: string;
    contentType?: string;
  }
): Promise<string> {
  const expiresIn = options?.expiresIn ?? 3600;
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    ...(options?.contentDisposition ? { ResponseContentDisposition: options.contentDisposition } : {}),
    ...(options?.contentType ? { ResponseContentType: options.contentType } : {}),
  });

  return await getSignedUrl(r2Client, command, { expiresIn });
}

/**
 * Delete an object from Cloudflare R2
 */
export async function deleteR2Object(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });

  await r2Client.send(command);
}

/**
 * Formulate public or fallback URL for an uploaded file
 */
export function getFilePublicUrl(key: string): string {
  if (R2_PUBLIC_DOMAIN) {
    return `${R2_PUBLIC_DOMAIN}/${key}`;
  }
  // Fallback direct R2 dev or custom endpoint format
  return `https://${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`;
}
