const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');

// Example: GET /api/game/ping
router.get('/ping', (req, res) => {
  res.json({ message: 'Game API is working!' });
});

// Game REST endpoints
router.post('/create', gameController.createGame);
router.post('/join', gameController.joinGame);
router.post('/action', gameController.playerAction);

module.exports = router; 