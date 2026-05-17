document.addEventListener('DOMContentLoaded', () => {
    // Select top nav search, sidebar search, and the dedicated calculators page search box
    const searchInputs = document.querySelectorAll('.search-bar input, .search-box input, #toolSearch');
    
    const performSearch = (term) => {
        const lowerTerm = term.toLowerCase().trim();
        
        // 1. Filter Sidebar Menu Items
        const sideLinks = document.querySelectorAll('.side-menu a:not(.dropdown-toggle)');
        sideLinks.forEach(link => {
            const text = link.innerText.toLowerCase();
            if (text.includes(lowerTerm)) {
                link.style.display = 'flex'; // Restore default sidebar display
                // Auto-expand parent dropdown if matched inside a nested list
                const parentDropdown = link.closest('.dropdown-content');
                if (parentDropdown) parentDropdown.style.display = 'block';
            } else {
                link.style.display = 'none';
            }
        });

        // 2. Filter Main Content Cards (Tools, Categories, Calculators)
        const cards = document.querySelectorAll('.cat-card, .calc-card, .stat-card');
        cards.forEach(card => {
            const text = card.innerText.toLowerCase();
            // Revert to original display logic if it matches
            card.style.display = text.includes(lowerTerm) ? '' : 'none'; 
        });
    };

    searchInputs.forEach(input => {
        input.addEventListener('input', (e) => performSearch(e.target.value));
    });

    // 3. Auto-trigger search if ?search=term is in the URL (Used when header search redirects to calculators.html)
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get('search');
    if (searchParam) {
        searchInputs.forEach(input => input.value = searchParam);
        setTimeout(() => performSearch(searchParam), 150); // Small delay allows dynamically loaded components to appear
    }
});