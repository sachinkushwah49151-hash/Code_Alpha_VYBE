// ==========================================================================
// VYBE — bookmarks.js | Saved Posts Stream v2.0
// ==========================================================================

const BOOKMARKS_KEY = 'vybe_bookmarks';
let bookmarksLangBound = false;

function getBookmarks() {
  try {
    const raw = localStorage.getItem(BOOKMARKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('[bookmarks] Failed to parse saved bookmarks:', e);
    return [];
  }
}

function saveBookmarks(list) {
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(list));
}

function removeBookmark(postId) {
  const list = getBookmarks().filter(p => String(p._id || p.id) !== String(postId));
  saveBookmarks(list);
}

function clearAllBookmarks() {
  localStorage.removeItem(BOOKMARKS_KEY);
}

function renderBookmarks() {
  const container = document.getElementById('bookmarksContainer');
  const clearBtn = document.getElementById('btnClearBookmarks');
  if (!container) return;

  const tr = typeof t === 'function' ? t : (k, _v, fb) => fb || k;
  const bookmarks = getBookmarks();

  if (bookmarks.length === 0) {
    container.innerHTML = `
      <div class="empty-state-block">
        <div class="empty-state-icon">
          <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.6">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <div class="empty-state-title">${tr('bookmarks.emptyTitle', {}, 'No saved posts yet')}</div>
        <div class="empty-state-sub">${tr('bookmarks.emptySub', {}, 'Bookmark posts from your feed to revisit them anytime.')}</div>
      </div>
    `;
    if (clearBtn) clearBtn.style.display = 'none';
    return;
  }

  // Sync feedPostsCache so attachPostInteractions works seamlessly
  if (typeof feedPostsCache !== 'undefined') {
    feedPostsCache = bookmarks;
  }

  container.innerHTML = `<div class="post-stream">${bookmarks.map(p => renderPostHTML(p)).join('')}</div>`;
  if (clearBtn) clearBtn.style.display = 'inline-flex';

  if (typeof attachPostInteractions === 'function') {
    attachPostInteractions(container);
  }

  // When a bookmark icon is toggled off on the Bookmarks page, remove the card smoothly
  container.querySelectorAll('.bookmark-action').forEach(btn => {
    btn.addEventListener('click', () => {
      const article = btn.closest('[data-post-id]');
      const postId = article?.dataset.postId;
      if (postId && !isBookmarked(postId)) {
        article.remove();
        if (container.querySelectorAll('[data-post-id]').length === 0) {
          renderBookmarks();
        }
      }
    });
  });
}

function bindClearAll() {
  document.getElementById('btnClearBookmarks')?.addEventListener('click', () => {
    clearAllBookmarks();
    renderBookmarks();
    showToast(typeof t === 'function' ? t('bookmarks.cleared') : 'All bookmarks cleared', 'info');
  });
}

function initBookmarksPage() {
  renderBookmarks();
  bindClearAll();
  if (!bookmarksLangBound) {
    bookmarksLangBound = true;
    window.addEventListener('vybe:langchange', () => {
      renderBookmarks();
    });
  }
}

function toggleBookmark(post) {
  const list = getBookmarks();
  const id = String(post._id || post.id || '');
  const idx = list.findIndex(p => String(p._id || p.id) === id);
  if (idx === -1) {
    list.unshift(post);
    saveBookmarks(list);
    return true;
  } else {
    list.splice(idx, 1);
    saveBookmarks(list);
    return false;
  }
}

