/**
 * Authentication UI Wrapper
 * Handles login/signup modals and session management
 */

class AuthUIWrapper {
  constructor() {
    this.currentMode = 'login';
    this.init();
  }

  async init() {
    this.createAuthUI();
    this.setupEventListeners();
    await this.checkAuthStatus();
    window.authUI = this;
    FeatureToggles.isEnabled('auth') && this.updateUserInterface();
    window.dispatchEvent(new CustomEvent('authUILoaded'));
  }

  updateUserInterface() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    
    let user = {};
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) user = JSON.parse(userStr);
    } catch (e) {
      user = {};
    }
    
    if (isLoggedIn && !token) {
      localStorage.removeItem('isLoggedIn');
      this.checkAuthStatus();
      return;
    }

    this.renderAuthContainer(isLoggedIn, user, token);
    this.updateSidebarProfile(isLoggedIn, user);
    this.attachGlobalListeners();
    
    // Sync auth system
    if (window.authSystem && !window.authSystem.isLoggedIn && isLoggedIn) {
      window.authSystem.loadSession();
    }
  }

  createAuthUI() {
    // Create auth container
    const authContainer = document.createElement('div');
    authContainer.id = 'auth-container';
    authContainer.innerHTML = `
      <!-- Auth Modal -->
      <div id="auth-modal" class="fixed inset-0 bg-black/70 backdrop-blur-md z-[10000] flex items-center justify-center p-4 ${window.authSystem?.isLoggedIn ? 'hidden' : ''}">
        <div class="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-2xl w-full max-w-md border border-slate-700/50 animate-in fade-in zoom-in">
          <!-- Tabs -->
          <div class="flex border-b border-slate-700">
            <button id="auth-tab-login" class="flex-1 py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold cursor-pointer transition-all auth-tab border-b-2 border-white">
              <span class="flex items-center justify-center gap-2">
                <span class="material-symbols-outlined text-sm">login</span>
                Login
              </span>
            </button>
            <button id="auth-tab-signup" class="flex-1 py-3 px-4 text-slate-300 font-bold cursor-pointer transition-all auth-tab hover:bg-white/5 border-b-2 border-transparent">
              <span class="flex items-center justify-center gap-2">
                <span class="material-symbols-outlined text-sm">person_add</span>
                Sign Up
              </span>
            </button>
          </div>

          <!-- Content -->
          <div class="p-8">
            <!-- Login Form -->
            <form id="login-form" class="space-y-4 auth-form active">
              <h2 class="text-2xl font-black text-white mb-6">Welcome Back</h2>
              
              <div>
                <label class="block text-slate-300 font-semibold mb-2">Email</label>
                <input id="login-email" type="email" placeholder="Enter your email" class="w-full px-4 py-3 rounded-lg bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-all" />
              </div>
              
              <div>
                <label class="block text-slate-300 font-semibold mb-2">Password</label>
                <input id="login-password" type="password" placeholder="••••••" class="w-full px-4 py-3 rounded-lg bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-all" />
              </div>
              
              <div id="login-error" class="hidden text-rose-400 text-sm p-3 bg-rose-500/20 rounded-lg border border-rose-500/50"></div>
              
              <button type="submit" class="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-3 px-4 rounded-lg font-bold transition-all shadow-lg">
                <span class="flex items-center justify-center gap-2">
                  <span class="material-symbols-outlined">login</span>
                  Login
                </span>
              </button>
            </form>

            <!-- Signup Form -->
            <form id="signup-form" class="space-y-4 auth-form hidden">
              <h2 class="text-2xl font-black text-white mb-6">Create Account</h2>
              
              <div>
                <label class="block text-slate-300 font-semibold mb-2">Username</label>
                <input id="signup-username" type="text" placeholder="Your Name" class="w-full px-4 py-3 rounded-lg bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-all" />
              </div>
              
              <div>
                <label class="block text-slate-300 font-semibold mb-2">Email</label>
                <input id="signup-email" type="email" placeholder="you@example.com" class="w-full px-4 py-3 rounded-lg bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-all" />
              </div>
              
              <div>
                <label class="block text-slate-300 font-semibold mb-2">Password</label>
                <input id="signup-password" type="password" placeholder="••••••" class="w-full px-4 py-3 rounded-lg bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-all" />
              </div>
              
              <div id="signup-error" class="hidden text-rose-400 text-sm p-3 bg-rose-500/20 rounded-lg border border-rose-500/50"></div>
              
              <button type="submit" class="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-3 px-4 rounded-lg font-bold transition-all shadow-lg">
                <span class="flex items-center justify-center gap-2">
                  <span class="material-symbols-outlined">person_add</span>
                  Create Account
                </span>
              </button>
            </form>
          </div>
        </div>
      </div>

      <!-- Logged-In Header -->
      <div id="auth-header" class="fixed top-0 left-0 right-0 z-[5000] bg-gradient-to-r from-slate-900/80 to-slate-800/80 backdrop-blur-md border-b border-slate-700/50 ${!window.authSystem?.isLoggedIn ? 'hidden' : ''}">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div class="flex items-center gap-3">
            <span class="material-symbols-outlined text-2xl text-purple-400">shield</span>
            <div>
              <div class="text-white font-bold" id="header-username">${window.authSystem?.getCurrentUser()?.username || 'Player'}</div>
              <div class="text-xs text-slate-400" id="header-role">${window.authSystem?.getCurrentUser()?.role || 'user'}</div>
            </div>
          </div>
          <button id="logout-btn" class="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2">
            <span class="material-symbols-outlined text-sm">logout</span>
            Logout
          </button>
        </div>
      </div>
    `;
    
    document.body.insertBefore(authContainer, document.body.firstChild);
  }

  setupEventListeners() {
    // Tab switching
    document.getElementById('auth-tab-login')?.addEventListener('click', () => this.switchTab('login'));
    document.getElementById('auth-tab-signup')?.addEventListener('click', () => this.switchTab('signup'));
    
    // Form submissions
    document.getElementById('login-form')?.addEventListener('submit', (e) => this.handleLogin(e));
    document.getElementById('signup-form')?.addEventListener('submit', (e) => this.handleSignup(e));
    
    // Logout
    document.getElementById('logout-btn')?.addEventListener('click', () => this.handleLogout());
  }

  switchTab(tab) {
    // Update tab buttons
    document.getElementById('auth-tab-login')?.classList.toggle('border-b-2 border-white');
    document.getElementById('auth-tab-login')?.classList.toggle('border-b-2 border-transparent');
    document.getElementById('auth-tab-login')?.classList.toggle('bg-gradient-to-r');
    document.getElementById('auth-tab-login')?.classList.toggle('from-purple-600');
    document.getElementById('auth-tab-login')?.classList.toggle('to-indigo-600');
    document.getElementById('auth-tab-login')?.classList.toggle('text-white');
    document.getElementById('auth-tab-login')?.classList.toggle('text-slate-300');
    document.getElementById('auth-tab-login')?.classList.toggle('hover:bg-white/5');

    document.getElementById('auth-tab-signup')?.classList.toggle('border-b-2 border-white');
    document.getElementById('auth-tab-signup')?.classList.toggle('border-b-2 border-transparent');
    document.getElementById('auth-tab-signup')?.classList.toggle('bg-gradient-to-r');
    document.getElementById('auth-tab-signup')?.classList.toggle('from-purple-600');
    document.getElementById('auth-tab-signup')?.classList.toggle('to-indigo-600');
    document.getElementById('auth-tab-signup')?.classList.toggle('text-white');
    document.getElementById('auth-tab-signup')?.classList.toggle('text-slate-300');
    document.getElementById('auth-tab-signup')?.classList.toggle('hover:bg-white/5');

    // Update forms
    document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
    const formToShow = document.getElementById(`${tab}-form`);
    if (formToShow) {
      formToShow.classList.add('active');
    }
  }

  handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email')?.value;
    const password = document.getElementById('login-password')?.value;
    const errorEl = document.getElementById('login-error');
    
    if (!email || !password) {
      errorEl?.classList.remove('hidden');
      errorEl.textContent = 'Email and password required';
      return;
    }
    
    const result = window.authSystem?.login(email, password);
    
    if (!result.success) {
      errorEl?.classList.remove('hidden');
      errorEl.textContent = result.error;
      return;
    }
    
    errorEl?.classList.add('hidden');
    window.globalValidation?.logInfo(`User logged in: ${email}`);
    
    // Dispatch event for instant UI update without page reload
    window.dispatchEvent(new Event('authStateChanged'));
    
    // Update navbar if function exists
    if (typeof window.updateNavbarAuthUI === 'function') {
      window.updateNavbarAuthUI();
    }
    
    // Hide auth modal
    const modal = document.getElementById('auth-modal');
    if (modal) modal.classList.add('hidden');
    
    // Optionally reload pages that need user data, but don't force it
    // location.reload();
  }

  handleSignup(e) {
    e.preventDefault();
    
    const username = document.getElementById('signup-username')?.value;
    const email = document.getElementById('signup-email')?.value;
    const password = document.getElementById('signup-password')?.value;
    const errorEl = document.getElementById('signup-error');
    
    if (!username || !email || !password) {
      errorEl?.classList.remove('hidden');
      errorEl.textContent = 'All fields required';
      return;
    }
    
    const result = window.authSystem?.signup(email, password, username);
    
    if (!result.success) {
      errorEl?.classList.remove('hidden');
      errorEl.textContent = result.error;
      return;
    }
    
    // Switch to login tab
    errorEl?.classList.add('hidden');
    window.globalValidation?.logInfo(`New account created: ${email}`);
    document.getElementById('login-email').value = email;
    document.getElementById('login-password').value = password;
    this.switchTab('login');
    
    // Show success message
    alert(result.message);
  }

  handleLogout() {
    if (confirm('Logout?')) {
      window.authSystem?.logout();
      window.globalValidation?.logInfo('User logged out');
      
      // Dispatch event for instant UI update without page reload
      window.dispatchEvent(new Event('authStateChanged'));
      
      // Update navbar if function exists
      if (typeof window.updateNavbarAuthUI === 'function') {
        window.updateNavbarAuthUI();
      }
      
      // Hide header
      const header = document.getElementById('auth-header');
      if (header) header.classList.add('hidden');
      
      // Show login modal again
      const modal = document.getElementById('auth-modal');
      if (modal) modal.classList.remove('hidden');
    }
  }

  checkAuthStatus() {
    const modal = document.getElementById('auth-modal');
    const header = document.getElementById('auth-header');
    
    // Check both authSystem and localStorage for compatibility
    const isLoggedIn = window.authSystem?.isLoggedIn || localStorage.getItem('isLoggedIn') === 'true';
    
    if (isLoggedIn) {
      modal?.classList.add('hidden');
      header?.classList.remove('hidden');
    } else {
      modal?.classList.remove('hidden');
      header?.classList.add('hidden');
    }
  }
}

// Auto-init if script.js orchestrates, else standalone
if (!window.authUILoaded) {
  document.addEventListener('DOMContentLoaded', () => new AuthUIWrapper());
}
