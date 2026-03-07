import { mobs, structures, blocks as fallbackBlocks, getMobTags, getStructureTags, getBlockTags, loadLatestBlocks } from "./data.js";
import { readSelectedFilters } from "./storage.js";
import { setMobImage } from "./images.js";

const TIMER_ENABLED_KEY = "memory_mode_timer_enabled";
const MUSIC_ENABLED_KEY = "memory_mode_music_enabled";
const DARK_MODE_KEY = "memory_mode_dark_mode_enabled";

let hintsAvailable = 0;
let hintsUsed = 0;
let totalGuesses = 0;

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
const darkModeToggle = document.getElementById("dark-mode-toggle");
const hintBtn = document.getElementById("hint-btn");
const hintCounter = document.getElementById("hint-counter");
const hintOverlay = document.getElementById("hint-overlay");
const closeHintBtn = document.getElementById("close-hint");
const bgMusic = document.getElementById("bg-music");
const winSound = document.getElementById("win-sound");
const confettiRain = document.getElementById("confetti-rain");

const selectedFilters = readSelectedFilters();
const locationFilters = ["nether", "overworld", "end"];
const behaviorFilters = ["passive", "neutral", "hostile"];
const biomeFilters = ["desert", "ocean", "forest", "plains", "mountains", "swamp", "jungle", "taiga", "savanna", "badlands", "snowy"];
const reservedFilters = new Set(["mobs", "blocks", "structures", ...locationFilters, ...behaviorFilters, ...biomeFilters]);

const selectedLocations = selectedFilters.filter((filter) => locationFilters.includes(filter));
const selectedBehaviors = selectedFilters.filter((filter) => behaviorFilters.includes(filter));
const selectedBiomes = selectedFilters.filter((filter) => biomeFilters.includes(filter));
const selectedExtraMobFilters = selectedFilters.filter((filter) => !reservedFilters.has(filter));
const includeMobs = selectedFilters.includes("mobs") || selectedExtraMobFilters.length > 0;
const includeStructures = selectedFilters.includes("structures");
const includeBlocks = selectedFilters.includes("blocks");

let blocks = [...fallbackBlocks];
let activeMobs = [];
let nonVisualNames = new Set();

function matchesLocation(tags) {
  return selectedLocations.length === 0 || selectedLocations.some((filter) => tags.includes(filter));
}

function matchesBehavior(tags) {
  return selectedBehaviors.length === 0 || selectedBehaviors.some((filter) => tags.includes(filter));
}

function matchesBiome(tags) {
  return selectedBiomes.length === 0 || selectedBiomes.some((filter) => tags.includes(filter));
}

function joinTypeNames(names) {
  if (names.length === 1) return names[0];
  if (names.length === 2) return names[0] + " or " + names[1];
  return names.slice(0, -1).join(", ") + ", or " + names[names.length - 1];
}

function setInputPlaceholder() {
  const types = [];
  if (includeMobs) types.push("mob name");
  if (includeStructures) types.push("structure name");
  if (includeBlocks) types.push("block name");
  if (types.length > 0) {
    mobInput.placeholder = "Type " + joinTypeNames(types);
  }
}

function rebuildActiveList() {
  activeMobs = [
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
      : []),
    ...(includeBlocks
      ? blocks.filter((block) => {
          const tags = getBlockTags(block.name);
          return matchesLocation(tags) && matchesBiome(tags);
        })
      : []),
  ];

  nonVisualNames = new Set([
    ...structures.map((item) => item.name),
    ...blocks.map((item) => item.name),
  ]);
  rebuildGuessAliasMap();
  setInputPlaceholder();
}

let hasWon = false;
const guessed = new Set();
const rowMap = new Map();
const canonicalGuessMap = new Map();
const blockNameSet = new Set();

let timerEnabled = readTimerEnabled();
let timerElapsedMs = 0;
let timerStartedAt = 0;
let timerIntervalId = null;
let timerWasRunningBeforeSettings = false;

let musicEnabled = readMusicEnabled();
let darkModeEnabled = readDarkModeEnabled();
let hasUserInteracted = false;
let confettiIntervalId = null;
let confettiAutoStopTimeoutId = null;
let winSoundAutoStopTimeoutId = null;

function normalizeMobName(value) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function addGuessAlias(alias, canonicalName) {
  if (!alias) return;
  if (!canonicalGuessMap.has(alias)) {
    canonicalGuessMap.set(alias, canonicalName);
  }
}

function rebuildGuessAliasMap() {
  canonicalGuessMap.clear();
  blockNameSet.clear();

  blocks.forEach((block) => blockNameSet.add(block.name));

  activeMobs.forEach((entry) => {
    const canonical = entry.name;
    addGuessAlias(canonical, canonical);

    if (!blockNameSet.has(canonical)) return;

    if (canonical.endsWith(" block")) {
      addGuessAlias(canonical.slice(0, -6), canonical);
    }

    if (canonical.endsWith(" ore")) {
      addGuessAlias(canonical.slice(0, -4), canonical);

      if (canonical.startsWith("deepslate ")) {
        const baseOre = canonical.replace(/^deepslate /, "").replace(/ ore$/, "");
        addGuessAlias(baseOre, canonical);
      }
    }
  });
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

function readDarkModeEnabled() {
  try {
    const raw = localStorage.getItem(DARK_MODE_KEY);
    if (raw === null) return false;
    return raw === "true";
  } catch {
    return false;
  }
}

function writeDarkModeEnabled(value) {
  try {
    localStorage.setItem(DARK_MODE_KEY, String(value));
  } catch {
    // Ignore localStorage write failure
  }
}

function applyDarkMode() {
  if (darkModeEnabled) {
    document.body.classList.add("dark-mode");
  } else {
    document.body.classList.remove("dark-mode");
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

function updateHintCounter() {
  if (hintCounter) {
    hintCounter.textContent = hintsAvailable;
  }
  if (hintBtn) {
    hintBtn.disabled = hintsAvailable === 0;
    hintBtn.style.opacity = hintsAvailable === 0 ? "0.5" : "1";
    hintBtn.style.cursor = hintsAvailable === 0 ? "not-allowed" : "pointer";
  }
}

function getRandomUnguessedItem() {
  const unguessed = activeMobs.filter(item => !guessed.has(item.name));
  if (unguessed.length === 0) return null;
  return unguessed[Math.floor(Math.random() * unguessed.length)];
}

function useHint() {
  if (hintsAvailable === 0) {
    guessMessage.textContent = "No hints available. Make 3 more guesses to earn a hint.";
    return;
  }

  const item = getRandomUnguessedItem();
  if (!item) {
    guessMessage.textContent = "All items already guessed!";
    return;
  }

  hintsAvailable--;
  hintsUsed++;
  updateHintCounter();

  const firstThree = item.name.substring(0, 3);
  
  // Show hint with image
  const hintImage = document.getElementById("hint-image");
  const hintOverlay = document.getElementById("hint-overlay");
  const hintText = document.getElementById("hint-text");
  
  if (hintOverlay && hintImage && hintText) {
    hintText.textContent = `Hint: Starts with "${firstThree}..."`;
    
    // Set image if not a non-visual item
    if (!nonVisualNames.has(item.name)) {
      hintImage.style.display = "block";
      setMobImage(hintImage, item);
    } else {
      hintImage.style.display = "none";
    }
    
    hintOverlay.hidden = false;
    closeSettings();
  } else {
    // Fallback to message only
    guessMessage.textContent = `Hint: Starts with "${firstThree}..."`;
    guessMessage.style.color = "#f59e0b";
    setTimeout(() => {
      guessMessage.style.color = "";
    }, 3000);
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

    if (nonVisualNames.has(mob.name)) {
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

  const canonicalName = canonicalGuessMap.get(value) || value;
  const mob = activeMobs.find((item) => item.name === canonicalName);

  if (!mob) {
    guessMessage.textContent = `"${formatDisplayName(value)}" is not in the list.`;
    totalGuesses++;
  } else if (guessed.has(canonicalName)) {
    guessMessage.textContent = `"${formatDisplayName(mob.name)}" is already guessed.`;
  } else {
    guessed.add(canonicalName);
    totalGuesses++;
    
    // Award hint every 3 correct guesses
    if (totalGuesses % 3 === 0) {
      hintsAvailable++;
      updateHintCounter();
      guessMessage.textContent = `Correct: ${formatDisplayName(mob.name)} - Hint earned! (${hintsAvailable} available)`;
    } else {
      guessMessage.textContent = `Correct: ${formatDisplayName(mob.name)}`;
    }
    
    const row = rowMap.get(canonicalName);
    if (row) {
      row.classList.add("guessed");
      const img = row.querySelector(".mob-sprite");
      if (!nonVisualNames.has(mob.name)) {
        setMobImage(img, mob);
      }
      row.scrollIntoView({ behavior: "smooth", block: "center" });
      row.classList.add("focused");
      setTimeout(() => row.classList.remove("focused"), 1400);
    }
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
      const timeText = "Time: " + formatDuration(timerElapsedMs);
      const hintsText = hintsUsed > 0 ? ` | Hints used: ${hintsUsed}` : "";
      winTime.hidden = false;
      winTime.textContent = timeText + hintsText;
    } else {
      const hintsText = hintsUsed > 0 ? `Hints used: ${hintsUsed}` : "";
      if (hintsText) {
        winTime.hidden = false;
        winTime.textContent = hintsText;
      } else {
        winTime.hidden = true;
        winTime.textContent = "";
      }
    }
  }

  if (winOverlay) {
    winOverlay.classList.toggle("no-timer", !timerEnabled && hintsUsed === 0);
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
  console.log('resetProgress function called');
  const confirmed = window.confirm("Are you sure you want to reset your progress?");
  console.log('User confirmed:', confirmed);
  if (!confirmed) return;

  console.log('Clearing guessed items, count before:', guessed.size);
  guessed.clear();
  totalGuesses = 0;
  hintsAvailable = 0;
  hintsUsed = 0;
  updateHintCounter();
  console.log('Guessed items after clear:', guessed.size);
  
  hideWinOverlay();
  resetTimer();

  console.log('Resetting rows, total rows:', rowMap.size);
  rowMap.forEach((row, name) => {
    row.classList.remove("guessed", "focused");
    const img = row.querySelector(".mob-sprite");
    if (img) {
      img.onerror = null;
      img.removeAttribute("src");
      img.src = "";
      img.alt = `${formatDisplayName(name)} image`;
      img.style.opacity = "0";
    }
    const nameEl = row.querySelector(".mob-name");
    if (nameEl) {
      nameEl.style.color = "transparent";
      nameEl.style.userSelect = "none";
    }
  });

  updateProgress();
  guessMessage.textContent = "Progress reset.";
  mobInput.value = "";
  closeSettings();
  focusTypeBar();
  console.log('Reset complete');
}

settingsBtn.addEventListener("click", openSettings);
closeSettingsBtn.addEventListener("click", closeSettings);
console.log('resetProgressBtn element:', resetProgressBtn);
if (resetProgressBtn) {
  resetProgressBtn.addEventListener("click", () => {
    console.log('Reset button clicked!');
    resetProgress();
  });
  console.log('Reset button event listener added');
} else {
  console.error('resetProgressBtn is null or undefined');
}
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

if (darkModeToggle) {
  darkModeToggle.checked = darkModeEnabled;
  darkModeToggle.addEventListener("change", () => {
    darkModeEnabled = darkModeToggle.checked;
    writeDarkModeEnabled(darkModeEnabled);
    applyDarkMode();
  });
}

if (hintBtn) {
  hintBtn.addEventListener("click", useHint);
}

if (closeHintBtn) {
  closeHintBtn.addEventListener("click", () => {
    if (hintOverlay) {
      hintOverlay.hidden = true;
    }
  });
}

if (hintOverlay) {
  hintOverlay.addEventListener("click", (e) => {
    if (e.target === hintOverlay) {
      hintOverlay.hidden = true;
    }
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
    if (hintOverlay && !hintOverlay.hidden) {
      hintOverlay.hidden = true;
      return;
    }
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

async function initGame() {
  try {
    blocks = await loadLatestBlocks();
  } catch {
    blocks = [...fallbackBlocks];
  }

  rebuildActiveList();
  updateTimerUI();
  applyMusicState();
  applyDarkMode();
  renderRows();
  updateHintCounter();
  
  // Ensure reset button is clickable
  if (resetProgressBtn) {
    resetProgressBtn.style.pointerEvents = 'auto';
    console.log('Reset button found and enabled');
  } else {
    console.error('Reset button not found!');
  }
}

initGame();
