import { mobs, getMobTags } from "../memory-mode/data.js";
import { setMobImage } from "../memory-mode/images.js";

const DARK_MODE_KEY = "memory_mode_dark_mode_enabled";
const MUSIC_ENABLED_KEY = "memory_mode_music_enabled";

// DOM elements
const settingsBtn = document.getElementById("settings-btn");
const closeSettingsBtn = document.getElementById("close-settings");
const settingsOverlay = document.getElementById("settings-overlay");
const settingsBox = document.getElementById("settings-box");
const darkModeToggle = document.getElementById("dark-mode-toggle");

const previousCluesBtn = document.getElementById("previous-clues-btn");
const previousCluesOverlay = document.getElementById("previous-clues-overlay");
const closeCluesBtn = document.getElementById("close-clues-btn");
const clueHistory = document.getElementById("clue-history");

const clueNumber = document.getElementById("clue-number");
const clueDisplay = document.getElementById("clue-display");
const clueText = document.getElementById("clue-text");
const guessBtn = document.getElementById("guess-btn");
const nextClueBtn = document.getElementById("next-clue-btn");
const guessInputContainer = document.getElementById("guess-input-container");
const guessInput = document.getElementById("guess-input");
const submitGuessBtn = document.getElementById("submit-guess-btn");
const feedbackMessage = document.getElementById("feedback-message");

const winOverlay = document.getElementById("win-overlay");
const winStats = document.getElementById("win-stats");
const winMobName = document.getElementById("win-mob-name");
const playAgainBtn = document.getElementById("play-again-btn");
const winSound = document.getElementById("win-sound");
const bgMusic = document.getElementById("bg-music");
const musicToggle = document.getElementById("music-toggle");
const confettiRain = document.getElementById("confetti-rain");

// Game state
let currentMob = null;
let currentClueIndex = 0;
let cluesRevealed = [];
let gameWon = false;
let musicEnabled = readMusicEnabled();
let hasUserInteracted = false;
let confettiIntervalId = null;
let confettiAutoStopTimeoutId = null;

// Mob data with additional info
const mobData = {
  "pig": { drops: ["Raw Porkchop"], biome: "Multiple biomes", health: 5 },
  "cow": { drops: ["Raw Beef", "Leather"], biome: "Multiple biomes", health: 5 },
  "sheep": { drops: ["Wool", "Raw Mutton"], biome: "Multiple biomes", health: 4 },
  "chicken": { drops: ["Raw Chicken", "Feathers"], biome: "Multiple biomes", health: 2 },
  "zombie": { drops: ["Rotten Flesh"], biome: "Spawns at night", health: 10 },
  "skeleton": { drops: ["Bones", "Arrows"], biome: "Spawns at night", health: 10 },
  "creeper": { drops: ["Gunpowder"], biome: "Spawns at night", health: 10 },
  "spider": { drops: ["String"], biome: "Spawns at night", health: 8 },
  "enderman": { drops: ["Ender Pearl"], biome: "All dimensions", health: 20 },
  "zombie villager": { drops: ["Rotten Flesh"], biome: "Villages", health: 10 },
  "blaze": { drops: ["Blaze Rod"], biome: "Nether Fortress", health: 10 },
  "ghast": { drops: ["Ghast Tear"], biome: "Nether", health: 5 },
  "wither skeleton": { drops: ["Coal", "Bones"], biome: "Nether Fortress", health: 10 },
  "shulker": { drops: ["Shulker Shell"], biome: "End City", health: 15 },
  "ender dragon": { drops: ["Dragon Egg"], biome: "The End", health: 100 },
};

// Add default data for mobs not in mobData
function getMobData(mobName) {
  if (mobData[mobName]) {
    return mobData[mobName];
  }
  return {
    drops: ["Various items"],
    biome: "Multiple biomes",
    health: 10
  };
}

// Dark mode functions
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
  } catch {}
}

function applyDarkMode() {
  if (readDarkModeEnabled()) {
    document.body.classList.add("dark-mode");
  } else {
    document.body.classList.remove("dark-mode");
  }
}

// Music functions
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
  } catch {}
}

function startBackgroundMusic() {
  if (!bgMusic || !musicEnabled || !hasUserInteracted) return;
  bgMusic.volume = 0.35;
  bgMusic.play().catch(() => {
    // Browser may block autoplay
  });
}

function stopBackgroundMusic() {
  if (!bgMusic) return;
  bgMusic.pause();
}

function applyMusicState() {
  if (!musicEnabled) {
    stopBackgroundMusic();
    return;
  }
  startBackgroundMusic();
}

// Confetti functions
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

// Settings functions
function openSettings() {
  settingsOverlay.hidden = false;
  settingsBox.hidden = false;
}

function closeSettings() {
  settingsOverlay.hidden = true;
  settingsBox.hidden = true;
}

// Previous clues functions
function openPreviousClues() {
  if (cluesRevealed.length === 0) {
    return;
  }
  
  clueHistory.innerHTML = "";
  cluesRevealed.forEach((clue, index) => {
    const item = document.createElement("div");
    item.className = "clue-history-item";
    item.innerHTML = `
      <div class="clue-history-number">Clue ${index + 1}</div>
      <div class="clue-history-text">${clue}</div>
    `;
    clueHistory.appendChild(item);
  });
  
  previousCluesOverlay.hidden = false;
}

function closePreviousClues() {
  previousCluesOverlay.hidden = true;
}

// Game functions
function normalizeName(name) {
  return name.toLowerCase().trim().replace(/\s+/g, " ");
}

function formatDisplayName(name) {
  return name.replace(/\b[a-z]/g, (char) => char.toUpperCase());
}

function selectRandomMob() {
  const randomIndex = Math.floor(Math.random() * mobs.length);
  return mobs[randomIndex];
}

function generateClue(mob, clueIndex) {
  const tags = getMobTags(mob.name);
  const data = getMobData(mob.name);
  
  switch (clueIndex) {
    case 0: // Dimension
      if (tags.includes("nether")) return "This mob lives in the Nether";
      if (tags.includes("end")) return "This mob lives in the End";
      return "This mob lives in the Overworld";
      
    case 1: // Behavior
      if (tags.includes("hostile")) return "This mob is Hostile";
      if (tags.includes("neutral")) return "This mob is Neutral";
      return "This mob is Passive";
      
    case 2: // Drops
      return `This mob drops: ${data.drops.join(", ")}`;
      
    case 3: // Biome
      return `This mob spawns in: ${data.biome}`;
      
    case 4: // Health
      return `This mob has ${data.health} hearts of health`;
      
    case 5: // First letter
      return `This mob's name starts with: "${mob.name[0].toUpperCase()}"`;
      
    case 6: // Silhouette
      return "silhouette";
      
    case 7: // Half name
      const halfLength = Math.ceil(mob.name.length / 2);
      return `First half of name: "${mob.name.substring(0, halfLength)}"`;
      
    case 8: // Full image
      return "image";
      
    case 9: // Name with 1 missing letter
      const nameArray = mob.name.split("");
      const randomIndex = Math.floor(Math.random() * nameArray.length);
      nameArray[randomIndex] = "_";
      return `Almost there: "${nameArray.join("")}"`;
      
    default:
      return "No more clues!";
  }
}

function displayClue() {
  if (!currentMob || gameWon) return;
  
  const clue = generateClue(currentMob, currentClueIndex);
  cluesRevealed.push(clue);
  
  clueNumber.textContent = `Clue ${currentClueIndex + 1} / 10`;
  clueDisplay.innerHTML = "";
  
  if (clue === "silhouette") {
    const img = document.createElement("img");
    img.className = "clue-image silhouette";
    img.alt = "Mob silhouette";
    setMobImage(img, currentMob);
    clueDisplay.appendChild(img);
    
    const text = document.createElement("p");
    text.className = "clue-text";
    text.textContent = "Here's the silhouette of the mob";
    clueDisplay.appendChild(text);
  } else if (clue === "image") {
    const img = document.createElement("img");
    img.className = "clue-image";
    img.alt = "Mob image";
    setMobImage(img, currentMob);
    clueDisplay.appendChild(img);
    
    const text = document.createElement("p");
    text.className = "clue-text";
    text.textContent = "Here's what the mob looks like";
    clueDisplay.appendChild(text);
  } else {
    const text = document.createElement("p");
    text.className = "clue-text";
    text.textContent = clue;
    clueDisplay.appendChild(text);
  }
  
  // Disable next clue button if at last clue
  if (currentClueIndex >= 9) {
    nextClueBtn.disabled = true;
  }
}

function showGuessInput() {
  guessInputContainer.classList.add("active");
  guessInput.focus();
}

function hideGuessInput() {
  guessInputContainer.classList.remove("active");
  guessInput.value = "";
}

function nextClue() {
  if (currentClueIndex < 9 && !gameWon) {
    currentClueIndex++;
    displayClue();
    hideGuessInput();
    feedbackMessage.classList.remove("active");
  }
}

function submitGuess() {
  const guess = normalizeName(guessInput.value);
  const correctName = normalizeName(currentMob.name);
  
  if (!guess) {
    feedbackMessage.textContent = "Please enter a mob name";
    feedbackMessage.className = "feedback-message error active";
    return;
  }
  
  if (guess === correctName) {
    showWinScreen();
  } else {
    feedbackMessage.textContent = `Incorrect! "${formatDisplayName(guessInput.value)}" is not the right answer.`;
    feedbackMessage.className = "feedback-message error active";
    
    // Auto-advance to next clue after wrong guess
    setTimeout(() => {
      if (currentClueIndex < 9) {
        nextClue();
      }
    }, 1500);
  }
}

function showWinScreen() {
  gameWon = true;
  winStats.textContent = `You won in ${currentClueIndex + 1} clue${currentClueIndex === 0 ? "" : "s"}!`;
  winMobName.textContent = `The mob was: ${formatDisplayName(currentMob.name)}`;
  winOverlay.hidden = false;
  
  // Stop background music and play win sound
  stopBackgroundMusic();
  
  if (winSound) {
    winSound.currentTime = 0;
    winSound.volume = 0.75;
    winSound.play().catch(() => {
      // Browser may block autoplay
    });
  }
  
  // Start confetti
  startConfettiRain();
}

function startNewGame() {
  currentMob = selectRandomMob();
  currentClueIndex = 0;
  cluesRevealed = [];
  gameWon = false;
  
  nextClueBtn.disabled = false;
  winOverlay.hidden = true;
  hideGuessInput();
  feedbackMessage.classList.remove("active");
  
  // Stop confetti and restart background music
  stopConfettiRain();
  if (winSound) {
    winSound.pause();
    winSound.currentTime = 0;
  }
  applyMusicState();
  
  displayClue();
}

// Event listeners
settingsBtn.addEventListener("click", openSettings);
closeSettingsBtn.addEventListener("click", closeSettings);
settingsOverlay.addEventListener("click", closeSettings);

previousCluesBtn.addEventListener("click", openPreviousClues);
closeCluesBtn.addEventListener("click", closePreviousClues);
previousCluesOverlay.addEventListener("click", (e) => {
  if (e.target === previousCluesOverlay) {
    closePreviousClues();
  }
});

guessBtn.addEventListener("click", showGuessInput);
nextClueBtn.addEventListener("click", nextClue);
submitGuessBtn.addEventListener("click", submitGuess);
playAgainBtn.addEventListener("click", startNewGame);

guessInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    submitGuess();
  }
});

if (darkModeToggle) {
  darkModeToggle.checked = readDarkModeEnabled();
  darkModeToggle.addEventListener("change", () => {
    writeDarkModeEnabled(darkModeToggle.checked);
    applyDarkMode();
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

document.addEventListener("keydown", (e) => {
  hasUserInteracted = true;
  applyMusicState();
  
  if (e.key === "Escape") {
    if (!previousCluesOverlay.hidden) {
      closePreviousClues();
    } else if (!settingsOverlay.hidden) {
      closeSettings();
    }
  }
});

// Initialize
applyDarkMode();
applyMusicState();
startNewGame();
