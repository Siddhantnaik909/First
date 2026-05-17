// Loaded: init.js

import { updateUserInterface } from '../auth/auth-ui.js';
import { loadNotifications } from '../auth/notifications.js';
import { safeQs, safeQsAll } from './state.js';

/* =============================================================
   SMART HUB APP INITIALIZATION
   Single DOMContentLoaded orchestrator
============================================================= */

export function initApp() {
  // Single DOMContentLoaded - all init here
  document.addEventListener('DOMContentLoaded', () => {
    // 1. Dynamic core loads (preserved exact order from script.js)
    loadCoreScripts();

    // 2. UI + Auth init
    updateUserInterface();

    // 3. Components loaded event (sidebar, recent activity, favorites)
    document.addEventListener('componentsLoaded', initComponentsLoaded);

    // 4. Auth state listener
    window.addEventListener('authStateChanged', updateUserInterface);

    // 5. Service Worker
    initServiceWorker();

    // [SmartHub] App initialized
  });
}

// Dynamic script loader (preserves script.js behavior)
function loadCoreScripts() {
  // calculator-data.js
  const calcDataScript = document.createElement('script');
  calcDataScript.src = '/js/calculator-data.js';
  calcDataScript.async = false;
  document.head.appendChild(calcDataScript);

  // theme.js
  const themeScript = document.createElement('script');
  themeScript.src = '/js/theme.js';
  themeScript.async = false;
  document.head.appendChild(themeScript);

  // sidebar-generator.js
  const navGenScript = document.createElement('script');
  navGenScript.src = '/js/sidebar-generator.js';
  navGenScript.async = false;
  document.head.appendChild(navGenScript);

  // Admin conditional load
  const userData = JSON.parse(localStorage.getItem('user') || '{}');
  if (userData.role === 'admin' || window.location.pathname.toLowerCase().includes('admin')) {
    const adminScript = document.createElement('script');
    adminScript.src = '/js/admin-system.js';
    adminScript.async = false;
    document.head.appendChild(adminScript);
  }
}

// Components loaded handler (from script.js)
function initComponentsLoaded() {
  // Re-initialize after sidebar/navbar loaded
  if (typeof setupSidebarToggle === 'function') setupSidebarToggle();
  updateUserInterface();
  if (typeof initButtons === 'function') initButtons();

  const recentList = safeQs('#recent-activity-list') || safeQs('#history-list');
  if (recentList && typeof loadRecentActivity === 'function') loadRecentActivity();

  const favoritesGrid = safeQs('#favorites-grid');
  if (favoritesGrid && typeof loadFavorites === 'function') loadFavorites();

  // Silent notifications badge check
  loadNotifications(true);
}

// Service Worker (from script.js + initSmartHubCore.js)
function initServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').then(reg => {
      // [SW] Smart Hub PWA ready
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // [SW] New version available — reloading
            setTimeout(() => window.location.reload(), 500);
          }
        });
      });
      setInterval(() => reg.update(), 30 * 60 * 1000);
    }).catch(err => console.warn('[SW] Registration failed:', err));
  }
}

// Legacy initSmartHubCore compatibility (consolidate)
window.initSmartHubCore = function() {
  initApp(); // Delegate to new unified init
};

