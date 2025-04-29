class Player {
  constructor(id, name, chips = 1000) {
    this.id = id;
    this.name = name;
    this.hand = [];
    this.chips = chips;
    this.currentBet = 0;
    this.folded = false;
  }

  resetHand() {
    this.hand = [];
    this.currentBet = 0;
    this.folded = false;
  }

  bet(amount) {
    if (amount > this.chips) throw new Error('Not enough chips');
    this.chips -= amount;
    this.currentBet += amount;
    return amount;
  }

  fold() {
    this.folded = true;
  }
}

module.exports = Player; 