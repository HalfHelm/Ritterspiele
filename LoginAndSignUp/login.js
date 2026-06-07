function zeigeMeldung(text, typ) {
    const el = document.getElementById("message");
    el.textContent = text;
    el.className = "message " + typ;
}

async function login() {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const btn      = document.getElementById("loginBtn");

    // Validierung
    if (!email || !password) {
        zeigeMeldung("Bitte E-Mail und Passwort eingeben.", "error");
        return;
    }

    btn.disabled = true;
    btn.textContent = "Wird geprüft...";

    // User suchen
    const { data, error } = await db
        .from("users")
        .select("*")
        .eq("email", email)
        .eq("password", password)
        .single();

    if (error || !data) {
        zeigeMeldung("E-Mail oder Passwort falsch.", "error");
        btn.disabled = false;
        btn.textContent = "Einloggen";
        return;
    }

    // Login erfolgreich
    zeigeMeldung("Erfolgreich eingeloggt!", "success");

    // User speichern
    localStorage.setItem("loggedInUser", JSON.stringify(data));

    // Weiterleitung
    setTimeout(() => {
        window.location.href = "../Home/home.html";
    }, 1000);

    btn.disabled = false;
    btn.textContent = "Einloggen";
}

// Enter-Taste
document.addEventListener("keydown", e => {
    if (e.key === "Enter") login();
});
