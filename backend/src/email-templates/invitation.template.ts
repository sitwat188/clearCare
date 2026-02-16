import { escapeHtml } from './escape';

/**
 * HTML body for invitation email (inline CSS for email client compatibility).
 */
export function getInvitationEmailHtml(
  displayName: string,
  to: string,
  temporaryPassword: string,
  loginUrl: string,
): string {
  const loginLink = `${loginUrl}/login`;
  const safeName = escapeHtml(displayName);
  const safeEmail = escapeHtml(to);
  const safePassword = escapeHtml(temporaryPassword);
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're invited to ClearCare+</title>
</head>
<body style="margin:0; padding:0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f1f5f9; color: #334155;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.07); overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 28px 24px; text-align: center;">
              <span style="font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.02em;">ClearCare+</span>
              <p style="margin: 6px 0 0 0; font-size: 13px; color: rgba(255,255,255,0.9);">Care &amp; compliance platform</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 28px 24px;">
              <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #1e293b;">Welcome, ${safeName}</h1>
              <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #475569;">Your account has been created. Use the sign-in details below to log in. You'll be asked to set a new password on first login.</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Email</p>
                    <p style="margin: 0; font-size: 15px; font-weight: 500; color: #1e293b;">${safeEmail}</p>
                    <p style="margin: 16px 0 0 0; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Temporary password</p>
                    <p style="margin: 4px 0 0 0; font-size: 15px; font-weight: 600; color: #1e293b; font-family: ui-monospace, monospace; letter-spacing: 0.05em;">${safePassword}</p>
                  </td>
                </tr>
              </table>
              <p style="margin: 0 0 20px 0; font-size: 13px; color: #94a3b8;">This temporary password is valid for <strong>1 day</strong>. After that, request a new invitation from your administrator.</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 8px 0;">
                    <a href="${loginLink}" style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 8px;">Log in to ClearCare+</a>
                  </td>
                </tr>
              </table>
              <p style="margin: 24px 0 0 0; font-size: 13px; color: #94a3b8;">If you didn't expect this email, please ignore it or contact your administrator.</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 24px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">ClearCare+ · Post-visit care and compliance</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
