/**
 * Smart Hub Feature Toggles
 * Loads flags from backend /api/ui/features or localStorage fallback
 * Integrated with Admin UI Config System
 */

window.FeatureToggles = {
  FEATURES: {
    // Core Features
    auth: true,
    adminPanel: true,
    adminLiveEdit: false,
    
    // UI Features
    notifications: true,
    themeEngine: true,
    mobileNav: true,
    translateWidget: true,
    pwa: true,
    favorites: true,
    
    // Game Features
    chess: true,
    ticTacToe: true,
    connect4: true,
    carRacing: true,
    rockPaperScissors: true,
    
    // Calculator Features
    calculatorTools: true,
    
    // Multiplayer
    multiplayer: true,
    gameLobby: true,
    
    // Other
    history: true,
    profile: true,
    settings: true,
    sound: false,
    animations: true
  },

  async init() {
    try {
      const API_URL = window.API_URL ||
          (window.location.protocol === 'file:' ? 'http://localhost:3000' : window.location.origin);
      const res = await fetch(`${API_URL}/ui/features`);
      if (res.ok) {
        const flags = await res.json();
        // Merge with existing features
        Object.assign(this.FEATURES, flags);
        localStorage.setItem('featureFlags', JSON.stringify(this.FEATURES));
      } else {
        // Fallback to local
        const saved = localStorage.getItem('featureFlags');
        if (saved) Object.assign(this.FEATURES, JSON.parse(saved));
      }
    } catch (e) {
      console.warn('[FeatureToggles] Backend unavailable, using defaults');
      
      // Try to load from admin UI config
      if (window.AdminUIConfig && window.AdminUIConfig.getFeatures) {
        const adminFeatures = window.AdminUIConfig.getFeatures();
        Object.assign(this.FEATURES, adminFeatures);
      }
    }

    // Apply toggles globally
    this.applyToggles();
    console.log('[FeatureToggles] Loaded:', this.FEATURES);
  },

  applyToggles() {
    // Hide/show elements based on flags
    if (!this.FEATURES.auth) {
      this.hideElements('#auth-actions, #user-profile-menu, #auth-guest, #auth-user');
    }
    
    if (!this.FEATURES.notifications) {
      this.hideElements('[data-notification]');
    }
    
    if (!this.FEATURES.adminLiveEdit) {
      window.initAdminLiveEditor = () => console.warn('Admin edit disabled');
    }
    
    if (!this.FEATURES.themeEngine) {
      document.body?.classList.add('no-theme-overrides');
    }
    
    // Game Features - Hide game containers if disabled
    if (!this.FEATURES.chess) {
      this.hideElements('[data-chess], #chess-game, #chessboard');
    }
    
    if (!this.FEATURES.ticTacToe) {
      this.hideElements('[data-tictactoe], #tic-tac-toe');
    }
    
    if (!this.FEATURES.connect4) {
      this.disabledElements('#connect-four, #connect4-game');
    }
    
    if (!this.FEATURES.carRacing) {
      this.hideElements('[data-car-racing], #car-racing');
    }
    
    if (!this.FEATURES.multiplayer) {
      this.hideElements('[data-multiplayer], #multiplayer-ui');
    }
    
    // Calculator Tools
    if (!this.FEATURES.calculatorTools) {
      this.hideElements('.calculator-tool, [data-tool]');
    }
    
    // History
    if (!this.FEATURES.history) {
      this.hideElements('[data-history], #history-page');
    }
    
    // Profile
    if (!this.FEATURES.profile) {
      this.hideElements('[data-profile], #profile-page');
    }
    
    // Settings
    if (!this.FEATURES.settings) {
      this.hideElements('[data-settings], #settings-page');
    }
    
    // Sound - Toggle audio context
    if (!this.FEATURES.sound) {
      window.audioEnabled = false;
    } else {
      window.audioEnabled = true;
    }
    
    // Animations - Apply with admin config
    if (!this.FEATURES.animations) {
      document.body?.classList.add('no-animations');
    }
  },

  hideElements(selector) {
    try {
      document.querySelectorAll(selector).forEach(el => {
        if (!el.hasAttribute('data-admin-hidden')) {
          el.style.display = 'none';
          el.setAttribute('data-feature-hidden', 'true');
        }
      });
    } catch (e) {
      console.warn('[FeatureToggles] Invalid selector:', selector);
    }
  },

  disabledElements(selector) {
    try {
      document.querySelectorAll(selector).forEach(el => {
        el.disabled = true;
        el.setAttribute('data-feature-disabled', 'true');
      });
    } catch (e) {
      console.warn('[FeatureToggles] Invalid selector:', selector);
    }
  },

  isEnabled(flag) {
    // Check both this FEATURES and admin config
    if (this.FEATURES[flag] !== undefined) {
      return this.FEATURES[flag];
    }
    // Fallback to admin config
    if (window.AdminUIConfig) {
      return window.AdminUIConfig.isFeatureEnabled(flag);
    }
    return false;
  },

  setFlag(flag, enabled) {
    this.FEATURES[flag] = enabled;
    localStorage.setItem('featureFlags', JSON.stringify(this.FEATURES));
    this.applyToggles();
    
    // Trigger UI update
    window.dispatchEvent(new CustomEvent('featureTogglesChanged', {
      detail: { flag, enabled }
    }));
  }
};

// Auto-initialize when loaded
window.addEventListener('DOMContentLoaded', () => {
  window.FeatureToggles.init();
});