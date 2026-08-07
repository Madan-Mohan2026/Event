import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Event } from '../models/event.model';
import { Registration } from '../models/registration.model';

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads/banners');

/**
 * Ensures the uploads/banners directory exists on disk.
 */
export function ensureUploadsDirectory(): string {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    console.log(`[bannerStorage]: Created uploads directory at ${UPLOADS_DIR}`);
  }
  return UPLOADS_DIR;
}

/**
 * Saves a Base64 data URL image string to a physical disk file under /uploads/banners/.
 * Returns the public relative URL path (e.g. "/uploads/banners/banner_1723048920_a7f9.png").
 */
export function saveBase64ImageToDisk(base64DataUrl: string, prefix = 'banner'): string {
  if (!base64DataUrl || typeof base64DataUrl !== 'string') return '';
  if (!base64DataUrl.startsWith('data:image/')) {
    return base64DataUrl; // Already a URL or file path
  }

  try {
    ensureUploadsDirectory();

    // Extract image format extension (png, jpeg, jpg, webp, gif)
    const match = base64DataUrl.match(/^data:image\/([a-zA-Z0-9]+);base64,/);
    let ext = match ? match[1].toLowerCase() : 'png';
    if (ext === 'jpeg') ext = 'jpg';

    const base64Content = base64DataUrl.replace(/^data:image\/[a-zA-Z0-9]+;base64,/, '');
    const buffer = Buffer.from(base64Content, 'base64');

    const randomHash = crypto.randomBytes(4).toString('hex');
    const filename = `${prefix}_${Date.now()}_${randomHash}.${ext}`;
    const filePath = path.join(UPLOADS_DIR, filename);

    fs.writeFileSync(filePath, buffer);
    const publicUrl = `/uploads/banners/${filename}`;
    console.log(`[bannerStorage]: Saved physical image file (${(buffer.length / 1024).toFixed(1)} KB) -> ${publicUrl}`);

    return publicUrl;
  } catch (err: any) {
    console.error('[bannerStorage]: Failed to save Base64 image to disk:', err.message);
    return base64DataUrl;
  }
}

const AGENDAS_DIR = path.resolve(process.cwd(), 'uploads/agendas');

/**
 * Ensures the uploads/agendas directory exists on disk.
 */
export function ensureAgendasDirectory(): string {
  if (!fs.existsSync(AGENDAS_DIR)) {
    fs.mkdirSync(AGENDAS_DIR, { recursive: true });
    console.log(`[bannerStorage]: Created agendas directory at ${AGENDAS_DIR}`);
  }
  return AGENDAS_DIR;
}

/**
 * Saves a Base64 data URL PDF string to a physical disk file under /uploads/agendas/.
 * Returns the public relative URL path (e.g. "/uploads/agendas/agenda_1723048920_a7f9.pdf").
 */
export function saveBase64PdfToDisk(base64DataUrl: string, prefix = 'agenda'): string {
  if (!base64DataUrl || typeof base64DataUrl !== 'string') return '';
  if (!base64DataUrl.startsWith('data:')) {
    return base64DataUrl; // Already a URL or file path
  }

  try {
    ensureAgendasDirectory();

    const base64Content = base64DataUrl.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(base64Content, 'base64');

    const randomHash = crypto.randomBytes(4).toString('hex');
    const filename = `${prefix}_${Date.now()}_${randomHash}.pdf`;
    const filePath = path.join(AGENDAS_DIR, filename);

    fs.writeFileSync(filePath, buffer);
    const publicUrl = `/uploads/agendas/${filename}`;
    console.log(`[bannerStorage]: Saved physical PDF file (${(buffer.length / 1024).toFixed(1)} KB) -> ${publicUrl}`);

    return publicUrl;
  } catch (err: any) {
    console.error('[bannerStorage]: Failed to save Base64 PDF to disk:', err.message);
    return base64DataUrl;
  }
}

/**
 * Auto-Migration Function:
 * Scans MongoDB for any existing documents storing raw Base64 data URLs in bannerImage or QR fields,
 * writes them to physical files on disk, and updates MongoDB records with file path URLs.
 * Runs automatically on backend startup.
 */
export async function migrateBase64BannersToFiles(): Promise<void> {
  try {
    ensureUploadsDirectory();

    // 1. Find all Event documents where bannerImage starts with data:image/
    const base64Events = await Event.find({ bannerImage: { $regex: /^data:image\//i } });
    if (base64Events.length > 0) {
      console.log(`[bannerStorage]: Found ${base64Events.length} events with Base64 banner images. Starting disk migration...`);
      let count = 0;

      for (const ev of base64Events) {
        if (ev.bannerImage && ev.bannerImage.startsWith('data:image/')) {
          const filePathUrl = saveBase64ImageToDisk(ev.bannerImage, `event_${ev._id}`);
          await Event.updateOne({ _id: ev._id }, { $set: { bannerImage: filePathUrl } });
          count++;
        }
      }
      console.log(`[bannerStorage]: ✅ Successfully migrated ${count} event Base64 banners to physical disk files!`);
    }

    // 2. Clear out legacy raw Base64 QR strings stored inside Event documents if present
    const eventsWithBase64Qrs = await Event.find({
      $or: [
        { checkinQrCodeDataUrl: { $regex: /^data:image\//i } },
        { kitQrCodeDataUrl: { $regex: /^data:image\//i } },
        { foodQrCodeDataUrl: { $regex: /^data:image\//i } }
      ]
    });

    if (eventsWithBase64Qrs.length > 0) {
      console.log(`[bannerStorage]: Cleaning up ${eventsWithBase64Qrs.length} legacy Base64 QR strings in Event collection...`);
      await Event.updateMany(
        {
          $or: [
            { checkinQrCodeDataUrl: { $regex: /^data:image\//i } },
            { kitQrCodeDataUrl: { $regex: /^data:image\//i } },
            { foodQrCodeDataUrl: { $regex: /^data:image\//i } }
          ]
        },
        {
          $unset: {
            checkinQrCodeDataUrl: '',
            kitQrCodeDataUrl: '',
            foodQrCodeDataUrl: ''
          }
        }
      );
      console.log(`[bannerStorage]: ✅ Cleaned up legacy Base64 QR strings from Event collection.`);
    }

    // 3. Clear out legacy raw Base64 QR strings stored inside Registration documents if present
    const regWithBase64Qrs = await Registration.find({
      $or: [
        { kitQrCodeDataUrl: { $regex: /^data:image\//i } },
        { foodQrCodeDataUrl: { $regex: /^data:image\//i } }
      ]
    });

    if (regWithBase64Qrs.length > 0) {
      console.log(`[bannerStorage]: Cleaning up ${regWithBase64Qrs.length} legacy Base64 QR strings in Registration collection...`);
      await Registration.updateMany(
        {
          $or: [
            { kitQrCodeDataUrl: { $regex: /^data:image\//i } },
            { foodQrCodeDataUrl: { $regex: /^data:image\//i } }
          ]
        },
        {
          $unset: {
            kitQrCodeDataUrl: '',
            foodQrCodeDataUrl: ''
          }
        }
      );
      console.log(`[bannerStorage]: ✅ Cleaned up legacy Base64 QR strings from Registration collection.`);
    }

  } catch (err: any) {
    console.error('[bannerStorage]: Migration error:', err.message);
  }
}
