const express = require('express');
const router = express.Router();
const { getDb } = require('../config/db');
const productService = require('../services/productService');
const orderService = require('../services/orderService');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { invalidateCache } = require('../middleware/cache');

router.use(authMiddleware, adminMiddleware);

// Dashboard stats
router.get('/dashboard', (req, res) => {
    try {
        const db = getDb();
        const totalProducts = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
        const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;
        const totalRevenue = db.prepare('SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE payment_status = ?').get('completed').total;
        const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get('customer').count;
        const recentOrders = db.prepare('SELECT o.*, u.name as user_name FROM orders o JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC LIMIT 5').all();
        const lowStockProducts = db.prepare('SELECT * FROM products WHERE stock <= 5 ORDER BY stock ASC').all();
        const ordersByStatus = db.prepare('SELECT status, COUNT(*) as count FROM orders GROUP BY status').all();

        res.json({
            stats: { totalProducts, totalOrders, totalRevenue, totalUsers },
            recentOrders,
            lowStockProducts,
            ordersByStatus
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Product management
router.post('/products', (req, res) => {
    try {
        const product = productService.create(req.body);
        invalidateCache('/api/products');
        res.status(201).json(product);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.put('/products/:id', (req, res) => {
    try {
        const product = productService.update(req.params.id, req.body);
        invalidateCache('/api/products');
        res.json(product);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.delete('/products/:id', (req, res) => {
    try {
        productService.delete(req.params.id);
        invalidateCache('/api/products');
        res.json({ message: 'Product deleted' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Order management
router.get('/orders', (req, res) => {
    try {
        const result = orderService.getAllOrders(req.query);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/orders/:id/status', (req, res) => {
    try {
        const { status } = req.body;
        if (!status) return res.status(400).json({ error: 'status is required' });
        const order = orderService.updateStatus(req.params.id, status);
        res.json(order);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
