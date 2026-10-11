// ==========================================================================
// VYBE — feed.js | Real Social Feed & Backend Interactions
// ==========================================================================

let activeFeedFilter = 'all';
let feedPostsCache = [];
let feedVisibleCount = 25;
let feedLangListenerBound = false;

// Bookmark helpers (bookmarks.js may not be loaded on feed page — keep these self-contained)
function isBookmarked(postId) {
  try {
    const raw = localStorage.getItem('vybe_bookmarks');
    if (!raw) return false;
    const list = JSON.parse(raw);
    return list.some(p => String(p._id || p.id) === String(postId));
  } catch (e) { return false; }
}

function toggleFeedBookmark(post) {
  try {
    const raw = localStorage.getItem('vybe_bookmarks');
    const list = raw ? JSON.parse(raw) : [];
    const id = String(post._id || post.id || '');
    const idx = list.findIndex(p => String(p._id || p.id) === id);
    if (idx === -1) {
      list.unshift(post);
      localStorage.setItem('vybe_bookmarks', JSON.stringify(list));
      return true;
    } else {
      list.splice(idx, 1);
      localStorage.setItem('vybe_bookmarks', JSON.stringify(list));
      return false;
    }
  } catch (e) { return false; }
}

async function initFeedPage() {
  const user = getCurrentUser();
  const avatarEl = document.getElementById('composerCurrentUserAvatar');
  if (avatarEl) {
    avatarEl.alt = user.name || 'User';
    avatarEl.src = user.avatar || (window.getDefaultAvatarFallback ? window.getDefaultAvatarFallback(user.name) : '');
    avatarEl.onerror = function() {
      this.onerror = null;
      if (window.getDefaultAvatarFallback) this.src = window.getDefaultAvatarFallback(this.alt);
    };
  }

  initInlineComposer();
  initFeedFilterTabs();
  if (!feedLangListenerBound) {
    feedLangListenerBound = true;
    window.addEventListener('vybe:langchange', () => {
      if (document.getElementById('postsStreamContainer')) {
        renderFeedPosts(feedPostsCache);
      }
    });
  }
  await loadAndRenderFeed();
}

function initFeedFilterTabs() {
  const tabs = document.querySelectorAll('.feed-tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', async () => {
      tabs.forEach(tEl => {
        tEl.classList.remove('active');
        tEl.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      activeFeedFilter = tab.dataset.filter || 'all';
      feedVisibleCount = 25;
      await loadAndRenderFeed();
    });
  });
}

/**
 * Load posts from backend via api.posts.getAll()
 */
async function loadAndRenderFeed() {
  const container = document.getElementById('postsStreamContainer');
  if (!container) return;

  const tr = typeof t === 'function' ? t : (k) => k;

  // Show subtle loading state if first load
  if (feedPostsCache.length === 0) {
    container.innerHTML = `
      <div style="padding: 48px 20px; text-align: center; color: var(--text-muted);">
        <div style="font-size: 1.8rem; margin-bottom: 8px;">⏳</div>
        <div>${tr('feed.loading')}</div>
      </div>
    `;
  }

  try {
    const params = { limit: 300 };
    if (activeFeedFilter === 'following') params.filter = 'following';

    const res = await api.posts.getAll(params);
    let posts = res.posts || [];

    // Fallback: If database is completely empty on fresh install, merge with default demo posts
    if (posts.length === 0) {
      const mockPosts = getPosts();
      if (activeFeedFilter === 'following') {
        const followingUsernames = ['priyasharma', 'ananya.ux', 'rahulv'];
        posts = mockPosts.filter(p => {
          const authUsername = (p.author && p.author.username) || '';
          const authId = (p.authorId || (p.author && (p.author._id || p.author.id)) || '').toString();
          return followingUsernames.includes(authUsername) || ['usr_2', 'usr_4', 'usr_7'].includes(authId);
        });
      } else {
        posts = mockPosts;
      }
    }

    feedPostsCache = posts;
    renderFeedPosts(posts);
  } catch (err) {
    console.warn('[VYBE Feed] Backend load failed, falling back to local cache:', err.message);
    let cached = getPosts();
    if (activeFeedFilter === 'following') {
      const followingUsernames = ['priyasharma', 'ananya.ux', 'rahulv'];
      cached = cached.filter(p => {
        const authUsername = (p.author && p.author.username) || '';
        const authId = (p.authorId || (p.author && (p.author._id || p.author.id)) || '').toString();
        return followingUsernames.includes(authUsername) || ['usr_2', 'usr_4', 'usr_7'].includes(authId);
      });
    }
    feedPostsCache = cached;
    renderFeedPosts(cached);
  }
}

function renderFeedPosts(posts = feedPostsCache) {
  const container = document.getElementById('postsStreamContainer');
  if (!container) return;

  const tr = typeof t === 'function' ? t : (k) => k;

  if (!posts || posts.length === 0) {
    container.innerHTML = `
      <div style="padding: 64px 20px; text-align: center; color: var(--text-secondary);">
        <div style="font-size: 36px; margin-bottom: 10px;">✨</div>
        <div style="font-weight: 700; font-size: 1.1rem; margin-bottom: 6px;">
          ${activeFeedFilter === 'following' ? tr('feed.emptyFollowing') : tr('feed.emptyForYou')}
        </div>
        <div style="font-size: 0.9rem; color: var(--text-muted); max-width: 320px; margin: 0 auto;">
          ${activeFeedFilter === 'following'
            ? tr('feed.emptyFollowingSub')
            : tr('feed.emptyForYouSub')}
        </div>
      </div>
    `;
    return;
  }

  const visibleSlice = posts.slice(0, feedVisibleCount);
  const hasMore = posts.length > visibleSlice.length;

  const loadMoreHTML = `
    <div class="feed-load-more-bar">
      <div style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: ${hasMore ? '10px' : '0'};">
        ${tr('feed.showingPosts', { shown: visibleSlice.length, total: posts.length })}
      </div>
      ${hasMore ? `
        <button type="button" class="btn btn-secondary btn-sm" id="btnFeedLoadMore" style="padding: 8px 22px;">
          ${tr('feed.loadMore')}
        </button>
      ` : ''}
    </div>
  `;

  container.innerHTML = visibleSlice.map(post => renderPostHTML(post)).join('') + loadMoreHTML;
  attachPostInteractions(container);

  document.getElementById('btnFeedLoadMore')?.addEventListener('click', () => {
    feedVisibleCount += 25;
    renderFeedPosts(posts);
  });
}

function renderPostHTML(post) {
  const currentUser = getCurrentUser();
  const currentUserId = currentUser._id || currentUser.id;

  // Resolve author object
  let author = post.author;
  if (!author || typeof author !== 'object') {
    author = getUser(post.authorId) || {
      name: 'VYBE Member',
      username: 'member',
      avatar: (window.getDefaultAvatarFallback ? window.getDefaultAvatarFallback('VYBE Member') : ''),
    };
  }
  const authorAvatar = author.avatar || (window.getDefaultAvatarFallback ? window.getDefaultAvatarFallback(author.name) : '');

  const postAuthorId = (author._id || author.id || post.authorId || '').toString();
  const isOwn = postAuthorId === currentUserId || postAuthorId === 'usr_me';

  // Format hashtags
  const formattedContent = (post.content || '')
    .replace(/#([a-zA-Z0-9_]+)/g, '<span class="hashtag">#$1</span>');

  // Media rendering
  let mediaMarkup = '';
  const mediaUrl = post.mediaUrl || post.imageUrl;
  if (post.type === 'image_single' && mediaUrl) {
    mediaMarkup = `
      <div class="post-single-media">
        <img src="${mediaUrl}" alt="Post photo" loading="lazy">
      </div>
    `;
  } else if (post.type === 'image_grid_2' && Array.isArray(post.mediaGrid) && post.mediaGrid.length >= 2) {
    mediaMarkup = `
      <div class="post-media-grid-2">
        <img src="${post.mediaGrid[0]}" alt="Photo 1" loading="lazy">
        <img src="${post.mediaGrid[1]}" alt="Photo 2" loading="lazy">
      </div>
    `;
  } else if (mediaUrl) {
    mediaMarkup = `
      <div class="post-single-media">
        <img src="${mediaUrl}" alt="Post photo" loading="lazy">
      </div>
    `;
  }

  // Replies markup
  const replies = Array.isArray(post.replies) ? post.replies : (Array.isArray(post.comments) ? post.comments : []);
  const repliesMarkup = replies.map(r => {
    const repAuthor = r.author || getUser(r.authorId) || {
      name: 'Member',
      avatar: (window.getDefaultAvatarFallback ? window.getDefaultAvatarFallback('Member') : ''),
    };
    const repAvatar = repAuthor.avatar || (window.getDefaultAvatarFallback ? window.getDefaultAvatarFallback(repAuthor.name) : '');
    return `
      <div class="reply-row" data-comment-id="${r.id || r._id || ''}">
        <img src="${repAvatar}" class="avatar avatar-xs" alt="${repAuthor.name || 'Member'}" onerror="this.onerror=null;this.src=window.getDefaultAvatarFallback?window.getDefaultAvatarFallback(this.alt):'';">
        <div class="reply-content">
          <div><span class="reply-author">${repAuthor.name}</span>${r.text || r.content || ''}</div>
          <div class="reply-time">${r.timestamp || (r.createdAt ? formatTimeAgo(r.createdAt) : 'Recently')}</div>
        </div>
      </div>
    `;
  }).join('');

  const postId = post.id || post._id;
  const likesCount = typeof post.likes === 'number' ? post.likes : (Array.isArray(post.likes) ? post.likes.length : 0);
  const commentsCount = typeof post.comments === 'number' ? post.comments : (Array.isArray(post.comments) ? post.comments.length : replies.length);
  const timeDisplay = post.timestamp || (post.createdAt ? formatTimeAgo(post.createdAt) : 'Recently');

  return `
    <article class="post-item" data-post-id="${postId}">
      <div class="post-col-left">
        <a href="profile.html?user=${encodeURIComponent(author.username)}">
          <img src="${authorAvatar}" class="avatar avatar-sm" alt="${author.name || 'Author'}" onerror="this.onerror=null;this.src=window.getDefaultAvatarFallback?window.getDefaultAvatarFallback(this.alt):'';">
        </a>
      </div>

      <div class="post-col-right">
        <div class="post-meta-row">
          <div class="post-author-lockup">
            <a href="profile.html?user=${encodeURIComponent(author.username)}" class="post-author-name">${author.name}</a>
            <span class="post-author-handle">@${author.username}</span>
            <span class="post-timestamp">${timeDisplay}</span>
          </div>

          <div style="display: flex; align-items: center; gap: 4px;">
            ${isOwn ? `
              <button type="button" class="post-options-btn btn-delete-post" title="Delete post" aria-label="Delete post">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            ` : ''}
          </div>
        </div>

        <div class="post-text-body">${formattedContent}</div>

        ${mediaMarkup}

        <div class="post-actions-row">
          <!-- Like Button -->
          <button type="button" class="action-trigger like-action ${post.liked ? 'liked' : ''}" aria-label="Like post">
            ${ICONS.heart}
            <span class="like-counter">${likesCount}</span>
          </button>

          <!-- Comment Button -->
          <button type="button" class="action-trigger comment-action" aria-label="Comment">
            ${ICONS.comment}
            <span class="comment-counter">${commentsCount}</span>
          </button>

          <!-- Repost Button -->
          <button type="button" class="action-trigger repost-action ${post.reposted ? 'reposted' : ''}" aria-label="Repost">
            ${ICONS.repost}
            <span class="repost-counter">${post.reposts || 0}</span>
          </button>

          <!-- Share Button -->
          <button type="button" class="action-trigger share-action" aria-label="Share">
            ${ICONS.share}
          </button>

          <!-- Bookmark Button -->
          <button type="button" class="action-trigger bookmark-action ${isBookmarked(postId) ? 'bookmarked' : ''}" aria-label="Save post" style="margin-left: auto;">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="${isBookmarked(postId) ? 'currentColor' : 'none'}" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
          </button>
        </div>

        <!-- Hidden Comment Drawer -->
        <div class="post-replies-drawer" hidden>
          <div class="replies-list" style="display: flex; flex-direction: column; gap: 10px;">
            ${repliesMarkup}
          </div>

          <form class="reply-form" autocomplete="off">
            <img src="${currentUser.avatar || (window.getDefaultAvatarFallback ? window.getDefaultAvatarFallback(currentUser.name) : '')}" class="avatar avatar-xs" alt="${currentUser.name || 'User'}" onerror="this.onerror=null;this.src=window.getDefaultAvatarFallback?window.getDefaultAvatarFallback(this.alt):'';">
            <input type="text" class="reply-input" placeholder="${typeof t === 'function' ? t('feed.replyTo', { name: author.name }) : `Reply to ${author.name}...`}" maxlength="280" required>
            <button type="submit" class="btn btn-primary btn-sm" style="padding: 6px 14px; font-size: 0.8rem;">${typeof t === 'function' ? t('feed.reply') : 'Reply'}</button>
          </form>
        </div>
      </div>
    </article>
  `;
}

function formatTimeAgo(date) {
  if (!date) return 'Recently';
  const diffSec = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(date).toLocaleDateString();
}

function attachPostInteractions(container) {
  // 1. Real Like Toggling
  container.querySelectorAll('.like-action').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const article = btn.closest('[data-post-id]');
      const postId = article.dataset.postId;
      const counter = btn.querySelector('.like-counter');

      try {
        const res = await api.posts.toggleLike(postId);
        btn.classList.toggle('liked', res.liked);
        counter.textContent = res.likesCount;
        showToast(res.liked ? 'Liked post' : 'Unliked post', 'info');

        // Update local cache
        const cached = feedPostsCache.find(p => (p.id || p._id) === postId);
        if (cached) {
          cached.liked = res.liked;
          cached.likes = res.likesCount;
        }
      } catch (err) {
        // Smooth client-side like fallback
        const wasLiked = btn.classList.contains('liked');
        const nowLiked = !wasLiked;
        btn.classList.toggle('liked', nowLiked);
        let count = parseInt(counter.textContent, 10) || 0;
        count = nowLiked ? count + 1 : Math.max(0, count - 1);
        counter.textContent = count;

        const cached = feedPostsCache.find(p => (p.id || p._id) === postId);
        if (cached) {
          cached.liked = nowLiked;
          cached.likes = count;
        }
        const posts = getPosts();
        const found = posts.find(p => (p.id || p._id) === postId);
        if (found) {
          found.liked = nowLiked;
          found.likes = count;
          savePosts(posts);
        }
        showToast(nowLiked ? 'Liked post' : 'Unliked post', 'info');
      }
    });
  });

  // 2. Comment Drawer Toggling
  container.querySelectorAll('.comment-action').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const article = btn.closest('[data-post-id]');
      const drawer = article.querySelector('.post-replies-drawer');
      const isHidden = drawer.hasAttribute('hidden');
      if (isHidden) {
        drawer.removeAttribute('hidden');
        drawer.querySelector('.reply-input')?.focus();
      } else {
        drawer.setAttribute('hidden', '');
      }
    });
  });

  // 3. Real Comment Submission
  container.querySelectorAll('.reply-form').forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = form.querySelector('.reply-input');
      const text = input.value.trim();
      if (!text) return;

      const article = form.closest('[data-post-id]');
      const postId = article.dataset.postId;
      const submitBtn = form.querySelector('button[type="submit"]');

      if (submitBtn) submitBtn.disabled = true;

      try {
        let comment;
        let commentsCount;
        try {
          const res = await api.posts.addComment(postId, text);
          comment = res.comment;
          commentsCount = res.commentsCount;
        } catch (apiErr) {
          // Client fallback comment
          comment = {
            id: `cmt_${Date.now()}`,
            _id: `cmt_${Date.now()}`,
            text,
            content: text,
            author: getCurrentUser(),
            createdAt: new Date().toISOString(),
          };
          const counter = article.querySelector('.comment-counter');
          commentsCount = (parseInt(counter?.textContent, 10) || 0) + 1;
        }

        const repliesList = article.querySelector('.replies-list');
        const row = document.createElement('div');
        row.className = 'reply-row';
        row.setAttribute('data-comment-id', comment.id || comment._id);
        row.innerHTML = `
          <img src="${comment.author?.avatar || getCurrentUser().avatar || (window.getDefaultAvatarFallback ? window.getDefaultAvatarFallback(comment.author?.name || 'User') : '')}" class="avatar avatar-xs" alt="${comment.author?.name || 'User'}" onerror="this.onerror=null;this.src=window.getDefaultAvatarFallback?window.getDefaultAvatarFallback(this.alt):'';">
          <div class="reply-content">
            <div><span class="reply-author">${comment.author?.name}</span>${comment.text || comment.content}</div>
            <div class="reply-time">Just now</div>
          </div>
        `;
        repliesList.appendChild(row);

        // Update comment counter
        const counter = article.querySelector('.comment-counter');
        if (counter) counter.textContent = commentsCount;

        // Update local cache
        const cached = feedPostsCache.find(p => (p.id || p._id) === postId);
        if (cached) {
          if (!cached.replies) cached.replies = [];
          cached.replies.push(comment);
          cached.comments = commentsCount;
        }

        input.value = '';
        showToast('Reply published', 'success');
      } catch (err) {
        showToast(err.message || 'Failed to submit comment', 'error');
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  });

  // 4. Repost Toggling
  container.querySelectorAll('.repost-action').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      btn.classList.toggle('reposted');
      const counter = btn.querySelector('.repost-counter');
      const count = parseInt(counter.textContent, 10) || 0;
      counter.textContent = btn.classList.contains('reposted') ? count + 1 : Math.max(0, count - 1);
      showToast(btn.classList.contains('reposted') ? 'Post reposted' : 'Repost removed', 'info');
    });
  });

  // 5. Share Clipboard Link
  container.querySelectorAll('.share-action').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const article = btn.closest('[data-post-id]');
      const postId = article.dataset.postId;
      const url = `${window.location.origin}/feed.html#${postId}`;
      navigator.clipboard.writeText(url).then(
        () => showToast('Link copied to clipboard', 'success'),
        () => showToast('Could not copy link', 'info')
      );
    });
  });

  // 6. Real Post Deletion
  container.querySelectorAll('.btn-delete-post').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (!confirm('Are you sure you want to delete this post?')) return;

      const article = btn.closest('[data-post-id]');
      const postId = article.dataset.postId;
      btn.disabled = true;

      try {
        try {
          await api.posts.delete(postId);
        } catch (apiErr) {
          console.warn('[VYBE Feed] API delete post failed, removing locally:', apiErr.message);
        }

        feedPostsCache = feedPostsCache.filter(p => (p.id || p._id) !== postId);
        article.remove();

        const posts = getPosts().filter(p => (p.id || p._id) !== postId);
        savePosts(posts);

        const me = getCurrentUser();
        if (me.stats && me.stats.posts > 0) {
          me.stats.posts -= 1;
          saveCurrentUser(me);
        }

        showToast('Post deleted successfully', 'info');
      } catch (err) {
        showToast(err.message || 'Failed to delete post', 'error');
        btn.disabled = false;
      }
    });
  });

  // 7. Bookmark Toggle
  container.querySelectorAll('.bookmark-action').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const article = btn.closest('[data-post-id]');
      const postId = article.dataset.postId;
      const cachedPost = feedPostsCache.find(p => String(p._id || p.id) === String(postId));
      const saved = toggleFeedBookmark(cachedPost || { _id: postId });
      const svg = btn.querySelector('svg');
      if (svg) svg.setAttribute('fill', saved ? 'currentColor' : 'none');
      btn.classList.toggle('bookmarked', saved);
      showToast(saved ? 'Post saved to Bookmarks' : 'Bookmark removed', saved ? 'success' : 'info');
    });
  });
}

// --- REAL INLINE COMPOSER ENGINE ---
function initInlineComposer() {
  const form = document.getElementById('inlineComposerForm');
  const textarea = document.getElementById('inlineComposerText');
  const counter = document.getElementById('inlineCharCounter');
  const submitBtn = document.getElementById('inlinePostSubmitBtn');
  const attachPhotoBtn = document.getElementById('inlineAttachPhotoBtn');
  const urlZone = document.getElementById('inlineComposerUrlInputZone');
  const urlInput = document.getElementById('inlineComposerUrlInput');
  const previewZone = document.getElementById('inlineComposerImgPreviewZone');
  const previewImg = document.getElementById('inlineComposerImgPreview');
  const removeImgBtn = document.getElementById('inlineComposerRemoveImg');

  if (!form || !textarea) return;

  textarea.addEventListener('focus', () => {
    textarea.style.minHeight = '80px';
  });

  textarea.addEventListener('input', () => {
    const val = textarea.value;
    const remaining = 280 - val.length;
    if (counter) {
      counter.textContent = remaining;
      counter.classList.toggle('warning', remaining < 20);
    }
    if (submitBtn) {
      submitBtn.disabled = val.trim().length === 0;
    }
  });

  attachPhotoBtn?.addEventListener('click', () => {
    const isHidden = urlZone.style.display === 'none';
    urlZone.style.display = isHidden ? 'block' : 'none';
    if (isHidden) urlInput?.focus();
  });

  urlInput?.addEventListener('input', () => {
    const val = urlInput.value.trim();
    if (val) {
      previewImg.src = val;
      previewZone.style.display = 'block';
    } else {
      previewZone.style.display = 'none';
    }
  });

  removeImgBtn?.addEventListener('click', () => {
    urlInput.value = '';
    previewZone.style.display = 'none';
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const content = textarea.value.trim();
    if (!content) return;

    const img = urlInput?.value.trim() || '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Publishing...';
    }

    try {
      const res = await api.posts.create({
        content,
        mediaUrl: img,
      });

      const newPost = res.post;
      feedPostsCache.unshift(newPost);

      // Render new post at the top of the feed container
      const container = document.getElementById('postsStreamContainer');
      if (container) {
        // If container currently shows empty message, replace it
        if (container.querySelector('.post-item') === null) {
          container.innerHTML = renderPostHTML(newPost);
        } else {
          const temp = document.createElement('div');
          temp.innerHTML = renderPostHTML(newPost);
          const newEl = temp.firstElementChild;
          container.insertBefore(newEl, container.firstChild);
        }
        attachPostInteractions(container);
      }

      // Update current user stats
      const me = getCurrentUser();
      if (me.stats) {
        me.stats.posts = (me.stats.posts || 0) + 1;
        saveCurrentUser(me);
      }

      // Reset composer
      textarea.value = '';
      textarea.style.minHeight = '48px';
      if (urlInput) urlInput.value = '';
      if (previewZone) previewZone.style.display = 'none';
      if (urlZone) urlZone.style.display = 'none';
      if (counter) counter.textContent = '280';

      showToast('Post published to VYBE! 🚀', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to publish post', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Publish';
      }
    }
  });
}
