const express = require("express");
const { body } = require("express-validator");
const { subscribe } = require("../controllers/newsletterController");

const router = express.Router();

// POST /api/newsletter/subscribe
router.post(
  "/subscribe",
  [body("email").isEmail().withMessage("Valid email required").normalizeEmail()],
  subscribe
);

module.exports = router;
