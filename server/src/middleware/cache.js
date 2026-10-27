const NodeCache = require('node-cache');

// TTL in seconds — 60s default, adjust per route
const cache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

function cacheMiddleware(ttl = 60) {
    return (req, res, next) => {
        // Only cache GET requests
        if (req.method !== 'GET') {
            return next();
        }

        const key = req.originalUrl;
        const cached = cache.get(key);

        if (cached) {
            return res.json(cached);
        }

        // Override res.json to cache the response
        const originalJson = res.json.bind(res);
        res.json = (data) => {
            cache.set(key, data, ttl);
            return originalJson(data);
        };

        next();
    };
}

function invalidateCache(pattern) {
    const keys = cache.keys();
    keys.forEach(key => {
        if (key.includes(pattern)) {
            cache.del(key);
        }
    });
}

module.exports = { cacheMiddleware, invalidateCache, cache };
