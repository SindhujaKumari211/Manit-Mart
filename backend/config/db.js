const mongoose = require("mongoose");

const BASE_DELAY_MS = 3000;
const MAX_DELAY_MS = 30000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Auto-reconnect on drops after the initial connection is established.
mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB disconnected — mongoose will attempt to reconnect…");
});
mongoose.connection.on("reconnected", () => {
  console.log("MongoDB reconnected ✅");
});

// Transient network/DNS blips or a paused free-tier Atlas cluster shouldn't take the
// whole server down. We retry indefinitely with a capped backoff and keep the process
// alive, so the API stays up (health check reports "degraded") and self-heals once the
// database is reachable again — no manual restart needed.
const connectDB = async (attempt = 1) => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    const delay = Math.min(BASE_DELAY_MS * attempt, MAX_DELAY_MS);
    console.error(`Database connection attempt ${attempt} failed ❌ — retrying in ${delay / 1000}s`);
    console.error(error.message);
    console.error(
      "If this persists: check the Atlas cluster is running and that this machine's IP " +
      "is whitelisted (Atlas → Network Access)."
    );

    await sleep(delay);
    return connectDB(attempt + 1);
  }
};

module.exports = connectDB;