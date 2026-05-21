// Team Collaboration logic

let teamMembers = [];
let sharedExpenses = [];
let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
    currentUser = getCurrentUser();
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }
    
    document.getElementById('user-avatar').textContent = currentUser.initials || 'U';
    loadTeamData();
    renderAll();
});

function loadTeamData() {
    teamMembers = getTeamMembers();
    
    if (!teamMembers.find(m => m.id === currentUser.id)) {
        teamMembers.unshift({
            id: currentUser.id,
            name: currentUser.name,
            email: currentUser.email,
            role: 'admin',
            avatar: currentUser.initials,
            totalSpent: 0,
            totalOwed: 0
        });
        saveTeamMembers(teamMembers);
    }
    
    sharedExpenses = getSharedExpenses();
}

function renderAll() {
    renderTeamMembers();
    renderSharedExpenses();
    updateStats();
    updateSplitSummary();
}

function renderTeamMembers() {
    const container = document.getElementById('team-members-list');
    
    if (teamMembers.length === 0) {
        container.innerHTML = `<div class="empty-state">
            <div class="empty-state-icon">👥</div>
            <p>No team members yet</p>
            <button class="btn btn-primary btn-sm" onclick="openInviteModal()">Invite your first member</button>
        </div>`;
        return;
    }
    
    container.innerHTML = teamMembers.map(member => {
        const memberExpenses = sharedExpenses.filter(e => e.paidBy === member.id);
        const memberTotal = memberExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
        const isCurrentUser = member.id === currentUser.id;
        
        let amountOwed = 0;
        let amountOwes = 0;
        
        sharedExpenses.forEach(expense => {
            const splitAmount = expense.amount / expense.splitWith.length;
            if (expense.paidBy === member.id && expense.splitWith.includes(currentUser.id) && !expense.settled) {
                amountOwes += splitAmount;
            }
            if (expense.paidBy !== member.id && expense.splitWith.includes(member.id) && !expense.settled) {
                amountOwed += splitAmount;
            }
        });
        
        return `
            <div class="member-card">
                <div class="member-avatar-large">${member.avatar || member.name.charAt(0)}</div>
                <div class="member-name">${escapeHtml(member.name)} ${isCurrentUser ? '(You)' : ''}</div>
                <div class="member-email">${escapeHtml(member.email)}</div>
                <div class="member-role ${member.role === 'admin' ? 'role-admin' : 'role-member'}">${member.role === 'admin' ? '👑 Admin' : '👤 Member'}</div>
                <div class="member-stats">
                    <div class="member-stat">
                        <div class="member-stat-value">${memberExpenses.length}</div>
                        <div class="member-stat-label">Expenses</div>
                    </div>
                    <div class="member-stat">
                        <div class="member-stat-value">${fmt(memberTotal)}</div>
                        <div class="member-stat-label">Total Paid</div>
                    </div>
                </div>
                ${!isCurrentUser ? `
                    <div class="member-actions">
                        ${amountOwes > 0 ? `<button class="btn btn-sm btn-primary" onclick="settleWithMember('${member.id}')">Settle ₹${Math.round(amountOwes)}</button>` : ''}
                        <button class="btn btn-sm btn-danger" onclick="removeMember('${member.id}')">Remove</button>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

function renderSharedExpenses() {
    const tbody = document.getElementById('expenses-tbody');
    
    if (sharedExpenses.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7"><div class="empty-state">No shared expenses yet</div></td></tr>';
        return;
    }
    
    const sorted = [...sharedExpenses].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    tbody.innerHTML = sorted.map(expense => {
        const paidBy = teamMembers.find(m => m.id === expense.paidBy)?.name || 'Unknown';
        const splitAmount = expense.amount / expense.splitWith.length;
        const isUserInvolved = expense.splitWith.includes(currentUser.id);
        const userOwes = expense.paidBy !== currentUser.id && isUserInvolved;
        const isSettled = expense.settled || false;
        
        return `
            <tr>
                <td>${fmtDate(expense.date)}</td>
                <td><strong>${escapeHtml(expense.description)}</strong></td>
                <td>${escapeHtml(paidBy)}</td>
                <td class="amount-negative">-${fmt(expense.amount)}</td>
                <td>${fmt(splitAmount)} each</td>
                <td>
                    ${isSettled ? 
                        '<span class="badge badge-settled">✅ Settled</span>' : 
                        (userOwes ? '<span class="badge badge-pending">⏳ You owe</span>' : '<span class="badge badge-settled">No action</span>')
                    }
                </td>
                <td>
                    <div class="action-buttons">
                        ${!isSettled && userOwes ? `<button class="icon-btn pay" onclick="markSettled('${expense.id}')" title="Mark as settled">💰 Pay</button>` : ''}
                        ${expense.paidBy === currentUser.id ? `<button class="icon-btn delete" onclick="deleteExpense('${expense.id}')" title="Delete">🗑️</button>` : ''}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function updateStats() {
    document.getElementById('team-count').textContent = teamMembers.length;
    
    const totalShared = sharedExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    document.getElementById('total-shared').innerHTML = fmt(totalShared);
    document.getElementById('expense-count').textContent = sharedExpenses.length;
    document.getElementById('expense-total').innerHTML = fmt(totalShared);
    
    const avgSplit = sharedExpenses.length > 0 ? totalShared / sharedExpenses.length : 0;
    document.getElementById('avg-split').innerHTML = fmt(avgSplit);
    
    let youOwe = 0;
    let owesYou = 0;
    
    sharedExpenses.forEach(expense => {
        const splitAmount = expense.amount / expense.splitWith.length;
        if (!expense.settled) {
            if (expense.paidBy === currentUser.id) {
                expense.splitWith.forEach(memberId => {
                    if (memberId !== currentUser.id) {
                        owesYou += splitAmount;
                    }
                });
            } else if (expense.splitWith.includes(currentUser.id)) {
                youOwe += splitAmount;
            }
        }
    });
    
    document.getElementById('you-owe').innerHTML = fmt(youOwe);
    document.getElementById('owes-you').innerHTML = fmt(owesYou);
}

function updateSplitSummary() {
    const balances = {};
    
    teamMembers.forEach(member => {
        balances[member.id] = 0;
    });
    
    sharedExpenses.forEach(expense => {
        if (!expense.settled) {
            const splitAmount = expense.amount / expense.splitWith.length;
            balances[expense.paidBy] += expense.amount;
            expense.splitWith.forEach(memberId => {
                balances[memberId] -= splitAmount;
            });
        }
    });
    
    const settlements = [];
    for (const [memberId, balance] of Object.entries(balances)) {
        if (Math.abs(balance) > 1) {
            const member = teamMembers.find(m => m.id === memberId);
            if (member && member.id !== currentUser.id) {
                if (balance > 0) {
                    settlements.push(`${member.name} owes you ${fmt(balance)}`);
                } else if (balance < 0) {
                    settlements.push(`You owe ${member.name} ${fmt(Math.abs(balance))}`);
                }
            }
        }
    }
    
    const splitSummary = document.getElementById('split-summary');
    const splitItems = document.getElementById('split-items');
    
    if (settlements.length > 0) {
        splitSummary.style.display = 'block';
        splitItems.innerHTML = settlements.map(s => `<div class="split-item"><span>💰</span><span>${s}</span></div>`).join('');
    } else {
        splitSummary.style.display = 'none';
    }
}

function openInviteModal() {
    document.getElementById('invite-email').value = '';
    document.getElementById('invite-name').value = '';
    document.getElementById('invite-role').value = 'member';
    document.getElementById('invite-modal').classList.add('open');
}

function closeInviteModal() {
    document.getElementById('invite-modal').classList.remove('open');
}

function sendInvite() {
    const email = document.getElementById('invite-email').value.trim();
    const name = document.getElementById('invite-name').value.trim();
    const role = document.getElementById('invite-role').value;
    
    if (!email || !isValidEmail(email)) {
        toast('Please enter a valid email address');
        return;
    }
    
    if (!name) {
        toast('Please enter member name');
        return;
    }
    
    if (teamMembers.find(m => m.email === email)) {
        toast('User is already a team member');
        return;
    }
    
    const newMember = {
        id: generateId(),
        name: name,
        email: email,
        role: role,
        avatar: name.charAt(0).toUpperCase(),
        invited: true,
        invitedAt: new Date().toISOString()
    };
    
    teamMembers.push(newMember);
    saveTeamMembers(teamMembers);
    renderAll();
    closeInviteModal();
    toast(`Invitation sent to ${email}`);
}

function removeMember(memberId) {
    if (confirm('Remove this member from the team? They will lose access to shared expenses.')) {
        teamMembers = teamMembers.filter(m => m.id !== memberId);
        saveTeamMembers(teamMembers);
        renderAll();
        toast('Member removed');
    }
}

function openExpenseModal() {
    const paidBySelect = document.getElementById('expense-paidby');
    const splitWithDiv = document.getElementById('split-with-list');
    
    paidBySelect.innerHTML = teamMembers.map(m => `<option value="${m.id}" ${m.id === currentUser.id ? 'selected' : ''}>${escapeHtml(m.name)}</option>`).join('');
    
    splitWithDiv.innerHTML = teamMembers.map(m => `
        <label class="checkbox-label">
            <input type="checkbox" value="${m.id}" ${m.id === currentUser.id ? 'checked' : ''}> ${escapeHtml(m.name)}
        </label>
    `).join('');
    
    document.getElementById('expense-desc').value = '';
    document.getElementById('expense-amount').value = '';
    document.getElementById('expense-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('expense-modal').classList.add('open');
}

function closeExpenseModal() {
    document.getElementById('expense-modal').classList.remove('open');
}

function saveSharedExpense() {
    const description = document.getElementById('expense-desc').value.trim();
    const amount = parseFloat(document.getElementById('expense-amount').value);
    const paidBy = document.getElementById('expense-paidby').value;
    const date = document.getElementById('expense-date').value;
    
    const splitWith = Array.from(document.querySelectorAll('#split-with-list input:checked')).map(cb => cb.value);
    
    if (!description || !amount || amount <= 0) {
        toast('Please enter a valid description and amount');
        return;
    }
    
    if (!paidBy) {
        toast('Please select who paid');
        return;
    }
    
    if (splitWith.length === 0) {
        toast('Please select who to split with');
        return;
    }
    
    const newExpense = {
        id: generateId(),
        description,
        amount: amount.toFixed(2),
        paidBy,
        splitWith,
        date,
        settled: false,
        createdAt: new Date().toISOString()
    };
    
    sharedExpenses.push(newExpense);
    saveSharedExpenses(sharedExpenses);
    renderAll();
    closeExpenseModal();
    toast(`Shared expense "${description}" added`);
}

function markSettled(expenseId) {
    const expense = sharedExpenses.find(e => e.id === expenseId);
    if (expense) {
        expense.settled = true;
        saveSharedExpenses(sharedExpenses);
        renderAll();
        toast(`Marked "${expense.description}" as settled`);
    }
}

function settleWithMember(memberId) {
    const member = teamMembers.find(m => m.id === memberId);
    if (confirm(`Settle all pending amounts with ${member?.name}?`)) {
        sharedExpenses.forEach(expense => {
            if (!expense.settled) {
                if ((expense.paidBy === memberId && expense.splitWith.includes(currentUser.id)) ||
                    (expense.paidBy === currentUser.id && expense.splitWith.includes(memberId))) {
                    expense.settled = true;
                }
            }
        });
        saveSharedExpenses(sharedExpenses);
        renderAll();
        toast(`Settled all amounts with ${member?.name}`);
    }
}

function settleAll() {
    if (confirm('Mark all pending expenses as settled?')) {
        sharedExpenses.forEach(expense => {
            if (!expense.settled && expense.splitWith.includes(currentUser.id)) {
                expense.settled = true;
            }
        });
        saveSharedExpenses(sharedExpenses);
        renderAll();
        toast('All pending expenses marked as settled');
    }
}

function deleteExpense(expenseId) {
    if (confirm('Delete this shared expense?')) {
        sharedExpenses = sharedExpenses.filter(e => e.id !== expenseId);
        saveSharedExpenses(sharedExpenses);
        renderAll();
        toast('Expense deleted');
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