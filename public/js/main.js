document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    const logoutBtn = document.getElementById("logoutBtn");

    // Login Function
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const username = document.getElementById("username").value;
            const password = document.getElementById("password").value;

            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem("token", data.token);
                localStorage.setItem("username", data.user.username);
                window.location.href = "index.html"; // Redirect to chat page
            } else {
                alert(data.msg);
            }
        });
    }

    // Logout Function
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            localStorage.removeItem("token");
            localStorage.removeItem("username");
            window.location.href = "login.html"; // Redirect to login page
        });
    }

    // Check if user is logged in
    const token = localStorage.getItem("token");
    if (!token && window.location.pathname !== "/login.html") {
        window.location.href = "login.html"; // Redirect to login if not authenticated
    }
});
