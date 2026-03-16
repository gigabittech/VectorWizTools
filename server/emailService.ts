import * as brevo from '@getbrevo/brevo';

// Initialize Brevo API client
// Initialize Brevo API client
let apiInstance: brevo.TransactionalEmailsApi | null = null;

function initializeBrevo() {
  if (!apiInstance && process.env.BREVO_API_KEY) {
    apiInstance = new brevo.TransactionalEmailsApi();
    apiInstance.setApiKey(
      brevo.TransactionalEmailsApiApiKeys.apiKey,
      process.env.BREVO_API_KEY
    );
  }
  return apiInstance;
}

export async function sendQuoteRequestNotification(quoteData: {
  firstName: string;
  lastName: string;
  email: string;
  projectDetails: string;
  numberOfFiles: string;
  turnaroundTime: string;
}) {
  const api = initializeBrevo();

  if (!api) {
    console.warn('Brevo API not configured. Skipping email notification.');
    return;
  }

  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'noreply@vectorwiz.com';
  const senderName = process.env.BREVO_SENDER_NAME || 'VectorWiz';

  try {
    // Send notification to VectorWiz team
    const teamEmail = new brevo.SendSmtpEmail();
    teamEmail.sender = { email: senderEmail, name: senderName };
    teamEmail.to = [{ email: senderEmail, name: 'VectorWiz Team' }];
    teamEmail.subject = `New Quote Request from ${quoteData.firstName} ${quoteData.lastName}`;
    teamEmail.htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(75deg, #06183C 0%, #20448B 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
            .field { margin-bottom: 15px; }
            .label { font-weight: bold; color: #06183C; }
            .value { margin-top: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>New Quote Request</h2>
            </div>
            <div class="content">
              <div class="field">
                <div class="label">Client Name:</div>
                <div class="value">${quoteData.firstName} ${quoteData.lastName}</div>
              </div>
              <div class="field">
                <div class="label">Email:</div>
                <div class="value">${quoteData.email}</div>
              </div>
              <div class="field">
                <div class="label">Number of Files:</div>
                <div class="value">${quoteData.numberOfFiles}</div>
              </div>
              <div class="field">
                <div class="label">Turnaround Time:</div>
                <div class="value">${quoteData.turnaroundTime}</div>
              </div>
              <div class="field">
                <div class="label">Project Details:</div>
                <div class="value">${quoteData.projectDetails}</div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    await api.sendTransacEmail(teamEmail);

    // Send confirmation to client
    const clientEmail = new brevo.SendSmtpEmail();
    clientEmail.sender = { email: senderEmail, name: senderName };
    clientEmail.to = [{ email: quoteData.email, name: `${quoteData.firstName} ${quoteData.lastName}` }];
    clientEmail.subject = 'Quote Request Received - VectorWiz';
    clientEmail.htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(75deg, #06183C 0%, #20448B 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #0B9F47; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Thank You for Your Quote Request!</h1>
            </div>
            <div class="content">
              <p>Hi ${quoteData.firstName},</p>
              <p>We've received your quote request and our team is reviewing the details. We'll get back to you with a detailed quote within 24 hours.</p>
              <p><strong>Your Request Details:</strong></p>
              <ul>
                <li>Number of Files: ${quoteData.numberOfFiles}</li>
                <li>Turnaround Time: ${quoteData.turnaroundTime}</li>
              </ul>
              <p>If you have any questions in the meantime, feel free to reach out to us.</p>
              <div class="footer">
                <p>Best regards,<br>The VectorWiz Team</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    await api.sendTransacEmail(clientEmail);

    console.log(`Quote request emails sent successfully for ${quoteData.email}`);
  } catch (error) {
    console.error('Failed to send quote request emails:', error);
    // Don't throw - we don't want email failures to block quote submission
  }
}
