// SaaS Client UI - Billing/Upgrade Modal
const SaaS_UI = {
    userTier: null,
    usage: null,
    limits: null,

    async init() {
        try {
            const res = await fetch('/api/saas/status', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await res.json();
            this.userTier = data.tier;
            this.usage = data.usage;
            this.limits = data.limits[data.tier];

            this.renderTierBadge();
            this.renderUsageStats();
            this.attachUpgradeListeners();
        } catch (err) {
            console.error('SaaS init failed:', err);
        }
    },

    renderTierBadge() {
        const badge = document.getElementById('tier-badge') || 
                     document.querySelector('.user-tier-badge');
        if (badge) {
            badge.textContent = this.userTier.toUpperCase();
            badge.className = `tier-badge tier-${this.userTier}`;
        }
    },

    renderUsageStats() {
        const statsEl = document.getElementById('usage-stats');
        if (statsEl && this.usage) {
            statsEl.innerHTML = `
                <div>Tools: ${this.usage.tools}/${this.limits?.tools || '∞'}</div>
                <div>Games: ${this.usage.games}/${this.limits?.games || '∞'}</div>
            `;
        }
    },

    async upgrade(plan) {
        try {
            const res = await fetch('/api/saas/upgrade', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ plan })
            });
            const data = await res.json();
            if (data.success) {
                window.location.reload(); // Refresh tier
                showToast('Upgrade successful! 🎉');
            } else {
                window.open(data.checkoutUrl, '_blank');
            }
        } catch (err) {
            showToast('Upgrade failed', 'error');
        }
    },

    attachUpgradeListeners() {
        document.querySelectorAll('[data-upgrade]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const plan = e.target.dataset.upgrade;
                this.showUpgradeModal(plan);
            });
        });
    },

    showUpgradeModal(plan) {
        const modalHTML = `
            <div class="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
                <div class="bg-white/90 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
                    <h3 class="text-2xl font-bold mb-6 text-center">Upgrade to ${plan.toUpperCase()}</h3>
                    <div class="space-y-4 mb-8">
                        <div>✅ Unlimited ${plan === 'pro' ? 'tools & games' : 'everything'}</div>
                        <div>✅ No ads</div>
                        ${plan === 'premium' ? '<div>✅ Advanced analytics & exports</div>' : ''}
                        <div class="text-sm text-gray-500">$${plan === 'pro' ? '9' : '19'}/mo (billed yearly)</div>
                    </div>
                    <div class="flex gap-3">
                        <button onclick="SaaS_UI.upgrade('${plan}')" class="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 text-white py-3 px-6 rounded-xl font-bold hover:from-emerald-600 hover:to-green-700 transition-all">
                            Upgrade Now
                        </button>
                        <button onclick="this.closest('.fixed').remove()" class="flex-1 bg-gray-200 py-3 px-6 rounded-xl font-bold hover:bg-gray-300 transition-all">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
};

// Auto-init on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => SaaS_UI.init());
} else {
    SaaS_UI.init();
}

