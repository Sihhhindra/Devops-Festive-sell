const { getDb } = require('../config/db');
const eventBus = require('./eventBus');
const cartService = require('./cartService');
const crypto = require('crypto');

class OrderService {
    createOrder(userId, { shipping_address }) {
        const db = getDb();
        const cart = cartService.getCart(userId);
        if (cart.items.length === 0) throw new Error('Cart is empty');

        // Verify stock for all items
        for (const item of cart.items) {
            if (item.stock < item.quantity) {
                throw new Error(`Insufficient stock for ${item.name}`);
            }
        }

        const orderNumber = 'FR-' + Date.now().toString(36).toUpperCase() + '-' + crypto.randomBytes(2).toString('hex').toUpperCase();

        // Create order
        const result = db.prepare(
            'INSERT INTO orders (user_id, order_number, total, shipping_address) VALUES (?, ?, ?, ?)'
        ).run(userId, orderNumber, cart.total, shipping_address);

        const orderId = result.lastInsertRowid;

        // Create order items & deduct stock
        for (const item of cart.items) {
            db.prepare('INSERT INTO order_items (order_id, product_id, product_name, price, quantity) VALUES (?, ?, ?, ?, ?)').run(orderId, item.product_id, item.name, item.price, item.quantity);
            db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(item.quantity, item.product_id);

            // Check low stock
            const updated = db.prepare('SELECT stock FROM products WHERE id = ?').get(item.product_id);
            if (updated && updated.stock <= 5) {
                eventBus.emit('inventory:low', { productId: item.product_id, stock: updated.stock });
            }
        }

        // Clear cart
        cartService.clearCart(userId);

        const order = this.getOrder(orderId, userId);
        eventBus.emit('order:placed', order);

        return order;
    }

    getOrder(orderId, userId) {
        const db = getDb();
        const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(orderId, userId);
        if (!order) throw new Error('Order not found');

        order.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);
        return order;
    }

    getOrderByNumber(orderNumber, userId) {
        const db = getDb();
        const order = db.prepare('SELECT * FROM orders WHERE order_number = ? AND user_id = ?').get(orderNumber, userId);
        if (!order) throw new Error('Order not found');

        order.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
        return order;
    }

    getUserOrders(userId) {
        const db = getDb();
        const orders = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(userId);
        for (const order of orders) {
            order.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
        }
        return orders;
    }

    updateStatus(orderId, status) {
        const db = getDb();
        db.prepare('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, orderId);
        eventBus.emit('order:statusChanged', { orderId, status });
        return db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    }

    // Admin: get all orders
    getAllOrders({ page = 1, limit = 20, status }) {
        const db = getDb();
        let query = 'SELECT o.*, u.name as user_name, u.email as user_email FROM orders o JOIN users u ON o.user_id = u.id WHERE 1=1';
        const params = [];

        if (status) {
            query += ' AND o.status = ?';
            params.push(status);
        }

        const countQuery = query.replace(/SELECT .* FROM/, 'SELECT COUNT(*) as total FROM');
        const { total } = db.prepare(countQuery).get(...params);

        query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, (page - 1) * limit);

        const orders = db.prepare(query).all(...params);
        for (const order of orders) {
            order.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
        }

        return { orders, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
    }
}

module.exports = new OrderService();
