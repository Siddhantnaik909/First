/**
 * auth-system.js — Secure JWT shim for Smart Hub
 * 
 * Replaces the old localStorage-based auth (which stored plaintext passwords).
 * All authentication now delegates to the real backend at /api/auth/*.
 * This class exists only for backward-compatible API surface in game pages.
 */
class AuthSystem {
  constructor() {
    this._user = this._loadFromToken();
  }

  /**
   * Decode the JWT payload from localStorage (no signature verification —
   * the server verifies on every API call). Returns null if expired/invalid.
   */
  _loadFromToken() {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      if (!token || !token.includes('.')) return null;

      const payloadB64 = token.split('.')[1];
      if (!payloadB64) return null;

      // Pad base64 if needed
      const padded = payloadB64 + '='.repeat((4 - payloadB64.length % 4) % 4);
      const payload = JSON.parse(atob(padded));

      // Check expiry
      if (payload.exp && Date.now() / 1000 > payload.exp) {
        this._clearStorage();
        return null;
      }

      // Support both flat { id, role } and nested { user: { id, role } } JWT shapes
      const u = payload.user || payload;
      return {
        id: u.id || u.sub,
        role: u.role || 'user',
        name: u.name,
        email: u.email,
        username: u.username || u.name
      };
    } catch {
      return null;
    }
  }

  get isLoggedIn() { return Boolean(this._user); }
  get currentUser() { return this._user; }

  /**
   * Login via real backend JWT endpoint.
   * @returns {Promise<{success: boolean, user?: object, error?: string}>}
   */
  async login(email, password) {
    try {
      const baseUrl = window.location.protocol === 'file:' 
        ? 'http://localhost:3000/api' 
        : `${window.location.origin}/api`;

      const res = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.message || 'Login failed' };
      }

      // Store token and user data
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('isLoggedIn', 'true');

      this._user = data.user;
      window.dispatchEvent(new CustomEvent('authStateChanged'));
      return { success: true, user: data.user };

    } catch (e) {
      return { success: false, error: 'Network error. Is the server running?' };
    }
  }

  /**
   * Logout — clear all auth tokens and session data.
   */
  logout() {
    this._user = null;
    this._clearStorage();
    window.dispatchEvent(new CustomEvent('authStateChanged'));
  }

  _clearStorage() {
    [
      'authToken', 'token', 'user', 'isLoggedIn',
      'smart_hub_session' // legacy key from old auth system
    ].forEach(k => localStorage.removeItem(k));
  }

  getToken() {
    return localStorage.getItem('authToken') || localStorage.getItem('token');
  }

  isAdmin() { return this._user?.role === 'admin'; }
  isUser() { return this.isLoggedIn; }
  getRole() { return this._user?.role || 'guest'; }
  getCurrentUser() { return this._user; }

  hasPermission(requiredRole) {
    if (requiredRole === 'public') return true;
    if (!this.isLoggedIn) return false;
    if (requiredRole === 'admin') return this.isAdmin();
    return true; // 'user' level
  }

  /**
   * Reload user from current token (call after token refresh).
   */
  refresh() {
    this._user = this._loadFromToken();
    window.dispatchEvent(new CustomEvent('authStateChanged'));
  }
}

// Create global instance — safe to call multiple times
window.authSystem = window.authSystem || new AuthSystem();
