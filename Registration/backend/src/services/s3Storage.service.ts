import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Event } from '../models/event.model';
import { saveBase64ImageToDisk, saveBase64PdfToDisk } from './bannerStorage.service';

/**
 * Returns an S3Client instance initialized strictly from process.env environment variables.
 * Returns null if AWS credentials are not set in process.env.
 */
function getS3Client(): { client: S3Client; bucketName: string; region: string } | null {
  const accessKeyId = (process.env.AWS_ACCESS_KEY_ID || '').trim();
  const secretAccessKey = (process.env.AWS_SECRET_ACCESS_KEY || '').trim();
  const region = (process.env.AWS_REGION || 'ap-south-1').trim();
  const bucketName = (process.env.AWS_S3_BUCKET_NAME || '').trim();

  if (!accessKeyId || !secretAccessKey || !bucketName) {
    return null;
  }

  try {
    const client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey
      }
    });
    return { client, bucketName, region };
  } catch (err: any) {
    console.error('[s3Storage]: Failed to create S3 Client:', err.message);
    return null;
  }
}

/**
 * Uploads a Base64 image data URL string to AWS S3 bucket.
 * Returns the public HTTPS S3 URL (e.g. "https://bucket-name.s3.ap-south-1.amazonaws.com/banners/banner_...").
 * Falls back to local disk storage if AWS environment variables are not set or upload fails.
 */
export async function saveBase64ImageToS3(base64DataUrl: string, prefix = 'banner'): Promise<string> {
  if (!base64DataUrl || typeof base64DataUrl !== 'string') return '';
  if (!base64DataUrl.startsWith('data:image/')) {
    return base64DataUrl; // Already a URL or file path
  }

  const s3 = getS3Client();
  if (s3) {
    try {
      const match = base64DataUrl.match(/^data:(image\/[a-zA-Z0-9]+);base64,/);
      const contentType = match ? match[1] : 'image/png';
      let ext = contentType.replace('image/', '').toLowerCase();
      if (ext === 'jpeg') ext = 'jpg';

      const base64Content = base64DataUrl.replace(/^data:image\/[a-zA-Z0-9]+;base64,/, '');
      const buffer = Buffer.from(base64Content, 'base64');

      const randomHash = crypto.randomBytes(4).toString('hex');
      const filename = `${prefix}_${Date.now()}_${randomHash}.${ext}`;
      const key = `banners/${filename}`;

      try {
        await s3.client.send(new PutObjectCommand({
          Bucket: s3.bucketName,
          Key: key,
          Body: buffer,
          ContentType: contentType,
          ACL: 'public-read'
        }));
      } catch (aclErr: any) {
        await s3.client.send(new PutObjectCommand({
          Bucket: s3.bucketName,
          Key: key,
          Body: buffer,
          ContentType: contentType
        }));
      }

      const s3Url = `https://${s3.bucketName}.s3.${s3.region}.amazonaws.com/${key}`;
      console.log(`[s3Storage]: ✅ Uploaded banner image (${(buffer.length / 1024).toFixed(1)} KB) to S3 -> ${s3Url}`);
      return s3Url;
    } catch (err: any) {
      console.error('[s3Storage]: AWS S3 banner image upload failed, falling back to local disk:', err.message);
    }
  }

  return saveBase64ImageToDisk(base64DataUrl, prefix);
}

/**
 * Uploads a Base64 PDF data URL string to AWS S3 bucket.
 * Returns the public HTTPS S3 URL (e.g. "https://bucket-name.s3.ap-south-1.amazonaws.com/agendas/agenda_...").
 * Falls back to local disk storage if AWS environment variables are not set or upload fails.
 */
export async function saveBase64PdfToS3(base64DataUrl: string, prefix = 'agenda'): Promise<string> {
  if (!base64DataUrl || typeof base64DataUrl !== 'string') return '';
  if (!base64DataUrl.startsWith('data:')) {
    return base64DataUrl; // Already a URL or file path
  }

  const s3 = getS3Client();
  if (s3) {
    try {
      const match = base64DataUrl.match(/^data:([^;]+);base64,/);
      const contentType = match ? match[1] : 'application/pdf';

      const base64Content = base64DataUrl.replace(/^data:[^;]+;base64,/, '');
      const buffer = Buffer.from(base64Content, 'base64');

      const randomHash = crypto.randomBytes(4).toString('hex');
      const filename = `${prefix}_${Date.now()}_${randomHash}.pdf`;
      const key = `agendas/${filename}`;

      try {
        await s3.client.send(new PutObjectCommand({
          Bucket: s3.bucketName,
          Key: key,
          Body: buffer,
          ContentType: contentType,
          ACL: 'public-read'
        }));
      } catch (aclErr: any) {
        await s3.client.send(new PutObjectCommand({
          Bucket: s3.bucketName,
          Key: key,
          Body: buffer,
          ContentType: contentType
        }));
      }

      const s3Url = `https://${s3.bucketName}.s3.${s3.region}.amazonaws.com/${key}`;
      console.log(`[s3Storage]: ✅ Uploaded agenda PDF (${(buffer.length / 1024).toFixed(1)} KB) to S3 -> ${s3Url}`);
      return s3Url;
    } catch (err: any) {
      console.error('[s3Storage]: AWS S3 agenda PDF upload failed, falling back to local disk:', err.message);
    }
  }

  return saveBase64PdfToDisk(base64DataUrl, prefix);
}

/**
 * Scans local uploads/banners and uploads/agendas directories, uploads any local files to AWS S3,
 * and updates any Event documents in MongoDB that reference local file paths to their S3 URLs.
 */
export async function migrateLocalFilesToS3(): Promise<{ bannersMigrated: number; agendasMigrated: number; eventsUpdated: number }> {
  const s3 = getS3Client();
  if (!s3) {
    console.log('[s3Storage]: Skipping S3 migration because AWS S3 credentials are not set.');
    return { bannersMigrated: 0, agendasMigrated: 0, eventsUpdated: 0 };
  }

  let bannersMigrated = 0;
  let agendasMigrated = 0;
  let eventsUpdated = 0;

  const urlMap = new Map<string, string>(); // Maps local relative path (e.g. "/uploads/banners/...") -> S3 URL

  // 1. Upload banners to S3
  const bannersDir = path.resolve(process.cwd(), 'uploads/banners');
  if (fs.existsSync(bannersDir)) {
    const files = fs.readdirSync(bannersDir);
    for (const filename of files) {
      const filePath = path.join(bannersDir, filename);
      if (fs.lstatSync(filePath).isFile()) {
        try {
          const fileBuffer = fs.readFileSync(filePath);
          const ext = path.extname(filename).toLowerCase().replace('.', '');
          let contentType = 'image/jpeg';
          if (ext === 'png') contentType = 'image/png';
          else if (ext === 'webp') contentType = 'image/webp';
          else if (ext === 'gif') contentType = 'image/gif';

          const key = `banners/${filename}`;
          const command = new PutObjectCommand({
            Bucket: s3.bucketName,
            Key: key,
            Body: fileBuffer,
            ContentType: contentType
          });

          await s3.client.send(command);

          const s3Url = `https://${s3.bucketName}.s3.${s3.region}.amazonaws.com/${key}`;
          const relativeLocalPath = `/uploads/banners/${filename}`;
          urlMap.set(relativeLocalPath, s3Url);
          urlMap.set(filename, s3Url);
          bannersMigrated++;
          console.log(`[s3Storage]: ✅ Migrated local banner "${filename}" (${(fileBuffer.length / 1024).toFixed(1)} KB) -> S3: ${s3Url}`);
        } catch (err: any) {
          console.error(`[s3Storage]: Failed to upload banner "${filename}" to S3:`, err.message);
        }
      }
    }
  }

  // 2. Upload agendas to S3
  const agendasDir = path.resolve(process.cwd(), 'uploads/agendas');
  if (fs.existsSync(agendasDir)) {
    const files = fs.readdirSync(agendasDir);
    for (const filename of files) {
      const filePath = path.join(agendasDir, filename);
      if (fs.lstatSync(filePath).isFile()) {
        try {
          const fileBuffer = fs.readFileSync(filePath);
          const key = `agendas/${filename}`;
          const command = new PutObjectCommand({
            Bucket: s3.bucketName,
            Key: key,
            Body: fileBuffer,
            ContentType: 'application/pdf'
          });

          await s3.client.send(command);

          const s3Url = `https://${s3.bucketName}.s3.${s3.region}.amazonaws.com/${key}`;
          const relativeLocalPath = `/uploads/agendas/${filename}`;
          urlMap.set(relativeLocalPath, s3Url);
          urlMap.set(filename, s3Url);
          agendasMigrated++;
          console.log(`[s3Storage]: ✅ Migrated local agenda "${filename}" (${(fileBuffer.length / 1024).toFixed(1)} KB) -> S3: ${s3Url}`);
        } catch (err: any) {
          console.error(`[s3Storage]: Failed to upload agenda "${filename}" to S3:`, err.message);
        }
      }
    }
  }

  // 3. Update MongoDB Event records with new S3 URLs
  try {
    const allEvents = await Event.find({});
    for (const ev of allEvents) {
      let updated = false;
      if (ev.bannerImage) {
        for (const [localPath, s3Url] of urlMap.entries()) {
          if (ev.bannerImage.includes(localPath)) {
            ev.bannerImage = s3Url;
            updated = true;
            break;
          }
        }
      }
      if (ev.agendaPdf) {
        for (const [localPath, s3Url] of urlMap.entries()) {
          if (ev.agendaPdf.includes(localPath)) {
            ev.agendaPdf = s3Url;
            updated = true;
            break;
          }
        }
      }
      if (updated) {
        await ev.save();
        eventsUpdated++;
      }
    }
  } catch (dbErr: any) {
    console.error('[s3Storage]: Database update during S3 migration failed:', dbErr.message);
  }

  console.log(`[s3Storage]: 🚀 Migration completed! ${bannersMigrated} banners & ${agendasMigrated} agendas uploaded to S3, ${eventsUpdated} events updated in MongoDB.`);
  return { bannersMigrated, agendasMigrated, eventsUpdated };
}
