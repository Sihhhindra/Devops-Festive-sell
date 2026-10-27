const express = require('express');
const router = express.Router();
const productService = require('../services/productService');
const { cacheMiddleware } = require('../middleware/cache');

router.get('/', cacheMiddleware(30), (req, res) => {
    try {
        const result = productService.getAll(req.query);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/featured', cacheMiddleware(60), (req, res) => {
    try {
        const products = productService.getFeatured();
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/categories', cacheMiddleware(120), (req, res) => {
    try {
        const categories = productService.getCategories();
        res.json(categories);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/:id', cacheMiddleware(30), (req, res) => {
    try {
        const product = productService.getById(req.params.id);
        res.json(product);
    } catch (err) {
        res.status(404).json({ error: err.message });
    }
});

module.exports = router;
