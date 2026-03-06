import { mobs, structures, getMobTags, getStructureTags } from "./data.js";
import { readSelectedFilters } from "./storage.js";
import { setMobImage } from "./images.js";

const TIMER_ENABLED_KEY = "memory_mode_timer_enabled";
const MUSIC_ENABLED_KEY = "memory_mode_music_enabled";

const settingsBtn = document.getElementById("settings-btn");
const closeSettingsBtn = document.getElementById("close-settings");
const resetProgressBtn = document.getElementById("reset-progress");
const selectFilterBtn = document.getElementById("select-filter");
const overlay = document.getElementById("settings-overlay");
const box = document.getElementById("settings-box");
const mobInput = document.getElementById("mob-input");
const submitGuess = document.getElementById("submit-guess");
const guessMessage = document.getElementById("guess-message");
const headerProgress = document.getElementById("header-progress");
const mobBoard = document.getElementById("mob-board");
const guessRow = document.querySelector(".guess-row");
const winOverlay = document.getElementById("win-overlay");
const newGameBtn = document.getElementById("new-game-btn");
const winTime = document.getElementById("win-time");
const timerToggle = document.getElementById("timer-toggle");
const timerValue = document.getElementById("timer-value");
const headerTimer = document.getElementById("header-timer");
const musicToggle = document.getElementById("music-toggle");
const bgMusic = document.getElementById("bg-music");
const winSound = document.getElementById("win-sound");
const confettiRain = document.getElementById("confetti-rain");

const selectedFilters = readSelectedFilters();
const locationFilters = ["nether", "overworld", "end"];
const behaviorFilters = ["passive", "neutral", "hostile"];
const reservedFilters = new Set(["mobs", "structures", ...locationFilters, ...behaviorFilters]);

const selectedLocations = selectedFilters.filter((filter) => locationFilters.includes(filter));
const selectedBehaviors = selectedFilters.filter((filter) => behaviorFilters.includes(filter));
const selectedExtraMobFilters = selectedFilters.filter((filter) => !reservedFilters.has(filter));
const includeMobs = selectedFilters.includes("mobs") || selectedExtraMobFilters.length > 0;
const includeStructures = selectedFilters.includes("structures");

function matchesLocation(tags) {
  return selectedLocations.length === 0 || selectedLocations.some((filter) => tags.includes(filter));
}

function matchesBehavior(tags) {
  return selectedBehaviors.length === 0 || selectedBehaviors.some((filter) => tags.includes(filter));
}

const activeMobs = [
  ...(includeMobs
    ? mobs.filter((mob) => {
        const tags = getMobTags(mob.name);
        const matchesExtra = selectedExtraMobFilters.every((filter) => tags.includes(filter));
        return matchesLocation(tags) && matchesBehavior(tags) && matchesExtra;
      })
    : []),
  ...(includeStructures
    ? structures.filter((structure) => {
        const tags = getStructureTags(structure.name);
        return matchesLocation(tags);
      })
    : [])
];

const structureNames = new Set(structures.map((item) => item.name));

if (includeStructures && !includeMobs) {
  mobInput.placeholder = "Type structure name";
} else if (includeStructures && includeMobs) {
  mobInput.placeholder = "Type mob or structure name";
}

let hasWon = false;
const guessed = new Set();
const rowMap = new Map();

let timerEnabled = readTimerEnabled();
let timerElapsedMs = 0;
let timerStartedAt = 0;
let timerIntervalId = null;
let timerWasRunningBeforeSettings = false;

let musicEnabled = readMusicEnabled();
let hasUserInteracted = false;
let confettiIntervalId = null;
let confettiAutoStopTimeoutId = null;
let winSoundAutoStopTimeoutId = null;

function normalizeMobName(value) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function formatDisplayName(value) {
  return value.replace(/\b[a-z]/g, (char) => char.toUpperCase());
}

function createConfettiPiece() {
  if (!confettiRain) return;

  const piece = document.createElement("span");
  piece.className = "confetti-piece";

  const colors = ["#f87171", "#facc15", "#4ade80", "#60a5fa", "#f472b6", "#fb923c"];
  const left = Math.random() * 100;
  const duration = 2.6 + Math.random() * 2.2;
  const delay = Math.random() * 0.25;
  const size = 8 + Math.random() * 10;

  piece.style.left = `${left}%`;
  piece.style.width = `${size}px`;
  piece.style.height = `${size * 1.5}px`;
  piece.style.background = colors[Math.floor(Math.random() * colors.length)];
  piece.style.animationDuration = `${duration}s`;
  piece.style.animationDelay = `${delay}s`;

  piece.addEventListener("animationend", () => {
    piece.remove();
  });

  confettiRain.appendChild(piece);
}

function startConfettiRain() {
  if (!confettiRain || confettiIntervalId !== null) return;

  for (let i = 0; i < 60; i += 1) {
    createConfettiPiece();
  }

  confettiIntervalId = window.setInterval(() => {
    for (let i = 0; i < 10; i += 1) {
      createConfettiPiece();
    }
  }, 140);

  if (confettiAutoStopTimeoutId !== null) {
    window.clearTimeout(confettiAutoStopTimeoutId);
  }

  confettiAutoStopTimeoutId = window.setTimeout(() => {
    if (confettiIntervalId !== null) {
      window.clearInterval(confettiIntervalId);
      confettiIntervalId = null;
    }
    confettiAutoStopTimeoutId = null;
  }, 10000);
}

function stopConfettiRain() {
  if (confettiIntervalId !== null) {
    window.clearInterval(confettiIntervalId);
    confettiIntervalId = null;
  }
  if (confettiAutoStopTimeoutId !== null) {
    window.clearTimeout(confettiAutoStopTimeoutId);
    confettiAutoStopTimeoutId = null;
  }
  if (confettiRain) {
    confettiRain.innerHTML = "";
  }
}

function readTimerEnabled() {
  try {
    const raw = localStorage.getItem(TIMER_ENABLED_KEY);
    if (raw === null) return true;
    return raw === "true";
  } catch {
    return true;
  }
}

function writeTimerEnabled(value) {
  try {
    localStorage.setItem(TIMER_ENABLED_KEY, String(value));
  } catch {
    // Ignore localStorage write failure
  }
}

function readMusicEnabled() {
  try {
    const raw = localStorage.getItem(MUSIC_ENABLED_KEY);
    if (raw === null) return false;
    return raw === "true";
  } catch {
    return false;
  }
}

function writeMusicEnabled(value) {
  try {
    localStorage.setItem(MUSIC_ENABLED_KEY, String(value));
  } catch {
    // Ignore localStorage write failure
  }
}

function startBackgroundMusicIfAllowed() {
  if (!bgMusic || !musicEnabled || !hasUserInteracted) return;
  bgMusic.volume = 0.35;
  bgMusic.play().catch(() => {
    // Browser may block autoplay until interaction.
  });
}

function stopBackgroundMusic() {
  if (!bgMusic) return;
  bgMusic.pause();
}

function playWinSound() {
  if (!winSound || !musicEnabled || !hasUserInteracted) return;

  if (winSoundAutoStopTimeoutId !== null) {
    window.clearTimeout(winSoundAutoStopTimeoutId);
    winSoundAutoStopTimeoutId = null;
  }

  winSound.currentTime = 0;
  winSound.volume = 0.75;
  winSound.play().catch(() => {
    // Browser may block autoplay until interaction.
  });

  winSoundAutoStopTimeoutId = window.setTimeout(() => {
    stopWinSound();
  }, 15000);
}

function stopWinSound() {
  if (winSoundAutoStopTimeoutId !== null) {
    window.clearTimeout(winSoundAutoStopTimeoutId);
    winSoundAutoStopTimeoutId = null;
  }
  if (!winSound) return;
  winSound.pause();
  winSound.currentTime = 0;
}

function applyMusicState() {
  if (!musicEnabled) {
    stopBackgroundMusic();
    stopWinSound();
    return;
  }
  startBackgroundMusicIfAllowed();
}

function formatDuration(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0");
}

function getCurrentElapsedMs() {
  if (timerStartedAt > 0) {
    return timerElapsedMs + (Date.now() - timerStartedAt);
  }
  return timerElapsedMs;
}

function updateTimerUI() {
  const timerText = formatDuration(getCurrentElapsedMs());

  if (timerValue) {
    if (!timerEnabled) {
      timerValue.hidden = true;
      timerValue.textContent = "";
    } else {
      timerValue.hidden = false;
      timerValue.textContent = timerText;
    }
  }

  if (headerTimer) {
    if (!timerEnabled) {
      headerTimer.hidden = true;
      headerTimer.textContent = "";
    } else {
      headerTimer.hidden = false;
      headerTimer.textContent = timerText;
    }
  }
}

function startTimer() {
  if (!timerEnabled || hasWon || timerStartedAt > 0) return;
  timerStartedAt = Date.now();
  timerIntervalId = window.setInterval(updateTimerUI, 250);
  updateTimerUI();
}

function pauseTimer() {
  if (timerStartedAt === 0) return false;
  timerElapsedMs += Date.now() - timerStartedAt;
  timerStartedAt = 0;
  if (timerIntervalId) {
    window.clearInterval(timerIntervalId);
    timerIntervalId = null;
  }
  updateTimerUI();
  return true;
}

function resetTimer() {
  pauseTimer();
  timerElapsedMs = 0;
  updateTimerUI();
}

function maybeStartTimerFromInput() {
  if (!timerEnabled || hasWon) return;
  if (mobInput.value.trim().length > 0) startTimer();
}

function updateProgress() {
  const total = activeMobs.length;
  const done = guessed.size;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;

  if (headerProgress) {
    headerProgress.textContent = done + " / " + total + " (" + percent + "%)";
  }

  if (!hasWon && total > 0 && done === total) {
    showWinOverlay();
  }
}

function renderRows() {
  mobBoard.innerHTML = "";
  rowMap.clear();

  if (activeMobs.length === 0) {
    guessMessage.textContent = "No filters selected. Open Settings > Select.";
    updateProgress();
    return;
  }

  activeMobs.forEach((mob, index) => {
    const row = document.createElement("div");
    row.className = "mob-row";
    row.innerHTML = `
      <div class="mob-num">${index + 1}</div>
      <div class="mob-name">${formatDisplayName(mob.name)}</div>
      <img class="mob-sprite" alt="${formatDisplayName(mob.name)} image" />
    `;
    mobBoard.appendChild(row);
    rowMap.set(mob.name, row);

    if (structureNames.has(mob.name)) {
      const img = row.querySelector(".mob-sprite");
      if (img) img.style.display = "none";
    }
  });

  updateProgress();
}

function checkMob() {
  const value = normalizeMobName(mobInput.value);
  if (!value) {
    guessMessage.textContent = "Type a name first.";
    return;
  }

  const mob = activeMobs.find((item) => item.name === value);
  if (!mob) {
    guessMessage.textContent = `"${formatDisplayName(value)}" is not in the list.`;
  } else if (guessed.has(value)) {
    guessMessage.textContent = `"${formatDisplayName(value)}" is already guessed.`;
  } else {
    guessed.add(value);
    const row = rowMap.get(value);
    if (row) {
      row.classList.add("guessed");
      const img = row.querySelector(".mob-sprite");
      if (!structureNames.has(mob.name)) {
        setMobImage(img, mob);
      }
      row.scrollIntoView({ behavior: "smooth", block: "center" });
      row.classList.add("focused");
      setTimeout(() => row.classList.remove("focused"), 1400);
    }
    guessMessage.textContent = `Correct: ${formatDisplayName(value)}`;
  }

  updateProgress();
  mobInput.value = "";
  mobInput.focus();
}

function focusTypeBar() {
  guessRow.scrollIntoView({ behavior: "smooth", block: "start" });
  mobInput.focus();
}

function openSettings() {
  timerWasRunningBeforeSettings = pauseTimer();
  overlay.hidden = false;
  box.hidden = false;
}

function closeSettings() {
  overlay.hidden = true;
  box.hidden = true;

  if (timerWasRunningBeforeSettings && timerEnabled && !hasWon) {
    startTimer();
  }
  timerWasRunningBeforeSettings = false;
}

function showWinOverlay() {
  hasWon = true;
  pauseTimer();

  if (winTime) {
    if (timerEnabled) {
      winTime.hidden = false;
      winTime.textContent = "Time: " + formatDuration(timerElapsedMs);
    } else {
      winTime.hidden = true;
      winTime.textContent = "";
    }
  }

  if (winOverlay) {
    winOverlay.classList.toggle("no-timer", !timerEnabled);
    winOverlay.hidden = false;
  }

  stopBackgroundMusic();
  playWinSound();
  startConfettiRain();
}

function hideWinOverlay() {
  if (winOverlay) {
    winOverlay.hidden = true;
    winOverlay.classList.remove("no-timer");
  }
  stopWinSound();
  stopConfettiRain();
  hasWon = false;
}

function resetProgress() {
  const confirmed = window.confirm("Are you sure you want to reset your progress?");
  if (!confirmed) return;

  guessed.clear();
  hideWinOverlay();
  resetTimer();

  rowMap.forEach((row, name) => {
    row.classList.remove("guessed", "focused");
    const img = row.querySelector(".mob-sprite");
    if (img) {
      img.onerror = null;
      img.removeAttribute("src");
      img.alt = `${formatDisplayName(name)} image`;
    }
  });

  updateProgress();
  guessMessage.textContent = "Progress reset.";
  mobInput.value = "";
  closeSettings();
  focusTypeBar();
}

settingsBtn.addEventListener("click", openSettings);
closeSettingsBtn.addEventListener("click", closeSettings);
resetProgressBtn.addEventListener("click", resetProgress);
selectFilterBtn.addEventListener("click", () => {
  window.location.href = "mob-select.html";
});
newGameBtn.addEventListener("click", () => {
  stopWinSound();
  stopConfettiRain();
  stopBackgroundMusic();
  window.location.href = "index.html";
});
overlay.addEventListener("click", closeSettings);
box.addEventListener("click", (event) => {
  event.stopPropagation();
});
submitGuess.addEventListener("click", checkMob);
mobInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") checkMob();
});
mobInput.addEventListener("input", () => {
  maybeStartTimerFromInput();
});

if (timerToggle) {
  timerToggle.checked = timerEnabled;
  timerToggle.addEventListener("change", () => {
    timerEnabled = timerToggle.checked;
    writeTimerEnabled(timerEnabled);

    if (!timerEnabled) {
      pauseTimer();
      timerWasRunningBeforeSettings = false;
    } else if (!box.hidden) {
      timerWasRunningBeforeSettings = false;
    } else {
      maybeStartTimerFromInput();
    }

    updateTimerUI();
  });
}

if (musicToggle) {
  musicToggle.checked = musicEnabled;
  musicToggle.addEventListener("change", () => {
    musicEnabled = musicToggle.checked;
    writeMusicEnabled(musicEnabled);
    applyMusicState();
  });
}

document.addEventListener("pointerdown", () => {
  hasUserInteracted = true;
  applyMusicState();
}, { once: true });

document.addEventListener("keydown", (event) => {
  hasUserInteracted = true;
  applyMusicState();

  if (event.key === "Escape") {
    closeSettings();
    return;
  }

  const typingKey = event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey;
  if (!typingKey) return;

  const target = event.target;
  const isTypingField = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
  if (isTypingField) return;

  event.preventDefault();
  focusTypeBar();
  mobInput.value += event.key;
  maybeStartTimerFromInput();
});

updateTimerUI();
applyMusicState();
renderRows();
