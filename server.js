/**
 * @fileoverview PDF text extraction server using Express.js
 * @requires express
 * @requires axios
 * @requires cors
 * @requires pdf-parse
 * 
 * @description Express server that provides endpoints to extract text from PDF files.
 * Main functionalities:
 * - Extract text from specific PDF pages (/api/pdf-text)
 * - Extract text from entire PDF (/api/pdf-text-all)
 * - Health check endpoint (/api/health)
 * 
 * @example
 * // Extract text from specific pages:
 * GET /api/pdf-text?pdfUrl=<url>&min=1&max=50
 * 
 * // Extract text from entire PDF:
 * GET /api/pdf-text-all?pdfUrl=<url>
 * 
 * @author @Mounseflit
 * @version 1.0.0
 */


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


        const max = parseInt(req.query.max) || 100; // Default to 100 if not provided
        const min = parseInt(req.query.min) || 1;  // Default to 1 if not provided

        // Validate the values
        if (isNaN(max) || max < 1) {
            throw new Error('Invalid max page value');
        }
        if (isNaN(min) || min < 1 || min > max) {
            throw new Error('Invalid min page value');
        }

        // Replace the options and pdfParse section with this:
        const options = {
            max: max,
            pagerender: async function (pageData) {
                // Skip pages before min
                if (pageData.pageNumber < min) {
                    return "";
                }
                const textContent = await pageData.getTextContent();
                return textContent.items.map(item => item.str).join(' ');
            }
        };

        const data = await pdfParse(pdfData, options);

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


app.get("/api/pdf-text-all", async (req, res) => {
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

        // Extract text from whole PDF 
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
    res.send(`
        <!DOCTYPE html>
        <html>
            <head>
                <title>PDF2Text Extractor API</title>
                <style>
                    body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; line-height: 1.6; }
                    code { background: #f4f4f4; padding: 2px 5px; border-radius: 3px; }
                    .endpoint { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
                </style>
            </head>
            <body>
                <h1>PDF2Text Extractor API</h1>
                <p>Extract text content from PDF files using the following endpoints:</p>
                
                <div class="endpoint">
                    <h3>Extract text from specific pages:</h3>
                    <code>GET /api/pdf-text?pdfUrl=[URL]&min=[START_PAGE]&max=[END_PAGE]</code>
                    <p>Example: <a href="/api/pdf-text?pdfUrl=https://example.com/file.pdf&min=1&max=5">/api/pdf-text?pdfUrl=https://example.com/file.pdf&min=1&max=5</a></p>
                    <p>Note: If min equals max, the API will extract text from that specific page.</p>
                </div>

                <div class="endpoint">
                    <h3>Extract text from entire PDF:</h3>
                    <code>GET /api/pdf-text-all?pdfUrl=[URL]</code>
                    <p>Example: <a href="/api/pdf-text-all?pdfUrl=https://example.com/file.pdf">/api/pdf-text-all?pdfUrl=https://example.com/file.pdf</a></p>
                </div>

                <p>Created by @Mounseflit</p>
            </body>
        </html>
    `);
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
