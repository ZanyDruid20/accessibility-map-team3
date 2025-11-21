document.getElementById("adminLoginForm").addEventListener("submit", function(event) {
    event.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    console.log(username, password);

    const response = fetch("http://localhost:8000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    })
    .then(function (response) {
    if (!response.ok) {
        alert("Invalid Login Attempt");
        return;
    }
    return response.json();
    })
    .then(function (data) {
        if (data) {
            window.location.href = "reportView.html";
        }
    })
});