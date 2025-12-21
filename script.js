const PRAYER_ORDER = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

const LOCATIONS = {
  London: {
    prayers: { Fajr: "05:40", Dhuhr: "12:10", Asr: "14:25", Maghrib: "16:00", Isha: "17:30" },
    jummah: ["13:00", "14:00"]
  },
  Birmingham: {
    prayers: { Fajr: "05:55", Dhuhr: "12:15", Asr: "14:30", Maghrib: "16:05", Isha: "17:40" },
    jummah: ["13:15", "14:15"]
  }
};

const REMINDERS = [
  { arabic: "إِنَّ مَعَ الْعُسْرِ يُسْرًا", english: "Indeed, with hardship comes ease.", source: "Qur’an 94:6" },
  { arabic: "فَاذْكُرُونِي أَذْكُرْكُمْ", english: "So remember Me; I will remember you.", source: "Qur’an 2:152" },
  { arabic: "وَقُل رَّبِّ زِدْنِي عِلْمًا", english: "And say: My Lord, increase me in knowledge.", source: "Qur’an 20:114" }
];

const EVENTS = [
  { date: "This Friday", title: "Jumu’ah Reminder", desc: "Arrive early and make space for others." },
  { date: "Weekend", title: "Beginner’s Class", desc: "Foundations: prayer, wudu, and daily practice." },
  { date: "Next Week", title: "Community Evening", desc: "A short talk and a chance to meet others." }
];

let activeLocation = "London";
let reminderIndex = 0;
let countdownTimer = null;

function $(id){ return document.getElementById(id); }
function pad2(n){ return String(n).padStart(2, "0"); }

function parseTimeToDate(timeHHMM, dayOffset = 0){
  const [hh, mm] = timeHHMM.split(":").map(Number);
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hh, mm, 0, 0);
  return d;
}

function setTodayDate(){
  const el = $("todayDate");
  if (!el) return;
  const now = new Date();
  el.textContent = now.toLocaleDateString(undefined, { weekday: "short", year: "numeric", month: "short", day: "numeric" });
}

function renderPrayerList(){
  const list = $("prayerList");
  const jummah = $("jummahTimes");
  if (!list) return;

  const data = LOCATIONS[activeLocation];
  list.innerHTML = "";

  PRAYER_ORDER.forEach(name => {
    const time = data.prayers[name];
    const li = document.createElement("li");
    li.className = "prayer-item";
    li.innerHTML = `<span>${name}</span><strong>${time}</strong>`;
    list.appendChild(li);
  });

  if (jummah){
    jummah.textContent = data.jummah.map(t => `• ${t}`).join("  ");
  }
}

function findNextPrayer(){
  const data = LOCATIONS[activeLocation];
  const now = new Date();

  for (const prayerName of PRAYER_ORDER){
    const dt = parseTimeToDate(data.prayers[prayerName], 0);
    if (dt > now) return { name: prayerName, time: data.prayers[prayerName], when: dt };
  }

  const fajrTime = data.prayers["Fajr"];
  const fajrDate = parseTimeToDate(fajrTime, 1);
  return { name: "Fajr", time: fajrTime, when: fajrDate };
}

function highlightActivePrayer(nextPrayerName){
  const list = $("prayerList");
  if (!list) return;

  [...list.children].forEach(li => li.classList.remove("active"));
  const idx = PRAYER_ORDER.indexOf(nextPrayerName);
  if (idx >= 0 && list.children[idx]) list.children[idx].classList.add("active");
}

function startCountdown(){
  const nameEl = $("nextPrayerName");
  const timeEl = $("nextPrayerTime");
  const cdEl = $("countdown");
  if (!nameEl || !timeEl || !cdEl) return;

  if (countdownTimer) clearInterval(countdownTimer);

  const tick = () => {
    const next = findNextPrayer();
    nameEl.textContent = next.name;
    timeEl.textContent = next.time;
    highlightActivePrayer(next.name);

    const now = new Date();
    const diff = next.when - now;
    const totalSeconds = Math.max(0, Math.floor(diff / 1000));

    const hh = Math.floor(totalSeconds / 3600);
    const mm = Math.floor((totalSeconds % 3600) / 60);
    const ss = totalSeconds % 60;

    cdEl.textContent = `${pad2(hh)}:${pad2(mm)}:${pad2(ss)}`;
  };

  tick();
  countdownTimer = setInterval(tick, 1000);
}

function setupLocationToggle(){
  const buttons = document.querySelectorAll("[data-location]");
  if (!buttons.length) return;

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      activeLocation = btn.dataset.location;
      buttons.forEach(b => b.classList.toggle("active", b === btn));
      renderPrayerList();
      startCountdown();
    });
  });
}

function renderReminder(){
  const a = $("reminderArabic");
  const e = $("reminderEnglish");
  const s = $("reminderSource");
  if (!a || !e || !s) return;

  const item = REMINDERS[reminderIndex % REMINDERS.length];
  a.textContent = item.arabic;
  e.textContent = item.english;
  s.textContent = item.source;

  const heroA = $("heroArabic");
  const heroE = $("heroEnglish");
  if (heroA && heroE){
    heroA.textContent = item.arabic;
    heroE.textContent = item.english;
  }
}

function setupReminderButton(){
  const btn = $("newReminderBtn");
  if (!btn) return;

  btn.addEventListener("click", () => {
    reminderIndex++;
    renderReminder();
  });
}

function renderEvents(){
  const grid = $("eventsGrid");
  if (!grid) return;

  grid.innerHTML = "";
  EVENTS.forEach(ev => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <div class="row space-between">
        <h3 class="card-title">${ev.title}</h3>
        <span class="pill">${ev.date}</span>
      </div>
      <p class="muted">${ev.desc}</p>
      <a class="text-link" href="contact.html">Ask / register →</a>
    `;
    grid.appendChild(div);
  });
}

function setupAudioModal(){
  const modal = $("playerModal");
  const audio = $("audioPlayer");
  const title = $("modalTitle");
  const closeBtn = $("closeModalBtn");
  if (!modal || !audio || !title || !closeBtn) return;

  function openModal(reciter, audioSrc){
    title.textContent = reciter || "Player";
    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");

    if (audioSrc && audioSrc.trim().length){
      audio.src = audioSrc;
      audio.load();
      audio.play().catch(() => {});
    } else {
      audio.removeAttribute("src");
      audio.load();
    }
  }

  function closeModal(){
    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");
    audio.pause();
  }

  document.querySelectorAll(".card-btn[data-reciter]").forEach(btn => {
    btn.addEventListener("click", () => {
      openModal(btn.dataset.reciter, btn.dataset.audio || "");
    });
  });

  closeBtn.addEventListener("click", closeModal);

  modal.addEventListener("click", (e) => {
    const t = e.target;
    if (t && t.dataset && t.dataset.close === "true") closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("show")) closeModal();
  });
}

function init(){
  setTodayDate();
  renderPrayerList();
  setupLocationToggle();
  startCountdown();

  renderReminder();
  setupReminderButton();

  renderEvents();
  setupAudioModal();
}

document.addEventListener("DOMContentLoaded", init);
