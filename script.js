const timerDisplay = document.querySelector(".timerDisplay");
const startPauseBtn = document.getElementById("startPauseBtn");
const lapBtn = document.getElementById("lapBtn");
const resetBtn = document.getElementById("resetBtn");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");
const lapsList = document.getElementById("lapsList");
const historyList = document.getElementById("historyList");
const toggleModeBtn = document.getElementById("toggleModeBtn");

let msec = 0, secs = 0, mins = 0;
let timerId = null;
let isRunning = false;
let laps = [];
let darkMode = true; // start in dark mode

// Load history from localStorage
window.onload = () => {
  const saved = JSON.parse(localStorage.getItem("stopwatchHistory")) || [];
  saved.forEach((session) => {
    const li = document.createElement("li");
    li.textContent = session;
    historyList.appendChild(li);
  });
};

// Start/Pause Timer
startPauseBtn.addEventListener("click", () => {
  if (!isRunning) {
    timerId = setInterval(startTimer, 10);
    startPauseBtn.textContent = "Pause";
    startPauseBtn.style.backgroundColor = "#f59e0b";
    isRunning = true;
  } else {
    clearInterval(timerId);
    startPauseBtn.textContent = "Resume";
    startPauseBtn.style.backgroundColor = "#22c55e";
    isRunning = false;
  }
});

// Reset Timer
resetBtn.addEventListener("click", () => {
  clearInterval(timerId);
  storeSession();
  msec = secs = mins = 0;
  timerDisplay.textContent = "00 : 00 : 00";
  laps = [];
  lapsList.innerHTML = "";
  startPauseBtn.textContent = "Start";
  startPauseBtn.style.backgroundColor = "#22c55e";
  isRunning = false;
});

// Record Lap
lapBtn.addEventListener("click", () => {
  if (!isRunning) return;
  const time = `${format(mins)} : ${format(secs)} : ${format(msec)}`;
  laps.push(time);
  const li = document.createElement("li");
  li.textContent = `Lap ${laps.length}: ${time}`;
  lapsList.prepend(li);
});

// Clear History
clearHistoryBtn.addEventListener("click", () => {
  localStorage.removeItem("stopwatchHistory");
  historyList.innerHTML = "";
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
  timerDisplay.textContent = `${format(mins)} : ${format(secs)} : ${format(msec)}`;
}

// Format number
function format(num) {
  return num < 10 ? `0${num}` : num;
}

// Save session
function storeSession() {
  if (mins === 0 && secs === 0 && msec === 0) return;
  const total = `${format(mins)} : ${format(secs)} : ${format(msec)}`;
  const saved = JSON.parse(localStorage.getItem("stopwatchHistory")) || [];
  saved.unshift(total);
  localStorage.setItem("stopwatchHistory", JSON.stringify(saved));
  const li = document.createElement("li");
  li.textContent = total;
  historyList.prepend(li);
}

// Dark/Light Mode Toggle
toggleModeBtn.addEventListener("click", () => {
  darkMode = !darkMode;
  if (darkMode) {
    document.body.style.background = "radial-gradient(circle at top, #0f172a, #1e293b, #111827)";
    document.body.style.color = "#fff";
    timerDisplay.style.color = "#e0f2fe";
    document.querySelectorAll('.laps h2, .history h2').forEach(el => el.style.color = "#00e0ff");
    document.querySelectorAll('.laps, .history').forEach(el => el.style.background = "rgba(255,255,255,0.05)");
  } else {
    document.body.style.background = "radial-gradient(circle at top, #f0f0f0, #e0e0e0, #cccccc)";
    document.body.style.color = "#111";
    timerDisplay.style.color = "#111";
    document.querySelectorAll('.laps h2, .history h2').forEach(el => el.style.color = "#0a0a0a");
    document.querySelectorAll('.laps, .history').forEach(el => el.style.background = "rgba(0,0,0,0.05)");
  }
});
// check for dark mode
// if dark mode is true, then set the background to dark mode
// if dark mode is false, then set the background to light mode
// if dark mode is true, then set the text color to white
// if dark mode is false, then set the text color to black
// if dark mode is true, then set the laps h2 and history h2 color to blue
// if dark mode is false, then set the laps h2 and history h2 color to black
// if dark mode is true, then set the laps and history background to dark mode
// if dark mode is false, then set the laps and history background to light mode
// if dark mode is true, then set the laps and history border to dark mode
