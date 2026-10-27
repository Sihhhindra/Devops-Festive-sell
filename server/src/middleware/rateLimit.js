const rateLimit = require('express-rate-limit');

// General API rate limit — 100 requests per 15 min per IP
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Too many requests from this IP. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        // Use X-Forwarded-For in production (behind load balancer)
        return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
    },
});

// Strict auth limiter — prevent brute force (10 attempts per 15 min)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'Too many authentication attempts. Account temporarily locked for 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Only count failed attempts
});

// Payment limiter — prevent payment spam (5 per minute)
const paymentLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    message: { error: 'Too many payment requests. Please wait before trying again.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Cart action limiter — prevent cart flooding (30 per minute)
const cartLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    message: { error: 'Too many cart operations. Please slow down.' },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = { apiLimiter, authLimiter, paymentLimiter, cartLimiter };
