// AI Insights page logic

let expenses = [];
let currentUser = null;
let forecastChart = null;
let comparisonChart = null;

const moneyTips = [
    { icon: "🏦", text: "Save 20% of your income before spending on wants" },
    { icon: "📱", text: "Use the 24-hour rule before making non-essential purchases" },
    { icon: "🍱", text: "Meal prepping can save up to ₹5000 per month on food" },
    { icon: "🚗", text: "Carpool or use public transport to save on fuel costs" },
    { icon: "💡", text: "Switch off appliances when not in use to save electricity" },
    { icon: "🎬", text: "Share streaming subscriptions with family to save money" },
    { icon: "💳", text: "Use credit cards wisely - pay full balance each month" },
    { icon: "📊", text: "Review your subscriptions monthly - cancel unused ones" },
    { icon: "🛒", text: "Make a shopping list and stick to it to avoid impulse buys" },
    { icon: "💰", text: "Set up automatic transfers to your savings account" }
];

document.addEventListener('DOMContentLoaded', () => {
    currentUser = getCurrentUser();
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }
    
    document.getElementById('user-avatar').textContent = currentUser.initials || 'U';
    expenses = getExpenses();
    
    generateAllInsights();
    renderRandomTips();
});

function generateAllInsights() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const currentMonthExpenses = expenses.filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    
    const lastMonthExpenses = expenses.filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === currentMonth - 1 && d.getFullYear() === currentYear;
    });
    
    const lastYearExpenses = expenses.filter(e => {
        const d = new Date(e.date);
        return d.getFullYear() === currentYear - 1;
    });
    
    const currentTotal = currentMonthExpenses.reduce((s, e) => s + parseFloat(e.amount), 0);
    const lastTotal = lastMonthExpenses.reduce((s, e) => s + parseFloat(e.amount), 0);
    const lastYearTotal = lastYearExpenses.reduce((s, e) => s + parseFloat(e.amount), 0);
    
    const avgMonthlyExpense = expenses.reduce((s, e) => s + parseFloat(e.amount), 0) / Math.max(1, 12);
    const monthlyIncome = currentUser.budget ? currentUser.budget * 1.5 : 7500;
    const savingsRate = Math.max(0, ((monthlyIncome - currentTotal) / monthlyIncome) * 100);
    let aiScore = Math.min(100, Math.max(0, Math.round(50 + (savingsRate * 0.8) + (currentTotal < 5000 ? 10 : 0) - (currentTotal > 15000 ? 15 : 0))));
    
    document.getElementById('ai-score').textContent = aiScore;
    let scoreMessage = "";
    if (aiScore >= 80) scoreMessage = "Excellent! Your finances are in great shape! 🎉";
    else if (aiScore >= 60) scoreMessage = "Good work! Keep tracking to improve further 💪";
    else if (aiScore >= 40) scoreMessage = "Room for improvement. Let's work on savings! 📈";
    else scoreMessage = "Time to take action! Follow our recommendations 🔥";
    document.getElementById('ai-message').textContent = scoreMessage;
    
    const avgMonthly = (expenses.reduce((s, e) => s + parseFloat(e.amount), 0) / Math.max(1, 12)).toFixed(0);
    document.getElementById('avg-monthly').innerHTML = fmt(avgMonthly);
    
    const trendChange = lastTotal ? ((currentTotal - lastTotal) / lastTotal * 100).toFixed(0) : 0;
    const trendElement = document.getElementById('spending-trend');
    trendElement.innerHTML = (trendChange >= 0 ? '↑' : '↓') + Math.abs(trendChange) + '%';
    trendElement.style.color = trendChange > 0 ? '#ef4444' : '#10b981';
    
    const potentialSavings = Math.round(currentTotal * 0.15);
    document.getElementById('potential-savings').innerHTML = fmt(potentialSavings);
    
    const budget = currentUser.budget || 5000;
    const adherence = Math.min(100, Math.max(0, ((budget - currentTotal) / budget) * 100));
    document.getElementById('budget-adherence').innerHTML = Math.max(0, adherence).toFixed(0) + '%';
    
    generateSpendingPattern(currentMonthExpenses, lastMonthExpenses, currentTotal, lastTotal);
    generateRiskDetection(currentMonthExpenses, currentTotal);
    generateSeasonalPattern(expenses);
    generateRecommendations(currentMonthExpenses, currentTotal);
    detectAnomalies(currentMonthExpenses);
    renderCharts(currentMonthExpenses, expenses);
}

function generateSpendingPattern(currentMonthExpenses, lastMonthExpenses, currentTotal, lastTotal) {
    const patternDiv = document.getElementById('pattern-insight');
    const patternBadge = document.getElementById('pattern-badge');
    
    const change = lastTotal ? ((currentTotal - lastTotal) / lastTotal * 100).toFixed(1) : 0;
    
    if (change > 10) {
        patternDiv.innerHTML = `Your spending increased by ${change}% this month. ${getCategoryIncrease(currentMonthExpenses, lastMonthExpenses)}`;
        patternBadge.innerHTML = "⚠️ Warning Trend";
        patternBadge.style.background = "#fef2f2";
        patternBadge.style.color = "#dc2626";
    } else if (change < -5) {
        patternDiv.innerHTML = `Great job! Your spending decreased by ${Math.abs(change)}% compared to last month. Keep it up! 🎉`;
        patternBadge.innerHTML = "✅ Positive Trend";
        patternBadge.style.background = "#f0fdf4";
        patternBadge.style.color = "#10b981";
    } else {
        patternDiv.innerHTML = `Your spending is stable compared to last month. Consistency is key to financial success! 💪`;
        patternBadge.innerHTML = "📊 Stable";
        patternBadge.style.background = "#eef2ff";
        patternBadge.style.color = "#6366f1";
    }
}

function getCategoryIncrease(current, last) {
    const currentCats = {};
    const lastCats = {};
    
    current.forEach(e => { currentCats[e.category] = (currentCats[e.category] || 0) + parseFloat(e.amount); });
    last.forEach(e => { lastCats[e.category] = (lastCats[e.category] || 0) + parseFloat(e.amount); });
    
    let maxIncrease = { category: '', increase: 0 };
    for (const [cat, amount] of Object.entries(currentCats)) {
        const lastAmount = lastCats[cat] || 0;
        const increase = amount - lastAmount;
        if (increase > maxIncrease.increase) {
            maxIncrease = { category: cat, increase: increase };
        }
    }
    
    if (maxIncrease.increase > 500) {
        return `${maxIncrease.category} saw the biggest increase (${fmt(maxIncrease.increase)}). Consider reviewing this category.`;
    }
    return "";
}

function generateRiskDetection(monthExpenses, total) {
    const riskDiv = document.getElementById('risk-insight');
    const riskBadge = document.getElementById('risk-badge');
    
    const highExpenses = monthExpenses.filter(e => parseFloat(e.amount) > 3000);
    const categoryCount = {};
    monthExpenses.forEach(e => { categoryCount[e.category] = (categoryCount[e.category] || 0) + 1; });
    const frequentCategory = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0];
    
    let riskLevel = "low";
    let riskText = "";
    
    if (highExpenses.length > 3) {
        riskLevel = "high";
        riskText = `You have ${highExpenses.length} expenses over ₹3,000 this month. Large purchases can impact savings.`;
    } else if (highExpenses.length > 1) {
        riskLevel = "medium";
        riskText = `${highExpenses.length} large purchases detected. Consider spacing out big expenses.`;
    } else if (frequentCategory && frequentCategory[1] > 15) {
        riskLevel = "medium";
        riskText = `You made ${frequentCategory[1]} transactions in ${frequentCategory[0]}. Many small purchases add up!`;
    } else {
        riskText = "Your spending patterns look healthy. No major risk factors detected. 👍";
    }
    
    riskDiv.innerHTML = riskText;
    
    if (riskLevel === "high") {
        riskBadge.innerHTML = "🔴 High Risk";
        riskBadge.style.background = "#fef2f2";
        riskBadge.style.color = "#dc2626";
    } else if (riskLevel === "medium") {
        riskBadge.innerHTML = "🟡 Medium Risk";
        riskBadge.style.background = "#fffbeb";
        riskBadge.style.color = "#f59e0b";
    } else {
        riskBadge.innerHTML = "🟢 Low Risk";
        riskBadge.style.background = "#f0fdf4";
        riskBadge.style.color = "#10b981";
    }
}

function generateSeasonalPattern(expensesList) {
    const seasonalDiv = document.getElementById('seasonal-insight');
    const seasonalBadge = document.getElementById('seasonal-badge');
    
    const monthlyAverages = {};
    for (let i = 0; i < 12; i++) {
        monthlyAverages[i] = { total: 0, count: 0 };
    }
    
    expensesList.forEach(e => {
        const d = new Date(e.date);
        const month = d.getMonth();
        monthlyAverages[month].total += parseFloat(e.amount);
        monthlyAverages[month].count++;
    });
    
    let highestMonth = 0;
    let highestAmount = 0;
    for (let i = 0; i < 12; i++) {
        if (monthlyAverages[i].total > highestAmount) {
            highestAmount = monthlyAverages[i].total;
            highestMonth = i;
        }
    }
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    if (highestAmount > 0) {
        seasonalDiv.innerHTML = `Your highest spending month is ${monthNames[highestMonth]}. ${getSeasonalAdvice(highestMonth)}`;
        seasonalBadge.innerHTML = `📆 Peak: ${monthNames[highestMonth]}`;
    } else {
        seasonalDiv.innerHTML = "Add more expenses to see seasonal patterns and trends.";
        seasonalBadge.innerHTML = "Insufficient Data";
    }
}

function getSeasonalAdvice(month) {
    if (month === 10 || month === 11) return "Plan your festival budget in advance to avoid overspending.";
    if (month === 2 || month === 3) return "Year-end sales can be tempting. Set a limit before shopping.";
    if (month === 4 || month === 5) return "Summer vacations increase travel costs. Book early for better deals.";
    return "Consider setting aside money monthly for seasonal expenses.";
}

function generateRecommendations(monthExpenses, total) {
    const recList = document.getElementById('recommendations-list');
    const categoryTotals = {};
    monthExpenses.forEach(e => {
        categoryTotals[e.category] = (categoryTotals[e.category] || 0) + parseFloat(e.amount);
    });
    
    const recommendations = [];
    
    if (categoryTotals['🍔 Food'] && categoryTotals['🍔 Food'] > total * 0.3) {
        recommendations.push({
            icon: "🍱",
            title: "Reduce Food Spending",
            description: "Meal planning and cooking at home can reduce food expenses by up to 40%.",
            savings: Math.round(categoryTotals['🍔 Food'] * 0.2)
        });
    }
    
    if (categoryTotals['🛍️ Shopping'] && categoryTotals['🛍️ Shopping'] > 5000) {
        recommendations.push({
            icon: "🛒",
            title: "Shopping Analysis",
            description: "Wait 24 hours before buying non-essentials to avoid impulse purchases.",
            savings: Math.round(categoryTotals['🛍️ Shopping'] * 0.25)
        });
    }
    
    if (categoryTotals['🎮 Entertainment'] && categoryTotals['🎮 Entertainment'] > 2000) {
        recommendations.push({
            icon: "🎬",
            title: "Subscription Audit",
            description: "Review and cancel unused streaming or entertainment subscriptions.",
            savings: Math.round(categoryTotals['🎮 Entertainment'] * 0.3)
        });
    }
    
    if (categoryTotals['🚗 Transport'] && categoryTotals['🚗 Transport'] > 3000) {
        recommendations.push({
            icon: "🚗",
            title: "Transportation Savings",
            description: "Consider public transport or carpooling for daily commute.",
            savings: Math.round(categoryTotals['🚗 Transport'] * 0.25)
        });
    }
    
    if (recommendations.length < 3) {
        recommendations.push({
            icon: "💰",
            title: "Automate Savings",
            description: "Set up auto-transfer to savings on salary day. Start with 10% of income.",
            savings: Math.round(total * 0.1)
        });
    }
    
    if (recommendations.length < 4) {
        recommendations.push({
            icon: "📊",
            title: "Track Daily Spending",
            description: "Users who track daily expenses save 20% more than those who don't.",
            savings: Math.round(total * 0.15)
        });
    }
    
    recList.innerHTML = recommendations.map(rec => `
        <div class="recommendation-item" onclick="applyRecommendation('${rec.title}')">
            <div class="rec-icon">${rec.icon}</div>
            <div class="rec-content">
                <div class="rec-title">${rec.title}</div>
                <div class="rec-description">${rec.description}</div>
                <div class="rec-savings">💡 Potential savings: ${fmt(rec.savings)}/month</div>
            </div>
        </div>
    `).join('');
}

function detectAnomalies(monthExpenses) {
    const anomaliesList = document.getElementById('anomalies-list');
    const anomalies = [];
    
    const avgExpense = monthExpenses.reduce((s, e) => s + parseFloat(e.amount), 0) / Math.max(1, monthExpenses.length);
    const threshold = avgExpense * 2.5;
    
    monthExpenses.forEach(e => {
        if (parseFloat(e.amount) > threshold && parseFloat(e.amount) > 3000) {
            anomalies.push({
                category: e.category,
                amount: e.amount,
                note: e.note,
                date: e.date
            });
        }
    });
    
    const categoryCount = {};
    monthExpenses.forEach(e => {
        categoryCount[e.category] = (categoryCount[e.category] || 0) + 1;
    });
    
    for (const [cat, count] of Object.entries(categoryCount)) {
        if (count > 20) {
            anomalies.push({
                category: cat,
                amount: 0,
                note: `${count} transactions this month`,
                date: null,
                type: 'frequency'
            });
        }
    }
    
    if (anomalies.length === 0) {
        anomaliesList.innerHTML = '<div class="empty-state">✅ No unusual spending detected this month. Great job!</div>';
        return;
    }
    
    anomaliesList.innerHTML = anomalies.slice(0, 5).map(a => `
        <div class="anomaly-item">
            <div class="anomaly-icon">🚨</div>
            <div class="anomaly-content">
                <div class="anomaly-title">${a.type === 'frequency' ? 'High Transaction Frequency' : 'Unusually Large Expense'}</div>
                <div class="anomaly-details">
                    ${a.type === 'frequency' ? 
                        `${a.category}: ${a.note}` : 
                        `${fmtDate(a.date)} - ${a.category}: ${fmt(a.amount)}${a.note ? ` (${a.note})` : ''}`
                    }
                </div>
            </div>
        </div>
    `).join('');
}

function renderCharts(monthExpenses, allExpenses) {
    const monthlyTotals = {};
    for (let i = 0; i < 6; i++) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
        monthlyTotals[key] = 0;
    }
    
    allExpenses.forEach(e => {
        const d = new Date(e.date);
        const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
        if (monthlyTotals.hasOwnProperty(key)) {
            monthlyTotals[key] += parseFloat(e.amount);
        }
    });
    
    const sortedMonths = Object.keys(monthlyTotals).sort();
    const actualData = sortedMonths.map(m => monthlyTotals[m]);
    
    const last3Avg = actualData.slice(-3).reduce((a, b) => a + b, 0) / 3;
    const forecastData = [...actualData, last3Avg, last3Avg * 0.95, last3Avg * 0.9];
    
    const labels = [...sortedMonths.map(m => {
        const [year, month] = m.split('-');
        return new Date(year, month - 1).toLocaleString('default', { month: 'short' });
    }), 'Forecast M1', 'Forecast M2', 'Forecast M3'];
    
    const forecastCtx = document.getElementById('forecast-chart').getContext('2d');
    if (forecastChart) forecastChart.destroy();
    
    forecastChart = new Chart(forecastCtx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Actual Spending',
                    data: [...actualData, null, null, null],
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    tension: 0.4,
                    pointBackgroundColor: '#6366f1'
                },
                {
                    label: 'AI Forecast',
                    data: [...Array(actualData.length).fill(null), ...forecastData.slice(actualData.length)],
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    borderDash: [5, 5],
                    tension: 0.4,
                    pointBackgroundColor: '#f59e0b'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: { tooltip: { callbacks: { label: ctx => fmt(ctx.parsed.y) } } },
            scales: { y: { ticks: { callback: v => fmt(v) } } }
        }
    });
    
    const budget = currentUser.budget || 5000;
    const currentTotal = monthExpenses.reduce((s, e) => s + parseFloat(e.amount), 0);
    
    const comparisonCtx = document.getElementById('comparison-chart').getContext('2d');
    if (comparisonChart) comparisonChart.destroy();
    
    comparisonChart = new Chart(comparisonCtx, {
        type: 'bar',
        data: {
            labels: ['Current Spending', 'Budget Limit'],
            datasets: [{
                label: 'Amount (₹)',
                data: [currentTotal, budget],
                backgroundColor: ['#ef4444', '#10b981'],
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: { tooltip: { callbacks: { label: ctx => fmt(ctx.parsed.y) } } }
        }
    });
}

function renderRandomTips() {
    const tipsList = document.getElementById('tips-list');
    const shuffled = [...moneyTips].sort(() => 0.5 - Math.random());
    const selectedTips = shuffled.slice(0, 4);
    
    tipsList.innerHTML = selectedTips.map(tip => `
        <div class="tip-item">
            <div class="tip-icon">${tip.icon}</div>
            <div class="tip-text">${tip.text}</div>
        </div>
    `).join('');
}

function applyRecommendation(title) {
    toast(`💡 "${title}" - We'll help you implement this! Check back for updates.`);
}

function toggleMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    if (menu) menu.classList.toggle('active');
}

function doLogout() {
    localStorage.removeItem('spendly_user');
    window.location.href = 'index.html';
}