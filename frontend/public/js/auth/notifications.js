console.log("Loaded: notifications.js");

// Global Notification Loader
export async function loadNotifications(silentMode = false, containerId = 'notif-list-container', badgeId = 'notif-badge') {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch(`${window.API_URL}/auth/notifications`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) return;
        const notifs = await res.json();
        
        const badge = document.getElementById(badgeId);
        const container = document.getElementById(containerId);
        
        if (badge) {
            badge.classList.toggle('hidden', notifs.length === 0);
        }

        if (silentMode || !container) return; // Stop if just updating badge or no container

        if (notifs.length === 0) {
            container.innerHTML = `
                <div class="py-8 text-center">
                    <span class="material-symbols-outlined text-4xl text-slate-700 mb-2 block">notifications_off</span>
                    <p class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">No new notifications</p>
                </div>`;
            return;
        }

        container.innerHTML = notifs.map(n => `
            <div class="flex gap-4 p-4 ${n.read ? 'bg-slate-800/50 opacity-70' : 'bg-indigo-600/10 border-l-2 border-indigo-500'} rounded-xl transition-all">
                <div class="w-10 h-10 ${n.read ? 'bg-slate-800 text-slate-500' : 'bg-indigo-600 text-white'} rounded-full flex items-center justify-center flex-shrink-0">
                    <span class="material-symbols-outlined text-sm">${n.icon || 'campaign'}</span>
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-xs font-bold ${n.read ? 'text-slate-300' : 'text-white'} leading-tight">${escapeHTML(n.title)}</p>
                    <p class="text-[10px] ${n.read ? 'text-slate-500' : 'text-slate-300'} mt-1 truncate" style="white-space: normal; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">${escapeHTML(n.body)}</p>
                    <p class="text-[8px] ${n.read ? 'text-slate-600' : 'text-indigo-300'} uppercase font-bold tracking-widest mt-2">${new Date(n.timestamp).toLocaleString([],{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</p>
                </div>
            </div>
        `).join('');
    } catch (e) {
        console.error('Failed to load notifications:', e);
    }
}
