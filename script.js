const ballsContainer = document.querySelector("#balls");
const pickButton = document.querySelector("#pickButton");
const copyButton = document.querySelector("#copyButton");
const clearButton = document.querySelector("#clearButton");
const historyContainer = document.querySelector("#history");
const emptyHistory = document.querySelector("#emptyHistory");
const toast = document.querySelector("#toast");

const STORAGE_KEY = "lucky-pick-history";
let currentNumbers = [3, 11, 19, 27, 34, 42];
let history = loadHistory();
let toastTimer;

const ballClass = (number) => {
  if (number <= 10) return "ball-yellow";
  if (number <= 20) return "ball-blue";
  if (number <= 30) return "ball-red";
  if (number <= 40) return "ball-gray";
  return "ball-green";
};

function secureRandom(max) {
  const values = new Uint32Array(1);
  const limit = Math.floor(0x100000000 / max) * max;
  let value;
  do {
    crypto.getRandomValues(values);
    value = values[0];
  } while (value >= limit);
  return value % max;
}

function generateNumbers() {
  const pool = Array.from({ length: 45 }, (_, index) => index + 1);
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = secureRandom(i + 1);
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 6).sort((a, b) => a - b);
}

function renderBalls(numbers, animate = false) {
  ballsContainer.innerHTML = numbers
    .map(
      (number, index) =>
        `<span class="ball ${ballClass(number)}${animate ? " pop" : ""}" style="animation-delay:${index * 55}ms">${number}</span>`,
    )
    .join("");
  ballsContainer.setAttribute("aria-label", `추천 번호 ${numbers.join(", ")}`);
}

function loadHistory() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved.slice(0, 5) : [];
  } catch {
    return [];
  }
}

function saveHistory() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

function renderHistory() {
  emptyHistory.hidden = history.length > 0;
  historyContainer.innerHTML = history
    .map(
      (item) => `<div class="history-item">
        <div class="history-numbers">
          ${item.numbers.map((number) => `<span class="mini-ball ${ballClass(number)}">${number}</span>`).join("")}
        </div>
        <time class="history-time">${item.time}</time>
      </div>`,
    )
    .join("");
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 1800);
}

function pickNumbers() {
  currentNumbers = generateNumbers();
  renderBalls(currentNumbers, true);
  const time = new Intl.DateTimeFormat("ko-KR", { hour: "2-digit", minute: "2-digit" }).format(new Date());
  history = [{ numbers: currentNumbers, time }, ...history].slice(0, 5);
  saveHistory();
  renderHistory();
}

async function copyNumbers() {
  const text = `로또 추천 번호: ${currentNumbers.join(", ")}`;
  try {
    await navigator.clipboard.writeText(text);
    showToast("번호를 복사했어요!");
  } catch {
    showToast(`추천 번호: ${currentNumbers.join(", ")}`);
  }
}

pickButton.addEventListener("click", pickNumbers);
copyButton.addEventListener("click", copyNumbers);
clearButton.addEventListener("click", () => {
  history = [];
  saveHistory();
  renderHistory();
  showToast("기록을 지웠어요.");
});

document.querySelector("#today").textContent = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "long",
  day: "numeric",
  weekday: "long",
}).format(new Date());

renderHistory();
