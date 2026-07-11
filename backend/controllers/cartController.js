const Cart = require("../models/Cart");
const Product = require("../models/Product");
const { validationResult } = require("express-validator");

// ================= GET USER CART =================
exports.getCart = async (req, res) => {
  try {
    const cartItems = await Cart.find({ user: req.user._id })
      .populate({
        path: "product",
        populate: { path: "seller", select: "name email phone" }
      })
      .sort({ createdAt: -1 });

    // Self-heal: a product referenced by a cart item may have been deleted, in
    // which case populate leaves `product` null. Purge those orphans so the
    // client never receives (and never has to guard against) broken items.
    const orphaned = cartItems.filter((item) => !item.product);
    if (orphaned.length > 0) {
      await Cart.deleteMany({ _id: { $in: orphaned.map((item) => item._id) } });
    }

    res.json(cartItems.filter((item) => item.product));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= ADD TO CART =================
exports.addToCart = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: "Validation failed", errors: errors.array() });
    }

    const { productId, quantity = 1 } = req.body;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if product is sold
    if (product.isSold) {
      return res.status(400).json({ message: "Product is already sold" });
    }

    // Check if already in cart
    const existingItem = await Cart.findOne({
      user: req.user._id,
      product: productId,
    });

    if (existingItem) {
      // Update quantity
      existingItem.quantity = quantity;
      await existingItem.save();
      
      const updatedItem = await Cart.findById(existingItem._id)
        .populate({
          path: "product",
          populate: { path: "seller", select: "name email phone" }
        });
      
      return res.json(updatedItem);
    }

    // Add to cart
    const cartItem = await Cart.create({
      user: req.user._id,
      product: productId,
      quantity,
    });

    const populatedItem = await Cart.findById(cartItem._id)
      .populate({
        path: "product",
        populate: { path: "seller", select: "name email phone" }
      });

    res.status(201).json(populatedItem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= UPDATE CART QUANTITY =================
exports.updateCartQuantity = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: "Validation failed", errors: errors.array() });
    }

    const { productId } = req.params;
    const { quantity } = req.body;

    const cartItem = await Cart.findOneAndUpdate(
      { user: req.user._id, product: productId },
      { quantity },
      { new: true }
    ).populate({
      path: "product",
      populate: { path: "seller", select: "name email phone" }
    });

    if (!cartItem) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    res.json(cartItem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= REMOVE FROM CART =================
exports.removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;

    const result = await Cart.findOneAndDelete({
      user: req.user._id,
      product: productId,
    });

    if (!result) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    res.json({ message: "Removed from cart" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= CLEAR CART =================
exports.clearCart = async (req, res) => {
  try {
    await Cart.deleteMany({ user: req.user._id });
    res.json({ message: "Cart cleared" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
