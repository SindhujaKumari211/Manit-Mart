const asyncHandler = require("../utils/asyncHandler");

/* =============================================
   POST /api/support/tickets
   Body: { category, subject, message, email? }
   Public (email optional if logged in)
============================================= */
exports.createTicket = asyncHandler(async (req, res) => {
  const { SupportTicket } = req.models;
  const { category, subject, message, email } = req.body;

  if (!category || !subject?.trim() || !message?.trim()) {
    return res.status(400).json({ message: "Category, subject and message are all required." });
  }

  const ticketId = `T-${Date.now().toString().slice(-6)}-${Math.random()
    .toString(36)
    .slice(2, 5)
    .toUpperCase()}`;

  const ticket = await SupportTicket.create({
    ticketId,
    category,
    subject: subject.trim(),
    message: message.trim(),
    email: (email || "").trim().toLowerCase(),
    // Attach logged-in user if auth header was provided and middleware ran
    user: req.user?._id || null,
  });

  res.status(201).json({
    message: `Ticket ${ticketId} raised — our team will get back to you.`,
    ticket: {
      id: ticket.ticketId,
      category: ticket.category,
      subject: ticket.subject,
      status: ticket.status,
      createdAt: ticket.createdAt,
    },
  });
});

/* =============================================
   GET /api/support/tickets
   Auth: required — returns this user's tickets
============================================= */
exports.getMyTickets = asyncHandler(async (req, res) => {
  const { SupportTicket } = req.models;
  const tickets = await SupportTicket.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .lean();

  res.json(
    tickets.map((t) => ({
      id: t.ticketId,
      category: t.category,
      subject: t.subject,
      status: t.status,
      createdAt: t.createdAt,
    }))
  );
});
