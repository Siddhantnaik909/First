/**
 * SMART HUB | PWA Installation Handler
 * Manages the "Add to Home Screen" experience.
 */

let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later.
    deferredPrompt = e;
    
    // Check if we have an install button in the UI
    const installBtn = document.getElementById('pwa-install-btn');
    if (installBtn) {
        installBtn.classList.remove('hidden');
        installBtn.classList.add('flex');
        window.repositionFABs?.();
    }
    
    // Also show in the sidebar/nav if applicable
    const installNavItem = document.getElementById('nav-install-item');
    if (installNavItem) {
        installNavItem.style.display = 'flex';
    }
});

window.addEventListener('appinstalled', (event) => {
    console.log('👍 App installed successfully');
    deferredPrompt = null;
    
    // Hide install buttons
    ['pwa-install-btn', 'nav-install-item'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });
    window.repositionFABs?.();
});

// Helper to check if already installed
window.isAppInstalled = function() {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
};

// Function called by the UI button
window.installPWA = async function() {
    if (!deferredPrompt) {
        if (typeof window.customAlert === 'function') {
            window.customAlert('Install App', 'Install prompt not available. The application may already be installed.', 'info');
        } else if (typeof window.showGlobalToast === 'function') {
            window.showGlobalToast('Install prompt not available right now.', 'info');
        } else {
            alert('Install prompt not available. The application may already be installed.');
        }
        return;
    }
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    
    // We've used the prompt, and can't use it again, throw it away
    deferredPrompt = null;
    
    // Hide button
    const installBtn = document.getElementById('pwa-install-btn');
    if (installBtn) installBtn.classList.add('hidden');
    window.repositionFABs?.();
};

// Initial check
document.addEventListener('DOMContentLoaded', () => {
    if (window.isAppInstalled()) {
        const installBtn = document.getElementById('pwa-install-btn');
        if (installBtn) installBtn.classList.add('hidden');
        window.repositionFABs?.();
    }
});
