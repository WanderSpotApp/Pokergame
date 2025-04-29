const Card = require('./Card');

class Deck {
  constructor() {
    this.suits = ['♠', '♥', '♦', '♣'];
    this.ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    this.cards = [];
    this.reset();
  }

  reset() {
    this.cards = [];
    for (const suit of this.suits) {
      for (const rank of this.ranks) {
        this.cards.push(new Card(suit, rank));
      }
    }
  }

  shuffle() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  deal(num) {
    return this.cards.splice(0, num);
  }
}

module.exports = Deck; 