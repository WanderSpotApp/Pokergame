const Player = require('./Player');

class AIPlayer extends Player {
  constructor(id, name = 'AI', chips = 1000) {
    super(id, name, chips);
  }

  decideAction(gameState) {
    // Simple AI: random + fold/raise if strong
    if (this.folded) return 'fold';
    const [card1, card2] = this.hand;
    const strongRanks = ['A', 'K', 'Q', 'J'];
    const isPair = card1.rank === card2.rank;
    const isStrong = strongRanks.includes(card1.rank) && strongRanks.includes(card2.rank);
    const rand = Math.random();
    if (isPair || isStrong) {
      if (rand < 0.7) return 'raise';
      else return 'call';
    } else if (rand < 0.2) {
      return 'fold';
    } else if (rand < 0.7) {
      return 'call';
    } else {
      return 'raise';
    }
  }
}

module.exports = AIPlayer; 