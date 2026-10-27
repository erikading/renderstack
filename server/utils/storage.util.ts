import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

let client: S3Client | undefined;

/**
 * Returns the S3 client pointed at the Cloudflare R2 bucket, creating it on first use
 * so the server can still start (and tests can run) without R2 credentials.
 */
const getClient = (): S3Client => {
  if (!client) {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    if (!accountId || !accessKeyId || !secretAccessKey) {
      throw new Error('R2 storage is not configured');
    }

    client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });
  }
  return client;
};

/**
 * Uploads a file to the R2 bucket.
 *
 * @param {string} key - The object key, e.g. `userData/<user>/<filename>`.
 * @param {Buffer} body - The file contents.
 * @param {string} contentType - The MIME type served back to browsers.
 */
export const uploadObject = async (key: string, body: Buffer, contentType: string) => {
  await getClient().send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
};

/**
 * Deletes a file from the R2 bucket. Deleting a key that doesn't exist is not an error.
 *
 * @param {string} key - The object key to delete.
 */
export const deleteObject = async (key: string) => {
  await getClient().send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: key }));
};

/**
 * Builds the public URL the browser uses to load an object.
 *
 * @param {string} key - The object key.
 * @returns {string} - `R2_PUBLIC_URL` joined with the key.
 */
export const getPublicUrl = (key: string): string =>
  `${(process.env.R2_PUBLIC_URL || '').replace(/\/$/, '')}/${key}`;
