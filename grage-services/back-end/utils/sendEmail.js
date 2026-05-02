const transporter = require("../config/mail");

const DEFAULT_SUPPORT_EMAIL = 'autoxgarageservice@gmail.com';

const withAutoXFooter = (html = '') => {
  const content = String(html || '');

  // Prevent duplicate footer if template already contains it.
  if (content.includes('data-autox-thankyou="true"')) {
    return content;
  }

  const supportEmail = process.env.SUPPORT_EMAIL || process.env.EMAIL_USER || DEFAULT_SUPPORT_EMAIL;
  const footerBlock = `
    <div data-autox-thankyou="true" style="font-family:Arial,sans-serif;max-width:640px;margin:12px auto 0;background:#ffffff;border-radius:12px;padding:18px 22px;color:#1f2937;line-height:1.6;border-top:3px solid #0f172a;">
      <p style="margin:0 0 8px;"><strong>Thank you for choosing AutoX Garage.</strong></p>
      <p style="margin:0 0 8px;">We appreciate your trust in our service and look forward to helping you again.</p>
      <p style="margin:0;">Support Email: <a href="mailto:${supportEmail}" style="color:#0f172a;text-decoration:none;">${supportEmail}</a></p>
    </div>
  `;

  if (/<\/body>/i.test(content)) {
    return content.replace(/<\/body>/i, `${footerBlock}</body>`);
  }

  return `${content}${footerBlock}`;
};

const sendEmail = async (to, subject, html) => {
  try {
    const fromEmail = process.env.EMAIL_USER || DEFAULT_SUPPORT_EMAIL;
    const from = process.env.EMAIL_FROM || `AutoX Garage <${fromEmail}>`;

    await transporter.sendMail({
      from,
      to,
      subject,
      html: withAutoXFooter(html),
    });
  } catch (error) {
    console.error("EMAIL ERROR:", error);
    throw new Error(error?.message || 'Failed to send email');
  }
};

module.exports = sendEmail;