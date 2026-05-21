// ================================================
// DASHBOARD PAGE LOGIC
// ================================================

let expenses = [];
let currentUser = null;
let chart = null;
let editId = null;
let currentFilters = { category: 'all', startDate: '', endDate: '' };

// ================================================
// INITIALIZATION
// ================================================

document.addEventListener('DOMContentLoaded', () => {
    currentUser = getCurrentUser();
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }
    
    // Load expenses
    expenses = getExpenses();
    
    // Set user avatar
    const userAvatar = document.getElementById('user-avatar');
    if (userAvatar) userAvatar.textContent = currentUser.initials || 'U';
    
    // Set user name if exists
    const userName = document.getElementById('user-name');
    if (userName) userName.textContent = currentUser.name;
    
    // Set greeting
    const greet = getGreeting();
    const dashGreeting = document.getElementById('dash-greeting');
    if (dashGreeting) dashGreeting.textContent = greet + ', ' + (currentUser.name?.split(' ')[0] || 'User') + ' 👋';
    
    // Initialize date filters for current month
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    
    const startDateInput = document.getElementById('filter-start-date');
    const endDateInput = document.getElementById('filter-end-date');
    
    if (startDateInput) startDateInput.value = firstDay;
    if (endDateInput) endDateInput.value = lastDay;
    
    currentFilters.startDate = firstDay;
    currentFilters.endDate = lastDay;
    
    // Setup category filter change listener
    const categoryFilter = document.getElementById('filter-category');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', applyFilters);
    }
    
    // Render all dashboard components
    renderAll();
});

function renderAll() {
    renderStats();
    renderChart();
    renderRecent();
    renderTable();
}

// ================================================
// STATISTICS RENDERING
// ================================================

function renderStats() {
    // Apply filters to expenses for stats
    let filteredExpenses = filterExpenses(expenses);
    
    const total = filteredExpenses.reduce((s, e) => s + Number(e.amount), 0);
    
    // Current month expenses
    const now = new Date();
    const m = now.getMonth(), y = now.getFullYear();
    const monthExpenses = filteredExpenses.filter(e => { 
        const d = new Date(e.date); 
        return d.getMonth() === m && d.getFullYear() === y; 
    });
    const monthTotal = monthExpenses.reduce((s, e) => s + Number(e.amount), 0);
    
    const budget = currentUser?.budget || 15000;
    const remaining = budget - monthTotal;
    
    // Calculate monthly average from all time
    const monthlyTotals = {};
    filteredExpenses.forEach(e => {
        const d = new Date(e.date);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        monthlyTotals[key] = (monthlyTotals[key] || 0) + Number(e.amount);
    });
    const monthKeys = Object.keys(monthlyTotals);
    const avgMonthly = monthKeys.length > 0 ? Object.values(monthlyTotals).reduce((a, b) => a + b, 0) / monthKeys.length : 0;
    
    // Calculate trend vs last month
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastMonthExpenses = filteredExpenses.filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === lastMonth.getMonth() && d.getFullYear() === lastMonth.getFullYear();
    });
    const lastMonthTotal = lastMonthExpenses.reduce((s, e) => s + Number(e.amount), 0);
    const change = lastMonthTotal ? ((monthTotal - lastMonthTotal) / lastMonthTotal * 100).toFixed(0) : 0;
    
    // Update DOM
    const statTotal = document.getElementById('stat-total');
    if (statTotal) statTotal.textContent = fmt(total);
    
    const statTotalSub = document.getElementById('stat-total-sub');
    if (statTotalSub) statTotalSub.textContent = filteredExpenses.length + ' transactions';
    
    const statMonth = document.getElementById('stat-month');
    if (statMonth) statMonth.textContent = fmt(monthTotal);
    
    const statMonthSub = document.getElementById('stat-month-sub');
    if (statMonthSub) {
        statMonthSub.innerHTML = new Date().toLocaleString('default', {month: 'long', year: 'numeric'});
        if (change > 0) {
            statMonthSub.innerHTML += `<span style="color: #ef4444; margin-left: 8px;">↑ ${change}% vs last month</span>`;
        } else if (change < 0) {
            statMonthSub.innerHTML += `<span style="color: #10b981; margin-left: 8px;">↓ ${Math.abs(change)}% vs last month</span>`;
        }
    }
    
    const statRemaining = document.getElementById('stat-remaining');
    if (statRemaining) statRemaining.textContent = fmt(Math.max(0, remaining));
    
    const statRemainingSub = document.getElementById('stat-remaining-sub');
    if (statRemainingSub) statRemainingSub.innerHTML = 'of ' + fmt(budget) + ' budget';
    
    const statAvg = document.getElementById('stat-avg');
    if (statAvg) statAvg.textContent = fmt(avgMonthly);
}

// ================================================
// CHART RENDERING
// ================================================

function renderChart() {
    let filteredExpenses = filterExpenses(expenses);
    
    const now = new Date();
    const m = now.getMonth(), y = now.getFullYear();
    const monthExpenses = filteredExpenses.filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === m && d.getFullYear() === y;
    });
    
    const cats = {};
    monthExpenses.forEach(e => { cats[e.category] = (cats[e.category]||0) + Number(e.amount); });
    const labels = Object.keys(cats);
    const data = Object.values(cats);
    const colors = labels.map(l => CAT_COLORS[l] || '#cbd5e1');
    
    const ctx = document.getElementById('expenseChart');
    if (!ctx) return;
    
    const canvasCtx = ctx.getContext('2d');
    if (chart) chart.destroy();
    
    if (!labels.length) {
        canvasCtx.clearRect(0, 0, ctx.width, ctx.height);
        canvasCtx.font = '14px Inter';
        canvasCtx.fillStyle = '#9ca3af';
        canvasCtx.textAlign = 'center';
        canvasCtx.fillText('Add expenses to see chart', ctx.width/2, ctx.height/2);
        return;
    }
    
    chart = new Chart(canvasCtx, {
        type: 'doughnut',
        data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 3, borderColor: '#fff', hoverOffset: 6 }] },
        options: {
            responsive: true, 
            maintainAspectRatio: false, 
            cutout: '68%',
            plugins: {
                legend: { position: 'bottom', labels: { font: { family: 'Inter', size: 12 }, padding: 16, usePointStyle: true, pointStyle: 'circle' } },
                tooltip: { callbacks: { label: function(context) {
                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                    const percentage = ((context.parsed / total) * 100).toFixed(1);
                    return ` ${context.label}: ${fmt(context.parsed)} (${percentage}%)`;
                } } }
            }
        }
    });
}

// ================================================
// RECENT TRANSACTIONS
// ================================================

function renderRecent() {
    const list = document.getElementById('recent-list');
    if (!list) return;
    
    let filteredExpenses = filterExpenses(expenses);
    const recent = [...filteredExpenses].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
    
    if (!recent.length) {
        list.innerHTML = `<div class="empty-transactions">
            <div class="empty-transactions-icon">📭</div>
            <p>No transactions yet</p>
            <button class="btn btn-primary btn-sm" onclick="openModal()">Add your first expense</button>
        </div>`;
        return;
    }
    
    list.innerHTML = recent.map(e => `
        <div class="recent-item">
            <div class="recent-icon">${e.category?.split(' ')[0] || '💰'}</div>
            <div class="recent-info">
                <div class="recent-name">${escapeHtml(e.note || e.category)}</div>
                <div class="recent-date">${fmtDate(e.date)}</div>
            </div>
            <div class="recent-amount">-${fmt(e.amount)}</div>
        </div>
    `).join('');
}

// ================================================
// EXPENSES TABLE
// ================================================

function renderTable() {
    const tbody = document.getElementById('expense-tbody');
    const count = document.getElementById('entry-count');
    if (!tbody) return;
    
    let filteredExpenses = filterExpenses(expenses);
    
    if (count) count.textContent = filteredExpenses.length + ' entr' + (filteredExpenses.length === 1 ? 'y' : 'ies');
    
    if (!filteredExpenses.length) {
        tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state">No expenses found</div></td></tr>`;
        return;
    }
    
    const sorted = filteredExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));
    tbody.innerHTML = sorted.map(e => `
        <tr>
            <td style="color:var(--text-light);font-size:.8rem">${fmtDate(e.date)}</td>
            <td><span class="badge" style="background:${CAT_BG[e.category] || '#f1f5f9'};color:${CAT_COLORS[e.category] || '#64748b'}">${escapeHtml(e.category)}</span></td>
            <td style="color:var(--text-light)">${escapeHtml(e.note || '—')}</td>
            <td style="font-weight:700;color:var(--danger)">-${fmt(e.amount)}</td>
            <td>
                <div class="table-actions">
                    <button class="icon-btn edit" onclick="editExpense('${e.id}')" title="Edit">✏️</button>
                    <button class="icon-btn del" onclick="deleteExpense('${e.id}')" title="Delete">🗑️</button>
                </div>
            </td>
        </tr>
    `).join('');
}

// ================================================
// FILTER FUNCTIONS
// ================================================

function filterExpenses(expensesList) {
    let filtered = [...expensesList];
    
    if (currentFilters.category && currentFilters.category !== 'all') {
        filtered = filtered.filter(e => e.category === currentFilters.category);
    }
    if (currentFilters.startDate) {
        filtered = filtered.filter(e => e.date >= currentFilters.startDate);
    }
    if (currentFilters.endDate) {
        filtered = filtered.filter(e => e.date <= currentFilters.endDate);
    }
    
    return filtered;
}

function applyFilters() {
    const categorySelect = document.getElementById('filter-category');
    const startDateInput = document.getElementById('filter-start-date');
    const endDateInput = document.getElementById('filter-end-date');
    
    if (categorySelect) currentFilters.category = categorySelect.value;
    if (startDateInput) currentFilters.startDate = startDateInput.value;
    if (endDateInput) currentFilters.endDate = endDateInput.value;
    
    renderAll();
    toast('Filters applied');
}

function resetFilters() {
    const categorySelect = document.getElementById('filter-category');
    if (categorySelect) categorySelect.value = 'all';
    
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    
    const startDateInput = document.getElementById('filter-start-date');
    const endDateInput = document.getElementById('filter-end-date');
    
    if (startDateInput) startDateInput.value = firstDay;
    if (endDateInput) endDateInput.value = lastDay;
    
    currentFilters = { category: 'all', startDate: firstDay, endDate: lastDay };
    renderAll();
    toast('Filters reset');
}

// ================================================
// EXPORT FUNCTIONS
// ================================================

function exportToCSV() {
    let exportExpenses = filterExpenses(expenses);
    
    if (exportExpenses.length === 0) {
        toast('No expenses to export');
        return;
    }
    
    const headers = ['Date', 'Category', 'Note', 'Amount (₹)'];
    const rows = exportExpenses.map(e => [e.date, e.category, e.note || '', e.amount]);
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spendly_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast('CSV exported successfully');
}

function exportDashboardToPDF() {
    toast('PDF export feature coming soon!');
}

// ================================================
// EXPENSE CRUD OPERATIONS
// ================================================

function openModal() {
    editId = null;
    const modalTitle = document.getElementById('modal-title');
    if (modalTitle) modalTitle.textContent = 'Add Expense';
    
    const amountInput = document.getElementById('f-amount');
    const categorySelect = document.getElementById('f-category');
    const dateInput = document.getElementById('f-date');
    const noteInput = document.getElementById('f-note');
    
    if (amountInput) amountInput.value = '';
    if (categorySelect) categorySelect.value = '';
    if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
    if (noteInput) noteInput.value = '';
    
    const modal = document.getElementById('modal-overlay');
    if (modal) modal.classList.add('open');
}

function closeModal() {
    const modal = document.getElementById('modal-overlay');
    if (modal) modal.classList.remove('open');
    editId = null;
}

function handleOverlayClick(e) {
    if (e.target === document.getElementById('modal-overlay')) closeModal();
}

function saveExpense() {
    const amountInput = document.getElementById('f-amount');
    const categorySelect = document.getElementById('f-category');
    const dateInput = document.getElementById('f-date');
    const noteInput = document.getElementById('f-note');
    
    const amount = parseFloat(amountInput?.value);
    const category = categorySelect?.value;
    const date = dateInput?.value;
    const note = noteInput?.value.trim();
    
    if (!amount || amount <= 0) { toast('Please enter a valid amount'); return; }
    if (!category) { toast('Please select a category'); return; }
    if (!date) { toast('Please select a date'); return; }
    
    if (editId) {
        const index = expenses.findIndex(e => e.id === editId);
        if (index !== -1) {
            expenses[index] = { ...expenses[index], amount: amount.toFixed(2), category, date, note };
            toast('Expense updated ✓');
        }
    } else {
        const newExpense = { id: generateId(), amount: amount.toFixed(2), category, date, note };
        expenses.push(newExpense);
        toast('Expense added ✓');
    }
    
    saveExpenses(expenses);
    closeModal();
    renderAll();
}

function editExpense(id) {
    const expense = expenses.find(e => e.id === id);
    if (expense) {
        editId = id;
        const modalTitle = document.getElementById('modal-title');
        if (modalTitle) modalTitle.textContent = 'Edit Expense';
        
        const amountInput = document.getElementById('f-amount');
        const categorySelect = document.getElementById('f-category');
        const dateInput = document.getElementById('f-date');
        const noteInput = document.getElementById('f-note');
        
        if (amountInput) amountInput.value = expense.amount;
        if (categorySelect) categorySelect.value = expense.category;
        if (dateInput) dateInput.value = expense.date;
        if (noteInput) noteInput.value = expense.note || '';
        
        const modal = document.getElementById('modal-overlay');
        if (modal) modal.classList.add('open');
    }
}

function deleteExpense(id) {
    if (confirm('Are you sure you want to delete this expense?')) {
        expenses = expenses.filter(e => e.id !== id);
        saveExpenses(expenses);
        renderAll();
        toast('Expense removed');
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
// At the end of your DOMContentLoaded function in dashboard.js, add:
updateUserDropdown();
// ================================================
// EXPORT TO GLOBAL SCOPE
// ================================================

window.applyFilters = applyFilters;
window.resetFilters = resetFilters;
window.exportToCSV = exportToCSV;
window.exportDashboardToPDF = exportDashboardToPDF;
window.openModal = openModal;
window.closeModal = closeModal;
window.handleOverlayClick = handleOverlayClick;
window.saveExpense = saveExpense;
window.editExpense = editExpense;
window.deleteExpense = deleteExpense;
window.toggleMobileMenu = toggleMobileMenu;
window.doLogout = doLogout;