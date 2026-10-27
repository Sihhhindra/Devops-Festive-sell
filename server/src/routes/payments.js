const express = require('express');
const router = express.Router();
const paymentService = require('../services/paymentService');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.post('/process', (req, res) => {
    try {
        const { order_id, method } = req.body;
        if (!order_id) return res.status(400).json({ error: 'order_id is required' });
        const result = paymentService.processPayment(order_id, { method });
        res.json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.get('/status/:orderId', (req, res) => {
    try {
        const status = paymentService.getPaymentStatus(req.params.orderId);
        res.json(status);
    } catch (err) {
        res.status(404).json({ error: err.message });
    }
});

module.exports = router;
