const mongoose = require("mongoose");

const supportTicketSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      required: true,
      unique: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "Delivery",
        "Return / Exchange",
        "Refund",
        "Payment",
        "Damaged or missing item",
        "Other",
      ],
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    status: {
      type: String,
      enum: ["Open", "In Progress", "Resolved"],
      default: "Open",
    },
    // Optionally linked to a logged-in user
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // Provided by the client so we can reply even without an account
    email: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },
  },
  { timestamps: true }
);

module.exports = (db) =>
  db.models.SupportTicket ||
  db.model("SupportTicket", supportTicketSchema);
