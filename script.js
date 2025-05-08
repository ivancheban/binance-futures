document.addEventListener('DOMContentLoaded', () => {
    // ... (other const declarations remain the same) ...
    const symbolInput = document.getElementById('symbol');
    const startTimeInput = document.getElementById('startTime');
    const endTimeInput = document.getElementById('endTime');
    const limitInput = document.getElementById('limit');
    const fetchTradesBtn = document.getElementById('fetchTradesBtn');
    const tradesTableBody = document.getElementById('tradesTableBody');
    const statusDiv = document.getElementById('status');

    const totalTradesSpan = document.getElementById('totalTrades');
    const totalPnlSpan = document.getElementById('totalPnl');
    const totalCommissionSpan = document.getElementById('totalCommission');
    const commissionAssetSummarySpan = document.getElementById('commissionAssetSummary');


    // Load preferences from localStorage
    if (localStorage.getItem('tradeViewerSymbol')) {
        symbolInput.value = localStorage.getItem('tradeViewerSymbol');
    }
    if (localStorage.getItem('tradeViewerLimit')) {
        limitInput.value = localStorage.getItem('tradeViewerLimit');
    } else {
        limitInput.value = "100"; // Default limit
    }

    fetchTradesBtn.addEventListener('click', fetchTradesViaVercelFunction);

    async function fetchTradesViaVercelFunction() { // Renamed function for clarity
        const symbol = symbolInput.value.trim().toUpperCase();
        const limit = limitInput.value;
        const startTime = startTimeInput.value ? new Date(startTimeInput.value).getTime() : null;
        const endTime = endTimeInput.value ? new Date(endTimeInput.value).getTime() : null;

        // Save preferences to localStorage
        if (symbol) localStorage.setItem('tradeViewerSymbol', symbol);
        else localStorage.removeItem('tradeViewerSymbol');
        localStorage.setItem('tradeViewerLimit', limit);

        showStatus('Fetching trades securely via Vercel...', false);
        tradesTableBody.innerHTML = '';
        updateSummary([], true);

        let queryParams = `limit=${limit}`;
        if (symbol) {
            queryParams += `&symbol=${symbol}`;
        }
        if (startTime) {
            queryParams += `&startTime=${startTime}`;
        }
        if (endTime) {
            queryParams += `&endTime=${endTime}`;
        }

        // Vercel serves functions from the /api path by default
        const functionUrl = `/api/get-binance-trades?${queryParams}`; // <--- UPDATED URL

        try {
            const response = await fetch(functionUrl);
            const data = await response.json();

            if (!response.ok) {
                const errorMessage = data.error || `Request failed with status: ${response.status}`;
                const errorCode = data.code ? ` (Code: ${data.code})` : '';
                throw new Error(`${errorMessage}${errorCode}`);
            }
            
            if (data && Array.isArray(data) && data.length > 0) {
                displayTrades(data);
                showStatus(`Successfully fetched ${data.length} trades.`, false);
            } else if (data && Array.isArray(data) && data.length === 0) {
                showStatus('No trades found for the given criteria.', false);
            } else {
                throw new Error("Received unexpected data format from server.");
            }

        } catch (error) {
            console.error('Error fetching trades:', error);
            showStatus(`Error: ${error.message}`, true);
        }
    }

    // displayTrades, updateSummary, showStatus functions remain the same
    // ... (copy them from your existing script.js)
    function displayTrades(trades) {
        tradesTableBody.innerHTML = ''; // Clear previous just in case
        let runningTotalPnl = 0;
        let runningTotalCommission = 0;
        let commissionAsset = trades.length > 0 ? trades[0].commissionAsset : '';

        trades.forEach(trade => {
            const row = tradesTableBody.insertRow();
            const pnl = parseFloat(trade.realizedPnl);
            const commission = parseFloat(trade.commission);

            runningTotalPnl += pnl;
            if (trade.commissionAsset === commissionAsset || !commissionAsset) {
                runningTotalCommission += commission;
                if (!commissionAsset) commissionAsset = trade.commissionAsset;
            } else {
                console.warn("Mixed commission assets found. Summary might not be fully accurate for commissions.");
            }

            row.insertCell().textContent = new Date(trade.time).toLocaleString();
            row.insertCell().textContent = trade.symbol;
            row.insertCell().textContent = trade.side;
            row.insertCell().textContent = parseFloat(trade.price).toFixed(trade.symbol.endsWith('USDT') || trade.symbol.endsWith('BUSD') ? 2 : 8);
            row.insertCell().textContent = parseFloat(trade.qty);
            row.insertCell().textContent = parseFloat(trade.quoteQty).toFixed(2);
            
            const pnlCell = row.insertCell();
            pnlCell.textContent = pnl.toFixed(2);
            pnlCell.className = pnl >= 0 ? 'positive-pnl' : 'negative-pnl';
            
            row.insertCell().textContent = commission.toFixed(Math.max(2, (commission.toString().split('.')[1] || '').length));
            row.insertCell().textContent = trade.commissionAsset;
            row.insertCell().textContent = `${trade.buyer ? 'Buyer' : 'Seller'}/${trade.maker ? 'Maker' : 'Taker'}`;
            row.insertCell().textContent = trade.orderId;
        });
        updateSummary(trades, false, runningTotalPnl, runningTotalCommission, commissionAsset);
    }
    
    function updateSummary(trades, isEmpty, totalPnl = 0, totalCommission = 0, commissionAsset = 'N/A') {
        if (isEmpty) {
            totalTradesSpan.textContent = 0;
            totalPnlSpan.textContent = '0.00';
            totalPnlSpan.className = '';
            totalCommissionSpan.textContent = '0.00';
            commissionAssetSummarySpan.textContent = '';
        } else {
            totalTradesSpan.textContent = trades.length;
            totalPnlSpan.textContent = totalPnl.toFixed(2);
            totalPnlSpan.className = totalPnl >= 0 ? 'positive-pnl' : 'negative-pnl';
            totalCommissionSpan.textContent = totalCommission.toFixed(4);
            commissionAssetSummarySpan.textContent = commissionAsset;
        }
    }

    function showStatus(message, isError = false) {
        statusDiv.textContent = message;
        statusDiv.className = isError ? 'error' : (message.includes('Fetching') ? 'info' : 'success');
        if (!isError && message.startsWith("Successfully")) {
             setTimeout(() => {
                if (statusDiv.textContent === message) statusDiv.textContent = '';
             }, 5000);
        }
    }
});