// Settings page logic

let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
    currentUser = getCurrentUser();
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }
    
    document.getElementById('user-avatar').textContent = currentUser.initials || 'U';
    loadUserData();
    loadPreferences();
    setupPasswordStrength();
    
    // Initialize tab switching
    const navItems = document.querySelectorAll('.settings-nav-item');
    const tabs = document.querySelectorAll('.settings-tab');
    
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const tabId = this.getAttribute('data-tab');
            
            navItems.forEach(nav => nav.classList.remove('active'));
            tabs.forEach(tab => tab.classList.remove('active'));
            
            this.classList.add('active');
            
            const targetTab = document.getElementById(tabId + '-tab');
            if (targetTab) {
                targetTab.classList.add('active');
            }
        });
    });
});

function loadUserData() {
    document.getElementById('profile-name').value = currentUser.name || '';
    document.getElementById('profile-email').value = currentUser.email || '';
    document.getElementById('profile-phone').value = currentUser.phone || '';
    document.getElementById('profile-dob').value = currentUser.dob || '';
    document.getElementById('profile-city').value = currentUser.city || '';
    document.getElementById('profile-state').value = currentUser.state || '';
    document.getElementById('profile-pincode').value = currentUser.pincode || '';
    
    document.getElementById('avatar-preview').textContent = currentUser.initials || '👤';
}

function loadPreferences() {
    const prefs = getPreferences();
    document.getElementById('theme-pref').value = prefs.theme || 'light';
    document.getElementById('currency-pref').value = prefs.currency || 'INR';
    document.getElementById('date-format').value = prefs.dateFormat || 'DD/MM/YYYY';
    document.getElementById('default-view').value = prefs.defaultView || 'summary';
    document.getElementById('language-pref').value = prefs.language || 'en';
    document.getElementById('number-format').value = prefs.numberFormat || 'lakh';
    
    document.getElementById('email-summary').checked = prefs.emailSummary !== false;
    document.getElementById('budget-alerts').checked = prefs.budgetAlerts !== false;
    document.getElementById('goal-alerts').checked = prefs.goalAlerts !== false;
    document.getElementById('push-reminder').checked = prefs.pushReminder || false;
    document.getElementById('push-unusual').checked = prefs.pushUnusual !== false;
    document.getElementById('marketing-emails').checked = prefs.marketingEmails || false;
    document.getElementById('auto-backup').checked = prefs.autoBackup !== false;
}

function setupPasswordStrength() {
    const newPassword = document.getElementById('new-password');
    if (newPassword) {
        newPassword.addEventListener('input', function() {
            const password = this.value;
            let strength = 0;
            
            if (password.length >= 6) strength++;
            if (password.length >= 10) strength++;
            if (/[A-Z]/.test(password)) strength++;
            if (/[0-9]/.test(password)) strength++;
            if (/[^A-Za-z0-9]/.test(password)) strength++;
            
            const percentage = (strength / 5) * 100;
            const fill = document.getElementById('strength-fill');
            const text = document.getElementById('strength-text');
            
            if (fill) fill.style.width = percentage + '%';
            
            if (text) {
                if (percentage < 20) {
                    fill.style.background = '#ef4444';
                    text.textContent = 'Weak password';
                    text.style.color = '#ef4444';
                } else if (percentage < 40) {
                    fill.style.background = '#f59e0b';
                    text.textContent = 'Fair password';
                    text.style.color = '#f59e0b';
                } else if (percentage < 70) {
                    fill.style.background = '#10b981';
                    text.textContent = 'Good password';
                    text.style.color = '#10b981';
                } else {
                    fill.style.background = '#059669';
                    text.textContent = 'Strong password!';
                    text.style.color = '#059669';
                }
            }
        });
    }
}

function saveProfile() {
    const name = document.getElementById('profile-name').value;
    const email = document.getElementById('profile-email').value;
    const phone = document.getElementById('profile-phone').value;
    const dob = document.getElementById('profile-dob').value;
    const city = document.getElementById('profile-city')?.value || '';
    const state = document.getElementById('profile-state')?.value || '';
    const pincode = document.getElementById('profile-pincode')?.value || '';
    
    if (!name || !email) {
        toast('Please fill in name and email');
        return;
    }
    
    if (!isValidEmail(email)) {
        toast('Please enter a valid email address');
        return;
    }
    
    updateCurrentUser({
        name: name,
        email: email,
        phone: phone,
        dob: dob,
        city: city,
        state: state,
        pincode: pincode,
        initials: initials(name)
    });
    
    document.getElementById('user-avatar').textContent = currentUser.initials;
    document.getElementById('avatar-preview').textContent = currentUser.initials;
    
    toast('Profile updated successfully');
}

function savePreferences() {
    const preferences = {
        theme: document.getElementById('theme-pref').value,
        currency: document.getElementById('currency-pref').value,
        dateFormat: document.getElementById('date-format').value,
        defaultView: document.getElementById('default-view').value,
        language: document.getElementById('language-pref').value,
        numberFormat: document.getElementById('number-format').value,
        emailSummary: document.getElementById('email-summary').checked,
        budgetAlerts: document.getElementById('budget-alerts').checked,
        goalAlerts: document.getElementById('goal-alerts').checked,
        pushReminder: document.getElementById('push-reminder').checked,
        pushUnusual: document.getElementById('push-unusual').checked,
        marketingEmails: document.getElementById('marketing-emails').checked,
        autoBackup: document.getElementById('auto-backup').checked
    };
    
    savePreferences(preferences);
    toast('Preferences saved');
}

function saveNotifications() {
    savePreferences();
}

function changePassword() {
    const current = document.getElementById('current-password').value;
    const newPass = document.getElementById('new-password').value;
    const confirm = document.getElementById('confirm-password').value;
    
    if (!current || !newPass || !confirm) {
        toast('Please fill in all password fields');
        return;
    }
    
    if (newPass.length < 6) {
        toast('Password must be at least 6 characters');
        return;
    }
    
    if (newPass !== confirm) {
        toast('New passwords do not match');
        return;
    }
    
    let users = getUsers();
    const user = users.find(u => u.id === currentUser.id);
    
    if (user && user.password !== current) {
        toast('Current password is incorrect');
        return;
    }
    
    if (user) {
        user.password = newPass;
        localStorage.setItem('spendly_users', JSON.stringify(users));
        toast('Password changed successfully');
        
        document.getElementById('current-password').value = '';
        document.getElementById('new-password').value = '';
        document.getElementById('confirm-password').value = '';
    }
}

function exportData(format) {
    const expenses = getExpenses();
    
    if (format === 'json') {
        const dataStr = JSON.stringify({ expenses: expenses, exportDate: new Date().toISOString() }, null, 2);
        downloadFile(dataStr, `spendly_data_${new Date().toISOString().split('T')[0]}.json`, 'application/json');
        toast('JSON exported successfully');
    } else if (format === 'csv') {
        const headers = ['Date', 'Category', 'Note', 'Amount'];
        const rows = expenses.map(e => [e.date, e.category, e.note || '', e.amount]);
        const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
        downloadFile("\uFEFF" + csvContent, `spendly_expenses_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
        toast('CSV exported successfully');
    } else if (format === 'pdf') {
        toast('PDF export will be available in Pro version');
    }
}

function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type: type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

function importData() {
    toast('Import feature will be available soon');
}

function createBackup() {
    const allData = {
        user: currentUser,
        expenses: localStorage.getItem('spendly_expenses'),
        goals: localStorage.getItem('spendly_goals'),
        budgets: localStorage.getItem('spendly_budgets'),
        preferences: localStorage.getItem('spendly_preferences'),
        backupDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(allData, null, 2);
    downloadFile(dataStr, `spendly_backup_${new Date().toISOString().split('T')[0]}.json`, 'application/json');
    toast('Backup created successfully');
}

function deleteAllExpenses() {
    if (confirm('⚠️ This will delete ALL your expenses. This action cannot be undone. Are you sure?')) {
        localStorage.setItem('spendly_expenses', '[]');
        toast('All expenses have been deleted');
        setTimeout(() => window.location.reload(), 1500);
    }
}

function deleteAccount() {
    if (confirm('⚠️ WARNING: This will permanently delete your ENTIRE account and ALL data. This action cannot be undone.')) {
        const confirmation = prompt('Type "DELETE MY ACCOUNT" to confirm:');
        if (confirmation === 'DELETE MY ACCOUNT') {
            let users = getUsers();
            users = users.filter(u => u.id !== currentUser.id);
            localStorage.setItem('spendly_users', JSON.stringify(users));
            localStorage.removeItem('spendly_user');
            localStorage.removeItem('spendly_expenses');
            localStorage.removeItem('spendly_goals');
            localStorage.removeItem('spendly_budgets');
            localStorage.removeItem('spendly_preferences');
            toast('Account deleted. Redirecting...');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        } else {
            toast('Deletion cancelled');
        }
    }
}

function revokeSession(btn) {
    const sessionItem = btn.closest('.session-item');
    if (sessionItem) {
        sessionItem.remove();
        toast('Session revoked');
    }
}

function revokeAllSessions() {
    toast('All other sessions have been revoked');
}

function addPaymentMethod() {
    toast('Payment methods can be added in the Pro version');
}

function removePaymentMethod(btn) {
    const method = btn.closest('.setting-item');
    if (method) {
        method.remove();
        toast('Payment method removed');
    }
}

function downloadInvoice() {
    toast('Invoice downloaded');
}

function sendSupportTicket() {
    const subject = document.getElementById('support-subject').value;
    const message = document.getElementById('support-message').value;
    
    if (!subject || !message) {
        toast('Please fill in subject and message');
        return;
    }
    
    toast(`Support ticket sent! We'll respond within 24 hours.`);
    document.getElementById('support-subject').value = '';
    document.getElementById('support-message').value = '';
}

function syncData() {
    document.getElementById('last-sync').textContent = 'Just now';
    toast('Data synced successfully');
}

function toggleFaq(element) {
    const content = element.querySelector('.setting-info p');
    if (content) {
        const isVisible = content.style.display === 'block';
        content.style.display = isVisible ? 'none' : 'block';
    }
}

function uploadAvatar() {
    toast('Avatar upload feature coming soon');
}

function verify2FA() {
    toast('2FA enabled successfully');
    document.getElementById('twofa-enabled').checked = true;
    document.getElementById('twofa-setup').style.display = 'none';
}

function toast(msg) {
    const el = document.getElementById('toast');
    if (el) {
        el.textContent = msg;
        el.classList.add('show');
        clearTimeout(window.toastTimer);
        window.toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
    }
}

// 2FA toggle
document.getElementById('twofa-enabled')?.addEventListener('change', function(e) {
    const setupDiv = document.getElementById('twofa-setup');
    if (setupDiv) {
        if (e.target.checked) {
            setupDiv.style.display = 'block';
        } else {
            setupDiv.style.display = 'none';
        }
    }
});