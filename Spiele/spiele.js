// 🔑 DEINE DATEN
const supabaseUrl = "https://rxmgnpfccawdoghrpdnx.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4bWducGZjY2F3ZG9naHJwZG54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5Mzk2NzYsImV4cCI6MjA5MDUxNTY3Nn0.2bL_U1k3YNYiliBO_VUkmSHKrBTHthRr7SAfmeMbt5c";

// Verbindung zu Supabase herstellen
const db = window.supabase.createClient(supabaseUrl, supabaseKey);

const container = document.getElementById("gamesContainer");
const searchBar = document.getElementById("searchBar");
const btnAZ = document.getElementById("sortAZ");
const btnZA = document.getElementById("sortZA");
const btnLikes = document.getElementById("sortLikes"); // 🌟 NEU: Der Likes-Sortierbutton

let allGames = [];      
let currentGames = [];  
let currentUserId = null; 

// 1. Funktion, um die Spiele im HTML anzuzeigen
function renderGames(gamesToRender) {
    container.innerHTML = ""; 

    if (gamesToRender.length === 0) {
        container.innerHTML = "<p>Keine Spiele gefunden.</p>";
        return;
    }

    gamesToRender.forEach(game => {
        const likedBy = game.liked_by || [];
        const hasLiked = currentUserId && likedBy.map(String).includes(currentUserId.toString());

        container.innerHTML += `
            <div class="game-card">
                <h2>${game.name}</h2>
                <p>${game.description || 'Keine Beschreibung vorhanden.'}</p>
                <div class="game-footer">
                    <button class="like-btn" 
                            onclick="toggleLike('${game.id}')" 
                            ${!currentUserId ? 'disabled style="opacity: 0.5; cursor: not-allowed;" title="Bitte logge dich ein, um zu liken"' : ''}>
                        ${hasLiked ? '❤️' : '🤍'} <span>${game.likes || 0}</span>
                    </button>
                  
<a href="${game.link || '#'}" target="_blank">Zum Spiel</a>
                </div>
            </div>
        `;
    });
}

// 2. Initialisierung: Deinen eigenen LocalStorage-Login prüfen & Spiele laden
async function init() {
    const localUserRaw = localStorage.getItem("loggedInUser");

    if (localUserRaw) {
        try {
            const parsedUser = JSON.parse(localUserRaw);
            currentUserId = parsedUser.id || parsedUser.username || parsedUser; 
        } catch (e) {
            currentUserId = localUserRaw;
        }
        console.log("Erfolgreich als eingeloggt erkannt:", currentUserId);
    } else {
        console.log("Kein User eingeloggt. Like-Buttons werden gesperrt.");
    }

    await ladeGames();
}

async function ladeGames() {
    container.innerHTML = "<p>Spiele werden geladen...</p>";

    const { data, error } = await db  
        .from('games')
        .select('*');

    if (error) {
        console.error("Fehler beim Laden von Supabase:", error);
        container.innerHTML = "<p>Fehler beim Laden der Daten aus der Datenbank.</p>";
        return;
    }

    allGames = data;
    console.log("Geladene Spiele aus Supabase:", data); // <-- FÜGE DIESE ZEILE KURZ EIN
    currentGames = [...data]; 
    renderGames(currentGames);
}

// 3. Die Like / Dislike Funktion
window.toggleLike = async function(gameId) {
    if (!currentUserId) {
        alert("Du musst eingeloggt sein, um zu liken!");
        return; 
    }

    const game = allGames.find(g => g.id.toString() === gameId.toString());
    if (!game) return;

    let currentLikes = game.likes || 0;
    let likedBy = game.liked_by || [];
    
    let likedByStrings = likedBy.map(String); 
    const userIdStr = currentUserId.toString();

    let newLikes;
    let newLikedBy;

    if (likedByStrings.includes(userIdStr)) {
        newLikes = Math.max(0, currentLikes - 1);
        newLikedBy = likedByStrings.filter(id => id !== userIdStr);
    } else {
        newLikes = currentLikes + 1;
        newLikedBy = [...likedByStrings, userIdStr];
    }

    const { error } = await db
        .from('games')
        .update({ 
            likes: newLikes,
            liked_by: newLikedBy 
        })
        .eq('id', gameId);

    if (error) {
        alert("Fehler beim Speichern: " + error.message);
        console.error(error);
        return;
    }

    allGames = allGames.map(g => g.id.toString() === gameId.toString() ? { ...g, likes: newLikes, liked_by: newLikedBy } : g);
    currentGames = currentGames.map(g => g.id.toString() === gameId.toString() ? { ...g, likes: newLikes, liked_by: newLikedBy } : g);

    renderGames(currentGames);
};

// Starten
init();

// 4. Suchen
searchBar.addEventListener("input", (e) => {
    const searchString = e.target.value.toLowerCase();
    currentGames = allGames.filter(game => game.name.toLowerCase().includes(searchString));
    renderGames(currentGames);
});

// 5. Sortieren von A nach Z
btnAZ.addEventListener("click", () => {
    currentGames.sort((a, b) => a.name.localeCompare(b.name));
    renderGames(currentGames);
});

// 6. Sortieren von Z nach A
btnZA.addEventListener("click", () => {
    currentGames.sort((a, b) => b.name.localeCompare(a.name));
    renderGames(currentGames);
});

// 7. 🌟 NEU: Sortieren nach den meisten Likes (Absteigend)
if (btnLikes) {
    btnLikes.addEventListener("click", () => {
        currentGames.sort((a, b) => (b.likes || 0) - (a.likes || 0));
        renderGames(currentGames);
    });
}