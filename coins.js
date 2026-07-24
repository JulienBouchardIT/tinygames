// Shared coin balance across all games, persisted in localStorage.
(function () {
  const STORAGE_KEY = 'tinygames-coins';
  const STARTING_COINS = 100;

  function readCoins() {
    const raw = localStorage.getItem(STORAGE_KEY);
    const n = raw === null ? STARTING_COINS : parseInt(raw, 10);
    return Number.isFinite(n) && n >= 0 ? n : STARTING_COINS;
  }

  function renderBadge(n) {
    const el = document.getElementById('coin-count');
    if (el) el.textContent = String(n);
  }

  function writeCoins(n) {
    const clamped = Math.max(0, Math.floor(n));
    localStorage.setItem(STORAGE_KEY, String(clamped));
    renderBadge(clamped);
    return clamped;
  }

  window.Coins = {
    STORAGE_KEY,
    get: readCoins,
    set: (n) => writeCoins(n),
    add: (n) => writeCoins(readCoins() + n),
    spend: (n) => {
      if (readCoins() < n) return false;
      writeCoins(readCoins() - n);
      return true;
    },
  };

  function init() {
    renderBadge(readCoins());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) renderBadge(readCoins());
  });
})();
