const arena = document.querySelector("#arena");
const target = document.querySelector("#target");
const startScreen = document.querySelector("#startScreen");
const startButton = document.querySelector("#startButton");
const screenTitle = document.querySelector("#screenTitle");
const screenCopy = document.querySelector("#screenCopy");
const scoreElement = document.querySelector("#score");
const timeElement = document.querySelector("#time");
const bestElement = document.querySelector("#best");
const missesElement = document.querySelector("#misses");
const hitsElement = document.querySelector("#hits");
const comboElement = document.querySelector("#combo");
const flashScore = document.querySelector("#flashScore");

const DURATION = 30;
let score = 0;
let combo = 0;
let hits = 0;
let misses = 0;
let playing = false;
let deadline = 0;
let frameId;
let targetTimer;
let best = Number(localStorage.getItem("neon-tap-best")) || 0;

bestElement.textContent = pad(best);

function pad(value) { return String(value).padStart(4, "0"); }

function randomBetween(min, max) {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return min + (array[0] / 0xffffffff) * (max - min);
}

function moveTarget() {
  if (!playing) return;
  const rect = arena.getBoundingClientRect();
  const margin = 48;
  target.style.left = `${randomBetween(margin, rect.width - margin)}px`;
  target.style.top = `${randomBetween(margin, rect.height - margin)}px`;
  target.classList.remove("visible");
  void target.offsetWidth;
  target.classList.add("visible");
  clearTimeout(targetTimer);
  const visibleTime = Math.max(480, 1050 - hits * 12);
  targetTimer = setTimeout(() => {
    if (!playing) return;
    misses += 1;
    combo = 0;
    updateStats();
    moveTarget();
  }, visibleTime);
}

function updateStats() {
  scoreElement.textContent = pad(score);
  hitsElement.textContent = hits;
  missesElement.textContent = misses;
  comboElement.textContent = `COMBO ×${combo}`;
  comboElement.classList.toggle("show", combo >= 2);
}

function showPoints(points) {
  flashScore.textContent = `+${points}`;
  flashScore.style.left = target.style.left;
  flashScore.style.top = target.style.top;
  flashScore.classList.remove("show");
  void flashScore.offsetWidth;
  flashScore.classList.add("show");
}

function tick() {
  const remaining = Math.max(0, (deadline - performance.now()) / 1000);
  timeElement.textContent = remaining.toFixed(1).padStart(4, "0");
  if (remaining <= 5) timeElement.style.color = "var(--pink)";
  if (remaining <= 0) return endGame();
  frameId = requestAnimationFrame(tick);
}

function startGame() {
  score = 0; combo = 0; hits = 0; misses = 0;
  playing = true;
  deadline = performance.now() + DURATION * 1000;
  timeElement.style.color = "";
  startScreen.classList.add("hidden");
  updateStats();
  moveTarget();
  tick();
}

function endGame() {
  playing = false;
  cancelAnimationFrame(frameId);
  clearTimeout(targetTimer);
  target.classList.remove("visible");
  if (score > best) {
    best = score;
    localStorage.setItem("neon-tap-best", best);
    bestElement.textContent = pad(best);
    screenTitle.textContent = "새로운 최고 기록!";
  } else {
    screenTitle.textContent = "라운드 종료";
  }
  screenCopy.textContent = `${hits}개 명중 · ${misses}개 놓침 · 최종 ${score}점`;
  startButton.innerHTML = "다시 도전 <span>[ SPACE ]</span>";
  startScreen.classList.remove("hidden");
}

target.addEventListener("pointerdown", (event) => {
  event.stopPropagation();
  if (!playing) return;
  clearTimeout(targetTimer);
  combo += 1;
  hits += 1;
  const points = 10 + Math.min(40, (combo - 1) * 2);
  score += points;
  showPoints(points);
  updateStats();
  moveTarget();
});

arena.addEventListener("pointerdown", () => {
  if (!playing) return;
  misses += 1;
  combo = 0;
  score = Math.max(0, score - 5);
  updateStats();
});

startButton.addEventListener("click", (event) => {
  event.stopPropagation();
  startGame();
});
document.addEventListener("keydown", (event) => {
  if (event.code === "Space" && !playing) {
    event.preventDefault();
    startGame();
  }
});
