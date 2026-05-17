console.log("Loaded: modal.js");

// This function injects the modal's HTML structure into the page if it doesn't exist.
function injectModalHTML() {
    if (document.getElementById('custom-modal-backdrop')) return;

    const modalHTML = `
    <div id="custom-modal-backdrop" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] hidden flex items-center justify-center transition-opacity duration-300 opacity-0">
        <div id="custom-modal-box" class="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 p-8 transform scale-95 transition-transform duration-300">
            <div class="flex items-center gap-4 mb-4">
                <div id="custom-modal-icon" class="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black"></div>
                <h3 id="custom-modal-title" class="text-xl font-black tracking-tight text-slate-900"></h3>
            </div>
            <p id="custom-modal-message" class="text-slate-500 text-sm font-medium mb-6 leading-relaxed"></p>
            
            <div id="custom-modal-prompt-container" class="hidden mb-6">
                <input type="text" id="custom-modal-input" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-primary outline-none transition-all font-medium text-sm">
            </div>

            <div class="flex justify-end gap-3" id="custom-modal-actions">
                <button id="custom-modal-cancel" class="hidden px-5 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-all text-sm">Cancel</button>
                <button id="custom-modal-confirm" class="px-5 py-2.5 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/30 hover:bg-indigo-600 transition-all text-sm">Confirm</button>
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// This is the core promise-based function that handles modal display and user interaction.
export function showModal({ title, message, type = 'info', isPrompt = false, isConfirm = false, defaultValue = '' }) {
    injectModalHTML(); // Ensure the modal is in the DOM

    const modalBackdrop = document.getElementById('custom-modal-backdrop');
    const modalBox = document.getElementById('custom-modal-box');
    const modalIcon = document.getElementById('custom-modal-icon');
    const modalTitle = document.getElementById('custom-modal-title');
    const modalMessage = document.getElementById('custom-modal-message');
    const modalInputContainer = document.getElementById('custom-modal-prompt-container');
    const modalInput = document.getElementById('custom-modal-input');
    const btnCancel = document.getElementById('custom-modal-cancel');
    const btnConfirm = document.getElementById('custom-modal-confirm');

    return new Promise((resolve) => {
        modalTitle.innerText = title;
        modalMessage.innerText = message;

        modalIcon.className = 'w-12 h-12 rounded-2xl flex items-center justify-center text-2xl';
        let iconHTML = '';
        if (type === 'error') {
            modalIcon.classList.add('bg-rose-100', 'text-rose-600');
            iconHTML = '<span class="material-symbols-outlined">error</span>';
            btnConfirm.className = "px-5 py-2.5 bg-rose-600 text-white font-bold rounded-xl shadow-lg shadow-rose-600/30 hover:bg-rose-700 transition-all text-sm";
        } else if (type === 'warning') {
            modalIcon.classList.add('bg-amber-100', 'text-amber-600');
            iconHTML = '<span class="material-symbols-outlined">warning</span>';
            btnConfirm.className = "px-5 py-2.5 bg-amber-500 text-white font-bold rounded-xl shadow-lg shadow-amber-500/30 hover:bg-amber-600 transition-all text-sm";
        } else if (type === 'success') {
            modalIcon.classList.add('bg-emerald-100', 'text-emerald-600');
            iconHTML = '<span class="material-symbols-outlined">check_circle</span>';
            btnConfirm.className = "px-5 py-2.5 bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 transition-all text-sm";
        } else { // info
            modalIcon.classList.add('bg-indigo-100', 'text-indigo-600');
            iconHTML = '<span class="material-symbols-outlined">info</span>';
            btnConfirm.className = "px-5 py-2.5 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/30 hover:bg-indigo-600 transition-all text-sm";
        }
        modalIcon.innerHTML = iconHTML;

        modalInputContainer.classList.toggle('hidden', !isPrompt);
        btnCancel.classList.toggle('hidden', !isPrompt && !isConfirm);

        if (isPrompt) {
            modalInput.value = defaultValue;
            setTimeout(() => modalInput.focus(), 100);
        }

        modalBackdrop.classList.remove('hidden');
        requestAnimationFrame(() => {
            modalBackdrop.classList.replace('opacity-0', 'opacity-100');
            modalBox.classList.replace('scale-95', 'scale-100');
        });

        const close = (val) => {
            modalBackdrop.classList.replace('opacity-100', 'opacity-0');
            modalBox.classList.replace('scale-100', 'scale-95');
            setTimeout(() => modalBackdrop.classList.add('hidden'), 300);
            // Clean up listeners to prevent memory leaks
            btnConfirm.onclick = null;
            btnCancel.onclick = null;
            modalInput.onkeydown = null;
            resolve(val);
        };

        btnConfirm.onclick = () => close(isPrompt ? modalInput.value : true);
        btnCancel.onclick = () => close(isPrompt ? null : false);
        modalInput.onkeydown = (e) => { if (e.key === 'Enter') btnConfirm.click(); };
    });
}
