import { Resend } from "resend";
import config from "../config";
import { auth } from "./auth";
import { EmailVerificationPurpose } from "./enum";
import { IEmailPayload, IMarketingEmailContent, IMarketingRecipient } from "./interface";

class Email {
  private resend: Resend | null = null;

  // Created on first send so a missing RESEND_API_KEY fails that request,
  // not every import of this module.
  private get client() {
    this.resend ??= new Resend(config.mail.resendApiKey);
    return this.resend;
  }

  public async sendEmail({ to, subject, html, text, headers }: IEmailPayload) {
    // Resend reports failures in `error` instead of throwing.
    const { error } = await this.client.emails.send({
      from: config.mail.from,
      to,
      subject,
      html,
      text,
      headers,
    });

    if (error) {
      throw new Error(`Email to ${to} failed: ${error.name}: ${error.message}`);
    }
  }

  // The only way marketing should be sent: it skips anyone who hasn't opted
  // in, and adds the unsubscribe link and the one-click headers Gmail and
  // Yahoo require of bulk senders.
  public async sendMarketingEmail(
    recipient: IMarketingRecipient,
    { subject, html, text }: IMarketingEmailContent,
  ) {
    if (!recipient.marketingConsent.granted) return;

    const query = `?token=${await auth.createUnsubscribeToken(recipient.id)}`;
    const pageUrl = new URL(config.marketing.unsubscribePagePath + query, config.app.url);
    const oneClickUrl = new URL(config.marketing.unsubscribeApiPath + query, config.app.url);

    return this.sendEmail({
      to: recipient.email,
      subject,
      text: `${text}\n\nUnsubscribe: ${pageUrl}`,
      html: `${html}
        <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12px;color:#63636d;text-align:center;margin:32px 0 0">
          You're receiving this because you opted in to ${config.app.name} updates.
          <a href="${pageUrl}" style="color:#63636d">Unsubscribe</a>
        </p>
      `,
      headers: {
        "List-Unsubscribe": `<${oneClickUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    });
  }

  public sendVerificationCode(to: string, code: string, purpose: EmailVerificationPurpose) {
      console.log("[CODE]:", code)
    return;
    const { name } = config.app;
    const minutes = config.otp.expiresInSeconds / 60;
    // The add-password wording must make it obvious when someone else is
    // trying to attach a password to this person's account.
    const { intro, ignore } =
      purpose === EmailVerificationPurpose.AddPassword
        ? {
            intro: `Someone asked to add a password to your ${name} account. Use this code to confirm it was you:`,
            ignore: "If this wasn't you, ignore this email and don't share the code. Your account won't change.",
          }
        : {
            intro: `Use this code to verify your email and finish signing up to ${name}:`,
            ignore: "If you didn't sign up, you can ignore this email.",
          };

    return this.sendEmail({
      to,
      subject: `Your ${name} verification code`,
      text: `${intro} ${code}. It expires in ${minutes} minutes. ${ignore}`,
      html: `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 20px;color:#0a0a0a">
          <p style="margin:0 0 16px;font-size:15px">${intro}</p>
          <p style="margin:0 0 16px;font-size:28px;font-weight:600;letter-spacing:6px;font-family:monospace">${code}</p>
          <p style="margin:0 0 8px;font-size:14px;color:#63636d">It expires in ${minutes} minutes. Don't share it with anyone.</p>
          <p style="margin:0;font-size:14px;color:#63636d">${ignore}</p>
        </div>
      `,
    });
  }
}

export const email = new Email();
