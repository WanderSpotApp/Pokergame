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
    this.dealerPosition = 0;
    this.smallBlind = 5;
    this.bigBlind = 10;
    this.minRaise = this.bigBlind;
    this.sidePots = [];
  }

  addPlayer(player) {
    this.players.push(player);
    player.position = this.players.length - 1;
  }

  startHand() {
    this.deck.reset();
    this.deck.shuffle();
    this.board = [];
    this.pot = 0;
    this.currentBet = 0;
    this.bettingRound = 'preflop';
    this.sidePots = [];
    
    // Reset all players
    this.players.forEach(p => p.resetHand());
    
    // Deal hole cards
    this.players.forEach(p => {
      p.hand = this.deck.deal(2);
    });

    // Post blinds
    this.postBlinds();
    
    this.actedPlayers = new Set();
    this.currentPlayer = this.getNextActivePlayer(null);
  }

  postBlinds() {
    const activePlayers = this.getActivePlayers();
    if (activePlayers.length < 2) return;

    // Get positions for blinds
    const sbPos = (this.dealerPosition + 1) % this.players.length;
    const bbPos = (this.dealerPosition + 2) % this.players.length;
    
    // Post small blind
    const sbPlayer = this.players[sbPos];
    if (sbPlayer && !sbPlayer.folded) {
      const sbAmount = Math.min(this.smallBlind, sbPlayer.chips);
      sbPlayer.bet(sbAmount);
      this.pot += sbAmount;
      this.currentBet = sbAmount;
    }

    // Post big blind
    const bbPlayer = this.players[bbPos];
    if (bbPlayer && !bbPlayer.folded) {
      const bbAmount = Math.min(this.bigBlind, bbPlayer.chips);
      bbPlayer.bet(bbAmount);
      this.pot += bbAmount;
      this.currentBet = bbAmount;
    }
  }

  rotateDealer() {
    this.dealerPosition = (this.dealerPosition + 1) % this.players.length;
  }

  getNextActivePlayer(currentPlayerId) {
    const activePlayers = this.getActivePlayers();
    if (activePlayers.length === 0) return null;
    
    const currentIndex = currentPlayerId 
      ? activePlayers.findIndex(p => p.id === currentPlayerId)
      : -1;
    
    return activePlayers[(currentIndex + 1) % activePlayers.length].id;
  }

  placeBet(playerId, amount) {
    const player = this.players.find(p => p.id === playerId);
    if (!player || player.folded) throw new Error('Invalid player');
    
    // Validate minimum raise
    if (amount > this.currentBet && amount < this.currentBet + this.minRaise) {
      throw new Error(`Minimum raise is ${this.minRaise}`);
    }

    // Handle all-in
    if (amount >= player.chips) {
      this.handleAllIn(player, amount);
      return;
    }

    player.bet(amount);
    this.pot += amount;
    if (amount > this.currentBet) {
      this.currentBet = amount;
      this.minRaise = amount - this.currentBet;
    }
    this.markActed(playerId);
  }

  handleAllIn(player, attemptedBet) {
    const allInAmount = player.chips;
    player.bet(allInAmount);
    this.pot += allInAmount;
    
    // Create side pot if needed
    if (attemptedBet > allInAmount) {
      this.createSidePot(player, attemptedBet - allInAmount);
    }
    
    this.markActed(player.id);
  }

  createSidePot(allInPlayer, remainingBet) {
    const sidePot = {
      amount: 0,
      eligiblePlayers: this.getActivePlayers().filter(p => p.id !== allInPlayer.id)
    };
    
    // Calculate side pot amount
    this.players.forEach(player => {
      if (player.id !== allInPlayer.id && !player.folded) {
        const contribution = Math.min(remainingBet, player.chips);
        player.bet(contribution);
        sidePot.amount += contribution;
      }
    });
    
    this.sidePots.push(sidePot);
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
    if (amount < this.minRaise) throw new Error(`Minimum raise is ${this.minRaise}`);
    player.bet(toCall + amount);
    this.pot += toCall + amount;
    this.currentBet = player.currentBet;
    this.minRaise = amount;
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
    this.sidePots = [];
    this.players.forEach(p => p.resetHand());
    this.deck.reset();
    this.deck.shuffle();
    this.rotateDealer();
    this.startHand();
  }

  // More methods for betting, showdown, etc. will be added for full game logic
}

module.exports = GameEngine; 