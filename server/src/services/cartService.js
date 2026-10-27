const { getDb } = require('../config/db');
const eventBus = require('./eventBus');

class CartService {
    getCart(userId) {
        const db = getDb();
        const items = db.prepare(`
      SELECT ci.id, ci.quantity, p.id as product_id, p.name, p.price, p.image_url, p.image_url as imageUrl, p.stock
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = ?
    `).all(userId);

        const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

        return { items, total, itemCount: items.length };
    }

    addItem(userId, productId, quantity = 1) {
        const db = getDb();
        const product = db.prepare('SELECT id, stock FROM products WHERE id = ?').get(productId);
        if (!product) throw new Error('Product not found');
        if (product.stock < quantity) throw new Error('Insufficient stock');

        const existingItem = db.prepare('SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?').get(userId, productId);

        if (existingItem) {
            const newQty = existingItem.quantity + quantity;
            if (newQty > product.stock) throw new Error('Insufficient stock');
            db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(newQty, existingItem.id);
        } else {
            db.prepare('INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)').run(userId, productId, quantity);
        }

        return this.getCart(userId);
    }

    updateQuantity(userId, itemId, quantity) {
        const db = getDb();
        const item = db.prepare('SELECT ci.*, p.stock FROM cart_items ci JOIN products p ON ci.product_id = p.id WHERE ci.id = ? AND ci.user_id = ?').get(itemId, userId);
        if (!item) throw new Error('Cart item not found');
        if (quantity > item.stock) throw new Error('Insufficient stock');

        if (quantity <= 0) {
            db.prepare('DELETE FROM cart_items WHERE id = ?').run(itemId);
        } else {
            db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(quantity, itemId);
        }

        return this.getCart(userId);
    }

    removeItem(userId, itemId) {
        const db = getDb();
        db.prepare('DELETE FROM cart_items WHERE id = ? AND user_id = ?').run(itemId, userId);
        return this.getCart(userId);
    }

    clearCart(userId) {
        const db = getDb();
        db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(userId);
    }
}

module.exports = new CartService();
