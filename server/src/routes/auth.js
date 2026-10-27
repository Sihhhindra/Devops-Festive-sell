const express = require('express');
const router = express.Router();
const authService = require('../services/authService');
const { authMiddleware } = require('../middleware/auth');
const { validateRegistration } = require('../middleware/validate');

router.post('/register', validateRegistration, (req, res) => {
    try {
        const { name, email, phone, password } = req.body;
        const result = authService.register({ name, email, phone, password });
        res.status(201).json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.post('/login', (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        const result = authService.login({ email, password });
        res.json(result);
    } catch (err) {
        res.status(401).json({ error: err.message });
    }
});

router.get('/profile', authMiddleware, (req, res) => {
    try {
        const user = authService.getProfile(req.user.id);
        res.json(user);
    } catch (err) {
        res.status(404).json({ error: err.message });
    }
});

module.exports = router;
