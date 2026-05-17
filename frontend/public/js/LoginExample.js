/**
 * LOGIN EXAMPLE (Vanilla JS)
 * This shows how to use the AuthSystem to login a user.
 */

function handleLogin() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Simulate API call
    if (email && password) {
        const user = {
            name: "John Doe",
            email: email,
            role: email.includes('admin') ? 'admin' : 'user'
        };

        // 1. Save to localStorage via AuthSystem
        AuthSystem.login(user);

        // 2. Redirect to dashboard
        window.location.href = '/index.html';
    } else {
        alert("Please enter credentials");
    }
}

// ---------------------------------------------------------
// DATA SAVING EXAMPLE (From a Tool/Game)
// ---------------------------------------------------------

function onCalculationComplete(result) {
    // Save to global history
    AuthSystem.saveHistory(
        "Unit Converter", 
        [{label: "Input", val: "10kg"}], 
        [{label: "Result", val: result}]
    );
    
    alert("Result saved to history!");
}
