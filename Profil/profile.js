document.addEventListener("DOMContentLoaded", () => {
    const user = localStorage.getItem("loggedInUser");

    if (!user) {
        // nicht eingeloggt → zurück zum Login
        window.location.href = "../LoginAndSignUp/login.html";
        return;
    }

    const parsedUser = JSON.parse(user);

    document.getElementById("username").textContent = parsedUser.username;
    document.getElementById("email").textContent = parsedUser.email;
});

document.getElementById("changeUsernameBtn").addEventListener("click", async () => {
    const emailInput    = document.getElementById("emailInput").value.trim();
    const passwordInput = document.getElementById("passwordInput").value;
    const newUsername   = document.getElementById("newUsername").value.trim();

    // Validierung
    if (!emailInput || !passwordInput || !newUsername) {
        alert("Bitte alle Felder ausfüllen.");
        return;
    }
    if (newUsername.length < 4) {
        alert("Neuer Username muss mindestens 4 Zeichen lang sein.");
        return;
    }

    // 1. Email + Passwort prüfen (gehört zum eingeloggten User?)
    const { data: userCheck, error: authError } = await db
        .from("users")
        .select("*")
        .eq("email", emailInput)
        .eq("password", passwordInput)
        .single();

    if (authError || !userCheck) {
        alert("Email oder Passwort falsch.");
        return;
    }

    // 2. Neuen Username auf Duplikat prüfen
    const { data: duplicate } = await db
        .from("users")
        .select("username")
        .eq("username", newUsername)
        .single();

    if (duplicate) {
        alert("ALREADY TAKEN! USE ANOTHER USERNAME!");
        return;
    }

    // 3. Username updaten
    const { error: updateError } = await db
        .from("users")
        .update({ username: newUsername })
        .eq("email", emailInput);

    if (updateError) {
        alert("Fehler: " + updateError.message);
        return;
    }

    // 4. localStorage aktualisieren
    const parsedUser = JSON.parse(localStorage.getItem("loggedInUser"));
    parsedUser.username = newUsername;
    localStorage.setItem("loggedInUser", JSON.stringify(parsedUser));

    // 5. Anzeige aktualisieren
    document.getElementById("username").textContent = newUsername;
    document.getElementById("emailInput").value    = "";
    document.getElementById("passwordInput").value = "";
    document.getElementById("newUsername").value   = "";

    alert("✓ Username erfolgreich geändert!");
});