const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const asyncHandler = require("../utils/asyncHandler");
const {
  sendVerificationEmail,
  sendPasswordResetEmail,
} = require("../utils/emailService");

// ── Token helpers ──────────────────────────────────────────────────────────

/** Main auth token — 7 days */
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

/** Email verification token — 24 hours */
const generateVerificationToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "24h" });

/** Password reset token — 15 minutes */
const generateResetToken = (userId) =>
  jwt.sign({ userId, purpose: "reset" }, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// ── Helpers ────────────────────────────────────────────────────────────────

const buildUserResponse = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  isVerified: user.isVerified,
  token: generateToken(user._id),
});

// Fire-and-forget: log on failure but never crash the request.
const sendVerificationEmailSafe = async (user) => {
  try {
    const token = generateVerificationToken(user._id);
    const link = `${FRONTEND_URL}/verify-email?token=${token}`;
    await sendVerificationEmail(user.email, link);
  } catch (err) {
    console.error("[Email] Failed to send verification email:", err.message);
  }
};

// ── Controllers ────────────────────────────────────────────────────────────

// ================= REGISTER =================
exports.registerUser = asyncHandler(async (req, res) => {
  const { User } = req.models;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: "Validation failed", errors: errors.array() });
  }

  const { name, email, password, department, hostel, phone, address } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({ message: "User already exists" });
  }

  const user = await User.create({
    name,
    email,
    password,
    department,
    hostel,
    phone: phone || "",
    address: address || "",
    isVerified: false, // explicit for clarity
  });

  // Send verification email after successful creation (non-blocking)
  sendVerificationEmailSafe(user);

  res.status(201).json({
    ...buildUserResponse(user),
    message: "Account created. Check your email to verify your address.",
  });
});

// ================= LOGIN =================
exports.loginUser = asyncHandler(async (req, res) => {
  const { User } = req.models;
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  // Login is NOT blocked by verification status (as requested).
  res.json(buildUserResponse(user));
});

// ================= UPDATE PROFILE =================
exports.updateProfile = asyncHandler(async (req, res) => {
  const { User } = req.models;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: "Validation failed", errors: errors.array() });
  }

  const { phone, address, profilePicture } = req.body;
  const updateData = { phone: phone || "", address: address || "" };
  if (profilePicture !== undefined) updateData.profilePicture = profilePicture;

  const user = await User.findByIdAndUpdate(req.user._id, updateData, {
    new: true,
  }).select("-password");

  res.json({ message: "Profile updated", user });
});

// ================= VERIFY EMAIL =================
exports.verifyEmail = asyncHandler(async (req, res) => {
  const { User } = req.models;
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ message: "Verification token is required." });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    const msg =
      err.name === "TokenExpiredError"
        ? "Verification link has expired. Please request a new one."
        : "Invalid verification link.";
    return res.status(400).json({ message: msg });
  }

  const user = await User.findById(decoded.userId);
  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  if (user.isVerified) {
    return res.json({ message: "Email is already verified." });
  }

  user.isVerified = true;
  await user.save();

  res.json({ message: "Email verified successfully! You can now use all features." });
});

// ================= RESEND VERIFICATION =================
exports.resendVerification = asyncHandler(async (req, res) => {
  const { User } = req.models;
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required." });
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });

  // Generic response — don't reveal if the email exists in the system
  if (!user || user.isVerified) {
    return res.json({
      message:
        "If that email is registered and unverified, a new verification link has been sent.",
    });
  }

  await sendVerificationEmailSafe(user);

  res.json({
    message: "If that email is registered and unverified, a new verification link has been sent.",
  });
});

// ================= FORGOT PASSWORD =================
exports.forgotPassword = asyncHandler(async (req, res) => {
  const { User } = req.models;
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required." });
  }

  // Always return the same message regardless of whether the email exists
  const GENERIC_MSG =
    "If an account with that email exists, a password reset link has been sent.";

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    return res.json({ message: GENERIC_MSG });
  }

  try {
    const resetToken = generateResetToken(user._id);
    const link = `${FRONTEND_URL}/reset-password?token=${resetToken}`;
    await sendPasswordResetEmail(user.email, link);
  } catch (err) {
    console.error("[Email] Failed to send password reset email:", err.message);
  }

  res.json({ message: GENERIC_MSG });
});

// ================= RESET PASSWORD =================
exports.resetPassword = asyncHandler(async (req, res) => {
  const { User } = req.models;
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ message: "Token and new password are required." });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters." });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    const msg =
      err.name === "TokenExpiredError"
        ? "Reset link has expired. Please request a new one."
        : "Invalid reset link.";
    return res.status(400).json({ message: msg });
  }

  if (decoded.purpose !== "reset") {
    return res.status(400).json({ message: "Invalid reset token." });
  }

  const user = await User.findById(decoded.userId);
  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  // Assign new password — the pre-save hook hashes it automatically.
  user.password = password;
  await user.save();

  res.json({ message: "Password reset successfully. You can now log in with your new password." });
});
