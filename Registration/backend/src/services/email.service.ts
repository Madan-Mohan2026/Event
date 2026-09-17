import nodemailer from 'nodemailer';

interface EmailParticipant {
  participantName: string;
  participantEmail: string;
  registrationId?: string;
}

interface EmailEvent {
  title: string;
  date?: Date | string;
  location?: string;
  supportEmail?: string;
  organizerName?: string;
}

/**
 * Creates a nodemailer transporter using environment variables.
 * Enables connection pooling for ultra-fast parallel bulk sending.
 */
function createTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USER || 'srfpapis@gmail.com';
  const pass = process.env.SMTP_PASS || 'vicmdoxdruogseqy';

  if (!user || !pass) {
    return null; // SMTP not configured; run in mock/log mode
  }

  return nodemailer.createTransport({
    pool: true,
    maxConnections: 10,
    maxMessages: 200,
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass
    }
  });
}


/**
 * Send Approval Email to Event Participant
 */
export async function sendApprovalEmail(participant: EmailParticipant, event: EmailEvent): Promise<{ success: boolean; mode: string; error?: string }> {
  try {
    const toEmail = participant.participantEmail?.trim();
    if (!toEmail) {
      console.warn('[EMAIL SERVICE]: Cannot send approval email — no participant email provided.');
      return { success: false, mode: 'skipped', error: 'No participant email provided' };
    }

    const eventTitle = event.title || 'Event';
    const participantName = participant.participantName || 'Participant';
    const regId = participant.registrationId || 'N/A';
    const eventDateStr = event.date
      ? new Date(event.date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      : 'As announced';
    const eventLocation = event.location || 'Venue to be shared by organizer';
    const supportEmail = event.supportEmail || process.env.SUPPORT_EMAIL || 'support@rtih.org';

    const fromAddress = process.env.SMTP_FROM || process.env.SUPPORT_EMAIL || `"RTIH Events" <no-reply@rtih.org>`;
    const subject = `Registration Approved: ${eventTitle}`;

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 22px; font-weight: 800;">Registration Approved 🎉</h1>
          <p style="margin: 6px 0 0; opacity: 0.9; font-size: 14px;">${eventTitle}</p>
        </div>
        <div style="padding: 28px; background: #ffffff;">
          <p style="font-size: 15px;">Dear <strong>${participantName}</strong>,</p>
          <p style="font-size: 14.5px;">We are pleased to inform you that your registration for <strong>${eventTitle}</strong> has been <strong>APPROVED</strong>!</p>
          
          <div style="background: #f8fafc; border-left: 4px solid #10b981; border-radius: 6px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0 0 8px; font-size: 13.5px;"><strong>Registration Reference ID:</strong> <span style="font-family: monospace; font-size: 14px; color: #047857;">${regId}</span></p>
            <p style="margin: 0 0 8px; font-size: 13.5px;"><strong>Event Date:</strong> ${eventDateStr}</p>
            <p style="margin: 0; font-size: 13.5px;"><strong>Location / Venue:</strong> ${eventLocation}</p>
          </div>

          <p style="font-size: 14px;">We look forward to seeing you at the event. Please keep your Registration Reference ID handy when attending.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="font-size: 12.5px; color: #64748b; margin: 0;">If you have any questions, feel free to contact us at <a href="mailto:${supportEmail}" style="color: #4f46e5;">${supportEmail}</a>.</p>
        </div>
        <div style="background: #f1f5f9; padding: 14px; text-align: center; font-size: 12px; color: #64748b;">
          &copy; ${new Date().getFullYear()} RTIH Event Management System. All rights reserved.
        </div>
      </div>
    `;

    const transporter = createTransporter();
    if (!transporter) {
      console.log(`[EMAIL SERVICE - MOCK LOG]: Approval email sent to ${toEmail} for event "${eventTitle}" (SMTP credentials not configured)`);
      return { success: true, mode: 'logged' };
    }

    await transporter.sendMail({
      from: fromAddress,
      to: toEmail,
      subject,
      html
    });

    console.log(`[EMAIL SERVICE - SMTP]: Approval email sent successfully to ${toEmail} for event "${eventTitle}"`);
    return { success: true, mode: 'smtp' };
  } catch (error: any) {
    console.error('[EMAIL SERVICE ERROR]: Failed to send approval email:', error.message);
    return { success: false, mode: 'failed', error: error.message };
  }
}

/**
 * Send Rejection Email to Event Participant
 */
export async function sendRejectionEmail(participant: EmailParticipant, event: EmailEvent): Promise<{ success: boolean; mode: string; error?: string }> {
  try {
    const toEmail = participant.participantEmail?.trim();
    if (!toEmail) {
      console.warn('[EMAIL SERVICE]: Cannot send rejection email — no participant email provided.');
      return { success: false, mode: 'skipped', error: 'No participant email provided' };
    }

    const eventTitle = event.title || 'Event';
    const participantName = participant.participantName || 'Participant';
    const supportEmail = event.supportEmail || process.env.SUPPORT_EMAIL || 'support@rtih.org';

    const fromAddress = process.env.SMTP_FROM || process.env.SUPPORT_EMAIL || `"RTIH Events" <no-reply@rtih.org>`;
    const subject = `Update regarding your registration for ${eventTitle}`;

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #475569 0%, #334155 100%); color: #ffffff; padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 20px; font-weight: 800;">Registration Update</h1>
          <p style="margin: 6px 0 0; opacity: 0.9; font-size: 14px;">${eventTitle}</p>
        </div>
        <div style="padding: 28px; background: #ffffff;">
          <p style="font-size: 15px;">Dear <strong>${participantName}</strong>,</p>
          <p style="font-size: 14.5px;">Thank you for your interest in attending <strong>${eventTitle}</strong>.</p>
          <p style="font-size: 14.5px;">Due to high demand and limited participant capacity, we regret to inform you that we are unable to approve your registration for this event at this time.</p>

          <p style="font-size: 14px;">We appreciate your application and encourage you to join us for future RTIH events and programs.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="font-size: 12.5px; color: #64748b; margin: 0;">If you have any questions, please reach out to us at <a href="mailto:${supportEmail}" style="color: #4f46e5;">${supportEmail}</a>.</p>
        </div>
        <div style="background: #f1f5f9; padding: 14px; text-align: center; font-size: 12px; color: #64748b;">
          &copy; ${new Date().getFullYear()} RTIH Event Management System. All rights reserved.
        </div>
      </div>
    `;

    const transporter = createTransporter();
    if (!transporter) {
      console.log(`[EMAIL SERVICE - MOCK LOG]: Rejection email sent to ${toEmail} for event "${eventTitle}" (SMTP credentials not configured)`);
      return { success: true, mode: 'logged' };
    }

    await transporter.sendMail({
      from: fromAddress,
      to: toEmail,
      subject,
      html
    });

    console.log(`[EMAIL SERVICE - SMTP]: Rejection email sent successfully to ${toEmail} for event "${eventTitle}"`);
    return { success: true, mode: 'smtp' };
  } catch (error: any) {
    console.error('[EMAIL SERVICE ERROR]: Failed to send rejection email:', error.message);
    return { success: false, mode: 'failed', error: error.message };
  }
}

export interface BulkEmailTarget {
  participantName: string;
  participantEmail: string;
  registrationId?: string;
}

/**
 * High performance pooled bulk custom email dispatcher
 */
export async function sendBulkCustomEmail(
  targets: BulkEmailTarget[],
  subjectTemplate: string,
  bodyTemplate: string,
  event: EmailEvent
): Promise<{ success: boolean; sentCount: number; failedCount: number; mode: string }> {
  try {
    const transporter = createTransporter();
    const fromAddress = process.env.SMTP_FROM || `"RTIH Events" <srfpapis@gmail.com>`;
    const eventTitle = event.title || 'Event';
    const eventDateStr = event.date
      ? new Date(event.date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      : 'As scheduled';
    const eventVenue = event.location || 'Venue as announced';

    if (!transporter) {
      console.log(`[EMAIL SERVICE - MOCK LOG]: Bulk email dispatched to ${targets.length} target(s) (Mock Mode)`);
      return { success: true, sentCount: targets.length, failedCount: 0, mode: 'logged' };
    }

    // Helper for placeholder replacement
    const interpolate = (text: string, p: BulkEmailTarget): string => {
      const regId = p.registrationId || 'N/A';
      const name = p.participantName || 'Participant';
      const email = p.participantEmail || '';

      return text
        .replace(/\{participantName\}/g, name)
        .replace(/\{name\}/g, name)
        .replace(/\{participantEmail\}/g, email)
        .replace(/\{email\}/g, email)
        .replace(/\{eventTitle\}/g, eventTitle)
        .replace(/\{title\}/g, eventTitle)
        .replace(/\{eventDate\}/g, eventDateStr)
        .replace(/\{date\}/g, eventDateStr)
        .replace(/\{eventVenue\}/g, eventVenue)
        .replace(/\{venue\}/g, eventVenue)
        .replace(/\{location\}/g, eventVenue)
        .replace(/\{registrationId\}/g, regId)
        .replace(/\{regId\}/g, regId);
    };

    // Parallel dispatch using pooled transporter
    const emailPromises = targets.map(async (target) => {
      const toEmail = target.participantEmail?.trim();
      if (!toEmail) return { success: false, target, error: 'No email address' };

      const subject = interpolate(subjectTemplate, target);
      const rawBody = interpolate(bodyTemplate, target);

      const formattedHtml = rawBody.includes('<div') || rawBody.includes('<p')
        ? rawBody
        : `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; background: #ffffff;">
            ${rawBody.replace(/\n/g, '<br />')}
          </div>`;

      try {
        await transporter.sendMail({
          from: fromAddress,
          to: toEmail,
          subject,
          html: formattedHtml
        });
        return { success: true, target };
      } catch (err: any) {
        console.error(`[EMAIL BULK ERROR] Failed sending to ${toEmail}:`, err.message);
        return { success: false, target, error: err.message };
      }
    });

    const results = await Promise.allSettled(emailPromises);
    let sentCount = 0;
    let failedCount = 0;

    results.forEach(res => {
      if (res.status === 'fulfilled' && res.value.success) {
        sentCount++;
      } else {
        failedCount++;
      }
    });

    console.log(`[EMAIL SERVICE - BULK]: Sent ${sentCount} email(s), Failed: ${failedCount}`);
    return { success: true, sentCount, failedCount, mode: 'smtp' };
  } catch (error: any) {
    console.error('[EMAIL SERVICE BULK FATAL]:', error.message);
    return { success: false, sentCount: 0, failedCount: targets.length, mode: 'failed' };
  }
}

