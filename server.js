const express = require("express");
const axios = require("axios");
const cors = require("cors");
const pdfParse = require('pdf-parse');
const app = express();

// Enable CORS for all routes
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

app.get("/api/pdf-text", async (req, res) => {
    try {
        const pdfUrl = req.query.pdfUrl;
        
        if (!pdfUrl) {
            return res.status(400).json({ error: "Missing pdfUrl parameter" });
        }
        
        // Fetch the PDF file from the remote server
        const response = await axios.get(pdfUrl, { 
            responseType: "arraybuffer",
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        const pdfData = new Uint8Array(response.data);
        
        // Extract text from PDF
        const data = await pdfParse(pdfData);
        const extractedText = data.text || "";
    
        // Send extracted text as response
        res.json({ text: extractedText.trim() });
        
    } catch (error) {
        console.error("Error processing PDF:", error);
        res.status(500).json({ 
            error: "Failed to process PDF", 
            message: error.message 
        });
    }
});


// Health check endpoint
app.get("/api/health", (_, res) => {
    res.status(200).json({ status: "ok" });
});

// Default route
app.get("/", (_, res) => {
    res.send("PDF Processor API by @Mounseflit");
});

// Export for Vercel serverless function
module.exports = app;

// Start server if running directly (development)
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });
}
