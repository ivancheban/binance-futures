// netlify/functions/get-binance-trades.js
const fetch = require('node-fetch'); // For making HTTP requests
const CryptoJS = require('crypto-js'); // For HMAC-SHA256 signing

exports.handler = async function(event, context) {
    // Retrieve API keys from Netlify environment variables
    const { BINANCE_API_KEY, BINANCE_API_SECRET } = process.env;

    if (!BINANCE_API_KEY || !BINANCE_API_SECRET) {
        console.error("API credentials not configured in Netlify environment variables.");
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: "Server configuration error: API credentials missing.",
                code: "CONFIG_ERROR"
            }),
        };
    }

    // Get query parameters passed from the client-side request
    // Example: /api/get-binance-trades?symbol=BTCUSDT&limit=100
    const { symbol, startTime, endTime, limit = '500' } = event.queryStringParameters || {}; // Default limit if not provided

    const API_BASE_URL = 'https://fapi.binance.com'; // Binance Futures API
    const endpoint = '/fapi/v1/userTrades'; // Endpoint for user account trades

    // Construct query string for Binance API
    // Always include timestamp and recvWindow
    let binanceParams = `timestamp=${Date.now()}&recvWindow=6000&limit=${parseInt(limit, 10)}`; // Ensure limit is an integer

    if (symbol) {
        binanceParams += `&symbol=${symbol.toUpperCase()}`;
    }
    if (startTime) {
        binanceParams += `&startTime=${startTime}`; // Client should send as timestamp
    }
    if (endTime) {
        binanceParams += `&endTime=${endTime}`; // Client should send as timestamp
    }

    // Generate HMAC-SHA256 signature
    const signature = CryptoJS.HmacSHA256(binanceParams, BINANCE_API_SECRET).toString(CryptoJS.enc.Hex);
    const url = `${API_BASE_URL}${endpoint}?${binanceParams}&signature=${signature}`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'X-MBX-APIKEY': BINANCE_API_KEY,
                'Content-Type': 'application/json' // Though for GET, body is not sent
            }
        });

        const data = await response.json();

        if (!response.ok) {
            // Binance API error (e.g., invalid symbol, bad signature)
            console.error("Binance API Error:", data);
            return {
                statusCode: response.status, // Forward Binance's status code
                body: JSON.stringify({
                    error: data.msg || `Binance API Error: ${response.statusText}`,
                    code: data.code || response.status, // Forward Binance's error code
                }),
            };
        }

        // Successfully fetched data from Binance
        return {
            statusCode: 200,
            body: JSON.stringify(data), // Send trade data back to the client
        };

    } catch (error) {
        console.error("Error in Netlify function:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: "Internal server error while fetching trades.",
                details: error.message,
                code: "FUNCTION_ERROR"
            }),
        };
    }
};