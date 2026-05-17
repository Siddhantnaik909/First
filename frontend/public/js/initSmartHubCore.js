/* FIXED 1.1: Single consolidated init function - all DOMContentLoaded logic here */
function initSmartHubCore() {
    // Core theme + UI init
    initTheme();
    
    // Auth + profile
    updateUserInterface();
    
    // Button + sidebar handlers
    setupSidebarToggle();
    initGlobalSearch();
    initButtonWatchdog();
    
    // Page-specific
    if (typeof initCalculators === 'function') initCalculators();
    if (document.getElementById('favorites-grid')) loadFavorites();
    if (document.getElementById('recent-activity-list')) loadRecentActivity();
    
    // Service Worker registration (FIXED 1.2)
    if ('serviceWorker' in navigator) {
        if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({action: 'SKIP_WAITING'});
        }
        
        // Check sw.js exists before register
        fetch('/sw.js', { method: 'HEAD' })
            .then(() => navigator.serviceWorker.register('/sw.js'))
            .catch(() => console.log('[SW] sw.js not found, skipping registration'));
    }
    
    console.log('[SmartHub] Core initialized v' + APP_VERSION);
}
