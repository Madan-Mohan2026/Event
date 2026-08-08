import crypto from 'crypto';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import os from 'os';
import jsQR from 'jsqr';
import { PNG } from 'pngjs';

const SECRET_KEY = process.env.JWT_SECRET || 'super_secret_government_key_12345';
let sampleSaved = false;

/**
 * Detect local network IPv4 address (e.g. 192.168.1.43) so mobile phone cameras on Wi-Fi can open QR code URLs.
 */
export function getLocalIpAddress(): string {
  try {
    const interfaces = os.networkInterfaces();
    const candidates: { name: string; address: string }[] = [];

    for (const devName in interfaces) {
      const iface = interfaces[devName];
      if (!iface) continue;
      for (const alias of iface) {
        if (alias.family === 'IPv4' && !alias.internal && alias.address !== '127.0.0.1') {
          candidates.push({ name: devName, address: alias.address });
        }
      }
    }

    // 1. Prioritize active physical Wi-Fi or Ethernet interfaces
    const primary = candidates.find(c => /wi-fi|wifi|wireless|ethernet|en0|wlan0|eth0/i.test(c.name) && !/virtual|vethernet|vbox|vmware|loopback/i.test(c.name));
    if (primary) return primary.address;

    // 2. Secondary physical adapter fallback
    const secondary = candidates.find(c => !/virtual|vethernet|vbox|vmware|loopback/i.test(c.name));
    if (secondary) return secondary.address;

    if (candidates.length > 0) return candidates[0].address;
  } catch (err) { }
  return 'localhost';
}

/**
 * Get accessible host URL for QR code URLs (replaces localhost/127.0.0.1 with computer's LAN IP).
 */
export function getAccessibleHostUrl(req?: any, defaultPort = 5173): string {
  // ── 1. PRODUCTION / RENDER MODE ───────────────────────────────────────────
  // Strictly use FRONTEND_URL or fallback to https://event-admin-losq.onrender.com.
  // Never read req.get('origin'), req.get('referer'), req.get('host'), or getLocalIpAddress() in production/Render.
  if (process.env.NODE_ENV === 'production' || process.env.RENDER || process.env.RENDER_SERVICE_ID) {
    const envUrl = process.env.FRONTEND_URL || process.env.PUBLIC_APP_URL || process.env.VITE_PUBLIC_BASE_URL || process.env.APP_URL;
    if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
      const cleanUrl = envUrl.trim().replace(/\/+$/, '');
      if (!cleanUrl.includes('localhost') && !cleanUrl.includes('127.0.0.1')) {
        return cleanUrl;
      }
    }
    return 'https://event-admin-losq.onrender.com';
  }

  // ── 2. LOCAL / DEVELOPMENT MODE (NODE_ENV !== 'production') ───────────────
  const devEnvUrl = process.env.FRONTEND_URL || process.env.PUBLIC_APP_URL || process.env.VITE_PUBLIC_BASE_URL || process.env.APP_URL;
  if (devEnvUrl && typeof devEnvUrl === 'string' && devEnvUrl.trim()) {
    const cleanDevUrl = devEnvUrl.trim().replace(/\/+$/, '');
    if (!cleanDevUrl.includes('localhost') && !cleanDevUrl.includes('127.0.0.1')) {
      return cleanDevUrl;
    }
  }

  if (req) {
    const originHeader = req.get('origin') || req.get('referer');
    if (originHeader && typeof originHeader === 'string') {
      try {
        const parsed = new URL(originHeader);
        if (parsed.hostname !== 'localhost' && parsed.hostname !== '127.0.0.1' && !parsed.hostname.startsWith('192.168.') && !parsed.hostname.startsWith('10.')) {
          return `${parsed.protocol}//${parsed.host}`;
        }
      } catch (e) {}
    }

    const reqHost = req.get('host') || '';
    if (reqHost && !reqHost.includes('localhost') && !reqHost.includes('127.0.0.1')) {
      const parts = reqHost.split(':');
      if (!parts[0].startsWith('192.168.') && !parts[0].startsWith('10.')) {
        const proto = req.protocol || 'http';
        return `${proto}://${parts[0]}:${parts[1] || defaultPort}`;
      }
    }
  }

  const localIp = getLocalIpAddress();
  if (localIp && localIp !== 'localhost' && localIp !== '127.0.0.1') {
    return `http://${localIp}:${defaultPort}`;
  }

  return `http://localhost:${defaultPort}`;
}

/**
 * Reusable utility to construct and validate public QR Code URLs.
 */
export function buildPublicQrUrl(routePath: string, targetId: string, req?: any): string {
  const hostUrl = getAccessibleHostUrl(req);
  if (!hostUrl || !hostUrl.startsWith('http')) {
    throw new Error(`Invalid Base Host URL for QR Generation: ${hostUrl}`);
  }
  if (!targetId || targetId.includes('<') || targetId.includes('>')) {
    throw new Error(`Invalid Target ID for QR Generation: ${targetId}`);
  }
  const cleanHost = hostUrl.replace(/\/+$/, '');
  const formattedRoute = routePath.startsWith('#') ? routePath : `#${routePath}`;
  return `${cleanHost}/${formattedRoute}/${targetId}`;
}

/**
 * Encrypt a payload object using AES-256-CBC into a secure hex string token.
 */
export function encryptToken(payload: Record<string, any>): string {
  const key = crypto.createHash('sha256').update(SECRET_KEY).digest();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

  const jsonStr = JSON.stringify(payload);

  let encrypted = cipher.update(jsonStr, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // Format: iv_hex + ":" + encrypted_hex
  return `${iv.toString('hex')}:${encrypted}`;
}

/**
 * Decode a Base64 Data URL PNG image using PNG reader and jsQR decoder.
 */
export function decodeQrDataUrl(dataUrl: string): string | null {
  try {
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const png = PNG.sync.read(buffer);
    const code = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
    return code ? code.data : null;
  } catch (err) {
    return null;
  }
}

/**
 * Generate a Base64 Data URL PNG image for a given URL string.
 * High contrast (pure black #000000 on pure white #ffffff), 4-module quiet zone, 400x400 px.
 * Decodes the generated QR image immediately and prints debug logs in exact required format:
 * Encoded URL: ...
 * Decoded QR Content: ...
 * Match: YES/NO
 */
export async function generateQrDataUrl(text: string): Promise<string> {
  if (!text || typeof text !== 'string' || !text.trim()) {
    throw new Error('Cannot generate QR Code: input URL or text is empty, null, or undefined.');
  }

  const cleanText = text.trim();

  // Validate that the URL does not contain literal text <eventId>
  if (cleanText.includes('<eventId>') || cleanText.includes('<EVENT_ID>')) {
    console.error('❌ [QR GENERATION ERROR]: URL contains literal <eventId> placeholder:', cleanText);
    throw new Error(`Invalid QR URL: Contains literal placeholder <eventId>: ${cleanText}`);
  }

  // Requirement Log 1: Print encoded URL
  console.log(`Encoded URL: ${cleanText}`);

  // Generate high-resolution 400x400 QR Code PNG Data URL
  const dataUrl = await QRCode.toDataURL(cleanText, {
    errorCorrectionLevel: 'M',
    margin: 4,   // Standard 4-module white quiet zone for camera scanning
    width: 400,  // High resolution
    color: {
      dark: '#000000', // Pure black
      light: '#ffffff' // Pure white
    }
  });

  // Decode the generated QR image immediately using QR decoder library (jsQR)
  const decodedText = decodeQrDataUrl(dataUrl);

  // Requirement Log 2: Print decoded QR content
  console.log(`Decoded QR Content: ${decodedText || 'FAILED_TO_DECODE'}`);

  const isMatch = (decodedText !== null && decodedText === cleanText);

  // Requirement Log 3: Print Match YES/NO
  console.log(`Match: ${isMatch ? 'YES' : 'NO'}`);

  if (!isMatch) {
    console.error(`❌ [QR DECODE MISMATCH]: Encoded "${cleanText}" but decoded "${decodedText}".`);
  }

  // Save debug sample to disk during development if not saved
  if (!sampleSaved) {
    try {
      const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
      const debugPath = path.join(__dirname, 'debug_sample_qr.png');
      fs.writeFileSync(debugPath, base64Data, 'base64');
      sampleSaved = true;
    } catch (err) { }
  }

  return dataUrl;
}

/**
 * Decrypt an AES-256-CBC token hex string back to a payload object.
 */
export function decryptToken(tokenStr: string): Record<string, any> | null {
  try {
    if (!tokenStr || typeof tokenStr !== 'string' || !tokenStr.includes(':')) return null;
    const [ivHex, encryptedHex] = tokenStr.split(':');
    if (!ivHex || !encryptedHex) return null;

    const key = crypto.createHash('sha256').update(SECRET_KEY).digest();
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted);
  } catch (err) {
    return null;
  }
}

