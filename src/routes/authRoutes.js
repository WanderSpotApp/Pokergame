const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

// Log all auth requests
router.use((req, res, next) => {
    console.log(`Auth request: ${req.method} ${req.path}`);
    next();
});

router.post('/register', async (req, res) => {
    console.log('Register request body:', req.body);
    const { username, password } = req.body;
    
    if (!username || !password) {
        console.log('Missing fields in register request');
        return res.status(400).json({ error: 'Missing fields' });
    }

    try {
        console.log('Attempting to create user:', username);
        const user = new User({ username });
        await user.setPassword(password);
        await user.save();
        console.log('User created successfully:', username);
        res.json({ success: true });
    } catch (err) {
        console.error('Registration error:', err);
        if (err.code === 11000) { // MongoDB duplicate key error
            res.status(400).json({ error: 'Username taken' });
        } else {
            res.status(500).json({ error: 'Registration failed' });
        }
    }
});

router.post('/login', async (req, res) => {
    console.log('Login request body:', req.body);
    const { username, password } = req.body;
    
    if (!username || !password) {
        console.log('Missing fields in login request');
        return res.status(400).json({ error: 'Missing fields' });
    }

    try {
        console.log('Attempting to find user:', username);
        const user = await User.findOne({ username });
        
        if (!user) {
            console.log('User not found:', username);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isValidPassword = await user.validatePassword(password);
        if (!isValidPassword) {
            console.log('Invalid password for user:', username);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
        console.log('Login successful for user:', username);
        res.json({ token, username: user.username });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Login failed' });
    }
});

module.exports = router; 