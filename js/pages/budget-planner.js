// ================================================
// BUDGET PLANNER PAGE LOGIC
// ================================================

let categoryBudgets = [];
let totalBudget = 0;
let currentUser = null;
let expenses = [];
let trendChart = null;

// ================================================
// INITIALIZATION
// ================================================

document.addEventListener('DOMContentLoaded', () => {
    currentUser = getCurrentUser();
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }
    
    const userAvatar = document.getElementById('user-avatar');
    if (userAvatar) userAvatar.textContent = currentUser.initials || 'U';
    
    loadData();
    renderAll();
});

function loadData() {
    categoryBudgets = getBudgets();
    totalBudget = getTotalBudget();
    expenses = getExpenses();
}

function saveData() {
    saveBudgets(categoryBudgets);
    saveTotalBudget(totalBudget);
}

// ================================================
// DATA HELPERS
// ================================================

function getCurrentMonthExpenses() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    return expenses.filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
}

function getCategorySpending() {
    const monthlyExpenses = getCurrentMonthExpenses();
    const categorySpending = {};
    monthlyExpenses.forEach(e => {
        categorySpending[e.category] = (categorySpending[e.category] || 0) + parseFloat(e.amount);
    });
    return categorySpending;
}

// ================================================
// RENDER FUNCTIONS
// ================================================

function renderAll() {
    const monthlyExpenses = getCurrentMonthExpenses();
    const totalSpent = monthlyExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const remaining = totalBudget - totalSpent;
    const percentage = (totalSpent / totalBudget) * 100;
    
    // Update main stats
    const totalSpentEl = document.getElementById('total-spent');
    const totalRemainingEl = document.getElementById('total-remaining');
    const budgetPercentageEl = document.getElementById('budget-percentage');
    const percentageStatusEl = document.getElementById('percentage-status');
    
    if (totalSpentEl) totalSpentEl.innerHTML = fmt(totalSpent);
    if (totalRemainingEl) totalRemainingEl.innerHTML = fmt(Math.max(0, remaining));
    if (budgetPercentageEl) budgetPercentageEl.innerHTML = percentage.toFixed(1) + '%';
    
    if (percentageStatusEl) {
        if (percentage > 90) {
            percentageStatusEl.innerHTML = '⚠️ Critical';
            percentageStatusEl.style.color = '#ef4444';
        } else if (percentage > 70) {
            percentageStatusEl.innerHTML = '⚠️ High';
            percentageStatusEl.style.color = '#f59e0b';
        } else {
            percentageStatusEl.innerHTML = '✅ On Track';
            percentageStatusEl.style.color = '#10b981';
        }
    }
    
    // Update main budget card
    const totalBudgetDisplay = document.getElementById('total-budget-display');
    const mainSpent = document.getElementById('main-spent');
    const mainRemaining = document.getElementById('main-remaining');
    const mainProgressBar = document.getElementById('main-progress-bar');
    const savingsRateEl = document.getElementById('savings-rate');
    const spentChangeEl = document.getElementById('spent-change');
    
    if (totalBudgetDisplay) totalBudgetDisplay.innerHTML = fmt(totalBudget);
    if (mainSpent) mainSpent.innerHTML = fmt(totalSpent);
    if (mainRemaining) mainRemaining.innerHTML = fmt(Math.max(0, remaining));
    if (mainProgressBar) mainProgressBar.style.width = Math.min(percentage, 100) + '%';
    
    // Savings rate calculation
    const estimatedIncome = totalBudget * 2;
    const savingsRateVal = ((estimatedIncome - totalSpent) / estimatedIncome) * 100;
    if (savingsRateEl) savingsRateEl.innerHTML = Math.max(0, savingsRateVal).toFixed(0) + '%';
    
    // Month-over-month change
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastMonthExpenses = expenses.filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === lastMonth.getMonth() && d.getFullYear() === lastMonth.getFullYear();
    });
    const lastMonthTotal = lastMonthExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const change = lastMonthTotal ? ((totalSpent - lastMonthTotal) / lastMonthTotal * 100).toFixed(0) : 0;
    
    if (spentChangeEl) {
        if (change > 0) {
            spentChangeEl.innerHTML = `↑ ${change}% vs last month`;
            spentChangeEl.style.color = '#ef4444';
        } else if (change < 0) {
            spentChangeEl.innerHTML = `↓ ${Math.abs(change)}% vs last month`;
            spentChangeEl.style.color = '#10b981';
        } else {
            spentChangeEl.innerHTML = `same as last month`;
            spentChangeEl.style.color = '#64748b';
        }
    }
    
    renderCategoryBudgets();
    renderTrendChart();
    renderAlerts();
}

function renderCategoryBudgets() {
    const container = document.getElementById('category-budgets-list');
    if (!container) return;
    
    const categorySpending = getCategorySpending();
    
    if (categoryBudgets.length === 0) {
        container.innerHTML = `<div class="empty-state">
            <div class="empty-state-icon">📂</div>
            <p>No category budgets set yet</p>
            <button class="btn btn-primary btn-sm" onclick="openBudgetModal()">Create your first budget</button>
        </div>`;
        return;
    }
    
    container.innerHTML = categoryBudgets.map(budget => {
        const spent = categorySpending[budget.category] || 0;
        const percentage = (spent / budget.amount) * 100;
        const remaining = budget.amount - spent;
        let statusClass = '';
        
        if (spent > budget.amount) {
            statusClass = 'over-budget';
        } else if (percentage >= 90) {
            statusClass = 'warning';
        }
        
        let fillColor = '#10b981';
        if (percentage >= 100) fillColor = '#ef4444';
        else if (percentage >= 90) fillColor = '#f59e0b';
        else if (percentage >= 70) fillColor = '#fbbf24';
        
        return `
            <div class="category-budget-card ${statusClass}">
                <div class="card-header">
                    <div class="category-info">
                        <div class="category-icon">${budget.category.charAt(0)}</div>
                        <div class="category-name">${budget.category}</div>
                    </div>
                    <div class="card-actions">
                        <button class="icon-btn edit" onclick="editBudget('${budget.category}')" title="Edit">✏️</button>
                        <button class="icon-btn delete" onclick="deleteBudget('${budget.category}')" title="Delete">🗑️</button>
                    </div>
                </div>
                <div class="budget-numbers">
                    <div class="spent-row">
                        <span>Spent this month</span>
                        <span class="spent-amount">${fmt(spent)}</span>
                    </div>
                    <div class="limit-row">
                        <span>Monthly limit</span>
                        <span>${fmt(budget.amount)}</span>
                    </div>
                </div>
                <div class="progress-bar-small">
                    <div class="progress-fill-small" style="width: ${Math.min(percentage, 100)}%; background: ${fillColor};"></div>
                </div>
                <div class="remaining-info ${remaining < 0 ? 'negative' : ''}">
                    ${remaining >= 0 ? `${fmt(remaining)} remaining` : `Over by ${fmt(Math.abs(remaining))}`}
                </div>
            </div>
        `;
    }).join('');
}

function renderTrendChart() {
    const monthlyData = {};
    expenses.forEach(e => {
        const d = new Date(e.date);
        const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
        monthlyData[key] = (monthlyData[key] || 0) + parseFloat(e.amount);
    });
    
    const sortedMonths = Object.keys(monthlyData).sort().slice(-6);
    const data = sortedMonths.map(m => monthlyData[m]);
    const labels = sortedMonths.map(m => {
        const [year, month] = m.split('-');
        return new Date(year, month - 1).toLocaleString('default', { month: 'short' });
    });
    
    const ctx = document.getElementById('trend-chart');
    if (!ctx) return;
    
    const canvasCtx = ctx.getContext('2d');
    if (trendChart) trendChart.destroy();
    
    if (labels.length === 0) {
        canvasCtx.fillStyle = '#cbd5e1';
        canvasCtx.font = '14px Inter';
        canvasCtx.textAlign = 'center';
        canvasCtx.fillText('Add expenses to see trends', ctx.width/2, ctx.height/2);
        return;
    }
    
    trendChart = new Chart(canvasCtx, {
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
                pointBorderColor: 'white',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { position: 'top' },
                tooltip: { callbacks: { label: ctx => `Total: ${fmt(ctx.parsed.y)}` } }
            },
            scales: {
                y: { ticks: { callback: v => fmt(v) } }
            }
        }
    });
}

function renderAlerts() {
    const categorySpending = getCategorySpending();
    const alerts = [];
    const monthlyExpenses = getCurrentMonthExpenses();
    const totalSpent = monthlyExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const percentage = (totalSpent / totalBudget) * 100;
    
    // Total budget alerts
    if (percentage >= 100) {
        alerts.push({ type: 'danger', icon: '🔴', title: 'Budget Exceeded!', message: `You've exceeded your total budget by ${fmt(totalSpent - totalBudget)}` });
    } else if (percentage >= 90) {
        alerts.push({ type: 'warning', icon: '⚠️', title: 'Budget Alert', message: `You've used ${percentage.toFixed(0)}% of your total budget. Only ${fmt(totalBudget - totalSpent)} remaining!` });
    }
    
    // Category budget alerts
    categoryBudgets.forEach(budget => {
        const spent = categorySpending[budget.category] || 0;
        const pct = (spent / budget.amount) * 100;
        if (spent > budget.amount) {
            alerts.push({ type: 'danger', icon: '🔴', title: `${budget.category} Over Budget`, message: `Exceeded by ${fmt(spent - budget.amount)}` });
        } else if (pct >= 90) {
            alerts.push({ type: 'warning', icon: '⚠️', title: `${budget.category} Alert`, message: `Used ${pct.toFixed(0)}% of ${budget.category} budget` });
        }
    });
    
    const alertsSection = document.getElementById('alerts-section');
    const alertsList = document.getElementById('alerts-list');
    
    if (!alertsSection || !alertsList) return;
    
    if (alerts.length === 0) {
        alertsSection.style.display = 'none';
        return;
    }
    
    alertsSection.style.display = 'block';
    alertsList.innerHTML = alerts.map(alert => `
        <div class="alert-item ${alert.type}">
            <div class="alert-icon">${alert.icon}</div>
            <div class="alert-content">
                <div class="alert-title">${alert.title}</div>
                <div class="alert-message">${alert.message}</div>
            </div>
        </div>
    `).join('');
}

// ================================================
// BUDGET CRUD OPERATIONS
// ================================================

function openBudgetModal() {
    const modalTitle = document.getElementById('budget-modal-title');
    const categorySelect = document.getElementById('budget-category');
    const amountInput = document.getElementById('budget-amount');
    const modal = document.getElementById('budget-modal');
    
    if (modalTitle) modalTitle.textContent = 'Set Category Budget';
    if (categorySelect) categorySelect.value = '🍔 Food';
    if (amountInput) amountInput.value = '';
    if (modal) modal.classList.add('open');
}

function closeBudgetModal() {
    const modal = document.getElementById('budget-modal');
    if (modal) modal.classList.remove('open');
}

function saveCategoryBudget() {
    const category = document.getElementById('budget-category')?.value;
    const amount = parseFloat(document.getElementById('budget-amount')?.value);
    
    if (!category || !amount || amount <= 0) {
        toast('Please enter a valid amount');
        return;
    }
    
    const existing = categoryBudgets.findIndex(b => b.category === category);
    if (existing !== -1) {
        categoryBudgets[existing].amount = amount;
    } else {
        categoryBudgets.push({ category, amount });
    }
    
    saveData();
    closeBudgetModal();
    renderAll();
    toast('Budget saved successfully');
}

function editBudget(category) {
    const budget = categoryBudgets.find(b => b.category === category);
    if (budget) {
        const modalTitle = document.getElementById('budget-modal-title');
        const categorySelect = document.getElementById('budget-category');
        const amountInput = document.getElementById('budget-amount');
        const modal = document.getElementById('budget-modal');
        
        if (modalTitle) modalTitle.textContent = 'Edit Category Budget';
        if (categorySelect) categorySelect.value = budget.category;
        if (amountInput) amountInput.value = budget.amount;
        if (modal) modal.classList.add('open');
    }
}

function deleteBudget(category) {
    if (confirm(`Delete budget for ${category}?`)) {
        categoryBudgets = categoryBudgets.filter(b => b.category !== category);
        saveData();
        renderAll();
        toast('Budget deleted');
    }
}

function editTotalBudget() {
    const newBudget = prompt('Enter your total monthly budget (₹):', totalBudget);
    if (newBudget && !isNaN(newBudget) && parseFloat(newBudget) > 0) {
        totalBudget = parseFloat(newBudget);
        saveData();
        renderAll();
        toast('Total budget updated');
    }
}

// ================================================
// UTILITY FUNCTIONS
// ================================================

function toggleMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    if (menu) menu.classList.toggle('active');
}

function doLogout() {
    localStorage.removeItem('spendly_user');
    window.location.href = 'index.html';
}

// Close mobile menu when clicking outside
document.addEventListener('click', function(event) {
    const menu = document.getElementById('mobileMenu');
    const menuBtn = document.querySelector('.mobile-menu-btn');
    if (menu && menu.classList.contains('active')) {
        if (!menu.contains(event.target) && !menuBtn?.contains(event.target)) {
            menu.classList.remove('active');
        }
    }
});

// ================================================
// EXPORT TO GLOBAL SCOPE
// ================================================

window.openBudgetModal = openBudgetModal;
window.closeBudgetModal = closeBudgetModal;
window.saveCategoryBudget = saveCategoryBudget;
window.editBudget = editBudget;
window.deleteBudget = deleteBudget;
window.editTotalBudget = editTotalBudget;
window.toggleMobileMenu = toggleMobileMenu;
window.doLogout = doLogout;