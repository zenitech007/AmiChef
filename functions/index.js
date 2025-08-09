const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");
const axios = require("axios");

// Import Kroger API
const krogerApp = require("./krogerApi");

// ✅ Main Express App
const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

app.get("/", (req, res) => res.send("AmiChef Backend is running ✅"));

// Mount Kroger API
app.use("/kroger", krogerApp);

// --- Paystack Payment Endpoint ---
app.post("/paystack/initialize", async (req, res) => {
  const { email, amount } = req.body;
  const paystackSecret = process.env.PAYSTACK_LIVE_KEY || functions.config().paystack?.secret_key;
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

  if (!paystackSecret) return res.status(500).json({ message: "Missing Paystack secret key" });

  const paystack = require("paystack-api")(paystackSecret);

  try {
    const response = await paystack.transaction.initialize({
      email,
      amount: amount * 100,
      callback_url: `${clientUrl}/premium-dashboard`,
    });
    res.json(response.data);
  } catch (err) {
    console.error("Paystack Error:", err);
    res.status(500).json({ message: "Error initializing Paystack payment" });
  }
});

// --- Stripe Payment Endpoint ---
app.post("/stripe/create-checkout-session", async (req, res) => {
  const { plan } = req.body;

  const stripeSecret = process.env.STRIPE_LIVE_KEY || functions.config().stripe?.secret_key;
  const monthlyPriceId = process.env.STRIPE_MONTHLY_PRICE_ID || functions.config().stripe?.monthly_price_id;
  const annualPriceId = process.env.STRIPE_ANNUAL_PRICE_ID || functions.config().stripe?.annual_price_id;
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

  if (!stripeSecret || !monthlyPriceId || !annualPriceId) {
    return res.status(500).json({ message: "Missing Stripe config" });
  }

  const stripe = require("stripe")(stripeSecret);
  const priceId = plan === "monthly" ? monthlyPriceId : annualPriceId;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${clientUrl}/premium-dashboard?payment_success=true`,
      cancel_url: `${clientUrl}/billing`,
    });
    res.json({ id: session.id });
  } catch (err) {
    console.error("Stripe Error:", err);
    res.status(500).json({ message: "Error creating Stripe session" });
  }
});

// ✅ Gemini Meal Plan Generator
app.post("/generate-meal-plan", async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(204).send("");

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY || functions.config().gemini?.api_key;
  const SPOONACULAR_KEY = process.env.SPOONACULAR_KEY || functions.config().spoonacular?.key;

  if (!GEMINI_API_KEY) return res.status(500).send({ error: "Gemini API key missing" });

  const {
    days, location, dietaryPref, healthIssues,
    goal, householdSize, mealCount, cookingTime,
    budget, allergies
  } = req.body;

  const prompt = `Generate a structured JSON meal plan based on these preferences:
- Days: ${days}
- Location: ${location}
- Dietary Preference: ${dietaryPref}
- Health Issues: ${healthIssues}
- Goal: ${goal}
- Household Size: ${householdSize}
- Meals Per Day: ${mealCount}
- Cooking Time: ${cookingTime}
- Budget: ${budget}
- Allergies: ${allergies}
Return only JSON in the format:
[{ "mealTitle": "Grilled Chicken", "ingredients": [...], "instructions": "...", "nutrition": {...} }, ...]`;

  try {
    const geminiRes = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }]
      },
      {
        headers: { "Content-Type": "application/json" }
      }
    );

    const geminiData = geminiRes.data;
    let aiMeals = [];

    try {
      aiMeals = JSON.parse(geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "[]");
    } catch {
      return res.status(500).send({ error: "Gemini returned invalid JSON" });
    }

    const mealsWithImages = await Promise.all(aiMeals.map(async (meal) => {
      let image = "https://www.themealdb.com/images/media/meals/llcbn01574260722.jpg";

      if (SPOONACULAR_KEY) {
        try {
          const imgRes = await axios.get(`https://api.spoonacular.com/recipes/complexSearch`, {
            params: {
              query: meal.mealTitle,
              number: 1,
              apiKey: SPOONACULAR_KEY
            }
          });

          if (imgRes.data.results?.[0]?.image) {
            image = imgRes.data.results[0].image;
          }
        } catch (e) {
          console.error("Spoonacular image fetch failed:", e.message);
        }
      }

      return { ...meal, image };
    }));

    res.send(mealsWithImages);
  } catch (err) {
    console.error("MealPlan AI Error:", err);
    res.status(500).send({ error: "AI meal generation failed" });
  }
});

// ✅ Edamam Recipe Search
app.post("/edamam/search", async (req, res) => {
  const { query } = req.body;
  const EDAMAM_APP_ID = process.env.EDAMAM_APP_ID || functions.config().edamam?.app_id;
  const EDAMAM_APP_KEY = process.env.EDAMAM_APP_KEY || functions.config().edamam?.app_key;

  if (!EDAMAM_APP_ID || !EDAMAM_APP_KEY) {
    return res.status(500).json({ error: "Missing Edamam API credentials" });
  }

  try {
    const response = await axios.get("https://api.edamam.com/search", {
      params: {
        q: query,
        app_id: EDAMAM_APP_ID,
        app_key: EDAMAM_APP_KEY,
        to: 10
      }
    });

    const results = response.data.hits.map(hit => ({
      label: hit.recipe.label,
      image: hit.recipe.image,
      url: hit.recipe.url,
      ingredients: hit.recipe.ingredientLines,
      calories: hit.recipe.calories,
      dietLabels: hit.recipe.dietLabels,
      healthLabels: hit.recipe.healthLabels,
    }));

    res.json(results);
  } catch (err) {
    console.error("Edamam API Error:", err.message);
    res.status(500).json({ error: "Failed to fetch from Edamam" });
  }
});

// ✅ Exports
exports.api = functions.https.onRequest(app);
exports.ping = functions.https.onRequest((req, res) => res.send("pong"));
