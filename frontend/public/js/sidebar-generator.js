/* --- DYNAMIC QUICK NAVIGATION GENERATOR --- */
function buildQuickNavigation() {
    const navContainers = document.querySelectorAll('.bg-surface-container-high');
    let targetContainer = null;
    navContainers.forEach(c => {
        const h4 = c.querySelector('h4');
        if(h4 && h4.innerText.toUpperCase().includes('QUICK NAVIGATION')) {
            targetContainer = c.querySelector('.space-y-4');
        }
    });

    if (!targetContainer || !window.CALCULATORS_DATA) return;
}

/* --- DYNAMIC CALCULATORS PAGE BUILDER --- */
window.buildCalculators = function() {
    const container = document.getElementById('calculators-container');
    if (!container || !window.CALCULATORS_DATA) return;
    
    container.innerHTML = '';
    
    window.CALCULATORS_DATA.forEach(cat => {
        const section = document.createElement('section');
        section.className = 'category-section';
        section.setAttribute('data-cat', cat.category);
        
        const iconClass = cat.icon || 'fas fa-tool';
        
        section.innerHTML = `
            <div class="flex items-center gap-4 mb-10">
                <div class="w-12 h-12 flex items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/10">
                    <i class="${iconClass} text-xl notranslate" translate="no"></i>
                </div>
                <h2 class="text-3xl font-black tracking-tighter text-on-surface uppercase">
                    ${cat.category}
                </h2>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                ${cat.items.map(tool => `
                    <a href="${tool.link}" class="tool-card p-8 bg-surface-container-lowest rounded-[2.5rem] border border-slate-100 flex flex-col justify-between group transition-all min-h-[240px] shadow-sm">
                        <div>
                            <div class="flex justify-between items-start mb-6">
                                <div class="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                                    <i class="${iconClass} text-lg notranslate" translate="no"></i>
                                </div>
                                <span class="material-symbols-outlined text-slate-300 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1 notranslate" translate="no">north_east</span>
                            </div>
                            <h3 class="text-xl font-black tracking-tight text-on-surface group-hover:text-primary transition-colors truncate mb-1">
                                ${tool.name}
                            </h3>
                            <p class="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest opacity-60">
                                Ready to use
                            </p>
                        </div>
                        <div class="pt-12 border-t border-slate-50 flex items-center justify-between">
                            <div class="flex items-center gap-2">
                                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span class="text-[8px] font-black uppercase tracking-widest text-emerald-600">Online</span>
                            </div>
                            <div class="text-[9px] font-black text-primary uppercase tracking-[0.2em] bg-primary/5 px-4 py-2 rounded-xl group-hover:bg-primary group-hover:text-white transition-colors">
                                Open Tool
                            </div>
                        </div>
                    </a>
                `).join('')}
            </div>
        `;
        
        container.appendChild(section);
    });
    
    // Re-initialize search after building
    if (typeof window.initSearch === 'function') {
        window.initSearch();
    }
};

    let allTools = [];
    window.CALCULATORS_DATA.forEach(cat => {
        cat.items.forEach(tool => allTools.push(tool));
    });

    const currentPath = window.location.pathname;
    let currentIndex = allTools.findIndex(t => currentPath.endsWith(t.link) || t.link.endsWith(currentPath) || currentPath.includes(t.link.split('/').pop()));
    if (currentIndex === -1) return;

    let prevTool = currentIndex > 0 ? allTools[currentIndex - 1] : allTools[allTools.length - 1];
    let nextTool = currentIndex < allTools.length - 1 ? allTools[currentIndex + 1] : allTools[0];

    const getLink = (link) => link.startsWith('/') ? link : '/' + link;

    targetContainer.innerHTML = `
        <a href="${getLink(prevTool.link)}" class="flex items-center gap-3 p-4 bg-surface-container-lowest rounded-xl hover:bg-primary/10 transition-all border border-transparent hover:border-primary/20 group">
            <span class="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">arrow_back</span>
            <div>
                <div class="text-[10px] font-bold text-on-surface-variant uppercase opacity-60">Back</div>
                <div class="text-xs font-bold text-on-surface uppercase">${prevTool.name}</div>
            </div>
        </a>
        <a href="${getLink(nextTool.link)}" class="flex items-center gap-3 p-4 bg-surface-container-lowest rounded-xl hover:bg-primary/10 transition-all border border-transparent hover:border-primary/20 group text-right justify-end">
            <div>
                <div class="text-[10px] font-bold text-on-surface-variant uppercase opacity-60">Next</div>
                <div class="text-xs font-bold text-on-surface uppercase">${nextTool.name}</div>
            </div>
            <span class="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">arrow_forward</span>
        </a>
    `;
}

// Position FAB buttons properly - fixed positioning conflicts
const repositionFABs = () => {
  const fabs = document.querySelectorAll('#pwa-install-btn, #global-theme-fab, #game-fullscreen-fab, #sh-translate-fab');
  let yPos = 92; // Bottom spacing
  fabs.forEach(fab => {
    if (fab.classList.contains('hidden')) return;
    fab.style.bottom = yPos + 'px';
    fab.style.right = '24px';
    fab.style.left = 'auto';
    fab.style.maxWidth = window.innerWidth <= 640 ? 'calc(100vw - 32px)' : '';
    yPos += 74; // FAB height + gap
  });
};
window.repositionFABs = repositionFABs;

// Failsafe: Run Interface update again at script end
updateUserInterface();
setTimeout(repositionFABs, 500);
window.addEventListener('resize', repositionFABs);

// 🎮 GAMES FULLSCREEN API - Universal toggle for all games
window.toggleFullscreen = function(element = document.documentElement) {
    if (!document.fullscreenElement) {
        element.requestFullscreen().catch(err => showGlobalToast('Fullscreen failed: ' + err.message, 'warning'));
    } else {
        document.exitFullscreen();
    }
};

document.addEventListener('fullscreenchange', () => {
    const isFullscreen = !!document.fullscreenElement;
    const fab = document.getElementById('game-fullscreen-fab');
    if (fab) {
        fab.innerHTML = isFullscreen 
            ? '<span class="material-symbols-outlined">fullscreen_exit</span>'
            : '<span class="material-symbols-outlined">fullscreen</span>';
        fab.title = isFullscreen ? 'Exit fullscreen (Esc)' : 'Fullscreen (F11)';
    }
    // Escape key exits fullscreen
    document.onkeydown = (e) => {
        if (e.key === 'Escape' && document.fullscreenElement) {
            document.exitFullscreen();
        }
    };
});

/* ─── GLOBAL SIGN OUT BUTTON HANDLER ─── */
(function initGlobalSignOutHandler() {
    // Attach event listeners to ALL sign-out-btn elements on the page
    const attachSignOutListeners = () => {
        document.querySelectorAll('#sign-out-btn, [id="sign-out-btn"]').forEach(btn => {
            if (!btn.hasAttribute('data-listener-attached')) {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    window.confirmLogout();
                });
                btn.setAttribute('data-listener-attached', 'true');
            }
        });
    };
    
    // Run immediately if DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', attachSignOutListeners);
    } else {
        attachSignOutListeners();
    }
    
    // Also attach after a short delay in case elements are dynamically loaded
    setTimeout(attachSignOutListeners, 100);
    setTimeout(attachSignOutListeners, 500);
    
    // Attach on auth state changes
    window.addEventListener('authStateChanged', attachSignOutListeners);
    
    // Use MutationObserver to catch dynamically added buttons
    const observer = new MutationObserver((mutations) => {
        let shouldAttach = false;
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (node.id === 'sign-out-btn' || node.querySelector('#sign-out-btn')) {
                            shouldAttach = true;
                        }
                    }
                });
            }
        });
        if (shouldAttach) {
            attachSignOutListeners();
        }
    });
    
    // Start observing once DOM is ready
    const startObserver = () => {
        observer.observe(document.body, { childList: true, subtree: true });
    };
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startObserver);
    } else {
        startObserver();
    }
})();

/* ─── CLEAR STALE AUTH DATA ─── */
(function clearStaleAuthData() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    
    if (isLoggedIn && !token) {
        console.warn('[clearStaleAuthData] Stale auth state detected, clearing...');
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('authToken');
        console.log('[clearStaleAuthData] Stale data cleared, please refresh the page');
    }
})();

/* ─── GLOBAL DARK MODE & TRANSLATE BUTTON HANDLERS ─── */
(function initGlobalThemeHandlers() {
    const attachThemeListeners = () => {
        // Dark mode toggle
        const darkModeToggle = document.getElementById('dark-mode-toggle');
        if (darkModeToggle && !darkModeToggle.hasAttribute('data-listener-attached')) {
            darkModeToggle.addEventListener('click', () => {
                window.toggleDarkMode({checked: document.documentElement.classList.contains('dark')});
            });
            darkModeToggle.setAttribute('data-listener-attached', 'true');
        }
        
        // Translate button
        const translateBtn = document.getElementById('translate-btn');
        if (translateBtn && !translateBtn.hasAttribute('data-listener-attached')) {
            translateBtn.addEventListener('click', () => {
                window.toggleTranslate();
            });
            translateBtn.setAttribute('data-listener-attached', 'true');
        }
    };
    
    // Run immediately if DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', attachThemeListeners);
    } else {
        attachThemeListeners();
    }
    
    // Also attach after a short delay
    setTimeout(attachThemeListeners, 100);
})();

/* ─── GLOBAL TRANSLATE WIDGET (for pages without calc-utils.js) ─── */
(function injectTranslateIfMissing() {
    // If calc-utils.js already injected the translate button, skip
    if (document.getElementById('sh-translate-fab')) return;
    const inject = () => {
        if (document.getElementById('sh-translate-fab')) return;

        const languages = [
            { code: 'en', name: 'English', flag: '🇺🇸' },
            { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
            { code: 'mr', name: 'मराठी', flag: '🇮🇳' },
            { code: 'ta', name: 'தமிழ்', flag: '🇮🇳' },
            { code: 'te', name: 'తెలుగు', flag: '🇮🇳' },
            { code: 'bn', name: 'বাংলা', flag: '🇮🇳' },
            { code: 'gu', name: 'ગુજરાતી', flag: '🇮🇳' },
            { code: 'kn', name: 'ಕನ್ನಡ', flag: '🇮🇳' },
            { code: 'ml', name: 'മലയാളം', flag: '🇮🇳' },
            { code: 'pa', name: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
            { code: 'ur', name: 'اردو', flag: '🇵🇰' },
            { code: 'es', name: 'Español', flag: '🇪🇸' },
            { code: 'fr', name: 'Français', flag: '🇫🇷' },
            { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
            { code: 'zh-CN', name: '中文', flag: '🇨🇳' },
            { code: 'ja', name: '日本語', flag: '🇯🇵' },
            { code: 'ko', name: '한국어', flag: '🇰🇷' },
            { code: 'ar', name: 'العربية', flag: '🇸🇦' },
            { code: 'pt', name: 'Português', flag: '🇧🇷' },
            { code: 'ru', name: 'Русский', flag: '🇷🇺' },
        ];

        // Inject CSS
        if (!document.getElementById('_sh-translate-css')) {
            const style = document.createElement('style');
            style.id = '_sh-translate-css';
            style.textContent = `
                #sh-translate-fab{position:fixed;bottom:24px;left:24px;z-index:9999;display:flex;align-items:center;gap:8px;background:linear-gradient(135deg,#7c3aed 0%,#6366f1 100%);color:#fff;border:none;border-radius:50px;padding:12px 20px;font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;cursor:pointer;box-shadow:0 8px 32px rgba(124,58,237,.35);transition:all .3s cubic-bezier(.4,0,.2,1)}
                #sh-translate-fab:hover{transform:translateY(-2px) scale(1.02);box-shadow:0 12px 40px rgba(124,58,237,.5)}
                #sh-translate-fab svg{width:18px;height:18px;fill:currentColor}
                #sh-translate-popup{position:fixed;bottom:80px;left:24px;z-index:10000;background:#fff;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.15),0 0 0 1px rgba(0,0,0,.05);padding:20px;width:280px;display:none;animation:shFadeUp .3s ease}
                #sh-translate-popup.active{display:block}
                #sh-translate-popup h4{font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.15em;color:#475569;margin:0 0 12px}
                #sh-translate-popup .sh-lang-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px;max-height:320px;overflow-y:auto}
                #sh-translate-popup .sh-lang-btn{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:10px 12px;font-size:11px;font-weight:700;color:#0f172a;cursor:pointer;text-align:left;transition:all .2s}
                #sh-translate-popup .sh-lang-btn:hover{background:#ede9fe;border-color:#c4b5fd;color:#7c3aed}
                #sh-translate-popup .sh-lang-btn.active{background:#7c3aed;border-color:#7c3aed;color:#fff}
                .goog-te-banner-frame{display:none!important}
                .skiptranslate{height:0!important;overflow:hidden!important;opacity:0!important}
                body{top:0!important}
                @keyframes shFadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
            `;
            document.head.appendChild(style);
        }

        const fab = document.createElement('button');
        fab.id = 'sh-translate-fab';
        fab.title = 'Translate this page';
        fab.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12.87 15.07l-2.54-2.51.03-.03A17.52 17.52 0 0014.07 6H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/></svg> Translate`;

        const popup = document.createElement('div');
        popup.id = 'sh-translate-popup';
        popup.innerHTML = `<h4>🌐 Select Language</h4><div class="sh-lang-grid">${languages.map(l => `<button class="sh-lang-btn" data-lang="${l.code}">${l.flag} ${l.name}</button>`).join('')}</div>`;

        document.body.appendChild(popup);
        document.body.appendChild(fab);

        // Bind language buttons via delegation
        popup.addEventListener('click', function(e) {
            const btn = e.target.closest('.sh-lang-btn');
            if (!btn) return;
            const langCode = btn.getAttribute('data-lang');
            popup.querySelectorAll('.sh-lang-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Set cookie directly for Google Translate
            document.cookie = "googtrans=/en/" + langCode + ";path=/";
            document.cookie = "googtrans=/en/" + langCode + ";path=/;domain=" + window.location.hostname;

            const doTranslate = () => {
                const select = document.querySelector('.goog-te-combo');
                if (select) {
                    select.value = langCode;
                    select.dispatchEvent(new Event('change'));
                    setTimeout(() => popup.classList.remove('active'), 300);
                    return true;
                }
                return false;
            };

            if (!doTranslate()) {
                let retries = 0;
                const interval = setInterval(() => {
                    if (doTranslate() || retries++ > 20) {
                        clearInterval(interval);
                        if (retries > 20) window.location.reload();
                    }
                }, 300);
            }
        });

        fab.addEventListener('click', e => { e.stopPropagation(); popup.classList.toggle('active'); });
        document.addEventListener('click', e => { if (!popup.contains(e.target) && e.target !== fab) popup.classList.remove('active'); });

        if (!window.googleTranslateElementInit) {
            window.googleTranslateElementInit = function() {
                new google.translate.TranslateElement({ pageLanguage: 'en', autoDisplay: false }, 'google_translate_element');
            };
            const gDiv = document.createElement('div');
            gDiv.id = 'google_translate_element';
            gDiv.style.cssText = 'position:absolute;left:-9999px;top:-9999px;';
            document.body.appendChild(gDiv);
            const gScript = document.createElement('script');
            gScript.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
            gScript.async = true;
            document.body.appendChild(gScript);
        }
    };
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(inject, 500));
    } else {
        setTimeout(inject, 500);
    }
})();

/* ─── MOBILE HAMBURGER NAV (for all pages loaded via script.js) ─── */
(function() {
    function injectMobileNav() {
        if (document.getElementById('sh-mobile-hamburger')) return;

        // Find the fixed nav bar (top nav used by most pages)
        const nav = document.querySelector('nav.fixed');
        if (!nav) return;

        const navContainer = nav.querySelector('.flex.justify-between') || nav.querySelector('[class*="justify-between"]');
        if (!navContainer) return;

        // Skip if already has a mobile toggle
        if (nav.querySelector('.mobile-toggle') || nav.querySelector('#sh-mobile-hamburger')) return;

        // Find logo block to prepend hamburger before it
        const logoBlock = navContainer.querySelector('#nav-logo-block') || navContainer.firstElementChild;
        if (!logoBlock) return;

        const burger = document.createElement('button');
        burger.id = 'sh-mobile-hamburger';
        burger.title = 'Menu';
        burger.setAttribute('aria-label', 'Open navigation menu');
        burger.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`;
        logoBlock.insertBefore(burger, logoBlock.firstChild);

        // Build nav links - detect current page to choose links
        const isAdmin = window.location.pathname.includes('admin') || window.location.pathname.includes('Admin');
        const navLinks = isAdmin ? `
            <a href="/AdminDashboard.html"><span class="sh-mob-icon">📊</span> Dashboard</a>
            <a href="/admin.html"><span class="sh-mob-icon">📁</span> Management</a>
            <a href="/admin_mobile_trace.html"><span class="sh-mob-icon">📱</span> Mobile Trace</a>
            <a href="/index.html"><span class="sh-mob-icon">🏠</span> Home</a>
            <a href="/calculators.html"><span class="sh-mob-icon">🧮</span> Tools</a>
            <a href="/GameLobby.html"><span class="sh-mob-icon">🎮</span> Games</a>
            <a href="/settings.html"><span class="sh-mob-icon">⚙️</span> Settings</a>
        ` : `
            <a href="/index.html"><span class="sh-mob-icon">🏠</span> Home</a>
            <a href="/calculators.html"><span class="sh-mob-icon">🧮</span> Tools</a>
            <a href="/GameLobby.html"><span class="sh-mob-icon">🎮</span> Games</a>
            <a href="/history.html"><span class="sh-mob-icon">📜</span> History</a>
            <a href="/about.html"><span class="sh-mob-icon">ℹ️</span> About</a>
            <a href="/settings.html"><span class="sh-mob-icon">⚙️</span> Settings</a>
        `;

        // Create mobile overlay
        const overlay = document.createElement('div');
        overlay.id = 'sh-mobile-overlay';
        overlay.innerHTML = `
            <div class="sh-mob-header">
                <span class="sh-mob-brand">SMART HUB</span>
                <button id="sh-mobile-close" aria-label="Close menu">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
            </div>
            <nav class="sh-mob-links">${navLinks}</nav>
        `;
        document.body.appendChild(overlay);

        // Inject mobile nav CSS only once
        if (!document.getElementById('_sh-mobile-nav-css')) {
            const style = document.createElement('style');
            style.id = '_sh-mobile-nav-css';
            style.textContent = `
                #sh-mobile-hamburger {
                    display: none; background: none; border: none; color: #334155;
                    cursor: pointer; padding: 8px; border-radius: 10px; transition: all 0.2s; flex-shrink: 0;
                }
                #sh-mobile-hamburger:hover { background: rgba(15,118,110,0.10); color: #0f766e; }
                @media (max-width: 768px) {
                    #sh-mobile-hamburger { display: flex; align-items: center; justify-content: center; }
                    nav.fixed { padding-left: 16px !important; padding-right: 16px !important; }
                    main { padding-left: 16px !important; padding-right: 16px !important; }
                    main h1 { font-size: 2rem !important; }
                    footer { padding-left: 16px !important; padding-right: 16px !important; }
                    footer .flex { flex-direction: column; gap: 8px; text-align: center; }
                }
                #sh-mobile-overlay {
                    position: fixed; inset: 0; z-index: 99999;
                    background: rgba(255,255,255,0.98); backdrop-filter: blur(30px);
                    -webkit-backdrop-filter: blur(30px);
                    display: none; flex-direction: column; padding: 24px;
                    animation: shSlideIn 0.3s ease;
                }
                #sh-mobile-overlay.active { display: flex; }
                @keyframes shSlideIn {
                    from { opacity: 0; transform: translateY(-20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .sh-mob-header {
                    display: flex; justify-content: space-between; align-items: center;
                    margin-bottom: 40px; padding-bottom: 20px; border-bottom: 1px solid #e2e8f0;
                }
                .sh-mob-brand {
                    font-size: 18px; font-weight: 900; letter-spacing: -0.02em;
                    background: linear-gradient(135deg, #0f766e, #f97316);
                    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
                }
                .sh-mob-header button {
                    background: #f1f5f9; border: none; border-radius: 12px;
                    padding: 10px; cursor: pointer; color: #475569; transition: all 0.2s;
                }
                .sh-mob-header button:hover { background: #e2e8f0; }
                .sh-mob-links { display: flex; flex-direction: column; gap: 4px; }
                .sh-mob-links a {
                    display: flex; align-items: center; gap: 16px;
                    padding: 16px 20px; border-radius: 16px; font-size: 16px; font-weight: 700;
                    color: #1e293b; text-decoration: none; transition: all 0.2s; letter-spacing: -0.01em;
                }
                .sh-mob-links a:hover { background: rgba(15,118,110,0.08); color: #0f766e; }
                .sh-mob-icon { font-size: 20px; }
                .dark #sh-mobile-overlay, .dark-mode #sh-mobile-overlay { background: rgba(15,23,42,0.98); }
                .dark .sh-mob-links a, .dark-mode .sh-mob-links a { color: #e2e8f0; }
                .dark .sh-mob-links a:hover, .dark-mode .sh-mob-links a:hover { background: rgba(15,118,110,0.15); color: #5eead4; }
                .dark .sh-mob-header, .dark-mode .sh-mob-header { border-color: rgba(255,255,255,0.1); }
                .dark .sh-mob-header button, .dark-mode .sh-mob-header button { background: rgba(255,255,255,0.05); color: #94a3b8; }
                .dark #sh-mobile-hamburger, .dark-mode #sh-mobile-hamburger { color: #e2e8f0; }
            `;
            document.head.appendChild(style);
        }

        // Event handlers
        burger.addEventListener('click', (e) => {
            e.stopPropagation();
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });

        document.getElementById('sh-mobile-close').addEventListener('click', () => {
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        });

        overlay.querySelectorAll('.sh-mob-links a').forEach(a => {
            a.addEventListener('click', () => {
                overlay.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
    }

    // Also handle AdminDashboard sidebar on mobile
    function handleAdminSidebar() {
        const sidebar = document.querySelector('aside.h-screen');
        if (!sidebar) return;

        // Add sidebar toggle CSS for mobile
        if (!document.getElementById('_sh-admin-sidebar-css')) {
            const style = document.createElement('style');
            style.id = '_sh-admin-sidebar-css';
            style.textContent = `
                @media (max-width: 768px) {
                    aside.h-screen {
                        position: fixed; left: -280px; transition: left 0.3s ease; z-index: 99998;
                        box-shadow: 10px 0 40px rgba(0,0,0,0.1);
                    }
                    aside.h-screen.sh-sidebar-open { left: 0; }
                    .sh-sidebar-backdrop {
                        position: fixed; inset: 0; background: rgba(0,0,0,0.3);
                        z-index: 99997; display: none;
                    }
                    .sh-sidebar-backdrop.active { display: block; }
                    main.flex-1 { margin-left: 0 !important; }
                    header.sticky { padding-left: 16px !important; padding-right: 16px !important; }
                    .sh-admin-burger {
                        display: flex !important; align-items: center; justify-content: center;
                        background: none; border: none; color: #334155; cursor: pointer;
                        padding: 8px; border-radius: 10px; margin-right: 8px;
                    }
                }
                @media (min-width: 769px) {
                    .sh-admin-burger { display: none !important; }
                    .sh-sidebar-backdrop { display: none !important; }
                }
            `;
            document.head.appendChild(style);
        }

        // Add burger to admin header
        const adminHeader = document.querySelector('header.sticky');
        if (adminHeader && !adminHeader.querySelector('.sh-admin-burger')) {
            const adminBurger = document.createElement('button');
            adminBurger.className = 'sh-admin-burger';
            adminBurger.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`;
            adminHeader.insertBefore(adminBurger, adminHeader.firstChild);

            // Backdrop
            const backdrop = document.createElement('div');
            backdrop.className = 'sh-sidebar-backdrop';
            document.body.appendChild(backdrop);

            adminBurger.addEventListener('click', () => {
                sidebar.classList.toggle('sh-sidebar-open');
                backdrop.classList.toggle('active');
            });
            backdrop.addEventListener('click', () => {
                sidebar.classList.remove('sh-sidebar-open');
                backdrop.classList.remove('active');
            });
            // Close sidebar when links are clicked
            sidebar.querySelectorAll('a').forEach(a => {
                a.addEventListener('click', () => {
                    sidebar.classList.remove('sh-sidebar-open');
                    backdrop.classList.remove('active');
                });
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => { injectMobileNav(); handleAdminSidebar(); });
    } else {
        injectMobileNav();
        handleAdminSidebar();
    }
})();

/* ─── ICON PROTECTION FROM TRANSLATE ─── */
(function() {
    function protectIcons() {
        document.querySelectorAll('.material-symbols-outlined, .material-icons, [class*="material-symbols"]').forEach(el => {
            el.classList.add('notranslate'); el.setAttribute('translate', 'no');
        });
        document.querySelectorAll('[class*="fa-"], .fas, .far, .fab, .fal, .fad').forEach(el => {
            el.classList.add('notranslate'); el.setAttribute('translate', 'no');
        });
        document.querySelectorAll('code, pre, .font-mono').forEach(el => {
            el.classList.add('notranslate'); el.setAttribute('translate', 'no');
        });
        const fab = document.getElementById('sh-translate-fab');
        if (fab) { fab.classList.add('notranslate'); fab.setAttribute('translate', 'no'); }
        const popup = document.getElementById('sh-translate-popup');
        if (popup) { popup.classList.add('notranslate'); popup.setAttribute('translate', 'no'); }
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', protectIcons);
    } else {
        protectIcons();
    }
    // Also observe for dynamic elements
    const obs = new MutationObserver(protectIcons);
    const startObs = () => { obs.observe(document.body, { childList: true, subtree: true }); setTimeout(() => obs.disconnect(), 10000); };
    if (document.body) startObs(); else document.addEventListener('DOMContentLoaded', startObs);
})();

