const timerDisplay = document.querySelector(".timerDisplay");
const startPauseBtn = document.getElementById("startPauseBtn");
const lapBtn = document.getElementById("lapBtn");
const resetBtn = document.getElementById("resetBtn");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");
const lapsList = document.getElementById("lapsList");
const historyList = document.getElementById("historyList");

let msec = 0, secs = 0, mins = 0;
let timerId = null;
let isRunning = false;
let laps = [];

// Load history from localStorage
window.onload = () => {
  const saved = JSON.parse(localStorage.getItem("stopwatchHistory")) || [];
  saved.forEach((session) => {
    const li = document.createElement("li");
    li.textContent = session;
    historyList.appendChild(li);
  });
};

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

lapBtn.addEventListener("click", () => {
  if (!isRunning) return;
  const time = `${format(mins)} : ${format(secs)} : ${format(msec)}`;
  laps.push(time);
  const li = document.createElement("li");
  li.textContent = `Lap ${laps.length}: ${time}`;
  lapsList.prepend(li);
});

clearHistoryBtn.addEventListener("click", () => {
  localStorage.removeItem("stopwatchHistory");
  historyList.innerHTML = "";
});

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

function format(num) {
  return num < 10 ? `0${num}` : num;
}

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
// minor update
// major update
// minor update
// major update
// minor update