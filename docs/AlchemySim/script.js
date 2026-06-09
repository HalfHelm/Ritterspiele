const spielfeld = document.getElementById('spielfeld');
const log = document.getElementById('log');

// Rezept-Datenbank
const rezepte = {
    // Basis-Elemente Kombinationen
    "Wasser+Feuer": { name: "Dampf", icon: "☁️" },
    "Erde+Wasser": { name: "Schlamm", icon: "💩" },
    "Luft+Erde": { name: "Staub", icon: "🌫️" },
    
    // Pflanzen & Natur
    "Erde+Sonne": { name: "Kräuter", icon: "🌿" },
    "Wasser+Kräuter": { name: "Tee", icon: "🍵", final: true }, // FINAL
    "Erde+Kräuter": { name: "Pilz", icon: "🍄" },
    
    // Alchemie & Medizin
    "Tee+Feuer": { name: "Heiltrank", icon: "🧪", final: true }, // FINAL
    "Pilz+Feuer": { name: "Gift", icon: "☣️", final: true },      // FINAL
    "Kräuter+Feuer": { name: "Rauchwerk", icon: "🕯️", final: true }, // FINAL
    "Erde+Feuer": { name: "Stein", icon: "🪨" },
    "Stein+Wasser": { name: "Edelstein", icon: "💎", final: true }  // FINAL
};

// Inventar Drag-Events
document.querySelectorAll('#inventar .item').forEach(item => {
    item.addEventListener('dragstart', e => {
        const type = e.currentTarget.getAttribute('data-type');
        e.dataTransfer.setData('type', type);
        e.dataTransfer.setData('source', 'inventar');
    });
});

spielfeld.addEventListener('dragover', e => {
    e.preventDefault(); 
    e.dataTransfer.dropEffect = 'copy';
});

spielfeld.addEventListener('drop', e => {
    e.preventDefault();
    const source = e.dataTransfer.getData('source');
    if (source !== 'inventar') return;

    const type = e.dataTransfer.getData('type');
    const rect = spielfeld.getBoundingClientRect();
    const x = e.clientX - rect.left - 40;
    const y = e.clientY - rect.top - 40;

    // Icon aus dem Inventar holen
    const invIcon = document.querySelector(`#inventar .item[data-type="${type}"] .item-icon`).innerText;
    createPlayfieldItem(type, invIcon, x, y);
});

function createPlayfieldItem(type, icon, x, y) {
    const newItem = document.createElement('div');
    newItem.className = 'item playfield-item';
    
    // Prüfen, ob das Item final ist (für die Unterstreichung)
    const istFinal = Object.values(rezepte).find(r => r.name === type && r.final);
    if (istFinal) {
        newItem.classList.add('final-item');
    }

    newItem.style.position = 'absolute';
    newItem.style.left = x + 'px';
    newItem.style.top = y + 'px';
    newItem.setAttribute('data-type', type);
    
    newItem.innerHTML = `<div class="item-icon">${icon}</div><div class="item-name">${type}</div>`;

    // Drag-Logik aufm Spielfeld 
    let isDragging = false;
    let offsetX, offsetY;

    newItem.addEventListener('mousedown', e => {
        isDragging = true;
        newItem.style.zIndex = 1000;
        const rect = newItem.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        e.stopPropagation();
    });

    document.addEventListener('mousemove', e => {
        if (!isDragging) return;
        const fieldRect = spielfeld.getBoundingClientRect();
        let nx = e.clientX - fieldRect.left - offsetX;
        let ny = e.clientY - fieldRect.top - offsetY;

        // Randbegrenzung
        nx = Math.max(0, Math.min(nx, fieldRect.width - 80));
        ny = Math.max(0, Math.min(ny, fieldRect.height - 80));

        newItem.style.left = nx + 'px';
        newItem.style.top = ny + 'px';
    });

    document.addEventListener('mouseup', () => {
        if (!isDragging) return;
        isDragging = false;
        newItem.style.zIndex = '';
        checkCollision(newItem);
    });

    spielfeld.appendChild(newItem);
    return newItem;
}

function checkCollision(movedItem) {
    const mRect = movedItem.getBoundingClientRect();
    document.querySelectorAll('.playfield-item').forEach(other => {
        if (other === movedItem) return;
        const oRect = other.getBoundingClientRect();

        if (!(mRect.right < oRect.left || mRect.left > oRect.right || 
              mRect.bottom < oRect.top || mRect.top > oRect.bottom)) {
            kombiniere(movedItem, other);
        }
    });
}

function kombiniere(item1, item2) {
    // Sperre: Finale Items können nicht weiter kombiniert werden
    if (item1.classList.contains('final-item') || item2.classList.contains('final-item')) {
        log.innerText = "Dieses Elixier ist bereits vollendet.";
        return false;
    }

    const t1 = item1.getAttribute('data-type');
    const t2 = item2.getAttribute('data-type');
    
    // Beide Kombinationsrichtungen prüfen
    const res = rezepte[t1 + "+" + t2] || rezepte[t2 + "+" + t1];

    if (res) {
        log.innerText = `✨ Sehr gut! ${t1} und ${t2} wird zu ${res.name}! ✨`;
        
        // Position für das neue Item (Mitte der Kollision)
        const x = parseFloat(item1.style.left);
        const y = parseFloat(item1.style.top);
        
        item1.remove(); 
        item2.remove();
        
        const created = createPlayfieldItem(res.name, res.icon, x, y);
        created.classList.add('new-item-animation');
        return true;
    } else {
        log.innerText = "Hildegard schüttelt den Kopf: Diese Stoffe verbinden sich nicht.";
        return false;
    }
}