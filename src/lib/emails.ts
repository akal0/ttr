import { resend } from "./resend-client";

// Note: Update this to your verified domain in production
// For now, use the default Resend domain
const FROM_EMAIL = "Tom's Trading Room <onboarding@resend.dev>";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail({ to, subject, html }: SendEmailParams) {
  if (!to || !process.env.RESEND_API_KEY) {
    console.error("❌ Missing recipient email or Resend API key", {
      to,
      hasKey: !!process.env.RESEND_API_KEY,
    });
    return { success: false, error: "Missing email or API key" };
  }

  console.log(`📧 Attempting to send email to ${to}: ${subject}`);

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });

    if (error) {
      console.error("❌ Failed to send email:", error);
      return { success: false, error };
    }

    console.log(`✅ Email sent successfully to ${to}: ${subject}`, data);
    return { success: true, data };
  } catch (err) {
    console.error("❌ Error sending email:", err);
    return { success: false, error: err };
  }
}

// Email Templates

export async function sendWelcomeEmail(to: string, name: string) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #ffffff; padding: 40px 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to Tom's Trading Room!</h1>
          </div>
          <div class="content">
            <p>Hey ${name || "there"}!</p>

            <p>Welcome to the community! Your membership has been activated and you now have full access to:</p>

            <ul>
              <li><strong>Live Trading Sessions</strong> - Watch Tom trade in real-time</li>
              <li><strong>1-on-1 Mentorship</strong> - Get personalized guidance</li>
              <li><strong>Exclusive Community</strong> - Connect with fellow traders</li>
              <li><strong>Premium Resources</strong> - Access all our trading materials</li>
            </ul>

            <p>Ready to get started?</p>

            <a href="https://discord.gg/your-server" class="button">Join Our Discord →</a>

            <p>If you have any questions, just reply to this email. We're here to help!</p>

            <p>Happy trading,<br><strong>Tom's Trading Room Team</strong></p>
          </div>
          <div class="footer">
            <p>Tom's Trading Room | Elite Trading Mentorship</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: "🎉 Welcome to Tom's Trading Room!",
    html,
  });
}

export async function sendCancellationEmail(to: string, name: string) {
  if (!to || !process.env.RESEND_API_KEY) {
    console.error("❌ Missing recipient email or Resend API key", {
      to,
      hasKey: !!process.env.RESEND_API_KEY,
    });
    return { success: false, error: "Missing email or API key" };
  }

  if (!process.env.RESEND_CANCELLATION_TEMPLATE_ID) {
    console.error("❌ Missing RESEND_CANCELLATION_TEMPLATE_ID");
    return { success: false, error: "Missing template ID" };
  }

  console.log(`📧 Attempting to send cancellation email to ${to} using template`);

  // Construct the unsubscribe URL with the user's email
  const unsubscribeUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/api/unsubscribe?email=${encodeURIComponent(to)}`;

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      template: {
        id: process.env.RESEND_CANCELLATION_TEMPLATE_ID,
        variables: {
          whopName: name || "there",
          UNSUBSCRIBE_URL: unsubscribeUrl,
        },
      },
    });

    if (error) {
      console.error("❌ Failed to send cancellation email:", error);
      return { success: false, error };
    }

    console.log(`✅ Cancellation email sent successfully to ${to}`, data);
    return { success: true, data };
  } catch (err) {
    console.error("❌ Error sending cancellation email:", err);
    return { success: false, error: err };
  }
}

export async function sendRefundEmail(
  to: string,
  name: string,
  amount: string
) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3b82f6; color: white; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #ffffff; padding: 40px 30px; border-radius: 0 0 8px 8px; }
          .info-box { background: #f3f4f6; padding: 20px; border-radius: 6px; margin: 20px 0; }
          .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💸 Refund Processed</h1>
          </div>
          <div class="content">
            <p>Hey ${name || "there"},</p>

            <p>Your refund has been processed successfully.</p>

            <div class="info-box">
              <strong>Refund Amount:</strong> ${amount}<br>
              <strong>Processing Time:</strong> 5-10 business days
            </div>

            <p>The refund will appear on your original payment method within 5-10 business days depending on your bank or card issuer.</p>

            <p><strong>What's next?</strong></p>
            <ul>
              <li>You'll receive a separate confirmation from your payment provider</li>
              <li>Your account access has been adjusted accordingly</li>
              <li>You're welcome to rejoin us anytime</li>
            </ul>

            <p>If you have any questions about this refund, just reply to this email.</p>

            <p>Thanks for giving us a try.</p>

            <p>Best regards,<br><strong>Tom's Trading Room Team</strong></p>
          </div>
          <div class="footer">
            <p>Tom's Trading Room | Customer Support</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: "💸 Your Refund Has Been Processed",
    html,
  });
}

export async function sendMembershipExpiredEmail(to: string, name: string) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #ef4444; color: white; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #ffffff; padding: 40px 30px; border-radius: 0 0 8px 8px; }
          .highlight { background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0; border-radius: 4px; }
          .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Your Membership Has Expired</h1>
          </div>
          <div class="content">
            <p>Hey ${name || "there"},</p>

            <p>We noticed your membership to Tom's Trading Room has expired.</p>

            <div class="highlight">
              <strong>⚠️ Your access has ended</strong><br>
              You no longer have access to live sessions, mentorship calls, and community resources.
            </div>

            <p><strong>Want to continue your trading journey?</strong></p>

            <p>Reactivate your membership now to regain instant access to:</p>
            <ul>
              <li>Live trading sessions with Tom</li>
              <li>1-on-1 mentorship opportunities</li>
              <li>Exclusive community Discord</li>
              <li>Premium trading resources and strategies</li>
            </ul>

            <a href="https://whop.com/api-app-w-ra-uj15-o8-i8n-l2-premium-access/" class="button">Reactivate Membership →</a>

            <p>We'd love to see you back in the community!</p>

            <p>Best regards,<br><strong>Tom's Trading Room Team</strong></p>
          </div>
          <div class="footer">
            <p>Tom's Trading Room | Reactivate Anytime</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: "⏰ Your Membership Has Expired - Reactivate Now",
    html,
  });
}

export async function sendCheckoutAbandonedEmail(to: string) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #ffffff; padding: 40px 30px; border-radius: 0 0 8px 8px; }
          .highlight { background: #dbeafe; padding: 15px; border-left: 4px solid #3b82f6; margin: 20px 0; border-radius: 4px; }
          .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🤔 Still Thinking About It?</h1>
          </div>
          <div class="content">
            <p>Hey there!</p>

            <p>We noticed you started to join Tom's Trading Room but didn't complete your checkout.</p>

            <p><strong>No pressure!</strong> We just wanted to answer any questions you might have:</p>

            <div class="highlight">
              <strong>💬 Common Questions:</strong><br><br>
              <strong>Q: What's included?</strong><br>
              A: Live trading sessions, 1-on-1 mentorship, exclusive Discord community, and premium resources.<br><br>
              <strong>Q: Can I cancel anytime?</strong><br>
              A: Absolutely! Cancel anytime, no questions asked.<br><br>
              <strong>Q: Is there a trial?</strong><br>
              A: Yes! Try it risk-free for the first 7 days.
            </div>

            <p><strong>Ready to level up your trading?</strong></p>

            <a href="https://whop.com/api-app-w-ra-uj15-o8-i8n-l2-premium-access/" class="button">Complete Your Membership →</a>

            <p>Still have questions? Just reply to this email - Tom's team reads every message!</p>

            <p>Talk soon,<br><strong>Tom's Trading Room Team</strong></p>
          </div>
          <div class="footer">
            <p>Tom's Trading Room | Join 500+ Successful Traders</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: "🤔 Complete your membership - Tom's Trading Room",
    html,
  });
}
