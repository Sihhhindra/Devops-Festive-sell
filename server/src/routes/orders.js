const express = require('express');
const router = express.Router();
const orderService = require('../services/orderService');
const { authMiddleware } = require('../middleware/auth');
const { validateOrder } = require('../middleware/validate');

router.use(authMiddleware);

router.post('/', validateOrder, (req, res) => {
    try {
        const order = orderService.createOrder(req.user.id, req.body);
        res.status(201).json(order);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.get('/', (req, res) => {
    try {
        const orders = orderService.getUserOrders(req.user.id);
        res.json({ orders });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/:id', (req, res) => {
    try {
        const order = orderService.getOrder(req.params.id, req.user.id);
        res.json(order);
    } catch (err) {
        res.status(404).json({ error: err.message });
    }
});

router.get('/track/:orderNumber', (req, res) => {
    try {
        const order = orderService.getOrderByNumber(req.params.orderNumber, req.user.id);
        res.json(order);
    } catch (err) {
        res.status(404).json({ error: err.message });
    }
});

module.exports = router;
