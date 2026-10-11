// ==========================================================================
// VYBE — main.js | Core State, Auth Routing, Theme/i18n Engine, & App Shell
// ==========================================================================

// --- SYNCHRONOUS THEME & LANGUAGE INITIALIZATION (Zero Flash on Load) ---
const VYBE_THEME_KEY = 'vybe_theme';
const VYBE_LANG_KEY = 'vybe_lang';

function resolveEffectiveTheme(mode) {
  if (mode === 'dark' || mode === 'light') return mode;
  return 'light';
}

function getThemeMode() {
  try {
    const saved = localStorage.getItem(VYBE_THEME_KEY);
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
  } catch (e) {}
  return 'light';
}

function applyThemeToDOM(mode = getThemeMode()) {
  if (typeof document === 'undefined') return;
  const effective = resolveEffectiveTheme(mode);
  document.documentElement.setAttribute('data-theme', effective);
  document.documentElement.setAttribute('data-theme-mode', mode);
}

function setThemeMode(mode) {
  const validMode = ['light', 'dark', 'system'].includes(mode) ? mode : 'system';
  try {
    localStorage.setItem(VYBE_THEME_KEY, validMode);
  } catch (e) {}
  applyThemeToDOM(validMode);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('vybe:themechange', { detail: { mode: validMode, effective: resolveEffectiveTheme(validMode) } }));
  }
  updatePreferenceControlsState();
}

function getLanguage() {
  try {
    const saved = localStorage.getItem(VYBE_LANG_KEY);
    if (saved === 'en' || saved === 'hi' || saved === 'fr') return saved;
  } catch (e) {}
  return 'en';
}

// Run immediately before first paint
applyThemeToDOM(getThemeMode());
if (typeof document !== 'undefined') {
  document.documentElement.lang = getLanguage();
}
if (typeof window !== 'undefined' && window.matchMedia) {
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const onSystemChange = () => {
    if (getThemeMode() === 'system') {
      applyThemeToDOM('system');
      window.dispatchEvent(new CustomEvent('vybe:themechange', { detail: { mode: 'system', effective: resolveEffectiveTheme('system') } }));
    }
  };
  if (mq.addEventListener) mq.addEventListener('change', onSystemChange);
  else if (mq.addListener) mq.addListener(onSystemChange);
}

// --- DEVELOPMENT ENVIRONMENT & SESSION POLICY HELPERS ---
function isDevEnvironment() {
  if (typeof window === 'undefined') return true;
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0' || host.endsWith('.local');
}

function getServerBootCookie() {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/(?:^|;\s*)vybe_server_boot=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}

function isBrowserReload() {
  if (typeof window === 'undefined') return false;
  try {
    if (typeof performance !== 'undefined' && typeof performance.getEntriesByType === 'function') {
      const navEntries = performance.getEntriesByType('navigation');
      if (navEntries && navEntries.length > 0) {
        return navEntries[0].type === 'reload';
      }
    }
    if (typeof performance !== 'undefined' && performance.navigation) {
      return performance.navigation.type === 1;
    }
  } catch (e) {}
  return false;
}

function isExplicitEntryPage() {
  if (typeof window === 'undefined') return true;
  const path = window.location.pathname.toLowerCase();
  return (
    path === '/' ||
    path === '' ||
    path.endsWith('/index.html') ||
    path.endsWith('/login.html')
  );
}

function isPublicAuthPage() {
  if (typeof window === 'undefined') return true;
  const path = window.location.pathname.toLowerCase();
  return (
    path === '/' ||
    path === '' ||
    path.endsWith('/index.html') ||
    path.endsWith('/login.html') ||
    path.endsWith('/register.html') ||
    path.endsWith('/landing.html')
  );
}

// --- AUTHENTICATION STATE HELPERS ---
function clearAuthSession() {
  try {
    sessionStorage.removeItem('vybe_logged_in');
    sessionStorage.removeItem('vybe_current_user');
    sessionStorage.removeItem('vybe_token');
    localStorage.removeItem('vybe_logged_in');
    localStorage.removeItem('vybe_current_user');
    localStorage.removeItem('vybe_token');
  } catch (e) {}
}

// Development startup and session policy enforcement (synchronous before paint)
(function enforceDevStartupPolicy() {
  if (typeof window === 'undefined' || !isDevEnvironment()) return;

  const isReload = isBrowserReload();
  const serverBoot = getServerBootCookie();
  const lastKnownBoot = sessionStorage.getItem('vybe_server_boot_id');
  const serverRestarted = Boolean(serverBoot && lastKnownBoot && serverBoot !== lastKnownBoot);

  if (serverBoot) {
    sessionStorage.setItem('vybe_server_boot_id', serverBoot);
  }

  // Check if user just submitted login/registration and is completing the forward navigation
  const justLoggedIn = sessionStorage.getItem('vybe_just_logged_in');
  const isPostLoginNav = Boolean(
    justLoggedIn && Date.now() - parseInt(justLoggedIn, 10) < 5000
  );
  if (isPostLoginNav) {
    sessionStorage.removeItem('vybe_just_logged_in');
  }

  // 1. Hard refresh (Ctrl + Shift + R) or server restart: return to login screen
  if (isReload || serverRestarted) {
    clearAuthSession();
    if (!isPublicAuthPage()) {
      window.location.replace('index.html');
      return;
    }
  } else if (isExplicitEntryPage() && !isPostLoginNav) {
    // 2. Opening http://localhost:3000/ or index.html directly always displays the login page
    clearAuthSession();
  }
})();

function isLoggedIn() {
  const isDev = isDevEnvironment();
  // In development mode, prioritize sessionStorage for clean restart/tab scoping
  const sessionFlag = sessionStorage.getItem('vybe_logged_in') === 'true';
  const localFlag = !isDev && localStorage.getItem('vybe_logged_in') === 'true';
  const store = sessionFlag ? sessionStorage : (localFlag ? localStorage : null);

  if (!store) {
    if (
      sessionStorage.getItem('vybe_token') ||
      sessionStorage.getItem('vybe_current_user')
    ) {
      clearAuthSession();
    }
    return false;
  }

  const token = store.getItem('vybe_token');
  const rawUser = store.getItem('vybe_current_user');

  if (!token || !rawUser) {
    clearAuthSession();
    return false;
  }

  try {
    const parsed = JSON.parse(rawUser);
    if (!parsed || !parsed.username || (!parsed._id && !parsed.id)) {
      clearAuthSession();
      return false;
    }
    if (parsed.id === 'usr_me' && !parsed._id) {
      clearAuthSession();
      return false;
    }
    return true;
  } catch (e) {
    clearAuthSession();
    return false;
  }
}

// Immediate route guard before DOMContentLoaded on protected routes
if (typeof window !== 'undefined' && !isPublicAuthPage() && !isLoggedIn()) {
  window.location.replace('index.html');
}

function loginUser(userData, token, remember = true) {
  if (!userData || !token) {
    throw new Error('Valid user data and authentication token are required.');
  }
  clearAuthSession();

  // Mark forward post-login navigation to avoid false reload trigger
  sessionStorage.setItem('vybe_just_logged_in', Date.now().toString());

  // Store in sessionStorage so active browser tab session is authenticated
  sessionStorage.setItem('vybe_logged_in', 'true');
  sessionStorage.setItem('vybe_current_user', JSON.stringify(userData));
  sessionStorage.setItem('vybe_token', token);

  const serverBoot = getServerBootCookie();
  if (serverBoot) {
    sessionStorage.setItem('vybe_server_boot_id', serverBoot);
  }

  // In production, write to localStorage if user checked "Remember me"
  if (!isDevEnvironment() && remember) {
    localStorage.setItem('vybe_logged_in', 'true');
    localStorage.setItem('vybe_current_user', JSON.stringify(userData));
    localStorage.setItem('vybe_token', token);
  }
}

function logoutUser() {
  clearAuthSession();
  showToast('Signed out of VYBE', 'info');
  setTimeout(() => {
    window.location.replace('index.html');
  }, 200);
}

function requireAuth() {
  if (!isLoggedIn()) {
    window.location.replace('index.html');
    return false;
  }
  return true;
}

function redirectIfLoggedIn() {
  if (isDevEnvironment()) {
    // In development mode, root and login pages always display the login screen
    return false;
  }
  if (isLoggedIn()) {
    window.location.replace('feed.html');
    return true;
  }
  return false;
}

// --- GRACEFUL AVATAR FALLBACK GENERATOR (SVG Data URI) ---
function getDefaultAvatarFallback(name) {
  const cleanName = (name || 'Member').trim();
  const initials = cleanName
    ? cleanName.split(/\s+/).map(p => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
    : 'V';

  const PALETTES = [
    { bg: '#2563eb', fg: '#ffffff' }, // Blue
    { bg: '#4f46e5', fg: '#ffffff' }, // Indigo
    { bg: '#7c3aed', fg: '#ffffff' }, // Violet
    { bg: '#0891b2', fg: '#ffffff' }, // Cyan
    { bg: '#059669', fg: '#ffffff' }, // Emerald
    { bg: '#d97706', fg: '#ffffff' }, // Amber
    { bg: '#db2777', fg: '#ffffff' }, // Pink
    { bg: '#475569', fg: '#ffffff' }, // Slate
    { bg: '#0284c7', fg: '#ffffff' }, // Sky
    { bg: '#0d9488', fg: '#ffffff' }, // Teal
  ];
  let hash = 0;
  for (let i = 0; i < cleanName.length; i++) {
    hash = (hash << 5) - hash + cleanName.charCodeAt(i);
    hash |= 0;
  }
  const palette = PALETTES[Math.abs(hash) % PALETTES.length];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
    <rect width="100" height="100" rx="50" fill="${palette.bg}"/>
    <text x="50" y="55" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="38" font-weight="700" fill="${palette.fg}" text-anchor="middle" dominant-baseline="middle" letter-spacing="1">${initials}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

if (typeof window !== 'undefined') {
  window.getDefaultAvatarFallback = getDefaultAvatarFallback;
}

// --- CURRENT AUTHENTICATED USER ---
const EMPTY_GUEST_USER = {
  _id: '',
  id: '',
  name: '',
  username: '',
  email: '',
  avatar: '',
  bio: '',
  website: '',
  joinedDate: '',
  stats: {
    posts: 0,
    followers: 0,
    following: 0
  }
};

function getCurrentUser() {
  if (!isLoggedIn()) {
    return { ...EMPTY_GUEST_USER, stats: { ...EMPTY_GUEST_USER.stats } };
  }
  try {
    const stored =
      localStorage.getItem('vybe_current_user') ||
      sessionStorage.getItem('vybe_current_user');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed) {
        if (!parsed.avatar && parsed.name) {
          parsed.avatar = getDefaultAvatarFallback(parsed.name);
        }
        return parsed;
      }
    }
  } catch (e) {
    console.error(e);
  }
  return { ...EMPTY_GUEST_USER, stats: { ...EMPTY_GUEST_USER.stats } };
}

function saveCurrentUser(user) {
  if (!isLoggedIn() || !user || !user.username) return;
  const store =
    localStorage.getItem('vybe_logged_in') === 'true' ? localStorage : sessionStorage;
  store.setItem('vybe_current_user', JSON.stringify(user));
}

// --- COMMUNITY CREATORS (REALISTIC USERS) ---
const INITIAL_USERS = [
  {
    id: 'usr_1',
    name: 'Aryan Mehta',
    username: 'aryanmehta',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    bio: 'systems & infrastructure engineer. exploring modular monoliths, distributed state, and clean package boundaries.',
    is_following: false,
    followers: '1.2k'
  },
  {
    id: 'usr_2',
    name: 'Priya Sharma',
    username: 'priyasharma',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    bio: 'architectural photographer documenting modernist and brutalist structures across South Asia.',
    is_following: true,
    followers: '2.8k'
  },
  {
    id: 'usr_3',
    name: 'Kabir Sen',
    username: 'kabirsen',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    bio: 'creative technologist. writing shaders in GLSL, exploring procedural graphics and small indie games.',
    is_following: false,
    followers: '840'
  },
  {
    id: 'usr_4',
    name: 'Ananya Deshmukh',
    username: 'ananya.ux',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    bio: 'design systems lead. thoughtful about microcopy, component contracts, and cross-functional handoffs.',
    is_following: true,
    followers: '1.9k'
  },
  {
    id: 'usr_5',
    name: 'Siddharth Ray',
    username: 'sidd_ray',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    bio: 'backend developer. deep in Postgres internals, query optimization, and reliable storage architectures.',
    is_following: false,
    followers: '960'
  },
  {
    id: 'usr_6',
    name: 'Aisha Nair',
    username: 'aisha.nair',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
    bio: 'studio director @ craftlab. writing about creative rituals, context sharing, and studio operations.',
    is_following: false,
    followers: '1.4k'
  },
  {
    id: 'usr_7',
    name: 'Rahul Verma',
    username: 'rahulv',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    bio: 'independent software engineer building focused tools. writing notes on real production constraints.',
    is_following: true,
    followers: '2.1k'
  }
];

function getUsers() {
  try {
    const stored = localStorage.getItem('vybe_users');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        parsed.forEach(u => {
          const initMatch = INITIAL_USERS.find(iu => iu.username === u.username);
          if (initMatch && initMatch.avatar) {
            u.avatar = initMatch.avatar;
          } else if (!u.avatar && u.name) {
            u.avatar = getDefaultAvatarFallback(u.name);
          }
        });
        return parsed;
      }
    }
  } catch (e) {
    console.error(e);
  }
  return INITIAL_USERS;
}

function saveUsers(users) {
  localStorage.setItem('vybe_users', JSON.stringify(users));
}

function getUser(id) {
  if (!id) return null;
  if (id === 'usr_me') return getCurrentUser();
  const strId = String(id).toLowerCase();
  const allUsers = getUsers();
  const found = allUsers.find(
    (u) =>
      String(u.id || '').toLowerCase() === strId ||
      String(u._id || '').toLowerCase() === strId ||
      String(u.username || '').toLowerCase() === strId
  );
  if (found) {
    if (!found.avatar && found.name) {
      found.avatar = getDefaultAvatarFallback(found.name);
    }
    return found;
  }
  const initFound = INITIAL_USERS.find(
    (u) =>
      String(u.id || '').toLowerCase() === strId ||
      String(u.username || '').toLowerCase() === strId
  );
  if (initFound) return initFound;
  return null;
}

// --- 8+ RICH, VARIED REALISTIC POSTS ---
const INITIAL_POSTS = [
  {
    id: 'post_1',
    authorId: 'usr_1',
    type: 'text',
    content: "If your team has fewer than 25 engineers and you're debugging network timeouts across 12 microservices instead of shipping, you didn't buy scalability—you bought operational overhead. A well-structured modular monolith is still the fastest way to learn and iterate.",
    timestamp: '25m ago',
    likes: 46,
    liked: false,
    comments: 8,
    reposts: 5,
    replies: [
      { authorId: 'usr_me', text: 'Started my career chasing microservice architectures, now I optimize for package boundaries and single-process debugging.', timestamp: '18m ago' },
      { authorId: 'usr_5', text: 'Single database transaction boundaries alone save hundreds of hours of distributed rollbacks.', timestamp: '10m ago' }
    ]
  },
  {
    id: 'post_2',
    authorId: 'usr_2',
    type: 'image_single',
    content: "Morning light cutting across the Legislative Assembly portico in Chandigarh. The raw concrete holds 70 years of monsoons and still looks resolute. 📐🏛️ #architecture #design",
    mediaUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1000&auto=format&fit=crop&q=80',
    timestamp: '1h ago',
    likes: 78,
    liked: true,
    comments: 6,
    reposts: 11,
    replies: [
      { authorId: 'usr_4', text: 'The natural rake of light on the fluting is stunning Priya. Was this early dawn?', timestamp: '45m ago' }
    ]
  },
  {
    id: 'post_3',
    authorId: 'usr_me',
    type: 'image_grid_2',
    content: "Audited our component library this week: removed 6 redundant button variants and consolidated text styles from 14 down to 7. A design system shouldn't be a catalog of everything you've ever built; it's a contract of what you're willing to maintain. 🎨",
    mediaGrid: [
      'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=600&auto=format&fit=crop&q=80'
    ],
    timestamp: '3h ago',
    likes: 52,
    liked: false,
    comments: 9,
    reposts: 8,
    replies: [
      { authorId: 'usr_1', text: 'The hardest part of design systems is subtraction, not addition. Great milestone.', timestamp: '2h ago' }
    ]
  },
  {
    id: 'post_4',
    authorId: 'usr_4',
    type: 'poll',
    content: "How does your team handle design-to-code handoffs when minor microcopy changes happen post-spec? 📊👇",
    poll: {
      question: 'Design-to-Code Copy Handoff',
      totalVotes: 87,
      votedIndex: -1,
      options: [
        { label: 'Figma comments + direct PR', votes: 40, percentage: 46 },
        { label: 'Sync review before release', votes: 21, percentage: 24 },
        { label: 'Shared copy sheet / Notion', votes: 19, percentage: 22 },
        { label: 'Adjusted on the fly in code', votes: 7, percentage: 8 }
      ]
    },
    timestamp: '4h ago',
    likes: 34,
    liked: false,
    comments: 11,
    reposts: 4,
    replies: []
  },
  {
    id: 'post_5',
    authorId: 'usr_7',
    type: 'text',
    content: "Added a composite index on (tenant_id, created_at) yesterday. P99 latency dropped from 240ms to 18ms on our heaviest reporting queries. Sometimes you don't need a distributed cache—you just need the right index. #engineering #database",
    timestamp: '6h ago',
    likes: 68,
    liked: true,
    comments: 7,
    reposts: 14,
    replies: [
      { authorId: 'usr_5', text: 'Index selectivity is everything. Always inspect EXPLAIN ANALYZE before reaching for Redis.', timestamp: '5h ago' }
    ]
  },
  {
    id: 'post_6',
    authorId: 'usr_3',
    type: 'image_single',
    content: "Wrote a custom GLSL fragment shader for soft edge-blur in WebGL today. Balancing frame time on integrated mobile GPUs without pre-baking static textures is a satisfying optimization puzzle 🎮✨",
    mediaUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1000&auto=format&fit=crop&q=80',
    timestamp: '9h ago',
    likes: 39,
    liked: false,
    comments: 4,
    reposts: 7,
    replies: []
  },
  {
    id: 'post_7',
    authorId: 'usr_6',
    type: 'text',
    content: "The most productive design reviews always start with the problem statement written in plain English, not the Figma canvas. When the context is clear, the critique becomes about intent rather than personal taste.",
    timestamp: '12h ago',
    likes: 61,
    liked: false,
    comments: 12,
    reposts: 9,
    replies: [
      { authorId: 'usr_me', text: '100%. Framing the problem first eliminates 80% of subjective back-and-forth.', timestamp: '11h ago' }
    ]
  },
  {
    id: 'post_8',
    authorId: 'usr_5',
    type: 'text',
    content: "A friendly reminder to test your database backup restorations, not just the backup cron job. An untested backup isn't a backup—it's an unverified assumption. 🐘",
    timestamp: '15h ago',
    likes: 84,
    liked: false,
    comments: 15,
    reposts: 21,
    replies: []
  }
];

function getPosts() {
  try {
    const stored = localStorage.getItem('vybe_posts');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error(e);
  }
  return INITIAL_POSTS;
}

function savePosts(posts) {
  localStorage.setItem('vybe_posts', JSON.stringify(posts));
}

// --- ACTIVITY / NOTIFICATIONS MOCK DATA ---
const INITIAL_NOTIFICATIONS = [
  { id: 'n1', type: 'follow', fromUserId: 'usr_1', text: 'started following you', timestamp: '12m ago', read: false },
  { id: 'n2', type: 'like', fromUserId: 'usr_2', text: 'liked your post on Design Tokens', timestamp: '45m ago', read: false },
  { id: 'n3', type: 'comment', fromUserId: 'usr_4', text: 'commented: "The contrast in this frame is breathtaking!"', timestamp: '2h ago', read: false },
  { id: 'n4', type: 'repost', fromUserId: 'usr_7', text: 'reposted your thought on API simplicity', timestamp: '5h ago', read: true },
  { id: 'n5', type: 'like', fromUserId: 'usr_3', text: 'liked your comment', timestamp: '8h ago', read: true },
  { id: 'n6', type: 'follow', fromUserId: 'usr_6', text: 'started following you', timestamp: '1d ago', read: true }
];

function getNotifications() {
  try {
    const stored = localStorage.getItem('vybe_notifications');
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.error(e);
  }
  return INITIAL_NOTIFICATIONS;
}

function saveNotifications(notifs) {
  localStorage.setItem('vybe_notifications', JSON.stringify(notifs));
}

// --- MESSAGES THREADS MOCK DATA ---
const INITIAL_THREADS = [
  {
    id: 'thread_aryan',
    participantId: 'usr_1',
    lastMessage: 'Awesome, just pushed the PR to staging branch!',
    lastTimestamp: '15m ago',
    messages: [
      { from: 'usr_1', text: 'Hey Meera! Did you have a chance to look at the token schema?', time: '11:20 AM' },
      { from: 'usr_me', text: 'Yes! Loved the naming conventions. Especially the spacing scale.', time: '11:24 AM' },
      { from: 'usr_1', text: 'Great! Should we merge that into main today?', time: '11:25 AM' },
      { from: 'usr_me', text: 'Definitely, tested it across both themes and it looks super crisp.', time: '11:28 AM' },
      { from: 'usr_1', text: 'Awesome, just pushed the PR to staging branch!', time: '11:30 AM' }
    ]
  },
  {
    id: 'thread_priya',
    participantId: 'usr_2',
    lastMessage: 'Let me know if you want the high-res RAW exports.',
    lastTimestamp: '2h ago',
    messages: [
      { from: 'usr_2', text: 'Hey Meera, sent over the Chandigarh photo series!', time: '9:15 AM' },
      { from: 'usr_me', text: 'These architectural angles are incredible Priya 😍', time: '9:40 AM' },
      { from: 'usr_2', text: 'Let me know if you want the high-res RAW exports.', time: '9:45 AM' }
    ]
  },
  {
    id: 'thread_ananya',
    participantId: 'usr_4',
    lastMessage: 'See you at the design meetup tomorrow!',
    lastTimestamp: 'Yesterday',
    messages: [
      { from: 'usr_4', text: 'Are you attending the Bengaluru Design Systems meetup?', time: 'Yesterday' },
      { from: 'usr_me', text: 'Yes, looking forward to the micro-interactions panel!', time: 'Yesterday' },
      { from: 'usr_4', text: 'See you at the design meetup tomorrow!', time: 'Yesterday' }
    ]
  }
];

function getThreads() {
  try {
    const stored = localStorage.getItem('vybe_threads');
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.error(e);
  }
  return INITIAL_THREADS;
}

function saveThreads(threads) {
  localStorage.setItem('vybe_threads', JSON.stringify(threads));
}

// --- SVG ICONOGRAPHY DICTIONARY ---
const ICONS = {
  home: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  explore: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>`,
  activity: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,
  messages: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  profile: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  create: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  heart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
  comment: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>`,
  repost: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>`,
  share: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`,
  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
  image: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
  poll: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
  logout: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
  close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  bookmarks: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`,
  settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`
};

// --- TOAST NOTIFICATION ENGINE ---
function showToast(message, type = 'info') {
  let hub = document.querySelector('.vybe-toast-hub');
  if (!hub) {
    hub = document.createElement('div');
    hub.className = 'vybe-toast-hub';
    document.body.appendChild(hub);
  }

  const pill = document.createElement('div');
  pill.className = `toast-pill toast-${type}`;
  pill.textContent = message;
  hub.appendChild(pill);

  setTimeout(() => {
    pill.style.opacity = '0';
    pill.style.transform = 'translateY(10px)';
    pill.style.transition = 'all 0.25s ease';
    setTimeout(() => pill.remove(), 250);
  }, 2800);
}

// --- GLOBAL CREATE POST MODAL ---
function injectCreatePostModal() {
  if (document.getElementById('globalCreateModal')) return;

  const user = getCurrentUser();
  const modalHTML = `
    <div class="modal-backdrop" id="globalCreateModal" aria-modal="true" role="dialog">
      <div class="modal-dialog-card">
        <div class="modal-header-row">
          <span>Create Post</span>
          <button class="modal-close-btn" id="closeCreateModalBtn" aria-label="Close modal">
            ${ICONS.close}
          </button>
        </div>
        <form id="globalCreatePostForm">
          <div class="modal-body-content">
            <img src="${user.avatar || (window.getDefaultAvatarFallback ? window.getDefaultAvatarFallback(user.name) : '')}" class="avatar avatar-md" alt="${user.name || 'User'}" onerror="this.onerror=null;this.src=window.getDefaultAvatarFallback?window.getDefaultAvatarFallback(this.alt):'';">
            <div style="flex: 1; display: flex; flex-direction: column;">
              <textarea
                id="globalModalTextarea"
                class="composer-textarea"
                placeholder="What's happening? Share thoughts, updates, ideas..."
                rows="4"
                maxlength="280"
                style="min-height: 110px;"
                required
              ></textarea>

              <div id="modalImagePreviewZone" style="display:none; margin: 10px 0; border-radius:12px; overflow:hidden; border:1px solid var(--border-hairline); position:relative;">
                <img id="modalPreviewImg" src="" style="width:100%; max-height:240px; object-fit:cover;">
                <button type="button" id="modalRemoveImgBtn" style="position:absolute; top:8px; right:8px; background:rgba(0,0,0,0.6); color:#fff; border-radius:50%; width:28px; height:28px; display:flex; align-items:center; justify-content:center;">
                  ${ICONS.close}
                </button>
              </div>

              <div id="modalUrlInputZone" style="display:none; margin-top:8px;">
                <input type="url" id="modalImageUrlInput" class="input-field" placeholder="Paste image URL (e.g. Unsplash)..." style="font-size:0.86rem; padding:8px 12px;">
              </div>
            </div>
          </div>
          <div class="composer-footer" style="padding: 14px 20px;">
            <div class="composer-actions-bar">
              <button type="button" class="composer-action-btn" id="modalAttachPhotoBtn" title="Attach Image">
                ${ICONS.image}
              </button>
              <button type="button" class="composer-action-btn" id="modalSamplePresetBtn" title="Sample Photo Preset">
                ${ICONS.explore}
              </button>
            </div>
            <div class="composer-submit-group">
              <span id="modalCharCounter" class="composer-char-limit">280</span>
              <button type="submit" class="btn btn-accent btn-sm" id="modalSubmitPostBtn">
                Post
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);

  // Attach event listeners for the modal
  const modal = document.getElementById('globalCreateModal');
  const closeBtn = document.getElementById('closeCreateModalBtn');
  const form = document.getElementById('globalCreatePostForm');
  const textarea = document.getElementById('globalModalTextarea');
  const counter = document.getElementById('modalCharCounter');
  const attachBtn = document.getElementById('modalAttachPhotoBtn');
  const presetBtn = document.getElementById('modalSamplePresetBtn');
  const urlZone = document.getElementById('modalUrlInputZone');
  const urlInput = document.getElementById('modalImageUrlInput');
  const previewZone = document.getElementById('modalImagePreviewZone');
  const previewImg = document.getElementById('modalPreviewImg');
  const removeImgBtn = document.getElementById('modalRemoveImgBtn');

  closeBtn?.addEventListener('click', closeCreatePostModal);
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) closeCreatePostModal();
  });

  textarea?.addEventListener('input', () => {
    const remaining = 280 - textarea.value.length;
    counter.textContent = remaining;
    counter.classList.toggle('warning', remaining < 20);
  });

  attachBtn?.addEventListener('click', () => {
    urlZone.style.display = urlZone.style.display === 'none' ? 'block' : 'none';
    if (urlZone.style.display === 'block') urlInput.focus();
  });

  presetBtn?.addEventListener('click', () => {
    const samples = [
      'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80'
    ];
    const picked = samples[Math.floor(Math.random() * samples.length)];
    urlInput.value = picked;
    previewImg.src = picked;
    previewZone.style.display = 'block';
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

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const content = textarea.value.trim();
    if (!content) return;

    const img = urlInput.value.trim();
    const submitBtn = document.getElementById('modalSubmitPostBtn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Publishing...';
    }

    try {
      let newPost;
      try {
        if (typeof api !== 'undefined' && api.posts && typeof api.posts.create === 'function') {
          const res = await api.posts.create({
            content,
            mediaUrl: img || '',
          });
          newPost = res.post;
        }
      } catch (apiErr) {
        console.warn('[VYBE Modal] API post creation failed, using client storage:', apiErr.message);
      }

      if (!newPost) {
        newPost = {
          id: `post_${Date.now()}`,
          authorId: 'usr_me',
          author: getCurrentUser(),
          type: img ? 'image_single' : 'text',
          content: content,
          mediaUrl: img || '',
          timestamp: 'Just now',
          likes: 0,
          liked: false,
          comments: 0,
          reposts: 0,
          replies: []
        };
      }

      const posts = getPosts();
      posts.unshift(newPost);
      savePosts(posts);

      const me = getCurrentUser();
      if (me.stats) {
        me.stats.posts = (me.stats.posts || 0) + 1;
        saveCurrentUser(me);
      }

      closeCreatePostModal();
      textarea.value = '';
      urlInput.value = '';
      previewZone.style.display = 'none';
      showToast('Post published to VYBE! 🚀', 'success');

      if (typeof feedPostsCache !== 'undefined' && Array.isArray(feedPostsCache)) {
        feedPostsCache.unshift(newPost);
      }
      if (typeof renderFeedPosts === 'function') {
        renderFeedPosts();
      } else if (typeof renderProfileView === 'function') {
        renderProfileView();
      }
    } catch (err) {
      showToast(err.message || 'Failed to publish post', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Post';
      }
    }
  });
}

function openCreatePostModal() {
  injectCreatePostModal();
  const modal = document.getElementById('globalCreateModal');
  if (modal) {
    modal.classList.add('active');
    setTimeout(() => {
      document.getElementById('globalModalTextarea')?.focus();
    }, 150);
  }
}

function closeCreatePostModal() {
  const modal = document.getElementById('globalCreateModal');
  if (modal) modal.classList.remove('active');
}

// ==========================================================================
// MULTILINGUAL TRANSLATION DICTIONARY (English, हिन्दी, Français)
// ==========================================================================
const TRANSLATIONS = {
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.explore': 'Explore',
    'nav.activity': 'Activity',
    'nav.messages': 'Messages',
    'nav.bookmarks': 'Bookmarks',
    'nav.profile': 'Profile',
    'nav.settings': 'Settings',
    'nav.create': 'Create',
    'nav.logout': 'Log out',

    // Preferences & Themes
    'pref.theme': 'Theme',
    'pref.lang': 'Language',
    'pref.language': 'Language',
    'theme.light': 'Light',
    'theme.dark': 'Dark',
    'theme.system': 'System',

    // Feed & Composer
    'feed.forYou': 'For You',
    'feed.following': 'Following',
    'feed.composerPlaceholder': "What's on your mind?",
    'feed.postBtn': 'Post',
    'feed.publishing': 'Publishing...',
    'feed.loading': 'Loading feed...',
    'feed.loadMore': 'Load more posts',
    'feed.showingCount': 'Showing {shown} of {total} posts',
    'feed.showingPosts': 'Showing {shown} of {total} posts',
    'feed.emptyFollowingTitle': 'Your Following stream is quiet',
    'feed.emptyFollowing': 'Your Following stream is quiet',
    'feed.emptyFollowingSub': 'Follow more creators in the right sidebar to populate your customized feed.',
    'feed.emptyTitle': 'No posts in feed yet',
    'feed.emptyForYou': 'No posts in feed yet',
    'feed.emptySub': 'Be the first to share an update using the composer above!',
    'feed.emptyForYouSub': 'Be the first to share an update using the composer above!',
    'feed.replyPlaceholder': 'Write a reply...',
    'feed.replyTo': 'Reply to {name}...',
    'feed.replyBtn': 'Reply',
    'feed.reply': 'Reply',
    'feed.attachPhoto': 'Attach Photo',
    'feed.createPoll': 'Create Poll',
    'modal.createTitle': 'Create Post',
    'modal.placeholder': "What's happening? Share thoughts, updates, ideas...",

    // Discovery Sidebar
    'aside.searchPlaceholder': 'Search VYBE...',
    'aside.suggested': 'Suggested for you',
    'aside.refresh': 'Refresh',
    'aside.trending': 'Trending on VYBE',
    'aside.follow': 'Follow',
    'aside.following': 'Following',
    'sidebar.follow': 'Follow',
    'sidebar.following': 'Following',
    'aside.postsCount': 'posts',
    'aside.footerRights': '© 2026 VYBE · Connect. Share. Belong.',
    'aside.footerLinks': 'Privacy · Terms · Guidelines',

    // Explore
    'explore.searchPlaceholder': 'Search creators, hashtags, or topics...',
    'explore.searchResults': 'Search Results',
    'explore.creatorsTitle': 'Creators to Discover',
    'explore.showMoreCreators': 'Show more creators',
    'explore.trendingTitle': 'Trending Discussions',
    'explore.people': 'People',
    'explore.posts': 'Posts',
    'explore.noResults': 'No results found for "{query}"',
    'explore.noResultsSub': 'Try searching for a different handle, keyword, or hashtag.',

    // Activity
    'activity.title': 'Activity',
    'activity.markAllRead': 'Mark all as read',
    'activity.all': 'All',
    'activity.mentions': 'Mentions',
    'activity.followers': 'Followers',
    'activity.emptyTitle': 'No activity here',
    'activity.emptySub': "You're all caught up on notifications.",
    'activity.markedRead': 'All notifications marked as read',

    // Messages
    'messages.title': 'Messages',
    'messages.placeholder': 'Write a message...',
    'messages.inputPlaceholder': 'Write a message...',
    'messages.send': 'Send Message',
    'messages.activeNow': 'Active now',

    // Bookmarks
    'bookmarks.title': 'Bookmarks',
    'bookmarks.clearAll': 'Clear all',
    'bookmarks.emptyTitle': 'No saved posts yet',
    'bookmarks.emptySub': 'Bookmark posts from your feed to revisit them anytime.',
    'bookmarks.removed': 'Bookmark removed',
    'bookmarks.cleared': 'All bookmarks cleared',

    // Profile
    'profile.posts': 'Posts',
    'profile.followers': 'Followers',
    'profile.following': 'Following',
    'profile.editProfile': 'Edit profile',
    'profile.shareProfile': 'Share profile',
    'profile.tabPosts': 'Posts',
    'profile.tabReplies': 'Replies',
    'profile.tabMedia': 'Media',
    'profile.replies': 'Replies',
    'profile.media': 'Media',
    'profile.displayName': 'Display Name',
    'profile.bio': 'Bio',
    'profile.website': 'Website',
    'profile.cancel': 'Cancel',
    'profile.save': 'Save',
    'profile.emptyTab': 'No {tab} yet',
    'profile.emptyTabSub': 'Shared posts and media will appear here.',

    // Settings
    'settings.title': 'Settings',
    'settings.subtitle': 'Manage your appearance, language, account details, and security.',
    'settings.appearance': 'Appearance',
    'settings.appearanceSection': 'Appearance',
    'settings.appearanceLabel': 'Theme preference',
    'settings.appearanceSub': 'Choose how VYBE looks across the application.',
    'settings.themeLight': 'Light',
    'settings.themeDark': 'Dark',
    'settings.themeSystem': 'System',
    'settings.language': 'Language',
    'settings.languageSection': 'Language',
    'settings.languageLabel': 'Display language',
    'settings.languageSub': 'Select the language used for navigation, buttons, and menus.',
    'settings.langEn': 'English',
    'settings.langHi': 'हिन्दी',
    'settings.langFr': 'Français',
    'settings.account': 'Account',
    'settings.accountSection': 'Account',
    'settings.accountSub': 'Update your public profile details and account information.',
    'settings.profile': 'Account',
    'settings.displayName': 'Display name',
    'settings.username': 'Username',
    'settings.emailAddress': 'Email address',
    'settings.bio': 'Bio',
    'settings.website': 'Website',
    'settings.memberSince': 'Member since',
    'settings.saveChanges': 'Save changes',
    'settings.saving': 'Saving…',
    'settings.profileSaved': 'Account settings saved',
    'settings.security': 'Security',
    'settings.securitySection': 'Security',
    'settings.securitySub': 'Manage your password and active session.',
    'settings.currentPassword': 'Current password',
    'settings.newPassword': 'New password',
    'settings.updatePassword': 'Update password',
    'settings.updatingPassword': 'Updating…',
    'settings.passwordUpdated': 'Password updated successfully',
    'settings.session': 'Session',
    'settings.sessionSub': 'Sign out of your account on this browser.',
    'settings.signOut': 'Log out',

    // Auth Pages
    'auth.welcomeTitle': 'Welcome to VYBE',
    'auth.welcomeTagline': 'Connect. Share. Build together.',
    'auth.identifierPlaceholder': 'Email or username',
    'auth.passwordPlaceholder': 'Password',
    'auth.rememberMe': 'Remember me',
    'auth.signInBtn': 'Sign in',
    'auth.signingIn': 'Signing in...',
    'auth.orContinueWith': 'OR CONTINUE WITH',
    'auth.tryDemo': 'Try demo account',
    'auth.noAccount': 'New to VYBE?',
    'auth.createAccount': 'Create account',
    'auth.registerTitle': 'Create your account',
    'auth.registerTagline': 'Connect. Share. Build together.',
    'auth.fullNamePlaceholder': 'Full name',
    'auth.usernamePlaceholder': 'Username (e.g. rohan.v)',
    'auth.emailPlaceholder': 'Email address',
    'auth.createAccountBtn': 'Create account',
    'auth.haveAccount': 'Already on VYBE?',
    'auth.signInLink': 'Sign in',
  },

  hi: {
    // Navigation
    'nav.home': 'होम',
    'nav.explore': 'एक्सप्लोर',
    'nav.activity': 'गतिविधि',
    'nav.messages': 'संदेश',
    'nav.bookmarks': 'बुकमार्क',
    'nav.profile': 'प्रोफ़ाइल',
    'nav.settings': 'सेटिंग्स',
    'nav.create': 'पोस्ट करें',
    'nav.logout': 'लॉग आउट',

    // Preferences & Themes
    'pref.theme': 'थीम',
    'pref.lang': 'भाषा',
    'pref.language': 'भाषा',
    'theme.light': 'लाइट',
    'theme.dark': 'डार्क',
    'theme.system': 'सिस्टम',

    // Feed & Composer
    'feed.forYou': 'आपके लिए',
    'feed.following': 'फ़ॉलो किए गए',
    'feed.composerPlaceholder': 'आपके मन में क्या विचार चल रहा है?',
    'feed.postBtn': 'पोस्ट करें',
    'feed.publishing': 'प्रकाशित हो रहा है...',
    'feed.loading': 'फ़ीड लोड हो रही है...',
    'feed.loadMore': 'और पोस्ट लोड करें',
    'feed.showingCount': 'कुल {total} में से {shown} पोस्ट दिख रहे हैं',
    'feed.showingPosts': 'कुल {total} में से {shown} पोस्ट दिख रहे हैं',
    'feed.emptyFollowingTitle': 'आपकी फ़ॉलोइंग फ़ीड अभी शांत है',
    'feed.emptyFollowing': 'आपकी फ़ॉलोइंग फ़ीड अभी शांत है',
    'feed.emptyFollowingSub': 'अपनी फ़ीड को सक्रिय करने के लिए दाएँ साइडबार से और क्रिएटर्स को फ़ॉलो करें।',
    'feed.emptyTitle': 'फ़ीड में अभी कोई पोस्ट नहीं है',
    'feed.emptyForYou': 'फ़ीड में अभी कोई पोस्ट नहीं है',
    'feed.emptySub': 'ऊपर दिए गए कम्पोज़र से सबसे पहले अपना विचार साझा करें!',
    'feed.emptyForYouSub': 'ऊपर दिए गए कम्पोज़र से सबसे पहले अपना विचार साझा करें!',
    'feed.replyPlaceholder': 'अपना उत्तर लिखें...',
    'feed.replyTo': '{name} को उत्तर दें...',
    'feed.replyBtn': 'उत्तर दें',
    'feed.reply': 'उत्तर दें',
    'feed.attachPhoto': 'फ़ोटो जोड़ें',
    'feed.createPoll': 'पोल बनाएँ',
    'modal.createTitle': 'नया पोस्ट बनाएँ',
    'modal.placeholder': 'क्या नया हो रहा है? अपने विचार और अपडेट साझा करें...',

    // Discovery Sidebar
    'aside.searchPlaceholder': 'VYBE पर खोजें...',
    'aside.suggested': 'आपके लिए सुझाव',
    'aside.refresh': 'बदलें',
    'aside.trending': 'VYBE पर ट्रेंडिंग',
    'aside.follow': 'फ़ॉलो करें',
    'aside.following': 'फ़ॉलोइंग',
    'sidebar.follow': 'फ़ॉलो करें',
    'sidebar.following': 'फ़ॉलोइंग',
    'aside.postsCount': 'पोस्ट',
    'aside.footerRights': '© 2026 VYBE · जुड़ें। साझा करें।',
    'aside.footerLinks': 'गोपनीयता · शर्तें · दिशानिर्देश',

    // Explore
    'explore.searchPlaceholder': 'क्रिएटर्स, हैशटैग या विषय खोजें...',
    'explore.searchResults': 'खोज परिणाम',
    'explore.creatorsTitle': 'उभरते क्रिएटर्स',
    'explore.showMoreCreators': 'और क्रिएटर्स देखें',
    'explore.trendingTitle': 'चर्चित संवाद',
    'explore.people': 'लोग',
    'explore.posts': 'पोस्ट',
    'explore.noResults': '"{query}" के लिए कोई परिणाम नहीं मिला',
    'explore.noResultsSub': 'कोई दूसरा यूज़रनेम, शब्द या हैशटैग खोज कर देखें।',

    // Activity
    'activity.title': 'गतिविधि',
    'activity.markAllRead': 'सभी को पढ़ा हुआ चिह्नित करें',
    'activity.all': 'सभी',
    'activity.mentions': 'मेंशन',
    'activity.followers': 'फ़ॉलोअर्स',
    'activity.emptyTitle': 'यहाँ कोई गतिविधि नहीं है',
    'activity.emptySub': 'आपने सभी सूचनाएँ देख ली हैं।',
    'activity.markedRead': 'सभी सूचनाएँ पढ़ी हुई चिह्नित की गईं',

    // Messages
    'messages.title': 'संदेश',
    'messages.placeholder': 'नया संदेश लिखें...',
    'messages.inputPlaceholder': 'नया संदेश लिखें...',
    'messages.send': 'संदेश भेजें',
    'messages.activeNow': 'अभी सक्रिय',

    // Bookmarks
    'bookmarks.title': 'बुकमार्क',
    'bookmarks.clearAll': 'सभी हटाएँ',
    'bookmarks.emptyTitle': 'अभी कोई सहेजा गया पोस्ट नहीं है',
    'bookmarks.emptySub': 'बाद में पढ़ने के लिए फ़ीड से अपने पसंदीदा पोस्ट बुकमार्क करें।',
    'bookmarks.removed': 'बुकमार्क हटाया गया',
    'bookmarks.cleared': 'सभी बुकमार्क हटाए गए',

    // Profile
    'profile.posts': 'पोस्ट',
    'profile.followers': 'फ़ॉलोअर्स',
    'profile.following': 'फ़ॉलोइंग',
    'profile.editProfile': 'प्रोफ़ाइल संपादित करें',
    'profile.shareProfile': 'प्रोफ़ाइल साझा करें',
    'profile.tabPosts': 'पोस्ट',
    'profile.tabReplies': 'उत्तर',
    'profile.tabMedia': 'मीडिया',
    'profile.replies': 'उत्तर',
    'profile.media': 'मीडिया',
    'profile.displayName': 'प्रदर्शित नाम',
    'profile.bio': 'परिचय (बायो)',
    'profile.website': 'वेबसाइट',
    'profile.cancel': 'रद्द करें',
    'profile.save': 'सहेजें',
    'profile.emptyTab': 'अभी कोई {tab} नहीं है',
    'profile.emptyTabSub': 'साझा किए गए पोस्ट और मीडिया यहाँ दिखाई देंगे।',

    // Settings
    'settings.title': 'सेटिंग्स',
    'settings.subtitle': 'अपनी थीम, भाषा, खाता विवरण और सुरक्षा प्रबंधित करें।',
    'settings.appearance': 'दिखावट (अपीयरेंस)',
    'settings.appearanceSection': 'दिखावट (अपीयरेंस)',
    'settings.appearanceLabel': 'थीम प्राथमिकता',
    'settings.appearanceSub': 'चुनें कि पूरे एप्लिकेशन में VYBE कैसा दिखे।',
    'settings.themeLight': 'लाइट',
    'settings.themeDark': 'डार्क',
    'settings.themeSystem': 'सिस्टम',
    'settings.language': 'भाषा',
    'settings.languageSection': 'भाषा',
    'settings.languageLabel': 'प्रदर्शन भाषा',
    'settings.languageSub': 'नेविगेशन, बटन और मेनू के लिए अपनी पसंदीदा भाषा चुनें।',
    'settings.langEn': 'English',
    'settings.langHi': 'हिन्दी',
    'settings.langFr': 'Français',
    'settings.account': 'खाता',
    'settings.accountSection': 'खाता',
    'settings.accountSub': 'अपना सार्वजनिक प्रोफ़ाइल विवरण और खाता जानकारी अपडेट करें।',
    'settings.profile': 'खाता',
    'settings.displayName': 'प्रदर्शित नाम',
    'settings.username': 'यूज़रनेम',
    'settings.emailAddress': 'ईमेल पता',
    'settings.bio': 'परिचय (बायो)',
    'settings.website': 'वेबसाइट',
    'settings.memberSince': 'सदस्यता तिथि',
    'settings.saveChanges': 'परिवर्तन सहेजें',
    'settings.saving': 'सहेजा जा रहा है…',
    'settings.profileSaved': 'खाता सेटिंग्स सहेजी गईं',
    'settings.security': 'सुरक्षा',
    'settings.securitySection': 'सुरक्षा',
    'settings.securitySub': 'अपना पासवर्ड और सक्रिय सत्र प्रबंधित करें।',
    'settings.currentPassword': 'वर्तमान पासवर्ड',
    'settings.newPassword': 'नया पासवर्ड',
    'settings.updatePassword': 'पासवर्ड अपडेट करें',
    'settings.updatingPassword': 'अपडेट हो रहा है…',
    'settings.passwordUpdated': 'पासवर्ड सफलतापूर्वक अपडेट किया गया',
    'settings.session': 'सत्र (सेशन)',
    'settings.sessionSub': 'इस ब्राउज़र पर अपने खाते से साइन आउट करें।',
    'settings.signOut': 'लॉग आउट करें',

    // Auth Pages
    'auth.welcomeTitle': 'VYBE में आपका स्वागत है',
    'auth.welcomeTagline': 'जुड़ें। साझा करें। साथ मिलकर बनाएँ।',
    'auth.identifierPlaceholder': 'ईमेल या यूज़रनेम',
    'auth.passwordPlaceholder': 'पासवर्ड',
    'auth.rememberMe': 'मुझे याद रखें',
    'auth.signInBtn': 'साइन इन करें',
    'auth.signingIn': 'साइन इन हो रहा है...',
    'auth.orContinueWith': 'या इसके साथ जारी रखें',
    'auth.tryDemo': 'डेमो अकाउंट आज़माएँ',
    'auth.noAccount': 'VYBE पर नए हैं?',
    'auth.createAccount': 'खाता बनाएँ',
    'auth.registerTitle': 'अपना खाता बनाएँ',
    'auth.registerTagline': 'जुड़ें। साझा करें। साथ मिलकर बनाएँ।',
    'auth.fullNamePlaceholder': 'पूरा नाम',
    'auth.usernamePlaceholder': 'यूज़रनेम (जैसे rohan.v)',
    'auth.emailPlaceholder': 'ईमेल पता',
    'auth.createAccountBtn': 'खाता बनाएँ',
    'auth.haveAccount': 'पहले से VYBE पर हैं?',
    'auth.signInLink': 'साइन इन करें',
  },

  fr: {
    // Navigation
    'nav.home': 'Accueil',
    'nav.explore': 'Explorer',
    'nav.activity': 'Activité',
    'nav.messages': 'Messages',
    'nav.bookmarks': 'Favoris',
    'nav.profile': 'Profil',
    'nav.settings': 'Paramètres',
    'nav.create': 'Publier',
    'nav.logout': 'Se déconnecter',

    // Preferences & Themes
    'pref.theme': 'Thème',
    'pref.lang': 'Langue',
    'pref.language': 'Langue',
    'theme.light': 'Clair',
    'theme.dark': 'Sombre',
    'theme.system': 'Système',

    // Feed & Composer
    'feed.forYou': 'Pour vous',
    'feed.following': 'Abonnements',
    'feed.composerPlaceholder': 'À quoi pensez-vous ?',
    'feed.postBtn': 'Publier',
    'feed.publishing': 'Publication...',
    'feed.loading': 'Chargement du fil...',
    'feed.loadMore': 'Charger plus de publications',
    'feed.showingCount': 'Affichage de {shown} sur {total} publications',
    'feed.showingPosts': 'Affichage de {shown} sur {total} publications',
    'feed.emptyFollowingTitle': 'Votre fil Abonnements est calme',
    'feed.emptyFollowing': 'Votre fil Abonnements est calme',
    'feed.emptyFollowingSub': 'Suivez d’autres créateurs dans la colonne de droite pour enrichir votre fil.',
    'feed.emptyTitle': 'Aucune publication pour le moment',
    'feed.emptyForYou': 'Aucune publication pour le moment',
    'feed.emptySub': 'Soyez le premier à partager une idée ci-dessus !',
    'feed.emptyForYouSub': 'Soyez le premier à partager une idée ci-dessus !',
    'feed.replyPlaceholder': 'Écrire une réponse...',
    'feed.replyTo': 'Répondre à {name}...',
    'feed.replyBtn': 'Répondre',
    'feed.reply': 'Répondre',
    'feed.attachPhoto': 'Joindre une photo',
    'feed.createPoll': 'Créer un sondage',
    'modal.createTitle': 'Nouvelle publication',
    'modal.placeholder': 'Quoi de neuf ? Partagez vos idées, projets et notes...',

    // Discovery Sidebar
    'aside.searchPlaceholder': 'Rechercher sur VYBE...',
    'aside.suggested': 'Suggestions pour vous',
    'aside.refresh': 'Actualiser',
    'aside.trending': 'Tendances sur VYBE',
    'aside.follow': 'Suivre',
    'aside.following': 'Abonné',
    'sidebar.follow': 'Suivre',
    'sidebar.following': 'Abonné',
    'aside.postsCount': 'publications',
    'aside.footerRights': '© 2026 VYBE · Connecter. Partager.',
    'aside.footerLinks': 'Confidentialité · Conditions · Charte',

    // Explore
    'explore.searchPlaceholder': 'Rechercher des créateurs, hashtags ou sujets...',
    'explore.searchResults': 'Résultats de recherche',
    'explore.creatorsTitle': 'Créateurs à découvrir',
    'explore.showMoreCreators': 'Voir plus de créateurs',
    'explore.trendingTitle': 'Discussions populaires',
    'explore.people': 'Personnes',
    'explore.posts': 'Publications',
    'explore.noResults': 'Aucun résultat pour « {query} »',
    'explore.noResultsSub': 'Essayez un autre identifiant, mot-clé ou hashtag.',

    // Activity
    'activity.title': 'Activité',
    'activity.markAllRead': 'Tout marquer comme lu',
    'activity.all': 'Tout',
    'activity.mentions': 'Mentions',
    'activity.followers': 'Abonnés',
    'activity.emptyTitle': 'Aucune activité ici',
    'activity.emptySub': 'Vous êtes à jour dans vos notifications.',
    'activity.markedRead': 'Toutes les notifications ont été marquées comme lues',

    // Messages
    'messages.title': 'Messages',
    'messages.placeholder': 'Écrire un message...',
    'messages.inputPlaceholder': 'Écrire un message...',
    'messages.send': 'Envoyer',
    'messages.activeNow': 'En ligne',

    // Bookmarks
    'bookmarks.title': 'Favoris',
    'bookmarks.clearAll': 'Tout effacer',
    'bookmarks.emptyTitle': 'Aucun favori enregistré',
    'bookmarks.emptySub': 'Enregistrez des publications pour les retrouver facilement ici.',
    'bookmarks.removed': 'Retiré des favoris',
    'bookmarks.cleared': 'Tous les favoris ont été effacés',

    // Profile
    'profile.posts': 'Publications',
    'profile.followers': 'Abonnés',
    'profile.following': 'Abonnements',
    'profile.editProfile': 'Modifier le profil',
    'profile.shareProfile': 'Partager le profil',
    'profile.tabPosts': 'Publications',
    'profile.tabReplies': 'Réponses',
    'profile.tabMedia': 'Médias',
    'profile.replies': 'Réponses',
    'profile.media': 'Médias',
    'profile.displayName': 'Nom affiché',
    'profile.bio': 'Biographie',
    'profile.website': 'Site web',
    'profile.cancel': 'Annuler',
    'profile.save': 'Enregistrer',
    'profile.emptyTab': 'Aucune donnée ({tab})',
    'profile.emptyTabSub': 'Les publications et médias partagés apparaîtront ici.',

    // Settings
    'settings.title': 'Paramètres',
    'settings.subtitle': "Gérez l'apparence, la langue, les informations du compte et la sécurité.",
    'settings.appearance': 'Apparence',
    'settings.appearanceSection': 'Apparence',
    'settings.appearanceLabel': 'Thème de l’interface',
    'settings.appearanceSub': "Choisissez l'apparence de VYBE sur l'ensemble de la plateforme.",
    'settings.themeLight': 'Clair',
    'settings.themeDark': 'Sombre',
    'settings.themeSystem': 'Système',
    'settings.language': 'Langue',
    'settings.languageSection': 'Langue',
    'settings.languageLabel': "Langue d'affichage",
    'settings.languageSub': 'Sélectionnez la langue utilisée pour la navigation, les boutons et les menus.',
    'settings.langEn': 'English',
    'settings.langHi': 'हिन्दी',
    'settings.langFr': 'Français',
    'settings.account': 'Compte',
    'settings.accountSection': 'Compte',
    'settings.accountSub': 'Mettez à jour les informations publiques de votre profil.',
    'settings.profile': 'Compte',
    'settings.displayName': 'Nom affiché',
    'settings.username': "Nom d'utilisateur",
    'settings.emailAddress': 'Adresse e-mail',
    'settings.bio': 'Biographie',
    'settings.website': 'Site web',
    'settings.memberSince': 'Membre depuis',
    'settings.saveChanges': 'Enregistrer les modifications',
    'settings.saving': 'Enregistrement…',
    'settings.profileSaved': 'Paramètres du compte enregistrés',
    'settings.security': 'Sécurité',
    'settings.securitySection': 'Sécurité',
    'settings.securitySub': 'Gérez votre mot de passe et votre session active.',
    'settings.currentPassword': 'Mot de passe actuel',
    'settings.newPassword': 'Nouveau mot de passe',
    'settings.updatePassword': 'Mettre à jour le mot de passe',
    'settings.updatingPassword': 'Mise à jour…',
    'settings.passwordUpdated': 'Mot de passe mis à jour',
    'settings.session': 'Session',
    'settings.sessionSub': 'Déconnectez-vous de votre compte sur ce navigateur.',
    'settings.signOut': 'Se déconnecter',

    // Auth Pages
    'auth.welcomeTitle': 'Bienvenue sur VYBE',
    'auth.welcomeTagline': 'Connecter. Partager. Construire ensemble.',
    'auth.identifierPlaceholder': "E-mail ou nom d'utilisateur",
    'auth.passwordPlaceholder': 'Mot de passe',
    'auth.rememberMe': 'Se souvenir de moi',
    'auth.signInBtn': 'Se connecter',
    'auth.signingIn': 'Connexion...',
    'auth.orContinueWith': 'OU CONTINUER AVEC',
    'auth.tryDemo': 'Essayer le compte démo',
    'auth.noAccount': 'Nouveau sur VYBE ?',
    'auth.createAccount': 'Créer un compte',
    'auth.registerTitle': 'Créer votre compte',
    'auth.registerTagline': 'Connecter. Partager. Construire ensemble.',
    'auth.fullNamePlaceholder': 'Nom complet',
    'auth.usernamePlaceholder': "Nom d'utilisateur (ex. rohan.v)",
    'auth.emailPlaceholder': 'Adresse e-mail',
    'auth.createAccountBtn': 'Créer un compte',
    'auth.haveAccount': 'Déjà sur VYBE ?',
    'auth.signInLink': 'Se connecter',
  },
};

function humanizeTranslationKey(key) {
  if (!key || typeof key !== 'string') return '';
  const tail = key.includes('.') ? key.split('.').pop() : key;
  return tail
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]+/g, ' ')
    .replace(/\bsub\b/i, '')
    .trim()
    .replace(/^./, (c) => c.toUpperCase());
}

function t(key, vars = {}, fallback = '') {
  if (!key || typeof key !== 'string') return fallback || '';
  const lang = getLanguage();
  const dict = TRANSLATIONS[lang] || TRANSLATIONS.en;
  let str =
    dict[key] !== undefined
      ? dict[key]
      : TRANSLATIONS.en[key] !== undefined
        ? TRANSLATIONS.en[key]
        : fallback || humanizeTranslationKey(key);
  if (vars && typeof vars === 'object') {
    Object.keys(vars).forEach((k) => {
      str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), vars[k]);
    });
  }
  return str;
}

let currentActiveNavKey = 'home';

function setLanguage(lang) {
  const validLang = ['en', 'hi', 'fr'].includes(lang) ? lang : 'en';
  try {
    localStorage.setItem(VYBE_LANG_KEY, validLang);
  } catch (e) {}
  if (typeof document !== 'undefined') {
    document.documentElement.lang = validLang;
  }
  applyTranslations();
  updatePreferenceControlsState();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('vybe:langchange', { detail: { lang: validLang } }));
  }
}

function updatePreferenceControlsState() {
  if (typeof document === 'undefined') return;
  const mode = getThemeMode();
  const lang = getLanguage();

  document.querySelectorAll('[data-set-theme]').forEach((btn) => {
    const isAct = btn.getAttribute('data-set-theme') === mode;
    btn.classList.toggle('active', isAct);
    btn.setAttribute('aria-pressed', isAct ? 'true' : 'false');
    btn.setAttribute('aria-checked', isAct ? 'true' : 'false');
  });

  document.querySelectorAll('[data-set-lang]').forEach((btn) => {
    const isAct = btn.getAttribute('data-set-lang') === lang;
    btn.classList.toggle('active', isAct);
    btn.setAttribute('aria-pressed', isAct ? 'true' : 'false');
    btn.setAttribute('aria-checked', isAct ? 'true' : 'false');
  });
}

function applyTranslations() {
  if (typeof document === 'undefined') return;

  // 1. Elements with explicit data-i18n attributes (preserving initial readable HTML text as fallback)
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (!key) return;
    if (!el.dataset.i18nFallback) {
      const initial = (el.textContent || '').trim();
      if (initial && !initial.includes('.')) {
        el.dataset.i18nFallback = initial;
      }
    }
    el.textContent = t(key, {}, el.dataset.i18nFallback || '');
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (!key) return;
    if (!el.dataset.i18nFallback) {
      const initial = el.getAttribute('placeholder') || '';
      if (initial && !initial.includes('.')) {
        el.dataset.i18nFallback = initial;
      }
    }
    el.setAttribute('placeholder', t(key, {}, el.dataset.i18nFallback || ''));
  });

  document.querySelectorAll('[data-i18n-title]').forEach((el) => {
    const key = el.getAttribute('data-i18n-title');
    if (!key) return;
    const val = t(key);
    el.setAttribute('title', val);
    el.setAttribute('aria-label', val);
  });

  // 2. Automatic page-level static UI translation (without touching usernames or post content)
  const setText = (sel, key) => {
    const el = document.querySelector(sel);
    if (!el) return;
    if (!el.dataset.i18nFallback) {
      const initial = (el.textContent || '').trim();
      if (initial && !initial.includes('.')) el.dataset.i18nFallback = initial;
    }
    el.textContent = t(key, {}, el.dataset.i18nFallback || '');
  };
  const setPlaceholder = (sel, key) => {
    const el = document.querySelector(sel);
    if (!el) return;
    if (!el.dataset.i18nFallback) {
      const initial = el.getAttribute('placeholder') || '';
      if (initial && !initial.includes('.')) el.dataset.i18nFallback = initial;
    }
    el.setAttribute('placeholder', t(key, {}, el.dataset.i18nFallback || ''));
  };

  // Feed page
  setText('#tabForYou', 'feed.forYou');
  setText('#tabFollowing', 'feed.following');
  setPlaceholder('#inlineComposerText', 'feed.composerPlaceholder');
  setText('#inlinePostSubmitBtn', 'feed.postBtn');
  setPlaceholder('#asideGlobalSearch', 'aside.searchPlaceholder');

  // Explore page
  setPlaceholder('#exploreSearchInput', 'explore.searchPlaceholder');

  // Activity page
  setText('#btnMarkAllRead', 'activity.markAllRead');
  setText('.activity-chip-btn[data-filter="all"]', 'activity.all');
  setText('.activity-chip-btn[data-filter="mentions"]', 'activity.mentions');
  setText('.activity-chip-btn[data-filter="follow"]', 'activity.followers');

  // Messages page
  setText('.messages-thread-header', 'messages.title');
  setPlaceholder('#chatMessageInput', 'messages.inputPlaceholder');

  // Bookmarks page
  setText('#btnClearBookmarks', 'bookmarks.clearAll');

  // Profile page
  setText('.feed-tab-btn[data-tab="posts"]', 'profile.tabPosts');
  setText('.feed-tab-btn[data-tab="replies"]', 'profile.tabReplies');
  setText('.feed-tab-btn[data-tab="media"]', 'profile.tabMedia');
  setText('#btnShareProfileLink', 'profile.shareProfile');
  setText('label[for="editProfNameInput"]', 'profile.displayName');
  setText('label[for="editProfBioInput"]', 'profile.bio');
  setText('label[for="editProfWebsiteInput"]', 'profile.website');
  setText('#cancelEditProfileBtn', 'profile.cancel');

  // Auth pages (Sign In & Register — preserve button inner spans)
  setText('#authHeading', 'auth.welcomeTitle');
  setPlaceholder('#loginEmail', 'auth.identifierPlaceholder');
  setPlaceholder('#loginPassword', 'auth.passwordPlaceholder');
  setText('#loginSubmitText', 'auth.signInBtn');
  setText('#quickDemoLoginBtn span', 'auth.tryDemo');
  setText('#regHeading', 'auth.registerTitle');
  setPlaceholder('#regName', 'auth.fullNamePlaceholder');
  setPlaceholder('#regUsername', 'auth.usernamePlaceholder');
  setPlaceholder('#regEmail', 'auth.emailPlaceholder');
  setPlaceholder('#regPassword', 'auth.passwordPlaceholder');
  setText('#registerSubmitText', 'auth.createAccountBtn');

  // Re-render sidebar navigation labels if present
  if (document.getElementById('appSidebarNav')) {
    renderSidebarNavLinksOnly(currentActiveNavKey);
  }
}

function renderSidebarNavLinksOnly(activeKey = currentActiveNavKey) {
  const navContainer = document.getElementById('appSidebarNav');
  if (!navContainer) return;
  const notifs = getNotifications();
  const unreadCount = notifs.filter((n) => !n.read).length;

  navContainer.innerHTML = `
    <ul class="nav-links-list">
      <li>
        <a href="feed.html" class="nav-link-item ${activeKey === 'home' ? 'active' : ''}">
          ${ICONS.home}
          <span>${t('nav.home')}</span>
        </a>
      </li>
      <li>
        <a href="explore.html" class="nav-link-item ${activeKey === 'explore' ? 'active' : ''}">
          ${ICONS.explore}
          <span>${t('nav.explore')}</span>
        </a>
      </li>
      <li>
        <a href="notifications.html" class="nav-link-item ${activeKey === 'activity' ? 'active' : ''}">
          ${ICONS.activity}
          <span>${t('nav.activity')}</span>
          ${unreadCount > 0 ? `<span class="nav-badge-count">${unreadCount}</span>` : ''}
        </a>
      </li>
      <li>
        <a href="messages.html" class="nav-link-item ${activeKey === 'messages' ? 'active' : ''}">
          ${ICONS.messages}
          <span>${t('nav.messages')}</span>
        </a>
      </li>
      <li>
        <a href="bookmarks.html" class="nav-link-item ${activeKey === 'bookmarks' ? 'active' : ''}">
          ${ICONS.bookmarks}
          <span>${t('nav.bookmarks')}</span>
        </a>
      </li>
      <li>
        <a href="profile.html" class="nav-link-item ${activeKey === 'profile' ? 'active' : ''}">
          ${ICONS.profile}
          <span>${t('nav.profile')}</span>
        </a>
      </li>
      <li>
        <a href="settings.html" class="nav-link-item ${activeKey === 'settings' ? 'active' : ''}">
          ${ICONS.settings}
          <span>${t('nav.settings')}</span>
        </a>
      </li>
      <li class="sidebar-create-item">
        <button type="button" class="btn-sidebar-create" id="btnSidebarOpenCreate">
          ${ICONS.create}
          <span>${t('nav.create')}</span>
        </button>
      </li>
    </ul>
  `;
  document.getElementById('btnSidebarOpenCreate')?.addEventListener('click', openCreatePostModal);
}

// --- SHARED NAVIGATION RENDERER (App Shell) ---
function renderAppNavigation(activeKey = 'home') {
  currentActiveNavKey = activeKey;
  const userContainer = document.getElementById('appSidebarUser');
  const mobileBar = document.getElementById('appMobileBottomBar');
  const user = getCurrentUser();

  renderSidebarNavLinksOnly(activeKey);

  if (userContainer) {
    userContainer.innerHTML = `
      <div class="sidebar-user-menu">
        <a href="profile.html" class="user-menu-profile">
          <img src="${user.avatar || (window.getDefaultAvatarFallback ? window.getDefaultAvatarFallback(user.name) : '')}" class="avatar avatar-sm" alt="${user.name || 'User'}" onerror="this.onerror=null;this.src=window.getDefaultAvatarFallback?window.getDefaultAvatarFallback(this.alt):'';">
          <div class="user-menu-info">
            <span class="user-menu-name">${user.name}</span>
            <span class="user-menu-handle">@${user.username}</span>
          </div>
        </a>
        <button class="btn-logout" id="btnLogoutAction" title="${t('nav.logout')}" aria-label="${t('nav.logout')}">
          ${ICONS.logout}
        </button>
      </div>
    `;

    document.getElementById('btnLogoutAction')?.addEventListener('click', (e) => {
      e.stopPropagation();
      logoutUser();
    });
  }

  if (mobileBar) {
    mobileBar.innerHTML = `
      <a href="feed.html" class="mobile-nav-link ${activeKey === 'home' ? 'active' : ''}" aria-label="${t('nav.home')}">
        ${ICONS.home}
      </a>
      <a href="explore.html" class="mobile-nav-link ${activeKey === 'explore' ? 'active' : ''}" aria-label="${t('nav.explore')}">
        ${ICONS.explore}
      </a>
      <button type="button" class="mobile-create-fab" id="btnMobileOpenCreate" aria-label="${t('nav.create')}">
        ${ICONS.create}
      </button>
      <a href="notifications.html" class="mobile-nav-link ${activeKey === 'activity' ? 'active' : ''}" aria-label="${t('nav.activity')}">
        ${ICONS.activity}
      </a>
      <a href="settings.html" class="mobile-nav-link ${activeKey === 'settings' ? 'active' : ''}" aria-label="${t('nav.settings')}">
        ${ICONS.settings}
      </a>
    `;

    document.getElementById('btnMobileOpenCreate')?.addEventListener('click', openCreatePostModal);
  }

  applyTranslations();
}

// --- SHARED DISCOVERY SIDEBAR RENDERER (Right Column) ---
let discoverySuggestedCache = [];
let discoveryPageOffset = 0;

async function renderDiscoverySidebar() {
  const container = document.getElementById('appSidebarRight');
  if (!container) return;

  if (discoverySuggestedCache.length === 0 && typeof api !== 'undefined' && api.users) {
    try {
      const res = await api.users.getSuggested({ limit: 40 });
      if (res.users && res.users.length > 0) {
        discoverySuggestedCache = res.users;
      }
    } catch (err) {
      // fallback to local users
    }
  }

  const pool = discoverySuggestedCache.length > 0 ? discoverySuggestedCache : getUsers();
  const unfollowed = pool.filter((u) => !u.is_following);
  const sourceList = unfollowed.length >= 4 ? unfollowed : pool;
  const sliceStart = discoveryPageOffset % Math.max(1, sourceList.length);
  const users = [];
  for (let i = 0; i < Math.min(4, sourceList.length); i++) {
    users.push(sourceList[(sliceStart + i) % sourceList.length]);
  }

  container.innerHTML = `
    <!-- Search Pill -->
    <div class="search-box-pill">
      <div class="search-input-container">
        ${ICONS.search}
        <input type="search" id="asideGlobalSearch" class="search-native-input" placeholder="${t('aside.searchPlaceholder')}">
      </div>
    </div>

    <!-- Suggested Creators -->
    <div class="aside-card-module">
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <div class="aside-title" data-i18n="aside.suggested">${t('aside.suggested')}</div>
        <button type="button" id="btnRefreshSuggestions" style="font-size: 0.78rem; font-weight: 600; color: var(--accent);" data-i18n="aside.refresh">${t('aside.refresh')}</button>
      </div>
      <div style="display: flex; flex-direction: column; gap: 14px;">
        ${users.map((u) => {
          const uid = u.id || u._id;
          return `
            <div class="aside-user-item">
              <a href="profile.html?user=${encodeURIComponent(u.username)}" class="aside-user-left">
                <img src="${u.avatar || (window.getDefaultAvatarFallback ? window.getDefaultAvatarFallback(u.name) : '')}" class="avatar avatar-sm" alt="${u.name}" loading="lazy" onerror="this.onerror=null;this.src=window.getDefaultAvatarFallback?window.getDefaultAvatarFallback(this.alt):'';">
                <div class="aside-user-names">
                  <span class="aside-user-fullname">${u.name}</span>
                  <span class="aside-user-handle">@${u.username}</span>
                </div>
              </a>
              <button class="btn-follow ${u.is_following ? 'following' : ''}" data-follow-id="${uid}" data-follow-username="${u.username}">
                ${u.is_following ? t('aside.following') : t('aside.follow')}
              </button>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <!-- Trending Topics -->
    <div class="aside-card-module">
      <div class="aside-title" data-i18n="aside.trending">${t('aside.trending')}</div>
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <div class="trending-row-item" data-tag="#buildinpublic">
          <span class="trend-category">Technology · Trending</span>
          <span class="trend-keyword">#buildinpublic</span>
          <span class="trend-count-stat">4.8k ${t('aside.postsCount')}</span>
        </div>
        <div class="trending-row-item" data-tag="#designsystems">
          <span class="trend-category">Design · Trending</span>
          <span class="trend-keyword">#designsystems</span>
          <span class="trend-count-stat">3.1k ${t('aside.postsCount')}</span>
        </div>
        <div class="trending-row-item" data-tag="#rust">
          <span class="trend-category">Programming · Trending</span>
          <span class="trend-keyword">#rust</span>
          <span class="trend-count-stat">5.2k ${t('aside.postsCount')}</span>
        </div>
        <div class="trending-row-item" data-tag="#architecture">
          <span class="trend-category">Photography · Trending</span>
          <span class="trend-keyword">#architecture</span>
          <span class="trend-count-stat">2.4k ${t('aside.postsCount')}</span>
        </div>
      </div>
    </div>

    <div style="font-size: 0.78rem; color: var(--text-muted); line-height: 1.6; padding: 0 4px;">
      <span data-i18n="aside.footerRights">${t('aside.footerRights')}</span><br>
      <span data-i18n="aside.footerLinks">${t('aside.footerLinks')}</span>
    </div>
  `;

  // Refresh suggestions button
  document.getElementById('btnRefreshSuggestions')?.addEventListener('click', () => {
    discoveryPageOffset += 4;
    renderDiscoverySidebar();
  });

  // Attach search enter
  const searchInput = document.getElementById('asideGlobalSearch');
  searchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const q = encodeURIComponent(searchInput.value.trim());
      if (q) window.location.href = `explore.html?q=${q}`;
    }
  });

  // Attach trending row clicks
  container.querySelectorAll('.trending-row-item').forEach((row) => {
    row.addEventListener('click', () => {
      const tag = row.dataset.tag;
      window.location.href = `explore.html?q=${encodeURIComponent(tag)}`;
    });
  });

  // Attach follow toggles (API + local fallback)
  container.querySelectorAll('.btn-follow').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = btn.dataset.followId;
      btn.disabled = true;
      try {
        if (typeof api !== 'undefined' && api.users) {
          const res = await api.users.toggleFollow(id);
          const target = discoverySuggestedCache.find((u) => String(u.id || u._id) === String(id));
          if (target) target.is_following = res.following;
          btn.classList.toggle('following', res.following);
          btn.textContent = res.following ? t('aside.following') : t('aside.follow');
          showToast(res.message, 'info');
          if (typeof activeFeedFilter !== 'undefined' && activeFeedFilter === 'following' && typeof loadAndRenderFeed === 'function') {
            loadAndRenderFeed();
          }
          return;
        }
      } catch (err) {
        // fallback below
      } finally {
        btn.disabled = false;
      }

      const allUsers = getUsers();
      const target = allUsers.find((u) => u.id === id);
      if (target) {
        target.is_following = !target.is_following;
        saveUsers(allUsers);
        showToast(target.is_following ? `Following @${target.username}` : `Unfollowed @${target.username}`, 'info');
        renderDiscoverySidebar();
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  applyTranslations();
});

window.addEventListener('vybe:langchange', () => {
  if (document.getElementById('appSidebarRight')) {
    renderDiscoverySidebar();
  }
});


