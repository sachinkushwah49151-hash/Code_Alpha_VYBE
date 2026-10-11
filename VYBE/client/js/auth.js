// ==========================================================================
// VYBE — auth.js | Sign-In, Registration, OAuth Status, & Safe Demo Access
// ==========================================================================

const ICONS_AUTH = {
  eye: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
  eyeOff: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`
};

const REMEMBER_ID_KEY = 'vybe_remembered_identifier';

function initLoginPage() {
  const form = document.getElementById('loginForm');
  const demoBtn = document.getElementById('quickDemoLoginBtn');
  const googleBtn = document.getElementById('btnGoogleAuth');
  const facebookBtn = document.getElementById('btnFacebookAuth');
  const togglePassBtn = document.getElementById('togglePasswordBtn');
  const passInput = document.getElementById('loginPassword');
  const emailInput = document.getElementById('loginEmail');
  const rememberCheck = document.getElementById('rememberMeCheckbox');

  // Restore remembered email/username if user previously checked "Remember me"
  const savedIdentifier = localStorage.getItem(REMEMBER_ID_KEY);
  if (savedIdentifier && emailInput) {
    emailInput.value = savedIdentifier;
  }

  // Toggle password visibility
  togglePassBtn?.addEventListener('click', () => {
    const isPass = passInput.type === 'password';
    passInput.type = isPass ? 'text' : 'password';
    togglePassBtn.innerHTML = isPass ? ICONS_AUTH.eyeOff : ICONS_AUTH.eye;
    togglePassBtn.setAttribute('aria-label', isPass ? 'Hide password' : 'Show password');
    togglePassBtn.setAttribute('aria-pressed', isPass ? 'true' : 'false');
  });

  // Clear field errors on input
  [emailInput, passInput].forEach(input => {
    input?.addEventListener('input', () => {
      input.classList.remove('input-error');
      const errId = input.id === 'loginEmail' ? 'loginEmailError' : 'loginPasswordError';
      hideFieldError(errId);
      hideFormAlert('loginFormAlert');
    });
  });

  // OAuth Provider Buttons (Verify actual backend configuration; never fake OAuth login)
  [googleBtn, facebookBtn].forEach(btn => {
    btn?.addEventListener('click', async () => {
      const providerName = btn.dataset.provider || 'OAuth';
      clearAuthErrors();
      try {
        const status = await api.auth.getOAuthStatus();
        const key = providerName.toLowerCase();
        if (status?.providers && status.providers[key]) {
          window.location.href = `${API_BASE_URL}/auth/${key}`;
          return;
        }
      } catch (_) {
        // Proceed to show honest unconfigured status
      }
      const msg = `${providerName} sign-in is not configured in this environment. Please sign in with your email/username or use the demo account.`;
      showFormAlert('loginFormAlert', msg, 'info');
      showToast(`${providerName} OAuth is not configured`, 'info');
    });
  });

  // Explicit Demo Account Button (Uses server-side /api/auth/demo — no hardcoded credentials in frontend)
  demoBtn?.addEventListener('click', async () => {
    clearAuthErrors();
    demoBtn.disabled = true;
    const labelSpan = demoBtn.querySelector('span');
    const originalText = labelSpan ? labelSpan.textContent : 'Try demo account';
    if (labelSpan) labelSpan.textContent = 'Starting demo preview…';

    try {
      const res = await api.auth.demoLogin();
      if (!res || !res.token || !res.user) {
        throw new Error('Demo account is currently unavailable.');
      }
      const remember = rememberCheck ? rememberCheck.checked : true;
      loginUser(res.user, res.token, remember);
      showToast(`Signed in to demo preview as @${res.user.username}`, 'success');
      window.location.replace('feed.html');
    } catch (err) {
      const msg = err.message || 'Could not start demo preview session.';
      showFormAlert('loginFormAlert', msg);
      showToast(msg, 'error');
    } finally {
      demoBtn.disabled = false;
      if (labelSpan) labelSpan.textContent = originalText;
    }
  });

  // Real Form Submission (Supports Email or Username)
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAuthErrors();

    const identifier = (emailInput?.value || '').trim();
    const pass = passInput?.value || '';
    const remember = rememberCheck ? rememberCheck.checked : true;
    let hasError = false;

    if (!identifier) {
      showError('loginEmailError', 'Please enter your email or username.', emailInput);
      hasError = true;
    } else if (identifier.includes('@') && !identifier.startsWith('@') && !isValidEmail(identifier)) {
      showError('loginEmailError', 'Please enter a valid email address.', emailInput);
      hasError = true;
    } else if (identifier.replace(/^@/, '').length < 3) {
      showError('loginEmailError', 'Username must be at least 3 characters.', emailInput);
      hasError = true;
    }

    if (!pass) {
      showError('loginPasswordError', 'Please enter your password.', passInput);
      hasError = true;
    } else if (pass.length < 6) {
      showError('loginPasswordError', 'Password must be at least 6 characters.', passInput);
      hasError = true;
    }

    if (hasError) return;

    const submitBtn = document.getElementById('loginSubmitBtn') || form.querySelector('button[type="submit"]');
    const submitText = document.getElementById('loginSubmitText');
    if (submitBtn) submitBtn.disabled = true;
    if (submitText) submitText.textContent = 'Signing in…';

    try {
      const res = await api.auth.login(identifier, pass);
      if (!res || !res.token || !res.user) {
        throw new Error('Authentication failed. Please try again.');
      }

      if (remember) {
        localStorage.setItem(REMEMBER_ID_KEY, identifier);
      } else {
        localStorage.removeItem(REMEMBER_ID_KEY);
      }

      loginUser(res.user, res.token, remember);
      showToast(`Welcome back, @${res.user.username}!`, 'success');
      window.location.replace('feed.html');
    } catch (err) {
      const msg = err.message || 'Invalid email/username or password.';
      showFormAlert('loginFormAlert', msg);
      passInput?.classList.add('input-error');
    } finally {
      if (submitBtn) submitBtn.disabled = false;
      if (submitText) submitText.textContent = 'Sign in';
    }
  });
}

function initRegisterPage() {
  const form = document.getElementById('registerForm');
  const togglePassBtn = document.getElementById('toggleRegPasswordBtn');
  const passInput = document.getElementById('regPassword');
  const nameInput = document.getElementById('regName');
  const usernameInput = document.getElementById('regUsername');
  const emailInput = document.getElementById('regEmail');

  // Toggle password visibility
  togglePassBtn?.addEventListener('click', () => {
    const isPass = passInput.type === 'password';
    passInput.type = isPass ? 'text' : 'password';
    togglePassBtn.innerHTML = isPass ? ICONS_AUTH.eyeOff : ICONS_AUTH.eye;
    togglePassBtn.setAttribute('aria-label', isPass ? 'Hide password' : 'Show password');
    togglePassBtn.setAttribute('aria-pressed', isPass ? 'true' : 'false');
  });

  // Clear field errors on input
  [
    [nameInput, 'regNameError'],
    [usernameInput, 'regUsernameError'],
    [emailInput, 'regEmailError'],
    [passInput, 'regPasswordError']
  ].forEach(([input, errId]) => {
    input?.addEventListener('input', () => {
      input.classList.remove('input-error');
      hideFieldError(errId);
      hideFormAlert('registerFormAlert');
    });
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAuthErrors();

    const name = (nameInput?.value || '').trim();
    const username = (usernameInput?.value || '').trim().replace(/^@/, '');
    const email = (emailInput?.value || '').trim();
    const pass = passInput?.value || '';
    let hasError = false;

    if (!name || name.length < 2) {
      showError('regNameError', 'Please enter your full name (at least 2 characters).', nameInput);
      hasError = true;
    }

    if (!username || username.length < 3) {
      showError('regUsernameError', 'Username must be at least 3 characters.', usernameInput);
      hasError = true;
    } else if (!/^[a-zA-Z0-9_.]+$/.test(username)) {
      showError('regUsernameError', 'Username may only contain letters, numbers, underscores, and dots.', usernameInput);
      hasError = true;
    }

    if (!email || !isValidEmail(email)) {
      showError('regEmailError', 'Please enter a valid email address.', emailInput);
      hasError = true;
    }

    if (!pass || pass.length < 6) {
      showError('regPasswordError', 'Password must be at least 6 characters.', passInput);
      hasError = true;
    }

    if (hasError) return;

    const submitBtn = document.getElementById('registerSubmitBtn') || form.querySelector('button[type="submit"]');
    const submitText = document.getElementById('registerSubmitText');
    if (submitBtn) submitBtn.disabled = true;
    if (submitText) submitText.textContent = 'Creating account…';

    try {
      const res = await api.auth.register(name, username, email, pass);
      if (!res || !res.token || !res.user) {
        throw new Error('Could not complete registration. Please try again.');
      }
      loginUser(res.user, res.token, true);
      showToast(`Welcome to VYBE, @${res.user.username}!`, 'success');
      window.location.replace('feed.html');
    } catch (err) {
      const msg = err.message || 'Registration failed.';
      showFormAlert('registerFormAlert', msg);
      if (msg.toLowerCase().includes('email')) {
        showError('regEmailError', msg, emailInput);
      } else if (msg.toLowerCase().includes('username')) {
        showError('regUsernameError', msg, usernameInput);
      }
    } finally {
      if (submitBtn) submitBtn.disabled = false;
      if (submitText) submitText.textContent = 'Create account';
    }
  });
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showError(elementId, text, inputEl) {
  const el = document.getElementById(elementId);
  if (el) {
    el.textContent = text;
    el.style.display = 'block';
  }
  if (inputEl) {
    inputEl.classList.add('input-error');
  }
}

function hideFieldError(elementId) {
  const el = document.getElementById(elementId);
  if (el) {
    el.textContent = '';
    el.style.display = 'none';
  }
}

function showFormAlert(alertId, text, type = 'error') {
  const el = document.getElementById(alertId);
  if (el) {
    el.textContent = text;
    el.classList.toggle('info', type === 'info');
    el.classList.add('visible');
  }
}

function hideFormAlert(alertId) {
  const el = document.getElementById(alertId);
  if (el) {
    el.textContent = '';
    el.classList.remove('visible', 'info');
  }
}

function clearAuthErrors() {
  document.querySelectorAll('.field-error-msg, [id$="Error"]').forEach(el => {
    el.textContent = '';
    el.style.display = 'none';
  });
  document.querySelectorAll('.glass-input.input-error, .input-field.input-error').forEach(el => {
    el.classList.remove('input-error');
  });
  document.querySelectorAll('.auth-alert').forEach(el => {
    el.textContent = '';
    el.classList.remove('visible', 'info');
  });
}
