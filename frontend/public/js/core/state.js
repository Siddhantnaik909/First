console.log("Loaded: state.js");

/* =============================================================
   SMART HUB CORE STATE MANAGEMENT
   Global state, localStorage helpers, constants
============================================================= */

// Constants
export const SETTINGS_CACHE_KEY = 'smartHub.settings.cache';
export const HISTORY_CACHE_KEY = 'smartHub.history.cache';
export const APP_VERSION = '2.7.6';

// ✅ Safe DOM utilities — no prototype pollution
export const safeQs = (sel, root = document) => {
  try { return root.querySelector(sel); } catch { return null; }
};
export const safeQsAll = (sel, root = document) => {
  try { return [...root.querySelectorAll(sel)]; } catch { return []; }
};

// FIXED 1.4: Safe localStorage wrapper with validation
export const safeStorage = {
  getItem: (key) => {
    try { return localStorage.getItem(key); } catch { return null; }
  },
  setItem: (key, value) => {
    try { localStorage.setItem(key, value); } catch { /* [SafeStorage] set error */ }
  },
  removeItem: (key) => {
    try { localStorage.removeItem(key); } catch {}
  },
  parseJSON: (str, fallback = {}) => {
    if (!str) return fallback;
    try { return JSON.parse(str); } catch { return fallback; }
  }
};

// State management
export const state = {
  user: null,
  isAdmin: false
};

export function getUser() {
  const userData = safeStorage.parseJSON(safeStorage.getItem('user'), { name: 'User', role: 'user', email: '' });
  state.user = userData;
  state.isAdmin = userData.role?.toLowerCase() === 'admin';
  return state.user;
}

export function setUser(user) {
  safeStorage.setItem('user', JSON.stringify(user));
  state.user = user;
  state.isAdmin = user.role?.toLowerCase() === 'admin';
  getUser(); // Refresh
}

export function clearUser() {
  ['token', 'user', 'isLoggedIn', 'authToken', 'refreshToken'].forEach(key => {
    safeStorage.removeItem(key);
    localStorage.removeItem(key); // Fallback
  });
  state.user = null;
  state.isAdmin = false;
}

// Initialize state on load
getUser();

window.safeStorage = safeStorage;
window.safeQs = safeQs;
window.safeQsAll = safeQsAll;
