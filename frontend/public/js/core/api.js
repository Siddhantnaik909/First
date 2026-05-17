/**
 * Smart Hub - Centralized API Configuration
 * Single source of truth for all API endpoints
 */

(function() {
    'use strict';
    
    // Same-origin policy: Frontend and backend share same port
    // No localhost fallbacks, no protocol hacks
    const API_URL = window.location.origin + '/api';
    
    // Global for legacy compatibility (existing code uses window.API_URL)
    window.API_URL = API_URL;
    
// API configured
    
    // Export for ES modules (if used)
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { API_URL };
    }
    if (typeof window.define === 'function' && window.define.amd) {
        window.define([], () => ({ API_URL }));
    }
    
})();

