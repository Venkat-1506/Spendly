// ================================================
// AUTHENTICATION FUNCTIONS
// ================================================

// Check if user is authenticated for protected pages
function checkAuth() {
    const user = getCurrentUser();
    const publicPages = ['index.html', 'login.html', 'signup.html', 'about.html', 'contact.html', 'features.html', 'pricing.html', 'blog.html', 'blog-post.html', 'privacy.html', 'terms.html', ''];
    const currentPage = window.location.pathname.split('/').pop();
    
    if (user && (currentPage === 'login.html' || currentPage === 'signup.html')) {
        window.location.href = 'dashboard.html';
        return user;
    }
    
    if (!user && !publicPages.includes(currentPage) && currentPage !== '') {
        window.location.href = 'login.html';
        return null;
    }
    
    return user;
}

// Login function
function doLogin() {
    console.log('doLogin called');
    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    const rememberCheckbox = document.getElementById('remember-me');
    
    if (!emailInput || !passwordInput) {
        console.error('Login form elements not found');
        return;
    }
    
    const email = emailInput.value.trim();
    const pass = passwordInput.value;
    const remember = rememberCheckbox?.checked || false;
    
    if (!email || !pass) { 
        toast('Please fill in all fields'); 
        return; 
    }
    
    if (!isValidEmail(email)) {
        toast('Please enter a valid email address');
        return;
    }
    
    let users = getUsers();
    console.log('All users:', users);
    
    // Case-insensitive email comparison
    let user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === pass);
    
    if (!user) {
        toast('Invalid email or password');
        console.log('Login failed for:', email);
        return;
    }
    
    console.log('Login successful for:', user.email);
    
    const sessionUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        initials: initials(user.name),
        plan: user.plan || 'free',
        budget: user.budget || 15000,
        phone: user.phone || '',
        dob: user.dob || '',
        city: user.city || '',
        state: user.state || '',
        pincode: user.pincode || ''
    };
    
    localStorage.setItem('spendly_user', JSON.stringify(sessionUser));
    if (remember) {
        localStorage.setItem('spendly_remember', email);
    }
    
    toast('Login successful! Redirecting...');
    setTimeout(() => {
        window.location.href = 'dashboard.html';
    }, 500);
}

// Signup function
function doSignup() {
    console.log('doSignup called');
    const nameInput = document.getElementById('signup-name');
    const emailInput = document.getElementById('signup-email');
    const passwordInput = document.getElementById('signup-password');
    const confirmInput = document.getElementById('signup-confirm');
    const termsCheckbox = document.getElementById('terms-checkbox');
    
    if (!nameInput || !emailInput || !passwordInput) {
        console.error('Signup form elements not found');
        return;
    }
    
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const pass = passwordInput.value;
    const confirm = confirmInput?.value;
    const terms = termsCheckbox?.checked;
    
    if (!name || !email || !pass) { 
        toast('Please fill in all fields'); 
        return; 
    }
    
    if (!isValidEmail(email)) {
        toast('Please enter a valid email address');
        return;
    }
    
    if (pass.length < 6) {
        toast('Password must be at least 6 characters');
        return;
    }
    
    if (confirm && pass !== confirm) {
        toast('Passwords do not match');
        return;
    }
    
    if (!terms) {
        toast('Please agree to the Terms of Service');
        return;
    }
    
    let users = getUsers();
    console.log('Existing users:', users);
    
    // Check if user already exists (case-insensitive)
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
        toast('User already exists. Please login.');
        return;
    }
    
    const formattedName = capitalise(name);
    
    const newUser = {
        id: generateId(),
        name: formattedName,
        email: email,
        password: pass,
        plan: 'free',
        budget: 15000,
        createdAt: new Date().toISOString(),
        phone: '',
        dob: '',
        city: '',
        state: '',
        pincode: ''
    };
    
    users.push(newUser);
    localStorage.setItem('spendly_users', JSON.stringify(users));
    console.log('New user saved:', newUser);
    
    const sessionUser = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        initials: initials(name),
        plan: 'free',
        budget: 15000,
        phone: '',
        dob: '',
        city: '',
        state: '',
        pincode: ''
    };
    
    localStorage.setItem('spendly_user', JSON.stringify(sessionUser));
    
    // Initialize empty data for new user
    localStorage.setItem('spendly_expenses', '[]');
    localStorage.setItem('spendly_goals', '[]');
    localStorage.setItem('spendly_budgets', '[]');
    localStorage.setItem('spendly_total_budget', '15000');
    localStorage.setItem('spendly_team_members', JSON.stringify([{
        id: newUser.id,
        name: formattedName,
        email: email,
        role: 'admin',
        avatar: initials(name),
        totalSpent: 0,
        totalOwed: 0
    }]));
    localStorage.setItem('spendly_shared_expenses', '[]');
    
    toast('Account created successfully! Redirecting...');
    setTimeout(() => {
        window.location.href = 'dashboard.html';
    }, 500);
}

// Logout function
function doLogout() {
    localStorage.removeItem('spendly_user');
    localStorage.removeItem('spendly_remember');
    toast('Logged out successfully');
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 300);
}

// Toggle password visibility
function togglePassword() {
    const passwordInput = document.getElementById('login-password');
    const toggleBtn = document.querySelector('.password-toggle');
    if (passwordInput && toggleBtn) {
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleBtn.innerHTML = '🙈';
        } else {
            passwordInput.type = 'password';
            toggleBtn.innerHTML = '👁️';
        }
    }
}

// Toggle signup password visibility
function toggleSignupPassword() {
    const passwordInput = document.getElementById('signup-password');
    const toggleBtn = document.querySelector('#signup-password + .password-toggle');
    if (passwordInput && toggleBtn) {
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleBtn.innerHTML = '🙈';
        } else {
            passwordInput.type = 'password';
            toggleBtn.innerHTML = '👁️';
        }
    }
}

// Toggle signup confirm password visibility
function toggleSignupConfirm() {
    const confirmInput = document.getElementById('signup-confirm');
    const toggleBtn = document.querySelector('#signup-confirm + .password-toggle');
    if (confirmInput && toggleBtn) {
        if (confirmInput.type === 'password') {
            confirmInput.type = 'text';
            toggleBtn.innerHTML = '🙈';
        } else {
            confirmInput.type = 'password';
            toggleBtn.innerHTML = '👁️';
        }
    }
}

// Forgot password handler
function forgotPassword() {
    const emailInput = document.getElementById('login-email');
    const email = emailInput?.value;
    if (email && isValidEmail(email)) {
        let users = getUsers();
        if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
            toast('Password reset link sent to ' + email);
        } else {
            toast('Email not found');
        }
    } else {
        toast('Please enter your email address first');
    }
}

// Social login placeholder
function socialLogin(provider) {
    toast(`Login with ${provider} coming soon!`);
}

// Setup password strength meter
function setupPasswordStrength() {
    const passwordField = document.getElementById('signup-password');
    if (passwordField) {
        passwordField.addEventListener('input', function() {
            const password = this.value;
            let strength = 0;
            
            if (password.length >= 6) strength++;
            if (password.length >= 10) strength++;
            if (/[A-Z]/.test(password)) strength++;
            if (/[0-9]/.test(password)) strength++;
            if (/[^A-Za-z0-9]/.test(password)) strength++;
            
            const percentage = (strength / 5) * 100;
            const strengthBar = document.getElementById('strength-bar');
            const strengthText = document.getElementById('strength-text');
            
            if (strengthBar) {
                strengthBar.style.width = percentage + '%';
                if (percentage < 20) {
                    strengthBar.style.background = '#ef4444';
                } else if (percentage < 40) {
                    strengthBar.style.background = '#f59e0b';
                } else if (percentage < 70) {
                    strengthBar.style.background = '#10b981';
                } else {
                    strengthBar.style.background = '#059669';
                }
            }
            
            if (strengthText) {
                if (percentage < 20) {
                    strengthText.textContent = 'Weak password';
                    strengthText.style.color = '#ef4444';
                } else if (percentage < 40) {
                    strengthText.textContent = 'Fair password';
                    strengthText.style.color = '#f59e0b';
                } else if (percentage < 70) {
                    strengthText.textContent = 'Good password';
                    strengthText.style.color = '#10b981';
                } else {
                    strengthText.textContent = 'Strong password!';
                    strengthText.style.color = '#059669';
                }
            }
        });
    }
}

// ================================================
// INITIALIZATION
// ================================================

// Auto-redirect if already logged in
if (window.location.pathname.includes('login.html') || window.location.pathname.includes('signup.html')) {
    const user = getCurrentUser();
    if (user) {
        window.location.href = 'dashboard.html';
    }
}

// Check auth on protected pages
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    
    // Setup password strength on signup page
    if (document.getElementById('signup-password')) {
        setupPasswordStrength();
    }
    
    // Add enter key support for login
    const loginEmail = document.getElementById('login-email');
    const loginPassword = document.getElementById('login-password');
    if (loginEmail) {
        loginEmail.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') doLogin();
        });
    }
    if (loginPassword) {
        loginPassword.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') doLogin();
        });
    }
    
    // Add enter key support for signup
    const signupInputs = ['signup-name', 'signup-email', 'signup-password', 'signup-confirm'];
    signupInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') doSignup();
            });
        }
    });
});

// ================================================
// EXPORT TO GLOBAL SCOPE
// ================================================

window.checkAuth = checkAuth;
window.doLogin = doLogin;
window.doSignup = doSignup;
window.doLogout = doLogout;
window.togglePassword = togglePassword;
window.toggleSignupPassword = toggleSignupPassword;
window.toggleSignupConfirm = toggleSignupConfirm;
window.forgotPassword = forgotPassword;
window.socialLogin = socialLogin;