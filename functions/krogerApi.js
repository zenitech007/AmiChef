// File: /functions/index.js
const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config(); // Load local .env if available

const stripe = require("stripe")(
  functions.config().stripe?.secret_key || process.env.STRIPE_SECRET || "sk_test_dummy"
);

const paystack = require("paystack-api")(
  functions.config().paystack?.secret_key || process.env.PAYSTACK_SECRET || "sk_test_dummy"
);

// Import Kroger-related API routes
const krogerRoutes = require("./krogerApi");

const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());

// Routes
app.use("/kroger", krogerRoutes);

// Basic health route
app.get("/", (req, res) => {
  res.send("✅ Firebase Functions API is running.");
});

// Export the express app as a Firebase Function
exports.api = functions.https.onRequest(app);
