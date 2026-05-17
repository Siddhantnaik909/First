/* =============================================================
   SMART HUB - MASTER UNIFIED SCRIPT (v2.7.5)
   Full Integration: Auth, History, Admin, & UI Scaling
============================================================= */

/* --- 1. CONFIGURATION & STATE --- */
import { initButtons } from './buttons.js';

const APP_VERSION = '2.7.6';

// ✅ Safe DOM utilities — no prototype pollution
window.safeQs = (sel, root = document) => {
  try { return root.querySelector(sel); } catch { return null; }
};
window.safeQsAll = (sel, root = document) => {
  try { return [...root.querySelectorAll(sel)]; } catch { return []; }
};

// FIXED 1.4: Safe localStorage wrapper with validation
window.safeStorage = {
  getItem: (key) => {
    try { return localStorage.getItem(key); } catch { return null; }
  },
  setItem: (key, value) => {
    try { localStorage.setItem(key, value); } catch { console.warn('[SafeStorage] set error'); }
  },
  removeItem: (key) => {
    try { localStorage.removeItem(key); } catch {}
  },
  parseJSON: (str, fallback = {}) => {
    if (!str) return fallback;
    try { return JSON.parse(str); } catch { return fallback; }
  },
  getUser: () => window.safeStorage.parseJSON(window.safeStorage.getItem('smart_hub_user'), { name: 'User', role: 'user', email: '' })
};


const SETTINGS_CACHE_KEY = 'smartHub.settings.cache';
const HISTORY_CACHE_KEY = 'smartHub.history.cache';

// ✅ FIX: Determine API URL — always same origin, no hardcoded port fallback
// ✅ Centralized API config loaded from /js/core/api.js
// window.API_URL now available globally


const THEME_PRESETS = {
    sandstone: {
        label: 'Sandstone',
        light: {
            bgMain: '#efd8ab',
            bgCard: '#f9e9c8',
            bgSoft: '#f3d9aa',
            bgSofter: '#f8e8c6',
            bgHigh: '#d7bc90',
            text: '#2d2116',
            textSoft: '#7a614d',
            nav: 'rgba(243, 217, 170, 0.92)',
            shadow: 'rgba(166, 112, 57, 0.16)',
            sidebar: 'linear-gradient(180deg, #5e3023, #8a4f2b, #c96f32)'
        },
        dark: {
            bgMain: '#111827',
            bgCard: '#1d2435',
            bgSoft: '#26324a',
            bgSofter: '#202a3d',
            bgHigh: '#334155',
            text: '#f7f0e6',
            textSoft: '#c8b8a5',
            nav: 'rgba(17, 24, 39, 0.9)',
            shadow: 'rgba(0, 0, 0, 0.34)',
            sidebar: 'linear-gradient(180deg, #101826, #182233, #243554)'
        }
    },
    aurora: {
        label: 'Aurora',
        light: {
            bgMain: '#dff1e6',
            bgCard: '#eef9f1',
            bgSoft: '#d2ecde',
            bgSofter: '#f3fbf5',
            bgHigh: '#9fd0bc',
            text: '#17302b',
            textSoft: '#4f6d67',
            nav: 'rgba(210, 236, 222, 0.92)',
            shadow: 'rgba(47, 156, 149, 0.14)',
            sidebar: 'linear-gradient(180deg, #1f6d64, #2f9c95, #8acbb4)'
        },
        dark: {
            bgMain: '#0f1f22',
            bgCard: '#183036',
            bgSoft: '#21434b',
            bgSofter: '#17343a',
            bgHigh: '#35646d',
            text: '#ecfff8',
            textSoft: '#9fc2bb',
            nav: 'rgba(15, 31, 34, 0.9)',
            shadow: 'rgba(0, 0, 0, 0.34)',
            sidebar: 'linear-gradient(180deg, #102224, #17343a, #21434b)'
        }
    },
    adminCopper: {
        label: 'Admin Copper',
        light: {
            bgMain: '#e8c98f',
            bgCard: '#f6e4bf',
            bgSoft: '#efcf96',
            bgSofter: '#faedd0',
            bgHigh: '#c89d62',
            text: '#23180f',
            textSoft: '#735640',
            nav: 'rgba(239, 207, 150, 0.92)',
            shadow: 'rgba(130, 77, 36, 0.18)',
            sidebar: 'linear-gradient(180deg, #4b241a, #8a4f2b, #c96f32)'
        },
        dark: {
            bgMain: '#161616',
            bgCard: '#24202b',
            bgSoft: '#33293b',
            bgSofter: '#2a2333',
            bgHigh: '#5b4671',
            text: '#fff5ea',
            textSoft: '#c9b4a3',
            nav: 'rgba(22, 22, 22, 0.9)',
            shadow: 'rgba(0, 0, 0, 0.4)',
            sidebar: 'linear-gradient(180deg, #23180f, #4b241a, #8a4f2b)'
        }
    }
};

// Global State
let cmEditor = null;
let currentPagePath = null;

/* --- GLOBAL CALCULATORS DATA --- */
// Moved to /js/calculator-data.js for performance and modularity.
// Automatically loaded below via dynamic script injection.

/* --- 2. CORE INITIALIZATION --- */
// Dynamically load calculator-data.js
const calcDataScript = document.createElement('script');
calcDataScript.src = '/js/calculator-data.js';
calcDataScript.async = false;
document.head.appendChild(calcDataScript);

// FIXED 1.1 ✅: Single DOMContentLoaded listener - initSmartHubCore() extracted to separate module
 // Load initSmartHubCore module
 const initScript = document.createElement('script');
 initScript.src = '/js/initSmartHubCore.js';
 initScript.async = false;
 initScript.onload = () => {
     if (typeof initSmartHubCore === 'function') {
         document.addEventListener('DOMContentLoaded', initSmartHubCore);
     } else {
         console.error('[SmartHub] initSmartHubCore not loaded');
     }
 };
 document.head.appendChild(initScript);

// ✅ FIX: Service Worker registration with auto-reload on new version
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').then(reg => {
    console.log('[SW] Smart Hub PWA ready');
    // Listen for new SW installations
    reg.addEventListener('updatefound', () => {
      const newWorker = reg.installing;
      if (!newWorker) return;
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          console.log('[SW] New version available — reloading for update');
          // Give current page a moment to save state, then reload
          setTimeout(() => window.location.reload(), 500);
        }
      });
    });
    // Proactively check for updates every 30 minutes
    setInterval(() => reg.update(), 30 * 60 * 1000);
  }).catch(err => console.warn('[SW] Registration failed:', err));
}

if (typeof window.initSmartHubDB === 'function') {
  window.initSmartHubDB();
}

// Re-initialize UI elements after components (Sidebar/Navbar) are loaded
document.addEventListener('componentsLoaded', () => {
    setupSidebarToggle();
    updateUserInterface();
    initButtons();

    if (document.getElementById('recent-activity-list') || document.getElementById('history-list')) {
        loadRecentActivity();
    }

    if (document.getElementById('favorites-grid')) {
        loadFavorites();
    }
});

// Call updateUserInterface on page load for standalone calculator pages
document.addEventListener('DOMContentLoaded', () => {
    updateUserInterface();
});

// Listen for auth state changes and update UI accordingly
window.addEventListener('authStateChanged', () => {
    updateUserInterface();
});

/* --- 3. UI & THEME ENGINE --- */
window.initTheme = function() {
    // DARK MODE REMOVED - Forcing light mode globally
    const isDark = false; 
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
    document.body.classList.remove('dark', 'dark-mode');
    document.body.classList.add('light');
    localStorage.setItem('theme', 'light');

    const root = document.documentElement;
    const presetKey = localStorage.getItem('uiPreset') || 'sandstone';
    const preset = THEME_PRESETS[presetKey] || THEME_PRESETS.sandstone;
    const palette = isDark ? preset.dark : preset.light;
    const themeColor = localStorage.getItem('themeColor') || '#c96f32';
    const accentColor = localStorage.getItem('accentColor') || '#2f9c95';
    const customFont = localStorage.getItem('fontFamily') || "'Plus Jakarta Sans', sans-serif";
    const customScale = localStorage.getItem('customFontSize') || '1';
    const glassEnabled = localStorage.getItem('glassmorphism') !== 'false';

    root.style.setProperty('--primary-color', themeColor);
    root.style.setProperty('--accent-purple', accentColor);
    root.style.setProperty('--primary-gradient', `linear-gradient(135deg, ${themeColor} 0%, ${accentColor} 100%)`);
    root.style.setProperty('--font-main', customFont);
    root.style.setProperty('--ui-scale', customScale);
    root.style.setProperty('--bg-main', palette.bgMain);
    root.style.setProperty('--bg-card', palette.bgCard);
    root.style.setProperty('--surface-soft', palette.bgSoft);
    root.style.setProperty('--surface-softer', palette.bgSofter);
    root.style.setProperty('--surface-high', palette.bgHigh);
    root.style.setProperty('--text-header', palette.text);
    root.style.setProperty('--text-body', palette.textSoft);
    root.style.setProperty('--text-muted', palette.textSoft);
    root.style.setProperty('--border-color', palette.bgHigh);
    root.style.setProperty('--header-bg', palette.nav);
    root.style.setProperty('--sidebar-bg', localStorage.getItem('sidebarGradient') || palette.sidebar);
    root.style.setProperty('--sidebar-text', isDark ? '#f3eadf' : '#fff4e4');
    root.style.setProperty('--sidebar-active', localStorage.getItem('sidebarActiveColor') || themeColor);
    
    if (glassEnabled) {
        document.body.classList.add('glass-effect');
    } else {
        document.body.classList.remove('glass-effect');
    }

    applyLayoutMode();
    syncThemeControlUI();
    injectUniversalThemeStyles();
}

window.toggleDarkMode = function (opts) {
    // DARK MODE DISABLED
    console.log('Dark mode has been removed per user request.');
    
    // Safety sync for any leftover UI
    const newState = false;
    document.querySelectorAll('#theme-checkbox, #settings-theme-toggle').forEach(t => {
        t.checked = newState;
    });
    
    window.initTheme();
    window.dispatchEvent(new Event('storage'));
};

window.setThemePreset = function (presetKey) {
    localStorage.setItem('uiPreset', presetKey);
    window.initTheme();
};

window.setThemeColor = function (hexStr) {
    localStorage.setItem('themeColor', hexStr);
    window.initTheme();
};

function applyLayoutMode() {
    const mode = localStorage.getItem('layoutMode') || 'left';
    const body = document.body;
    body.classList.remove('sidebar-left', 'sidebar-right', 'sidebar-top', 'sidebar-bottom', 'sidebar-floating');
    if (mode !== 'left') body.classList.add(`sidebar-${mode}`);

    const fontSize = localStorage.getItem('customFontSize');
    if (fontSize) {
        document.documentElement.style.fontSize = `${fontSize}px`;
    }
}

function injectUniversalThemeStyles() {
    let styleTag = document.getElementById('smart-hub-universal-theme');
    if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'smart-hub-universal-theme';
        document.head.appendChild(styleTag);
    }

    styleTag.textContent = `
        /* Theme Removed - Global Enhancements */
        :root {
            --control-panel-shadow: 0 24px 60px color-mix(in srgb, var(--primary-color) 18%, transparent);
        }

        body:not(.no-theme-overrides) {
            background-color: var(--bg-main, #f7f2e8) !important;
            background-image: 
                radial-gradient(circle at top right, color-mix(in srgb, var(--primary-color) 12%, transparent), transparent 28%),
                radial-gradient(circle at bottom left, color-mix(in srgb, var(--accent-purple) 10%, transparent), transparent 22%),
                linear-gradient(180deg, var(--bg-main) 0%, color-mix(in srgb, var(--bg-main) 92%, #000 8%) 100%) !important;
            color: var(--text-body, #2d2116) !important;
        }

        /* 5. Toggle & Button Contrast */
        :is(html.dark, .dark-mode, .dark) .toggle-track:not(.toggle-on) {
            background-color: #334155 !important;
        }
        
        :is(html.dark, .dark-mode, .dark) :is(.bg-red-50, .bg-red-100) {
            background-color: rgba(220, 38, 38, 0.1) !important;
            color: #fca5a5 !important;
            border-color: rgba(220, 38, 38, 0.2) !important;
        }
    `;
}

function syncThemeControlUI() {
    const theme = localStorage.getItem('theme') || 'light';
    const themeToggles = document.querySelectorAll('#settings-theme-toggle, #theme-toggle, #admin-theme-toggle, [data-theme-toggle]');
    themeToggles.forEach(toggle => {
      if (toggle.tagName === 'INPUT') {
        toggle.checked = (theme === 'dark');
      }
    });
}


/* --- 4. AUTH & PROFILE MANAGEMENT --- */
function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g,
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag])
    );
}

// --- AUTH HELPERS ---
window.confirmLogout = function() {
    if (!confirm("Are you sure you want to sign out?")) {
        return;
    }

    // Clear all auth-related data
    const authKeys = [
        'token',
        'user',
        'isLoggedIn',
        'authToken',
        'refreshToken',
        'calc_history',
        'theme'
    ];
    
    authKeys.forEach((key) => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
    });

    // Dispatch auth state change event
    window.dispatchEvent(new Event('authStateChanged'));
    
    // Clear any cached data
    window.safeStorage = null;

    // Redirect to login page
    window.location.href = '/login.html';
};

function updateUserInterface() {
    const API_URL = window.API_URL || ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:')
        ? (window.location.port === '3001' ? 'http://localhost:3001' : 'http://localhost:3000')
        : window.location.origin);

    // Consistent User Data Retrieval
    const userJson = localStorage.getItem('user');
    const userProfile = userJson ? JSON.parse(userJson) : null;
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true' && userProfile !== null;
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');

    // 1. Session Restoration & Sync
    if (isLoggedIn && !token) {
        console.warn('[Auth Sync] Logged in state without token, resetting...');
        localStorage.clear();
        location.reload();
        return;
    }

    const user = {
        name: userProfile?.name || userProfile?.username || 'User',
        email: userProfile?.email || '',
        role: userProfile?.role || 'member',
        photo: userProfile?.photo || null,
        id: userProfile?.id || userProfile?._id || null,
        ...userProfile
    };
    
    console.log('[updateUserInterface] isLoggedIn:', isLoggedIn, 'token:', !!token, 'user:', user.name, 'role:', user.role);
    
    const authContainer = document.getElementById('auth-actions');
    const mobileAuthContainer = document.getElementById('mobile-auth-placeholder');

    if (authContainer) {
    // [updateUserInterface] Found auth-actions container
    if (isLoggedIn && token) {
            // Build avatar URL — backend stores as user.photo, not user.avatar
            const firstName = (user.name || user.username || 'User').split(' ')[0];
            
            // Build avatar URL — handle local vs remote vs absolute paths
            let avatarUrl = "";
            if (user.photo) {
                if (user.photo.startsWith('http')) {
                    avatarUrl = user.photo;
                } else {
                    const cleanPhoto = user.photo.startsWith('/') ? user.photo : '/' + user.photo;
                    avatarUrl = `${window.API_URL}${cleanPhoto}`;
                }
            } else {
                avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=random`;
            }

        // [updateUserInterface] User is logged in, rendering profile dropdown
            authContainer.innerHTML = `
                <div class="flex items-center gap-6">
                    <!-- Notifications -->
                    <div class="relative">
                        <button onclick="document.getElementById('notif-dropdown').classList.toggle('hidden'); window.loadNotifications && window.loadNotifications(); event.stopPropagation();" class="p-3 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl transition-all border border-slate-200 dark:border-white/5 relative group">
                            <span class="material-symbols-outlined text-slate-500 dark:text-slate-400 group-hover:text-primary transition-colors">notifications</span>
                            <span id="notif-badge" class="hidden absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full"></span>
                        </button>
                        <div id="notif-dropdown" class="hidden absolute top-14 right-0 w-96 bg-slate-900/98 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl py-4 z-[1000] max-h-96 flex flex-col">
                            <h4 class="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 px-6">Notifications</h4>
                            <div id="notif-list-container" class="flex-1 overflow-y-auto px-6 pb-2 space-y-4">
                                <div class="py-8 text-center">
                                    <span class="material-symbols-outlined text-4xl text-slate-700 mb-2 block">notifications_off</span>
                                    <p class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">No new notifications</p>
                                </div>
                            </div>
                        </div>
                                  <!-- Profile Dropdown -->
                        <div class="relative">
                            <button onclick="const menu = document.getElementById('user-profile-menu'); menu.classList.toggle('hidden'); if(!menu.classList.contains('hidden')) { menu.classList.add('flex'); } else { menu.classList.remove('flex'); } event.stopPropagation();" class="profile-trigger group">
                                <div class="w-9 h-9 rounded-full overflow-hidden border-2 border-primary/20 shadow-lg group-hover:border-primary/50 transition-colors flex-shrink-0">
                                    <img src="${avatarUrl}" class="w-full h-full object-cover" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(user.name||'User')}&background=random'">
                                </div>
                                <div class="text-left hidden lg:block">
                                    <p class="text-[11px] font-black text-white tracking-wide leading-tight">${escapeHTML(firstName)}</p>
                                    <p class="text-[9px] font-bold text-slate-400 capitalize leading-tight">${user.role || 'Member'}</p>
                                </div>
                                <span class="material-symbols-outlined text-sm text-slate-400 group-hover:rotate-180 transition-transform">expand_more</span>
                            </button>
                            
                            <div id="user-profile-menu" class="hidden absolute top-14 right-0 w-72 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-2 z-[1000]">
                            <div class="p-5 border-b border-white/5 mb-2">
                                <p class="text-sm font-black text-white">${escapeHTML(user.name || firstName)}</p>
                                <p class="text-[10px] text-slate-400 truncate mt-0.5">${escapeHTML(user.email)}</p>
                            </div>
                            
                            <!-- Utility Quick Toggles -->
                            <div class="grid grid-cols-2 gap-1 p-1 mb-2 bg-white/5 rounded-xl">
                                <button onclick="window.toggleDarkMode && window.toggleDarkMode({checked: document.documentElement.classList.contains('dark')}); event.stopPropagation();" class="flex flex-col items-center justify-center gap-1 p-3 hover:bg-white/10 rounded-lg transition-all border border-transparent hover:border-white/10 group">
                                    <span class="material-symbols-outlined text-sm text-slate-400 group-hover:text-primary transition-colors" id="dropdown-theme-icon">dark_mode</span>
                                    <span class="text-[8px] font-black uppercase tracking-widest text-slate-500">Theme</span>
                                </button>
                                <button onclick="window.toggleTranslate && window.toggleTranslate(); event.stopPropagation();" class="flex flex-col items-center justify-center gap-1 p-3 hover:bg-white/10 rounded-lg transition-all border border-transparent hover:border-white/10 group">
                                    <span class="material-symbols-outlined text-sm text-slate-400 group-hover:text-primary transition-colors">translate</span>
                                    <span class="text-[8px] font-black uppercase tracking-widest text-slate-500">Language</span>
                                </button>
                            </div>

                            <div class="space-y-0.5">
                                <a href="/profile.html" class="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl transition-all group">
                                    <span class="material-symbols-outlined text-slate-400 group-hover:text-primary text-sm">person</span>
                                    <span class="text-xs font-semibold text-slate-300">My Profile</span>
                                </a>
                                <a href="/settings.html" class="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl transition-all group">
                                    <span class="material-symbols-outlined text-slate-400 group-hover:text-primary text-sm">settings</span>
                                    <span class="text-xs font-semibold text-slate-300">Settings</span>
                                </a>
                                <a href="/history.html" class="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl transition-all group">
                                    <span class="material-symbols-outlined text-slate-400 group-hover:text-primary text-sm">history</span>
                                    <span class="text-xs font-semibold text-slate-300">History</span>
                                </a>
                                
                                ${user.role?.toLowerCase() === 'admin' ? `
                                <div class="h-px bg-slate-100 dark:bg-white/5 my-1"></div>
                                <a href="/AdminDashboard.html" class="flex items-center gap-3 px-4 py-3 bg-primary/5 dark:bg-primary/10 hover:bg-primary/10 dark:hover:bg-primary/20 rounded-xl transition-all group border border-primary/10">
                                    <span class="material-symbols-outlined text-primary text-sm">dashboard</span>
                                    <span class="text-xs font-bold text-primary">Admin Dashboard</span>
                                </a>
                                <a href="/admin.html" class="flex items-center gap-3 px-4 py-3 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all group">
                                    <span class="material-symbols-outlined text-slate-400 group-hover:text-primary text-sm">terminal</span>
                                    <span class="text-xs font-semibold text-slate-600 dark:text-slate-300">Command Center</span>
                                </a>` : ''}

                                <div class="h-px bg-slate-100 dark:bg-white/5 my-1"></div>
                                <button id="sign-out-btn" class="w-full flex items-center gap-3 px-4 py-3 hover:bg-rose-500/10 dark:hover:bg-rose-500/20 rounded-xl transition-all group text-left">
                                    <span class="material-symbols-outlined text-slate-400 group-hover:text-rose-500 text-sm">logout</span>
                                    <span class="text-xs font-semibold text-slate-600 dark:text-slate-300 group-hover:text-rose-500">Sign Out</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } else {
        // [updateUserInterface] User not logged in, showing Login action
            authContainer.innerHTML = `
                <div class="flex items-center gap-2 sm:gap-3">
        <button onclick="window.toggleDarkMode && window.toggleDarkMode({checked: document.documentElement.classList.contains('dark')}); event.stopPropagation();" class="p-2 sm:p-2.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl transition-all border border-slate-200 dark:border-white/5" title="Toggle Theme">
            <span class="material-symbols-outlined text-slate-500 dark:text-slate-400 text-sm">dark_mode</span>
        </button>
        <button onclick="window.toggleTranslate && window.toggleTranslate(); event.stopPropagation();" class="p-2 sm:p-2.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl transition-all border border-slate-200 dark:border-white/5" title="Translate Language">
            <span class="material-symbols-outlined text-slate-500 dark:text-slate-400 text-sm">translate</span>
        </button>
        <div class="w-px h-6 bg-slate-200 dark:bg-white/10 mx-1"></div>
        <a href="/login.html" class="px-5 py-2.5 bg-surface-container hover:bg-surface-container-high dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-xl font-bold text-xs transition-colors flex items-center gap-2">
                        Login
                    </a>
                    <a href="/signup.html" class="px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-xs shadow-lg shadow-primary/25 hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
                        Sign Up
                    </a>
                </div>
            `;
        }

        // Global click handler to close dropdowns
        document.addEventListener('click', () => {
             const pro = document.getElementById('user-profile-menu');
             const notif = document.getElementById('notif-dropdown');
             if(pro) {
                 pro.classList.add('hidden');
                 pro.classList.remove('flex');
             }
             if(notif) notif.classList.add('hidden');
        });
        
        // Update welcome text on index.html
        const welcomeText = document.getElementById('welcome-text');
        if (welcomeText) {
            if (isLoggedIn && token && user.name) {
                const firstName = (user.name || user.username || 'User').split(' ')[0];
                welcomeText.textContent = `Hi, ${firstName}!`;
            } else {
                welcomeText.textContent = 'Hi, Guest!';
            }
        }
        
        // Attach event listener to sign out button with delay to ensure DOM is ready
        setTimeout(() => {
            const signOutBtn = document.getElementById('sign-out-btn');
            if (signOutBtn && !signOutBtn.hasAttribute('data-listener-attached')) {
                signOutBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    window.confirmLogout();
                });
                signOutBtn.setAttribute('data-listener-attached', 'true');
            }
            
            // Also attach to ALL sign-out-btn elements on the page
            document.querySelectorAll('#sign-out-btn').forEach(btn => {
                if (!btn.hasAttribute('data-listener-attached')) {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        window.confirmLogout();
                    });
                    btn.setAttribute('data-listener-attached', 'true');
                }
            });
        }, 50);

        
        // Attach event listener to translate button
        const translateBtn = document.getElementById('translate-btn');
        if (translateBtn) {
            translateBtn.addEventListener('click', () => {
                window.toggleTranslate();
            });
        }
        
        // Initial silent load to check for badge indicator
        if(isLoggedIn && window.loadNotifications) window.loadNotifications(true);
    } // End of authContainer check

    if (mobileAuthContainer) {
        if (isLoggedIn) {
            mobileAuthContainer.innerHTML = `
                <div class="space-y-4">
                    <a href="/profile.html" class="flex items-center justify-between rounded-2xl bg-slate-100 dark:bg-white/5 px-5 py-4 transition-all hover:bg-slate-200 dark:hover:bg-white/10">
                        <div>
                            <p class="text-sm font-black text-slate-900 dark:text-white">${escapeHTML(user.name || 'User')}</p>
                            <p class="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">${user.role?.toLowerCase() === 'admin' ? 'Admin' : 'Member'}</p>
                        </div>
                        <span class="material-symbols-outlined text-primary">arrow_forward</span>
                    </a>
                    <button type="button" id="mobile-sign-out-btn" class="flex w-full items-center justify-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-xs font-black uppercase tracking-widest text-rose-600 transition-all hover:bg-rose-100 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/20">
                        <span class="material-symbols-outlined text-base">logout</span>
                        Sign Out
                    </button>
                </div>
            `;
        } else {
            mobileAuthContainer.innerHTML = `
                <div class="space-y-4">
                    <div class="grid grid-cols-2 gap-3 mb-6">
        <button onclick="window.toggleTranslate && window.toggleTranslate(); event.stopPropagation();" class="flex flex-col items-center gap-2 p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all hover:bg-slate-200 border border-slate-200 dark:border-slate-700">
            <span class="material-symbols-outlined">translate</span>
            <span class="text-[10px] font-black uppercase tracking-widest text-slate-500">Language</span>
        </button>
    </div>
    <p class="text-sm font-medium text-slate-600 dark:text-slate-300 text-center">Hi, Guest</p>
                    <a href="/login.html" class="flex w-full items-center justify-center gap-3 rounded-2xl bg-primary px-5 py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.99]">
                        <span class="material-symbols-outlined text-base">login</span>
                        Login
                    </a>
                    <a href="/signup.html" class="flex w-full items-center justify-center gap-3 rounded-2xl bg-slate-100 dark:bg-slate-800 px-5 py-4 text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all hover:scale-[1.02] active:scale-[0.99]">
                        <span class="material-symbols-outlined text-base">person_add</span>
                        Sign Up
                    </a>
                </div>
            `;
            
            // Attach event listener to mobile sign out button
            const mobileSignOutBtn = document.getElementById('mobile-sign-out-btn');
            if (mobileSignOutBtn) {
                mobileSignOutBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    window.confirmLogout();
                    document.getElementById('mobile-menu')?.classList.add('hidden');
                });
            }
        }
    }

    // Update Sidebar Profile
    const sidebarProfile = document.querySelector('.user-profile');
    if (sidebarProfile) {
        if (isLoggedIn) {
            const initials = user.name ? user.name.substring(0, 2).toUpperCase() : 'U';
            sidebarProfile.innerHTML = `
                <div class="user-avatar" style="background: var(--primary-color); display: flex; align-items: center; justify-content: center; color: #fff; font-weight: bold;">${initials}</div>
                <div class="user-info">
                    <h4>${escapeHTML(user.name) || 'User'}</h4>
                    <p>${user.role?.toLowerCase() === 'admin' ? 'Admin' : 'Member'}</p>
                </div>
            `;
        } else {
            sidebarProfile.innerHTML = `
                <div class="user-avatar" style="background: #555; display: flex; align-items: center; justify-content: center; color: #fff;"><i class="fas fa-user"></i></div>
                <div class="user-info">
                    <h4>Guest</h4>
                    <p>Not logged in</p>
                </div>
            `;
        }
    }

    // Still hit admin-specific area if it exists separately
    const adminArea = document.getElementById('admin-refresh-area');
    if (isLoggedIn && adminArea) {
        adminArea.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px;">
                <span style="font-size:0.9rem; color:var(--text-header);">${escapeHTML(user.name) || 'Admin'}</span>
                <button class="btn-danger" style="padding:5px 10px; font-size:0.8rem;" onclick="confirmLogout()">Logout</button>
            </div>
        `;
    }

    // Initialize Admin Live Editor if user is admin
    if (isLoggedIn && user.role?.toLowerCase() === 'admin') {
        initAdminLiveEditor();
    }
}

window.updateUserInterface = updateUserInterface;
window.addEventListener('authStateChanged', updateUserInterface);

// Global Notification Loader
window.loadNotifications = async (silentMode = false, containerId = 'notif-list-container', badgeId = 'notif-badge') => {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch(`${window.API_URL}/auth/notifications`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) return;
        const notifs = await res.json();
        
        const badge = document.getElementById(badgeId);
        const container = document.getElementById(containerId);
        
        if (badge) {
            badge.classList.toggle('hidden', notifs.length === 0);
        }

        if (silentMode || !container) return; // Stop if just updating badge or no container

        if (notifs.length === 0) {
            container.innerHTML = `
                <div class="py-8 text-center">
                    <span class="material-symbols-outlined text-4xl text-slate-700 mb-2 block">notifications_off</span>
                    <p class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">No new notifications</p>
                </div>`;
            return;
        }

        container.innerHTML = notifs.map(n => `
            <div class="flex gap-4 p-4 ${n.read ? 'bg-slate-800/50 opacity-70' : 'bg-indigo-600/10 border-l-2 border-indigo-500'} rounded-xl transition-all">
                <div class="w-10 h-10 ${n.read ? 'bg-slate-800 text-slate-500' : 'bg-indigo-600 text-white'} rounded-full flex items-center justify-center flex-shrink-0">
                    <span class="material-symbols-outlined text-sm">${n.icon || 'campaign'}</span>
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-xs font-bold ${n.read ? 'text-slate-300' : 'text-white'} leading-tight">${escapeHTML(n.title)}</p>
                    <p class="text-[10px] ${n.read ? 'text-slate-500' : 'text-slate-300'} mt-1 truncate" style="white-space: normal; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">${escapeHTML(n.body)}</p>
                    <p class="text-[8px] ${n.read ? 'text-slate-600' : 'text-indigo-300'} uppercase font-bold tracking-widest mt-2">${new Date(n.timestamp).toLocaleString([],{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</p>
                </div>
            </div>
        `).join('');
    } catch (e) {
        console.error('Failed to load notifications:', e);
    }
};

// Second definition removed to avoid shadowing consolidated logic above

/* --- 5. ADMIN COMMAND CENTER LOGIC --- */
// Loaded dynamically for admins only via script below
const userRaw = localStorage.getItem('user');
let isAdmin = false;
try {
    if (userRaw && JSON.parse(userRaw).role === 'admin') isAdmin = true;
} catch(e) {}

if (isAdmin || window.location.pathname.toLowerCase().includes('admin')) {
    const adminScript = document.createElement('script');
    adminScript.src = '/js/admin-system.js';
    adminScript.async = false;
    document.head.appendChild(adminScript);
}

/* --- 14. TOOL VISIBILITY HELPER --- */
function applyToolSettings(disabledPaths, order, overrides) {
    if (!window.CALCULATORS_DATA) return;

    // 0. Merge Custom Categories (if loaded in settings)
    const settings = JSON.parse(localStorage.getItem(SETTINGS_CACHE_KEY) || '{}');
    if (settings.customCategories && Array.isArray(settings.customCategories)) {
        // Avoid duplicates if function runs multiple times
        const existingCats = window.CALCULATORS_DATA.map(c => c.category);
        settings.customCategories.forEach(cc => {
            if (!existingCats.includes(cc.category)) {
                window.CALCULATORS_DATA.push(cc);
            }
        });
    }

    // Apply Overrides (Name and Link changes)
    if (overrides && Object.keys(overrides).length > 0) {
        window.CALCULATORS_DATA.forEach(cat => {
            cat.items.forEach(tool => {
                const override = overrides[tool.link] || overrides['/' + tool.link];
                if (override) {
                    if (override.newName) tool.name = override.newName;
                    if (override.newPath) tool.link = override.newPath;
                }
            });
        });
    }

    // Filter items
    if (disabledPaths) {
        window.CALCULATORS_DATA.forEach(cat => {
            if (!cat._originalItems) cat._originalItems = [...cat.items];
            cat.items = cat._originalItems.filter(t => !disabledPaths.includes(t.link));
        });
    }

    // Sort categories
    if (order) {
        window.CALCULATORS_DATA.sort((a, b) => {
            const idxA = order.indexOf(a.category);
            const idxB = order.indexOf(b.category);
            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
            if (idxA !== -1) return -1;
            if (idxB !== -1) return 1;
            return 0;
        });
    }

    window.CALCULATORS = window.CALCULATORS_DATA;
    if (typeof window.buildCalculators === 'function') window.buildCalculators();
    
    buildQuickNavigation();
}

/* --- DYNAMIC QUICK NAVIGATION GENERATOR --- */
// Loaded dynamically from /js/sidebar-generator.js
const navGenScript = document.createElement('script');
navGenScript.src = '/js/sidebar-generator.js';
navGenScript.async = false;
document.head.appendChild(navGenScript);

/* --- 15. GLOBAL MODAL SYSTEM --- */
// This function injects the modal's HTML structure into the page if it doesn't exist.
function injectModalHTML() {
    if (document.getElementById('custom-modal-backdrop')) return;

    const modalHTML = `
    <div id="custom-modal-backdrop" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] hidden flex items-center justify-center transition-opacity duration-300 opacity-0">
        <div id="custom-modal-box" class="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 p-8 transform scale-95 transition-transform duration-300">
            <div class="flex items-center gap-4 mb-4">
                <div id="custom-modal-icon" class="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black"></div>
                <h3 id="custom-modal-title" class="text-xl font-black tracking-tight text-slate-900 dark:text-white"></h3>
            </div>
            <p id="custom-modal-message" class="text-slate-500 dark:text-slate-400 text-sm font-medium mb-6 leading-relaxed"></p>
            
            <div id="custom-modal-prompt-container" class="hidden mb-6">
                <input type="text" id="custom-modal-input" class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none transition-all font-medium text-sm">
            </div>

            <div class="flex justify-end gap-3" id="custom-modal-actions">
                <button id="custom-modal-cancel" class="hidden px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-sm">Cancel</button>
                <button id="custom-modal-confirm" class="px-5 py-2.5 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/30 hover:bg-indigo-600 transition-all text-sm">Confirm</button>
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// This is the core promise-based function that handles modal display and user interaction.
function showModal({ title, message, type = 'info', isPrompt = false, isConfirm = false, defaultValue = '' }) {
    injectModalHTML(); // Ensure the modal is in the DOM

    const modalBackdrop = document.getElementById('custom-modal-backdrop');
    const modalBox = document.getElementById('custom-modal-box');
    const modalIcon = document.getElementById('custom-modal-icon');
    const modalTitle = document.getElementById('custom-modal-title');
    const modalMessage = document.getElementById('custom-modal-message');
    const modalInputContainer = document.getElementById('custom-modal-prompt-container');
    const modalInput = document.getElementById('custom-modal-input');
    const btnCancel = document.getElementById('custom-modal-cancel');
    const btnConfirm = document.getElementById('custom-modal-confirm');

    return new Promise((resolve) => {
        modalTitle.innerText = title;
        modalMessage.innerText = message;

        modalIcon.className = 'w-12 h-12 rounded-2xl flex items-center justify-center text-2xl';
        let iconHTML = '';
        if (type === 'error') {
            modalIcon.classList.add('bg-rose-100', 'text-rose-600');
            iconHTML = '<span class="material-symbols-outlined">error</span>';
            btnConfirm.className = "px-5 py-2.5 bg-rose-600 text-white font-bold rounded-xl shadow-lg shadow-rose-600/30 hover:bg-rose-700 transition-all text-sm";
        } else if (type === 'warning') {
            modalIcon.classList.add('bg-amber-100', 'text-amber-600');
            iconHTML = '<span class="material-symbols-outlined">warning</span>';
            btnConfirm.className = "px-5 py-2.5 bg-amber-500 text-white font-bold rounded-xl shadow-lg shadow-amber-500/30 hover:bg-amber-600 transition-all text-sm";
        } else if (type === 'success') {
            modalIcon.classList.add('bg-emerald-100', 'text-emerald-600');
            iconHTML = '<span class="material-symbols-outlined">check_circle</span>';
            btnConfirm.className = "px-5 py-2.5 bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 transition-all text-sm";
        } else { // info
            modalIcon.classList.add('bg-indigo-100', 'text-indigo-600');
            iconHTML = '<span class="material-symbols-outlined">info</span>';
            btnConfirm.className = "px-5 py-2.5 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/30 hover:bg-indigo-600 transition-all text-sm";
        }
        modalIcon.innerHTML = iconHTML;

        modalInputContainer.classList.toggle('hidden', !isPrompt);
        btnCancel.classList.toggle('hidden', !isPrompt && !isConfirm);

        if (isPrompt) {
            modalInput.value = defaultValue;
            setTimeout(() => modalInput.focus(), 100);
        }

        modalBackdrop.classList.remove('hidden');
        requestAnimationFrame(() => {
            modalBackdrop.classList.replace('opacity-0', 'opacity-100');
            modalBox.classList.replace('scale-95', 'scale-100');
        });

        const close = (val) => {
            modalBackdrop.classList.replace('opacity-100', 'opacity-0');
            modalBox.classList.replace('scale-100', 'scale-95');
            setTimeout(() => modalBackdrop.classList.add('hidden'), 300);
            // Clean up listeners to prevent memory leaks
            btnConfirm.onclick = null;
            btnCancel.onclick = null;
            modalInput.onkeydown = null;
            resolve(val);
        };

        btnConfirm.onclick = () => close(isPrompt ? modalInput.value : true);
        btnCancel.onclick = () => close(isPrompt ? null : false);
        modalInput.onkeydown = (e) => { if (e.key === 'Enter') btnConfirm.click(); };
    });
}

// Expose helper functions to the global window object
window.SmartHub = {
    showToast,
    formatDate,
    debounce,
    throttle,
    showTooltip,
    hideTooltip,
    toggleTranslate
};

// Translate functionality
window.toggleTranslate = function() {
    const currentLang = localStorage.getItem('language') || 'en';
    const targetLang = currentLang === 'en' ? 'hi' : 'en'; 
    localStorage.setItem('language', targetLang);
    
    if (typeof window.showGlobalToast === 'function') {
        window.showGlobalToast(`Language: ${targetLang === 'en' ? 'English' : 'हिन्दी'}`, 'info');
    }
    
    // Google Translate integration if available
    const gtSelect = document.querySelector('.goog-te-combo');
    if (gtSelect) {
        gtSelect.value = targetLang;
        gtSelect.dispatchEvent(new Event('change'));
    } else {
        window.location.href = `https://translate.google.com/translate?sl=auto&tl=${targetLang}&u=${encodeURIComponent(window.location.href)}`;
    }
};

window.showGlobalToast = function(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'fixed bottom-8 right-8 z-[99999] flex flex-col gap-3 pointer-events-none';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `px-6 py-4 rounded-2xl shadow-2xl text-white font-bold flex items-center gap-3 transition-all duration-500 transform translate-y-10 opacity-0 pointer-events-auto`;
    toast.style.background = type === 'error' ? '#ef4444' : (type === 'success' ? '#10b981' : '#6366f1');
    toast.innerHTML = `<span>${message}</span>`;
    container.appendChild(toast);
    
    requestAnimationFrame(() => {
        toast.classList.remove('translate-y-10', 'opacity-0');
    });
    
    setTimeout(() => {
        toast.classList.add('translate-y-10', 'opacity-0');
        setTimeout(() => toast.remove(), 500);
    }, 4000);
};


window.customAlert = (title, message, type) => showModal({ title, message, type });
window.customConfirm = (title, message, type = 'warning') => showModal({ title, message, type, isConfirm: true });
window.customPrompt = (title, message, defaultValue = '') => showModal({ title, message, isPrompt: true, defaultValue });

// Add the modal injector to the DOMContentLoaded event
document.addEventListener('DOMContentLoaded', injectModalHTML);

/**
 * SMART HUB | Global Button Watchdog
 * Ensures no button stays 'stuck' in disabled state for more than 10 seconds.
 * Fixes NEW_BUTTON_LOGIC_ISSUES.md across all pages.
 */
function initButtonWatchdog() {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'disabled') {
                const btn = mutation.target;
                if (btn.disabled && !btn.dataset.watchdogSet) {
                    btn.dataset.watchdogSet = 'true';
                    setTimeout(() => {
                        if (btn && btn.disabled) {
                            console.warn('[Watchdog] Re-enabling stuck button:', btn);
                            btn.disabled = false;
                            if (btn.dataset.originalContent) btn.innerHTML = btn.dataset.originalContent;
                            else if (btn.dataset.origHTML) btn.innerHTML = btn.dataset.origHTML;
                            else if (btn.dataset.orig) btn.innerText = btn.dataset.orig;
                        }
                        if (btn) delete btn.dataset.watchdogSet;
                    }, 10000); 
                }
            }
        });
    });

    observer.observe(document.body, { attributes: true, subtree: true, attributeFilter: ['disabled'] });

    const backupOriginals = () => {
        document.querySelectorAll('button').forEach(b => {
            if (!b.dataset.origHTML && b.innerHTML.trim() && !b.innerHTML.includes('circle-notch')) {
                b.dataset.origHTML = b.innerHTML;
            }
        });
    };
    backupOriginals();
    setTimeout(backupOriginals, 1000);
}
