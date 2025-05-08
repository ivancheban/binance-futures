# Binance Futures Trade History Viewer

A simple web application to view your Binance Futures trade history. This application fetches trade data securely using a serverless function hosted on Vercel, ensuring your API keys are never exposed to the client-side.

## Features

*   Displays individual trade executions from your Binance Futures account.
*   Filter trades by:
    *   Symbol (e.g., BTCUSDT)
    *   Start Time
    *   End Time
    *   Limit (number of trades to fetch)
*   Calculates and displays summary statistics:
    *   Total Trades Fetched
    *   Total Realized P&L
    *   Total Commission
*   Securely handles Binance API keys using Vercel Environment Variables and a serverless function.

## Screenshot

<!--
  TODO: Add a screenshot of your application here!
  You can drag and drop an image into GitHub's editor or use markdown:
  ![App Screenshot](path/to/your/screenshot.png)
-->
*(Replace this with a screenshot of your application)*

## Tech Stack

*   **Frontend:** HTML, CSS, Vanilla JavaScript
*   **Backend (Serverless Function):** Node.js
*   **API:** Binance Futures API
*   **Hosting:** Vercel (Static Site + Serverless Functions)
*   **Libraries:**
    *   `node-fetch` (for making API calls in the serverless function)
    *   `crypto-js` (for HMAC-SHA256 signing of API requests in the serverless function)

## Project Setup & Deployment

This project is designed to be deployed on Vercel.

### Prerequisites

*   A Binance account with API keys generated.
    *   **API Key Permissions:** Ensure your API key has **"Enable Reading"** and **"Enable Futures"** permissions. **DO NOT enable trading or withdrawal permissions for this key.**
*   A Vercel account.
*   Git installed.
*   Node.js and npm installed (for local development using Vercel CLI).

### Deployment Steps

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/your-username/your-repo-name.git
    cd your-repo-name
    ```

2.  **Install Dependencies (for local development or if Vercel requires it):**

    ```bash
    npm install
    ```

3.  **Configure Vercel Project:**
    *   Create a new project on Vercel and connect it to your Git repository.
    *   **Environment Variables:** In your Vercel project settings (Settings -> Environment Variables), add the following:
        *   `BINANCE_API_KEY`: Your Binance API Key
        *   `BINANCE_API_SECRET`: Your Binance API Secret
    *   **Function Region:** In your Vercel project settings (Settings -> Functions), select a suitable **Function Region** (e.g., "Frankfurt, Germany (West) - eu-central-1 - fra1"). This is crucial to avoid geographical restrictions from Binance.com if your default Vercel region is US-based.
    *   **Build & Development Settings:**
        *   Framework Preset: `Other`
        *   Build Command: (Leave empty or override to empty)
        *   Output Directory: (Leave empty or override to empty, or `.`)
        *   Install Command: (Default is usually fine, Vercel will run `npm install`)
        *   Root Directory: (Should be empty if your project is at the root of the repo)

4.  **`vercel.json` Configuration:**

    The project includes a `vercel.json` file to configure routing and function properties. It's set up to use the `api/` directory for serverless functions.

    ```json
    {
      "version": 2,
      "builds": [
        {
          "src": "package.json",
          "use": "@vercel/node"
        }
      ],
      "routes": [
        {
          "src": "/api/get-binance-trades",
          "dest": "/api/get-binance-trades.js"
        },
        {
          "src": "/(.*)",
          "dest": "/index.html"
        }
      ],
      "functions": {
        "api/get-binance-trades.js": {
          "memory": 128,
          "maxDuration": 10
        }
      }
    }
    ```

    *(Ensure this matches your latest working `vercel.json`)*

5.  **Push to Deploy:**
    Commit any changes and push to your main branch. Vercel will automatically build and deploy your application.

### Local Development (Optional)

1.  Install the Vercel CLI:
    ```bash
    npm install -g vercel
    ```
2.  Link your local project to Vercel:
    ```bash
    vercel link
    ```
3.  Create a `.env` file in the root of your project for local environment variables:
    ```
    BINANCE_API_KEY=your_local_binance_api_key
    BINANCE_API_SECRET=your_local_binance_api_secret
    ```
    *(Ensure `.env` is listed in your `.gitignore` file!)*
4.  Run the development server:
    ```bash
    vercel dev
    ```
    This will start a local server, usually on `http://localhost:3000`, that emulates the Vercel environment, including your serverless function.

## How It Works

1.  The user interacts with the frontend (`index.html`, `script.js`).
2.  When "Fetch Trades" is clicked, the client-side JavaScript makes a GET request to `/api/get-binance-trades` (a Vercel serverless function).
3.  The `api/get-binance-trades.js` serverless function:
    *   Retrieves the `BINANCE_API_KEY` and `BINANCE_API_SECRET` from Vercel environment variables.
    *   Constructs the request to the Binance Futures API (`/fapi/v1/userTrades`), including parameters passed from the client (symbol, time range, limit).
    *   Signs the request using HMAC-SHA256 with the API secret.
    *   Sends the request to Binance.
    *   Returns the JSON response from Binance back to the client.
4.  The client-side JavaScript then parses the response and displays the trades in a table.

## Security Note

*   **API Keys:** Your Binance API keys are stored as environment variables on Vercel and are only accessed by the serverless function. They are never exposed directly to the client's browser.
*   **Permissions:** It is critical to use API keys with **read-only** and **futures-enabled** permissions only. Do not grant trading or withdrawal permissions to the API key used by this application.

## Future Improvements (Ideas)

*   [ ] Pagination for fetching more than 1000 trades.
*   [ ] Client-side sorting and more advanced filtering of the displayed trades.
*   [ ] Charting of P&L or trade frequency.
*   [ ] Aggregation of individual fills into "closed positions."
*   [ ] Light/Dark mode toggle persistent with localStorage.

## Contributing

Contributions, issues, and feature requests are welcome! Please feel free to check [issues page](https://github.com/your-username/your-repo-name/issues).

## License

This project is licensed under the ISC License - see the [LICENSE.md](LICENSE.md) file for details (or choose another license like MIT).
*(You'll need to create a LICENSE.md file if you want to specify one. ISC and MIT are common permissive licenses.)*