// ==========================================================================
// VYBE — profile.js | Real User Profile, Stream, & Profile Editing
// ==========================================================================

let activeProfileTab = 'posts';
let currentProfileData = null;
let profilePostsCache = [];

async function initProfilePage() {
  const urlParams = new URLSearchParams(window.location.search);
  const targetUserParam = urlParams.get('user') || urlParams.get('id');

  await loadProfileData(targetUserParam);
  initProfileTabs();
  initEditProfileModal();
}

/**
 * Load user profile from MongoDB via API
 */
async function loadProfileData(identifier) {
  if (!isLoggedIn()) {
    window.location.replace('index.html');
    return;
  }
  const currentUser = getCurrentUser();
  const target = identifier || currentUser.username || currentUser._id || currentUser.id;
  if (!target) {
    clearAuthSession();
    window.location.replace('index.html');
    return;
  }

  try {
    const res = await api.users.getProfile(target);
    currentProfileData = res.user;

    // If viewing own profile, synchronize local storage cache
    if (currentProfileData.isSelf) {
      saveCurrentUser({
        ...currentUser,
        ...currentProfileData,
      });
    }

    renderProfileHeader(currentProfileData);
    await loadProfilePosts(currentProfileData);
  } catch (err) {
    console.warn('[VYBE Profile] Backend profile fetch failed:', err.message);
    currentProfileData = currentUser;
    renderProfileHeader(currentUser);
    await loadProfilePosts(currentUser);
  }
}

function renderProfileHeader(user = currentProfileData) {
  if (!user) return;
  const el = id => document.getElementById(id);

  if (el('profDisplayName')) el('profDisplayName').textContent = user.name || 'VYBE User';
  if (el('profHandle')) el('profHandle').textContent = `@${user.username || 'user'}`;
  if (el('profBio')) el('profBio').textContent = user.bio || '';
  if (el('profWebsite')) {
    const site = user.website || '';
    el('profWebsite').textContent = site || 'Add website';
    el('profWebsite').href = site ? (site.startsWith('http') ? site : `https://${site}`) : '#';
  }
  if (el('profAvatarImg')) {
    const avatarImg = el('profAvatarImg');
    avatarImg.alt = user.name || 'User';
    avatarImg.src = user.avatar || (window.getDefaultAvatarFallback ? window.getDefaultAvatarFallback(user.name) : '');
    avatarImg.onerror = function() {
      this.onerror = null;
      if (window.getDefaultAvatarFallback) {
        this.src = window.getDefaultAvatarFallback(this.alt);
      }
    };
  }

  const stats = user.stats || {
    posts: user.postsCount || 0,
    followers: user.followersCount || (Array.isArray(user.followers) ? user.followers.length : 0),
    following: user.followingCount || (Array.isArray(user.following) ? user.following.length : 0),
  };

  if (el('profStatPosts')) el('profStatPosts').textContent = stats.posts || 0;
  if (el('profStatFollowers')) el('profStatFollowers').textContent = formatMetric(stats.followers || 0);
  if (el('profStatFollowing')) el('profStatFollowing').textContent = formatMetric(stats.following || 0);

  // If viewing someone else's profile, adjust edit button to follow button
  const editBtn = el('btnOpenEditProfileModal');
  if (editBtn && !user.isSelf && user.id !== 'usr_me' && user.id !== getCurrentUser().id) {
    editBtn.removeAttribute('data-i18n');
    editBtn.textContent = user.is_following ? t('aside.following') : t('aside.follow');
    editBtn.className = `btn btn-sm ${user.is_following ? 'btn-secondary' : 'btn-primary'}`;
    editBtn.onclick = async (e) => {
      e.preventDefault();
      try {
        const res = await api.users.toggleFollow(user.id || user._id);
        user.is_following = res.following;
        editBtn.textContent = res.following ? t('aside.following') : t('aside.follow');
        editBtn.className = `btn btn-sm ${res.following ? 'btn-secondary' : 'btn-primary'}`;
        if (el('profStatFollowers')) el('profStatFollowers').textContent = formatMetric(res.followersCount);
        showToast(res.message, 'info');
      } catch (err) {
        showToast(err.message || 'Follow action failed', 'error');
      }
    };
  }

  // Share profile link
  const shareBtn = el('btnShareProfileLink');
  if (shareBtn && !shareBtn.dataset.boundShare) {
    shareBtn.dataset.boundShare = 'true';
    shareBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(window.location.href).then(
        () => showToast('Profile link copied to clipboard', 'success'),
        () => showToast('Could not copy link', 'info')
      );
    });
  }
}

function formatMetric(n) {
  if (typeof n !== 'number') n = parseInt(n, 10) || 0;
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'k';
  return n;
}

/**
 * Load posts belonging to this profile from MongoDB via API
 */
async function loadProfilePosts(user) {
  const container = document.getElementById('profilePostsContainer');
  if (!container) return;

  const authorIdentifier = user._id || user.id || user.username;

  try {
    const res = await api.posts.getAll({ author: authorIdentifier });
    profilePostsCache = res.posts || [];
    renderProfileStream();
  } catch (err) {
    console.warn('[VYBE Profile] Post fetch error:', err.message);
    const localPosts = getPosts().filter(p => p.authorId === 'usr_me' || p.authorId === authorIdentifier);
    profilePostsCache = localPosts;
    renderProfileStream();
  }
}

function renderProfileStream() {
  const container = document.getElementById('profilePostsContainer');
  if (!container) return;

  const posts = profilePostsCache;
  let filtered = [];

  const currentUser = getCurrentUser();
  const currentId = currentUser._id || currentUser.id || 'usr_me';

  if (activeProfileTab === 'posts') {
    filtered = posts;
  } else if (activeProfileTab === 'replies') {
    filtered = posts.filter(p => Array.isArray(p.replies) && p.replies.some(r => r.authorId === currentId || r.authorId === 'usr_me'));
  } else if (activeProfileTab === 'media') {
    filtered = posts.filter(p => p.mediaUrl || p.imageUrl || (Array.isArray(p.mediaGrid) && p.mediaGrid.length > 0));
  }

  if (filtered.length === 0) {
    const tabLabel = typeof t === 'function' ? t(`profile.${activeProfileTab}`).toLowerCase() : activeProfileTab;
    container.innerHTML = `
      <div class="empty-state-block">
        <div class="empty-state-icon">📭</div>
        <div class="empty-state-title">${typeof t === 'function' ? t('profile.emptyTab', { tab: tabLabel }) : `No ${activeProfileTab} yet`}</div>
        <div class="empty-state-sub">${typeof t === 'function' ? t('profile.emptyTabSub') : 'Shared posts and media will appear here.'}</div>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(post => renderPostHTML(post)).join('');
  attachPostInteractions(container);
}

function initProfileTabs() {
  const tabs = document.querySelectorAll('.feed-tab-btn[data-tab]');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      activeProfileTab = tab.dataset.tab;
      renderProfileStream();
    });
  });
}

function initEditProfileModal() {
  const modal = document.getElementById('editProfileModal');
  const openBtn = document.getElementById('btnOpenEditProfileModal');
  const closeBtn = document.getElementById('closeEditProfileBtn');
  const cancelBtn = document.getElementById('cancelEditProfileBtn');
  const form = document.getElementById('editProfileForm');
  const nameInput = document.getElementById('editProfNameInput');
  const bioInput = document.getElementById('editProfBioInput');
  const websiteInput = document.getElementById('editProfWebsiteInput');

  if (!modal || !form) return;

  const openModal = () => {
    const user = currentProfileData || getCurrentUser();
    nameInput.value = user.name || '';
    bioInput.value = user.bio || '';
    websiteInput.value = user.website || '';
    modal.classList.add('active');
    nameInput.focus();
  };

  const closeModal = () => {
    modal.classList.remove('active');
  };

  openBtn?.addEventListener('click', openModal);
  closeBtn?.addEventListener('click', closeModal);
  cancelBtn?.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    const newName = nameInput.value.trim();
    const newBio = bioInput.value.trim();
    const newWebsite = websiteInput.value.trim();

    try {
      const res = await api.users.updateProfile({
        name: newName,
        bio: newBio,
        website: newWebsite,
      });

      const updatedUser = res.user;
      currentProfileData = updatedUser;
      saveCurrentUser(updatedUser);

      closeModal();
      renderProfileHeader(updatedUser);
      renderAppNavigation('profile');
      showToast('Profile updated on VYBE! ✨', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update profile', 'error');
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}
