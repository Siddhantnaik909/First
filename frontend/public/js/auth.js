/**
 * Smart Hub - Unified Auth & Navbar System (v4.0.0)
 * Centralized logic for multi-page authentication and UI synchronization.
 */

const AuthSystem = {
    // 1. Storage Keys
    KEYS: {
        USER: 'smart_hub_user',
        LOGGED_IN: 'isLoggedIn',
        HISTORY: 'calc_history'
    },

    // 2. Auth State Management
    getUser() {
        try {
            const user = localStorage.getItem(this.KEYS.USER);
            return user ? JSON.parse(user) : null;
        } catch (e) {
            console.error('[Auth] Failed to parse user', e);
            return null;
        }
    },

    isLoggedIn() {
        return localStorage.getItem(this.KEYS.LOGGED_IN) === 'true' && this.getUser() !== null;
    },

    login(userData) {
        if (!userData || !userData.email) return;
        localStorage.setItem(this.KEYS.USER, JSON.stringify(userData));
        localStorage.setItem(this.KEYS.LOGGED_IN, 'true');
        this.syncUI();
    },

    logout() {
        localStorage.removeItem(this.KEYS.USER);
        localStorage.setItem(this.KEYS.LOGGED_IN, 'false');
        window.location.href = '/login.html';
    },

    // 3. UI Synchronization
    syncUI() {
        this.renderNavbar();
        document.dispatchEvent(new CustomEvent('authStateChanged', { detail: { isLoggedIn: this.isLoggedIn(), user: this.getUser() } }));
    },

    renderNavbar() {
        const container = document.getElementById('auth-actions');
        const mobileContainer = document.getElementById('mobile-auth-placeholder');
        const user = this.getUser();
        const loggedIn = this.isLoggedIn();

        if (!container) return;

        if (loggedIn && user) {
            // Desktop Navbar Dropdown
            container.innerHTML = `
                <div class="relative group" id="user-nav-dropdown">
                    <button class="flex items-center gap-3 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all cursor-pointer" id="nav-profile-trigger">
                        <div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xs">
                            ${(user.name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div class="text-left hidden sm:block">
                            <p class="text-[11px] font-bold text-white leading-tight">${user.name || 'User'}</p>
                            <p class="text-[9px] text-slate-400 uppercase tracking-tighter">${user.role || 'member'}</p>
                        </div>
                        <span class="material-symbols-outlined text-slate-400 text-sm transition-transform group-hover:rotate-180">expand_more</span>
                    </button>

                    <div class="absolute top-14 right-0 w-64 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[9999] opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300">
                        <div class="p-4 border-b border-white/5 bg-white/5">
                            <p class="text-sm font-bold text-white">${user.name}</p>
                            <p class="text-[10px] text-slate-400 truncate">${user.email}</p>
                        </div>
                        <div class="p-2">
                            <a href="/profile.html" class="flex items-center gap-3 px-4 py-3 text-xs font-semibold text-slate-300 hover:bg-white/5 rounded-xl transition-all">
                                <span class="material-symbols-outlined text-sm">person</span> Profile Settings
                            </a>
                            <a href="/history.html" class="flex items-center gap-3 px-4 py-3 text-xs font-semibold text-slate-300 hover:bg-white/5 rounded-xl transition-all">
                                <span class="material-symbols-outlined text-sm">history</span> My History
                            </a>
                            ${user.role === 'admin' ? `
                            <a href="/AdminDashboard.html" class="flex items-center gap-3 px-4 py-3 text-xs font-bold text-primary hover:bg-primary/10 rounded-xl transition-all">
                                <span class="material-symbols-outlined text-sm">dashboard</span> Admin Panel
                            </a>` : ''}
                            <div class="h-px bg-white/5 my-2"></div>
                            <button onclick="AuthSystem.logout()" class="w-full flex items-center gap-3 px-4 py-3 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all">
                                <span class="material-symbols-outlined text-sm">logout</span> Logout
                            </button>
                        </div>
                    </div>
                </div>
            `;

            if (mobileContainer) {
                mobileContainer.innerHTML = `
                    <div class="p-4 bg-white/5 rounded-2xl border border-white/5">
                        <p class="text-sm font-bold text-white mb-4">Hi, ${user.name}</p>
                        <div class="flex flex-col gap-2">
                            <a href="/profile.html" class="text-slate-400 text-sm font-bold py-2">Profile</a>
                            <a href="/history.html" class="text-slate-400 text-sm font-bold py-2">History</a>
                            ${user.role === 'admin' ? '<a href="/AdminDashboard.html" class="text-primary text-sm font-bold py-2">Admin Panel</a>' : ''}
                            <button onclick="AuthSystem.logout()" class="text-rose-400 text-sm font-bold py-2 text-left">Logout</button>
                        </div>
                    </div>
                `;
            }
        } else {
            // Default Login / Signup
            container.innerHTML = `
                <div class="flex items-center gap-2">
                    <a href="/login.html" class="px-5 py-2 text-sm font-bold text-slate-300 hover:text-white transition-colors">Login</a>
                    <a href="/signup.html" class="px-5 py-2 text-xs font-black bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-all uppercase tracking-widest">Sign Up</a>
                </div>
            `;
            if (mobileContainer) {
                mobileContainer.innerHTML = `
                    <div class="grid grid-cols-2 gap-4">
                        <a href="/login.html" class="flex items-center justify-center py-4 bg-slate-800 text-white font-bold rounded-xl">Login</a>
                        <a href="/signup.html" class="flex items-center justify-center py-4 bg-primary text-white font-bold rounded-xl">Sign Up</a>
                    </div>
                `;
            }
        }
    },

    // 4. History Management
    getHistory() {
        return JSON.parse(localStorage.getItem(this.KEYS.HISTORY) || '[]');
    },

    saveHistory(toolName, inputs, results) {
        const history = this.getHistory();
        const entry = {
            id: Date.now(),
            name: toolName,
            date: new Date().toLocaleString(),
            timestamp: Date.now(),
            inputs: inputs,
            results: results,
            details: `${inputs.map(i => i.val).join(', ')} -> ${(results.find(r => r.highlight) || results[0])?.val || ''}`
        };
        history.unshift(entry);
        localStorage.setItem(this.KEYS.HISTORY, JSON.stringify(history.slice(0, 50)));
        // Dispatch event for UI updates
        document.dispatchEvent(new Event('historyUpdated'));
    }
};

// Auto-initialize on load
document.addEventListener('DOMContentLoaded', () => {
    AuthSystem.syncUI();
    // Re-check after a small delay to catch component-loaded navbar
    setTimeout(() => AuthSystem.syncUI(), 500);
});

// Re-check when components are loaded
document.addEventListener('componentsLoaded', () => {
    AuthSystem.syncUI();
});

// Expose globally
window.AuthSystem = AuthSystem;
