import nodemailer from 'nodemailer';
import axios from 'axios';
import { storage } from "./storage";

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

// Mailer Transporter (Specifically for Custom SMTP)
async function getSmtpTransporter(settings: any) {
  const host = settings?.smtpHost || 'smtp-relay.brevo.com';
  const port = Number(settings?.smtpPort) || 587;
  const user = settings?.smtpUser || process.env.BREVO_SENDER_EMAIL || '';
  const pass = settings?.smtpPass || process.env.BREVO_API_KEY || '';
  const secure = settings?.encryption === 'ssl' || port === 465;

  console.log(`[SMTP] Attempting connection: ${host}:${port}`);

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    tls: { rejectUnauthorized: false }
  });
}

/**
 * Sends Quote Request notification using Brevo API or SMTP
 */
export async function sendQuoteRequestNotification(quoteData: {
  firstName: string;
  lastName: string;
  email: string;
  projectDetails: string;
  numberOfFiles: string;
  turnaroundTime: string;
  status: string;
  fileUrls?: string[];
}) {
  try {
    const settings = await storage.getEmailSettings();
    const provider = settings?.emailProvider || 'brevo';
    const senderEmail = settings?.senderEmail || process.env.BREVO_SENDER_EMAIL || 'noreply@vectorwiz.com';
    const senderName = settings?.senderName || process.env.BREVO_SENDER_NAME || 'VectorWiz';
    const apiKey = settings?.brevoApiKey || process.env.BREVO_API_KEY || '';

    const ccEmails = (settings?.ccEmails || []).filter(e => e && e.trim() !== "");
    const bccEmails = (settings?.bccEmails || []).filter(e => e && e.trim() !== "");

    const appUrl = process.env.APP_URL || '';

    // PREMIUM HTML TABLE FOR ADMIN
    const fileLinksHtml = quoteData.fileUrls && quoteData.fileUrls.length > 0
      ? quoteData.fileUrls.map((url, i) =>
        `<a href="${appUrl}${url}" style="display:inline-block; padding: 12px 24px; background-color: #0B9F47; color: white; text-decoration: none; border-radius: 8px; margin-right: 10px; margin-bottom: 10px; font-weight: bold; font-family: sans-serif; font-size: 14px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">Download File ${i + 1}</a>`
      ).join(' ')
      : '<span style="color: #64748B; font-style: italic;">No files attached</span>';

    const emailTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Quote Request</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #F1F5F9; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F1F5F9; padding: 40px 10px;">
          <tr>
            <td align="center">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.08);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #06183C 0%, #112D60 100%); padding: 40px; text-align: left;">
                    <div style="font-size: 28px; font-weight: 800; color: #ffffff; letter-spacing: -1px; margin-bottom: 16px;">
                      Vector<span style="color: #0B9F47;">Wiz</span>
                    </div>
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; line-height: 1.2;">New Quote Request Received</h1>
                    <p style="color: #94A3B8; margin: 8px 0 0 0; font-size: 14px;">A new submission has been captured from the website.</p>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding-bottom: 30px; border-bottom: 1px solid #F1F5F9;">
                          <p style="margin: 0 0 12px 0; color: #64748B; font-size: 12px; text-transform: uppercase; font-weight: 700; letter-spacing: 1px;">Customer Information</p>
                          <table width="100%" border="0" cellspacing="0" cellpadding="0">
                            <tr>
                              <td width="50%" style="padding-right: 15px;" valign="top">
                                <p style="margin: 0; color: #94A3B8; font-size: 11px; margin-bottom: 4px;">NAME</p>
                                <p style="margin: 0; color: #1E293B; font-size: 16px; font-weight: 600;">${quoteData.firstName} ${quoteData.lastName}</p>
                              </td>
                              <td width="50%" style="padding-left: 15px;" valign="top">
                                <p style="margin: 0; color: #94A3B8; font-size: 11px; margin-bottom: 4px;">EMAIL ADDRESS</p>
                                <p style="margin: 0; color: #0B9F47; font-size: 16px; font-weight: 600;"><a href="mailto:${quoteData.email}" style="color: #0B9F47; text-decoration: none;">${quoteData.email}</a></p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      
                      <tr>
                        <td style="padding-top: 30px; padding-bottom: 30px; border-bottom: 1px solid #F1F5F9;">
                          <p style="margin: 0 0 12px 0; color: #64748B; font-size: 12px; text-transform: uppercase; font-weight: 700; letter-spacing: 1px;">Project Details & Notes</p>
                          <div style="background-color: #F8FAFC; border-radius: 12px; padding: 24px; border-left: 4px solid #0B9F47;">
                            <p style="margin: 0; color: #334155; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">${quoteData.projectDetails}</p>
                          </div>
                        </td>
                      </tr>

                      <tr>
                        <td style="padding-top: 30px; padding-bottom: 30px; border-bottom: 1px solid #F1F5F9;">
                           <p style="margin: 0 0 15px 0; color: #64748B; font-size: 12px; text-transform: uppercase; font-weight: 700; letter-spacing: 1px;">Attached Files</p>
                           <div style="padding-top: 5px;">
                             ${fileLinksHtml}
                           </div>
                        </td>
                      </tr>

                       <tr>
                        <td style="padding-top: 30px;">
                          <table width="100%" border="0" cellspacing="0" cellpadding="0">
                            <tr>
                              <td width="50%" style="padding-right: 15px;" valign="top">
                                <p style="margin: 0; color: #94A3B8; font-size: 11px; margin-bottom: 4px;">NUMBER OF FILES</p>
                                <p style="margin: 0; color: #1E293B; font-size: 16px; font-weight: 600;">${quoteData.numberOfFiles}</p>
                              </td>
                              <td width="50%" style="padding-left: 15px;" valign="top">
                                <p style="margin: 0; color: #94A3B8; font-size: 11px; margin-bottom: 4px;">URGENCY</p>
                                <p style="margin: 0; color: #1E293B; font-size: 16px; font-weight: 600;">${quoteData.turnaroundTime} Hours</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 0 40px 40px 40px; text-align: center;">
                    <p style="margin: 0; color: #CBD5E1; font-size: 12px;">This email was automatically generated by VectorWiz Quote System.</p>
                    <p style="margin: 8px 0 0 0; color: #CBD5E1; font-size: 12px; font-weight: 600;">&copy; ${new Date().getFullYear()} VectorWiz Dashboard &bull; Creative that ships.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const clientTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Quote Request Received</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; padding: 40px 10px;">
          <tr>
            <td align="center">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">
                <!-- Header Logo -->
                <tr>
                  <td style="padding: 40px 40px 20px 40px; text-align: center; border-bottom: 3px solid #0B9F47;">
                    <div style="font-size: 32px; font-weight: 800; color: #06183C; letter-spacing: -1.5px;">
                      Vector<span style="color: #0B9F47;">Wiz</span>
                    </div>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="color: #06183C; margin: 0 0 24px 0; font-size: 26px; font-weight: 700;">Hi ${quoteData.firstName},</h2>
                    <p style="margin: 0 0 20px 0; color: #475569; font-size: 16px; line-height: 1.6;">Thank you for submitting your Request for Quote at <strong style="color: #0B9F47;">VectorWiz</strong>!</p>
                    <p style="margin: 0 0 20px 0; color: #475569; font-size: 16px; line-height: 1.6;">We've received your details and files, and our design team has started reviewing them.</p>
                    <p style="margin: 0 0 30px 0; color: #475569; font-size: 16px; line-height: 1.6;">You can expect your personalized quote within <strong>6–12 hours</strong> (often much sooner).</p>
                    
                    <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 30px; margin: 30px 0;">
                      <h3 style="color: #06183C; margin: 0 0 20px 0; font-size: 18px; font-weight: 700;">What happens next:</h3>
                      <ol style="margin: 0; padding: 0 0 0 20px; color: #475569; font-size: 14px; line-height: 1.8;">
                        <li style="margin-bottom: 10px;">We review your files and project requirements.</li>
                        <li style="margin-bottom: 10px;">You'll receive a quote email with price and turnaround details.</li>
                        <li>Once confirmed, we'll send a PayPal invoice and begin production right away.</li>
                      </ol>
                    </div>

                    <p style="margin: 0 0 24px 0; color: #475569; font-size: 16px; line-height: 1.6;">If you'd like to add or clarify anything, simply reply to this email — we'll make sure it's included in your quote.</p>
                    <p style="margin: 0 0 30px 0; color: #475569; font-size: 16px; line-height: 1.6;">We're excited to work with you and bring your artwork to life!</p>
                    
                    <div style="border-top: 1px solid #F1F5F9; padding-top: 30px; margin-top: 30px;">
                      <p style="margin: 0; color: #475569; font-size: 16px;">Warm regards,</p>
                      <p style="margin: 4px 0 0 0; color: #1E293B; font-size: 18px; font-weight: 700;">Sujan Bhuiyan</p>
                      <p style="margin: 4px 0 0 0; color: #64748B; font-size: 14px;">on behalf of the entire VectorWiz Team</p>
                      <p style="margin: 20px 0 0 0;"><a href="https://vectorwiz.com" style="color: #0B9F47; font-weight: 700; text-decoration: none; font-size: 16px;">vectorwiz.com</a></p>
                    </div>
                  </td>
                </tr>
              </table>
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px;">
                <tr>
                  <td style="padding-top: 20px; text-align: center;">
                     <p style="margin: 0; color: #94A3B8; font-size: 12px;">© ${new Date().getFullYear()} VectorWiz Dashboard &bull; Creative that ships.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    // Admin Notification
    const adminPayload: any = {
      sender: { name: senderName, email: senderEmail },
      to: [{ email: senderEmail }],
      replyTo: { email: quoteData.email, name: `${quoteData.firstName} ${quoteData.lastName}` },
      subject: `New Quote Request: ${quoteData.firstName} ${quoteData.lastName}`,
      htmlContent: emailTemplate
    };

    if (ccEmails.length > 0) adminPayload.cc = ccEmails.map(e => ({ email: e.trim() }));
    if (bccEmails.length > 0) adminPayload.bcc = bccEmails.map(e => ({ email: e.trim() }));

    if (provider === 'brevo' && apiKey) {
      console.log(`[BREVO API] Sending notification. From: ${senderEmail}, To: ${senderEmail}, CC Count: ${ccEmails.length}`);

      try {
        await axios.post(BREVO_API_URL, adminPayload, {
          headers: { 'api-key': apiKey, 'Content-Type': 'application/json' }
        });
        console.log(`[BREVO API] Admin notification sent successfully.`);
        await storage.createEmailLog({
          recipient: senderEmail,
          subject: adminPayload.subject,
          status: "sent"
        });
      } catch (err: any) {
        const errorMsg = err.response?.data ? JSON.stringify(err.response.data) : err.message;
        console.error(`[BREVO API ERROR - ADMIN]`, errorMsg);
        await storage.createEmailLog({
          recipient: senderEmail,
          subject: adminPayload.subject,
          status: "failed",
          errorMessage: errorMsg
        });
      }

      // Client Notification
      try {
        const clientSubject = 'We’ve Received Your Quote Request – VectorWiz';
        await axios.post(BREVO_API_URL, {
          sender: { name: senderName, email: senderEmail },
          to: [{ email: quoteData.email }],
          replyTo: { email: senderEmail },
          subject: clientSubject,
          htmlContent: clientTemplate
        }, {
          headers: { 'api-key': apiKey, 'Content-Type': 'application/json' }
        });
        console.log(`[BREVO API] Client confirmation sent successfully.`);
        await storage.createEmailLog({
          recipient: quoteData.email,
          subject: clientSubject,
          status: "sent"
        });
      } catch (err: any) {
        const errorMsg = err.response?.data ? JSON.stringify(err.response.data) : err.message;
        console.error(`[BREVO API ERROR - CLIENT]`, errorMsg);
        await storage.createEmailLog({
          recipient: quoteData.email,
          subject: 'We’ve Received Your Quote Request – VectorWiz',
          status: "failed",
          errorMessage: errorMsg
        });
      }

    } else {
      const transporter = await getSmtpTransporter(settings);
      try {
        await transporter.sendMail({
          from: `"${senderName}" <${senderEmail}>`,
          to: senderEmail,
          cc: ccEmails,
          bcc: bccEmails,
          replyTo: quoteData.email,
          subject: adminPayload.subject,
          html: emailTemplate
        });
        await storage.createEmailLog({ recipient: senderEmail, subject: adminPayload.subject, status: "sent" });
      } catch (e: any) {
        await storage.createEmailLog({ recipient: senderEmail, subject: adminPayload.subject, status: "failed", errorMessage: e.message });
      }

      try {
        const clientSubject = 'We’ve Received Your Quote Request – VectorWiz';
        await transporter.sendMail({
          from: `"${senderName}" <${senderEmail}>`,
          to: quoteData.email,
          replyTo: senderEmail,
          subject: clientSubject,
          html: clientTemplate
        });
        await storage.createEmailLog({ recipient: quoteData.email, subject: clientSubject, status: "sent" });
      } catch (e: any) {
        await storage.createEmailLog({ recipient: quoteData.email, subject: 'We’ve Received Your Quote Request – VectorWiz', status: "failed", errorMessage: e.message });
      }
    }
  } catch (error: any) {
    console.error('[EMAIL ERROR]', error.response?.data || error.message);
  }
}

/**
 * Sends a real-time Test Email using direct API or SMTP
 */
export async function sendTestEmail(targetEmail: string, settings: any) {
  const provider = settings?.emailProvider || 'brevo';
  const senderEmail = settings?.senderEmail || process.env.BREVO_SENDER_EMAIL || 'noreply@vectorwiz.com';
  const senderName = settings?.senderName || process.env.BREVO_SENDER_NAME || 'VectorWiz';
  const apiKey = settings?.brevoApiKey || process.env.BREVO_API_KEY || '';

  try {
    if (provider === 'brevo' && apiKey) {
      try {
        const response = await axios.post(BREVO_API_URL, {
          sender: { name: senderName, email: senderEmail },
          to: [{ email: targetEmail }],
          subject: 'Success - VectorWiz Email Settings',
          htmlContent: `<h2>API Key Verified!</h2><p>Your direct API connection is working perfectly.</p>`
        }, {
          headers: { 'api-key': apiKey, 'Content-Type': 'application/json' }
        });

        await storage.createEmailLog({
          recipient: targetEmail,
          subject: 'Success - VectorWiz Email Settings',
          status: "sent"
        });

        return { success: true, message: "Verification successful! Response ID: " + response.data.messageId };
      } catch (err: any) {
        const errorData = err.response?.data || {};
        const detail = errorData.message || err.message;
        console.error('[BREVO TEST ERROR]', errorData);

        await storage.createEmailLog({
          recipient: targetEmail,
          subject: 'Success - VectorWiz Email Settings',
          status: "failed",
          errorMessage: JSON.stringify(errorData)
        });

        return { success: false, error: `Connection failed: ${detail}` };
      }
    } else {
      const transporter = await getSmtpTransporter(settings);
      try {
        await transporter.sendMail({
          from: `"${senderName}" <${senderEmail}>`,
          to: targetEmail,
          subject: 'Success - VectorWiz SMTP',
          html: `<h2>SMTP Verified!</h2><p>Your SMTP server is responding correctly.</p>`
        });

        await storage.createEmailLog({
          recipient: targetEmail,
          subject: 'Success - VectorWiz SMTP',
          status: "sent"
        });

        return { success: true, message: "SMTP verified! Email sent." };
      } catch (err: any) {
        await storage.createEmailLog({
          recipient: targetEmail,
          subject: 'Success - VectorWiz SMTP',
          status: "failed",
          errorMessage: err.message
        });
        return { success: false, error: err.message };
      }
    }
  } catch (err: any) {
    const errorData = err.response?.data || {};
    const detail = errorData.message || err.message;
    console.error('[BREVO TEST ERROR]', errorData);
    return { success: false, error: `Connection failed: ${detail}` };
  }
}
