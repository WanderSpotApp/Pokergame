class Player {
  constructor(id, name, chips = 1000) {
    this.id = id;
    this.name = name;
    this.hand = [];
    this.chips = chips;
    this.currentBet = 0;
    this.folded = false;
    this.position = null;
    this.isDealer = false;
    this.isSmallBlind = false;
    this.isBigBlind = false;
  }

  resetHand() {
    this.hand = [];
    this.currentBet = 0;
    this.folded = false;
    this.isSmallBlind = false;
    this.isBigBlind = false;
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

  setPosition(position) {
    this.position = position;
  }

  setDealer(isDealer) {
    this.isDealer = isDealer;
  }

  setBlinds(isSmallBlind, isBigBlind) {
    this.isSmallBlind = isSmallBlind;
    this.isBigBlind = isBigBlind;
  }
}

module.exports = Player; 