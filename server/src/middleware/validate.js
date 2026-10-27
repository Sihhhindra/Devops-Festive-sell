// Input sanitization and validation helpers

function sanitize(str) {
    if (typeof str !== 'string') return str;
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .trim();
}

function sanitizeObject(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) {
        return obj.map(item => {
            if (typeof item === 'string') return sanitize(item);
            if (typeof item === 'object' && item !== null) return sanitizeObject(item);
            return item;
        });
    }
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
            sanitized[key] = sanitize(value);
        } else if (typeof value === 'object' && value !== null) {
            sanitized[key] = sanitizeObject(value);
        } else {
            sanitized[key] = value;
        }
    }
    return sanitized;
}

// Middleware to sanitize all incoming request bodies
function sanitizeBody(req, res, next) {
    if (req.body && typeof req.body === 'object') {
        req.body = sanitizeObject(req.body);
    }
    next();
}

// Validation helpers
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isStrongPassword(password) {
    // Minimum 8 chars, at least 1 uppercase, 1 lowercase, 1 number
    return password.length >= 8 &&
        /[A-Z]/.test(password) &&
        /[a-z]/.test(password) &&
        /[0-9]/.test(password);
}

function validateRegistration(req, res, next) {
    const { name, email, password } = req.body;

    if (!name || name.length < 2 || name.length > 100) {
        return res.status(400).json({ error: 'Name must be between 2 and 100 characters' });
    }
    if (!email || !isValidEmail(email)) {
        return res.status(400).json({ error: 'Please provide a valid email address' });
    }
    if (!password || !isStrongPassword(password)) {
        return res.status(400).json({ error: 'Password must be at least 8 characters with uppercase, lowercase, and number' });
    }
    next();
}

function validateOrder(req, res, next) {
    const { shipping_address } = req.body;
    if (!shipping_address || shipping_address.length < 5) {
        return res.status(400).json({ error: 'Please provide a valid shipping address' });
    }
    next();
}

module.exports = { sanitize, sanitizeBody, validateRegistration, validateOrder, isValidEmail, isStrongPassword };
