(function() {
    function updateAuthUI() {
        if (typeof window.updateUserInterface === 'function') {
            window.updateUserInterface();
            return;
        }

        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const isLoggedIn = !!token && localStorage.getItem('isLoggedIn') === 'true';

        // Clear stale auth data if token is missing but isLoggedIn is true
        if (localStorage.getItem('isLoggedIn') === 'true' && !token) {
            console.warn('[auth-sync.js updateAuthUI] Stale auth state detected, clearing...');
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            localStorage.removeItem('authToken');
            location.reload();
            return;
        }

        const API_URL = window.API_URL || ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:')
            ? (window.location.port === '3001' ? 'http://localhost:3001' : 'http://localhost:3000')
            : window.location.origin);

        // 1. Handle Navigation Buttons (Login/Signup vs Profile)
        const authContainers = document.querySelectorAll('.auth-nav-container, #auth-actions, nav .flex.items-center.gap-4');
        
        authContainers.forEach(container => {
            if (isLoggedIn) {
                const photoUrl = user.photo ? (user.photo.startsWith('http') ? user.photo : `${API_URL}${user.photo.startsWith('/') ? user.photo : '/' + user.photo}`) : null;
                const avatarHtml = photoUrl 
                    ? `<img src="${photoUrl}" alt="Profile" class="w-10 h-10 rounded-full object-cover border border-primary/20 shadow-sm">`
                    : `<div class="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-sm group-hover:bg-primary group-hover:text-white transition-all">${(user.name || 'U').charAt(0).toUpperCase()}</div>`;

                const profileHTML = `
                        <div class="flex items-center gap-3 group relative cursor-pointer profile-snippet-auth" onclick="window.location.href='/profile.html'">
                            <div class="text-right hidden sm:block">
                                <p class="text-xs font-black text-slate-900 leading-none">${user.name || 'User'}</p>
                                <p class="text-[10px] font-bold text-primary uppercase tracking-widest mt-1">${user.role || 'Member'}</p>
                            </div>
                            ${avatarHtml}
                        </div>
                `;
                
                // If it's a simple login/signup group, replace it with a profile snippet
                // Or if it already contains the user profile snippet, update it dynamically
                if (container.querySelector('a[href*="login.html"]') || container.querySelector('.profile-snippet-auth')) {
                    container.innerHTML = profileHTML;
                }
            }
        });
    }

    // Run on load and after component injection
    document.addEventListener('DOMContentLoaded', updateAuthUI);
    document.addEventListener('componentsLoaded', updateAuthUI);
    window.addEventListener('authStateChanged', updateAuthUI);
    
    // Global export
    window.syncAuthUI = updateAuthUI;
})();
