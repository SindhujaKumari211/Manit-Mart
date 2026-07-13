const { validationResult } = require("express-validator");

// ================= CREATE ORDER =================
exports.createOrder = async (req, res) => {
  try {
    const { Order, Product, Cart } = req.models;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: "Validation failed", errors: errors.array() });
    }

    const { productId, quantity, deliveryAddress, phone, paymentMethod } = req.body;

    // Check if product exists
    const product = await Product.findById(productId).populate("seller");
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if product is sold
    if (product.isSold) {
      return res.status(400).json({ message: "Product is already sold" });
    }

    // A seller can't buy their own listing
    if (product.seller._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "You cannot order your own product" });
    }

    // Atomically claim the item: only one buyer can flip isSold false→true,
    // so concurrent checkouts of the same unique listing can't double-sell it.
    const claimed = await Product.findOneAndUpdate(
      { _id: productId, isSold: false },
      { isSold: true },
      { new: true }
    );
    if (!claimed) {
      return res.status(400).json({ message: "Product is already sold" });
    }

    // Calculate total price
    const totalPrice = product.price * quantity;

    // Create order
    let order;
    try {
      order = await Order.create({
        buyer: req.user._id,
        seller: product.seller._id,
        product: productId,
        quantity,
        totalPrice,
        deliveryAddress,
        phone,
        paymentMethod: paymentMethod === "online" ? "online" : "cod",
      });
    } catch (err) {
      // Order creation failed — release the claim so the product isn't stuck "sold".
      await Product.findByIdAndUpdate(productId, { isSold: false });
      throw err;
    }

    // Remove from cart if exists
    await Cart.findOneAndDelete({
      user: req.user._id,
      product: productId,
    });

    const populatedOrder = await Order.findById(order._id)
      .populate("buyer", "name email phone")
      .populate("seller", "name email phone")
      .populate("product");

    res.status(201).json(populatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= GET USER ORDERS (AS BUYER) =================
exports.getMyOrders = async (req, res) => {
  try {
    const { Order } = req.models;
    const orders = await Order.find({ buyer: req.user._id })
      .populate("seller", "name email phone")
      .populate("product")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= GET SELLER ORDERS =================
exports.getSellerOrders = async (req, res) => {
  try {
    const { Order } = req.models;
    const orders = await Order.find({ seller: req.user._id })
      .populate("buyer", "name email phone")
      .populate("product")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= UPDATE ORDER STATUS =================
exports.updateOrderStatus = async (req, res) => {
  try {
    const { Order, Product } = req.models;
    const { orderId } = req.params;
    const { status } = req.body;

    const validStatuses = ["pending", "confirmed", "delivered", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Only seller can update order status
    if (order.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    order.status = status;
    await order.save();

    // Cancelling returns the unique item to the marketplace.
    if (status === "cancelled") {
      await Product.findByIdAndUpdate(order.product, { isSold: false });
    }

    const updatedOrder = await Order.findById(orderId)
      .populate("buyer", "name email phone")
      .populate("seller", "name email phone")
      .populate("product");

    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= CANCEL ORDER (buyer or seller) =================
exports.cancelOrder = async (req, res) => {
  try {
    const { Order, Product } = req.models;
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const isBuyer = order.buyer.toString() === req.user._id.toString();
    const isSeller = order.seller.toString() === req.user._id.toString();
    if (!isBuyer && !isSeller) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Only orders that haven't shipped/completed can be cancelled.
    if (!["pending", "confirmed"].includes(order.status)) {
      return res.status(400).json({ message: `A ${order.status} order can't be cancelled` });
    }

    order.status = "cancelled";
    await order.save();

    // Return the item to the marketplace so it can be bought again.
    await Product.findByIdAndUpdate(order.product, { isSold: false });

    const populated = await Order.findById(orderId)
      .populate("buyer", "name email phone")
      .populate("seller", "name email phone")
      .populate("product");

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= GET SINGLE ORDER =================
exports.getSingleOrder = async (req, res) => {
  try {
    const { Order } = req.models;
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate("buyer", "name email phone address")
      .populate("seller", "name email phone address")
      .populate("product");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if user is buyer or seller
    if (
      order.buyer._id.toString() !== req.user._id.toString() &&
      order.seller._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
