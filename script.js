// --- ALAPADATOK ---
const DEFAULT_DATA = {
    pin: "1234",
    theme: "cyber",
    counters: [
        { id: "1", title: "Kapott Ötösök", icon: "⭐", category: "study", value: 42, step: 1, max: 100, color: "emerald", date: Date.now() },
        { id: "2", title: "Késések (Perc)", icon: "⏰", category: "behavior", value: 15, step: 5, max: 0, color: "rose", date: Date.now()-1000 },
        { id: "3", title: "Kréta / Filc hiány", icon: "🖍", category: "study", value: 4, step: 1, max: 0, color: "gold", date: Date.now()-2000 },
        { id: "4", title: "Osztálypénz (ezer Ft)", icon: "💰", category: "fun", value: 25, step: 1, max: 50, color: "primary", date: Date.now()-3000 }
    ]
};

let appState = {};
let isAdmin = false;

// --- INICIALIZÁLÁS ---
window.onload = () => {
    loadState();
};

function loadState() {
    const saved = localStorage.getItem("sulidash_counters");
    if (saved) {
        try { appState = JSON.parse(saved); } 
        catch(e) { appState = DEFAULT_DATA; }
    } else {
        appState = JSON.parse(JSON.stringify(DEFAULT_DATA));
    }
    changeTheme(appState.theme || "cyber");
    renderCounters();
}

function saveState() {
    localStorage.setItem("sulidash_counters", JSON.stringify(appState));
    renderCounters();
}

function changeTheme(themeName) {
    appState.theme = themeName;
    document.documentElement.setAttribute("data-theme", themeName);
    document.getElementById("theme-select").value = themeName;
    saveState();
}

// --- ADMIN AUTHENTIKÁCIÓ ---
function handleAuthSubmit(e) {
    e.preventDefault();
    const pin = document.getElementById("pin-input").value;
    if (pin === appState.pin) {
        isAdmin = true;
        document.getElementById("auth-error").classList.add("hidden");
        document.getElementById("pin-input").value = "";
        closeModal("auth-modal");
        updateAdminUI();
    } else {
        document.getElementById("auth-error").classList.remove("hidden");
    }
}

function updateAdminUI() {
    const statusBadge = document.getElementById("admin-status");
    const authText = document.getElementById("auth-text");
    const authIcon = document.getElementById("auth-icon");
    const adminButtons = document.querySelectorAll(".btn-admin-only");

    if (isAdmin) {
        statusBadge.className = "status-badge admin";
        statusBadge.innerHTML = `<i class="fa-solid fa-user-shield"></i> <span>Admin Mód</span>`;
        authText.innerText = "Kilépés";
        authIcon.className = "fa-solid fa-right-from-bracket";
        document.getElementById("auth-btn").onclick = logoutAdmin;
        adminButtons.forEach(btn => btn.classList.remove("hidden"));
    } else {
        statusBadge.className = "status-badge guest";
        statusBadge.innerHTML = `<i class="fa-solid fa-user"></i> <span>Vendég</span>`;
        authText.innerText = "Admin";
        authIcon.className = "fa-solid fa-lock";
        document.getElementById("auth-btn").onclick = () => openModal("auth-modal");
        adminButtons.forEach(btn => btn.classList.add("hidden"));
    }
    renderCounters(); // Újrarajzolás, hogy a gombok frissüljenek
}

function logoutAdmin() {
    isAdmin = false;
    updateAdminUI();
}

function changePinCode() {
    const newPin = prompt("Adja meg az új Admin PIN kódot (min. 4 karakter):");
    if (newPin && newPin.trim().length >= 4) {
        appState.pin = newPin.trim();
        saveState();
        alert("PIN kód sikeresen módosítva!");
    } else if (newPin) {
        alert("Túl rövid PIN kód!");
    }
}

// --- RENDERELÉS ÉS SZŰRÉS ---
function getCategoryName(cat) {
    const cats = {
        'study': '📚 Tanulás & Jegyek',
        'behavior': '⚠️ Fegyelem',
        'fun': '🎉 Közösség & Móka'
    };
    return cats[cat] || 'Egyéb';
}

function renderCounters() {
    const container = document.getElementById("counters-container");
    const search = document.getElementById("search-input").value.toLowerCase();
    const filter = document.getElementById("category-filter").value;
    const sort = document.getElementById("sort-select").value;

    // Szűrés
    let filtered = appState.counters.filter(c => {
        const matchSearch = c.title.toLowerCase().includes(search);
        const matchCat = filter === 'all' || c.category === filter;
        return matchSearch && matchCat;
    });

    // Rendezés
    filtered.sort((a, b) => {
        if (sort === 'highest') return b.value - a.value;
        if (sort === 'lowest') return a.value - b.value;
        return b.date - a.date; // newest
    });

    if (filtered.length === 0) {
        container.innerHTML = `<p style="grid-column: 1/-1; text-align:center; color:var(--text-muted);">Nincs a keresésnek megfelelő számláló.</p>`;
        return;
    }

    container.innerHTML = filtered.map(c => {
        const step = parseInt(c.step) || 1;
        const max = parseInt(c.max) || 0;
        let progressHtml = '';
        
        if (max > 0) {
            const pct = Math.min(100, Math.max(0, (c.value / max) * 100));
            progressHtml = `
                <div class="progress-bg">
                    <div class="progress-fill" style="width: ${pct}%"></div>
                </div>
                <span class="goal-text">Cél: ${max} (${Math.round(pct)}%)</span>
            `;
        }

        const adminControls = isAdmin ? `
            <div class="admin-overlay">
                <button onclick="editCounter('${c.id}')" title="Szerkesztés"><i class="fa-solid fa-pen"></i></button>
                <button onclick="resetCounter('${c.id}')" title="Nullázás"><i class="fa-solid fa-rotate-left"></i></button>
                <button class="btn-del" onclick="deleteCounter('${c.id}')" title="Törlés"><i class="fa-solid fa-trash"></i></button>
            </div>
        ` : '';

        return `
            <div class="counter-card color-${c.color}">
                ${adminControls}
                <div class="counter-header">
                    <div class="c-icon-title">
                        <span class="c-icon">${c.icon}</span>
                        <span>${c.title}</span>
                    </div>
                </div>
                <div class="c-category-tag" style="width: fit-content;">${getCategoryName(c.category)}</div>
                
                <div class="c-value-container">
                    <div class="c-value">${c.value}</div>
                    ${progressHtml}
                </div>

                <div class="c-controls">
                    <button class="btn-calc" onclick="updateCounter('${c.id}', -${step})" ${!isAdmin ? 'disabled' : ''}>-${step}</button>
                    <button class="btn-calc" onclick="updateCounter('${c.id}', ${step})" ${!isAdmin ? 'disabled' : ''}>+${step}</button>
                </div>
            </div>
        `;
    }).join('');
}

// --- SZÁMLÁLÓ MŰVELETEK ---
function updateCounter(id, amount) {
    if (!isAdmin) return;
    const c = appState.counters.find(x => x.id === id);
    if (c) {
        c.value += amount;
        saveState();
    }
}

function resetCounter(id) {
    if (!isAdmin) return;
    const c = appState.counters.find(x => x.id === id);
    if (c && confirm(`Biztosan nullázod a(z) "${c.title}" számlálót?`)) {
        c.value = 0;
        saveState();
    }
}

function deleteCounter(id) {
    if (!isAdmin) return;
    if (confirm("Biztosan törlöd ezt a számlálót?")) {
        appState.counters = appState.counters.filter(x => x.id !== id);
        saveState();
    }
}

function editCounter(id) {
    const c = appState.counters.find(x => x.id === id);
    if (!c) return;
    
    document.getElementById("modal-counter-title").innerText = "Számláló Szerkesztése";
    document.getElementById("c-id").value = c.id;
    document.getElementById("c-title").value = c.title;
    document.getElementById("c-icon").value = c.icon;
    document.getElementById("c-category").value = c.category;
    document.getElementById("c-value").value = c.value;
    document.getElementById("c-step").value = c.step;
    document.getElementById("c-max").value = c.max || "";
    document.getElementById("c-color").value = c.color;
    
    openModal('counter-modal');
}

function saveCounter(e) {
    e.preventDefault();
    const id = document.getElementById("c-id").value;
    const newCounter = {
        id: id || Date.now().toString(),
        title: document.getElementById("c-title").value,
        icon: document.getElementById("c-icon").value,
        category: document.getElementById("c-category").value,
        value: parseInt(document.getElementById("c-value").value) || 0,
        step: parseInt(document.getElementById("c-step").value) || 1,
        max: parseInt(document.getElementById("c-max").value) || 0,
        color: document.getElementById("c-color").value,
        date: id ? appState.counters.find(x=>x.id===id).date : Date.now()
    };

    if (id) {
        const idx = appState.counters.findIndex(x => x.id === id);
        appState.counters[idx] = newCounter;
    } else {
        appState.counters.push(newCounter);
    }
    
    saveState();
    closeModal('counter-modal');
    document.getElementById("c-id").value = ""; // reset
    e.target.reset();
}

// --- MODÁLOK & ADATKEZELÉS ---
function openModal(id) {
    if (id === 'counter-modal' && !document.getElementById("c-id").value) {
        document.getElementById("modal-counter-title").innerText = "Új Számláló";
        document.getElementById("c-value").value = "0";
    }
    document.getElementById(id).classList.remove("hidden");
}

function closeModal(id) {
    document.getElementById(id).classList.add("hidden");
    if (id === 'counter-modal') document.getElementById("c-id").value = "";
}

function exportData() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appState, null, 2));
    const a = document.createElement('a');
    a.href = dataStr; a.download = "sulidash_szamlalok.json";
    a.click();
}

function importData(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            appState = JSON.parse(event.target.result);
            saveState();
            alert("Adatok sikeresen betöltve!");
            closeModal('settings-modal');
        } catch(err) { alert("Érvénytelen fájl!"); }
    };
    reader.readAsText(file);
}

function resetToDefault() {
    if (confirm("Minden adat törlődik! Biztosan visszaállítod az alapállapotot?")) {
        appState = JSON.parse(JSON.stringify(DEFAULT_DATA));
        saveState();
        closeModal('settings-modal');
    }
}