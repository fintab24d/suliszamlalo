/* ==========================================
   SULIHUB ULTRA - JAVASCRIPT LOGIKA
   ========================================== */

// 1. ALAPÉRTELMEZETT ADATSTRUKTÚRA
const DEFAULT_DATA = {
    pin: "1234",
    theme: "cyber",
    counters: [
        { id: "1", title: "Kapott Ötösök", value: 42, icon: "⭐" },
        { id: "2", title: "Késések Száma", value: 5, icon: "⏰" },
        { id: "3", title: "Órai Hiányzások", value: 12, icon: "❌" },
        { id: "4", title: "Kréta hiány", value: 8, icon: "🖍️️" }
    ],
    events: [
        { id: "1", title: "Nyári Szünet", date: "2027-06-15" },
        { id: "2", title: "Érettségi", date: "2027-05-03" }
    ],
    notices: [
        { id: "1", title: "Osztály Wi-Fi", text: "Jelszó: SuliPass2026", color: "yellow" },
        { id: "2", title: "Kirándulás", text: "Péntekig hozzátok a pénzt!", color: "blue" }
    ],
    tasks: [
        { id: "1", title: "Matek TZ", subject: "Matematika", date: "2026-10-15" },
        { id: "2", title: "Töri röpdolgozat", subject: "Történelem", date: "2026-10-08" }
    ],
    timetable: {
        "Hétfő": [
            { num: 1, subject: "Matematika", room: "204" },
            { num: 2, subject: "Magyar nyelv", room: "101" },
            { num: 3, subject: "Történelem", room: "305" }
        ],
        "Kedd": [
            { num: 1, subject: "Angol", room: "202" },
            { num: 2, subject: "Fizika", room: "Labor" }
        ],
        "Szerda": [{ num: 1, subject: "Informatika", room: "Gépterem" }],
        "Csütörtök": [{ num: 1, subject: "Testnevelés", room: "Tornaterem" }],
        "Péntek": [{ num: 1, subject: "Biologia", room: "208" }]
    }
};

let appState = {};
let isAdmin = false;
let selectedDay = "Hétfő";

// Csengetési Rend Időpontok
const bellSchedule = [
    { name: "1. Óra", start: "08:00", end: "08:45" },
    { name: "Szünet", start: "08:45", end: "08:55" },
    { name: "2. Óra", start: "08:55", end: "09:40" },
    { name: "Szünet", start: "09:40", end: "09:50" },
    { name: "3. Óra", start: "09:50", end: "10:35" },
    { name: "Szünet", start: "10:35", end: "10:45" },
    { name: "4. Óra", start: "10:45", end: "11:30" },
    { name: "Szünet", start: "11:30", end: "11:40" },
    { name: "5. Óra", start: "11:40", end: "12:25" },
    { name: "Szünet", start: "12:25", end: "12:35" },
    { name: "6. Óra", start: "12:35", end: "13:20" }
];

// 2. TÁROLÁS & BETÖLTÉS (localStorage)
function loadState() {
    const saved = localStorage.getItem("sulihub_ultra_data");
    if (saved) {
        try { appState = JSON.parse(saved); } catch(e) { appState = DEFAULT_DATA; }
    } else {
        appState = DEFAULT_DATA;
    }
    changeTheme(appState.theme || "cyber");
    renderAll();
}

function saveState() {
    localStorage.setItem("sulihub_ultra_data", JSON.stringify(appState));
    renderAll();
}

// 3. TÉMA VÁLTÁS
function changeTheme(themeName) {
    appState.theme = themeName;
    document.documentElement.setAttribute("data-theme", themeName);
    document.getElementById("theme-select").value = themeName;
    localStorage.setItem("sulihub_ultra_data", JSON.stringify(appState));
}

// 4. AUTHENTICATION (ADMIN BELÉPÉS)
function handleAuthSubmit(e) {
    e.preventDefault();
    const pin = document.getElementById("pin-input").value;
    const errorDiv = document.getElementById("auth-error");

    if (pin === appState.pin) {
        isAdmin = true;
        errorDiv.classList.add("hidden");
        closeModal("auth-modal");
        updateAdminUI();
    } else {
        errorDiv.classList.remove("hidden");
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
    renderAll();
}

function logoutAdmin() {
    isAdmin = false;
    updateAdminUI();
}

function changePinCode() {
    if (!isAdmin) return;
    const newPin = prompt("Adja meg az új Admin PIN kódot:");
    if (newPin && newPin.trim().length >= 4) {
        appState.pin = newPin.trim();
        saveState();
        alert("PIN kód sikeresen megváltoztatva!");
    } else {
        alert("A PIN kódnak legalább 4 karakteresnek kell lennie!");
    }
}

// 5. RENDERELÉSI FUNKCIÓK
function renderAll() {
    renderCounters();
    renderEvents();
    renderNotices();
    renderTasks();
    renderTimetable();
}

// Számlálók
function renderCounters() {
    const container = document.getElementById("counters-container");
    container.innerHTML = appState.counters.map(c => `
        <div class="counter-card">
            <div style="display:flex; justify-content:space-between;">
                <span>${c.icon} ${c.title}</span>
                ${isAdmin ? `<button onclick="deleteCounter('${c.id}')" style="background:none;border:none;color:var(--rose);cursor:pointer;"><i class="fa-solid fa-trash"></i></button>` : ''}
            </div>
            <div class="counter-val">${c.value}</div>
            <div class="counter-btns">
                <button class="btn-cnt" onclick="updateCounter('${c.id}', -1)" ${!isAdmin ? 'disabled style="opacity:0.4"' : ''}>-1</button>
                <button class="btn-cnt add" onclick="updateCounter('${c.id}', 1)" ${!isAdmin ? 'disabled style="opacity:0.4"' : ''}>+1</button>
            </div>
        </div>
    `).join('');
}

function updateCounter(id, delta) {
    if (!isAdmin) return;
    const counter = appState.counters.find(c => c.id === id);
    if (counter) {
        counter.value = Math.max(0, counter.value + delta);
        saveState();
    }
}

function saveCounter(e) {
    e.preventDefault();
    const title = document.getElementById("counter-title-input").value;
    const icon = document.getElementById("counter-icon-input").value;
    const value = parseInt(document.getElementById("counter-val-input").value) || 0;

    appState.counters.push({ id: Date.now().toString(), title, icon, value });
    saveState();
    closeModal("counter-modal");
}

function deleteCounter(id) {
    if (!isAdmin) return;
    appState.counters = appState.counters.filter(c => c.id !== id);
    saveState();
}

// Események
function renderEvents() {
    const container = document.getElementById("events-container");
    const now = new Date();

    container.innerHTML = appState.events.map(e => {
        const target = new Date(e.date);
        const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
        return `
            <div style="background:rgba(0,0,0,0.2); padding:10px; border-radius:10px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <strong style="font-size:0.85rem">${e.title}</strong>
                    <div style="font-size:0.75rem; color:var(--text-muted);">${e.date}</div>
                </div>
                <div style="text-align:right">
                    <span style="font-size:1.1rem; font-weight:800; color:var(--primary);">${diff > 0 ? diff : 0} nap</span>
                    ${isAdmin ? `<button onclick="deleteEvent('${e.id}')" style="background:none;border:none;color:var(--rose);margin-left:8px;cursor:pointer;"><i class="fa-solid fa-trash"></i></button>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function saveEvent(e) {
    e.preventDefault();
    const title = document.getElementById("event-title-input").value;
    const date = document.getElementById("event-date-input").value;

    appState.events.push({ id: Date.now().toString(), title, date });
    saveState();
    closeModal("event-modal");
}

function deleteEvent(id) {
    if (!isAdmin) return;
    appState.events = appState.events.filter(e => e.id !== id);
    saveState();
}

// Post-it Üzenetek
function renderNotices() {
    const container = document.getElementById("notices-container");
    container.innerHTML = appState.notices.map(n => `
        <div class="post-it ${n.color || 'yellow'}">
            <h4>${n.title}</h4>
            <p>${n.text}</p>
            ${isAdmin ? `<button onclick="deleteNotice('${n.id}')" style="position:absolute; top:6px; right:6px; background:none; border:none; color:#dc2626; cursor:pointer;"><i class="fa-solid fa-xmark"></i></button>` : ''}
        </div>
    `).join('');
}

function saveNotice(e) {
    e.preventDefault();
    const title = document.getElementById("notice-title-input").value;
    const text = document.getElementById("notice-text-input").value;
    const color = document.getElementById("notice-color-input").value;

    appState.notices.push({ id: Date.now().toString(), title, text, color });
    saveState();
    closeModal("notice-modal");
}

function deleteNotice(id) {
    if (!isAdmin) return;
    appState.notices = appState.notices.filter(n => n.id !== id);
    saveState();
}

// Feladatok
function renderTasks() {
    const container = document.getElementById("tasks-container");
    container.innerHTML = appState.tasks.map(t => `
        <div style="background:rgba(0,0,0,0.2); padding:8px 12px; border-radius:8px; margin-bottom:6px; display:flex; justify-content:space-between; align-items:center;">
            <div>
                <span style="font-size:0.65rem; background:rgba(244,63,94,0.2); color:var(--rose); padding:2px 6px; border-radius:4px;">${t.subject}</span>
                <div style="font-size:0.85rem; font-weight:600; margin-top:2px;">${t.title}</div>
            </div>
            <div style="font-size:0.75rem; color:var(--text-muted);">
                ${t.date}
                ${isAdmin ? `<button onclick="deleteTask('${t.id}')" style="background:none;border:none;color:var(--rose);margin-left:6px;cursor:pointer;"><i class="fa-solid fa-trash"></i></button>` : ''}
            </div>
        </div>
    `).join('');
}

function saveTask(e) {
    e.preventDefault();
    const title = document.getElementById("task-title-input").value;
    const subject = document.getElementById("task-subject-input").value;
    const date = document.getElementById("task-date-input").value;

    appState.tasks.push({ id: Date.now().toString(), title, subject, date });
    saveState();
    closeModal("task-modal");
}

function deleteTask(id) {
    if (!isAdmin) return;
    appState.tasks = appState.tasks.filter(t => t.id !== id);
    saveState();
}

// Órarend
function selectDay(day) {
    selectedDay = day;
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.classList.toggle("active", btn.innerText.includes(day.substring(0, 2)));
    });
    renderTimetable();
}

function renderTimetable() {
    const container = document.getElementById("timetable-container");
    const list = appState.timetable[selectedDay] || [];

    if (list.length === 0) {
        container.innerHTML = `<p style="font-size:0.8rem; color:var(--text-muted);">Nincs megadva óra erre a napra.</p>`;
        return;
    }

    container.innerHTML = list.map((item, idx) => `
        <div class="timetable-item">
            <span><strong>${item.num}. Óra:</strong> ${item.subject}</span>
            <span style="color:var(--text-muted); font-size:0.75rem;">
                <i class="fa-solid fa-location-dot"></i> ${item.room} Terem
                ${isAdmin ? `<button onclick="deleteLesson('${selectedDay}',${idx})" style="background:none;border:none;color:var(--rose);margin-left:6px;cursor:pointer;"><i class="fa-solid fa-trash"></i></button>` : ''}
            </span>
        </div>
    `).join('');
}

function saveTimetableLesson(e) {
    e.preventDefault();
    const day = document.getElementById("tt-day-input").value;
    const num = parseInt(document.getElementById("tt-num-input").value);
    const subject = document.getElementById("tt-subject-input").value;
    const room = document.getElementById("tt-room-input").value;

    if (!appState.timetable[day]) appState.timetable[day] = [];
    appState.timetable[day].push({ num, subject, room });
    appState.timetable[day].sort((a, b) => a.num - b.num);

    saveState();
    closeModal("timetable-modal");
}

function deleteLesson(day, index) {
    if (!isAdmin) return;
    appState.timetable[day].splice(index, 1);
    saveState();
}

// 6. JEGYÁTLAG SZÁMOLÓ
function calculateGrades() {
    const str = document.getElementById("grade-inputs").value;
    const target = parseFloat(document.getElementById("target-grade").value);

    const grades = str.split(',').map(n => parseFloat(n.trim())).filter(n => !isNaN(n) && n >= 1 && n <= 5);

    if (grades.length === 0) {
        document.getElementById("res-avg").innerText = "--";
        document.getElementById("res-needed").innerText = "--";
        return;
    }

    const sum = grades.reduce((a, b) => a + b, 0);
    const avg = sum / grades.length;
    document.getElementById("res-avg").innerText = avg.toFixed(2);

    if (target && target > avg) {
        let needed = 0;
        let tempSum = sum;
        let tempCount = grades.length;

        while ((tempSum / tempCount) < target && needed < 50) {
            tempSum += 5;
            tempCount++;
            needed++;
        }
        document.getElementById("res-needed").innerText = `${needed} db 5-ös`;
    } else {
        document.getElementById("res-needed").innerText = "Elérve!";
    }
}

// 7. ÉLŐ CSENGETÉSI REND ÓRA
function updateBellTimer() {
    const now = new Date();
    document.getElementById("live-clock").innerText = now.toLocaleString("hu-HU");

    const curMins = now.getHours() * 60 + now.getMinutes();
    let currentEvent = null;

    for (let s of bellSchedule) {
        const [sh, sm] = s.start.split(':').map(Number);
        const [eh, em] = s.end.split(':').map(Number);
        const sMins = sh * 60 + sm;
        const eMins = eh * 60 + em;

        if (curMins >= sMins && curMins < eMins) {
            currentEvent = { ...s, sMins, eMins };
            break;
        }
    }

    if (currentEvent) {
        document.getElementById("lesson-status-title").innerText = currentEvent.name;
        const left = currentEvent.eMins - curMins;
        const total = currentEvent.eMins - currentEvent.sMins;
        const passed = curMins - currentEvent.sMins;
        const pct = (passed / total) * 100;

        document.getElementById("lesson-countdown").innerText = `${left} perc van hátra`;
        document.getElementById("lesson-subtext").innerText = `Vége: ${currentEvent.end}-kor`;
        document.getElementById("lesson-progress").style.width = `${pct}%`;
    } else {
        document.getElementById("lesson-status-title").innerText = "Tanítási időn kívül";
        document.getElementById("lesson-countdown").innerText = "Nincs óra";
        document.getElementById("lesson-subtext").innerText = "Pihenj egyet!";
        document.getElementById("lesson-progress").style.width = "0%";
    }
}

// 8. ISKOLACSENGŐ HANGSZINTETIZÁTOR (Web Audio API)
function playSchoolBell() {
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioCtx();

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 hang

        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 1.5);
    } catch(e) {
        alert("A böngésződ nem támogatja az audio szintetizátort.");
    }
}

// 9. MODÁL KEZELÉS & EXPORT/IMPORT
function openModal(id) { document.getElementById(id).classList.remove("hidden"); }
function closeModal(id) { document.getElementById(id).classList.add("hidden"); }

function exportData() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appState, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = "sulihub_mentes.json";
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
            alert("Sikeres adatimportálás!");
        } catch(err) {
            alert("Érvénytelen JSON fájl!");
        }
    };
    reader.readAsText(file);
}

function resetToDefault() {
    if (confirm("Biztosan visszaállítod a gyári adatokat?")) {
        appState = DEFAULT_DATA;
        saveState();
    }
}

// Indítás
window.onload = () => {
    loadState();
    setInterval(updateBellTimer, 1000);
    updateBellTimer();
};