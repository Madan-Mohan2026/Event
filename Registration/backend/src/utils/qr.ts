import QRCode from 'qrcode';

export async function generateQrDataUrl(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, { margin: 1, width: 300 });
  } catch (err) {
    console.error('Failed to generate QR Data URL:', err);
    throw err;
  }
}
