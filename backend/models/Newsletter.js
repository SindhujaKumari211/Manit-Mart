const mongoose = require("mongoose");

const newsletterSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
  },
  { timestamps: true }
);

// Prevent duplicate subscriptions per college DB
newsletterSchema.index({ email: 1 }, { unique: true });

module.exports = (db) =>
  db.models.Newsletter || db.model("Newsletter", newsletterSchema);
