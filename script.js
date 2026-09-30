// --- ALAPÉRTELMEZETT CSENGETÉSI REND ---
const DEFAULT_SCHEDULE = [
    { id: "1", name: "1. Óra", start: "08:00", end: "08:45", type: "class" },
    { id: "2", name: "Szünet", start: "08:45", end: "08:55", type: "break" },
    { id: "3", name: "2. Óra", start: "08:55", end: "09:40", type: "class" },
    { id: "4", name: "Szünet", start: "09:40", end: "09:50", type: "break" },
    { id: "5", name: "3. Óra", start: "09:50", end: "10:35", type: "class" },
    { id: "6", name: "Nagyszünet", start: "10:35", end: "10:50", type: "break" },
    { id: "7", name: "4. Óra", start: "10:50", end: "11:35", type: "class" },
    { id: "8", name: "Szünet", start: "11:35", end: "11:45", type: "break" },
    { id: "9", name: "5. Óra", start: "11:45", end: "12:30", type: "class" },
    { id: "10", name: "Szünet", start: "12:30", end: "12:40", type: "break" },
    { id: "11", name: "6. Óra", start: "12:40", end: "13:25", type: "class" }
];

let schedule = [];
let isAdmin = false;
const PIN_CODE = "1234";

// --- INICIALIZÁLÁS ---
window.onload = () => {
    loadData();
    setInterval(updateClock, 1000);
    updateClock();
};

function loadData() {
    const saved = localStorage.getItem("suli_timer_schedule");
    if (saved) {
        schedule = JSON.parse(saved);
    } else {
        schedule = JSON.parse(JSON.stringify(DEFAULT_SCHEDULE));
    }
    
    const theme = localStorage.getItem("suli_timer_theme") || "dark";
    changeTheme(theme);
    
    sortSchedule();
    renderSchedule();
}

function saveData() {
    localStorage.setItem("suli_timer_schedule", JSON.stringify(schedule));
    sortSchedule();
    renderSchedule();
    updateClock();
}

function changeTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    document.getElementById("theme-select").value = theme;
    localStorage.setItem("suli_timer_theme", theme);
}

// --- IDŐSZÁMÍTÁS LOGIKA ---

// Idő konvertálása másodpercbe éjféltől (pl 08:15:30 -> másodpercek)
function timeToSeconds(timeStr) {
    const parts = timeStr.split(':');
    const h = parseInt(parts[0]) || 0;
    const m = parseInt(parts[1]) || 0;
    const s = parseInt(parts[2]) || 0;
    return h * 3600 + m * 60 + s;
}

// Formázás MM:SS formátumra
function formatTimeLeft(totalSeconds) {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    
    if (h > 0) {
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function updateClock() {
    const now = new Date();
    
    // Pontos idő kiírása (ÓÓ:PP:MM)
    const currentH = now.getHours().toString().padStart(2, '0');
    const currentM = now.getMinutes().toString().padStart(2, '0');
    const currentS = now.getSeconds().toString().padStart(2, '0');
    document.getElementById("current-time-clock").innerText = `Pontos idő: ${currentH}:${currentM}:${currentS}`;
    
    const nowSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    
    let currentEvent = null;
    let nextEvent = null;
    
    // Keressük meg, hol tartunk most
    for (let i = 0; i < schedule.length; i++) {
        const startSec = timeToSeconds(schedule[i].start);
        const endSec = timeToSeconds(schedule[i].end);
        
        if (nowSeconds >= startSec && nowSeconds < endSec) {
            currentEvent = schedule[i];
            break;
        }
        if (nowSeconds < startSec && !nextEvent) {
            nextEvent = schedule[i];
        }
    }
    
    const titleEl = document.getElementById("current-event-name");
    const timeEl = document.getElementById("time-left");
    const subEl = document.getElementById("event-times");
    const progressEl = document.getElementById("progress-bar");
    
    // Frissítjük a kijelzőt
    if (currentEvent) {
        // Órán vagy szüneten vagyunk
        const endSec = timeToSeconds(currentEvent.end);
        const startSec = timeToSeconds(currentEvent.start);
        const timeLeft = endSec - nowSeconds;
        const totalDuration = endSec - startSec;
        const passed = nowSeconds - startSec;
        
        titleEl.innerText = currentEvent.name;
        timeEl.innerText = formatTimeLeft(timeLeft);
        subEl.innerText = `${currentEvent.start} - ${currentEvent.end}`;
        
        const pct = (passed / totalDuration) * 100;
        progressEl.style.width = `${pct}%`;
        progressEl.style.backgroundColor = currentEvent.type === 'class' ? 'var(--class-color)' : 'var(--break-color)';
        
    } else if (nextEvent) {
        // Várakozunk a következő órára/szünetre
        const startSec = timeToSeconds(nextEvent.start);
        const timeLeft = startSec - nowSeconds;
        
        titleEl.innerText = `Következő: ${nextEvent.name}`;
        timeEl.innerText = formatTimeLeft(timeLeft);
        subEl.innerText = `Kezdés: ${nextEvent.start}`;
        
        progressEl.style.width = '100%';
        progressEl.style.backgroundColor = 'var(--text-muted)';
    } else {
        // Tanítás után
        titleEl.innerText = "Tanítás véget ért!";
        timeEl.innerText = "--:--";
        subEl.innerText = "Mára nincs több esemény.";
        progressEl.style.width = '100%';
        progressEl.style.backgroundColor = 'var(--text-muted)';
    }
    
    // Lista aktív elemének színezése
    document.querySelectorAll('.schedule-item').forEach(el => {
        el.classList.remove('active');
        if (currentEvent && el.dataset.id === currentEvent.id) {
            el.classList.add('active');
            // Automatikus görgetés az aktív elemhez
            // el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    });
}

function sortSchedule() {
    schedule.sort((a, b) => timeToSeconds(a.start) - timeToSeconds(b.start));
}

// --- RENDERELÉS ÉS LISTA KEZELÉS ---
function renderSchedule() {
    const container = document.getElementById("schedule-container");
    container.innerHTML = schedule.map(item => {
        const icon = item.type === 'class' ? 'fa-book-open' : 'fa-mug-hot';
        const colorClass = item.type === 'class' ? 'type-class' : 'type-break';
        
        return `
            <div class="schedule-item" data-id="${item.id}">
                <div class="item-info">
                    <div class="item-icon ${colorClass}"><i class="fa-solid ${icon}"></i></div>
                    <div>
                        <div class="item-name">${item.name}</div>
                        <div class="item-time">${item.start} - ${item.end}</div>
                    </div>
                </div>
                <div class="item-actions admin-only ${isAdmin ? '' : 'hidden'}">
                    <button class="btn btn-outline btn-small" onclick="editItem('${item.id}')"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn btn-danger btn-small" onclick="deleteItem('${item.id}')"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
        `;
    }).join('');
}


// --- ADMIN FUNKCIÓK ---
function openAdminModal() {
    document.getElementById("pin-input").value = "";
    document.getElementById("pin-error").classList.add("hidden");
    openModal('auth-modal');
}

function checkPin() {
    const pin = document.getElementById("pin-input").value;
    if (pin === PIN_CODE) {
        isAdmin = true;
        closeModal('auth-modal');
        document.getElementById("admin-login-btn").classList.add("hidden");
        document.getElementById("admin-logout-btn").classList.remove("hidden");
        
        document.querySelectorAll('.admin-only').forEach(el => el.classList.remove('hidden'));
        renderSchedule(); // Újrarajzolás, hogy látszódjanak a gombok
    } else {
        document.getElementById("pin-error").classList.remove("hidden");
    }
}

function logoutAdmin() {
    isAdmin = false;
    document.getElementById("admin-login-btn").classList.remove("hidden");
    document.getElementById("admin-logout-btn").classList.add("hidden");
    
    document.querySelectorAll('.admin-only').forEach(el => el.classList.add('hidden'));
    renderSchedule();
}

// --- SZERKESZTÉS ---
function openAddModal() {
    document.getElementById("edit-modal-title").innerText = "Új Időszak";
    document.getElementById("edit-id").value = "";
    document.getElementById("edit-name").value = "";
    document.getElementById("edit-start").value = "";
    document.getElementById("edit-end").value = "";
    document.getElementById("edit-type").value = "class";
    openModal("edit-modal");
}

function editItem(id) {
    const item = schedule.find(x => x.id === id);
    if (!item) return;
    
    document.getElementById("edit-modal-title").innerText = "Időszak Szerkesztése";
    document.getElementById("edit-id").value = item.id;
    document.getElementById("edit-name").value = item.name;
    document.getElementById("edit-start").value = item.start;
    document.getElementById("edit-end").value = item.end;
    document.getElementById("edit-type").value = item.type;
    
    openModal("edit-modal");
}

function saveScheduleItem() {
    const id = document.getElementById("edit-id").value;
    const name = document.getElementById("edit-name").value;
    const start = document.getElementById("edit-start").value;
    const end = document.getElementById("edit-end").value;
    const type = document.getElementById("edit-type").value;
    
    if (!name || !start || !end) {
        alert("Kérlek töltsÉrtem, tehát egy olyan számlálóra gondolsz, ami méri a fókuszált időt és a pihenőket – ez a klasszikus **Pomodoro-módszer** (általában 25 perc munka, 5 perc szünet).

Készítettem neked egy egyszerű, böngészőből azonnal futtatható időzítőt. Nincs szükség semmilyen program telepítésére: csak másold be az alábbi kódot egy sima Jegyzettömbbe (Notepad), mentsd el **idozito.html** néven, majd kattints rá duplán, és megnyílik a böngésződben.

```html
<!DOCTYPE html>
<html lang="hu">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Munka és Szünet Időzítő</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; text-align: center; margin-top: 10%; background-color: #2c3e50; color: white; }
        .timer-box { background: #34495e; padding: 40px; border-radius: 15px; box-shadow: 0 10px 20px rgba(0,0,0,0.3); display: inline-block; }
        h1 { margin-top: 0; color: #ecf0f1; font-weight: normal; }
        .time { font-size: 80px; font-weight: bold; margin: 20px 0; color: #1abc9c; font-variant-numeric: tabular-nums; }
        button { font-size: 16px; padding: 12px 24px; margin: 5px; cursor: pointer; border: none; border-radius: 8px; font-weight: bold; transition: 0.2s; }
        .btn-start { background-color: #2ecc71; color: white; }
        .btn-start:hover { background-color: #27ae60; }
        .btn-pause { background-color: #e67e22; color: white; }
        .btn-pause:hover { background-color: #d35400; }
        .btn-reset { background-color: #e74c3c; color: white; }
        .btn-reset:hover { background-color: #c0392b; }
        .mode-container { margin-top: 30px; padding-top: 20px; border-top: 1px solid #7f8c8d; }
        .btn-mode { background-color: #95a5a6; color: #2c3e50; }
        .btn-mode:hover { background-color: #7f8c8d; color: white; }
    </style>
</head>
<body>
    <div class="timer-box">
        <h1 id="mode-text">Munkaidő (25 perc)</h1>
        <div class="time" id="display">25:00</div>
        
        <button class="btn-start" onclick="startTimer()">Indítás</button>
        <button class="btn-pause" onclick="pauseTimer()">Szüneteltetés</button>
        <button class="btn-reset" onclick="resetTimer()">Visszaállítás</button>
        
        <div class="mode-container">
            <button class="btn-mode" onclick="setMode('work')">Munka mód (25p)</button>
            <button class="btn-mode" onclick="setMode('shortBreak')">Rövid szünet (5p)</button>
            <button class="btn-mode" onclick="setMode('longBreak')">Hosszú szünet (15p)</button>
        </div>
    </div>

    <script>
        let timeLeft = 25 * 60; 
        let timer;
        let isRunning = false;
        let currentMode = 'work'; 

        function updateDisplay() {
            let minutes = Math.floor(timeLeft / 60);
            let seconds = timeLeft % 60;
            document.getElementById('display').innerText = 
                (minutes < 10 ? "0" : "") + minutes + ":" + 
                (seconds < 10 ? "0" : "") + seconds;
        }

        function startTimer() {
            if (!isRunning) {
                isRunning = true;
                timer = setInterval(() => {
                    if (timeLeft > 0) {
                        timeLeft--;
                        updateDisplay();
                    } else {
                        clearInterval(timer);
                        isRunning = false;
                        alert(currentMode === 'work' ? "Letelt a munkaidő! Jöhet a szünet." : "Vége a szünetnek! Irány vissza dolgozni.");
                    }
                }, 1000);
            }
        }

        function pauseTimer() {
            clearInterval(timer);
            isRunning = false;
        }

        function resetTimer() {
            pauseTimer();
            if (currentMode === 'work') timeLeft = 25 * 60;
            else if (currentMode === 'shortBreak') timeLeft = 5 * 60;
            else if (currentMode === 'longBreak') timeLeft = 15 * 60;
            updateDisplay();
        }

        function setMode(mode) {
            currentMode = mode;
            if (mode === 'work') {
                document.getElementById('mode-text').innerText = "Munkaidő (25 perc)";
            } else if (mode === 'shortBreak') {
                document.getElementById('mode-text').innerText = "Rövid szünet (5 perc)";
            } else if (mode === 'longBreak') {
                document.getElementById('mode-text').innerText = "Hosszú szünet (15 perc)";
            }
            resetTimer();
        }
    </script>
</body>
</html>