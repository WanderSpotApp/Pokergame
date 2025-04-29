const mongoose = require('mongoose');

const PlayerSchema = new mongoose.Schema({
  id: String,
  name: String,
  chips: Number,
  hand: [{ suit: String, rank: String }],
  currentBet: Number,
  folded: Boolean,
});

const GameSchema = new mongoose.Schema({
  id: String,
  players: [PlayerSchema],
  board: [{ suit: String, rank: String }],
  pot: Number,
  currentBet: Number,
  bettingRound: String,
  status: String,
});

module.exports = mongoose.model('Game', GameSchema); 