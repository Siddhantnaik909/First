/**
 * Smart Hub - Shared Configuration Module
 * Centralized API, auth, and utility functions
 * @version 2.0.0
 */

// ========================================
// API Configuration
// ========================================

// ✅ API_URL centralized in /js/core/api.js (window.API_URL)
export const API_ENDPOINTS = {
    auth: {
        login: '/api/auth/login',
        register: '/api/auth/register',
        profile: '/api/auth/profile',
        upload: '/api/auth/upload-profile',
        forgotPassword: '/api/auth/forgot-password'
    },
    games: {
        rooms: '/api/games/rooms',
        stats: '/api/games/stats'
    },
    history: '/api/history',
    contact: '/api/contact'
};

// ========================================
// Authentication Utilities
// ========================================

export function isLoggedIn() {
    return localStorage.getItem('isLoggedIn') === 'true' && !!getToken();
}

export function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
        return {};
    }
}

export function getToken() {
    return localStorage.getItem('token');
}

export function saveAuth(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('isLoggedIn', 'true');
    window.dispatchEvent(new Event('authStateChanged'));
}

export function clearAuth() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
    window.dispatchEvent(new Event('authStateChanged'));
}

export function redirectIfAuthenticated(target = '/index.html') {
    if (isLoggedIn()) {
        window.location.href = target;
        return true;
    }
    return false;
}

export function requireAuth(redirectTo = '/login.html') {
    if (!isLoggedIn()) {
        window.location.href = redirectTo;
        return false;
    }
    return true;
}

export function isAdmin() {
    const user = getCurrentUser();
    return user.role?.toLowerCase() === 'admin';
}

// ========================================
// API Helper Functions
// ========================================

export async function api(endpoint, options = {}) {
    const url = `${window.API_URL}${endpoint}`;
    const token = getToken();
    
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...options.headers
        },
        ...options
    };
    
    if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
        config.body = JSON.stringify(config.body);
    }
    
    try {
        const response = await fetch(url, config);
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
            throw new Error(error.message || `Request failed: ${response.status}`);
        }
        
        return response.json();
    } catch (error) {
        console.error(`API Error [${endpoint}]:`, error.message);
        throw error;
    }
}

// Convenience methods
export const get = (endpoint) => api(endpoint, { method: 'GET' });
export const post = (endpoint, body) => api(endpoint, { method: 'POST', body });
export const put = (endpoint, body) => api(endpoint, { method: 'PUT', body });
export const del = (endpoint) => api(endpoint, { method: 'DELETE' });

// ========================================
// UI Utilities
// ========================================

export function showToast(message, type = 'success', duration = 3000) {
    const toast = document.getElementById('toast') || createToast();
    const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : '!';
    
    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span class="toast-message">${message}</span>
    `;
    toast.className = `toast toast-${type} show`;
    
    setTimeout(() => toast.classList.remove('show'), duration);
}

function createToast() {
    const toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
    return toast;
}

export function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

export function formatNumber(num, decimals = 2) {
    return Number(num).toFixed(decimals);
}

// ========================================
// Theme / Dark Mode
// ========================================

export function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemDark)) {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark-mode');
    }
}

export function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    document.body.classList.toggle('dark-mode', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    window.dispatchEvent(new Event('storage'));
    return isDark;
}

// ========================================
// History Management
// ========================================

export function getHistory() {
    return JSON.parse(localStorage.getItem('calc_history') || '[]');
}

export function addHistory(entry) {
    const history = getHistory();
    history.unshift({
        ...entry,
        id: Date.now().toString(),
        timestamp: new Date().toISOString()
    });
    localStorage.setItem('calc_history', JSON.stringify(history.slice(0, 100)));
}

export function clearHistory() {
    localStorage.removeItem('calc_history');
}

// ========================================
// Initialize on Load
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    
    // Initialize Admin UI Config
    if (window.AdminUIConfig) {
        window.AdminUIConfig.reRenderAllUI();
    }
});

// Export all as default for convenience
export default {
    // API_URL from /js/core/api.js (window.API_URL)
    API_ENDPOINTS,
    isLoggedIn,
    getCurrentUser,
    getToken,
    saveAuth,
    clearAuth,
    redirectIfAuthenticated,
    requireAuth,
    isAdmin,
    api,
    get,
    post,
    put,
    del,
    showToast,
    formatDate,
    formatNumber,
    initTheme,
    toggleTheme,
    getHistory,
    addHistory,
    clearHistory
};
