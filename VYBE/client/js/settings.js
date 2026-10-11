// ==========================================================================
// VYBE — settings.js | Clean Appearance, Language, Account & Security Settings
// ==========================================================================

function syncSettingsPreferenceControls() {
  const activeTheme = typeof getThemeMode === 'function' ? getThemeMode() : 'system';
  const activeLang = typeof getLanguage === 'function' ? getLanguage() : 'en';

  document.querySelectorAll('[data-set-theme]').forEach((btn) => {
    const isSelected = btn.dataset.setTheme === activeTheme;
    btn.classList.toggle('active', isSelected);
    btn.setAttribute('aria-checked', isSelected ? 'true' : 'false');
  });

  document.querySelectorAll('[data-set-lang]').forEach((btn) => {
    const isSelected = btn.dataset.setLang === activeLang;
    btn.classList.toggle('active', isSelected);
    btn.setAttribute('aria-checked', isSelected ? 'true' : 'false');
  });
}

function initSettingsPage() {
  const user = getCurrentUser();

  // Populate identity header & read-only fields
  const avatarEl       = document.getElementById('settingsAvatar');
  const nameEl         = document.getElementById('settingsName');
  const handleEl       = document.getElementById('settingsHandle');
  const emailEl        = document.getElementById('settingsEmail');
  const usernameInput  = document.getElementById('settingsUsernameInput');
  const joinedEl       = document.getElementById('settingsJoined');

  if (avatarEl) {
    avatarEl.alt = user.name || 'User';
    avatarEl.src = user.avatar || (window.getDefaultAvatarFallback ? window.getDefaultAvatarFallback(user.name) : '');
    avatarEl.onerror = function() {
      this.onerror = null;
      if (window.getDefaultAvatarFallback) {
        this.src = window.getDefaultAvatarFallback(this.alt);
      }
    };
  }
  if (nameEl)        nameEl.textContent = user.name || 'VYBE Member';
  if (handleEl)      handleEl.textContent = user.username ? `@${user.username}` : '@member';
  if (emailEl)       emailEl.textContent = user.email || `${user.username || 'member'}@vybe.social`;
  if (usernameInput) usernameInput.value = user.username ? `@${user.username}` : '';
  if (joinedEl) {
    const rawJoined = user.joinedDate || user.createdAt;
    if (rawJoined) {
      const parsed = new Date(rawJoined);
      joinedEl.textContent = !isNaN(parsed.getTime())
        ? parsed.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        : rawJoined;
    } else {
      joinedEl.textContent = '2025';
    }
  }

  // Populate editable fields
  const nameInput    = document.getElementById('settingsDisplayName');
  const bioInput     = document.getElementById('settingsBio');
  const websiteInput = document.getElementById('settingsWebsite');
  if (nameInput)    nameInput.value    = user.name    || '';
  if (bioInput)     bioInput.value     = user.bio     || '';
  if (websiteInput) websiteInput.value = user.website || '';

  // Appearance segmented selector
  syncSettingsPreferenceControls();
  document.querySelectorAll('[data-set-theme]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.setTheme;
      setThemeMode(mode);
      syncSettingsPreferenceControls();
      const label =
        mode === 'dark'
          ? t('settings.themeDark')
          : mode === 'system'
            ? t('settings.themeSystem')
            : t('settings.themeLight');
      showToast(`${t('settings.appearance')}: ${label}`, 'info');
    });
  });

  // Language segmented selector
  document.querySelectorAll('[data-set-lang]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const lang = btn.dataset.setLang;
      setLanguage(lang);
      syncSettingsPreferenceControls();
      const label = lang === 'hi' ? 'हिन्दी' : lang === 'fr' ? 'Français' : 'English';
      showToast(`${t('settings.language')}: ${label}`, 'info');
    });
  });

  window.addEventListener('vybe:themechange', syncSettingsPreferenceControls);
  window.addEventListener('vybe:langchange', () => {
    syncSettingsPreferenceControls();
    applyTranslations();
  });

  // Save Account Form
  const accountForm = document.getElementById('settingsAccountForm');
  accountForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const updatedName    = (nameInput?.value    || '').trim();
    const updatedBio     = (bioInput?.value     || '').trim();
    const updatedWebsite = (websiteInput?.value || '').trim();

    if (!updatedName) {
      showToast('Display name cannot be empty', 'error');
      return;
    }

    const btn = document.getElementById('btnSaveProfile');
    if (btn) {
      btn.textContent = t('settings.saving');
      btn.disabled = true;
    }

    try {
      let savedUser = null;
      if (window.api && api.users && typeof api.users.updateProfile === 'function') {
        try {
          const data = await api.users.updateProfile({
            name: updatedName,
            bio: updatedBio,
            website: updatedWebsite,
          });
          savedUser = data.user || data;
        } catch (apiErr) {
          console.warn('[settings] API updateProfile fallback:', apiErr.message);
        }
      }

      const merged = { ...getCurrentUser(), name: updatedName, bio: updatedBio, website: updatedWebsite };
      if (savedUser) Object.assign(merged, savedUser);
      saveCurrentUser(merged);

      if (avatarEl) {
        avatarEl.alt = merged.name || 'User';
        avatarEl.src = merged.avatar || (window.getDefaultAvatarFallback ? window.getDefaultAvatarFallback(merged.name) : '');
      }
      renderAppNavigation('settings');

      showToast(t('settings.profileSaved'), 'success');
    } catch (err) {
      console.error('[settings] Save profile error:', err);
      const merged = { ...getCurrentUser(), name: updatedName, bio: updatedBio, website: updatedWebsite };
      saveCurrentUser(merged);
      showToast(t('settings.profileSaved'), 'info');
    } finally {
      if (btn) {
        btn.textContent = t('settings.saveChanges');
        btn.disabled = false;
      }
    }
  });

  // Sign out
  document.getElementById('btnSettingsLogout')?.addEventListener('click', () => {
    logoutUser();
  });

  applyTranslations();
}


