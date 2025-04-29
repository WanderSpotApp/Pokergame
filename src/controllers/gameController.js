const gameStore = require('../services/gameStore');
const Player = require('../models/Player');

// Game controller stubs
exports.createGame = (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  const hostPlayer = new Player(Date.now().toString(), name);
  const game = gameStore.createGame(hostPlayer);
  res.json({ gameId: game.id, playerId: hostPlayer.id, message: 'Game created' });
};

exports.joinGame = (req, res) => {
  const { gameId, name } = req.body;
  if (!gameId || !name) return res.status(400).json({ error: 'gameId and name required' });
  const player = new Player(Date.now().toString(), name);
  const game = gameStore.joinGame(gameId, player);
  if (!game) return res.status(404).json({ error: 'Game not found' });
  res.json({ gameId: game.id, playerId: player.id, message: 'Joined game' });
};

exports.playerAction = (req, res) => {
  const { gameId, playerId, action, amount } = req.body;
  const game = gameStore.getGame(gameId);
  if (!game) return res.status(404).json({ error: 'Game not found' });
  try {
    switch (action) {
      case 'bet':
        game.engine.placeBet(playerId, amount);
        break;
      case 'call':
        game.engine.call(playerId);
        break;
      case 'raise':
        game.engine.raise(playerId, amount);
        break;
      case 'fold':
        game.engine.fold(playerId);
        break;
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
    // Optionally advance round if all players have acted (not implemented here)
    res.json({
      message: 'Action processed',
      pot: game.engine.pot,
      currentBet: game.engine.currentBet,
      bettingRound: game.engine.bettingRound,
      players: game.engine.players.map(p => ({
        id: p.id,
        name: p.name,
        chips: p.chips,
        folded: p.folded,
        currentBet: p.currentBet,
      })),
      board: game.engine.board.map(card => card.toString()),
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}; 