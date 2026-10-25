import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

import { ComplaintStatus } from '@dh-araria/shared';

/**
 * Notification service for complaint status changes.
 *
 * Email is sent via SMTP (configured through `SMTP_*` env vars). SMS is a
 * pluggable stub — wire in Twilio, MSG91, Fast2SMS or any Indian SMS gateway
 * by implementing `sendSms()`.
 *
 * Sends are best-effort: a failure never blocks the complaint status transition.
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly configService: ConfigService) {}

  private getTransporter(): nodemailer.Transporter | null {
    if (this.transporter) return this.transporter;

    const host = this.configService.get<string>('email.host');
    const port = this.configService.get<number>('email.port');
    const user = this.configService.get<string>('email.user');
    const pass = this.configService.get<string>('email.pass');

    if (!user || !pass) {
      this.logger.warn(
        'SMTP credentials not configured — complaint status emails will not be sent'
      );
      return null;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: this.configService.get<boolean>('email.secure') ?? false,
      auth: { user, pass },
    });

    return this.transporter;
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /**
   * Notifies a citizen that their complaint status has changed.
   *
   * Sends an email if the complaint has an email address and SMTP is
   * configured. SMS is sent if a phone number is present (stub — implement
   * `sendSms()` to hook up a real gateway).
   */
  async notifyStatusChange({
    complaintId,
    name,
    email,
    phone,
    departmentName,
    oldStatus,
    newStatus,
    resolution,
  }: {
    complaintId: string;
    name: string;
    email?: string;
    phone?: string;
    departmentName?: string | null;
    oldStatus: ComplaintStatus;
    newStatus: ComplaintStatus;
    resolution?: string | null;
  }): Promise<void> {
    const results: string[] = [];

    if (email) {
      try {
        await this.sendStatusEmail({
          to: email,
          name,
          complaintId,
          departmentName,
          oldStatus,
          newStatus,
          resolution,
        });
        results.push(`email to ${email}`);
      } catch (error) {
        this.logger.error(
          `Failed to send complaint status email to ${email}: ${(error as Error).message}`
        );
      }
    }

    if (phone) {
      try {
        await this.sendSms({
          to: phone,
          name,
          complaintId,
          departmentName,
          oldStatus,
          newStatus,
        });
        results.push(`sms to ${phone}`);
      } catch (error) {
        this.logger.error(
          `Failed to send complaint status SMS to ${phone}: ${(error as Error).message}`
        );
      }
    }

    if (results.length > 0) {
      this.logger.log(
        `Complaint ${complaintStatusLabel(newStatus)} notification sent for complaint ${complaintId} (${results.join(', ')})`
      );
    }
  }

  // -------------------------------------------------------------------------
  // Email
  // -------------------------------------------------------------------------

  private async sendStatusEmail(params: {
    to: string;
    name: string;
    complaintId: string;
    departmentName?: string | null;
    oldStatus: ComplaintStatus;
    newStatus: ComplaintStatus;
    resolution?: string | null;
  }): Promise<void> {
    const transporter = this.getTransporter();
    if (!transporter) return;

    const from = this.configService.get<string>('email.from');
    const statusLabel = complaintStatusLabel(params.newStatus);

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1d4ed8;">District Hospital Araria — Complaint Update</h2>
        <p>Dear <strong>${params.name}</strong>,</p>
        <p>The status of your complaint <strong>#${params.complaintId}</strong> has changed.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Complaint ID</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${params.complaintId}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Department</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${params.departmentName ?? '—'}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Previous status</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${complaintStatusLabel(params.oldStatus)}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Current status</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #1d4ed8; font-weight: bold;">${statusLabel}</td></tr>
          ${params.resolution ? `<tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Resolution</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${params.resolution}</td></tr>` : ''}
        </table>
        <p style="color: #6b7280; font-size: 14px;">
          Track your complaint at ${this.configService.get<string>('frontendUrl')}/complaints/track
        </p>
      </div>
    `;

    await transporter.sendMail({
      from,
      to: params.to,
      subject: `Complaint #${params.complaintId} — ${statusLabel}`,
      html,
    });
  }

  // -------------------------------------------------------------------------
  // SMS (stub — implement with a real gateway)
  // -------------------------------------------------------------------------

  private async sendSms(params: {
    to: string;
    name: string;
    complaintId: string;
    departmentName?: string | null;
    oldStatus: ComplaintStatus;
    newStatus: ComplaintStatus;
  }): Promise<void> {
    // TODO: Wire up an SMS gateway (Twilio, MSG91, Fast2SMS, etc.) here.
    // Example:
    //   const accountSid = this.configService.get('TWILIO_ACCOUNT_SID');
    //   const authToken = this.configService.get('TWILIO_AUTH_TOKEN');
    //   const client = twilio(accountSid, authToken);
    //   await client.messages.create({ body, from: ..., to: params.to });
    this.logger.debug(
      `SMS stub: would send to ${params.to}: Complaint #${params.complaintId} is now ${complaintStatusLabel(params.newStatus)}`
    );
  }
}

function complaintStatusLabel(status: ComplaintStatus): string {
  const labels: Record<ComplaintStatus, string> = {
    [ComplaintStatus.SUBMITTED]: 'Submitted',
    [ComplaintStatus.UNDER_REVIEW]: 'Under Review',
    [ComplaintStatus.IN_PROGRESS]: 'In Progress',
    [ComplaintStatus.RESOLVED]: 'Resolved',
    [ComplaintStatus.CLOSED]: 'Closed',
    [ComplaintStatus.REJECTED]: 'Rejected',
  };
  return labels[status] ?? status;
}
