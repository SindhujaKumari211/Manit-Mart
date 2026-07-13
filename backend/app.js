const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
const mongoose = require("mongoose");

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const chatRoutes = require("./routes/chatRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const { selectCollegeDatabase } = require("./middleware/collegeMiddleware");

const app = express();   // ✅ FIRST create app

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

// Every API request is scoped to one college database selected only by
// X-College. The default preserves existing MANIT clients during migration.
app.use("/api", selectCollegeDatabase);

// Uploaded images are meant to be embedded by a frontend on a different origin/port,
// so relax the default same-origin resource policy just for this static route.
app.use(
  "/uploads",
  (req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  },
  express.static(path.join(__dirname, "uploads"))
);
// Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/chats", chatRoutes);

app.get("/", (req, res) => {
  res.send("API Running Successfully 🚀");
});

// Health check for uptime monitors / load balancers / deployment platforms
app.get("/api/health", (req, res) => {
  const dbStates = ["disconnected", "connected", "connecting", "disconnecting"];
  const dbState = dbStates[mongoose.connection.readyState] || "unknown";

  res.status(dbState === "connected" ? 200 : 503).json({
    status: dbState === "connected" ? "ok" : "degraded",
    db: dbState,
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

app.use(notFound);
app.use(errorHandler);

module.exports = app;
