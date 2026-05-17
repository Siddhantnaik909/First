/**
 * SMART HUB | CENTRALIZED ALERT & MESSAGE SYSTEM v1.0
 * Replaces ALL alert()/confirm() + standardizes toasts/modals/notifications
 * Glassmorphism design | Promise-based | ARIA accessible | Mobile-optimized
 */

(function() {
    'use strict';

    // Prevent duplicate init
    if (window.SmartHubAlerts) return;
    window.SmartHubAlerts = true;

    // === 1. INJECT GLOBAL CONTAINERS ===
    function injectContainers() {
        if (document.getElementById('sh-alerts-root')) return;

        const root = document.createElement('div');
        root.id = 'sh-alerts-root';
        root.style.cssText = 'position:fixed;z-index:999999;pointer-events:none;';
        root.innerHTML = `            <!-- Toast Container (bottom-right stack) -->            <div id="sh-toast-container" style="bottom:24px;right:24px;display:flex;flex-direction:column;gap:12px;"></div>                        <!-- Modal Backdrop -->            <div id="sh-modal-backdrop" class="sh-modal-backdrop hidden" style="position:fixed;inset:0;background:rgba(15,23,42,0.75);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;z-index:10000;"></div>                        <!-- Live Region (ARIA) -->            <div id="sh-live-region" aria-live="polite" aria-atomic="true" style="position:absolute;left:-9999px;"></div>        `;
        document.body.appendChild(root);
    }

    // === 2. INJECT CSS (Glassmorphism + Animations) ===
    function injectCSS() {
        if (document.getElementById('_sh-alerts-css')) return;
        const style = document.createElement('style');
        style.id = '_sh-alerts-css';
        style.textContent = `/* Glass Toasts */
.sh-toast {min-width:280px;max-width:420px;padding:16px 20px;border-radius:20px;backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.2);box-shadow:0 20px 40px rgba(0,0,0,0.15),inset 0 1px 0 rgba(255,255,255,0.25);font-family:'Plus Jakarta Sans',sans-serif;font-weight:600;display:flex;gap:12px;align-items:flex-start;opacity:0;transform:translateX(24px);transition:all 0.4s cubic-bezier(0.25,0.46,0.45,0.94);pointer-events:auto;animation:shToastSlideIn 0.4s forwards;}
.sh-toast.success {background:linear-gradient(135deg,rgba(34,197,94,0.9),rgba(16,185,129,0.85));color:#fff;}
.sh-toast.error {background:linear-gradient(135deg,rgba(239,68,68,0.9),rgba(220,38,127,0.85));color:#fff;}
.sh-toast.warning {background:linear-gradient(135deg,rgba(251,191,36,0.9),rgba(245,158,11,0.85));color:#fff;}
.sh-toast.info {background:linear-gradient(135deg,rgba(99,102,241,0.9),rgba(139,92,246,0.85));color:#fff;}

.sh-toast-icon {font-size:20px;flex-shrink:0;}
.sh-toast-content {flex:1;min-width:0;}
.sh-toast-title {font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:0.1em;opacity:0.9;}
.sh-toast-msg {font-size:14px;line-height:1.4;margin-top:2px;}
.sh-toast-close {opacity:0.7;margin-left:8px;flex-shrink:0;font-size:18px;cursor:pointer;transition:opacity 0.2s;}
.sh-toast-close:hover {opacity:1;}

/* Modal */
.sh-modal {max-width:500px;width:90vw;max-height:90vh;overflow-y:auto;background:rgba(255,255,255,0.95);backdrop-filter:blur(20px);border-radius:24px;border:1px solid rgba(255,255,255,0.3);box-shadow:0 40px 80px rgba(0,0,0,0.3);transform:scale(0.95);transition:all 0.3s cubic-bezier(0.25,0.46,0.45,0.94);padding:32px;}
.sh-modal.show {transform:scale(1);}
.sh-modal-header {display:flex;gap:16px;align-items:center;margin-bottom:20px;}
.sh-modal-icon {width:48px;height:48px;border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0;}
.sh-modal-title {font-size:24px;font-weight:900;color:#0f172a;line-height:1.2;}
.sh-modal-msg {color:#475569;font-size:16px;line-height:1.6;margin-bottom:24px;}
.sh-modal-input {width:100%;padding:14px 16px;border:2px solid rgba(0,0,0,0.08);border-radius:16px;font-size:16px;background:rgba(255,255,255,0.6);transition:all 0.2s;}
.sh-modal-input:focus {outline:none;border-color:#115e59;box-shadow:0 0 0 4px rgba(17,94,89,0.1);}
.sh-modal-actions {display:flex;gap:12px;justify-content:flex-end;}
.sh-modal-btn {padding:12px 24px;border-radius:12px;font-weight:700;font-size:14px;cursor:pointer;transition:all 0.2s;border:none;}
.sh-modal-btn.primary {background:linear-gradient(135deg,#115e59,#0f766e);color:#fff;box-shadow:0 8px 24px rgba(17,94,89,0.3);}
.sh-modal-btn.primary:hover {transform:translateY(-1px);box-shadow:0 12px 32px rgba(17,94,89,0.4);}
.sh-modal-btn.secondary {background:rgba(0,0,0,0.05);color:#475569;}
.sh-modal-btn.secondary:hover {background:rgba(0,0,0,0.08);}

/* Animations */
@keyframes shToastSlideIn {to {opacity:1;transform:translateX(0);}}
@keyframes shModalSlideIn {to {opacity:1;transform:scale(1);}}

/* Dark Mode */
@media (prefers-color-scheme: dark) {
  .sh-modal {background:rgba(15,23,42,0.95);color:#e2e8f0;}
  .sh-modal-title {color:#f1f5f9;}
  .sh-modal-msg {color:#94a3b8;}
  .sh-modal-input {background:rgba(30,41,59,0.8);border-color:rgba(255,255,255,0.1);color:#f1f5f9;}
}

/* Mobile */
@media (max-width: 480px) {
  .sh-toast {min-width:calc(100vw - 48px);right:24px;left:24px;}
  .sh-modal {margin:16px;width:calc(100vw - 32px);padding:24px;border-radius:20px;}
  .sh-modal-title {font-size:20px;}
}`;
        document.head.appendChild(style);
    }

    // === 3. TOAST SYSTEM ===
    function showToast(msg, type = 'info', duration = 5000) {
        injectContainers();
        injectCSS();
        
        const container = document.getElementById('sh-toast-container');
        const toast = document.createElement('div');
        toast.className = 'sh-toast sh-toast-' + type;
        toast.innerHTML = `            <span class="sh-toast-icon material-symbols-outlined">${getIcon(type)}</span>            <div class="sh-toast-content">                <div class="sh-toast-title">${type.toUpperCase()}</div>                <div class="sh-toast-msg">${escapeHtml(msg)}</div>            </div>            <span class="sh-toast-close material-symbols-outlined" onclick="this.parentElement.remove()">close</span>        `;
        
        container.appendChild(toast);
        
        // ARIA announcement
        const live = document.getElementById('sh-live-region');
        live.textContent = type.toUpperCase() + ': ' + msg;
        
        // Auto-remove
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(24px)';
            setTimeout(() => toast.remove(), 400);
        }, duration);
    }

    function getIcon(type) {
        const icons = {
            success: 'check_circle',
            error: 'error',
            warning: 'warning',
            info: 'info'
        };
        return icons[type] || 'info';
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // === 4. MODAL SYSTEM (Promise-based) ===
    function showModal({title, message, type = 'info', isPrompt = false, defaultValue = ''}) {
        injectContainers();
        injectCSS();
        
        const backdrop = document.getElementById('sh-modal-backdrop');
        const modal = document.getElementById('sh-modal-backdrop').querySelector('.sh-modal') || createModal();
        
        // Setup content
        modal.innerHTML = `            <div class="sh-modal-header">                <div class="sh-modal-icon sh-icon-${type}">${getIcon(type)}</div>                <h3 class="sh-modal-title">${escapeHtml(title)}</h3>            </div>            <div class="sh-modal-msg">${escapeHtml(message)}</div>            ${isPrompt ? `<input class="sh-modal-input" value="${escapeHtml(defaultValue)}" autofocus>` : ''}            <div class="sh-modal-actions">                <button class="sh-modal-btn secondary" type="button">Cancel</button>                <button class="sh-modal-btn primary" type="button">OK</button>            </div>        `;
        
        backdrop.appendChild(modal);
        backdrop.classList.remove('hidden');
        requestAnimationFrame(() => {
            backdrop.classList.add('show');
            modal.classList.add('show');
        });
        
        return new Promise(resolve => {
            const btnOK = modal.querySelector('.sh-modal-btn.primary');
            const btnCancel = modal.querySelector('.sh-modal-btn.secondary');
            const input = modal.querySelector('.sh-modal-input');
            
            const close = (result) => {
                backdrop.classList.remove('show');
                modal.classList.remove('show');
                setTimeout(() => {
                    backdrop.classList.add('hidden');
                    resolve(result);
                }, 300);
            };
            
            btnOK.onclick = () => close(isPrompt ? input.value : true);
            btnCancel.onclick = () => close(isPrompt ? null : false);
            
            // ESC key, backdrop click
            const escHandler = (e) => { if (e.key === 'Escape') close(false); };
            const backdropHandler = (e) => { if (e.target === backdrop) close(false); };
            backdrop.addEventListener('click', backdropHandler);
            document.addEventListener('keydown', escHandler, {once: true});
            
            if (input) input.focus();
        });
    }

    function createModal() {
        const modal = document.createElement('div');
        modal.className = 'sh-modal';
        return modal;
    }

    // === 5. PUBLIC API (Replacements) ===
    window.showAlert = function(msg, type = 'info') {
        showToast(msg, type);
    };

    window.showError = function(msg) {
        showToast(msg, 'error');
    };

    window.showSuccess = function(msg) {
        showToast(msg, 'success');
    };

    window.showWarning = function(msg) {
        showToast(msg, 'warning');
    };

    window.showConfirm = function(title = 'Confirm', message) {
        return showModal({
            title,
            message: message || 'Are you sure?',
            type: 'warning',
            isPrompt: false
        }).then(ok => ok === true);
    };

    window.showPrompt = function(title, message, defaultValue = '') {
        return showModal({
            title,
            message,
            type: 'info',
            isPrompt: true,
            defaultValue
        }).then(value => value || null);
    };

    // Legacy deprecation (gradual migration)
    window.showGlobalToast = window.showAlert;

    // Auto-init on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            injectContainers();
            injectCSS();
        });
    } else {
        injectContainers();
        injectCSS();
    }

    console.log('[SmartHub Alerts] Centralized system loaded');
})();

