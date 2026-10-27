require('dotenv').config();

const express = require('express');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const path = require('path');
const { apiLimiter, authLimiter, paymentLimiter, cartLimiter } = require('./middleware/rateLimit');
const { sanitizeBody } = require('./middleware/validate');
const { initDatabase } = require('./config/db');
const { seedIfEmpty } = require('./seed');

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Security Middleware ────────────────────────────────────────
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
}));

app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? process.env.ALLOWED_ORIGIN || true
        : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Core Middleware ────────────────────────────────────────────
app.use(compression());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(sanitizeBody);
app.disable('x-powered-by');
app.set('trust proxy', 1);

// ─── Health check (before rate limiter so probes never get 429) ─
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Rate Limiting ──────────────────────────────────────────────
app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);
app.use('/api/payments/', paymentLimiter);
app.use('/api/cart/', cartLimiter);

// ─── API Routes ─────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/chat', require('./routes/chat'));

// ─── Serve React Frontend (production) ──────────────────────────
const clientBuildPath = path.join(__dirname, '..', '..', 'client', 'dist');
app.use(express.static(clientBuildPath));
app.get('*', (req, res, next) => {
    // Only serve index.html for non-API routes
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(clientBuildPath, 'index.html'), (err) => {
        if (err) res.status(404).json({ error: 'Not found' });
    });
});

// ─── Error Handler ──────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error(err.stack);
    const message = process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message;
    res.status(500).json({ error: message });
});

// ─── Start Server (async for sql.js init) ───────────────────────
async function start() {
    try {
        await initDatabase();
        console.log('✅ Database initialized');
        await seedIfEmpty();

        app.listen(PORT, () => {
            console.log(`\n🎉 Festival Rush server running on http://localhost:${PORT}`);
            console.log(`   API: http://localhost:${PORT}/api`);
            console.log(`   Security: Helmet, Rate Limiting, Input Sanitization`);
            console.log(`   Environment: ${process.env.NODE_ENV || 'development'}\n`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

start();

module.exports = app;
