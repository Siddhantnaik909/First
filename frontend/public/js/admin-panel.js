/**
 * Admin Control Panel System
 * Comprehensive admin dashboard for game management
 */

class AdminPanelSystem {
  constructor() {
    this.isOpen = false;
    this.panelEl = null;
    this.initPanel();
  }

  initPanel() {
    if (!window.authSystem?.isAdmin()) {
      return;
    }
    
    this.createPanelUI();
    this.setupEventListeners();
  }

  createPanelUI() {
    // Create floating admin button
    const floatingBtn = document.createElement('button');
    floatingBtn.id = 'admin-panel-toggle';
    floatingBtn.className = 'fixed bottom-8 right-8 z-[999] w-14 h-14 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 hover:shadow-purple-500/50';
    floatingBtn.innerHTML = '<span class="material-symbols-outlined">admin_panel_settings</span>';
    floatingBtn.addEventListener('click', () => this.togglePanel());
    
    if (!document.getElementById('admin-panel-toggle')) {
      document.body.appendChild(floatingBtn);
    }

    // Create panel
    const panel = document.createElement('div');
    panel.id = 'admin-panel';
    panel.className = 'fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] hidden';
    panel.innerHTML = `
      <div class="absolute top-0 right-0 w-full md:w-[480px] h-screen bg-gradient-to-br from-slate-900 to-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right-10">
        <!-- Header -->
        <div class="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-6 flex justify-between items-center">
          <div>
            <h2 class="text-2xl font-black text-white flex items-center gap-2">
              <span class="material-symbols-outlined">admin_panel_settings</span>
              Admin Panel
            </h2>
            <p class="text-purple-100 text-sm mt-1">v${Date.now().toString().slice(-3)}</p>
          </div>
          <button id="admin-panel-close" class="text-white hover:bg-white/20 p-2 rounded-lg transition-all">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          <!-- User Info -->
          <div class="bg-white/10 rounded-xl p-4 border border-purple-500/30">
            <h3 class="text-purple-300 font-bold mb-3 flex items-center gap-2">
              <span class="material-symbols-outlined text-sm">person</span>
              Logged In As
            </h3>
            <div class="text-white">
              <div class="font-bold" id="admin-username">${window.authSystem?.getCurrentUser()?.username || 'Admin'}</div>
              <div class="text-sm text-slate-400" id="admin-email">${window.authSystem?.getCurrentUser()?.email || ''}</div>
              <div class="text-xs text-purple-400 mt-2">Role: ${window.authSystem?.getCurrentUser()?.role || 'admin'}</div>
            </div>
          </div>

          <!-- Feature Toggles -->
          <div class="bg-white/10 rounded-xl p-4 border border-purple-500/30">
            <h3 class="text-purple-300 font-bold mb-3 flex items-center gap-2">
              <span class="material-symbols-outlined text-sm">toggle_on</span>
              Feature Toggles
            </h3>
            <div id="admin-feature-toggles" class="space-y-2">
              <!-- Populated by JS -->
            </div>
          </div>

          <!-- UI Configuration -->
          <div class="bg-white/10 rounded-xl p-4 border border-purple-500/30">
            <h3 class="text-purple-300 font-bold mb-3 flex items-center gap-2">
              <span class="material-symbols-outlined text-sm">palette</span>
              UI Configuration
            </h3>
            <div id="admin-ui-config" class="space-y-3">
              <!-- Theme -->
              <div>
                <label class="text-slate-400 text-xs">Theme</label>
                <select id="admin-theme-select" class="w-full bg-slate-800 border border-slate-600 text-white rounded-lg p-2 text-sm">
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <!-- Layout Density -->
              <div>
                <label class="text-slate-400 text-xs">Layout Density</label>
                <select id="admin-density-select" class="w-full bg-slate-800 border border-slate-600 text-white rounded-lg p-2 text-sm">
                  <option value="compact">Compact</option>
                  <option value="normal">Normal</option>
                  <option value="spacious">Spacious</option>
                </select>
              </div>
              <!-- Button Style -->
              <div>
                <label class="text-slate-400 text-xs">Button Style</label>
                <select id="admin-buttons-select" class="w-full bg-slate-800 border border-slate-600 text-white rounded-lg p-2 text-sm">
                  <option value="modern">Modern</option>
                  <option value="classic">Classic</option>
                  <option value="minimal">Minimal</option>
                </select>
              </div>
              <!-- Toggles -->
              <div class="flex flex-wrap gap-2 pt-2">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" id="admin-animations" checked class="w-4 h-4">
                  <span class="text-slate-300 text-sm">Animations</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" id="admin-navbar" checked class="w-4 h-4">
                  <span class="text-slate-300 text-sm">Navbar</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" id="admin-gameui" checked class="w-4 h-4">
                  <span class="text-slate-300 text-sm">Game UI</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" id="admin-chessui" checked class="w-4 h-4">
                  <span class="text-slate-300 text-sm">Chess UI</span>
                </label>
              </div>
              <button id="admin-apply-ui" class="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2">
                <span class="material-symbols-outlined text-sm">check</span>
                Apply UI Changes
              </button>
            </div>
          </div>

          <!-- Version Control -->
          <div class="bg-white/10 rounded-xl p-4 border border-purple-500/30">
            <h3 class="text-purple-300 font-bold mb-3 flex items-center gap-2">
              <span class="material-symbols-outlined text-sm">version</span>
              Version Control
            </h3>
            <div id="admin-version-control">
              <!-- Populated by JS -->
            </div>
          </div>

          <!-- Game Controls -->
          <div class="bg-white/10 rounded-xl p-4 border border-purple-500/30">
            <h3 class="text-purple-300 font-bold mb-3 flex items-center gap-2">
              <span class="material-symbols-outlined text-sm">videogame_asset</span>
              Game Controls
            </h3>
            <div class="space-y-2">
              <button id="admin-pause-game" class="w-full bg-amber-600 hover:bg-amber-700 text-white py-2 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2">
                <span class="material-symbols-outlined text-sm">pause</span>
                Pause Game
              </button>
              <button id="admin-reset-game" class="w-full bg-rose-600 hover:bg-rose-700 text-white py-2 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2">
                <span class="material-symbols-outlined text-sm">refresh</span>
                Reset Game
              </button>
            </div>
          </div>

          <!-- System Logs -->
          <div class="bg-white/10 rounded-xl p-4 border border-purple-500/30">
            <div class="flex justify-between items-center mb-3">
              <h3 class="text-purple-300 font-bold flex items-center gap-2">
                <span class="material-symbols-outlined text-sm">list_alt</span>
                System Logs
              </h3>
              <button id="admin-clear-logs" class="text-xs bg-rose-600 hover:bg-rose-700 text-white px-2 py-1 rounded transition-all">Clear</button>
            </div>
            <div id="admin-logs" class="space-y-2 max-h-48 overflow-y-auto text-xs font-mono">
              <div class="text-slate-400">Waiting for logs...</div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="border-t border-slate-700 px-6 py-4 bg-slate-800/50">
          <button id="admin-logout" class="w-full bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white py-2 px-4 rounded-lg font-bold transition-all flex items-center justify-center gap-2">
            <span class="material-symbols-outlined text-sm">logout</span>
            Logout
          </button>
        </div>
      </div>
    `;
    
    if (!document.getElementById('admin-panel')) {
      document.body.appendChild(panel);
    }
    
    this.panelEl = document.getElementById('admin-panel');
    this.updatePanelContent();
  }

  setupEventListeners() {
    const closeBtn = document.getElementById('admin-panel-close');
    const panelBg = document.getElementById('admin-panel');
    const logoutBtn = document.getElementById('admin-logout');
    
    if (closeBtn) closeBtn.addEventListener('click', () => this.togglePanel());
    if (panelBg) panelBg.addEventListener('click', (e) => {
      if (e.target === panelBg) this.togglePanel();
    });
    if (logoutBtn) logoutBtn.addEventListener('click', () => this.logout());
    
    // Feature toggle switches
    this.setupFeatureToggles();
    
    // Game controls
    document.getElementById('admin-pause-game')?.addEventListener('click', () => this.pauseGame());
    document.getElementById('admin-reset-game')?.addEventListener('click', () => this.resetGame());
    document.getElementById('admin-clear-logs')?.addEventListener('click', () => this.clearLogs());
    
    // UI Config controls
    this.setupUIConfigControls();
  }
  
  setupUIConfigControls() {
    // Load current config values
    const config = window.AdminUIConfig?.getConfig() || {};
    const themeSelect = document.getElementById('admin-theme-select');
    const densitySelect = document.getElementById('admin-density-select');
    const buttonsSelect = document.getElementById('admin-buttons-select');
    const animationsCheck = document.getElementById('admin-animations');
    const navbarCheck = document.getElementById('admin-navbar');
    const gameUICheck = document.getElementById('admin-gameui');
    const chessUICheck = document.getElementById('admin-chessui');
    const applyBtn = document.getElementById('admin-apply-ui');
    
    if (themeSelect) themeSelect.value = config.theme || 'light';
    if (densitySelect) densitySelect.value = config.layoutDensity || 'normal';
    if (buttonsSelect) buttonsSelect.value = config.buttonsStyle || 'modern';
    if (animationsCheck) animationsCheck.checked = config.animations !== false;
    if (navbarCheck) navbarCheck.checked = config.navbar !== false;
    if (gameUICheck) gameUICheck.checked = config.gameUI !== false;
    if (chessUICheck) chessUICheck.checked = config.chessUI !== false;
    
    if (applyBtn) {
      applyBtn.addEventListener('click', () => {
        const uiConfig = {
          theme: themeSelect?.value || 'light',
          layoutDensity: densitySelect?.value || 'normal',
          buttonsStyle: buttonsSelect?.value || 'modern',
          animations: animationsCheck?.checked ?? true,
          navbar: navbarCheck?.checked ?? true,
          gameUI: gameUICheck?.checked ?? true,
          chessUI: chessUICheck?.checked ?? true,
          primaryColor: config.primaryColor || '#c96f32',
          accentColor: config.accentColor || '#2f9c95'
        };
        
        window.AdminUIConfig?.updateConfig(uiConfig);
        
        // Toggle features
        window.AdminUIConfig?.updateFeatures({
          chess: chessUICheck?.checked ?? true,
          animations: animationsCheck?.checked ?? true
        });
        
        this.log('UI Configuration updated');
        
        // Re-render all UI
        window.AdminUIConfig?.reRenderAllUI();
      });
    }
  }

  setupFeatureToggles() {
    const container = document.getElementById('admin-feature-toggles');
    if (!container) return;
    
    const features = window.featureToggle?.getAllFeatures() || {};
    container.innerHTML = '';
    
    for (const [key, value] of Object.entries(features)) {
      const toggle = document.createElement('label');
      toggle.className = 'flex items-center gap-3 cursor-pointer p-2 hover:bg-white/5 rounded transition-all';
      toggle.innerHTML = `
        <input type="checkbox" ${value ? 'checked' : ''} class="admin-feature-toggle" data-feature="${key}" class="w-4 h-4">
        <span class="text-slate-300 text-sm">${this.formatFeatureName(key)}</span>
        <span class="text-xs text-slate-500 ml-auto">${value ? '✓' : '✗'}</span>
      `;
      
      const checkbox = toggle.querySelector('input[type="checkbox"]');
      checkbox.addEventListener('change', (e) => {
        window.featureToggle?.setFeature(key, e.target.checked);
      });
      
      container.appendChild(toggle);
    }
  }

  setupVersionControl() {
    const container = document.getElementById('admin-version-control');
    if (!container) return;
    
    const versions = window.versionControl?.getAllVersions() || [];
    const approved = window.versionControl?.getApprovedVersions() || [];
    const current = window.versionControl?.getCurrentVersion() || '';
    
    container.innerHTML = versions.map(v => `
      <div class="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-slate-700/50 mb-2">
        <div class="flex-1">
          <div class="font-semibold text-white">${v.version}</div>
          <div class="text-xs text-slate-400">${v.changes}</div>
        </div>
        <div class="flex items-center gap-2">
          ${current === v.version ? `<span class="text-xs bg-emerald-600 text-white px-2 py-1 rounded">ACTIVE</span>` : ''}
          ${approved.includes(v.version) ? `<span class="text-xs bg-blue-600 text-white px-2 py-1 rounded">APPROVED</span>` : `<button class="text-xs bg-amber-600 hover:bg-amber-700 text-white px-2 py-1 rounded transition-all approve-version" data-version="${v.version}">Approve</button>`}
        </div>
      </div>
    `).join('');
    
    // Add approve listeners
    container.querySelectorAll('.approve-version').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const version = e.target.dataset.version;
        window.versionControl?.approveVersion(version);
        this.setupVersionControl();
        this.setupEventListeners();
      });
    });
  }

  updatePanelContent() {
    this.setupFeatureToggles();
    this.setupVersionControl();
    this.updateLogs();
  }

  updateLogs() {
    const logsContainer = document.getElementById('admin-logs');
    if (!logsContainer) return;
    
    const logs = window.globalValidation?.getLogs() || [];
    const recentLogs = logs.slice(-10).reverse();
    
    if (recentLogs.length === 0) {
      logsContainer.innerHTML = '<div class="text-slate-400">No logs yet</div>';
      return;
    }
    
    logsContainer.innerHTML = recentLogs.map(log => {
      const color = log.type === 'error' ? 'text-rose-400' : log.type === 'warning' ? 'text-amber-400' : 'text-emerald-400';
      return `<div class="text-xs ${color}">[${log.type.toUpperCase()}] ${log.message}</div>`;
    }).join('');
  }

  togglePanel() {
    if (!this.panelEl) return;
    
    const isHidden = this.panelEl.classList.contains('hidden');
    if (isHidden) {
      this.panelEl.classList.remove('hidden');
      this.isOpen = true;
      this.updatePanelContent();
    } else {
      this.panelEl.classList.add('hidden');
      this.isOpen = false;
    }
  }

  pauseGame() {
    window.dispatchEvent(new CustomEvent('admin-pause-game'));
    window.globalValidation?.logInfo('Admin paused the game');
  }

  resetGame() {
    if (confirm('Reset game? This action cannot be undone.')) {
      window.dispatchEvent(new CustomEvent('admin-reset-game'));
      window.globalValidation?.logInfo('Admin reset the game');
    }
  }

  clearLogs() {
    window.globalValidation?.clearLogs();
    this.updateLogs();
  }

  logout() {
    if (confirm('Logout?')) {
      window.authSystem?.logout();
      location.reload();
    }
  }

  formatFeatureName(name) {
    return name
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  if (window.authSystem?.isAdmin()) {
    window.adminPanel = new AdminPanelSystem();
  }
});

// Auto-update logs every 2 seconds
setInterval(() => {
  if (window.adminPanel?.isOpen) {
    window.adminPanel?.updateLogs();
  }
}, 2000);
