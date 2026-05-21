// Login & Signup page logic

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

function forgotPassword() {
    const email = document.getElementById('login-email')?.value;
    if (email && isValidEmail(email)) {
        showToastMessage('Password reset link sent to ' + email);
    } else {
        showToastMessage('Please enter your email address first');
    }
}

function socialLogin(provider) {
    showToastMessage(`Login with ${provider} coming soon!`);
}

function setupSignupPasswordStrength() {
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

// Initialize based on which page we're on
document.addEventListener('DOMContentLoaded', function() {
    // Login page initialization
    if (document.getElementById('login-email')) {
        const loginBtn = document.querySelector('.btn-login');
        if (loginBtn) {
            loginBtn.addEventListener('click', function(e) {
                e.preventDefault();
                doLogin();
            });
        }
        
        // Enter key support
        document.getElementById('login-email')?.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') doLogin();
        });
        document.getElementById('login-password')?.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') doLogin();
        });
    }
    
    // Signup page initialization
    if (document.getElementById('signup-name')) {
        setupSignupPasswordStrength();
        
        const signupBtn = document.getElementById('signup-btn');
        if (signupBtn) {
            signupBtn.addEventListener('click', function(e) {
                e.preventDefault();
                doSignup();
            });
        }
        
        // Enter key support for signup
        const signupInputs = ['signup-name', 'signup-email', 'signup-password', 'signup-confirm'];
        signupInputs.forEach(id => {
            document.getElementById(id)?.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') doSignup();
            });
        });
        
        // Google and GitHub buttons
        document.getElementById('google-signup')?.addEventListener('click', function() {
            socialLogin('Google');
        });
        document.getElementById('github-signup')?.addEventListener('click', function() {
            socialLogin('GitHub');
        });
    }
    
    // Google and GitHub login buttons
    document.querySelectorAll('.social-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const text = this.innerText;
            if (text.includes('Google')) socialLogin('Google');
            else if (text.includes('GitHub')) socialLogin('GitHub');
        });
    });
});

// Make functions global
window.togglePassword = togglePassword;
window.toggleSignupPassword = toggleSignupPassword;
window.toggleSignupConfirm = toggleSignupConfirm;
window.forgotPassword = forgotPassword;
window.socialLogin = socialLogin;