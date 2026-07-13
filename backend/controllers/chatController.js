const { validationResult } = require("express-validator");

const getProductAndRole = async (req) => {
  const product = await req.models.Product.findById(req.params.productId).select("seller name");
  if (!product) return { error: "Product not found", status: 404 };
  const isSeller = product.seller.toString() === req.user._id.toString();
  return { product, isSeller };
};

exports.getInboxConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    const messages = await req.models.ChatMessage.find({
      $or: [{ buyer: userId }, { seller: userId }],
    })
      .populate("buyer", "name profilePicture")
      .populate("seller", "name profilePicture")
      .populate("product", "name image isSold seller")
      .sort({ createdAt: -1 });

    const seen = new Set();
    const conversations = [];

    for (const message of messages) {
      const productId = message.product?._id?.toString();
      const buyerId = message.buyer?._id?.toString();
      if (!productId || !buyerId) continue;

      const key = `${productId}:${buyerId}`;
      if (seen.has(key)) continue;
      seen.add(key);

      conversations.push({
        product: message.product,
        buyer: message.buyer,
        seller: message.seller,
        lastMessage: message.content,
        updatedAt: message.createdAt,
        isSeller: message.seller?._id?.toString() === userId.toString(),
      });
    }

    res.json({ conversations });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getConversations = async (req, res) => {
  try {
    const result = await getProductAndRole(req);
    if (result.error) return res.status(result.status).json({ message: result.error });
    if (!result.isSeller) return res.status(403).json({ message: "Only the seller can view all conversations" });

    const messages = await req.models.ChatMessage.find({ product: result.product._id })
      .populate("buyer", "name")
      .sort({ createdAt: -1 });
    const seen = new Set();
    const conversations = messages.filter((message) => {
      const buyerId = message.buyer?._id?.toString();
      if (!buyerId || seen.has(buyerId)) return false;
      seen.add(buyerId);
      return true;
    }).map((message) => ({ buyer: message.buyer, lastMessage: message.content, updatedAt: message.createdAt }));
    res.json({ conversations });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const result = await getProductAndRole(req);
    if (result.error) return res.status(result.status).json({ message: result.error });
    const buyerId = result.isSeller ? req.query.buyerId : req.user._id;
    if (result.isSeller && !buyerId) return res.status(400).json({ message: "buyerId is required" });
    const messages = await req.models.ChatMessage.find({ product: result.product._id, buyer: buyerId })
      .populate("sender", "name")
      .sort({ createdAt: 1 });
    res.json({ messages, productName: result.product.name });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: "Validation failed", errors: errors.array() });
    const result = await getProductAndRole(req);
    if (result.error) return res.status(result.status).json({ message: result.error });
    const buyerId = result.isSeller ? req.body.buyerId : req.user._id;
    if (result.isSeller && !buyerId) return res.status(400).json({ message: "buyerId is required" });
    if (result.isSeller) {
      const existingConversation = await req.models.ChatMessage.exists({ product: result.product._id, buyer: buyerId });
      if (!existingConversation) return res.status(403).json({ message: "That buyer has not started a conversation" });
    }

    const message = await req.models.ChatMessage.create({
      product: result.product._id,
      buyer: buyerId,
      seller: result.product.seller,
      sender: req.user._id,
      content: req.body.content.trim(),
    });
    await message.populate("sender", "name");
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
