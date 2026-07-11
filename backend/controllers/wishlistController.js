const Wishlist = require("../models/Wishlist");
const Product = require("../models/Product");
const { validationResult } = require("express-validator");

// ================= GET USER WISHLIST =================
exports.getWishlist = async (req, res) => {
  try {
    const wishlistItems = await Wishlist.find({ user: req.user._id })
      .populate({
        path: "product",
        populate: { path: "seller", select: "name email phone" }
      })
      .sort({ createdAt: -1 });

    // Self-heal: drop and purge orphaned entries whose product was deleted, so
    // the client always receives fully-populated items.
    const orphaned = wishlistItems.filter((item) => !item.product);
    if (orphaned.length > 0) {
      await Wishlist.deleteMany({ _id: { $in: orphaned.map((item) => item._id) } });
    }

    res.json(wishlistItems.filter((item) => item.product));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= ADD TO WISHLIST =================
exports.addToWishlist = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: "Validation failed", errors: errors.array() });
    }

    const { productId } = req.body;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if already in wishlist
    const existingItem = await Wishlist.findOne({
      user: req.user._id,
      product: productId,
    });

    if (existingItem) {
      return res.status(400).json({ message: "Already in wishlist" });
    }

    // Add to wishlist
    const wishlistItem = await Wishlist.create({
      user: req.user._id,
      product: productId,
    });

    const populatedItem = await Wishlist.findById(wishlistItem._id)
      .populate({
        path: "product",
        populate: { path: "seller", select: "name email phone" }
      });

    res.status(201).json(populatedItem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= REMOVE FROM WISHLIST =================
exports.removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    const result = await Wishlist.findOneAndDelete({
      user: req.user._id,
      product: productId,
    });

    if (!result) {
      return res.status(404).json({ message: "Item not found in wishlist" });
    }

    res.json({ message: "Removed from wishlist" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= CHECK IF IN WISHLIST =================
exports.checkWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    const item = await Wishlist.findOne({
      user: req.user._id,
      product: productId,
    });

    res.json({ inWishlist: !!item });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
