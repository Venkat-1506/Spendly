// ================================================
// UTILITY FUNCTIONS - Core helpers for the entire app
// ================================================

// Category colors for charts
const CAT_COLORS = {
    '🍔 Food': '#6366f1',
    '✈️ Travel': '#10b981',
    '🛍️ Shopping': '#f59e0b',
    '🏠 Housing': '#3b82f6',
    '💊 Health': '#ef4444',
    '🎮 Entertainment': '#8b5cf6',
    '🚗 Transport': '#06b6d4',
    '📚 Education': '#f97316',
    '💼 Business': '#64748b',
    '🔧 Utilities': '#84cc16'
};

const CAT_BG = {
    '🍔 Food': '#eef2ff',
    '✈️ Travel': '#d1fae5',
    '🛍️ Shopping': '#fef3c7',
    '🏠 Housing': '#dbeafe',
    '💊 Health': '#fee2e2',
    '🎮 Entertainment': '#ede9fe',
    '🚗 Transport': '#cffafe',
    '📚 Education': '#ffedd5',
    '💼 Business': '#f1f5f9',
    '🔧 Utilities': '#f0fdf4'
};

// Format amount in Indian Rupees (no decimals)
function fmt(amount) {
    let num = Number(amount);
    if (isNaN(num)) return '₹0';
    let formatted = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(num);
    return formatted;
}

// Format amount with decimals
function fmtWithDecimal(amount) {
    let num = Number(amount);
    if (isNaN(num)) return '₹0';
    let formatted = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(num);
    return formatted;
}

// Format date to Indian format (DD MMM YYYY)
function fmtDate(d) {
    if (!d) return 'N/A';
    return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
    });
}

// Capitalize first letter of each word
function capitalise(s) { 
    if (!s) return '';
    return s.replace(/\b\w/g, c => c.toUpperCase()); 
}

// Get initials from name
function initials(name) { 
    if (!name) return 'U';
    return name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0,2); 
}

// Toast notification system
let toastTimer;
function toast(msg, type = 'info') {
    console.log('Toast:', msg);
    const el = document.getElementById('toast');
    if (!el) {
        // Fallback to alert if toast element not found
        alert(msg);
        return;
    }
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        if (el) el.classList.remove('show');
    }, 3000);
}

// Get month-year string from date
function getMonthYear(date) {
    const d = new Date(date);
    return `${d.getFullYear()}-${d.getMonth() + 1}`;
}

// Get current month-year
function getCurrentMonthYear() {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}`;
}

// Format number with K, L, Cr suffixes
function formatNumber(num) {
    if (num >= 10000000) return (num / 10000000).toFixed(1) + 'Cr';
    if (num >= 100000) return (num / 100000).toFixed(1) + 'L';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

// Generate unique ID
function generateId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

// Escape HTML to prevent XSS
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// Validate email format
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Get greeting based on time of day
function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
}

// Get date range based on preset
function getDateRange(range) {
    const now = new Date();
    let startDate, endDate;
    
    switch(range) {
        case 'this-month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            break;
        case 'last-month':
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            endDate = new Date(now.getFullYear(), now.getMonth(), 0);
            break;
        case 'this-quarter':
            const quarter = Math.floor(now.getMonth() / 3);
            startDate = new Date(now.getFullYear(), quarter * 3, 1);
            endDate = new Date(now.getFullYear(), quarter * 3 + 3, 0);
            break;
        case 'this-year':
            startDate = new Date(now.getFullYear(), 0, 1);
            endDate = new Date(now.getFullYear(), 11, 31);
            break;
        case 'last-year':
            startDate = new Date(now.getFullYear() - 1, 0, 1);
            endDate = new Date(now.getFullYear() - 1, 11, 31);
            break;
        default:
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }
    
    return { startDate, endDate };
}

// ================================================
// SAMPLE DATA GENERATORS
// ================================================

function getSampleExpenses() {
    const today = new Date();
    const getDate = (daysAgo) => {
        const d = new Date(today);
        d.setDate(d.getDate() - daysAgo);
        return d.toISOString().split('T')[0];
    };
    
    return [
        { id: generateId(), amount: '1250', category: '🍔 Food', date: getDate(0), note: 'Grocery shopping at DMart' },
        { id: generateId(), amount: '450', category: '🚗 Transport', date: getDate(1), note: 'Uber to office' },
        { id: generateId(), amount: '2300', category: '🛍️ Shopping', date: getDate(2), note: 'New headphones' },
        { id: generateId(), amount: '550', category: '🎮 Entertainment', date: getDate(3), note: 'Netflix subscription' },
        { id: generateId(), amount: '3500', category: '✈️ Travel', date: getDate(5), note: 'Weekend trip to Goa' },
        { id: generateId(), amount: '800', category: '🍔 Food', date: getDate(7), note: 'Restaurant dinner' },
        { id: generateId(), amount: '200', category: '🚗 Transport', date: getDate(8), note: 'Petrol' },
        { id: generateId(), amount: '1500', category: '🛍️ Shopping', date: getDate(10), note: 'Clothes' },
        { id: generateId(), amount: '300', category: '💊 Health', date: getDate(12), note: 'Medicine' },
        { id: generateId(), amount: '1000', category: '🔧 Utilities', date: getDate(15), note: 'Electricity bill' },
        { id: generateId(), amount: '600', category: '🍔 Food', date: getDate(4), note: 'Lunch with colleagues' },
        { id: generateId(), amount: '2500', category: '🏠 Housing', date: getDate(6), note: 'Rent payment' },
        { id: generateId(), amount: '120', category: '🎮 Entertainment', date: getDate(9), note: 'Movie ticket' }
    ];
}

function getSampleGoals() {
    const today = new Date();
    const nextYear = new Date(today);
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const sixMonths = new Date(today);
    sixMonths.setMonth(sixMonths.getMonth() + 6);
    
    const getDate = (daysAgo) => {
        const d = new Date(today);
        d.setDate(d.getDate() - daysAgo);
        return d.toISOString().split('T')[0];
    };
    
    return [
        {
            id: generateId(),
            name: 'Emergency Fund',
            target: 100000,
            current: 25000,
            deadline: nextYear.toISOString().split('T')[0],
            icon: '🏦',
            createdAt: new Date().toISOString(),
            contributions: [
                { id: generateId(), amount: 5000, note: 'Monthly savings', date: getDate(30), timestamp: new Date().toISOString() },
                { id: generateId(), amount: 10000, note: 'Bonus', date: getDate(60), timestamp: new Date().toISOString() },
                { id: generateId(), amount: 10000, note: 'Savings', date: getDate(90), timestamp: new Date().toISOString() }
            ]
        },
        {
            id: generateId(),
            name: 'Vacation to Maldives',
            target: 150000,
            current: 45000,
            deadline: sixMonths.toISOString().split('T')[0],
            icon: '✈️',
            createdAt: new Date().toISOString(),
            contributions: [
                { id: generateId(), amount: 15000, note: 'Monthly savings', date: getDate(30), timestamp: new Date().toISOString() },
                { id: generateId(), amount: 15000, note: 'Monthly savings', date: getDate(60), timestamp: new Date().toISOString() },
                { id: generateId(), amount: 15000, note: 'Monthly savings', date: getDate(90), timestamp: new Date().toISOString() }
            ]
        },
        {
            id: generateId(),
            name: 'New Laptop',
            target: 80000,
            current: 30000,
            deadline: nextMonth.toISOString().split('T')[0],
            icon: '💻',
            createdAt: new Date().toISOString(),
            contributions: [
                { id: generateId(), amount: 10000, note: 'Savings', date: getDate(20), timestamp: new Date().toISOString() },
                { id: generateId(), amount: 20000, note: 'Bonus', date: getDate(40), timestamp: new Date().toISOString() }
            ]
        }
    ];
}

function getSampleBudgets() {
    return [
        { category: '🍔 Food', amount: 8000 },
        { category: '🛍️ Shopping', amount: 5000 },
        { category: '🚗 Transport', amount: 3000 },
        { category: '🎮 Entertainment', amount: 2000 },
        { category: '✈️ Travel', amount: 5000 },
        { category: '💊 Health', amount: 1500 },
        { category: '🔧 Utilities', amount: 3000 },
        { category: '🏠 Housing', amount: 15000 }
    ];
}

// Reset all data to default (for testing)
function resetToDefaultData() {
    if (confirm('⚠️ This will reset ALL your data to default. This action cannot be undone. Are you sure?')) {
        localStorage.setItem('spendly_expenses', JSON.stringify(getSampleExpenses()));
        localStorage.setItem('spendly_goals', JSON.stringify(getSampleGoals()));
        localStorage.setItem('spendly_budgets', JSON.stringify(getSampleBudgets()));
        localStorage.setItem('spendly_total_budget', '15000');
        toast('Data reset to default!');
        setTimeout(() => window.location.reload(), 1500);
    }
}
// User Dropdown Functions
function toggleUserDropdown(event) {
    if (event) event.stopPropagation();
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) {
        dropdown.classList.toggle('show');
    }
}

function closeUserDropdown() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) {
        dropdown.classList.remove('show');
    }
}

function updateUserDropdown() {
    console.log('updateUserDropdown called');
    
    // Try to get user from multiple sources
    let user = null;
    
    if (typeof getCurrentUser === 'function') {
        user = getCurrentUser();
    }
    
    if (!user) {
        user = JSON.parse(localStorage.getItem('spendly_user'));
    }
    
    console.log('User data:', user);
    
    if (user) {
        const avatar = document.getElementById('user-avatar');
        const dropdownAvatar = document.getElementById('dropdownAvatar');
        const userName = document.getElementById('dropdownUserName');
        const userEmail = document.getElementById('dropdownUserEmail');
        
        // Get initials (first letter of name)
        let initials = user.initials;
        if (!initials && user.name) {
            initials = user.name.charAt(0).toUpperCase();
        }
        if (!initials) initials = 'U';
        
        console.log('Setting avatar to:', initials);
        console.log('Setting name to:', user.name);
        console.log('Setting email to:', user.email);
        
        if (avatar) avatar.textContent = initials;
        if (dropdownAvatar) dropdownAvatar.textContent = initials;
        if (userName) userName.textContent = user.name || 'User';
        if (userEmail) userEmail.textContent = user.email || '';
        
        return true;
    } else {
        console.log('No user found in localStorage');
        return false;
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const dropdown = document.getElementById('userDropdown');
    const avatar = document.getElementById('user-avatar');
    const logoutBtn = document.querySelector('.user-pill .btn-ghost');
    
    if (dropdown && dropdown.classList.contains('show')) {
        if (avatar && !avatar.contains(event.target) && 
            !dropdown.contains(event.target) &&
            logoutBtn && !logoutBtn.contains(event.target)) {
            dropdown.classList.remove('show');
        }
    }
});
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        updateUserDropdown();
    }, 100);
});
// Close dropdown on ESC key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const dropdown = document.getElementById('userDropdown');
        if (dropdown) {
            dropdown.classList.remove('show');
        }
    }
});

// Make functions global
window.toggleUserDropdown = toggleUserDropdown;
window.closeUserDropdown = closeUserDropdown;
window.updateUserDropdown = updateUserDropdown;
// ================================================
// EXPORT ALL FUNCTIONS TO GLOBAL SCOPE
// ================================================

window.fmt = fmt;
window.fmtWithDecimal = fmtWithDecimal;
window.fmtDate = fmtDate;
window.capitalise = capitalise;
window.initials = initials;
window.toast = toast;
window.getMonthYear = getMonthYear;
window.getCurrentMonthYear = getCurrentMonthYear;
window.formatNumber = formatNumber;
window.generateId = generateId;
window.escapeHtml = escapeHtml;
window.isValidEmail = isValidEmail;
window.getGreeting = getGreeting;
window.getDateRange = getDateRange;
window.getSampleExpenses = getSampleExpenses;
window.getSampleGoals = getSampleGoals;
window.getSampleBudgets = getSampleBudgets;
window.resetToDefaultData = resetToDefaultData;
window.CAT_COLORS = CAT_COLORS;
window.CAT_BG = CAT_BG;
// ================================================
// DROPDOWN INITIALIZATION
// ================================================

// Make sure dropdown updates when page loads
(function initDropdown() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(updateUserDropdown, 100);
        });
    } else {
        setTimeout(updateUserDropdown, 100);
    }
})();

// Also update dropdown when localStorage changes (for login/signup)
window.addEventListener('storage', function(e) {
    if (e.key === 'spendly_user') {
        updateUserDropdown();
    }
});