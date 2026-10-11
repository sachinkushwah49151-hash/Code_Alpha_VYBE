// ==========================================================================
// VYBE — notifications.js | Activity Stream & Filters v3.1
// ==========================================================================

let activeActivityFilter = 'all';
let notificationsLangBound = false;

function initNotificationsPage() {
  renderActivityList();
  initActivityFilters();

  if (!notificationsLangBound) {
    notificationsLangBound = true;
    window.addEventListener('vybe:langchange', () => {
      renderActivityList();
    });
  }

  document.getElementById('btnMarkAllRead')?.addEventListener('click', () => {
    const notifs = getNotifications();
    notifs.forEach(n => { n.read = true; });
    saveNotifications(notifs);
    renderActivityList();
    renderAppNavigation('activity');
    showToast(typeof t === 'function' ? t('activity.markedRead') : 'All notifications marked as read', 'info');
  });
}

function initActivityFilters() {
  const chips = document.querySelectorAll('.activity-chip-btn');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeActivityFilter = chip.dataset.filter || 'all';
      renderActivityList();
    });
  });
}

function renderActivityList() {
  const container = document.getElementById('activityListContainer');
  if (!container) return;

  const tr = typeof t === 'function' ? t : (k, _v, fb) => fb || k;
  const notifs = getNotifications();
  let filtered = notifs;

  if (activeActivityFilter === 'mentions') {
    filtered = notifs.filter(n => n.type === 'comment' || n.type === 'repost');
  } else if (activeActivityFilter === 'follow') {
    filtered = notifs.filter(n => n.type === 'follow');
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state-block">
        <div class="empty-state-icon">🔔</div>
        <div class="empty-state-title">${tr('activity.emptyTitle', {}, 'No activity here')}</div>
        <div class="empty-state-sub">${tr('activity.emptySub', {}, "You're all caught up on notifications.")}</div>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(n => {
    const user = getUser(n.fromUserId);
    if (!user) return '';

    let badgeClass = 'badge-like';
    let badgeIcon = '♥';

    if (n.type === 'follow') {
      badgeClass = 'badge-follow';
      badgeIcon = '+';
    } else if (n.type === 'comment') {
      badgeClass = 'badge-comment';
      badgeIcon = '💬';
    } else if (n.type === 'repost') {
      badgeClass = 'badge-follow';
      badgeIcon = '🔁';
    }

    return `
      <div class="activity-item ${!n.read ? 'unread' : ''}" data-notif-id="${n.id}">
        <a href="profile.html?user=${encodeURIComponent(user.username)}" style="position: relative; flex-shrink: 0;">
          <img src="${user.avatar || (window.getDefaultAvatarFallback ? window.getDefaultAvatarFallback(user.name) : '')}" class="avatar avatar-md" alt="${user.name}" onerror="this.onerror=null;this.src=window.getDefaultAvatarFallback?window.getDefaultAvatarFallback(this.alt):'';">
          <span class="activity-icon-badge ${badgeClass}" style="font-size: 11px;">${badgeIcon}</span>
        </a>
        <div style="flex: 1; min-width: 0;">
          <div class="activity-text-line">
            <a href="profile.html?user=${encodeURIComponent(user.username)}"><strong>${user.name}</strong></a> ${n.text}
          </div>
          <div class="activity-timestamp">${n.timestamp}</div>
        </div>
        ${!n.read ? `<span class="activity-unread-dot" aria-label="Unread"></span>` : ''}
      </div>
    `;
  }).join('');

  container.querySelectorAll('.activity-item').forEach(item => {
    item.addEventListener('click', () => {
      const id = item.dataset.notifId;
      const allNotifs = getNotifications();
      const target = allNotifs.find(n => n.id === id);
      if (target && !target.read) {
        target.read = true;
        saveNotifications(allNotifs);
        renderActivityList();
        renderAppNavigation('activity');
      }
    });
  });
}

