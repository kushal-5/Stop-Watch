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

let msec = 0, secs = 0, mins = 0;
let timerId = null;
let isRunning = false;
let laps = [];
let lapTimes = [];
let darkMode = false;

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
  
  // Set initial theme
  if (localStorage.getItem("darkMode") === "true") {
    darkMode = true;
  }
  toggleTheme();
};

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
    timerId = setInterval(startTimer, 10);
    startPauseBtn.innerHTML = `<span class="btn-text">Pause</span><span class="btn-key">Space</span>`;
    startPauseBtn.classList.add("pause");
    isRunning = true;
  } else {
    clearInterval(timerId);
    startPauseBtn.innerHTML = `<span class="btn-text">Resume</span><span class="btn-key">Space</span>`;
    startPauseBtn.classList.remove("pause");
    isRunning = false;
  }
});

// Reset Timer
resetBtn.addEventListener("click", () => {
  clearInterval(timerId);
  storeSession();
  msec = secs = mins = 0;
  timerDisplay.textContent = "00:00:00";
  millisecondsDisplay.textContent = "000";
  laps = [];
  lapTimes = [];
  lapsList.innerHTML = "";
  startPauseBtn.innerHTML = `<span class="btn-text">Start</span><span class="btn-key">Space</span>`;
  startPauseBtn.classList.remove("pause");
  isRunning = false;
  updateStats();
  updateEmptyStates();
});

// Record Lap
lapBtn.addEventListener("click", () => {
  if (!isRunning) return;
  
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
});

// Timer function
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
  
  timerDisplay.textContent = `${format(mins)}:${format(secs)}:${format(msec)}`;
  millisecondsDisplay.textContent = format(msec);
}

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
});

function toggleTheme() {
  document.body.classList.toggle("light-mode", !darkMode);
  if (darkMode) {
    toggleModeBtn.innerHTML = `<span class="btn-text">☀️</span>`;
  } else {
    toggleModeBtn.innerHTML = `<span class="btn-text">🌙</span>`;
  }
}
