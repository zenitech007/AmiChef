const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const krogerApp = express();
app.use(cors({ origin: true }));
krogerApp.use(express.json());

// Kroger API endpoint
krogerApp.post('/', async (req, res) => {
  try {
    const { query, category, priceRange, location, page = 1 } = req.body;

    // Mock Kroger API response for development
    // In production, replace with actual Kroger API calls
    const mockItems = [
      {
        description: `${query} - Premium Brand`,
        brand: "Kroger",
        items: [{
          price: { regular: Math.random() * 10 + 2 },
          inventory: { stockLevel: Math.floor(Math.random() * 100) }
        }]
      },
      {
        description: `${query} - Organic`,
        brand: "Simple Truth",
        items: [{
          price: { regular: Math.random() * 15 + 3 },
          inventory: { stockLevel: Math.floor(Math.random() * 50) }
        }]
      }
    ];

    res.status(200).json({ items: mockItems });
  } catch (error) {
    console.error("Kroger API Error:", error);
    res.status(500).json({ error: "Failed to fetch groceries" });
  }
});

module.exports = krogerApp;