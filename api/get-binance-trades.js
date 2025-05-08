// api/get-binance-trades.js
const fetch = require('node-fetch'); // For making HTTP requests (node-fetch@2.x.x)
const CryptoJS = require('crypto-js'); // For HMAC-SHA256 signing

// Vercel handler signature
export default async function handler(req, res) {
    // Retrieve API keys from Vercel environment variables
    const { BINANCE_API_KEY, BINANCE_API_SECRET } = process.env;

    if (!BINANCE_API_KEY || !BINANCE_API_SECRET) {
        console.error("API credentials not configured in Vercel environment variables.");
        return res.status(500).json({
            error: "Server configuration error: API credentials missing.",
            code: "CONFIG_ERROR"
        });
    }

    // Get query parameters from the client-side request (req.query)
    const { symbol, startTime, endTime, limit = '500' } = req.query;

    const API_BASE_URL = 'https://fapi.binance.com'; // Binance Futures API
    const endpoint = '/fapi/v1/userTrades'; // Endpoint for user account trades

    let binanceParams = `timestamp=${Date.now()}&recvWindow=6000&limit=${parseInt(limit, 10)}`;

    if (symbol) {
        binanceParams += `&symbol=${symbol.toUpperCase()}`;
    }
    if (startTime) {
        binanceParams += `&startTime=${startTime}`;
    }
    if (endTime) {
        binanceParams += `&endTime=${endTime}`;
    }

    const signature = CryptoJS.HmacSHA256(binanceParams, BINANCE_API_SECRET).toString(CryptoJS.enc.Hex);
    const url = `${API_BASE_URL}${endpoint}?${binanceParams}&signature=${signature}`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'X-MBX-APIKEY': BINANCE_API_KEY,
            }
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Binance API Error:", data);
            return res.status(response.status).json({ // Use res.status().json()
                error: data.msg || `Binance API Error: ${response.statusText}`,
                code: data.code || response.status,
            });
        }

        // Successfully fetched data from Binance
        return res.status(200).json(data); // Use res.status().json()

    } catch (error) {
        console.error("Error in Vercel function:", error);
        return res.status(500).json({ // Use res.status().json()
            error: "Internal server error while fetching trades.",
            details: error.message,
            code: "FUNCTION_ERROR"
        });
    }
}