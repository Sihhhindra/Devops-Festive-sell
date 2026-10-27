const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../config/db');

class AuthService {
    register({ name, email, phone, password }) {
        const db = getDb();
        const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (existing) {
            throw new Error('Email already registered');
        }

        const hashedPassword = bcrypt.hashSync(password, 10);
        const result = db.prepare(
            'INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)'
        ).run(name, email, phone || null, hashedPassword);

        const user = db.prepare('SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);
        const token = this._generateToken(user);

        return { user, token };
    }

    login({ email, password }) {
        const db = getDb();
        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
        if (!user) {
            throw new Error('Invalid email or password');
        }

        const validPassword = bcrypt.compareSync(password, user.password);
        if (!validPassword) {
            throw new Error('Invalid email or password');
        }

        const { password: _, ...safeUser } = user;
        const token = this._generateToken(safeUser);

        return { user: safeUser, token };
    }

    getProfile(userId) {
        const db = getDb();
        const user = db.prepare('SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?').get(userId);
        if (!user) throw new Error('User not found');
        return user;
    }

    _generateToken(user) {
        return jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
    }
}

module.exports = new AuthService();
