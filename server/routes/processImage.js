// server/routes/processImage.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

router.post('/', upload.single('image'), async (req, res) => {
    try {
        const filePath = req.file.path;
        const fileBuffer = fs.readFileSync(filePath);
        const base64 = fileBuffer.toString('base64');

        const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });

        const result = await model.generateContent([
            {
                inlineData: {
                    data: base64,
                    mimeType: req.file.mimetype,
                },
            },
            "Extract a grocery list from this image. Return an array of objects with fields: name, quantity, and category. Respond ONLY with JSON."
        ]);

        const text = await result.response.text();

        // Parse response text as JSON
        const items = JSON.parse(text);
        res.json({ items });

        // Delete the uploaded file after processing
        fs.unlinkSync(filePath);
    } catch (err) {
        console.error('Image processing error:', err);
        res.status(500).json({ error: 'Failed to process image' });
    }
});

module.exports = router;
