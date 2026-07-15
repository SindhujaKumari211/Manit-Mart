const rateLimit = require("express-rate-limit");

// Brute-force protection on login: 10 attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many login attempts. Please try again later." },
});

// Looser limit on registration to deter mass account creation
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many accounts created from this IP. Please try again later." },
});

// Tight limit on email-sending routes (verification resend / forgot password)
// 5 requests per hour per IP — prevents using the service as a spam relay.
const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many email requests. Please wait an hour before trying again." },
});

module.exports = { loginLimiter, registerLimiter, emailLimiter };

