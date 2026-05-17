/**
 * ADMIN UI CONTROL SYSTEM
 * Centralized configuration for all UI/UX across Smart Hub
 * All changes controlled by admin, no page can override
 */

(function() {
    'use strict';

    // ============================================
    // ADMIN GLOBAL UI CONFIG
    // ============================================
    
    const ADMIN_UI_CONFIG = {
        // Theme: "dark" | "light" | "custom"
        theme: "light",
        
        // Layout Controls
        navbar: true,
        sidebar: false,
        
        // UI Features
        animations: true,
        gameUI: true,
        chessUI: true,
        
        // Styling
        buttonsStyle: "modern", // "modern" | "classic" | "minimal"
        layoutDensity: "normal", // "compact" | "normal" | "spacious"
        
        // Colors (fallback if custom)
        primaryColor: "#c96f32",
        accentColor: "#2f9c95"
    };

    // ============================================
    // FEATURE SYNC SYSTEM
    // ============================================
    
    const FEATURES = {
        chess: true,
        adminPanel: true,
        animations: true,
        sound: false,
        newUI: true,
        multiplayer: true,
        calculatorTools: true,
        gameLobby: true,
        history: true,
        profile: true,
        settings: true
    };

    // ============================================
    // SYNC STATE (for real-time updates)
    // ============================================
    
    let syncState = {
        lastUpdate: null,
        version: '1.0.0',
        listeners: new Set()
    };

    // ============================================
    // CORE FUNCTIONS
    // ============================================

    // Get current config
    window.AdminUIConfig = {
        getConfig() {
            return { ...ADMIN_UI_CONFIG };
        },
        
        getFeatures() {
            return { ...FEATURES };
        },
        
        // Update config (called by admin panel)
        updateConfig(newConfig) {
            Object.assign(ADMIN_UI_CONFIG, newConfig);
            syncState.lastUpdate = new Date().toISOString();
            syncState.version = this incrementVersion();
            
            // Save to localStorage for persistence
            localStorage.setItem('adminUIConfig', JSON.stringify(ADMIN_UI_CONFIG));
            
            // Trigger global UI update
            this.reRenderAllUI();
            
            // Dispatch event for real-time sync
            window.dispatchEvent(new CustomEvent('adminUIConfigChanged', {
                detail: { config: ADMIN_UI_CONFIG }
            }));
            
            return ADMIN_UI_CONFIG;
        },
        
        // Update features
        updateFeatures(newFeatures) {
            Object.assign(FEATURES, newFeatures);
            localStorage.setItem('adminFeatures', JSON.stringify(FEATURES));
            
            window.dispatchEvent(new CustomEvent('adminFeaturesChanged', {
                detail: { features: FEATURES }
            }));
            
            return FEATURES;
        },
        
        // Re-render all UI components
        reRenderAllUI() {
            // Apply theme
            this.applyTheme();
            
            // Apply layout density
            this.applyLayoutDensity();
            
            // Apply button styles
            this.applyButtonStyles();
            
            // Apply animation setting
            this.applyAnimations();
            
            // Toggle game/chess UI
            this.toggleGameUI();
            
            console.log('[AdminUIConfig] UI re-rendered:', ADMIN_UI_CONFIG);
        },
        
        // Apply theme
        applyTheme() {
            const root = document.documentElement;
            
            if (ADMIN_UI_CONFIG.theme === 'dark') {
                root.classList.remove('light');
                root.classList.add('dark');
                document.body?.classList.add('dark-mode');
            } else if (ADMIN_UI_CONFIG.theme === 'light') {
                root.classList.remove('dark');
                root.classList.add('light');
                document.body?.classList.remove('dark-mode');
            }
            
            // Apply custom colors
            root.style.setProperty('--admin-primary', ADMIN_UI_CONFIG.primaryColor);
            root.style.setProperty('--admin-accent', ADMIN_UI_CONFIG.accentColor);
            
            localStorage.setItem('theme', ADMIN_UI_CONFIG.theme);
        },
        
        // Apply layout density
        applyLayoutDensity() {
            const density = ADMIN_UI_CONFIG.layoutDensity;
            document.body?.classList.remove('layout-compact', 'layout-normal', 'layout-spacious');
            document.body?.classList.add(`layout-${density}`);
        },
        
        // Apply button styles
        applyButtonStyles() {
            const btnClass = `btn-${ADMIN_UI_CONFIG.buttonsStyle}`;
            document.querySelectorAll('.btn').forEach(btn => {
                btn.classList.remove('btn-modern', 'btn-classic', 'btn-minimal');
                btn.classList.add(btnClass);
            });
        },
        
        // Apply animations
        applyAnimations() {
            if (!ADMIN_UI_CONFIG.animations) {
                document.body?.classList.add('no-animations');
                document.querySelectorAll('*').forEach(el => {
                    el.style.animation = 'none !important';
                    el.style.transition = 'none !important';
                });
            } else {
                document.body?.classList.remove('no-animations');
            }
        },
        
        // Toggle game UI
        toggleGameUI() {
            if (!ADMIN_UI_CONFIG.gameUI) {
                this.safeHideElement('.game-container, [data-game]');
                this.safeHideElement('#chessboard, #game-board');
            }
            
            if (!ADMIN_UI_CONFIG.chessUI) {
                this.safeHideElement('[data-chess], #chess-game');
            }
        },
        
        // Safe hide elements
        safeHideElement(selector) {
            document.querySelectorAll(selector).forEach(el => {
                el.style.display = 'none';
                el.setAttribute('data-admin-hidden', 'true');
            });
        },
        
        // Version increment
        incrementVersion() {
            const parts = syncState.version.split('.');
            parts[2] = parseInt(parts[2]) + 1;
            return parts.join('.');
        },
        
        // Check if feature is enabled
        isFeatureEnabled(feature) {
            return FEATURES[feature] === true;
        },
        
        // Get specific config value
        get(key) {
            return ADMIN_UI_CONFIG[key];
        },
        
        // Subscribe to changes
        subscribe(callback) {
            syncState.listeners.add(callback);
            return () => syncState.listeners.delete(callback);
        }
    };

    // ============================================
    // INITIALIZATION
    // ============================================
    
    async function init() {
        // Load from localStorage or backend
        await loadConfig();
        
        // Apply initial UI
        window.AdminUIConfig.reRenderAllUI();
        
        // Setup real-time sync
        setupRealtimeSync();
        
        console.log('[AdminUIConfig] Initialized:', ADMIN_UI_CONFIG);
    }

    // Load config from localStorage or backend API
    async function loadConfig() {
        // Try localStorage first
        const savedConfig = localStorage.getItem('adminUIConfig');
        const savedFeatures = localStorage.getItem('adminFeatures');
        
        if (savedConfig) {
            Object.assign(ADMIN_UI_CONFIG, JSON.parse(savedConfig));
        }
        
        if (savedFeatures) {
            Object.assign(FEATURES, JSON.parse(savedFeatures));
        }
        
        // Try backend API
        try {
            const API_URL = window.API_URL;
             
             // Load UI config from backend
            const configRes = await fetch(`${API_URL}/api/ui/config`, {
                headers: { 
                    'Authorization': `Bearer ${localStorage.getItem('token')}` 
                }
            });
            
            if (configRes.ok) {
                const backendConfig = await configRes.json();
                if (backendConfig.uiConfig) {
                    Object.assign(ADMIN_UI_CONFIG, backendConfig.uiConfig);
                }
                if (backendConfig.features) {
                    Object.assign(FEATURES, backendConfig.features);
                }
            }
        } catch (e) {
            console.log('[AdminUIConfig] Using local config');
        }
        
        // Apply saved theme on load
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme && ADMIN_UI_CONFIG.theme !== savedTheme) {
            ADMIN_UI_CONFIG.theme = savedTheme;
        }
    }

    // Setup real-time sync listeners
    function setupRealtimeSync() {
        // Listen for admin config changes
        window.addEventListener('adminUIConfigChanged', (e) => {
            window.AdminUIConfig.reRenderAllUI();
            syncState.listeners.forEach(cb => cb(e.detail));
        });
        
        // Listen for storage changes (cross-tab sync)
        window.addEventListener('storage', (e) => {
            if (e.key === 'adminUIConfig' || e.key === 'adminFeatures') {
                loadConfig().then(() => {
                    window.AdminUIConfig.reRenderAllUI();
                });
            }
        });
        
        // Listen for custom events
        window.addEventListener('adminConfigUpdate', () => {
            loadConfig().then(() => {
                window.AdminUIConfig.reRenderAllUI();
            });
        });
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose globally
    window.adminUIConfig = window.AdminUIConfig;

})();