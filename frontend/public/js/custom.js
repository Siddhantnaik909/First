document.addEventListener('DOMContentLoaded', () => {
    console.log('Dashboard Custom JS loaded');

    // Update Date Display
    const dateDisplay = document.getElementById('date-display');
    if (dateDisplay) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const today = new Date();
        dateDisplay.textContent = today.toLocaleDateString('en-US', options);
    }

    // Additional dashboard logic can go here
});