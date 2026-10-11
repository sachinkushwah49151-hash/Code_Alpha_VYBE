// ==========================================================================
// VYBE — explore.js | Discovery, Visual Grid, & Search Engine v4.0
// ==========================================================================

let exploreUsersCache = [];
let explorePostsCache = [];
let exploreVisibleCreators = 8;
let exploreVisiblePosts = 25;
let exploreLangBound = false;

async function initExplorePage() {
  initExploreMosaic();
  initExploreSearch();

  if (!exploreLangBound) {
    exploreLangBound = true;
    window.addEventListener('vybe:langchange', () => {
      renderExploreCreators(true);
      renderExplorePopularStream(true);
      const input = document.getElementById('exploreSearchInput');
      if (input && input.value.trim()) {
        input.dispatchEvent(new Event('input'));
      }
    });
  }

  await Promise.all([
    renderExploreCreators(),
    renderExplorePopularStream(),
  ]);

  // Check URL query parameters (e.g. from aside search or trending click)
  const urlParams = new URLSearchParams(window.location.search);
  const q = urlParams.get('q');
  if (q) {
    const input = document.getElementById('exploreSearchInput');
    if (input) {
      input.value = q;
      input.dispatchEvent(new Event('input'));
    }
  }
}

function initExploreMosaic() {
  document.querySelectorAll('.mosaic-tile[data-post-id]').forEach(tile => {
    tile.addEventListener('click', () => {
      const postId = tile.dataset.postId;
      const target = document.querySelector(`[data-post-id="${postId}"]`);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        target.style.transition = 'box-shadow 0.3s ease';
        target.style.boxShadow = '0 0 0 2px var(--accent)';
        setTimeout(() => { target.style.boxShadow = ''; }, 1600);
      }
    });
  });
}

async function renderExploreCreators(useCachedOnly = false) {
  const container = document.getElementById('exploreCreatorsList');
  if (!container) return;

  const tr = typeof t === 'function' ? t : (k) => k;

  if (!useCachedOnly || exploreUsersCache.length === 0) {
    try {
      const res = await api.users.getSuggested({ limit: 70 });
      if (res.users && res.users.length > 0) {
        exploreUsersCache = res.users;
      }
    } catch (err) {
      // fallback
    }
    if (exploreUsersCache.length === 0) {
      exploreUsersCache = getUsers().filter(u => u.id !== 'usr_me');
    }
  }

  const visible = exploreUsersCache.slice(0, exploreVisibleCreators);
  const hasMore = exploreUsersCache.length > visible.length;

  container.innerHTML = visible.map(u => {
    const interestsMarkup = Array.isArray(u.interests) && u.interests.length > 0
      ? `<div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 5px;">
          ${u.interests.slice(0, 3).map(tag => `<span style="font-size: 0.72rem; padding: 2px 8px; border-radius: 999px; background: var(--bg-secondary); color: var(--text-tertiary); font-weight: 600;">${tag}</span>`).join('')}
        </div>`
      : '';
    return `
      <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding: 6px 0;">
        <div style="display: flex; align-items: flex-start; gap: 12px; min-width: 0;">
          <a href="profile.html?user=${encodeURIComponent(u.username)}">
            <img src="${u.avatar || (window.getDefaultAvatarFallback ? window.getDefaultAvatarFallback(u.name) : '')}" class="avatar avatar-md" alt="${u.name}" onerror="this.onerror=null;this.src=window.getDefaultAvatarFallback?window.getDefaultAvatarFallback(this.alt):'';">
          </a>
          <div style="min-width: 0;">
            <a href="profile.html?user=${encodeURIComponent(u.username)}" style="font-weight: 700; font-size: 0.95rem; color: inherit; text-decoration: none;">${u.name}</a>
            <div style="font-size: 0.82rem; color: var(--text-muted);">@${u.username} · ${u.followers || '0'} ${tr('profile.followers').toLowerCase()}</div>
            <div style="font-size: 0.86rem; color: var(--text-secondary); margin-top: 2px;">${u.bio || ''}</div>
            ${interestsMarkup}
          </div>
        </div>
        <button class="btn-follow ${u.is_following ? 'following' : ''}" data-creator-id="${u.id || u._id}" style="flex-shrink: 0;">
          ${u.is_following ? tr('sidebar.following') : tr('sidebar.follow')}
        </button>
      </div>
    `;
  }).join('') + (hasMore ? `
    <div style="padding-top: 6px;">
      <button type="button" class="btn btn-secondary btn-sm" id="btnShowMoreCreators" style="width: 100%;">
        ${tr('explore.showMoreCreators')} (${visible.length} / ${exploreUsersCache.length})
      </button>
    </div>
  ` : '');

  document.getElementById('btnShowMoreCreators')?.addEventListener('click', () => {
    exploreVisibleCreators += 12;
    renderExploreCreators(true);
  });

  container.querySelectorAll('.btn-follow').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.creatorId;
      btn.disabled = true;
      try {
        const res = await api.users.toggleFollow(id);
        btn.classList.toggle('following', res.following);
        btn.textContent = res.following ? tr('sidebar.following') : tr('sidebar.follow');
        const cachedUser = exploreUsersCache.find(u => String(u.id || u._id) === String(id));
        if (cachedUser) cachedUser.is_following = res.following;
        showToast(res.message, 'info');
        renderDiscoverySidebar();
      } catch (err) {
        showToast(err.message || 'Follow request failed', 'error');
      } finally {
        btn.disabled = false;
      }
    });
  });
}

async function renderExplorePopularStream(useCachedOnly = false) {
  const container = document.getElementById('explorePopularPostsStream');
  if (!container) return;

  const tr = typeof t === 'function' ? t : (k) => k;

  if (!useCachedOnly || explorePostsCache.length === 0) {
    try {
      const res = await api.posts.getAll({ limit: 300 });
      if (res.posts && res.posts.length > 0) {
        explorePostsCache = res.posts;
      }
    } catch (err) {
      // fallback
    }
    if (explorePostsCache.length === 0) {
      explorePostsCache = getPosts();
    }
  }

  const sorted = [...explorePostsCache].sort((a, b) => {
    const aEng = (typeof a.likes === 'number' ? a.likes : 0) + (Array.isArray(a.replies) ? a.replies.length : (a.comments || 0));
    const bEng = (typeof b.likes === 'number' ? b.likes : 0) + (Array.isArray(b.replies) ? b.replies.length : (b.comments || 0));
    return bEng - aEng;
  });

  const visibleSlice = sorted.slice(0, exploreVisiblePosts);
  const hasMore = sorted.length > visibleSlice.length;

  const loadMoreHTML = `
    <div class="feed-load-more-bar">
      <div style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: ${hasMore ? '10px' : '0'};">
        ${tr('feed.showingPosts', { shown: visibleSlice.length, total: sorted.length })}
      </div>
      ${hasMore ? `
        <button type="button" class="btn btn-secondary btn-sm" id="btnExploreLoadMorePosts" style="padding: 8px 22px;">
          ${tr('feed.loadMore')}
        </button>
      ` : ''}
    </div>
  `;

  container.innerHTML = visibleSlice.map(post => renderPostHTML(post)).join('') + loadMoreHTML;
  attachPostInteractions(container);

  document.getElementById('btnExploreLoadMorePosts')?.addEventListener('click', () => {
    exploreVisiblePosts += 25;
    renderExplorePopularStream(true);
  });
}

function initExploreSearch() {
  const searchInput = document.getElementById('exploreSearchInput');
  const resultsArea = document.getElementById('exploreSearchResultsArea');
  const resultsList = document.getElementById('exploreSearchResultsList');
  const defaultArea = document.getElementById('exploreDefaultContent');

  if (!searchInput || !resultsArea || !resultsList || !defaultArea) return;

  searchInput.addEventListener('input', () => {
    const tr = typeof t === 'function' ? t : (k) => k;
    const query = searchInput.value.trim().toLowerCase();

    if (!query) {
      resultsArea.style.display = 'none';
      defaultArea.style.display = 'block';
      resultsList.innerHTML = '';
      return;
    }

    resultsArea.style.display = 'block';
    defaultArea.style.display = 'none';

    const posts = explorePostsCache.length > 0 ? explorePostsCache : getPosts();
    const users = exploreUsersCache.length > 0 ? exploreUsersCache : getUsers();

    // Match users across name, username, bio, and interests
    const matchedUsers = users.filter(u => {
      const inInterests = Array.isArray(u.interests) && u.interests.some(i => i.toLowerCase().includes(query));
      return (
        (u.name && u.name.toLowerCase().includes(query)) ||
        (u.username && u.username.toLowerCase().includes(query)) ||
        (u.bio && u.bio.toLowerCase().includes(query)) ||
        inInterests
      );
    });

    // Match posts across content, hashtags, and author
    const matchedPosts = posts.filter(p => {
      const author = p.author || getUser(p.authorId);
      const name = author && author.name ? author.name.toLowerCase() : '';
      const handle = author && author.username ? author.username.toLowerCase() : '';
      const content = (p.content || '').toLowerCase();
      return content.includes(query) || name.includes(query) || handle.includes(query);
    });

    let html = '';

    if (matchedUsers.length > 0) {
      html += `
        <div style="margin-bottom: 24px;">
          <div style="font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 12px;">${tr('explore.people')} (${matchedUsers.length})</div>
          <div style="display: flex; flex-direction: column; gap: 14px;">
            ${matchedUsers.slice(0, 20).map(u => `
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <a href="profile.html?user=${encodeURIComponent(u.username)}">
                    <img src="${u.avatar || (window.getDefaultAvatarFallback ? window.getDefaultAvatarFallback(u.name) : '')}" class="avatar avatar-md" alt="${u.name}" onerror="this.onerror=null;this.src=window.getDefaultAvatarFallback?window.getDefaultAvatarFallback(this.alt):'';">
                  </a>
                  <div>
                    <a href="profile.html?user=${encodeURIComponent(u.username)}" style="font-weight: 700; font-size: 0.95rem; color: inherit; text-decoration: none;">${u.name}</a>
                    <div style="font-size: 0.82rem; color: var(--text-muted);">@${u.username} · ${u.bio || ''}</div>
                  </div>
                </div>
                <button class="btn-follow ${u.is_following ? 'following' : ''}" data-creator-id="${u.id || u._id}">
                  ${u.is_following ? tr('sidebar.following') : tr('sidebar.follow')}
                </button>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    if (matchedPosts.length > 0) {
      html += `
        <div>
          <div style="font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 12px;">${tr('explore.posts')} (${matchedPosts.length})</div>
          <div class="post-stream">
            ${matchedPosts.slice(0, 30).map(post => renderPostHTML(post)).join('')}
          </div>
        </div>
      `;
    }

    if (matchedUsers.length === 0 && matchedPosts.length === 0) {
      html = `
        <div style="padding: 48px 16px; text-align: center; color: var(--text-secondary);">
          <div style="font-size: 32px; margin-bottom: 8px;">🔍</div>
          <div style="font-weight: 700; font-size: 1.05rem; margin-bottom: 4px;">${tr('explore.noResults', { query })}</div>
          <div style="font-size: 0.88rem; color: var(--text-muted);">${tr('explore.noResultsSub')}</div>
        </div>
      `;
    }

    resultsList.innerHTML = html;
    attachPostInteractions(resultsList);

    resultsList.querySelectorAll('.btn-follow').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.creatorId;
        btn.disabled = true;
        try {
          const res = await api.users.toggleFollow(id);
          btn.classList.toggle('following', res.following);
          btn.textContent = res.following ? tr('sidebar.following') : tr('sidebar.follow');
          const cachedUser = exploreUsersCache.find(u => String(u.id || u._id) === String(id));
          if (cachedUser) cachedUser.is_following = res.following;
          showToast(res.message, 'info');
          renderDiscoverySidebar();
        } catch (err) {
          showToast(err.message || 'Follow request failed', 'error');
        } finally {
          btn.disabled = false;
        }
      });
    });
  });
}
