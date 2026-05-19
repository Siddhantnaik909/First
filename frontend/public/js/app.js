
// --- MASTER COMPONENT LOADER (v3.4.0) ---
async function loadComponent(placeholderId, filePath) {
    try {
        const response = await fetch(filePath);
        if (!response.ok) {
            console.warn(`Component not found: ${filePath}`);
            return;
        }
        const html = await response.text();

        const placeholder = document.getElementById(placeholderId);
        if (placeholder) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;

            // Fix component links
            if (window.FRONTEND_ROOT) {
                tempDiv.querySelectorAll('a, img, script, link').forEach(el => {
                    const attr = (el.tagName === 'A' || el.tagName === 'LINK') ? 'href' : 'src';
                    let val = el.getAttribute(attr);
                    if (val && !val.startsWith('http') && !val.startsWith('/') && !val.startsWith('#')) {
                        el.setAttribute(attr, window.FRONTEND_ROOT + val);
                    }
                });
            }

            const fragment = document.createDocumentFragment();
            while (tempDiv.firstChild) fragment.appendChild(tempDiv.firstChild);
            placeholder.replaceWith(fragment);
        }
    } catch (error) { console.error(`Failed to load ${filePath}:`, error); }
}

// --- GLOBAL UI FUNCTIONS ---
window.toggleDropdown = function (id, element) {
    const content = document.getElementById(id);
    if (!content) return;
    const icon = element.querySelector('.dropdown-icon');
    const isOpen = content.style.display === "block";
    content.style.display = isOpen ? "none" : "block";
    if (icon) icon.classList.toggle('rotate', !isOpen);
};

window.toggleSidebar = function () {
    document.querySelector('.sidebar')?.classList.toggle('active');
    document.querySelector('.overlay')?.classList.toggle('active');
};

// ✅ GLOBAL Mobile Menu Toggle - Available immediately
window.toggleMobileMenu = function () {
    const menu = document.getElementById('mobile-menu');
    if (!menu) return;
    menu.classList.toggle('hidden');
    document.body.style.overflow = menu.classList.contains('hidden') ? '' : 'hidden';
};

window.toggleDarkMode = function (checkbox) {
    const isDark = checkbox.checked;
    document.body.classList.toggle('dark-mode', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');

    // Sync all dark mode toggles (Sidebar & Settings)
    document.querySelectorAll('#theme-checkbox, #settings-theme-toggle').forEach(t => {
        if (t !== checkbox) t.checked = isDark;
    });
};

window.toggleCompactMode = function (checkbox) {
    const isCompact = checkbox.checked;
    document.body.classList.toggle('compact-mode', isCompact);
    localStorage.setItem('compact', isCompact ? 'true' : 'false');
};

window.toggleSidebarCollapse = function () {
    document.body.classList.toggle('sidebar-collapsed');
    const isCollapsed = document.body.classList.contains('sidebar-collapsed');
    localStorage.setItem('sidebarCollapsed', isCollapsed ? 'true' : 'false');
};

window.filterCalculators = function () {
    const input = document.querySelector('.search-box input');
    if (!input) return;
    const filter = input.value.toLowerCase();
    const menu = document.querySelector('.side-menu');
    if (!menu) return;

    const links = menu.querySelectorAll('a');
    for (const link of links) {
        // Reset first
        link.style.display = '';
        const parentDropdown = link.closest('.dropdown-content');
        if (parentDropdown) parentDropdown.style.display = '';

        if (filter) {
            const text = link.textContent || link.innerText;
            if (text.toLowerCase().indexOf(filter) > -1) {
                link.style.display = '';
                // Show parent dropdowns
                if (parentDropdown) parentDropdown.style.display = 'block';
            } else {
                link.style.display = 'none';
            }
        }
    }
};



// --- INITIALIZATION ---
document.addEventListener("DOMContentLoaded", async () => {
    const loader = Object.assign(document.createElement('div'), { id: 'global-loader', innerHTML: '<div class="loader-spinner"></div>' });
    document.body.appendChild(loader);

    // Dynamic Port Logic
    const PORT = 3000;
    const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? `http://localhost:${PORT}`
        : window.location.origin;
    window.API_URL = API_URL;

    try {
        // Parallel load all global components
        // Component-loader.js already handles this on DOMContentLoaded, 
        // but we ensure it happens here if not already done.
        if (typeof window.loadComponent === 'function') {
            await Promise.all([
                loadComponent('header-placeholder', '/components/unified-navbar.html'),
                loadComponent('footer-placeholder', '/components/footer.html')
            ]);
        }

        // Signal that components are ready
        document.dispatchEvent(new Event('componentsLoaded'));

        updateUserInterface();
        initTheme();
    } finally {
        setTimeout(() => { if (loader) { loader.style.opacity = '0'; setTimeout(() => loader.remove(), 300); } }, 500);
    }
});

function initTheme() {
    // 1. Dark Mode Initialization
    const isDark = localStorage.getItem('theme') === 'dark';
    if (isDark) {
        document.body.classList.add('dark-mode');
    }
    // Sync all theme toggles
    document.querySelectorAll('#theme-checkbox, #settings-theme-toggle').forEach(box => box.checked = isDark);

    // 2. Compact Mode Initialization
    const isCompact = localStorage.getItem('compact') === 'true';
    if (isCompact) document.body.classList.add('compact-mode');
    const compactToggle = document.getElementById('compact-toggle');
    if (compactToggle) compactToggle.checked = isCompact;

    // 3. Sidebar Collapse Initialization
    const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    if (isCollapsed) document.body.classList.add('sidebar-collapsed');

    // Remove old layout classes before applying new one
    document.body.classList.remove('sidebar-left', 'sidebar-right', 'sidebar-top', 'sidebar-bottom', 'sidebar-floating');

    // 4. Global Settings (Layout, Color, Font Size, Glassmorphism)
    const layoutMode = localStorage.getItem('layoutMode') || 'left';
    if (layoutMode !== 'left') {
        document.body.classList.add(`sidebar-${layoutMode}`);
    }

    const themeColor = localStorage.getItem('themeColor');
    if (themeColor) {
        document.documentElement.style.setProperty('--primary-color', themeColor);
        document.documentElement.style.setProperty('--primary-gradient', `linear-gradient(135deg, ${themeColor} 0%, ${themeColor}dd 100%)`);
    }

    const btnStyle = localStorage.getItem('buttonStyle');
    if (btnStyle) {
        let radius = '12px';
        if (btnStyle === 'round') radius = '24px';
        else if (btnStyle === 'sharp') radius = '0px';
        else if (btnStyle === 'leaf') radius = '12px 0 12px 0';
        document.documentElement.style.setProperty('--btn-radius', radius);
    }

    const font = localStorage.getItem('fontFamily');
    if (font) document.documentElement.style.setProperty('--font-main', font);

    const anim = localStorage.getItem('cardAnimation');
    if (anim && anim !== 'none') document.body.classList.add(`anim-${anim}`);

    const shadowIntensity = localStorage.getItem('shadowIntensity');
    if (shadowIntensity) {
        const intensity = shadowIntensity / 100;
        const y = 1 + (intensity * 15);
        const blur = 3 + (intensity * 27);
        const opacity = 0.02 + (intensity * 0.13);
        const hover_y = 2 + (intensity * 23);
        const hover_blur = 6 + (intensity * 34);
        const hover_opacity = 0.04 + (intensity * 0.16);
        document.documentElement.style.setProperty('--shadow-card', `0 ${y}px ${blur}px rgba(0,0,0, ${opacity})`);
        document.documentElement.style.setProperty('--shadow-hover', `0 ${hover_y}px ${hover_blur}px rgba(0,0,0, ${hover_opacity})`);
    }

    const sbBgStart = localStorage.getItem('sidebarBgStart');
    const sbBgEnd = localStorage.getItem('sidebarBgEnd');
    if (sbBgStart && sbBgEnd) {
        document.documentElement.style.setProperty('--sidebar-bg', `linear-gradient(180deg, ${sbBgStart}, ${sbBgEnd})`);
    }
    const sbText = localStorage.getItem('sidebarTextColor');
    if (sbText) {
        document.documentElement.style.setProperty('--sidebar-text', sbText);
    }
    const sbActive = localStorage.getItem('sidebarActiveColor');
    if (sbActive) {
        document.documentElement.style.setProperty('--sidebar-active', sbActive);
    }
    const sbWidth = localStorage.getItem('sidebarWidth');
    if (sbWidth) {
        document.documentElement.style.setProperty('--sidebar-width', `${sbWidth}px`);
    }
    const sbFontSize = localStorage.getItem('sidebarFontSize');
    if (sbFontSize) {
        document.documentElement.style.setProperty('--sidebar-font-size', `${sbFontSize}px`);
    }

    const fontSize = localStorage.getItem('customFontSize');
    if (fontSize) {
        document.documentElement.style.fontSize = `${fontSize}px`;
    }

    const isGlass = localStorage.getItem('glassmorphism') === 'true';
    if (isGlass) {
        document.documentElement.style.setProperty('--bg-card', 'rgba(30, 41, 59, 0.4)');
        document.documentElement.style.setProperty('--bg-sidebar', 'rgba(15, 23, 42, 0.6)');
        document.body.classList.add('sidebar-glass');
    } else {
        document.documentElement.style.removeProperty('--bg-card');
        document.documentElement.style.removeProperty('--bg-sidebar');
        document.body.classList.remove('sidebar-glass');
    }

    // Auto-update copyright year
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) yearSpan.textContent = new Date().getFullYear();
}

// Subscribe to real-time Cross-Tab Settings sync
window.addEventListener('storage', (e) => {
    // Only trigger re-render on visual preference changes
    const displayKeys = ['theme', 'compact', 'sidebarCollapsed', 'layoutMode', 'themeColor', 'customFontSize', 'glassmorphism'];
    if (displayKeys.includes(e.key)) {
        initTheme();
    }
});

function updateUserInterface() {
    const API_URL = window.API_URL || ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:')
        ? (window.location.port === '3001' ? 'http://localhost:3001' : 'http://localhost:3000')
        : window.location.origin);

    // Consistent User Data Retrieval
    const userJson = localStorage.getItem('smart_hub_user');
    const user = userJson ? JSON.parse(userJson) : null;
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true' && user !== null;
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');

    // 1. Session Restoration & Sync
    if (isLoggedIn && !token) {
        console.warn('[Auth Sync] Logged in state without token, resetting...');
        localStorage.clear();
        location.reload();
        return;
    }

    // Force id consistency (handling id vs _id)
    if (user && user._id && !user.id) user.id = user._id;

    const photoUrl = user && user.photo ? (user.photo.startsWith('http') ? user.photo : `${API_URL}${user.photo.startsWith('/') ? user.photo : '/' + user.photo}`) : null;

    const container = document.getElementById('auth-actions');
    // Auth-actions manipulation has been migrated to auth.js to prevent duplicate rendering issues.

    // 2. Sidebar Profile
    const sidebarProfile = document.querySelector('.user-profile');
    if (sidebarProfile) {
        if (isLoggedIn) {
            sidebarProfile.style.display = 'flex';
            const avatar = sidebarProfile.querySelector('.user-avatar');
            const name = sidebarProfile.querySelector('.user-info h4');
            const role = sidebarProfile.querySelector('.user-info p');

            if (avatar) {
                const fallbackChar = (user.name || 'U').charAt(0).toUpperCase();
                avatar.textContent = fallbackChar;
                if (photoUrl) {
                    const img = document.createElement('img');
                    img.src = photoUrl;
                    img.style.cssText = 'width: 100%; height: 100%; object-fit: cover; border-radius: 50%;';
                    img.alt = 'User Photo';
                    img.onerror = function() { avatar.textContent = fallbackChar; };
                    img.onload = function() { avatar.textContent = ''; avatar.appendChild(this); avatar.style.padding = '0'; };
                    avatar.appendChild(img);
                }
            }
            if (name) name.textContent = user.name || 'User';
            if (role) role.textContent = user.role === 'admin' ? 'Administrator' : 'Member';
        } else {
            sidebarProfile.style.display = 'none';
        }
    }
}

// Expose globally so components like settings.html can trigger a re-render
window.updateAppUI = updateUserInterface;
