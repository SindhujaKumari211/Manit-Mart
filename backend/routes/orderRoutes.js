const express = require("express");
const { body } = require("express-validator");
const {
  createOrder,
  getMyOrders,
  getSellerOrders,
  updateOrderStatus,
  cancelOrder,
  getSingleOrder,
} = require("../controllers/orderController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// All routes are protected
router.use(protect);

router.post(
  "/",
  [
    body("productId").isMongoId().withMessage("Valid productId required"),
    body("quantity").isInt({ min: 1 }).withMessage("Quantity must be a positive integer"),
    body("deliveryAddress").notEmpty().withMessage("Delivery address is required"),
    body("phone").notEmpty().withMessage("Phone number is required"),
    body("paymentMethod").optional().isIn(["cod", "online"]).withMessage("Invalid payment method"),
  ],
  createOrder
);
router.get("/my-orders", getMyOrders);
router.get("/seller-orders", getSellerOrders);
router.get("/:orderId", getSingleOrder);
router.put("/:orderId/status", updateOrderStatus);
router.put("/:orderId/cancel", cancelOrder);

module.exports = router;
