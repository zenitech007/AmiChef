const functions = require("firebase-functions");
const axios = require("axios");
require("dotenv").config();

exports.callKrogerFunction = functions.https.onRequest(async (req, res) => {
  try {
    const { query, category, priceRange, location, page = 1 } = req.body;

    const token = process.env.KROGER_ACCESS_TOKEN;

    if (!token) {
      return res.status(400).json({ error: "KROGER_ACCESS_TOKEN missing." });
    }

    const response = await axios.get("https://api.kroger.com/v1/products", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        filter.term: query || "",
        filter.brand: category || undefined,
        filter.locationId: location || undefined,
        filter.limit: 12,
        filter.start: (page - 1) * 12,
      },
    });

    res.status(200).json({ items: response.data?.data || [] });
  } catch (error) {
    console.error("Kroger API Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch groceries" });
  }
});
