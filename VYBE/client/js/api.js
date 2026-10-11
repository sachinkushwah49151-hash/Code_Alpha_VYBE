// ==========================================================================
// VYBE — api.js | Frontend HTTP Client & REST API Integration
// ==========================================================================

const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000/api'
  : '/api';

const api = {
  getToken() {
    return sessionStorage.getItem('vybe_token') || localStorage.getItem('vybe_token') || '';
  },

  setToken(token, persistent = true) {
    if (token) {
      sessionStorage.setItem('vybe_token', token);
      if (persistent) localStorage.setItem('vybe_token', token);
    } else {
      sessionStorage.removeItem('vybe_token');
      localStorage.removeItem('vybe_token');
    }
  },

  getHeaders(includeAuth = true) {
    const headers = {
      'Content-Type': 'application/json',
    };
    const token = this.getToken();
    if (includeAuth && token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  },

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const defaultHeaders = this.getHeaders(options.auth !== false);
    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...(options.headers || {}),
      },
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const res = await fetch(url, config);
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (
          res.status === 401 &&
          options.auth !== false &&
          !endpoint.includes('/auth/login') &&
          !endpoint.includes('/auth/register')
        ) {
          if (typeof clearAuthSession === 'function') {
            clearAuthSession();
          }
          if (typeof isPublicAuthPage === 'function' && !isPublicAuthPage()) {
            window.location.replace('index.html');
          }
        }
        const error = new Error(data.message || `Request failed with status ${res.status}`);
        error.status = res.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (err) {
      console.warn(`[VYBE API] Error on ${options.method || 'GET'} ${endpoint}:`, err.message);
      throw err;
    }
  },

  // --- AUTHENTICATION ---
  auth: {
    async register(name, username, email, password) {
      return await api.request('/auth/register', {
        method: 'POST',
        auth: false,
        body: { name, username, email, password },
      });
    },

    async login(identifier, password) {
      return await api.request('/auth/login', {
        method: 'POST',
        auth: false,
        body: { email: identifier, identifier, password },
      });
    },

    async demoLogin() {
      return await api.request('/auth/demo', {
        method: 'POST',
        auth: false,
      });
    },

    async getOAuthStatus() {
      return await api.request('/auth/oauth-status', {
        method: 'GET',
        auth: false,
      });
    },

    async getMe() {
      return await api.request('/auth/me', {
        method: 'GET',
        auth: true,
      });
    },
  },

  // --- POSTS ---
  posts: {
    async getAll(params = {}) {
      const query = new URLSearchParams(params).toString();
      const endpoint = query ? `/posts?${query}` : '/posts';
      return await api.request(endpoint, {
        method: 'GET',
        auth: true, // sends token if present for personalized like state
      });
    },

    async getById(id) {
      return await api.request(`/posts/${id}`, {
        method: 'GET',
        auth: true,
      });
    },

    async create(postData) {
      return await api.request('/posts', {
        method: 'POST',
        auth: true,
        body: postData,
      });
    },

    async delete(id) {
      return await api.request(`/posts/${id}`, {
        method: 'DELETE',
        auth: true,
      });
    },

    async toggleLike(id) {
      return await api.request(`/posts/${id}/like`, {
        method: 'POST',
        auth: true,
      });
    },

    async getComments(postId) {
      return await api.request(`/posts/${postId}/comments`, {
        method: 'GET',
        auth: true,
      });
    },

    async addComment(postId, text) {
      return await api.request(`/posts/${postId}/comments`, {
        method: 'POST',
        auth: true,
        body: { text },
      });
    },

    async deleteComment(postId, commentId) {
      return await api.request(`/posts/${postId}/comments/${commentId}`, {
        method: 'DELETE',
        auth: true,
      });
    },
  },

  // --- USERS & PROFILES ---
  users: {
    async getProfile(idOrUsername) {
      return await api.request(`/users/${encodeURIComponent(idOrUsername)}`, {
        method: 'GET',
        auth: true,
      });
    },

    async updateProfile(profileData) {
      return await api.request('/users/profile', {
        method: 'PUT',
        auth: true,
        body: profileData,
      });
    },

    async follow(idOrUsername) {
      return await api.request(`/users/${encodeURIComponent(idOrUsername)}/follow`, {
        method: 'POST',
        auth: true,
      });
    },

    async unfollow(idOrUsername) {
      return await api.request(`/users/${encodeURIComponent(idOrUsername)}/follow`, {
        method: 'DELETE',
        auth: true,
      });
    },

    async toggleFollow(idOrUsername) {
      return await api.request(`/users/${encodeURIComponent(idOrUsername)}/toggle-follow`, {
        method: 'POST',
        auth: true,
      });
    },

    async getSuggested() {
      return await api.request('/users/suggested', {
        method: 'GET',
        auth: true,
      });
    },
  },
};

// Export to window
window.api = api;
