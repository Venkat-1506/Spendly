// Goals page logic

let goals = [];
let currentUser = null;
let currentGoalId = null;

const motivationalQuotes = [
    { quote: "The secret to getting ahead is getting started.", author: "Mark Twain" },
    { quote: "A goal without a plan is just a wish.", author: "Antoine de Saint-Exupéry" },
    { quote: "Small daily improvements are the key to staggering long-term results.", author: "Unknown" },
    { quote: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
    { quote: "The future depends on what you do today.", author: "Mahatma Gandhi" },
    { quote: "Every rupee saved is a step toward financial freedom.", author: "Spendly" },
    { quote: "The best time to start was yesterday. The next best time is now.", author: "Unknown" }
];

document.addEventListener('DOMContentLoaded', () => {
    currentUser = getCurrentUser();
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }
    
    document.getElementById('user-avatar').textContent = currentUser.initials || 'U';
    loadGoals();
    renderAll();
    updateMotivationalQuote();
});

function loadGoals() {
    goals = getGoals();
}

function saveGoals() {
    saveGoalsToStorage(goals);
}

function saveGoalsToStorage(goalsArray) {
    localStorage.setItem('spendly_goals', JSON.stringify(goalsArray));
}

function updateMotivationalQuote() {
    const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
    const quote = motivationalQuotes[randomIndex];
    const card = document.getElementById('motivation-card');
    if (card) {
        card.innerHTML = `
            <div class="quote">"${quote.quote}"</div>
            <div class="quote-author">— ${quote.author}</div>
        `;
    }
}

function renderAll() {
    const activeGoals = goals.filter(g => g.current < g.target);
    const completedGoals = goals.filter(g => g.current >= g.target);
    const totalSaved = goals.reduce((sum, g) => sum + (g.current || 0), 0);
    const totalTarget = goals.reduce((sum, g) => sum + g.target, 0);
    const successRate = totalTarget > 0 ? (totalSaved / totalTarget * 100).toFixed(0) : 0;
    
    document.getElementById('active-goals-count').textContent = activeGoals.length;
    document.getElementById('completed-goals-count').textContent = completedGoals.length;
    document.getElementById('total-saved').innerHTML = fmt(totalSaved);
    document.getElementById('success-rate').textContent = successRate + '%';
    
    const overallPercent = totalTarget > 0 ? (totalSaved / totalTarget * 100).toFixed(1) : 0;
    document.getElementById('overall-progress').textContent = overallPercent + '%';
    document.getElementById('overall-progress-bar').style.width = Math.min(overallPercent, 100) + '%';
    document.getElementById('total-target').innerHTML = fmt(totalTarget);
    document.getElementById('total-saved-display').innerHTML = fmt(totalSaved);
    document.getElementById('total-remaining-goal').innerHTML = fmt(Math.max(0, totalTarget - totalSaved));
    
    renderGoals();
}

function renderGoals() {
    const container = document.getElementById('goals-list');
    
    if (goals.length === 0) {
        container.innerHTML = `<div class="empty-state">
            <div class="empty-state-icon">🎯</div>
            <p>No goals created yet</p>
            <button class="btn btn-primary btn-sm" onclick="openGoalModal()">Create your first goal</button>
        </div>`;
        return;
    }
    
    container.innerHTML = goals.map(goal => {
        const progress = (goal.current / goal.target) * 100;
        const isCompleted = progress >= 100;
        const daysLeft = Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24));
        const isUrgent = daysLeft <= 30 && daysLeft > 0 && !isCompleted;
        
        let statusClass = '';
        if (isCompleted) statusClass = 'completed';
        else if (isUrgent) statusClass = 'urgent';
        
        let fillColor = '#6366f1';
        if (isCompleted) fillColor = '#10b981';
        else if (progress >= 75) fillColor = '#fbbf24';
        else if (progress >= 50) fillColor = '#f59e0b';
        
        const dailyNeeded = !isCompleted && daysLeft > 0 ? (goal.target - goal.current) / daysLeft : 0;
        const monthlyNeeded = dailyNeeded * 30;
        
        return `
            <div class="goal-card ${statusClass}">
                ${isCompleted ? '<div class="achievement-badge">🎉 Achieved!</div>' : ''}
                <div class="goal-header">
                    <div class="goal-icon">${goal.icon}</div>
                    <div class="goal-info">
                        <div class="goal-name">${escapeHtml(goal.name)}</div>
                        <div class="goal-target">Target: ${fmt(goal.target)}</div>
                    </div>
                    <div class="goal-actions">
                        ${!isCompleted ? `<button class="icon-btn add" onclick="openContributionModal('${goal.id}')">➕</button>` : ''}
                        <button class="icon-btn delete" onclick="deleteGoal('${goal.id}')">🗑️</button>
                    </div>
                </div>
                
                <div class="goal-progress-section">
                    <div class="progress-stats">
                        <span class="progress-current">${fmt(goal.current)}</span>
                        <span class="progress-percent">${progress.toFixed(1)}%</span>
                    </div>
                    <div class="goal-progress-bar">
                        <div class="goal-progress-fill" style="width: ${Math.min(progress, 100)}%; background: ${fillColor};"></div>
                    </div>
                </div>
                
                <div class="goal-details">
                    <div class="detail-item">
                        <div class="detail-label">Remaining</div>
                        <div class="detail-value">${fmt(goal.target - goal.current)}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Time Left</div>
                        <div class="detail-value ${daysLeft < 0 ? 'negative' : ''}">
                            ${isCompleted ? '✅ Completed' : daysLeft < 0 ? '📅 Overdue' : `${daysLeft} days`}
                        </div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Daily Need</div>
                        <div class="detail-value">${dailyNeeded > 0 ? fmt(dailyNeeded) : '-'}</div>
                    </div>
                </div>
                
                ${!isCompleted && daysLeft > 0 && dailyNeeded > 0 ? `
                    <div class="goal-details" style="margin-top: 0; background: #eef2ff;">
                        <div class="detail-item">
                            <div class="detail-label">💰 Daily</div>
                            <div class="detail-value">${fmt(dailyNeeded)}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">📅 Weekly</div>
                            <div class="detail-value">${fmt(dailyNeeded * 7)}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">📆 Monthly</div>
                            <div class="detail-value">${fmt(monthlyNeeded)}</div>
                        </div>
                    </div>
                ` : ''}
                
                ${!isCompleted ? `
                    <button class="contribute-btn" onclick="openContributionModal('${goal.id}')">
                        💰 Add Contribution
                    </button>
                ` : ''}
            </div>
        `;
    }).join('');
}

function openGoalModal() {
    document.getElementById('goal-modal-title').textContent = 'Create New Goal';
    document.getElementById('goal-name').value = '';
    document.getElementById('goal-target').value = '';
    document.getElementById('goal-current').value = '0';
    document.getElementById('goal-deadline').value = '';
    document.getElementById('goal-icon').value = '🏠';
    document.getElementById('goal-modal').classList.add('open');
}

function closeGoalModal() {
    document.getElementById('goal-modal').classList.remove('open');
}

function saveGoal() {
    const name = document.getElementById('goal-name').value.trim();
    const target = parseFloat(document.getElementById('goal-target').value);
    const current = parseFloat(document.getElementById('goal-current').value) || 0;
    const deadline = document.getElementById('goal-deadline').value;
    const icon = document.getElementById('goal-icon').value;
    
    if (!name || !target || target <= 0) {
        toast('Please enter a valid goal name and target amount');
        return;
    }
    
    if (!deadline) {
        toast('Please select a target date');
        return;
    }
    
    const newGoal = {
        id: generateId(),
        name,
        target,
        current: Math.min(current, target),
        deadline,
        icon,
        createdAt: new Date().toISOString(),
        contributions: []
    };
    
    goals.push(newGoal);
    localStorage.setItem('spendly_goals', JSON.stringify(goals));
    closeGoalModal();
    renderAll();
    toast(`🎯 Goal "${name}" created successfully!`);
}

function openContributionModal(goalId) {
    currentGoalId = goalId;
    const goal = goals.find(g => g.id === goalId);
    if (goal) {
        document.getElementById('contribution-amount').value = '';
        document.getElementById('contribution-note').value = '';
        document.getElementById('contribution-date').value = new Date().toISOString().split('T')[0];
        document.getElementById('contribution-modal').classList.add('open');
    }
}

function closeContributionModal() {
    document.getElementById('contribution-modal').classList.remove('open');
    currentGoalId = null;
}

function addContribution() {
    const amount = parseFloat(document.getElementById('contribution-amount').value);
    const note = document.getElementById('contribution-note').value;
    const date = document.getElementById('contribution-date').value;
    
    if (!amount || amount <= 0) {
        toast('Please enter a valid amount');
        return;
    }
    
    const goal = goals.find(g => g.id === currentGoalId);
    if (goal) {
        const newAmount = goal.current + amount;
        goal.current = Math.min(newAmount, goal.target);
        
        if (!goal.contributions) goal.contributions = [];
        goal.contributions.push({
            id: generateId(),
            amount: amount,
            note: note,
            date: date,
            timestamp: new Date().toISOString()
        });
        
        localStorage.setItem('spendly_goals', JSON.stringify(goals));
        renderAll();
        
        if (goal.current >= goal.target) {
            toast(`🎉 Amazing! You've achieved your goal "${goal.name}"! 🎉`);
        } else {
            toast(`✅ Added ${fmt(amount)} to "${goal.name}". ${fmt(goal.target - goal.current)} remaining!`);
        }
    }
    
    closeContributionModal();
}

function deleteGoal(goalId) {
    const goal = goals.find(g => g.id === goalId);
    if (confirm(`Are you sure you want to delete "${goal?.name}"?`)) {
        goals = goals.filter(g => g.id !== goalId);
        localStorage.setItem('spendly_goals', JSON.stringify(goals));
        renderAll();
        toast('Goal deleted');
    }
}

function toggleMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    if (menu) menu.classList.toggle('active');
}

function doLogout() {
    localStorage.removeItem('spendly_user');
    window.location.href = 'index.html';
}