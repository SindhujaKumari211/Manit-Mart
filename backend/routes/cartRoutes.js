const express = require("express");
const { body } = require("express-validator");
const {
  getCart,
  addToCart,
  updateCartQuantity,
  removeFromCart,
  clearCart,
} = require("../controllers/cartController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// All routes are protected
router.use(protect);

router.get("/", getCart);
router.post(
  "/",
  [
    body("productId").isMongoId().withMessage("Valid productId required"),
    body("quantity").optional().isInt({ min: 1 }).withMessage("Quantity must be a positive integer"),
  ],
  addToCart
);
router.put(
  "/:productId",
  [body("quantity").isInt({ min: 1 }).withMessage("Quantity must be a positive integer")],
  updateCartQuantity
);
router.delete("/:productId", removeFromCart);
router.delete("/", clearCart);

module.exports = router;
