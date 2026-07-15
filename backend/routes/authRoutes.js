const express = require("express");
const { body } = require("express-validator");

const {
  registerUser,
  loginUser,
  updateProfile,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const { loginLimiter, registerLimiter, emailLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

/* =========================
   REGISTER
   POST /api/auth/register
========================= */
router.post(
  "/register",
  registerLimiter,
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("department").notEmpty().withMessage("Department required"),
    body("hostel").notEmpty().withMessage("Hostel required"),
  ],
  registerUser
);

/* =========================
   LOGIN
   POST /api/auth/login
========================= */
router.post(
  "/login",
  loginLimiter,
  [
    body("email").isEmail().withMessage("Valid email required"),
    body("password").notEmpty().withMessage("Password required"),
  ],
  loginUser
);

/* =========================
   PROFILE (Protected)
   GET  /api/auth/profile
   PUT  /api/auth/profile
========================= */
router.get("/profile", protect, (req, res) => {
  res.json(req.user);
});

router.put(
  "/profile",
  protect,
  [
    body("phone").optional({ checkFalsy: true }).isString().trim(),
    body("address").optional({ checkFalsy: true }).isString().trim(),
    body("profilePicture").optional({ checkFalsy: true }).isString().trim(),
  ],
  updateProfile
);

/* =========================
   VERIFY EMAIL
   GET /api/auth/verify-email?token=<jwt>
========================= */
router.get("/verify-email", verifyEmail);

/* =========================
   RESEND VERIFICATION EMAIL
   POST /api/auth/resend-verification
========================= */
router.post(
  "/resend-verification",
  emailLimiter,
  [body("email").isEmail().withMessage("Valid email required")],
  resendVerification
);

/* =========================
   FORGOT PASSWORD
   POST /api/auth/forgot-password
========================= */
router.post(
  "/forgot-password",
  emailLimiter,
  [body("email").isEmail().withMessage("Valid email required")],
  forgotPassword
);

/* =========================
   RESET PASSWORD
   POST /api/auth/reset-password
========================= */
router.post(
  "/reset-password",
  [
    body("token").notEmpty().withMessage("Token is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  resetPassword
);

module.exports = router;