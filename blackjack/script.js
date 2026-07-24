const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const STARTING_BANKROLL = 1000;
const DEALER_STAND = 17;

const bankrollEl = document.getElementById('bankroll');
const betDisplayEl = document.getElementById('bet-display');
const messageEl = document.getElementById('message');
const dealerCardsEl = document.getElementById('dealer-cards');
const playerCardsEl = document.getElementById('player-cards');
const dealerTotalEl = document.getElementById('dealer-total');
const playerTotalEl = document.getElementById('player-total');
const betControls = document.getElementById('bet-controls');
const actionControls = document.getElementById('action-controls');
const newRoundArea = document.getElementById('new-round-area');
const dealBtn = document.getElementById('deal-btn');
const clearBetBtn = document.getElementById('clear-bet-btn');
const hitBtn = document.getElementById('hit-btn');
const standBtn = document.getElementById('stand-btn');
const doubleBtn = document.getElementById('double-btn');
const newRoundBtn = document.getElementById('new-round-btn');
const chipButtons = document.querySelectorAll('.chip');
const helpBtn = document.getElementById('help-btn');
const helpModal = document.getElementById('help-modal');
const closeHelp = document.getElementById('close-help');

let bankroll = STARTING_BANKROLL;
let bet = 0;
let currentBet = 0;
let deck = [];
let playerHand = [];
let dealerHand = [];
let dealerHoleHidden = false;
let phase = 'betting'; // betting | player | dealer | roundover

function buildDeck() {
  const cards = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      let value = 10;
      if (rank === 'A') value = 11;
      else if (rank !== 'J' && rank !== 'Q' && rank !== 'K') value = parseInt(rank, 10);
      cards.push({ rank, suit, value });
    }
  }
  return shuffle(cards);
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function drawCard() {
  if (deck.length === 0) deck = buildDeck();
  return deck.pop();
}

function calcHand(hand) {
  let total = 0;
  let aces = 0;
  for (const card of hand) {
    total += card.value;
    if (card.rank === 'A') aces++;
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
}

function isBlackjack(hand) {
  return hand.length === 2 && calcHand(hand) === 21;
}

function cardEl(card, faceDown) {
  const div = document.createElement('div');
  if (faceDown) {
    div.className = 'card back';
    return div;
  }
  const isRed = card.suit === '♥' || card.suit === '♦';
  div.className = 'card' + (isRed ? ' red' : '');
  div.innerHTML = `
    <span class="rank-top">${card.rank}${card.suit}</span>
    <span class="suit-center">${card.suit}</span>
    <span class="rank-bottom">${card.rank}${card.suit}</span>
  `;
  return div;
}

function renderHands() {
  playerCardsEl.innerHTML = '';
  playerHand.forEach((c) => playerCardsEl.appendChild(cardEl(c, false)));
  playerTotalEl.textContent = playerHand.length ? String(calcHand(playerHand)) : '';

  dealerCardsEl.innerHTML = '';
  dealerHand.forEach((c, i) => {
    const hide = dealerHoleHidden && i === 1;
    dealerCardsEl.appendChild(cardEl(c, hide));
  });
  if (dealerHand.length === 0) {
    dealerTotalEl.textContent = '';
  } else if (dealerHoleHidden) {
    dealerTotalEl.textContent = String(dealerHand[0].value);
  } else {
    dealerTotalEl.textContent = String(calcHand(dealerHand));
  }
}

function updateBankrollUI() {
  bankrollEl.textContent = String(bankroll);
  betDisplayEl.textContent = String(bet);
}

function updateChipState() {
  chipButtons.forEach((btn) => {
    const value = parseInt(btn.dataset.value, 10);
    btn.disabled = bet + value > bankroll;
  });
  dealBtn.disabled = bet <= 0 || bet > bankroll;
}

function showMessage(text) {
  messageEl.textContent = text;
}

function placeChip(value) {
  if (phase !== 'betting') return;
  if (bet + value > bankroll) return;
  bet += value;
  updateBankrollUI();
  updateChipState();
}

function clearBet() {
  if (phase !== 'betting') return;
  bet = 0;
  updateBankrollUI();
  updateChipState();
}

function setControlsForPhase() {
  betControls.classList.toggle('hidden', phase !== 'betting');
  actionControls.classList.toggle('hidden', phase !== 'player');
  newRoundArea.classList.toggle('hidden', phase !== 'roundover');
}

function startRound() {
  if (bet <= 0 || bet > bankroll) return;
  currentBet = bet;
  bankroll -= currentBet;
  bet = 0;
  deck = deck.length < 15 ? buildDeck() : deck;
  playerHand = [drawCard(), drawCard()];
  dealerHand = [drawCard(), drawCard()];
  dealerHoleHidden = true;
  phase = 'player';
  showMessage('');
  updateBankrollUI();
  renderHands();
  setControlsForPhase();
  doubleBtn.disabled = bankroll < currentBet;

  if (isBlackjack(playerHand)) {
    resolvePlayerBlackjack();
  }
}

function resolvePlayerBlackjack() {
  dealerHoleHidden = false;
  renderHands();
  if (isBlackjack(dealerHand)) {
    bankroll += currentBet;
    endRound('Egalite ! Deux blackjacks, mise remboursee.');
  } else {
    bankroll += Math.round(currentBet * 2.5);
    endRound('Blackjack ! Vous gagnez.');
  }
}

function hit() {
  if (phase !== 'player') return;
  playerHand.push(drawCard());
  renderHands();
  doubleBtn.disabled = true;
  const total = calcHand(playerHand);
  if (total > 21) {
    dealerHoleHidden = false;
    renderHands();
    endRound('Vous avez depasse 21. Perdu.');
  } else if (total === 21) {
    stand();
  }
}

function stand() {
  if (phase !== 'player') return;
  phase = 'dealer';
  setControlsForPhase();
  dealerHoleHidden = false;
  renderHands();
  setTimeout(dealerStep, 500);
}

function doubleDown() {
  if (phase !== 'player') return;
  if (playerHand.length !== 2 || bankroll < currentBet) return;
  bankroll -= currentBet;
  currentBet *= 2;
  updateBankrollUI();
  playerHand.push(drawCard());
  renderHands();
  const total = calcHand(playerHand);
  if (total > 21) {
    dealerHoleHidden = false;
    renderHands();
    endRound('Vous avez depasse 21. Perdu.');
  } else {
    stand();
  }
}

function dealerStep() {
  const total = calcHand(dealerHand);
  if (total < DEALER_STAND) {
    dealerHand.push(drawCard());
    renderHands();
    setTimeout(dealerStep, 500);
  } else {
    resolveDealerOutcome();
  }
}

function resolveDealerOutcome() {
  const playerTotal = calcHand(playerHand);
  const dealerTotal = calcHand(dealerHand);
  if (dealerTotal > 21) {
    bankroll += currentBet * 2;
    endRound('Le croupier depasse 21. Vous gagnez !');
  } else if (dealerTotal > playerTotal) {
    endRound('Le croupier gagne.');
  } else if (dealerTotal < playerTotal) {
    bankroll += currentBet * 2;
    endRound('Vous gagnez !');
  } else {
    bankroll += currentBet;
    endRound('Egalite, mise remboursee.');
  }
}

function endRound(text) {
  phase = 'roundover';
  showMessage(text);
  updateBankrollUI();
  setControlsForPhase();
  if (bankroll <= 0) {
    newRoundBtn.textContent = 'Recommencer (plus de jetons)';
  } else {
    newRoundBtn.textContent = 'Nouvelle manche';
  }
}

function newRound() {
  if (bankroll <= 0) {
    bankroll = STARTING_BANKROLL;
  }
  playerHand = [];
  dealerHand = [];
  dealerHoleHidden = false;
  bet = 0;
  currentBet = 0;
  phase = 'betting';
  showMessage('');
  updateBankrollUI();
  updateChipState();
  renderHands();
  setControlsForPhase();
}

function init() {
  deck = buildDeck();
  updateBankrollUI();
  updateChipState();
  setControlsForPhase();

  chipButtons.forEach((btn) => {
    btn.addEventListener('click', () => placeChip(parseInt(btn.dataset.value, 10)));
  });
  clearBetBtn.addEventListener('click', clearBet);
  dealBtn.addEventListener('click', startRound);
  hitBtn.addEventListener('click', hit);
  standBtn.addEventListener('click', stand);
  doubleBtn.addEventListener('click', doubleDown);
  newRoundBtn.addEventListener('click', newRound);
  helpBtn.addEventListener('click', () => helpModal.classList.remove('hidden'));
  closeHelp.addEventListener('click', () => helpModal.classList.add('hidden'));
  helpModal.addEventListener('click', (e) => {
    if (e.target === helpModal) helpModal.classList.add('hidden');
  });
}

init();
