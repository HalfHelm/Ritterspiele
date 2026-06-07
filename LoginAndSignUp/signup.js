function zeigeMeldung(text, typ) {
    const el = document.getElementById("message");
    el.textContent = text;
    el.className = "message " + typ;
}

async function register() {
    const username = document.getElementById("username").value.trim();
    const email    = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const btn      = document.getElementById("registerBtn");

    // Validierung
    if (!username || !email || !password) {
        zeigeMeldung("Bitte alle Felder ausfüllen.", "error");
        return;
    }

    if (username.length < 4) {
        zeigeMeldung("Username muss mindestens 4 Zeichen lang sein.", "error");
        return;
    }

    // Email Format prüfen
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
        zeigeMeldung("Bitte eine gültige E-Mail eingeben.", "error");
        return;
    }

    if (password.length < 6) {
        zeigeMeldung("Passwort muss mindestens 6 Zeichen haben.", "error");
        return;
    }

    btn.disabled = true;
    btn.textContent = "Wird registriert...";

    // Duplikat-Check
    const { data: existing, error: checkError } = await db
        .from("users")
        .select("username, email")
        .or(`username.eq.${username},email.eq.${email}`);

    if (checkError) {
        zeigeMeldung("Fehler: " + checkError.message, "error");
        btn.disabled = false;
        btn.textContent = "Registrieren";
        return;
    }

    // falls Duplikat gefunden werden 
    if (existing && existing.length > 0) {
        zeigeMeldung("E-Mail oder Benutzername ist bereits vergeben.", "error");
        btn.disabled = false;
        btn.textContent = "Registrieren";
        return;
    }

    // alles ok, dann
    const { error } = await db
        .from("users")
        .insert([{ username, email, password }]);

    if (error) {
        zeigeMeldung("Fehler: " + error.message, "error");
    } 
    else {
        zeigeMeldung("Erfolgreich registriert!", "success");
        document.getElementById("username").value = "";
        document.getElementById("email").value    = "";
        document.getElementById("password").value = "";
    }

    btn.disabled = false;
    btn.textContent = "Registrieren";
}

document.addEventListener("keydown", e => {
    if (e.key === "Enter") register();
});