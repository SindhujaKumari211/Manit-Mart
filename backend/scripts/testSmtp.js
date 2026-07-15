/**
 * One-shot SMTP test — run with:
 *   node backend/scripts/testSmtp.js
 */
const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.join(__dirname, "../../.env") });

const { sendTestMail } = require("../utils/emailService");

const TO = "sat5968ish@gmail.com";

(async () => {
  console.log(`Sending test email to ${TO} via ${process.env.SMTP_HOST}:${process.env.SMTP_PORT} …`);
  try {
    const info = await sendTestMail(TO);
    console.log("✅ Email sent successfully!");
    console.log("   messageId:", info.messageId);
    console.log("   response :", info.response);
  } catch (err) {
    console.error("❌ Failed to send email:");
    console.error("   Code   :", err.code);
    console.error("   Message:", err.message);
    process.exitCode = 1;
  }
})();
