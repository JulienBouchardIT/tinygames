const N = 7;
const REGION_COLORS = [
  '#f2b6c1', '#f7d489', '#a6d189', '#89c4f4',
  '#c3a1e1', '#f4a26c', '#8fd6c9',
];

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

let region = []; // region[row][col] = region id
let state = []; // state[row][col] = 0 empty, 1 mark, 2 queen
let elapsed = 0;
let timerId = null;
let gameOver = false;

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generatePermutation() {
  for (let attempt = 0; attempt < 200; attempt++) {
    const perm = new Array(N).fill(-1);
    const usedCols = new Set();
    if (place(0, perm, usedCols)) return perm;
  }
  return null;
}

function place(row, perm, usedCols) {
  if (row === N) return true;
  const cols = shuffle(Array.from({ length: N }, (_, i) => i));
  for (const c of cols) {
    if (usedCols.has(c)) continue;
    if (row > 0 && Math.abs(c - perm[row - 1]) <= 1) continue;
    perm[row] = c;
    usedCols.add(c);
    if (place(row + 1, perm, usedCols)) return true;
    usedCols.delete(c);
    perm[row] = -1;
  }
  return false;
}

// Grows regions one cell at a time, picking uniformly among all frontier cells
// across every region (rather than round-robin per region). This lets regions
// interlock into irregular, winding shapes, which constrains the puzzle far
// more tightly than blocky round-robin growth (fewer alternate solutions).
function growRegions(perm) {
  const reg = Array.from({ length: N }, () => new Array(N).fill(-1));
  for (let r = 0; r < N; r++) {
    reg[r][perm[r]] = r;
  }
  let remaining = N * N - N;
  while (remaining > 0) {
    const candidates = [];
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (reg[r][c] === -1) continue;
        for (const [dr, dc] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < N && nc >= 0 && nc < N && reg[nr][nc] === -1) {
            candidates.push([reg[r][c], nr, nc]);
          }
        }
      }
    }
    if (candidates.length === 0) break;
    const [rg, nr, nc] = candidates[Math.floor(Math.random() * candidates.length)];
    reg[nr][nc] = rg;
    remaining--;
  }
  return reg;
}

function countSolutions(reg, limit) {
  const colUsed = new Array(N).fill(false);
  const regionUsed = new Array(N).fill(false);
  let count = 0;
  function backtrack(row, prevCol) {
    if (count >= limit) return;
    if (row === N) {
      count++;
      return;
    }
    for (let c = 0; c < N; c++) {
      if (colUsed[c]) continue;
      if (prevCol !== -1 && Math.abs(c - prevCol) <= 1) continue;
      const rg = reg[row][c];
      if (regionUsed[rg]) continue;
      colUsed[c] = true;
      regionUsed[rg] = true;
      backtrack(row + 1, c);
      colUsed[c] = false;
      regionUsed[rg] = false;
      if (count >= limit) return;
    }
  }
  backtrack(0, -1);
  return count;
}

function generatePuzzle() {
  let best = null;
  let bestCount = Infinity;
  for (let attempt = 0; attempt < 40; attempt++) {
    const perm = generatePermutation();
    if (!perm) continue;
    const reg = growRegions(perm);
    const solutions = countSolutions(reg, 50);
    if (solutions < bestCount) {
      best = reg;
      bestCount = solutions;
    }
    if (solutions === 1) break;
  }
  region = best;
}

function buildBoard() {
  boardEl.innerHTML = '';
  boardEl.style.gridTemplateColumns = `repeat(${N}, 1fr)`;
  boardEl.style.gridTemplateRows = `repeat(${N}, 1fr)`;
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.id = `cell-${r}-${c}`;
      cell.style.background = REGION_COLORS[region[r][c] % REGION_COLORS.length];
      cell.addEventListener('click', () => handleClick(r, c));
      boardEl.appendChild(cell);
    }
  }
}

function handleClick(r, c) {
  if (gameOver) return;
  state[r][c] = (state[r][c] + 1) % 3;
  render();
  checkWin();
}

function queenPositions() {
  const positions = [];
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (state[r][c] === 2) positions.push([r, c]);
    }
  }
  return positions;
}

function computeConflicts() {
  const positions = queenPositions();
  const conflicts = new Set();
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const [r1, c1] = positions[i];
      const [r2, c2] = positions[j];
      const sameRow = r1 === r2;
      const sameCol = c1 === c2;
      const sameRegion = region[r1][c1] === region[r2][c2];
      const adjacent = Math.abs(r1 - r2) <= 1 && Math.abs(c1 - c2) <= 1;
      if (sameRow || sameCol || sameRegion || adjacent) {
        conflicts.add(`${r1}-${c1}`);
        conflicts.add(`${r2}-${c2}`);
      }
    }
  }
  return conflicts;
}

function render() {
  const conflicts = computeConflicts();
  let queenCount = 0;
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const cell = document.getElementById(`cell-${r}-${c}`);
      const v = state[r][c];
      cell.classList.toggle('mark', v === 1);
      cell.classList.toggle('queen', v === 2);
      cell.classList.toggle('conflict', v === 2 && conflicts.has(`${r}-${c}`));
      if (v === 2) queenCount++;
    }
  }
  progressEl.textContent = `${queenCount}/${N}`;
}

function checkWin() {
  const positions = queenPositions();
  if (positions.length !== N) return;
  const conflicts = computeConflicts();
  if (conflicts.size > 0) return;
  gameOver = true;
  clearInterval(timerId);
  Coins.add(15);
  showMessage(`Bravo ! Terminé en ${formatTime(elapsed)}`, 0);
  newGameArea.classList.remove('hidden');
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

function clearBoard() {
  state = Array.from({ length: N }, () => new Array(N).fill(0));
  render();
}

function startNewGame() {
  generatePuzzle();
  state = Array.from({ length: N }, () => new Array(N).fill(0));
  elapsed = 0;
  gameOver = false;
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
  undoBtn.addEventListener('click', clearBoard);
  helpBtn.addEventListener('click', () => helpModal.classList.remove('hidden'));
  closeHelp.addEventListener('click', () => helpModal.classList.add('hidden'));
  helpModal.addEventListener('click', (e) => {
    if (e.target === helpModal) helpModal.classList.add('hidden');
  });
  newGameBtn.addEventListener('click', startNewGame);
}

init();
