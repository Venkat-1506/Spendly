// Reports & Analytics logic

let expenses = [];
let currentUser = null;
let categoryChart = null;
let trendChart = null;

document.addEventListener('DOMContentLoaded', () => {
    currentUser = getCurrentUser();
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }
    
    document.getElementById('user-avatar').textContent = currentUser.initials || 'U';
    expenses = getExpenses();
    
    const dateRange = document.getElementById('date-range');
    dateRange.addEventListener('change', function() {
        const customDates = document.querySelectorAll('.custom-date');
        if (this.value === 'custom') {
            customDates.forEach(el => el.style.display = 'flex');
        } else {
            customDates.forEach(el => el.style.display = 'none');
        }
    });
    
    generateReport();
});

function generateReport() {
    const dateRange = document.getElementById('date-range').value;
    const categoryFilter = document.getElementById('category-filter').value;
    
    let startDate, endDate;
    
    if (dateRange === 'custom') {
        startDate = new Date(document.getElementById('start-date').value);
        endDate = new Date(document.getElementById('end-date').value);
    } else {
        const range = getDateRange(dateRange);
        startDate = range.startDate;
        endDate = range.endDate;
    }
    
    let filteredExpenses = expenses.filter(e => {
        const date = new Date(e.date);
        return date >= startDate && date <= endDate;
    });
    
    if (categoryFilter !== 'all') {
        filteredExpenses = filteredExpenses.filter(e => e.category === categoryFilter);
    }
    
    updateStats(filteredExpenses, startDate, endDate);
    updateCategoryChart(filteredExpenses);
    updateTrendChart(filteredExpenses, startDate, endDate);
    updateTopCategories(filteredExpenses);
    updateInsights(filteredExpenses, startDate, endDate);
    updateTransactionTable(filteredExpenses);
}

function updateStats(expensesList, startDate, endDate) {
    const total = expensesList.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const days = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1);
    const avgDaily = total / days;
    
    const largest = expensesList.reduce((max, e) => Math.max(max, parseFloat(e.amount)), 0);
    const largestExpense = expensesList.find(e => parseFloat(e.amount) === largest);
    
    document.getElementById('total-spending').innerHTML = fmt(total);
    document.getElementById('avg-daily').innerHTML = fmt(avgDaily);
    document.getElementById('largest-expense').innerHTML = fmt(largest);
    document.getElementById('largest-category').innerHTML = largestExpense ? largestExpense.category : '-';
    document.getElementById('transaction-count').textContent = expensesList.length;
    
    const prevStartDate = new Date(startDate);
    const prevEndDate = new Date(endDate);
    const duration = endDate - startDate;
    prevStartDate.setDate(prevStartDate.getDate() - (duration / (1000 * 60 * 60 * 24)));
    prevEndDate.setDate(prevEndDate.getDate() - (duration / (1000 * 60 * 60 * 24)));
    
    const prevExpenses = expenses.filter(e => {
        const date = new Date(e.date);
        return date >= prevStartDate && date <= prevEndDate;
    });
    const prevTotal = prevExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    
    const totalChange = prevTotal ? ((total - prevTotal) / prevTotal * 100).toFixed(0) : 0;
    const totalTrend = document.getElementById('total-trend');
    if (totalChange > 0) {
        totalTrend.innerHTML = `↑ ${totalChange}% from previous`;
        totalTrend.className = 'stat-trend negative';
    } else if (totalChange < 0) {
        totalTrend.innerHTML = `↓ ${Math.abs(totalChange)}% from previous`;
        totalTrend.className = 'stat-trend positive';
    } else {
        totalTrend.innerHTML = `Same as previous`;
        totalTrend.className = 'stat-trend';
    }
}

function updateCategoryChart(expensesList) {
    const categoryTotals = {};
    expensesList.forEach(e => {
        categoryTotals[e.category] = (categoryTotals[e.category] || 0) + parseFloat(e.amount);
    });
    
    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);
    const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#64748b'];
    
    const ctx = document.getElementById('category-chart').getContext('2d');
    if (categoryChart) categoryChart.destroy();
    
    if (labels.length === 0) {
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '14px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('No data for selected period', 200, 120);
        return;
    }
    
    categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors.slice(0, labels.length),
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            cutout: '60%',
            plugins: {
                legend: { position: 'bottom', labels: { font: { size: 11 } } },
                tooltip: { callbacks: { label: ctx => `${ctx.label}: ${fmt(ctx.parsed)}` } }
            }
        }
    });
}

function updateTrendChart(expensesList, startDate, endDate) {
    const monthlyTotals = {};
    const months = [];
    
    let current = new Date(startDate);
    while (current <= endDate) {
        const key = `${current.getFullYear()}-${current.getMonth() + 1}`;
        months.push(key);
        current.setMonth(current.getMonth() + 1);
    }
    
    expensesList.forEach(e => {
        const d = new Date(e.date);
        const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
        monthlyTotals[key] = (monthlyTotals[key] || 0) + parseFloat(e.amount);
    });
    
    const labels = months.map(m => {
        const [year, month] = m.split('-');
        return new Date(year, month - 1).toLocaleString('default', { month: 'short' });
    });
    const data = months.map(m => monthlyTotals[m] || 0);
    
    const ctx = document.getElementById('trend-chart').getContext('2d');
    if (trendChart) trendChart.destroy();
    
    if (data.length === 0 || data.every(v => v === 0)) {
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '14px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('No trend data available', 200, 120);
        return;
    }
    
    trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Monthly Spending',
                data: data,
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#6366f1',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                tooltip: { callbacks: { label: ctx => `Total: ${fmt(ctx.parsed.y)}` } }
            },
            scales: {
                y: { ticks: { callback: v => fmt(v) } }
            }
        }
    });
}

function updateTopCategories(expensesList) {
    const categoryTotals = {};
    expensesList.forEach(e => {
        categoryTotals[e.category] = (categoryTotals[e.category] || 0) + parseFloat(e.amount);
    });
    
    const sorted = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
    const total = sorted.reduce((sum, [_, val]) => sum + val, 0);
    
    const container = document.getElementById('top-categories-list');
    
    if (sorted.length === 0) {
        container.innerHTML = '<div class="empty-state">No spending data available</div>';
        return;
    }
    
    const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#64748b'];
    
    container.innerHTML = sorted.slice(0, 10).map(([category, amount], index) => {
        const percent = (amount / total * 100).toFixed(1);
        return `
            <div class="category-item">
                <div class="category-color" style="background: ${colors[index % colors.length]};"></div>
                <div class="category-name">${category}</div>
                <div class="category-amount">${fmt(amount)}</div>
                <div class="category-percent">${percent}%</div>
            </div>
        `;
    }).join('');
}

function updateInsights(expensesList, startDate, endDate) {
    const total = expensesList.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const days = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1);
    const avgDaily = total / days;
    
    let patternText = '';
    if (avgDaily > 1000) {
        patternText = `You're spending ₹${Math.round(avgDaily)} per day. Consider tracking small expenses.`;
    } else if (avgDaily > 500) {
        patternText = `Your daily spending is moderate. Good job keeping it under control!`;
    } else {
        patternText = `Excellent! You're spending less than ₹500 per day on average.`;
    }
    document.getElementById('pattern-insight').textContent = patternText;
    
    const categoryTotals = {};
    expensesList.forEach(e => {
        categoryTotals[e.category] = (categoryTotals[e.category] || 0) + parseFloat(e.amount);
    });
    const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
    
    let alertText = '';
    if (topCategory && topCategory[1] > total * 0.4) {
        alertText = `${topCategory[0]} accounts for ${Math.round(topCategory[1] / total * 100)}% of your spending. Consider reducing it.`;
    } else {
        alertText = `Your spending is well distributed across categories. Great balance!`;
    }
    document.getElementById('alert-insight').textContent = alertText;
    
    const savingsPotential = Math.round(total * 0.15);
    if (savingsPotential > 1000) {
        document.getElementById('savings-insight').innerHTML = `You could save approximately ${fmt(savingsPotential)} by reducing discretionary spending.`;
    } else {
        document.getElementById('savings-insight').innerHTML = `You're doing great! Keep tracking to maintain this momentum.`;
    }
}

function updateTransactionTable(expensesList) {
    const tbody = document.getElementById('report-tbody');
    const count = document.getElementById('entry-count');
    
    count.textContent = expensesList.length + ' entr' + (expensesList.length === 1 ? 'y' : 'ies');
    
    if (expensesList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4"><div class="empty-state">No transactions found</div></td></tr>`;
        return;
    }
    
    const sorted = [...expensesList].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    tbody.innerHTML = sorted.map(e => `
        <tr>
            <td>${fmtDate(e.date)}</td>
            <td><span class="badge" style="background: #eef2ff; color: #6366f1;">${e.category}</span></td>
            <td>${escapeHtml(e.note || '-')}</td>
            <td class="amount-negative">-${fmt(e.amount)}</td>
        </tr>
    `).join('');
}

function resetFilters() {
    document.getElementById('date-range').value = 'this-month';
    document.getElementById('category-filter').value = 'all';
    document.getElementById('start-date').value = '';
    document.getElementById('end-date').value = '';
    document.querySelectorAll('.custom-date').forEach(el => el.style.display = 'none');
    generateReport();
    toast('Filters reset');
}

function exportToCSV() {
    const dateRange = document.getElementById('date-range').value;
    const categoryFilter = document.getElementById('category-filter').value;
    
    let startDate, endDate;
    if (dateRange === 'custom') {
        startDate = new Date(document.getElementById('start-date').value);
        endDate = new Date(document.getElementById('end-date').value);
    } else {
        const range = getDateRange(dateRange);
        startDate = range.startDate;
        endDate = range.endDate;
    }
    
    let filteredExpenses = expenses.filter(e => {
        if (!e.date) return false;
        const date = new Date(e.date);
        return date >= startDate && date <= endDate;
    });
    
    if (categoryFilter !== 'all') {
        filteredExpenses = filteredExpenses.filter(e => e.category === categoryFilter);
    }
    
    if (filteredExpenses.length === 0) {
        toast('No data to export');
        return;
    }
    
    const sortedExpenses = [...filteredExpenses].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    const headers = ['Sl No', 'Date', 'Category', 'Note', 'Amount (₹)'];
    
    const rows = sortedExpenses.map((e, index) => {
        let formattedDate = 'N/A';
        if (e.date) {
            const dateObj = new Date(e.date);
            if (!isNaN(dateObj.getTime())) {
                const day = dateObj.getDate().toString().padStart(2, '0');
                const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
                const year = dateObj.getFullYear();
                formattedDate = `${day}/${month}/${year}`;
            }
        }
        
        return [
            index + 1,
            formattedDate,
            e.category || '',
            `"${(e.note || '').replace(/"/g, '""')}"`,
            e.amount || '0'
        ];
    });
    
    let csvContent = headers.join(',') + '\n';
    rows.forEach(row => {
        csvContent += row.join(',') + '\n';
    });
    
    const totalAmount = sortedExpenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    const periodStart = startDate.toLocaleDateString('en-IN');
    const periodEnd = endDate.toLocaleDateString('en-IN');
    const exportDateTime = new Date().toLocaleString('en-IN');
    
    csvContent += '\n';
    csvContent += `"Total Expenses",,,,,${totalAmount}\n`;
    csvContent += `"Total Transactions",,,,,${sortedExpenses.length}\n`;
    csvContent += `"Period",,,,,"${periodStart} to ${periodEnd}"\n`;
    csvContent += `"Export Date",,,,,"${exportDateTime}"\n`;
    
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spendly_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast('CSV exported successfully');
}

function exportToPDF() {
    toast('PDF export will be available in Pro version');
}

function toggleMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    if (menu) menu.classList.toggle('active');
}

function doLogout() {
    localStorage.removeItem('spendly_user');
    window.location.href = 'index.html';
}