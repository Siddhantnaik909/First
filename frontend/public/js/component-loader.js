/**
 * Smart Hub - Component Loader
 * Loads navbar and footer components into placeholders
 */

(function() {
    'use strict';

    // Screenshot Mode Detection
    // Add 'screenshot-mode' class to html element when screenshot tools are detected
    (function detectScreenshotMode() {
        const urlParams = new URLSearchParams(window.location.search);
        const isScreenshotMode = urlParams.has('screenshot') || 
                                  urlParams.has('screenshot-mode') ||
                                  window.location.hash === '#screenshot';
        
        // Check for common screenshot tool user agents or query params
        const isScreenshotTool = /screenshot|capture|puppeteer|playwright|selenium/i.test(
            navigator.userAgent + ' ' + window.location.href
        );
        
        if (isScreenshotMode || isScreenshotTool) {
            document.documentElement.classList.add('screenshot-mode');
            // [Screenshot Mode] Enabled - fixed elements converted to static
        }
        
        // Also enable via console: window.enableScreenshotMode()
        window.enableScreenshotMode = function() {
            document.documentElement.classList.add('screenshot-mode');
            // [Screenshot Mode] Manually enabled
            return 'Screenshot mode enabled. All fixed elements are now static.';
        };
        
        window.disableScreenshotMode = function() {
            document.documentElement.classList.remove('screenshot-mode');
            // [Screenshot Mode] Disabled
            return 'Screenshot mode disabled.';
        };
    })();

    // Calculate a relative path back to frontend/public from the current page.
    function getBasePath() {
        const path = window.location.pathname.replace(/\\/g, '/');
        const publicIndex = path.lastIndexOf('/frontend/public/');
        const publicRelativePath = publicIndex >= 0
            ? path.slice(publicIndex + '/frontend/public/'.length)
            : path.replace(/^\/+/, '');
        const segments = publicRelativePath.split('/').filter(Boolean);
        const depth = Math.max(segments.length - 1, 0);

        return depth ? '../'.repeat(depth) : './';
    }

    function normalizeComponentPath(filePath) {
        return `/${String(filePath || '').replace(/^\/+/, '')}`;
    }

    function getComponentCandidates(filePath) {
        const absolutePath = normalizeComponentPath(filePath);
        const relativePath = getBasePath() + absolutePath.slice(1);

        return [...new Set([absolutePath, relativePath])];
    }

    // Absolute paths (starting with /) are served correctly by Express — do NOT rewrite them.
    // Only fix truly relative paths (./something) that exist in component HTML.
    function adjustPaths(container, basePath) {
        // Leave absolute links alone — the server handles /path correctly from any depth
        const relativeElements = container.querySelectorAll('a[href^="./"], img[src^="./"], script[src^="./"], link[href^="./"]');
        relativeElements.forEach(el => {
            const attr = el.hasAttribute('href') ? 'href' : 'src';
            const val = el.getAttribute(attr);
            if (val && val.startsWith('./')) {
                el.setAttribute(attr, basePath + val.substring(2));
            }
        });
    }


    function runPostLoadTasks() {
        const yearSpan = document.getElementById('current-year');
        if (yearSpan) yearSpan.textContent = new Date().getFullYear();
    }

    window.toggleMobileMenu = window.toggleMobileMenu || function toggleMobileMenu() {
        const menu = document.getElementById('mobile-menu');
        if (!menu) return;

        menu.classList.toggle('hidden');
        document.body.style.overflow = menu.classList.contains('hidden') ? '' : 'hidden';
    };

    // Load a component into a placeholder
    async function loadComponent(placeholderId, filePath) {
        const placeholder = document.getElementById(placeholderId);
        if (!placeholder) {
            console.warn(`[Component Loader] Placeholder #${placeholderId} not found`);
            return;
        }

        const candidates = getComponentCandidates(filePath);
        let loadedPath = candidates[0];

        try {
            let response = null;
            let lastError = null;

            for (const candidate of candidates) {
                try {
                    response = await fetch(candidate, {
                        cache: 'default',
                        headers: { 'Accept': 'text/html' }
                    });

                    if (response.ok) {
                        loadedPath = candidate;
                        break;
                    }

                    lastError = new Error(`HTTP ${response.status}`);
                } catch (error) {
                    lastError = error;
                }
            }

            if (!response || !response.ok) {
                throw lastError || new Error('Component request failed');
            }

            const html = await response.text();
            
            // Create temporary container to parse HTML
            const temp = document.createElement('div');
            temp.innerHTML = html;
            
            const basePath = getBasePath();
            adjustPaths(temp, basePath);



            // Move all children from temp to fragment
            const fragment = document.createDocumentFragment();
            while (temp.firstChild) {
                fragment.appendChild(temp.firstChild);
            }
            
            // Replace placeholder with content
            placeholder.replaceWith(fragment);
            runPostLoadTasks();
            console.log(`[Component Loader] Loaded ${loadedPath} into #${placeholderId}`);
            
        } catch (error) {
            console.error(`[Component Loader] Failed to load ${candidates.join(' or ')}:`, error.message);
            
            // Show fallback content or remove placeholder
            if (placeholderId === 'footer-placeholder') {
                placeholder.innerHTML = `
                    <footer class="w-full py-8 border-t border-slate-800 bg-slate-900">
                        <div class="max-w-[1440px] mx-auto px-4 text-center text-sm text-slate-400">
                            &copy; ${new Date().getFullYear()} Smart Hub. All rights reserved.
                        </div>
                    </footer>
                `;
            } else if (placeholderId === 'header-placeholder') {
                // Show minimal navbar fallback
                placeholder.innerHTML = `
                    <nav class="w-full h-16 bg-slate-900 border-b border-white/5 flex items-center px-4">
                        <div class="max-w-[1440px] mx-auto w-full flex items-center justify-between">
                            <a href="/" class="font-black text-lg text-white uppercase tracking-tighter">SMART HUB</a>
                            <div class="flex gap-4">
                                <a href="/login.html" class="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-[#c96f32]">Login</a>
                                <a href="/signup.html" class="px-4 py-2 text-sm font-semibold bg-[#c96f32] text-white rounded-lg hover:bg-[#c96f32]/90">Sign Up</a>
                            </div>
                        </div>
                    </nav>
                `;
            }
        }
    }

    function getStoredUser() {
        try {
            return JSON.parse(localStorage.getItem('smart_hub_user') || localStorage.getItem('user') || '{}') || {};
        } catch {
            return {};
        }
    }

    function escapeHTML(value) {
        return String(value || '').replace(/[&<>'"]/g, (char) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[char]));
    }

    function refreshNavbarAuthWhenReady() {
        if (typeof AuthSystem !== 'undefined' && typeof AuthSystem.syncUI === 'function') {
            AuthSystem.syncUI();
        }

        // [updateUserInterface] now handled exclusively by script.js
        if (typeof window.updateUserInterface === 'function') {
            window.updateUserInterface();
            // Retrying ensures it catches the DOM if injected asynchronously
            [100, 500, 1000].forEach(delay => window.setTimeout(window.updateUserInterface, delay));
        }
    }

    window.loadComponent = loadComponent;

    // Initialize when DOM is ready
    function init() {
        // Safety check - continue even if header-placeholder is missing
        const headerPlaceholder = document.getElementById("header-placeholder");
        const footerPlaceholder = document.getElementById("footer-placeholder");
        
        if (!headerPlaceholder && !footerPlaceholder) {
            console.warn('[Component Loader] No placeholders found on this page');
            return;
        }

        // Load components in parallel
        const promises = [];
        if (headerPlaceholder) {
            promises.push(loadComponent('header-placeholder', '/components/unified-navbar.html'));
        }
        if (footerPlaceholder) {
            promises.push(loadComponent('footer-placeholder', '/components/footer.html'));
        }
        
        Promise.all(promises).then(() => {
            // Dispatch event when components are loaded
            document.dispatchEvent(new CustomEvent('componentsLoaded', { 
                detail: { timestamp: Date.now() }
            }));
            refreshNavbarAuthWhenReady();
        }).catch(err => {
            console.error('[Component Loader] Error loading components:', err);
            // Still dispatch event even if loading failed
            document.dispatchEvent(new CustomEvent('componentsLoaded', { 
                detail: { timestamp: Date.now(), failed: true }
            }));
        });
    }

    // Run initialization
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
