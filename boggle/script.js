const GRID_SIZE = 5;
const MIN_WORD_LENGTH = 3;
const MAX_WORD_LENGTH = 8;
const GAME_DURATION = 180;
const WORDS_TO_PLANT = 18;

const LETTER_POOL =
  'AAAAAAABBCCCDDDEEEEEEEEEEEEEEEFFGGHHIIIIIIILLLLLMMMNNNNNNNOOOOOPPPQRRRRRRSSSSSSSTTTTTTTUUUUUUVVXYZ';

const boardEl = document.getElementById('board');
const messageEl = document.getElementById('message');
const timerEl = document.getElementById('timer');
const scoreEl = document.getElementById('score');
const currentWordEl = document.getElementById('current-word');
const undoBtn = document.getElementById('undo-btn');
const submitBtn = document.getElementById('submit-btn');
const foundListEl = document.getElementById('found-list');
const foundCountEl = document.getElementById('found-count');
const helpBtn = document.getElementById('help-btn');
const helpModal = document.getElementById('help-modal');
const closeHelp = document.getElementById('close-help');
const newGameArea = document.getElementById('new-game-area');
const newGameBtn = document.getElementById('new-game-btn');

let wordList = [];
let grid = [];
let path = [];
let foundWords = [];
let totalScore = 0;
let timeLeft = GAME_DURATION;
let timerId = null;
let gameOver = false;

function stripAccents(str) {
  return str.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

async function loadWords() {
  const res = await fetch('words.txt');
  const text = await res.text();
  const lines = text.trim().split(/\r?\n/);
  wordList = lines
    .map((l) => stripAccents(l.trim().toUpperCase()))
    .filter((w) => w.length >= MIN_WORD_LENGTH && w.length <= MAX_WORD_LENGTH);
}

function wordScore(length) {
  if (length <= 4) return 1;
  if (length === 5) return 2;
  if (length === 6) return 3;
  if (length === 7) return 5;
  return 11;
}

function idx(r, c) {
  return r * GRID_SIZE + c;
}

function coords(i) {
  return [Math.floor(i / GRID_SIZE), i % GRID_SIZE];
}

function neighbors(i) {
  const [r, c] = coords(i);
  const result = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
        result.push(idx(nr, nc));
      }
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

function tryPlantWord(cells, word) {
  const startCandidates = shuffle(
    Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => i)
  );
  for (const start of startCandidates) {
    if (cells[start] !== null && cells[start] !== word[0]) continue;
    const wordPath = [start];
    const used = new Set(wordPath);
    let ok = true;
    for (let i = 1; i < word.length; i++) {
      const candidates = shuffle(neighbors(wordPath[i - 1])).filter(
        (n) => !used.has(n) && (cells[n] === null || cells[n] === word[i])
      );
      if (candidates.length === 0) {
        ok = false;
        break;
      }
      wordPath.push(candidates[0]);
      used.add(candidates[0]);
    }
    if (ok) {
      wordPath.forEach((cellIdx, i) => {
        cells[cellIdx] = word[i];
      });
      return true;
    }
  }
  return false;
}

function generateGrid() {
  const cells = new Array(GRID_SIZE * GRID_SIZE).fill(null);
  // Favor shorter words first: they are easier to fit and guarantee a playable board.
  const candidates = shuffle(wordList)
    .slice(0, WORDS_TO_PLANT * 6)
    .sort((a, b) => a.length - b.length);
  let planted = 0;
  for (const word of candidates) {
    if (planted >= WORDS_TO_PLANT) break;
    if (tryPlantWord(cells, word)) planted++;
  }
  for (let i = 0; i < cells.length; i++) {
    if (cells[i] === null) {
      cells[i] = LETTER_POOL[Math.floor(Math.random() * LETTER_POOL.length)];
    }
  }
  return cells;
}

function buildBoard() {
  boardEl.innerHTML = '';
  for (let i = 0; i < grid.length; i++) {
    const tile = document.createElement('div');
    tile.className = 'tile';
    tile.id = `tile-${i}`;
    tile.textContent = grid[i];
    tile.addEventListener('click', () => handleTileClick(i));
    boardEl.appendChild(tile);
  }
}

function updateTileStates() {
  for (let i = 0; i < grid.length; i++) {
    const tile = document.getElementById(`tile-${i}`);
    const selected = path.includes(i);
    tile.classList.toggle('selected', selected);
    const last = path[path.length - 1];
    const canSelect =
      !selected && (path.length === 0 || neighbors(last).includes(i));
    tile.classList.toggle('disabled', selected ? false : !canSelect);
  }
}

function handleTileClick(i) {
  if (gameOver) return;
  if (path.includes(i)) {
    if (i === path[path.length - 1]) {
      path.pop();
    }
    updateWordDisplay();
    updateTileStates();
    return;
  }
  const last = path[path.length - 1];
  if (path.length > 0 && !neighbors(last).includes(i)) return;
  if (path.length >= MAX_WORD_LENGTH) return;
  path.push(i);
  updateWordDisplay();
  updateTileStates();
}

function updateWordDisplay() {
  currentWordEl.textContent = path.map((i) => grid[i]).join('');
}

function clearPath() {
  path = [];
  updateWordDisplay();
  updateTileStates();
}

function showMessage(text, duration = 1800) {
  messageEl.textContent = text;
  if (duration > 0) {
    setTimeout(() => {
      if (messageEl.textContent === text) messageEl.textContent = '';
    }, duration);
  }
}

function submitWord() {
  if (gameOver) return;
  const word = path.map((i) => grid[i]).join('');
  if (word.length < MIN_WORD_LENGTH) {
    showMessage(`Le mot doit faire au moins ${MIN_WORD_LENGTH} lettres`);
    return;
  }
  if (foundWords.includes(word)) {
    showMessage('Deja trouve');
    clearPath();
    return;
  }
  if (!wordList.includes(word)) {
    showMessage('Mot inconnu');
    clearPath();
    return;
  }
  foundWords.push(word);
  totalScore += wordScore(word.length);
  renderFoundWords();
  showMessage(`+${wordScore(word.length)} point(s) !`);
  clearPath();
}

function renderFoundWords() {
  foundListEl.innerHTML = '';
  foundWords.forEach((w) => {
    const li = document.createElement('li');
    li.textContent = w;
    foundListEl.appendChild(li);
  });
  foundCountEl.textContent = foundWords.length;
  scoreEl.textContent = totalScore;
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function tick() {
  timeLeft--;
  timerEl.textContent = formatTime(Math.max(timeLeft, 0));
  if (timeLeft <= 0) {
    endGame();
  }
}

function endGame() {
  gameOver = true;
  clearInterval(timerId);
  clearPath();
  boardEl.querySelectorAll('.tile').forEach((tile) => {
    tile.classList.add('disabled');
  });
  submitBtn.disabled = true;
  undoBtn.disabled = true;
  showMessage(`Termine ! ${foundWords.length} mot(s), ${totalScore} point(s)`, 6000);
  newGameArea.classList.remove('hidden');
}

function startNewGame() {
  grid = generateGrid();
  path = [];
  foundWords = [];
  totalScore = 0;
  timeLeft = GAME_DURATION;
  gameOver = false;
  buildBoard();
  updateWordDisplay();
  renderFoundWords();
  timerEl.textContent = formatTime(timeLeft);
  messageEl.textContent = '';
  submitBtn.disabled = false;
  undoBtn.disabled = false;
  newGameArea.classList.add('hidden');
  clearInterval(timerId);
  timerId = setInterval(tick, 1000);
}

async function init() {
  await loadWords();
  startNewGame();

  submitBtn.addEventListener('click', submitWord);
  undoBtn.addEventListener('click', clearPath);
  document.addEventListener('keydown', (e) => {
    if (helpModal && !helpModal.classList.contains('hidden')) return;
    if (e.key === 'Enter') submitWord();
    if (e.key === 'Backspace') {
      path.pop();
      updateWordDisplay();
      updateTileStates();
    }
  });
  helpBtn.addEventListener('click', () => helpModal.classList.remove('hidden'));
  closeHelp.addEventListener('click', () => helpModal.classList.add('hidden'));
  helpModal.addEventListener('click', (e) => {
    if (e.target === helpModal) helpModal.classList.add('hidden');
  });
  newGameBtn.addEventListener('click', startNewGame);
}

init();
