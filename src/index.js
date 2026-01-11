require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const cors = require("cors");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const compression = require("compression");
const connectDB = require("./config/database");
const routes = require("./routes");
const passport = require("./config/passport");
const globalErrorHandler = require("./middlewares/error.middleware");

const app = express();

// 1. SECURITY MIDDLEWARE
// Set security HTTP headers
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// 2. OPTIMIZATION MIDDLEWARE
// Compress responses for faster delivery
app.use(compression());

// Body parser, reading data from body into req.body (Limit size for security)
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

// 3. DATA SANITIZATION
// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS (cross-site scripting)
app.use(xss());

// 4. AUTH INITIALIZATION
app.use(passport.initialize());

// 5. ROUTES
app.use("/api", routes);

// 6. GLOBAL ERROR HANDLING MIDDLEWARE
app.use(globalErrorHandler);

// 7. SERVER STARTUP & DATABASE
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(
        `🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
      );
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();

// Handle unhandled rejections outside of express
process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED REJECTION! 💥 Shutting down...");
  console.log(err.name, err.message);
  process.exit(1);
});
