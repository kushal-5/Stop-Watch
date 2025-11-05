const timerDisplay = document.querySelector(".timerDisplay");
const millisecondsDisplay = document.querySelector(".milliseconds");
const startPauseBtn = document.getElementById("startPauseBtn");
const lapBtn = document.getElementById("lapBtn");
const resetBtn = document.getElementById("resetBtn");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");
const lapsList = document.getElementById("lapsList");
const historyList = document.getElementById("historyList");
const toggleModeBtn = document.getElementById("toggleModeBtn");
const lapsEmpty = document.getElementById("lapsEmpty");
const historyEmpty = document.getElementById("historyEmpty");
const totalLapsEl = document.getElementById("totalLaps");
const fastestLapEl = document.getElementById("fastestLap");
const avgLapEl = document.getElementById("avgLap");
const sessionCountEl = document.getElementById("sessionCount");

// New elements
const modeToggle = document.getElementById("modeToggle");
const countdownToggle = document.getElementById("countdownToggle");
const countdownInput = document.getElementById("countdownInput");
const countdownMin = document.getElementById("countdownMin");
const countdownSec = document.getElementById("countdownSec");
const countdownMsec = document.getElementById("countdownMsec");
const setCountdownBtn = document.getElementById("setCountdownBtn");
const targetMin = document.getElementById("targetMin");
const targetSec = document.getElementById("targetSec");
const setTargetBtn = document.getElementById("setTargetBtn");
const clearTargetBtn = document.getElementById("clearTargetBtn");
const targetAlert = document.getElementById("targetAlert");
const soundToggle = document.getElementById("soundToggle");
const exportBtn = document.getElementById("exportBtn");
const importBtn = document.getElementById("importBtn");
const importFile = document.getElementById("importFile");
const themeBtn = document.getElementById("themeBtn");
const themeSelector = document.getElementById("themeSelector");

let msec = 0, secs = 0, mins = 0;
let countdownMins = 0, countdownSecs = 0, countdownMsecs = 0;
let targetMins = 0, targetSecs = 0;
let timerId = null;
let isRunning = false;
let isCountdownMode = false;
let laps = [];
let lapTimes = [];
let darkMode = false;
let soundEnabled = true;
let currentTheme = "default";

// Audio context for sound effects
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function playSound(frequency, duration, type = 'sine') {
  if (!soundEnabled) return;
  
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.value = frequency;
  oscillator.type = type;
  
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);
}

// Load history from localStorage
window.onload = () => {
  const saved = JSON.parse(localStorage.getItem("stopwatchHistory")) || [];
  saved.forEach((session) => {
    const li = document.createElement("li");
    li.textContent = session;
    historyList.appendChild(li);
  });
  updateSessionCount();
  updateEmptyStates();
  
  // Load settings
  if (localStorage.getItem("darkMode") === "true") {
    darkMode = true;
  }
  soundEnabled = localStorage.getItem("soundEnabled") !== "false";
  currentTheme = localStorage.getItem("theme") || "default";
  
  // Apply saved target time
  const savedTarget = JSON.parse(localStorage.getItem("targetTime"));
  if (savedTarget) {
    targetMins = savedTarget.mins;
    targetSecs = savedTarget.secs;
    targetMin.value = targetMins;
    targetSec.value = targetSecs;
  }
  
  updateSoundButton();
  applyTheme(currentTheme);
  toggleTheme();
};

// Mode Toggle
modeToggle.addEventListener("click", () => {
  isCountdownMode = false;
  modeToggle.classList.add("active");
  countdownToggle.classList.remove("active");
  countdownInput.style.display = "none";
  resetTimer();
});

countdownToggle.addEventListener("click", () => {
  isCountdownMode = true;
  countdownToggle.classList.add("active");
  modeToggle.classList.remove("active");
  countdownInput.style.display = "block";
  resetTimer();
});

setCountdownBtn.addEventListener("click", () => {
  countdownMins = parseInt(countdownMin.value) || 0;
  countdownSecs = parseInt(countdownSec.value) || 0;
  countdownMsecs = parseInt(countdownMsec.value) || 0;
  
  if (countdownMins === 0 && countdownSecs === 0 && countdownMsecs === 0) {
    alert("Please set a countdown time!");
    return;
  }
  
  mins = countdownMins;
  secs = countdownSecs;
  msec = countdownMsecs;
  updateDisplay();
  playSound(800, 0.1);
});

// Target Time
setTargetBtn.addEventListener("click", () => {
  targetMins = parseInt(targetMin.value) || 0;
  targetSecs = parseInt(targetSec.value) || 0;
  
  if (targetMins === 0 && targetSecs === 0) {
    alert("Please set a target time!");
    return;
  }
  
  localStorage.setItem("targetTime", JSON.stringify({ mins: targetMins, secs: targetSecs }));
  playSound(600, 0.1);
});

clearTargetBtn.addEventListener("click", () => {
  targetMins = 0;
  targetSecs = 0;
  targetMin.value = 0;
  targetSec.value = 0;
  targetAlert.style.display = "none";
  localStorage.removeItem("targetTime");
  playSound(400, 0.1);
});

// Sound Toggle
soundToggle.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  localStorage.setItem("soundEnabled", soundEnabled.toString());
  updateSoundButton();
  playSound(500, 0.1);
});

function updateSoundButton() {
  if (soundEnabled) {
    soundToggle.innerHTML = `<span>🔊</span> Sound`;
    soundToggle.classList.remove("muted");
  } else {
    soundToggle.innerHTML = `<span>🔇</span> Sound`;
    soundToggle.classList.add("muted");
  }
}

// Export/Import
exportBtn.addEventListener("click", () => {
  const data = {
    laps: laps,
    lapTimes: lapTimes,
    history: JSON.parse(localStorage.getItem("stopwatchHistory")) || [],
    targetTime: { mins: targetMins, secs: targetSecs },
    exportDate: new Date().toISOString()
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `stopwatch-data-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  playSound(700, 0.1);
});

importBtn.addEventListener("click", () => {
  importFile.click();
});

importFile.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const data = JSON.parse(event.target.result);
      
      if (data.laps && data.lapTimes) {
        laps = data.laps;
        lapTimes = data.lapTimes;
        lapsList.innerHTML = "";
        laps.forEach((lap, index) => {
          const li = document.createElement("li");
          li.innerHTML = `<span class="lap-time">Lap ${lap.index}: ${lap.time}</span>`;
          lapsList.prepend(li);
        });
        updateStats();
        updateEmptyStates();
      }
      
      if (data.history) {
        localStorage.setItem("stopwatchHistory", JSON.stringify(data.history));
        historyList.innerHTML = "";
        data.history.forEach((session) => {
          const li = document.createElement("li");
          li.textContent = session;
          historyList.appendChild(li);
        });
        updateSessionCount();
      }
      
      if (data.targetTime) {
        targetMins = data.targetTime.mins;
        targetSecs = data.targetTime.secs;
        targetMin.value = targetMins;
        targetSec.value = targetSecs;
      }
      
      playSound(800, 0.2);
      alert("Data imported successfully!");
    } catch (error) {
      alert("Error importing data: " + error.message);
    }
  };
  reader.readAsText(file);
});

// Theme Selector
themeBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  themeSelector.style.display = themeSelector.style.display === "none" ? "block" : "none";
});

document.addEventListener("click", (e) => {
  if (!themeBtn.contains(e.target) && !themeSelector.contains(e.target)) {
    themeSelector.style.display = "none";
  }
});

document.querySelectorAll(".theme-option").forEach(option => {
  option.addEventListener("click", () => {
    const theme = option.dataset.theme;
    currentTheme = theme;
    applyTheme(theme);
    localStorage.setItem("theme", theme);
    themeSelector.style.display = "none";
    playSound(600, 0.1);
  });
});

function applyTheme(theme) {
  document.body.className = document.body.className.replace(/theme-\w+/g, "");
  if (theme !== "default") {
    document.body.classList.add(`theme-${theme}`);
  }
}

// Keyboard shortcuts
document.addEventListener("keydown", (e) => {
  if (e.code === "Space" && !e.target.tagName.match(/INPUT|TEXTAREA/)) {
    e.preventDefault();
    startPauseBtn.click();
  } else if (e.key.toLowerCase() === "l" && !e.target.tagName.match(/INPUT|TEXTAREA/)) {
    e.preventDefault();
    lapBtn.click();
  } else if (e.key.toLowerCase() === "r" && !e.target.tagName.match(/INPUT|TEXTAREA/)) {
    e.preventDefault();
    resetBtn.click();
  } else if (e.key.toLowerCase() === "d" && !e.target.tagName.match(/INPUT|TEXTAREA/)) {
    e.preventDefault();
    toggleModeBtn.click();
  }
});

// Start/Pause Timer
startPauseBtn.addEventListener("click", () => {
  if (!isRunning) {
    timerId = setInterval(isCountdownMode ? countdownTimer : startTimer, 10);
    startPauseBtn.innerHTML = `<span class="btn-text">Pause</span><span class="btn-key">Space</span>`;
    startPauseBtn.classList.add("pause");
    isRunning = true;
    playSound(800, 0.1);
  } else {
    clearInterval(timerId);
    startPauseBtn.innerHTML = `<span class="btn-text">Resume</span><span class="btn-key">Space</span>`;
    startPauseBtn.classList.remove("pause");
    isRunning = false;
    playSound(600, 0.1);
  }
});

// Reset Timer
resetBtn.addEventListener("click", () => {
  resetTimer();
  playSound(400, 0.1);
});

function resetTimer() {
  clearInterval(timerId);
  if (!isCountdownMode) {
    storeSession();
  }
  mins = secs = msec = 0;
  if (isCountdownMode) {
    mins = countdownMins;
    secs = countdownSecs;
    msec = countdownMsecs;
  }
  updateDisplay();
  laps = [];
  lapTimes = [];
  lapsList.innerHTML = "";
  startPauseBtn.innerHTML = `<span class="btn-text">Start</span><span class="btn-key">Space</span>`;
  startPauseBtn.classList.remove("pause");
  isRunning = false;
  targetAlert.style.display = "none";
  updateStats();
  updateEmptyStates();
}

// Timer function (stopwatch)
function startTimer() {
  msec++;
  if (msec === 100) {
    msec = 0;
    secs++;
    if (secs === 60) {
      secs = 0;
      mins++;
    }
  }
  
  updateDisplay();
  checkTargetTime();
}

// Countdown Timer
function countdownTimer() {
  if (msec > 0) {
    msec--;
  } else {
    if (secs > 0) {
      secs--;
      msec = 99;
    } else {
      if (mins > 0) {
        mins--;
        secs = 59;
        msec = 99;
      } else {
        // Countdown finished
        clearInterval(timerId);
        isRunning = false;
        startPauseBtn.innerHTML = `<span class="btn-text">Start</span><span class="btn-key">Space</span>`;
        startPauseBtn.classList.remove("pause");
        playSound(1000, 0.5, 'square');
        playSound(800, 0.5, 'square');
        playSound(1000, 0.5, 'square');
        timerDisplay.classList.add("countdown-warning");
        setTimeout(() => {
          timerDisplay.classList.remove("countdown-warning");
        }, 3000);
        return;
      }
    }
  }
  
  updateDisplay();
}

function updateDisplay() {
  timerDisplay.textContent = `${format(mins)}:${format(secs)}:${format(msec)}`;
  millisecondsDisplay.textContent = format(msec);
}

function checkTargetTime() {
  if (targetMins === 0 && targetSecs === 0) return;
  
  const currentTotal = mins * 60 + secs;
  const targetTotal = targetMins * 60 + targetSecs;
  
  if (currentTotal >= targetTotal && !targetAlert.style.display || targetAlert.style.display === "none") {
    targetAlert.style.display = "block";
    playSound(1000, 0.3, 'square');
    setTimeout(() => {
      targetAlert.style.display = "none";
    }, 3000);
  }
}

// Record Lap
lapBtn.addEventListener("click", () => {
  if (!isRunning || isCountdownMode) return;
  
  const totalMillis = mins * 60000 + secs * 1000 + msec * 10;
  lapTimes.push(totalMillis);
  const lapIndex = laps.length + 1;
  
  let diffText = "";
  if (laps.length > 0) {
    const prevLapTime = lapTimes[lapTimes.length - 2];
    const diff = totalMillis - prevLapTime;
    const absDiff = Math.abs(diff);
    const diffSecs = Math.floor(absDiff / 1000);
    const diffMsec = Math.floor((absDiff % 1000) / 10);
    const isFaster = diff < 0;
    
    diffText = ` <span class="lap-diff ${isFaster ? 'faster' : 'slower'}">(${isFaster ? '-' : '+'}${format(diffSecs)}.${format(diffMsec)})</span>`;
  }
  
  const time = `${format(mins)}:${format(secs)}:${format(msec)}`;
  laps.push({ time, millis: totalMillis, index: lapIndex });
  
  const li = document.createElement("li");
  li.innerHTML = `<span class="lap-time">Lap ${lapIndex}: ${time}</span>${diffText}`;
  lapsList.prepend(li);
  
  updateStats();
  updateEmptyStates();
  playSound(900, 0.1);
  
  // Add flash animation
  li.classList.add("lap-best");
  setTimeout(() => {
    li.classList.remove("lap-best");
    updateLapStyles();
  }, 500);
});

// Update lap styles to highlight best and worst
function updateLapStyles() {
  if (lapTimes.length < 2) return;
  
  const allLis = lapsList.querySelectorAll("li");
  let fastestIndex = 0;
  let slowestIndex = 0;
  let fastestTime = lapTimes[0];
  let slowestTime = lapTimes[0];
  
  // Calculate relative times (difference from previous lap)
  const relativeTimes = [];
  for (let i = 0; i < lapTimes.length; i++) {
    if (i === 0) {
      relativeTimes[i] = lapTimes[i];
    } else {
      relativeTimes[i] = lapTimes[i] - lapTimes[i - 1];
    }
  }
  
  // Find fastest and slowest relative times
  for (let i = 1; i < relativeTimes.length; i++) {
    if (relativeTimes[i] < fastestTime) {
      fastestTime = relativeTimes[i];
      fastestIndex = i;
    }
    if (relativeTimes[i] > slowestTime) {
      slowestTime = relativeTimes[i];
      slowestIndex = i;
    }
  }
  
  // Apply styles (reverse index because laps are prepended)
  allLis.forEach((li, index) => {
    li.classList.remove("lap-best", "lap-slowest");
    const actualIndex = lapTimes.length - 1 - index;
    if (actualIndex === fastestIndex && fastestIndex !== slowestIndex) {
      li.classList.add("lap-best");
    } else if (actualIndex === slowestIndex && fastestIndex !== slowestIndex) {
      li.classList.add("lap-slowest");
    }
  });
}

// Update statistics
function updateStats() {
  totalLapsEl.textContent = laps.length;
  
  if (lapTimes.length === 0) {
    fastestLapEl.textContent = "--:--";
    avgLapEl.textContent = "--:--";
    return;
  }
  
  // Calculate fastest lap (relative time)
  if (lapTimes.length > 1) {
    const relativeTimes = [];
    for (let i = 1; i < lapTimes.length; i++) {
      relativeTimes.push(lapTimes[i] - lapTimes[i - 1]);
    }
    const fastest = Math.min(...relativeTimes);
    fastestLapEl.textContent = formatTime(fastest);
  } else {
    fastestLapEl.textContent = formatTime(lapTimes[0]);
  }
  
  // Calculate average lap
  if (lapTimes.length > 1) {
    let totalRelative = 0;
    for (let i = 1; i < lapTimes.length; i++) {
      totalRelative += lapTimes[i] - lapTimes[i - 1];
    }
    const avg = totalRelative / (lapTimes.length - 1);
    avgLapEl.textContent = formatTime(avg);
  } else {
    avgLapEl.textContent = formatTime(lapTimes[0]);
  }
}

// Format time from milliseconds
function formatTime(millis) {
  const secs = Math.floor(millis / 1000);
  const centisecs = Math.floor((millis % 1000) / 10);
  return `${format(secs)}:${format(centisecs)}`;
}

// Clear History
clearHistoryBtn.addEventListener("click", () => {
  laps = [];
  lapTimes = [];
  lapsList.innerHTML = "";
  localStorage.removeItem("stopwatchHistory");
  historyList.innerHTML = "";
  updateStats();
  updateEmptyStates();
  updateSessionCount();
  playSound(400, 0.1);
});

// Format number
function format(num) {
  return num < 10 ? `0${num}` : num;
}

// Save session
function storeSession() {
  if (mins === 0 && secs === 0 && msec === 0) return;
  const total = `${format(mins)}:${format(secs)}:${format(msec)}`;
  const saved = JSON.parse(localStorage.getItem("stopwatchHistory")) || [];
  saved.unshift(total);
  localStorage.setItem("stopwatchHistory", JSON.stringify(saved));
  
  const li = document.createElement("li");
  li.textContent = total;
  historyList.prepend(li);
  
  updateSessionCount();
  updateEmptyStates();
}

// Update session count
function updateSessionCount() {
  const saved = JSON.parse(localStorage.getItem("stopwatchHistory")) || [];
  sessionCountEl.textContent = saved.length;
}

// Update empty states visibility
function updateEmptyStates() {
  if (lapsList.children.length === 0) {
    lapsEmpty.style.display = "block";
  } else {
    lapsEmpty.style.display = "none";
  }
  
  if (historyList.children.length === 0) {
    historyEmpty.style.display = "block";
  } else {
    historyEmpty.style.display = "none";
  }
}

// Dark/Light Mode Toggle
toggleModeBtn.addEventListener("click", () => {
  darkMode = !darkMode;
  localStorage.setItem("darkMode", darkMode.toString());
  toggleTheme();
  playSound(500, 0.1);
});

function toggleTheme() {
  document.body.classList.toggle("light-mode", !darkMode);
  if (darkMode) {
    toggleModeBtn.innerHTML = `<span class="btn-text">☀️</span>`;
  } else {
    toggleModeBtn.innerHTML = `<span class="btn-text">🌙</span>`;
  }
}
