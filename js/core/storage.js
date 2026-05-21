// ================================================
// STORAGE MANAGEMENT FUNCTIONS
// ================================================

// EXPENSES
function getExpenses() {
    let expenses = localStorage.getItem('spendly_expenses');
    const currentUser = getCurrentUser();
    
    if (!expenses || expenses === '[]') {
        // Check if this is demo user login
        if (currentUser && currentUser.email === 'demo@spendly.com') {
            const sampleExpenses = getSampleExpenses();
            localStorage.setItem('spendly_expenses', JSON.stringify(sampleExpenses));
            return sampleExpenses;
        }
        localStorage.setItem('spendly_expenses', '[]');
        return [];
    }
    return JSON.parse(expenses);
}

function saveExpenses(expenses) {
    localStorage.setItem('spendly_expenses', JSON.stringify(expenses));
}

function addExpense(expense) {
    const expenses = getExpenses();
    expenses.push(expense);
    saveExpenses(expenses);
    return expense;
}

function updateExpense(id, updatedExpense) {
    const expenses = getExpenses();
    const index = expenses.findIndex(e => e.id === id);
    if (index !== -1) {
        expenses[index] = { ...expenses[index], ...updatedExpense };
        saveExpenses(expenses);
        return true;
    }
    return false;
}

function deleteExpense(id) {
    const expenses = getExpenses();
    const filtered = expenses.filter(e => e.id !== id);
    saveExpenses(filtered);
    return filtered.length !== expenses.length;
}

// GOALS
function getGoals() {
    const goals = localStorage.getItem('spendly_goals');
    const currentUser = getCurrentUser();
    
    if (!goals || goals === '[]') {
        if (currentUser && currentUser.email === 'demo@spendly.com') {
            const sampleGoals = getSampleGoals();
            localStorage.setItem('spendly_goals', JSON.stringify(sampleGoals));
            return sampleGoals;
        }
        localStorage.setItem('spendly_goals', '[]');
        return [];
    }
    return JSON.parse(goals);
}

function saveGoals(goals) {
    localStorage.setItem('spendly_goals', JSON.stringify(goals));
}

function addGoal(goal) {
    const goals = getGoals();
    goals.push(goal);
    saveGoals(goals);
    return goal;
}

function updateGoal(id, updatedGoal) {
    const goals = getGoals();
    const index = goals.findIndex(g => g.id === id);
    if (index !== -1) {
        goals[index] = { ...goals[index], ...updatedGoal };
        saveGoals(goals);
        return true;
    }
    return false;
}

function deleteGoal(id) {
    const goals = getGoals();
    const filtered = goals.filter(g => g.id !== id);
    saveGoals(filtered);
    return filtered.length !== goals.length;
}

// BUDGETS
function getBudgets() {
    const budgets = localStorage.getItem('spendly_budgets');
    const currentUser = getCurrentUser();
    
    if (!budgets || budgets === '[]') {
        if (currentUser && currentUser.email === 'demo@spendly.com') {
            const sampleBudgets = getSampleBudgets();
            localStorage.setItem('spendly_budgets', JSON.stringify(sampleBudgets));
            return sampleBudgets;
        }
        localStorage.setItem('spendly_budgets', '[]');
        return [];
    }
    return JSON.parse(budgets);
}

function saveBudgets(budgets) {
    localStorage.setItem('spendly_budgets', JSON.stringify(budgets));
}

function getTotalBudget() {
    const stored = localStorage.getItem('spendly_total_budget');
    if (!stored) {
        localStorage.setItem('spendly_total_budget', '15000');
        return 15000;
    }
    return parseFloat(stored);
}

function saveTotalBudget(amount) {
    localStorage.setItem('spendly_total_budget', amount.toString());
    const user = getCurrentUser();
    if (user) {
        user.budget = amount;
        localStorage.setItem('spendly_user', JSON.stringify(user));
        
        let users = getUsers();
        const index = users.findIndex(u => u.id === user.id);
        if (index !== -1) {
            users[index].budget = amount;
            localStorage.setItem('spendly_users', JSON.stringify(users));
        }
    }
}

// TEAM MEMBERS
function getTeamMembers() {
    const members = localStorage.getItem('spendly_team_members');
    if (!members) {
        const currentUser = getCurrentUser();
        const sampleMembers = currentUser ? [{
            id: currentUser.id,
            name: currentUser.name,
            email: currentUser.email,
            role: 'admin',
            avatar: currentUser.initials,
            totalSpent: 0,
            totalOwed: 0
        }] : [];
        localStorage.setItem('spendly_team_members', JSON.stringify(sampleMembers));
        return sampleMembers;
    }
    return JSON.parse(members);
}

function saveTeamMembers(members) {
    localStorage.setItem('spendly_team_members', JSON.stringify(members));
}

// SHARED EXPENSES
function getSharedExpenses() {
    const expenses = localStorage.getItem('spendly_shared_expenses');
    if (!expenses) {
        localStorage.setItem('spendly_shared_expenses', '[]');
        return [];
    }
    return JSON.parse(expenses);
}

function saveSharedExpenses(expenses) {
    localStorage.setItem('spendly_shared_expenses', JSON.stringify(expenses));
}

// PREFERENCES
function getPreferences() {
    const prefs = localStorage.getItem('spendly_preferences');
    if (!prefs) {
        const defaultPrefs = {
            theme: 'light',
            currency: 'INR',
            dateFormat: 'DD/MM/YYYY',
            defaultView: 'summary',
            language: 'en',
            numberFormat: 'lakh',
            emailSummary: true,
            budgetAlerts: true,
            goalAlerts: true,
            pushReminder: false,
            pushUnusual: true,
            marketingEmails: false,
            autoBackup: true
        };
        localStorage.setItem('spendly_preferences', JSON.stringify(defaultPrefs));
        return defaultPrefs;
    }
    return JSON.parse(prefs);
}

function savePreferences(prefs) {
    localStorage.setItem('spendly_preferences', JSON.stringify(prefs));
}

// USER MANAGEMENT
function getCurrentUser() {
    return JSON.parse(localStorage.getItem('spendly_user'));
}

function updateCurrentUser(updates) {
    const user = getCurrentUser();
    if (user) {
        Object.assign(user, updates);
        localStorage.setItem('spendly_user', JSON.stringify(user));
        
        let users = getUsers();
        const index = users.findIndex(u => u.id === user.id);
        if (index !== -1) {
            users[index] = { ...users[index], ...updates };
            localStorage.setItem('spendly_users', JSON.stringify(users));
        }
    }
    return user;
}

function getUsers() {
    const users = localStorage.getItem('spendly_users');
    if (!users || users === '[]') {
        // Create default demo user
        const defaultUser = {
            id: '1',
            name: 'Demo User',
            email: 'demo@spendly.com',
            password: 'demo123',
            plan: 'free',
            budget: 15000,
            createdAt: new Date().toISOString(),
            phone: '+91 9876543210',
            dob: '1990-01-01',
            city: 'Bangalore',
            state: 'Karnataka',
            pincode: '560001'
        };
        localStorage.setItem('spendly_users', JSON.stringify([defaultUser]));
        return [defaultUser];
    }
    return JSON.parse(users);
}

// ================================================
// EXPORT TO GLOBAL SCOPE
// ================================================

window.getExpenses = getExpenses;
window.saveExpenses = saveExpenses;
window.addExpense = addExpense;
window.updateExpense = updateExpense;
window.deleteExpense = deleteExpense;
window.getGoals = getGoals;
window.saveGoals = saveGoals;
window.addGoal = addGoal;
window.updateGoal = updateGoal;
window.deleteGoal = deleteGoal;
window.getBudgets = getBudgets;
window.saveBudgets = saveBudgets;
window.getTotalBudget = getTotalBudget;
window.saveTotalBudget = saveTotalBudget;
window.getTeamMembers = getTeamMembers;
window.saveTeamMembers = saveTeamMembers;
window.getSharedExpenses = getSharedExpenses;
window.saveSharedExpenses = saveSharedExpenses;
window.getPreferences = getPreferences;
window.savePreferences = savePreferences;
window.getCurrentUser = getCurrentUser;
window.updateCurrentUser = updateCurrentUser;
window.getUsers = getUsers;