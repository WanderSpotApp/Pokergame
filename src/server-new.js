const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const gameRoutes = require('./routes/gameRoutes');
const gameStore = require('./services/gameStore');
const authRoutes = require('./routes/authRoutes');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Use environment variables with fallbacks
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI environment variable is required');
  process.exit(1);
}

const PORT = process.env.PORT || 10000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'https://pokergame-3.onrender.com';

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

const app = express();
const server = http.createServer(app);

// Configure CORS before any routes
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON bodies
app.use(express.json());

// Log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// REST API routes
app.use('/api/game', gameRoutes);
app.use('/api/auth', authRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Configure Socket.IO after routes
const io = new Server(server, {
  cors: {
    origin: CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST']
  },
});

// Serve static files from React app
if (process.env.NODE_ENV === 'production') {
    const buildPath = path.join(__dirname, 'poker-frontend/build');
    if (fs.existsSync(buildPath)) {
        app.use(express.static(buildPath));
        app.get('*', (req, res) => {
            res.sendFile(path.join(buildPath, 'index.html'));
        });
    } else {
        console.error('Build directory not found at:', buildPath);
        process.exit(1);
    }
}

// Place this at the top, before io.on('connection', ...)
const playerSockets = {}; // playerId -> socket.id

// WebSocket events
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Create a new game
  socket.on('createGame', async ({ playerId, username }) => {
    const game = gameStore.createGame({
      id: playerId,
      username,
      name: username,
      chips: 1000,
      position: 1,
    });
    socket.emit('joinedGame', { 
      gameId: game.id, 
      playerId: playerId, 
      reconnected: false 
    });
    socket.join(game.id);
    socket.gameId = game.id;
    socket.playerId = playerId;
    playerSockets[playerId] = socket.id;
    emitPersonalizedGameState(game);
  });

  // Join game room
  socket.on('joinGame', async ({ gameId, playerId, username }) => {
    let game = gameStore.getGame(gameId);
    if (!game) {
      // Try to load from MongoDB
      const dbGame = await gameStore.loadGame(gameId);
      if (dbGame) {
        // Reconstruct in-memory game object (simplified)
        const GameEngine = require('./models/GameEngine');
        const Player = require('./models/Player');
        const AIPlayer = require('./models/AIPlayer');
        game = {
          id: dbGame.id,
          engine: new GameEngine(),
          players: dbGame.players,
          status: dbGame.status,
        };
        // Reconstruct player instances
        game.engine.players = dbGame.players.map(p => {
          if (p.name && p.name.startsWith('AI')) {
            const ai = new AIPlayer(p.id, p.name, p.chips);
            ai.hand = p.hand || [];
            ai.currentBet = p.currentBet || 0;
            ai.folded = p.folded || false;
            ai.position = p.position;
            return ai;
          } else {
            const player = new Player(p.id, p.name, p.chips);
            player.hand = p.hand || [];
            player.currentBet = p.currentBet || 0;
            player.folded = p.folded || false;
            player.position = p.position;
            return player;
          }
        });
        game.engine.board = dbGame.board;
        game.engine.pot = dbGame.pot;
        game.engine.currentBet = dbGame.currentBet;
        game.engine.bettingRound = dbGame.bettingRound;
        // Add to in-memory store
        const games = require('./services/gameStore').games;
        games[gameId] = game;
      } else {
        socket.emit('error', { error: 'Game not found' });
        return;
      }
    }
    // Check if player already exists in the game
    let player = game.engine.players.find(p => p.id === playerId);
    let isReconnect = false;
    if (!player) {
      // Add the new player to the game
      const Player = require('./models/Player');
      const newPlayer = new Player(playerId, username, 1000);
      newPlayer.username = username;
      newPlayer.name = username;
      newPlayer.position = game.engine.players.length + 1;
      game.engine.addPlayer(newPlayer);
      game.players.push(newPlayer);
    } else {
      isReconnect = true;
    }
    socket.join(gameId);
    socket.gameId = gameId;
    socket.playerId = playerId;
    playerSockets[playerId] = socket.id;
    socket.emit('joinedGame', { gameId, playerId, reconnected: isReconnect });
    if (isReconnect) {
      io.to(gameId).emit('playerReconnected', { playerId });
    }
    emitPersonalizedGameState(game);
  });

  // Player action (bet, call, raise, fold)
  socket.on('playerAction', async ({ gameId, playerId, action, amount }) => {
    console.log(`[SOCKET] playerAction event: action=${action}, playerId=${playerId}, gameId=${gameId}, amount=${amount}`);
    const game = gameStore.getGame(gameId);
    if (!game) {
      socket.emit('error', { error: 'Game not found' });
      return;
    }
    try {
      // Only allow the current player to act
      if (game.engine.currentPlayer !== playerId) {
        socket.emit('error', { error: 'It is not your turn.' });
        return;
      }
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
          socket.emit('error', { error: 'Invalid action' });
          return;
      }
      // Advance turn or round
      if (game.engine.allPlayersActed()) {
        game.engine.advanceRound();
        // Set currentPlayer to the first active player for the new round
        game.engine.currentPlayer = game.engine.getNextActivePlayer(null);
      } else {
        // Set currentPlayer to the next active player who hasn't acted yet
        const active = game.engine.getActivePlayers();
        const notActed = active.filter(p => !game.engine.actedPlayers.has(p.id));
        game.engine.currentPlayer = notActed.length > 0 ? notActed[0].id : null;
      }

      // --- NEW: End hand if all but one player have folded ---
      const activePlayers = game.engine.getActivePlayers();
      if (activePlayers.length === 1 && !game.engine.isShowdown()) {
        // Only one player left, award pot and end hand
        activePlayers[0].chips += game.engine.pot;
        game.engine.pot = 0;
        game.engine.bettingRound = 'showdown';
        game.engine.awardPotToWinner();
        await gameStore.saveGame({
          id: game.id,
          players: game.engine.players,
          board: game.engine.board,
          pot: game.engine.pot,
          currentBet: game.engine.currentBet,
          bettingRound: game.engine.bettingRound,
          status: game.status,
        });
        emitPersonalizedGameState(game);
        return;
      }

      await gameStore.saveGame({
        id: game.id,
        players: game.engine.players,
        board: game.engine.board,
        pot: game.engine.pot,
        currentBet: game.engine.currentBet,
        bettingRound: game.engine.bettingRound,
        status: game.status,
      });
      if (game.engine.isShowdown()) {
        game.engine.awardPotToWinner();
        await gameStore.saveGame({
          id: game.id,
          players: game.engine.players,
          board: game.engine.board,
          pot: game.engine.pot,
          currentBet: game.engine.currentBet,
          bettingRound: game.engine.bettingRound,
          status: game.status,
        });
        const winner = game.engine.getWinner();
        io.to(gameId).emit('showdown', {
          winner: winner ? { id: winner.id, username: winner.username || winner.name || winner.id, name: winner.name } : null,
          pot: game.engine.pot,
          board: game.engine.board.map(cardToString),
          players: game.engine.players.map(p => ({
            id: p.id,
            username: p.username || p.name || p.id,
            name: p.name,
            hand: handToClient(p.hand),
            folded: p.folded,
            chips: p.chips,
          })),
        });
      }
      emitPersonalizedGameState(game);
      console.log('[SOCKET] playerAction: Players in gameState:', game.engine.players.map(p => ({ id: p.id, name: p.name, chips: p.chips, position: p.position, folded: p.folded })));
    } catch (err) {
      socket.emit('error', { error: err.message });
      console.error('[SOCKET] playerAction error:', err);
    }
  });

  // New hand event
  socket.on('newHand', async ({ gameId }) => {
    console.log('[SOCKET] newHand event received for gameId:', gameId);
    const game = gameStore.getGame(gameId);
    if (!game) {
      console.error('[SOCKET] newHand: Game not found for gameId:', gameId);
      socket.emit('error', { error: 'Game not found' });
      return;
    }
    try {
      game.engine.resetForNextHand();
      // Set currentPlayer to the first active player's id if available
      game.engine.currentPlayer = game.engine.getNextActivePlayer(null);
      await gameStore.saveGame({
        id: game.id,
        players: game.engine.players,
        board: game.engine.board,
        pot: game.engine.pot,
        currentBet: game.engine.currentBet,
        bettingRound: game.engine.bettingRound,
        status: game.status,
      });
      emitPersonalizedGameState(game);
      console.log('[SOCKET] newHand: Emitted updated gameState for gameId:', gameId);
      console.log('[SOCKET] newHand: Players in gameState:', game.engine.players.map(p => ({ id: p.id, name: p.name, chips: p.chips, position: p.position })));
    } catch (err) {
      console.error('[SOCKET] newHand error:', err);
      socket.emit('error', { error: err.message });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server running in ${NODE_ENV} mode on port ${PORT}`);
});

module.exports = server;

function cardToString(card) {
  if (card.rank && card.suit) {
    let suitChar;
    switch (card.suit) {
      case '♠': suitChar = 's'; break;
      case '♥': suitChar = 'h'; break;
      case '♦': suitChar = 'd'; break;
      case '♣': suitChar = 'c'; break;
      default: suitChar = '?';
    }
    return card.rank + suitChar;
  }
  return card;
}

function handToClient(hand) {
  return hand ? hand.map(card => {
    let suitChar;
    switch (card.suit) {
      case '♠': suitChar = 's'; break;
      case '♥': suitChar = 'h'; break;
      case '♦': suitChar = 'd'; break;
      case '♣': suitChar = 'c'; break;
      default: suitChar = '?';
    }
    return { value: card.rank || card.value, suit: suitChar };
  }) : [];
}

// Helper to emit personalized game state to all players
function emitPersonalizedGameState(game) {
  game.engine.players.forEach(p => {
    const socketId = playerSockets[p.id];
    if (socketId) {
      io.to(socketId).emit('gameState', {
        pot: game.engine.pot,
        currentBet: game.engine.currentBet,
        bettingRound: game.engine.bettingRound,
        players: game.engine.players.map(other => ({
          id: other.id,
          username: other.username || other.name || other.id,
          name: other.name,
          chips: other.chips,
          folded: other.folded,
          currentBet: other.currentBet,
          position: other.position,
          hand: other.id === p.id ? handToClient(other.hand) : [],
        })),
        board: game.engine.board.map(cardToString),
        currentPlayer: game.engine.currentPlayer,
        winner: game.engine.isShowdown() ? (Array.isArray(game.engine.getWinner()) ? game.engine.getWinner()[0] : game.engine.getWinner()) : null,
      });
    }
  });
} 