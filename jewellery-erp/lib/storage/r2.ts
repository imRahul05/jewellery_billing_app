import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl as s3GetSignedUrl } from "@aws-sdk/s3-request-presigner";

const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const bucketName = process.env.CLOUDFLARE_R2_BUCKET || "jewellery-erp-assets";

export function isR2Configured(): boolean {
  return !!(accountId && accessKeyId && secretAccessKey);
}

let s3Client: S3Client | null = null;

if (isR2Configured()) {
  s3Client = new S3Client({
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: accessKeyId!,
      secretAccessKey: secretAccessKey!,
    },
    region: "auto",
  });
}

/**
 * Uploads a buffer to Cloudflare R2 bucket.
 */
export async function uploadFile(key: string, buffer: Buffer, contentType: string): Promise<void> {
  if (!s3Client) {
    throw new Error("R2 storage is not configured. Missing environment variables.");
  }

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await s3Client.send(command);
}

/**
 * Generates a short-lived presigned GET URL for an object in R2.
 */
export async function getSignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
  if (!s3Client) {
    throw new Error("R2 storage is not configured. Missing environment variables.");
  }

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  return await s3GetSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
}
