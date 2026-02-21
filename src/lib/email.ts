import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587", 10),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendMail({ to, subject, html }: SendMailOptions) {
  const from = process.env.SMTP_FROM || "BP & AF Insurance <noreply@bpaf.in>";
  const info = await transporter.sendMail({ from, to, subject, html });
  console.log("[email] Sent to", to, "messageId:", info.messageId);
  return info;
}

/**
 * Send customer login credentials after account creation.
 */
export async function sendCustomerCredentials(
  toEmail: string,
  customerName: string,
  password: string,
  portalUrl: string
) {
  const subject = "Your BP & AF Insurance Customer Portal Login";
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <!-- Header -->
    <tr>
      <td style="background:linear-gradient(135deg,#1e3a5f,#2563eb);padding:32px 24px;text-align:center;">
        <h1 style="margin:0;color:#ffffff;font-size:22px;letter-spacing:1px;">BP & AF Insurance</h1>
        <p style="margin:6px 0 0;color:#93c5fd;font-size:13px;">Customer Portal</p>
      </td>
    </tr>
    <!-- Body -->
    <tr>
      <td style="padding:32px 24px;">
        <h2 style="margin:0 0 16px;color:#1e293b;font-size:18px;">Welcome, ${customerName}!</h2>
        <p style="color:#475569;font-size:14px;line-height:1.6;">
          Your customer portal account has been created. You can now view your policies, track renewals, and download documents online.
        </p>
        
        <!-- Credentials Box -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;">
          <tr>
            <td style="padding:20px;">
              <p style="margin:0 0 12px;font-size:13px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Your Login Credentials</p>
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:4px 0;color:#64748b;font-size:14px;width:80px;">Email:</td>
                  <td style="padding:4px 0;color:#0f172a;font-size:14px;font-weight:600;">${toEmail}</td>
                </tr>
                <tr>
                  <td style="padding:4px 0;color:#64748b;font-size:14px;">Password:</td>
                  <td style="padding:4px 0;color:#0f172a;font-size:14px;font-weight:600;font-family:monospace;letter-spacing:1px;">${password}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        
        <!-- CTA Button -->
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="text-align:center;padding:8px 0 24px;">
              <a href="${portalUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;">Log In to Your Portal</a>
            </td>
          </tr>
        </table>
        
        <p style="color:#94a3b8;font-size:12px;line-height:1.5;margin:0;">
          For security, please change your password after your first login. If you did not expect this email, please contact us at <a href="mailto:info@bpaf.in" style="color:#2563eb;">info@bpaf.in</a>.
        </p>
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="background:#f8fafc;padding:16px 24px;text-align:center;border-top:1px solid #e2e8f0;">
        <p style="margin:0;color:#94a3b8;font-size:11px;">&copy; ${new Date().getFullYear()} BP & AF Insurance Broker Pvt. Ltd. All rights reserved.</p>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  return sendMail({ to: toEmail, subject, html });
}

/**
 * Send password reset email to customer.
 */
export async function sendPasswordReset(
  toEmail: string,
  customerName: string,
  newPassword: string,
  portalUrl: string
) {
  const subject = "Your Password Has Been Reset - BP & AF Insurance";
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <tr>
      <td style="background:linear-gradient(135deg,#1e3a5f,#2563eb);padding:32px 24px;text-align:center;">
        <h1 style="margin:0;color:#ffffff;font-size:22px;">BP & AF Insurance</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:32px 24px;">
        <h2 style="margin:0 0 16px;color:#1e293b;">Password Reset</h2>
        <p style="color:#475569;font-size:14px;">Hi ${customerName}, your password has been reset.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;">
          <tr><td style="padding:16px;">
            <p style="margin:0 0 8px;font-size:13px;color:#92400e;font-weight:600;">New Password</p>
            <p style="margin:0;font-family:monospace;font-size:16px;color:#78350f;letter-spacing:1px;">${newPassword}</p>
          </td></tr>
        </table>
        <a href="${portalUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;">Log In Now</a>
      </td>
    </tr>
  </table>
</body>
</html>
`;
  return sendMail({ to: toEmail, subject, html });
}
