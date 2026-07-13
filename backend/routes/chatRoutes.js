const express = require("express");
const { body } = require("express-validator");
const { protect } = require("../middleware/authMiddleware");
const { getInboxConversations, getConversations, getMessages, sendMessage } = require("../controllers/chatController");

const router = express.Router();
router.use(protect);
router.get("/conversations", getInboxConversations);
router.get("/product/:productId/conversations", getConversations);
router.get("/product/:productId", getMessages);
router.post("/product/:productId", [
  body("content").trim().isLength({ min: 1, max: 2000 }).withMessage("Message must be 1-2000 characters"),
  body("buyerId").optional().isMongoId().withMessage("Valid buyerId required"),
], sendMessage);

module.exports = router;
