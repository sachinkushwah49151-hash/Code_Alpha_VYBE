// ==========================================================================
// VYBE — messages.js | Direct Messaging & Active Chat v3.0
// ==========================================================================

let activeThreadId = 'thread_aryan';
let messagesLangBound = false;

function initMessagesPage() {
  renderThreadList();
  renderActiveChat();
  initChatForm();
  if (!messagesLangBound) {
    messagesLangBound = true;
    window.addEventListener('vybe:langchange', () => {
      renderThreadList();
      renderActiveChat();
    });
  }
}

function renderThreadList() {
  const container = document.getElementById('threadsListContainer');
  if (!container) return;

  const threads = getThreads();

  container.innerHTML = threads.map(th => {
    const user = getUser(th.participantId);
    if (!user) return '';

    const isActive = th.id === activeThreadId;

    return `
      <div class="thread-row ${isActive ? 'active' : ''}" data-thread-id="${th.id}">
        <img src="${user.avatar || (window.getDefaultAvatarFallback ? window.getDefaultAvatarFallback(user.name) : '')}" class="avatar avatar-sm" alt="${user.name}" onerror="this.onerror=null;this.src=window.getDefaultAvatarFallback?window.getDefaultAvatarFallback(this.alt):'';">
        <div class="thread-preview-info">
          <div class="thread-name-line">
            <span class="thread-name">${user.name}</span>
            <span class="thread-time">${th.lastTimestamp}</span>
          </div>
          <div class="thread-snippet">${th.lastMessage}</div>
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.thread-row').forEach(row => {
    row.addEventListener('click', () => {
      activeThreadId = row.dataset.threadId;
      renderThreadList();
      renderActiveChat();
    });
  });
}

function renderActiveChat() {
  const header = document.getElementById('activeChatHeader');
  const scrollArea = document.getElementById('activeChatConversation');
  if (!header || !scrollArea) return;

  const threads = getThreads();
  const currentThread = threads.find(th => th.id === activeThreadId);
  if (!currentThread) return;

  const user = getUser(currentThread.participantId);
  if (!user) return;

  const activeText = typeof t === 'function' ? t('messages.activeNow') : 'Active now';

  header.innerHTML = `
    <a href="profile.html?user=${encodeURIComponent(user.username)}">
      <img src="${user.avatar || (window.getDefaultAvatarFallback ? window.getDefaultAvatarFallback(user.name) : '')}" class="avatar avatar-sm" alt="${user.name}" onerror="this.onerror=null;this.src=window.getDefaultAvatarFallback?window.getDefaultAvatarFallback(this.alt):'';">
    </a>
    <div>
      <a href="profile.html?user=${encodeURIComponent(user.username)}" style="font-weight: 700; font-size: 0.96rem; color: inherit; text-decoration: none;">${user.name}</a>
      <div style="font-size: 0.78rem; color: var(--text-muted);">@${user.username} · ${activeText}</div>
    </div>
  `;

  scrollArea.innerHTML = currentThread.messages.map(msg => {
    const isOwn = msg.from === 'usr_me';
    return `
      <div class="chat-bubble-row ${isOwn ? 'own' : 'other'}">
        <div class="chat-bubble">${msg.text}</div>
        <span class="chat-bubble-time">${msg.time}</span>
      </div>
    `;
  }).join('');

  scrollArea.scrollTop = scrollArea.scrollHeight;
}

function initChatForm() {
  const form = document.getElementById('chatMessageForm');
  const input = document.getElementById('chatMessageInput');
  const scrollArea = document.getElementById('activeChatConversation');

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    const threads = getThreads();
    const currentThread = threads.find(t => t.id === activeThreadId);
    if (!currentThread) return;

    const now = new Date();
    const hours = now.getHours();
    const mins = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    const timeStr = `${hour12}:${mins} ${ampm}`;

    currentThread.messages.push({
      from: 'usr_me',
      text: text,
      time: timeStr
    });
    currentThread.lastMessage = text;
    currentThread.lastTimestamp = 'Just now';

    saveThreads(threads);
    input.value = '';

    renderThreadList();
    renderActiveChat();
  });
}
