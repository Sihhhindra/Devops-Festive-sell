const EventEmitter = require('events');

class EventBus extends EventEmitter {
    constructor() {
        super();
        this.setMaxListeners(20);
        this._registerHandlers();
    }

    _registerHandlers() {
        this.on('order:placed', (order) => {
            console.log(`[EventBus] Order #${order.order_number} placed — sending confirmation email to user ${order.user_id}`);
            // Simulate email/SMS notification
            setTimeout(() => {
                console.log(`[EventBus] ✉ Confirmation sent for order #${order.order_number}`);
            }, 500);
        });

        this.on('order:statusChanged', ({ orderId, status }) => {
            console.log(`[EventBus] Order ${orderId} status → ${status}`);
        });

        this.on('payment:completed', ({ orderId, amount }) => {
            console.log(`[EventBus] 💳 Payment of $${amount} received for order ${orderId}`);
        });

        this.on('inventory:low', ({ productId, stock }) => {
            console.log(`[EventBus] ⚠ Low stock alert: Product ${productId} has only ${stock} left`);
        });
    }
}

module.exports = new EventBus();
