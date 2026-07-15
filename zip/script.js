const GRID_SIZE = 6;
const MIN_CHECKPOINTS = 5;
const MAX_CHECKPOINTS = 8;

const boardEl = document.getElementById('board');
const messageEl = document.getElementById('message');
const timerEl = document.getElementById('timer');
const progressEl = document.getElementById('progress');
const undoBtn = document.getElementById('undo-btn');
const helpBtn = document.getElementById('help-btn');
const helpModal = document.getElementById('help-modal');
const closeHelp = document.getElementById('close-help');
const newGameArea = document.getElementById('new-game-area');
const newGameBtn = document.getElementById('new-game-btn');

let numbers = []; // numbers[cellIndex] = checkpoint number or 0
let totalCheckpoints = 0;
let path = [];
let elapsed = 0;
let timerId = null;
let gameOver = false;
let dragging = false;

function idx(r, c) {
  return r * GRID_SIZE + c;
}

function coords(i) {
  return [Math.floor(i / GRID_SIZE), i % GRID_SIZE];
}

function neighbors(i) {
  const [r, c] = coords(i);
  const result = [];
  for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
    const nr = r + dr;
    const nc = c + dc;
    if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
      result.push(idx(nr, nc));
    }
  }
  return result;
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Randomized Warnsdorff-style Hamiltonian path search with backtracking.
function generateHamiltonianPath() {
  const total = GRID_SIZE * GRID_SIZE;
  for (let attempt = 0; attempt < 60; attempt++) {
    const start = Math.floor(Math.random() * total);
    const visited = new Set([start]);
    const path = [start];
    if (search(path, visited, total)) return path;
  }
  return null;
}

function search(path, visited, total) {
  if (path.length === total) return true;
  const last = path[path.length - 1];
  const options = neighbors(last).filter((n) => !visited.has(n));
  const scored = options.map((n) => {
    const onward = neighbors(n).filter((m) => !visited.has(m)).length;
    return { n, onward };
  });
  scored.sort((a, b) => a.onward - b.onward);
  // Group by onward count and shuffle within each group to keep randomness
  // while still favoring the Warnsdorff heuristic (fewest onward moves first).
  const grouped = [];
  let i = 0;
  while (i < scored.length) {
    let j = i;
    while (j < scored.length && scored[j].onward === scored[i].onward) j++;
    grouped.push(...shuffle(scored.slice(i, j)));
    i = j;
  }
  for (const { n } of grouped) {
    visited.add(n);
    path.push(n);
    if (search(path, visited, total)) return true;
    path.pop();
    visited.delete(n);
  }
  return false;
}

function pickCheckpointIndices(pathLength) {
  const count = Math.min(
    pathLength,
    MIN_CHECKPOINTS + Math.floor(Math.random() * (MAX_CHECKPOINTS - MIN_CHECKPOINTS + 1))
  );
  const indices = new Set([0, pathLength - 1]);
  while (indices.size < count) {
    indices.add(1 + Math.floor(Math.random() * (pathLength - 2)));
  }
  return Array.from(indices).sort((a, b) => a - b);
}

function generatePuzzle() {
  const solutionPath = generateHamiltonianPath();
  const total = GRID_SIZE * GRID_SIZE;
  numbers = new Array(total).fill(0);
  const checkpointIndices = pickCheckpointIndices(solutionPath.length);
  checkpointIndices.forEach((pathIdx, order) => {
    numbers[solutionPath[pathIdx]] = order + 1;
  });
  totalCheckpoints = checkpointIndices.length;
}

function buildBoard() {
  boardEl.innerHTML = '';
  boardEl.style.gridTemplateColumns = `repeat(${GRID_SIZE}, 1fr)`;
  boardEl.style.gridTemplateRows = `repeat(${GRID_SIZE}, 1fr)`;
  for (let i = 0; i < numbers.length; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.id = `cell-${i}`;
    if (numbers[i]) {
      const num = document.createElement('span');
      num.className = 'num';
      num.textContent = numbers[i];
      cell.appendChild(num);
    }
    cell.addEventListener('mousedown', (e) => {
      e.preventDefault();
      handleStart(i);
    });
    cell.addEventListener('mouseenter', () => {
      if (dragging) handleExtend(i);
    });
    cell.addEventListener('touchstart', (e) => {
      e.preventDefault();
      handleStart(i);
    }, { passive: false });
    boardEl.appendChild(cell);
  }
}

function cellFromTouch(touch) {
  const el = document.elementFromPoint(touch.clientX, touch.clientY);
  if (!el) return null;
  const cellEl = el.closest('.cell');
  if (!cellEl) return null;
  return parseInt(cellEl.id.replace('cell-', ''), 10);
}

document.addEventListener('touchmove', (e) => {
  if (!dragging) return;
  e.preventDefault();
  const touch = e.touches[0];
  const i = cellFromTouch(touch);
  if (i !== null) handleExtend(i);
}, { passive: false });

document.addEventListener('mouseup', () => {
  dragging = false;
});

document.addEventListener('touchend', () => {
  dragging = false;
});

function nextExpectedNumber() {
  let maxSeen = 0;
  for (const i of path) {
    if (numbers[i] > maxSeen) maxSeen = numbers[i];
  }
  return maxSeen + 1;
}

function canExtendTo(i) {
  if (gameOver) return false;
  if (path.length === 0) return numbers[i] === 1;
  const last = path[path.length - 1];
  if (path.includes(i)) return false;
  if (!neighbors(last).includes(i)) return false;
  if (numbers[i] && numbers[i] !== nextExpectedNumber()) return false;
  return true;
}

function handleStart(i) {
  if (gameOver) return;
  if (path.length === 0) {
    if (numbers[i] === 1) {
      path.push(i);
      dragging = true;
      render();
    }
    return;
  }
  if (path[path.length - 1] === i) {
    // Pressing the current head retreats one step; dragging onward re-extends.
    path.pop();
    dragging = true;
    render();
    return;
  }
  if (canExtendTo(i)) {
    path.push(i);
    dragging = true;
    render();
    checkWin();
  }
}

function handleExtend(i) {
  if (gameOver || path.length === 0) return;
  if (path.length >= 2 && path[path.length - 2] === i) {
    path.pop();
    render();
    return;
  }
  if (canExtendTo(i)) {
    path.push(i);
    render();
    checkWin();
  }
}

function render() {
  for (let i = 0; i < numbers.length; i++) {
    const cell = document.getElementById(`cell-${i}`);
    const inPath = path.includes(i);
    cell.classList.toggle('path', inPath);
    cell.classList.toggle('head', path.length > 0 && path[path.length - 1] === i);
  }
  progressEl.textContent = `${path.length}/${numbers.length}`;
}

function checkWin() {
  if (path.length === numbers.length) {
    gameOver = true;
    clearInterval(timerId);
    showMessage(`Bravo ! Terminé en ${formatTime(elapsed)}`, 0);
    newGameArea.classList.remove('hidden');
  }
}

function showMessage(text, duration = 1800) {
  messageEl.textContent = text;
  if (duration > 0) {
    setTimeout(() => {
      if (messageEl.textContent === text) messageEl.textContent = '';
    }, duration);
  }
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function tick() {
  elapsed++;
  timerEl.textContent = formatTime(elapsed);
}

function clearPath() {
  path = [];
  render();
}

function startNewGame() {
  generatePuzzle();
  path = [];
  elapsed = 0;
  gameOver = false;
  dragging = false;
  buildBoard();
  render();
  timerEl.textContent = formatTime(elapsed);
  messageEl.textContent = '';
  newGameArea.classList.add('hidden');
  clearInterval(timerId);
  timerId = setInterval(tick, 1000);
}

function init() {
  startNewGame();
  undoBtn.addEventListener('click', clearPath);
  helpBtn.addEventListener('click', () => helpModal.classList.remove('hidden'));
  closeHelp.addEventListener('click', () => helpModal.classList.add('hidden'));
  helpModal.addEventListener('click', (e) => {
    if (e.target === helpModal) helpModal.classList.add('hidden');
  });
  newGameBtn.addEventListener('click', startNewGame);
}

init();
</content>
