const { v4: uuidv4 } = require('uuid');
const GameEngine = require('../models/GameEngine');
const mongoose = require('mongoose');
const Game = require('../models/Game');
const Player = require('../models/Player');
const AIPlayer = require('../models/AIPlayer');

// Connect to MongoDB (local, default port)
mongoose.connect('mongodb://127.0.0.1:27017/poker', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const games = {};

function createGame(hostPlayer) {
  const gameId = uuidv4();
  const engine = new GameEngine();
  // Ensure hostPlayer is a Player instance
  let playerInstance;
  if (hostPlayer.name && hostPlayer.name.startsWith('AI')) {
    playerInstance = new AIPlayer(hostPlayer.id, hostPlayer.name, hostPlayer.chips);
    playerInstance.position = hostPlayer.position;
  } else {
    playerInstance = new Player(hostPlayer.id, hostPlayer.name, hostPlayer.chips);
    playerInstance.position = hostPlayer.position;
  }
  engine.addPlayer(playerInstance);
  games[gameId] = {
    id: gameId,
    engine,
    players: [playerInstance],
    status: 'waiting', // 'waiting', 'active', 'finished'
  };
  return games[gameId];
}

function getGame(gameId) {
  return games[gameId];
}

function joinGame(gameId, player) {
  const game = games[gameId];
  if (!game) return null;
  // Ensure player is a Player instance
  let playerInstance;
  if (player.name && player.name.startsWith('AI')) {
    playerInstance = new AIPlayer(player.id, player.name, player.chips);
    playerInstance.position = player.position;
  } else {
    playerInstance = new Player(player.id, player.name, player.chips);
    playerInstance.position = player.position;
  }
  game.engine.addPlayer(playerInstance);
  game.players.push(playerInstance);
  return game;
}

function listGames() {
  return Object.values(games);
}

// Save a game to MongoDB
async function saveGame(gameObj) {
  await Game.findOneAndUpdate(
    { id: gameObj.id },
    gameObj,
    { upsert: true, new: true }
  );
}

// Load a game from MongoDB
async function loadGame(gameId) {
  return await Game.findOne({ id: gameId });
}

module.exports = {
  games,
  createGame,
  getGame,
  joinGame,
  listGames,
  saveGame,
  loadGame,
}; 