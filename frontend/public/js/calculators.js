/**
 * SMART HUB | Global Calculator Utility Engine
 * Handles Validation, History, and UI Reset
 */

let lastCalculationData = null;

document.addEventListener('DOMContentLoaded', () => {
    // 1. Generic Save Button Handler
    const saveBtns = document.querySelectorAll('.btn-save');
    saveBtns.forEach(btn => {
        // Prevent double binding if script runs twice
        btn.removeEventListener('click', handleSaveClick);
        btn.addEventListener('click', handleSaveClick);
    });

    // 2. Generic Clear Button Handler
    const clearBtns = document.querySelectorAll('[id^="clear-"], #reset-btn');
    clearBtns.forEach(btn => {
        btn.addEventListener('click', () => clearCalculator());
    });

    // 3. Initialize Favorite/Pin Button globally on all tools
    initFavoriteButton();

    // 4. Load recent history to the UI if a display area exists
    loadCalculationHistory();
});

// Helper to handle context-aware saving
function handleSaveClick(e) {
    const toolName = document.querySelector('h2')?.innerText || document.title.split('|')[1]?.trim() || "General Tool";
    saveCalculation(toolName);
}

/**
 * Reset all inputs and hide result cards
 */
function clearCalculator() {
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
        if (input.tagName === 'SELECT') {
            input.selectedIndex = 0;
        } else {
            // This correctly resets text/number/date inputs to their default
            // value specified in HTML, or clears them if no default is set.
            input.value = input.defaultValue;
        }
        input.classList.remove('input-error');
    });

    lastCalculationData = null;

    const results = document.getElementById('results');
    if (results) {
        results.style.display = 'none';
        results.classList.add('hidden');
    }

    // Also clear the content of the main result list for a cleaner state
    const resultDisplayArea = document.getElementById('result-display-area');
    if (resultDisplayArea) {
        resultDisplayArea.innerHTML = '';
    }

    // Toggle save buttons off until next calculation
    document.querySelectorAll('.btn-save').forEach(btn => btn.disabled = true);
    console.log("Calculator cleared.");
}

/**
 * Standardized Input Validation
 * @param {NodeList} inputs - List of input elements to check
 * @returns {Boolean}
 */
function validateInputs(inputs, options = { checkPositive: false }) {
    let isValid = true;
    inputs.forEach(input => {
        let hasError = false;

        // Handle date inputs separately
        if (input.type === 'date') {
            if (input.value.trim() === '') {
                hasError = true;
            }
        } else if (input.type === 'number' || input.inputMode === 'numeric') { // Handle numeric inputs
            const value = parseFloat(input.value);
            if (input.value.trim() === '' || isNaN(value)) {
                hasError = true;
    } else if (options.checkPositive && value <= 0) {
                hasError = true;
            }
        } else { // Handle general text/string inputs
            if (input.value.trim() === '') {
                hasError = true;
            }
        }

        if (hasError) {
            input.classList.add('input-error');
            input.style.animation = 'shake 0.5s ease-in-out';
            isValid = false;
        } else {
            input.classList.remove('input-error');
            input.style.animation = '';
        }
    });

    if (!isValid) {
        // Shake effect CSS injection
        if (!document.getElementById('input-shake-css')) {
            const style = document.createElement('style');
            style.id = 'input-shake-css';
            style.textContent = ['@keyframes shake {','  0%, 100% { transform: translateX(0); }','  10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }','  20%, 40%, 60%, 80% { transform: translateX(5px); }','}','.input-error {','  border-color: #ef4444 !important;','  background-color: #fef2f2 !important;','  box-shadow: 0 0 0 3px rgba(239,68,68,0.1) !important;','}'].join('\\n');
            document.head.appendChild(style);
        }
        // Haptic feedback or shake effect
        const firstError = inputs.find(i => i.classList.contains('input-error'));
        if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        showAlert("Please fill all fields with valid, positive numbers.", 'error');
    }
    return isValid;
}

/**
 * Saves calculation to LocalStorage History
 */
async function saveCalculation(toolName, inputDetails, outputDetails) {
    let data = null;

    // If specific arguments are passed, use them. Otherwise, grab the global state.
    if (toolName && inputDetails && outputDetails) {
        data = {
            name: toolName,
            details: `${inputDetails} ➔ ${outputDetails}`,
            inputs: [{ label: 'Details', val: inputDetails }],
            results: [{ label: 'Result', val: outputDetails, highlight: true }],
            date: new Date().toLocaleString(),
            timestamp: Date.now()
        };
    } else if (lastCalculationData) {
        data = lastCalculationData;
    } else {
        // Universal Adapter for legacy calculators without setLastCalc
        const inputEls = Array.from(document.querySelectorAll('input:not([type="hidden"]), select'))
            .filter(i => i.value !== '');

        const inputsArr = inputEls.map(i => {
            // Try to find a meaningful label
            let labelText = 'Value';
            const prev = i.previousElementSibling;
            if (prev && prev.tagName === 'SPAN') labelText = prev.innerText;
            else if (prev && prev.tagName === 'LABEL') labelText = prev.innerText;
            else if (i.placeholder) labelText = i.placeholder;
            else if (i.id) labelText = i.id;

            // Clean up label text
            labelText = labelText.replace(/[:]/g, '').trim();
            return { label: labelText.substring(0, 30), val: i.value };
        });

        const gatheredInputs = inputEls.map(i => i.value).join(', ');

        const possibleResultBox = document.querySelector('#results:not(.hidden), #display, .result-display');
        let gatheredOutput = possibleResultBox ? (possibleResultBox.innerText || possibleResultBox.value || '') : "Calculation Registered";

        // Clean up output text (remove button texts and weird whitespace)
        gatheredOutput = gatheredOutput.replace(/Save Result|Saved!|Save to History|Clear|Calculate/gi, '').trim().replace(/\s+/g, ' ');
        if (!gatheredOutput) gatheredOutput = "Success";

        data = {
            name: toolName || document.title.split('|')[1]?.trim() || "General Tool",
            details: gatheredInputs ? `${gatheredInputs.substring(0, 40)} ➔ ${gatheredOutput.substring(0, 40)}...` : `Action: ${gatheredOutput.substring(0, 40)}`,
            inputs: inputsArr.length ? inputsArr : [{ label: "Action", val: "Calculation Performed" }],
            results: [{ label: "Output Summary", val: gatheredOutput.substring(0, 150), highlight: true }],
            date: new Date().toLocaleString(),
            timestamp: Date.now()
        };
    }

    if (!data) {
        showAlert("Calculate something first before saving!", 'warning');
        if (typeof window.showGlobalToast === 'function') {
            window.showGlobalToast("Calculate something first before saving!", 'warning');
        }
        return;
    }

    try {
        const history = JSON.parse(localStorage.getItem('calc_history') || '[]');

        // Add to start of array
        history.unshift(data);

        // Caps history at 50 items to prevent storage bloat
        if (history.length > 50) history.pop();

        localStorage.setItem('calc_history', JSON.stringify(history));

        // Update "Last Active" on Dashboard if available
        localStorage.setItem('last_active_time', new Date().toLocaleTimeString());

        // Sync with backend API (as mentioned in README)
        const token = localStorage.getItem('token');
        if (token) {
            fetch('/api/history/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            }).catch(err => console.error("SMART HUB Sync Error:", err));
        }

        // Visual Feedback
        const saveBtn = document.querySelector('.btn-save');
        if (saveBtn) {
            const originalText = saveBtn.innerHTML;
            saveBtn.innerHTML = '<i class="fa-solid fa-check"></i> SAVED';
            saveBtn.classList.add('!bg-emerald-500', '!text-white', '!border-emerald-500');
            setTimeout(() => {
                saveBtn.innerHTML = originalText;
                saveBtn.classList.remove('!bg-emerald-500', '!text-white', '!border-emerald-500');
            }, 2000);
        }
    } catch (e) {
        console.error("SMART HUB Storage Error:", e);
    }
}

/**
 * Loads local calculation history into the display area on page load
 */
function loadCalculationHistory() {
    const resultDisplayArea = document.getElementById('result-display-area');
    if (!resultDisplayArea) return; // Only run if the page has a history list container

    try {
        const history = JSON.parse(localStorage.getItem('calc_history') || '[]');
        if (history.length === 0) return;

        // Filter history for the current tool to display context-relevant results
        const toolName = document.querySelector('h2')?.innerText || document.title.split('|')[1]?.trim();
        const relevantHistory = history.filter(item => item.name === toolName).slice(0, 5);

        relevantHistory.forEach(item => {
            const historyEl = document.createElement('div');
            historyEl.className = 'history-item p-3 mb-2 bg-gray-100 dark:bg-gray-800 rounded shadow-sm';
            historyEl.innerHTML = `<div class="text-xs text-gray-500">${item.date}</div><div class="font-medium">${item.details}</div>`;
            resultDisplayArea.appendChild(historyEl);
        });
    } catch (e) {
        console.error("Error loading calculation history:", e);
    }
}

// Attach to window so individual calculator scripts can update state
window.setLastCalc = (name, inputs, results) => {
    // inputs and results can be:
    // 1. Arrays of {label: string, val: string}
    // 2. Simple strings (for backward compatibility)
    const inputItems = Array.isArray(inputs) ? inputs : [{ label: "Parameters", val: String(inputs) }];
    
    let resultItems;
    if (Array.isArray(results)) {
        resultItems = results;
        if (resultItems.length > 0 && !resultItems.some(r => r.highlight)) {
            resultItems[0].highlight = true; // Ensure at least one is highlighted
        }
    } else {
        resultItems = [{ label: "Result", val: String(results), highlight: true }];
    }

    const inputStr = inputItems.map(i => i.val).join(', ');
    const outputStr = resultItems.map(r => r.val).join('; ');

    lastCalculationData = {
        name: name,
        details: `${inputStr.substring(0, 40)} ➔ ${outputStr.substring(0, 40)}`,
        inputs: inputItems,
        results: resultItems,
        date: new Date().toLocaleString(),
        timestamp: Date.now()
    };
    // Enable save buttons once data exists
    document.querySelectorAll('.btn-save').forEach(btn => btn.disabled = false);

    // Auto-reveal results container if hidden
    const resultsContainer = document.getElementById('results');
    if (resultsContainer && resultsContainer.classList.contains('hidden')) {
        resultsContainer.classList.remove('hidden');
        resultsContainer.style.display = 'block';
    }
};

// --- Favorites / Pinning Logic ---
function initFavoriteButton() {
    // Only run on calculator/game/tool pages
    if (!window.location.pathname.includes('/calculators/')) return;

    // Find the main header element to inject the button next to
    const container = document.querySelector('.page-body h1, .page-body h2, .header h2, .calculator-header h2');
    if (!container) return;

    // Ensure we don't duplicate it
    if (document.getElementById('favorite-toggle-btn')) return;

    const currentPath = window.location.pathname;
    let favorites = [];
    try {
        favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    } catch (e) {
        console.error("Failed to parse favorites", e);
    }
    const isFav = favorites.includes(currentPath);

    const btn = document.createElement('button');
    btn.id = 'favorite-toggle-btn';
    btn.className = `fav-btn ${isFav ? 'active' : ''}`;
    btn.innerHTML = `<i class="${isFav ? 'fa-solid' : 'fa-regular'} fa-star"></i>`;
    btn.title = isFav ? "Unpin from Dashboard" : "Pin to Dashboard";
    btn.style.color = isFav ? '#f59e0b' : 'var(--text-muted)';

    btn.addEventListener('click', (e) => {
        e.preventDefault();
        try {
            favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        } catch (err) {
            favorites = [];
        }
        const idx = favorites.indexOf(currentPath);
        
        if (idx > -1) {
            // Remove from Favorites
            favorites.splice(idx, 1);
            btn.innerHTML = `<i class="fa-regular fa-star"></i>`;
            btn.style.color = 'var(--text-muted)';
            btn.title = "Pin to Dashboard";
            showMiniToast("Removed from Pinned Tools");
        } else {
            // Add to Favorites
            favorites.push(currentPath);
            btn.innerHTML = `<i class="fa-solid fa-star"></i>`;
            btn.style.color = '#f59e0b';
            btn.title = "Unpin from Dashboard";
            showMiniToast("Pinned to Dashboard!");
        }
        localStorage.setItem('favorites', JSON.stringify(favorites));
    });

    // Append the star to the header seamlessly
    container.appendChild(btn);
}

function showMiniToast(msg) {
    // If your global toast script exists, use it
    if (typeof window.showGlobalToast === 'function') {
        window.showGlobalToast(msg, "info");
        return;
    }
    
    // Otherwise, utilize a fallback mini toast
    let toast = document.getElementById('mini-fav-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'mini-fav-toast';
        toast.style.cssText = 'position:fixed; bottom:30px; left:50%; transform:translateX(-50%); background:#333; color:#fff; padding:10px 20px; border-radius:8px; z-index:10000; transition:opacity 0.3s; opacity:0; pointer-events:none; box-shadow: 0 4px 12px rgba(0,0,0,0.15); font-family: "Plus Jakarta Sans", sans-serif; font-weight: 600; font-size: 0.9rem;';
        document.body.appendChild(toast);
    }
    toast.innerHTML = `<i class="fa-solid fa-star" style="color:#f59e0b; margin-right:8px;"></i> ${msg}`;
    toast.style.opacity = '1';
    setTimeout(() => { toast.style.opacity = '0'; }, 2500);
}
