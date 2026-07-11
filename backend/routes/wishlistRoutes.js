const express = require("express");
const { body } = require("express-validator");
const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  checkWishlist,
} = require("../controllers/wishlistController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// All routes are protected
router.use(protect);

router.get("/", getWishlist);
router.post(
  "/",
  [body("productId").isMongoId().withMessage("Valid productId required")],
  addToWishlist
);
router.delete("/:productId", removeFromWishlist);
router.get("/check/:productId", checkWishlist);

module.exports = router;
