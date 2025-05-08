document.addEventListener('DOMContentLoaded', () => {
    const symbolInput = document.getElementById('symbol');
    const startTimeInput = document.getElementById('startTime');
    const endTimeInput = document.getElementById('endTime');
    const limitInput = document.getElementById('limit');
    const fetchTradesBtn = document.getElementById('fetchTradesBtn');
    const tradesTableBody = document.getElementById('tradesTableBody');
    // const statusDiv = document.getElementById('status'); // REMOVED

    const totalTradesSpan = document.getElementById('totalTrades');
    const totalPnlSpan = document.getElementById('totalPnl');
    const totalCommissionSpan = document.getElementById('totalCommission');
    const commissionAssetSummarySpan = document.getElementById('commissionAssetSummary');

    if (localStorage.getItem('tradeViewerSymbol')) {
        symbolInput.value = localStorage.getItem('tradeViewerSymbol');
    }
    if (localStorage.getItem('tradeViewerLimit')) {
        limitInput.value = localStorage.getItem('tradeViewerLimit');
    } else {
        limitInput.value = "100";
    }

    fetchTradesBtn.addEventListener('click', fetchTradesViaVercelFunction);

    async function fetchTradesViaVercelFunction() {
        const symbol = symbolInput.value.trim().toUpperCase();
        const limit = limitInput.value;
        const startTime = startTimeInput.value ? new Date(startTimeInput.value).getTime() : null;
        const endTime = endTimeInput.value ? new Date(endTimeInput.value).getTime() : null;

        if (symbol) localStorage.setItem('tradeViewerSymbol', symbol);
        else localStorage.removeItem('tradeViewerSymbol');
        localStorage.setItem('tradeViewerLimit', limit);

        // showStatus('Fetching trades securely via Vercel...', false); // REMOVED
        console.log('Fetching trades...'); // Optional: keep console log for dev
        tradesTableBody.innerHTML = '';
        updateSummary([], true);

        let queryParams = `limit=${limit}`;
        if (symbol) queryParams += `&symbol=${symbol}`;
        if (startTime) queryParams += `&startTime=${startTime}`;
        if (endTime) queryParams += `&endTime=${endTime}`;

        const functionUrl = `/api/get-binance-trades?${queryParams}`;

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
                // showStatus(`Successfully fetched ${data.length} trades.`, false); // REMOVED
                console.log(`Successfully fetched ${data.length} trades.`); // Optional
            } else if (data && Array.isArray(data) && data.length === 0) {
                // showStatus('No trades found for the given criteria.', false); // REMOVED
                console.log('No trades found for the given criteria.'); // Optional
            } else {
                throw new Error("Received unexpected data format from server.");
            }

        } catch (error) {
            console.error('Error fetching trades:', error.message); // Log full error for debugging
            // showStatus(`Error: ${error.message}`, true); // REMOVED
            // You might want to display errors differently now, e.g., in the summary or a modal
            // For now, errors will only be in the console.
            alert(`Error fetching trades: ${error.message}`); // Simple alert for now
        }
    }

    function displayTrades(trades) {
        tradesTableBody.innerHTML = '';
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

            let direction = trade.side; // Default
            if (trade.side === "BUY") {
                direction = "LONG";
            } else if (trade.side === "SELL") {
                direction = "SHORT";
            }

            row.insertCell().textContent = new Date(trade.time).toLocaleString();
            row.insertCell().textContent = trade.symbol;
            row.insertCell().textContent = direction; // UPDATED
            row.insertCell().textContent = parseFloat(trade.price).toFixed(trade.symbol.endsWith('USDT') || trade.symbol.endsWith('BUSD') ? 2 : 8); // Exec. Price
            row.insertCell().textContent = parseFloat(trade.qty);
            row.insertCell().textContent = parseFloat(trade.quoteQty).toFixed(2);
            
            const pnlCell = row.insertCell();
            pnlCell.textContent = pnl.toFixed(2);
            pnlCell.className = pnl >= 0 ? 'positive-pnl' : 'negative-pnl';
            
            row.insertCell().textContent = commission.toFixed(Math.max(2, (commission.toString().split('.')[1] || '').length));
            row.insertCell().textContent = trade.commissionAsset;
            row.insertCell().textContent = trade.maker ? 'Maker' : 'Taker'; // UPDATED (Role)
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

    // showStatus function has been REMOVED
});