/**
 * SMART HUB | Button Safe Enable Prototype
 * Emergency untrap for disabled buttons (NEW_BUTTON_LOGIC_ISSUES.md fix)
 */

HTMLButtonElement.prototype.safeEnable = function() {
  this.disabled = false;
  this.innerHTML = this.dataset.origHTML || this.dataset.orig || this.innerHTML || 'Calculate';
  this.classList.remove('btn-loading');
  console.log('[Button Fix] Emergency enable:', this.textContent);
};

// Auto-backup original content for all buttons
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('button').forEach(b => {
    if (!b.dataset.origHTML && b.innerHTML.trim()) {
      b.dataset.origHTML = b.innerHTML;
    }
    if (!b.dataset.orig && b.innerText.trim()) {
      b.dataset.orig = b.innerText;
    }
  });
});

// Emergency untrap: Re-enable all stuck disabled buttons
window.untrapAllButtons = function() {
  Array.from(document.querySelectorAll('button[disabled]')).forEach(b => b.safeEnable());
  console.log('🔧 Emergency button untrap completed');
};

// Auto-run if page loads with disabled buttons (race condition recovery)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(window.untrapAllButtons, 1000);
  });
} else {
  setTimeout(window.untrapAllButtons, 500);
}

// Unified loading state (Safe version)
window.setButtonLoading = function(btnOrId, isLoading) {
  const btn = typeof btnOrId === 'string' ? document.getElementById(btnOrId) : btnOrId;
  if (!btn) return;
  if (isLoading) {
    btn.dataset.originalContent = btn.innerHTML;
    btn.classList.add('btn-loading');
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Processing...`;
  } else {
    btn.classList.remove('btn-loading');
    btn.disabled = false;
    btn.innerHTML = btn.dataset.originalContent || btn.innerHTML;
  }
};
