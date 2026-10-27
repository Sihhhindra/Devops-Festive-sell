const { getDb } = require('../config/db');
const eventBus = require('./eventBus');

class PaymentService {
    processPayment(orderId, { method }) {
        const db = getDb();
        const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
        if (!order) throw new Error('Order not found');
        if (order.payment_status === 'completed') throw new Error('Payment already processed');

        // Simulate payment processing (mock gateway)
        const success = this._simulateGateway(method);

        if (success) {
            db.prepare('UPDATE orders SET payment_status = ? WHERE id = ?').run('completed', orderId);
            eventBus.emit('payment:completed', { orderId, amount: order.total });
            return { status: 'completed', message: 'Payment successful', order_number: order.order_number };
        } else {
            db.prepare('UPDATE orders SET payment_status = ? WHERE id = ?').run('failed', orderId);
            throw new Error('Payment failed. Please try again.');
        }
    }

    _simulateGateway(method) {
        // Simulate: 'cash' always succeeds; all other methods succeed by default
        return true;
    }

    getPaymentStatus(orderId) {
        const db = getDb();
        const order = db.prepare('SELECT id, order_number, total, payment_status FROM orders WHERE id = ?').get(orderId);
        if (!order) throw new Error('Order not found');
        return order;
    }
}

module.exports = new PaymentService();
