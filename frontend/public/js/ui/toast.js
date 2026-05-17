console.log("Loaded: toast.js");

function createToast() {
    const toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
    return toast;
}

export function showToast(message, type = 'success', duration = 3000) {
    const toast = document.getElementById('toast') || createToast();
    const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : '!';
    
    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span class="toast-message">${message}</span>
    `;
    toast.className = `toast toast-${type} show`;
    
    setTimeout(() => toast.classList.remove('show'), duration);
}
