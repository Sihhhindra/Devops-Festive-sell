const express = require('express');
const router = express.Router();
const cartService = require('../services/cartService');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', (req, res) => {
    try {
        const cart = cartService.getCart(req.user.id);
        res.json(cart);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/add', (req, res) => {
    try {
        const { product_id, quantity } = req.body;
        if (!product_id) return res.status(400).json({ error: 'product_id is required' });
        const cart = cartService.addItem(req.user.id, product_id, quantity || 1);
        res.json(cart);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.delete('/clear', (req, res) => {
    try {
        cartService.clearCart(req.user.id);
        res.json({ items: [], total: 0, itemCount: 0 });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.put('/:itemId', (req, res) => {
    try {
        const { quantity } = req.body;
        if (quantity === undefined) return res.status(400).json({ error: 'quantity is required' });
        const cart = cartService.updateQuantity(req.user.id, req.params.itemId, quantity);
        res.json(cart);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.delete('/:itemId', (req, res) => {
    try {
        const cart = cartService.removeItem(req.user.id, req.params.itemId);
        res.json(cart);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
