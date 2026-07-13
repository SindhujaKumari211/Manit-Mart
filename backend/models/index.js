const getUser = require("./User");
const getProduct = require("./Product");
const getCart = require("./Cart");
const getWishlist = require("./Wishlist");
const getOrder = require("./Order");
const getChatMessage = require("./ChatMessage");

// A single place to obtain all models bound to one Mongoose Connection.
// Do not use mongoose.model() here: that would always target the default DB.
module.exports = (db) => ({
  User: getUser(db),
  Product: getProduct(db),
  Cart: getCart(db),
  Wishlist: getWishlist(db),
  Order: getOrder(db),
  ChatMessage: getChatMessage(db),
});
