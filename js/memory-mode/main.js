import { mobs, getMobTags } from "./data.js";
import { readSelectedFilters } from "./storage.js";
import { setMobImage } from "./images.js";

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

const selectedFilters = readSelectedFilters();
const activeMobs = mobs.filter((mob) => {
  const tags = getMobTags(mob.name);
  return selectedFilters.some((filter) => tags.includes(filter));
});

const guessed = new Set();
const rowMap = new Map();

function normalizeMobName(value) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function updateProgress() {
  const total = activeMobs.length;
  const done = guessed.size;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;

  if (headerProgress) {
    headerProgress.textContent = done + " / " + total + " (" + percent + "%)";
  }
}

function renderRows() {
  mobBoard.innerHTML = "";
  rowMap.clear();

  if (activeMobs.length === 0) {
    guessMessage.textContent = "No mob filters selected. Open Settings > Select Mobs.";
    updateProgress();
    return;
  }

  activeMobs.forEach((mob, index) => {
    const row = document.createElement("div");
    row.className = "mob-row";
    row.innerHTML = `
      <div class="mob-num">${index + 1}</div>
      <div class="mob-name">${mob.name}</div>
      <img class="mob-sprite" alt="${mob.name} sprite" />
    `;
    mobBoard.appendChild(row);
    rowMap.set(mob.name, row);
  });

  updateProgress();
}

function checkMob() {
  const value = normalizeMobName(mobInput.value);
  if (!value) {
    guessMessage.textContent = "Type a mob name first.";
    return;
  }

  const mob = activeMobs.find((item) => item.name === value);
  if (!mob) {
    guessMessage.textContent = `"${value}" is not in the mob list.`;
  } else if (guessed.has(value)) {
    guessMessage.textContent = `"${value}" is already guessed.`;
  } else {
    guessed.add(value);
    const row = rowMap.get(value);
    if (row) {
      row.classList.add("guessed");
      const img = row.querySelector(".mob-sprite");
      setMobImage(img, mob);
      row.scrollIntoView({ behavior: "smooth", block: "center" });
      row.classList.add("focused");
      setTimeout(() => row.classList.remove("focused"), 1400);
    }
    guessMessage.textContent = `Correct: ${value}`;
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
  overlay.hidden = false;
  box.hidden = false;
}

function closeSettings() {
  overlay.hidden = true;
  box.hidden = true;
}

function resetProgress() {
  const confirmed = window.confirm("Are you sure you want to reset your progress?");
  if (!confirmed) {
    return;
  }

  guessed.clear();
  rowMap.forEach((row, name) => {
    row.classList.remove("guessed", "focused");
    const img = row.querySelector(".mob-sprite");
    if (img) {
      img.onerror = null;
      img.removeAttribute("src");
      img.alt = `${name} sprite`;
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
overlay.addEventListener("click", closeSettings);
box.addEventListener("click", (event) => {
  event.stopPropagation();
});
submitGuess.addEventListener("click", checkMob);
mobInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    checkMob();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeSettings();
    return;
  }

  const typingKey = event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey;
  if (!typingKey) {
    return;
  }

  const target = event.target;
  const isTypingField = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
  if (isTypingField) {
    return;
  }

  event.preventDefault();
  focusTypeBar();
  mobInput.value += event.key;
});

renderRows();
