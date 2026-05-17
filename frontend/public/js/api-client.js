/**
 * api-client.js — Centralized API access layer for Smart Hub frontend
 * 
 * All fetch calls go through this module. Handles:
 * - Base URL resolution (no more hardcoded ports)
 * - Authorization header injection
 * - Consistent error handling
 * 
 * Usage:
 *   const res = await ApiClient.get('/auth/friends');
 *   const { ok, data } = await ApiClient.post('/auth/login', { email, password });
 */

const ApiClient = (() => {
    // Always same-origin — frontend and backend share port 3000
    const baseUrl = (() => {
        if (window.location.protocol === 'file:') return 'http://localhost:3000/api';
        return `${window.location.origin}/api`;
    })();

    function getAuthHeaders() {
        const token = localStorage.getItem('authToken') || localStorage.getItem('token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        return headers;
    }

    async function request(method, path, body = null, opts = {}) {
        const url = baseUrl + path;
        const fetchOpts = {
            method,
            headers: { ...getAuthHeaders(), ...opts.headers },
            credentials: 'same-origin'
        };
        if (body !== null && method !== 'GET') {
            fetchOpts.body = JSON.stringify(body);
        }
        try {
            const response = await fetch(url, fetchOpts);
            const data = await response.json().catch(() => ({ error: 'Invalid JSON response' }));
            return { ok: response.ok, status: response.status, data };
        } catch (err) {
            console.error(`[ApiClient] ${method} ${path} failed:`, err.message);
            return { ok: false, status: 0, data: { error: err.message } };
        }
    }

    return {
        baseUrl,
        get: (path, opts) => request('GET', path, null, opts),
        post: (path, body, opts) => request('POST', path, body, opts),
        put: (path, body, opts) => request('PUT', path, body, opts),
        delete: (path, opts) => request('DELETE', path, null, opts),

        // Convenience: throw on error instead of returning { ok: false }
        async getOrThrow(path) {
            const { ok, data, status } = await request('GET', path);
            if (!ok) throw new Error(data?.message || data?.error || `HTTP ${status}`);
            return data;
        },
        async postOrThrow(path, body) {
            const { ok, data, status } = await request('POST', path, body);
            if (!ok) throw new Error(data?.message || data?.error || `HTTP ${status}`);
            return data;
        }
    };
})();

window.ApiClient = ApiClient;

// Also set window.API_URL for backward compatibility with existing code
window.API_URL = ApiClient.baseUrl;
