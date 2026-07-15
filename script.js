const WORD_LENGTH = 5;
const MAX_TRIES = 6;

const boardEl = document.getElementById('board');
const keyboardEl = document.getElementById('keyboard');
const messageEl = document.getElementById('message');
const helpBtn = document.getElementById('help-btn');
const helpModal = document.getElementById('help-modal');
const closeHelp = document.getElementById('close-help');

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACK'],
];

let wordList = [];
let solution = '';
let currentGuess = '';
let guesses = [];
let statuses = [];
let gameOver = false;

function todaySeed() {
  const now = new Date();
  const start = new Date(2024, 0, 1);
  const diffDays = Math.floor((now - start) / (1000 * 60 * 60 * 24));
  return diffDays;
}

function stripAccents(str) {
  return str.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

async function loadWords() {
  const res = await fetch('words.csv');
  const text = await res.text();
  const lines = text.trim().split(/\r?\n/);
  lines.shift();
  wordList = lines
    .map((l) => stripAccents(l.trim().toUpperCase()))
    .filter((w) => w.length === WORD_LENGTH);
}

function pickSolution() {
  const seed = todaySeed();
  const index = seed % wordList.length;
  return wordList[index];
}

function storageKey() {
  return `motus-fr-${todaySeed()}`;
}

function loadState() {
  const raw = localStorage.getItem(storageKey());
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveState() {
  localStorage.setItem(
    storageKey(),
    JSON.stringify({ guesses, statuses, gameOver })
  );
}

function buildBoard() {
  boardEl.innerHTML = '';
  for (let r = 0; r < MAX_TRIES; r++) {
    const row = document.createElement('div');
    row.className = 'row';
    row.id = `row-${r}`;
    for (let c = 0; c < WORD_LENGTH; c++) {
      const tile = document.createElement('div');
      tile.className = 'tile';
      tile.id = `tile-${r}-${c}`;
      row.appendChild(tile);
    }
    boardEl.appendChild(row);
  }
}

function buildKeyboard() {
  keyboardEl.innerHTML = '';
  KEYBOARD_ROWS.forEach((rowKeys) => {
    const row = document.createElement('div');
    row.className = 'kb-row';
    rowKeys.forEach((key) => {
      const btn = document.createElement('button');
      btn.className = 'key';
      btn.dataset.key = key;
      if (key === 'ENTER' || key === 'BACK') btn.classList.add('wide');
      btn.textContent = key === 'ENTER' ? 'Entrer' : key === 'BACK' ? '←' : key;
      btn.addEventListener('click', () => handleKey(key));
      row.appendChild(btn);
    });
    keyboardEl.appendChild(row);
  });
}

function showMessage(text, duration = 2000) {
  messageEl.textContent = text;
  if (duration > 0) {
    setTimeout(() => {
      if (messageEl.textContent === text) messageEl.textContent = '';
    }, duration);
  }
}

function handleKey(key) {
  if (gameOver) return;
  if (key === 'ENTER') {
    submitGuess();
  } else if (key === 'BACK') {
    currentGuess = currentGuess.slice(0, -1);
    renderCurrentRow();
  } else if (/^[A-Z]$/.test(key) && currentGuess.length < WORD_LENGTH) {
    currentGuess += key;
    renderCurrentRow();
  }
}

function renderCurrentRow() {
  const r = guesses.length;
  for (let c = 0; c < WORD_LENGTH; c++) {
    const tile = document.getElementById(`tile-${r}-${c}`);
    const letter = currentGuess[c] || '';
    tile.textContent = letter;
    tile.classList.toggle('filled', !!letter);
  }
}

function shakeRow(r) {
  const row = document.getElementById(`row-${r}`);
  row.classList.add('shake');
  setTimeout(() => row.classList.remove('shake'), 400);
}

function evaluateGuess(guess, solution) {
  const result = new Array(WORD_LENGTH).fill('absent');
  const solChars = solution.split('');
  const guessChars = guess.split('');
  const used = new Array(WORD_LENGTH).fill(false);

  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guessChars[i] === solChars[i]) {
      result[i] = 'correct';
      used[i] = true;
      solChars[i] = null;
    }
  }
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (result[i] === 'correct') continue;
    const idx = solChars.indexOf(guessChars[i]);
    if (idx !== -1) {
      result[i] = 'present';
      solChars[idx] = null;
    }
  }
  return result;
}

function updateKeyboardStatus(guess, result) {
  const priority = { absent: 0, present: 1, correct: 2 };
  for (let i = 0; i < WORD_LENGTH; i++) {
    const key = guess[i];
    const btn = keyboardEl.querySelector(`[data-key="${key}"]`);
    if (!btn) continue;
    const current = btn.dataset.status;
    if (!current || priority[result[i]] > priority[current]) {
      btn.dataset.status = result[i];
      btn.classList.remove('correct', 'present', 'absent');
      btn.classList.add(result[i]);
    }
  }
}

function renderRow(r, guess, result) {
  for (let c = 0; c < WORD_LENGTH; c++) {
    const tile = document.getElementById(`tile-${r}-${c}`);
    tile.textContent = guess[c];
    tile.classList.add('filled');
    setTimeout(() => {
      tile.classList.add(result[c]);
    }, c * 200);
  }
}

function submitGuess() {
  if (currentGuess.length !== WORD_LENGTH) {
    showMessage('Pas assez de lettres');
    shakeRow(guesses.length);
    return;
  }
  if (!wordList.includes(currentGuess)) {
    showMessage('Mot inconnu');
    shakeRow(guesses.length);
    return;
  }

  const result = evaluateGuess(currentGuess, solution);
  const r = guesses.length;
  renderRow(r, currentGuess, result);
  updateKeyboardStatus(currentGuess, result);

  guesses.push(currentGuess);
  statuses.push(result);

  if (currentGuess === solution) {
    gameOver = true;
    saveState();
    setTimeout(() => showMessage('Bravo !', 5000), 1200);
  } else if (guesses.length === MAX_TRIES) {
    gameOver = true;
    saveState();
    setTimeout(() => showMessage(`Le mot etait : ${solution}`, 8000), 1200);
  } else {
    saveState();
  }

  currentGuess = '';
}

function restoreState(state) {
  guesses = state.guesses;
  statuses = state.statuses;
  gameOver = state.gameOver;
  for (let r = 0; r < guesses.length; r++) {
    renderRowInstant(r, guesses[r], statuses[r]);
    updateKeyboardStatus(guesses[r], statuses[r]);
  }
  if (gameOver) {
    if (guesses[guesses.length - 1] === solution) {
      showMessage('Bravo !', 5000);
    } else {
      showMessage(`Le mot etait : ${solution}`, 8000);
    }
  }
}

function renderRowInstant(r, guess, result) {
  for (let c = 0; c < WORD_LENGTH; c++) {
    const tile = document.getElementById(`tile-${r}-${c}`);
    tile.textContent = guess[c];
    tile.classList.add('filled', result[c]);
  }
}

function handlePhysicalKey(e) {
  if (helpModal && !helpModal.classList.contains('hidden')) return;
  const key = e.key.toUpperCase();
  if (key === 'ENTER') handleKey('ENTER');
  else if (key === 'BACKSPACE') handleKey('BACK');
  else if (/^[A-Z]$/.test(key)) handleKey(key);
}

async function init() {
  buildBoard();
  buildKeyboard();
  await loadWords();
  solution = pickSolution();

  const state = loadState();
  if (state) {
    restoreState(state);
  }

  document.addEventListener('keydown', handlePhysicalKey);
  helpBtn.addEventListener('click', () => helpModal.classList.remove('hidden'));
  closeHelp.addEventListener('click', () => helpModal.classList.add('hidden'));
  helpModal.addEventListener('click', (e) => {
    if (e.target === helpModal) helpModal.classList.add('hidden');
  });
}

init();
