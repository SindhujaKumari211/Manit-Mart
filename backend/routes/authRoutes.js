const express = require("express");
const { body } = require("express-validator");

const { registerUser, loginUser, updateProfile } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const { loginLimiter, registerLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

/* =========================
   🔹 REGISTER ROUTE
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
   🔹 LOGIN ROUTE
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
   🔹 PROFILE ROUTE (Protected)
   GET /api/auth/profile
   PUT /api/auth/profile
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

module.exports = router;