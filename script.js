// 🔑 DEINE DATEN
const supabaseUrl = "https://rxmgnpfccawdoghrpdnx.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4bWducGZjY2F3ZG9naHJwZG54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5Mzk2NzYsImV4cCI6MjA5MDUxNTY3Nn0.2bL_U1k3YNYiliBO_VUkmSHKrBTHthRr7SAfmeMbt5c";

// Verbindung
const db = window.supabase.createClient(supabaseUrl, supabaseKey);

async function ladeUsers() {
    const { data, error } = await db  
        .from('users')
        .select('*');

    if (error) {
        console.error("Fehler:", error);
        return;
    }
    console.log("Users:", data);
    anzeigenUsers(data);
}

// alles anzeigen
function anzeigenUsers(users) {
    const section = document.createElement("section");
    section.className = "section-container";
    section.style.background = "#111";
    section.style.color = "white";
    section.style.padding = "40px";

    const title = document.createElement("h2");
    title.innerText = "Alle Benutzer";
    title.style.fontSize = "40px";
    title.style.marginBottom = "20px";

    section.appendChild(title);

    users.forEach(user => {
        const card = document.createElement("div");

        card.style.background = "#2e2e2e";
        card.style.padding = "15px";
        card.style.marginBottom = "10px";
        card.style.borderRadius = "8px";

        card.innerHTML = `
            <p><b>ID:</b> ${user.id}</p>
            <p><b>Username:</b> ${user.username}</p>
            <p><b>Email:</b> ${user.email}</p>
            <p><b>Password:</b> ${user.password}</p>
        `;

        section.appendChild(card);
    });

    document.body.appendChild(section);
}

function logout() {
    localStorage.removeItem("loggedInUser");
    window.location.href = "../LoginAndSignUp/login.html";
}

document.addEventListener("DOMContentLoaded", () => {
    const user = localStorage.getItem("loggedInUser");

    const authButtons = document.getElementById("authButtons");
    const logoutButton = document.getElementById("logoutButton");

    if (authButtons && logoutButton) {
        if (user) {
            authButtons.style.display = "none";
            logoutButton.style.display = "flex";
        } 
        else {
            authButtons.style.display = "flex";
            logoutButton.style.display = "none";
        }
    }
});