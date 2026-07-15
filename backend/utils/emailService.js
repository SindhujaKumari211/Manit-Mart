/**
 * Email Service — Brevo SMTP via Nodemailer.
 *
 * Single shared transporter (created once at startup).
 * All email templates live here so controllers stay clean.
 */
const nodemailer = require("nodemailer");

// ── Transporter (reused across the process lifetime) ──────────────────────
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false, // Brevo uses STARTTLS on 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ── Generic send helper ────────────────────────────────────────────────────
const sendMail = async ({ to, subject, html, text }) => {
  return transporter.sendMail({
    from: `"${process.env.MAIL_FROM_NAME || "Campus Mart"}" <${process.env.MAIL_FROM_EMAIL || process.env.SMTP_USER}>`,
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]+>/g, ""), // plain-text fallback
  });
};

// ── Templates ──────────────────────────────────────────────────────────────

/**
 * Plain test mail — used to verify SMTP credentials.
 */
const sendTestMail = (to) =>
  sendMail({
    to,
    subject: "✅ SMTP test — Campus Mart",
    html: `<p>This is a plain SMTP test from the Campus Mart backend. If you see this, the Brevo connection is working.</p>`,
  });

/**
 * Verification email sent right after registration.
 * @param {string} to   - recipient email
 * @param {string} link - full verification URL
 */
const sendVerificationEmail = (to, link) =>
  sendMail({
    to,
    subject: "Verify your Campus Mart email",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#1c3a5e">Verify your email</h2>
        <p>Thanks for registering on <strong>Campus Mart</strong>!
           Click the button below to verify your email address.
           The link expires in <strong>24 hours</strong>.</p>
        <a href="${link}"
           style="display:inline-block;margin:16px 0;padding:12px 24px;
                  background:#1c3a5e;color:#fff;border-radius:8px;
                  text-decoration:none;font-weight:600">
          Verify Email
        </a>
        <p style="font-size:12px;color:#64748b">
          Or paste this URL into your browser:<br>
          <a href="${link}">${link}</a>
        </p>
        <p style="font-size:12px;color:#64748b">
          If you didn't create an account, ignore this email.
        </p>
      </div>
    `,
  });

/**
 * Password-reset email.
 * @param {string} to   - recipient email
 * @param {string} link - full reset URL
 */
const sendPasswordResetEmail = (to, link) =>
  sendMail({
    to,
    subject: "Reset your Campus Mart password",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#1c3a5e">Reset your password</h2>
        <p>We received a request to reset the password for your <strong>Campus Mart</strong> account.
           Click the button below. The link expires in <strong>15 minutes</strong>.</p>
        <a href="${link}"
           style="display:inline-block;margin:16px 0;padding:12px 24px;
                  background:#1c3a5e;color:#fff;border-radius:8px;
                  text-decoration:none;font-weight:600">
          Reset Password
        </a>
        <p style="font-size:12px;color:#64748b">
          Or paste this URL into your browser:<br>
          <a href="${link}">${link}</a>
        </p>
        <p style="font-size:12px;color:#64748b">
          If you didn't request a password reset, you can safely ignore this email.
        </p>
      </div>
    `,
  });

module.exports = {
  transporter,
  sendTestMail,
  sendVerificationEmail,
  sendPasswordResetEmail,
};
