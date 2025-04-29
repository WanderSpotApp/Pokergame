const Deck = require('./Deck');
const Player = require('./Player');
const AIPlayer = require('./AIPlayer');
const { Hand } = require('pokersolver');

class GameEngine {
  constructor() {
    this.players = [];
    this.deck = new Deck();
    this.board = [];
    this.pot = 0;
    this.currentBet = 0;
    this.bettingRound = 'preflop';
  }

  addPlayer(player) {
    this.players.push(player);
  }

  startHand() {
    this.deck.reset();
    this.deck.shuffle();
    this.board = [];
    this.pot = 0;
    this.currentBet = 0;
    this.bettingRound = 'preflop';
    this.players.forEach(p => p.resetHand());
    this.players.forEach(p => {
      p.hand = this.deck.deal(2);
    });
    this.actedPlayers = new Set();
  }

  dealFlop() {
    this.board.push(...this.deck.deal(3));
    this.bettingRound = 'flop';
  }

  dealTurn() {
    this.board.push(...this.deck.deal(1));
    this.bettingRound = 'turn';
  }

  dealRiver() {
    this.board.push(...this.deck.deal(1));
    this.bettingRound = 'river';
  }

  getActivePlayers() {
    return this.players.filter(p => !p.folded);
  }

  placeBet(playerId, amount) {
    const player = this.players.find(p => p.id === playerId);
    if (!player || player.folded) throw new Error('Invalid player');
    if (amount < this.currentBet) throw new Error('Bet must be at least current bet');
    player.bet(amount);
    this.pot += amount;
    if (amount > this.currentBet) this.currentBet = amount;
    this.markActed(playerId);
  }

  call(playerId) {
    const player = this.players.find(p => p.id === playerId);
    if (!player || player.folded) throw new Error('Invalid player');
    const toCall = this.currentBet - player.currentBet;
    player.bet(toCall);
    this.pot += toCall;
    this.markActed(playerId);
  }

  raise(playerId, amount) {
    const player = this.players.find(p => p.id === playerId);
    if (!player || player.folded) throw new Error('Invalid player');
    const toCall = this.currentBet - player.currentBet;
    player.bet(toCall + amount);
    this.pot += toCall + amount;
    this.currentBet += amount;
    this.markActed(playerId);
  }

  fold(playerId) {
    const player = this.players.find(p => p.id === playerId);
    if (!player || player.folded) throw new Error('Invalid player');
    player.fold();
    this.markActed(playerId);
  }

  advanceRound() {
    if (this.bettingRound === 'preflop') this.dealFlop();
    else if (this.bettingRound === 'flop') this.dealTurn();
    else if (this.bettingRound === 'turn') this.dealRiver();
    else if (this.bettingRound === 'river') this.bettingRound = 'showdown';
    this.resetActions();
  }

  isShowdown() {
    return this.bettingRound === 'showdown';
  }

  // Track actions per round
  markActed(playerId) {
    if (!this.actedPlayers) this.actedPlayers = new Set();
    this.actedPlayers.add(playerId);
  }

  allPlayersActed() {
    const active = this.getActivePlayers();
    return this.actedPlayers && this.actedPlayers.size >= active.length;
  }

  resetActions() {
    this.actedPlayers = new Set();
    this.players.forEach(p => p.currentBet = 0);
    this.currentBet = 0;
  }

  // Robust showdown: use pokersolver to determine winner(s)
  getWinner() {
    if (!this.isShowdown()) return null;
    const active = this.getActivePlayers();
    if (active.length === 0) return null;
    if (active.length === 1) return active[0];
    // Convert cards to pokersolver format
    const boardCards = this.board.map(card => {
      // e.g. 'As', 'Td', '5h'
      const suitMap = { '♠': 's', '♥': 'h', '♦': 'd', '♣': 'c' };
      return card.rank + suitMap[card.suit];
    });
    const hands = active.map(player => {
      const hole = player.hand.map(card => {
        const suitMap = { '♠': 's', '♥': 'h', '♦': 'd', '♣': 'c' };
        return card.rank + suitMap[card.suit];
      });
      return Hand.solve([...hole, ...boardCards]);
    });
    const winners = Hand.winners(hands);
    // Return the player(s) who have the winning hand
    return active.filter((p, i) => winners.includes(hands[i]));
  }

  awardPotToWinner() {
    if (!this.isShowdown()) return;
    let winners = this.getWinner();
    if (!winners) return;
    if (!Array.isArray(winners)) winners = [winners]; // Always use array
    const share = Math.floor(this.pot / winners.length);
    let remainder = this.pot - (share * winners.length);
    winners.forEach((winner, i) => {
      winner.chips += share + (i === 0 ? remainder : 0); // Give remainder to first winner
    });
    this.pot = 0;
  }

  resetForNextHand() {
    this.board = [];
    this.pot = 0;
    this.currentBet = 0;
    this.bettingRound = 'preflop';
    this.players.forEach(p => p.resetHand());
    this.deck.reset();
    this.deck.shuffle();
    this.players.forEach(p => {
      p.hand = this.deck.deal(2);
    });
    this.actedPlayers = new Set();
  }

  getNextActivePlayer(currentId) {
    const active = this.getActivePlayers();
    if (active.length === 0) return null;
    if (!currentId) return active[0].id;
    const idx = active.findIndex(p => p.id === currentId);
    return active[(idx + 1) % active.length].id;
  }

  // More methods for betting, showdown, etc. will be added for full game logic
}

module.exports = GameEngine; 