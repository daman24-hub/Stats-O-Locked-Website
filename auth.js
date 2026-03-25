// =============================================
// Auth.js — Supabase Authentication Logic
// =============================================

// Toast notification helper
function showToast(message, type = 'error') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
        <span class="toast-message">${message}</span>
    `;
    container.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => toast.classList.add('show'));

    // Auto-remove after 4 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Set button loading state
function setLoading(btn, loading) {
    const text = btn.querySelector('.btn-text-content');
    const loader = btn.querySelector('.btn-loader');
    if (loading) {
        text.style.display = 'none';
        loader.style.display = 'inline-flex';
        btn.disabled = true;
    } else {
        text.style.display = 'inline';
        loader.style.display = 'none';
        btn.disabled = false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on the auth page
    const signinForm = document.getElementById('signin-form');
    const signupForm = document.getElementById('signup-form');
    if (!signinForm || !signupForm) return;

    // ---- Panel Toggle Logic ----
    const toggleSignin = document.getElementById('toggle-signin');
    const toggleSignup = document.getElementById('toggle-signup');
    const slider = document.querySelector('.toggle-slider');
    const switchToSignup = document.getElementById('switch-to-signup');
    const switchToSignin = document.getElementById('switch-to-signin');

    function showPanel(panel) {
        const container = document.querySelector('.auth-container');
        if (panel === 'signup') {
            signinForm.classList.remove('active');
            signupForm.classList.add('active');
            toggleSignin.classList.remove('active');
            toggleSignup.classList.add('active');
            slider.style.transform = 'translateX(100%)';
            if (container) container.classList.add('auth-container-wide');
        } else {
            signupForm.classList.remove('active');
            signinForm.classList.add('active');
            toggleSignup.classList.remove('active');
            toggleSignin.classList.add('active');
            slider.style.transform = 'translateX(0)';
            if (container) container.classList.remove('auth-container-wide');
        }
    }

    toggleSignin.addEventListener('click', () => showPanel('signin'));
    toggleSignup.addEventListener('click', () => showPanel('signup'));
    if (switchToSignup) switchToSignup.addEventListener('click', (e) => { e.preventDefault(); showPanel('signup'); });
    if (switchToSignin) switchToSignin.addEventListener('click', (e) => { e.preventDefault(); showPanel('signin'); });

    // ---- Password Visibility Toggle ----
    document.querySelectorAll('.password-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const input = document.getElementById(targetId);
            if (input.type === 'password') {
                input.type = 'text';
                btn.classList.add('visible');
            } else {
                input.type = 'password';
                btn.classList.remove('visible');
            }
        });
    });

    // ---- Forgot Password ----
    const forgotLink = document.getElementById('forgot-password-link');
    if (forgotLink) {
        forgotLink.addEventListener('click', async (e) => {
            e.preventDefault();
            const email = document.getElementById('signin-email').value.trim();
            if (!email) {
                showToast('Please enter your email address first.', 'error');
                return;
            }
            try {
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: window.location.origin + '/auth.html'
                });
                if (error) throw error;
                showToast('Password reset link sent! Check your email.', 'success');
            } catch (err) {
                showToast(err.message || 'Failed to send reset email.', 'error');
            }
        });
    }

    // ---- Password Strength Indicator ----
    const strengthInput = document.getElementById('signup-password');
    const strengthBar = document.getElementById('strength-bar');
    const strengthText = document.getElementById('strength-text');

    if (strengthInput && strengthBar) {
        strengthInput.addEventListener('input', () => {
            const val = strengthInput.value;
            let score = 0;
            if (val.length >= 6) score++;
            if (val.length >= 10) score++;
            if (/[A-Z]/.test(val)) score++;
            if (/[0-9]/.test(val)) score++;
            if (/[^A-Za-z0-9]/.test(val)) score++;

            const levels = [
                { width: '0%', color: 'transparent', text: '' },
                { width: '20%', color: '#ff1744', text: 'Weak' },
                { width: '40%', color: '#ff9100', text: 'Fair' },
                { width: '60%', color: '#ffd600', text: 'Medium' },
                { width: '80%', color: '#00e676', text: 'Strong' },
                { width: '100%', color: '#00f0ff', text: 'Very Strong' }
            ];

            const level = levels[score] || levels[0];
            strengthBar.style.width = level.width;
            strengthBar.style.background = level.color;
            strengthText.textContent = level.text;
            strengthText.style.color = level.color;
        });
    }

    // ---- Sign Up ----
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('signup-btn');
        const name = document.getElementById('signup-name').value.trim();
        const email = document.getElementById('signup-email').value.trim();
        const phone = document.getElementById('signup-phone')?.value.trim() || '';
        const regNumber = document.getElementById('signup-reg')?.value.trim() || '';
        const branch = document.getElementById('signup-branch')?.value.trim() || '';
        const year = document.getElementById('signup-year')?.value || '';
        const interest = document.getElementById('signup-interest')?.value || '';
        const bio = document.getElementById('signup-bio')?.value.trim() || '';
        const linkedin = document.getElementById('signup-linkedin')?.value.trim() || '';
        const github = document.getElementById('signup-github')?.value.trim() || '';
        const password = document.getElementById('signup-password').value;
        const confirm = document.getElementById('signup-confirm').value;

        if (password !== confirm) {
            showToast('Passwords do not match.', 'error');
            return;
        }
        if (password.length < 6) {
            showToast('Password must be at least 6 characters.', 'error');
            return;
        }

        setLoading(btn, true);
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: name,
                        phone: phone,
                        registration_number: regNumber,
                        branch: branch,
                        year_of_study: year,
                        area_of_interest: interest,
                        bio: bio,
                        linkedin_url: linkedin,
                        github_url: github
                    }
                }
            });

            if (error) throw error;

            if (data.user && data.user.identities && data.user.identities.length === 0) {
                showToast('An account with this email already exists.', 'error');
            } else {
                showToast('Account created! Check your email to confirm, or sign in now.', 'success');
                setTimeout(() => showPanel('signin'), 1500);
            }
        } catch (err) {
            showToast(err.message || 'Sign up failed. Please try again.', 'error');
        } finally {
            setLoading(btn, false);
        }
    });

    // ---- Sign In ----
    signinForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('signin-btn');
        const email = document.getElementById('signin-email').value.trim();
        const password = document.getElementById('signin-password').value;

        setLoading(btn, true);
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

            showToast('Signed in successfully! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } catch (err) {
            showToast(err.message || 'Invalid email or password.', 'error');
        } finally {
            setLoading(btn, false);
        }
    });

    // ---- If already logged in, redirect away from auth page ----
    (async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            window.location.href = 'index.html';
        }
    })();
});
