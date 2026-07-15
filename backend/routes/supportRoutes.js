const express = require("express");
const { body } = require("express-validator");
const { createTicket, getMyTickets } = require("../controllers/supportController");
const { protect, optionalAuth } = require("../middleware/authMiddleware");

const router = express.Router();

// POST /api/support/tickets  — public, but attaches user if token present
router.post(
  "/tickets",
  optionalAuth,
  [
    body("category").notEmpty().withMessage("Category is required"),
    body("subject").notEmpty().trim().withMessage("Subject is required"),
    body("message").notEmpty().trim().withMessage("Message is required"),
    body("email").optional().isEmail().normalizeEmail(),
  ],
  createTicket
);

// GET /api/support/tickets  — returns logged-in user's tickets
router.get("/tickets", protect, getMyTickets);

module.exports = router;
