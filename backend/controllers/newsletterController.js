const asyncHandler = require("../utils/asyncHandler");

/* =============================================
   POST /api/newsletter/subscribe
   Body: { email }
   Public
============================================= */
exports.subscribe = asyncHandler(async (req, res) => {
  const { Newsletter } = req.models;
  const email = (req.body.email || "").trim().toLowerCase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: "A valid email address is required." });
  }

  // Upsert — silently succeeds if already subscribed
  await Newsletter.findOneAndUpdate(
    { email },
    { email },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  res.status(200).json({ message: "Subscribed successfully!" });
});
