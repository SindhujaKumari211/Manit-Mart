const dotenv = require("dotenv");
const path = require("path");

// Load env vars BEFORE requiring app, so that required modules
// (like emailService) have access to process.env at load time.
dotenv.config({ path: path.join(__dirname, "../.env") });

const app = require("./app");
const connectDB = require("./config/db");

const requiredEnvVars = ["JWT_SECRET", "MONGO_URI"];
const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);

if (missingEnvVars.length > 0) {
  console.error(
    `❌ Missing required environment variable(s): ${missingEnvVars.join(", ")}`
  );
  process.exit(1);
}

// Connect Database
connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});