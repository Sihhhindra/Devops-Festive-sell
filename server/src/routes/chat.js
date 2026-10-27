const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { getDb } = require('../config/db');

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const tools = [
    {
        type: 'function',
        function: {
            name: 'search_products',
            description: 'Search for products by name, description, or category. Use this to find products the user is looking for.',
            parameters: {
                type: 'object',
                properties: {
                    query: { type: 'string', description: 'Search term (product name, type, or keyword)' },
                    category: { type: 'string', description: 'Filter by category name (optional)' },
                    max_price: { type: 'number', description: 'Maximum price in INR (optional)' },
                },
                required: ['query'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'get_product_details',
            description: 'Get full details about a specific product by ID.',
            parameters: {
                type: 'object',
                properties: {
                    product_id: { type: 'integer', description: 'The product ID' },
                },
                required: ['product_id'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'add_to_cart',
            description: "Add a product to the user's shopping cart.",
            parameters: {
                type: 'object',
                properties: {
                    product_id: { type: 'integer', description: 'The product ID to add' },
                    quantity: { type: 'integer', description: 'Quantity to add (default 1)' },
                },
                required: ['product_id'],
            },
        },
    },
];

function searchProducts({ query, category, max_price }) {
    const db = getDb();
    let sql = `
        SELECT p.id, p.name, p.price, p.original_price, p.description,
               p.image_url, p.stock, p.rating, p.review_count,
               c.name as category_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE 1=1
    `;
    const params = [];

    if (query) {
        sql += ' AND (p.name LIKE ? OR p.description LIKE ?)';
        params.push(`%${query}%`, `%${query}%`);
    }
    if (category) {
        sql += ' AND c.name LIKE ?';
        params.push(`%${category}%`);
    }
    if (max_price) {
        sql += ' AND p.price <= ?';
        params.push(max_price);
    }

    sql += ' ORDER BY p.rating DESC LIMIT 5';

    const products = db.prepare(sql).all(...params);
    if (products.length === 0) return { found: false, message: 'No products found matching your search.' };

    return {
        found: true,
        products: products.map(p => ({
            id: p.id,
            name: p.name,
            price: p.price,
            originalPrice: p.original_price,
            category: p.category_name,
            rating: p.rating,
            reviewCount: p.review_count,
            stock: p.stock,
            imageUrl: p.image_url,
            description: p.description ? p.description.substring(0, 150) : '',
        })),
    };
}

function getProductDetails({ product_id }) {
    const db = getDb();
    const p = db.prepare(`
        SELECT p.*, c.name as category_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.id = ?
    `).get(product_id);

    if (!p) return { error: 'Product not found' };

    return {
        id: p.id,
        name: p.name,
        price: p.price,
        originalPrice: p.original_price,
        description: p.description,
        category: p.category_name,
        stock: p.stock,
        rating: p.rating,
        reviewCount: p.review_count,
        imageUrl: p.image_url,
        isFeatured: p.is_featured === 1,
    };
}

function addToCart({ product_id, quantity = 1 }, userId) {
    const db = getDb();
    const product = db.prepare('SELECT id, name, stock FROM products WHERE id = ?').get(product_id);
    if (!product) return { success: false, error: 'Product not found' };
    if (product.stock < quantity) return { success: false, error: `Only ${product.stock} units in stock` };

    const existing = db.prepare(
        'SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?'
    ).get(userId, product_id);

    if (existing) {
        const newQty = existing.quantity + quantity;
        if (newQty > product.stock) return { success: false, error: `Only ${product.stock} units in stock` };
        db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(newQty, existing.id);
    } else {
        db.prepare('INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)').run(userId, product_id, quantity);
    }

    return { success: true, message: `Added ${quantity}x "${product.name}" to your cart!`, productName: product.name };
}

router.use(authMiddleware);

router.post('/', async (req, res) => {
    const messages = Array.isArray(req.body.messages) ? req.body.messages : [];
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
        return res.status(503).json({ error: 'AI service not configured' });
    }

    const systemMessage = {
        role: 'system',
        content: `You are a friendly and enthusiastic shopping assistant for Festival Rush, an online festival shopping platform selling traditional Indian festive items, clothing, decorations, and gifts.

Help customers:
- Find products that match what they're looking for
- Learn about product details, prices, and availability
- Add items to their cart when requested

Guidelines:
- Be warm, festive, and helpful
- Always search for products before recommending them
- When listing products, include their name, price (in ₹), and rating
- If a customer asks to add something to cart, use the add_to_cart tool
- Keep responses concise and conversational
- Currency is Indian Rupees (₹)`,
    };

    const conversationMessages = [systemMessage, ...messages];

    try {
        let finalReply = '';
        let cartAdded = null;
        let iterations = 0;

        while (iterations < 5) {
            iterations++;

            const groqRes = await fetch(GROQ_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
                    messages: conversationMessages,
                    tools,
                    tool_choice: 'auto',
                    max_tokens: 1024,
                    temperature: 0.7,
                }),
            });

            if (!groqRes.ok) {
                const err = await groqRes.json().catch(() => ({}));
                console.error('Groq API error:', err);
                return res.status(502).json({ error: 'AI service error', details: err.error?.message });
            }

            const data = await groqRes.json();
            const choice = data.choices?.[0];
            const assistantMsg = choice?.message;
            if (!assistantMsg) break;

            conversationMessages.push(assistantMsg);

            if (!assistantMsg.tool_calls || assistantMsg.tool_calls.length === 0) {
                finalReply = assistantMsg.content || '';
                break;
            }

            // Execute tool calls
            for (const tc of assistantMsg.tool_calls) {
                let result;
                try {
                    const args = JSON.parse(tc.function.arguments);
                    if (tc.function.name === 'search_products') {
                        result = searchProducts(args);
                    } else if (tc.function.name === 'get_product_details') {
                        result = getProductDetails(args);
                    } else if (tc.function.name === 'add_to_cart') {
                        result = addToCart(args, req.user.id);
                        if (result.success) cartAdded = result.message;
                    } else {
                        result = { error: 'Unknown tool' };
                    }
                } catch (e) {
                    result = { error: e.message };
                }

                conversationMessages.push({
                    role: 'tool',
                    tool_call_id: tc.id,
                    content: JSON.stringify(result),
                });
            }
        }

        // Return history without system message for client storage
        const historyForClient = conversationMessages.filter(m => m.role !== 'system');

        res.json({ reply: finalReply, cartAdded, history: historyForClient });
    } catch (err) {
        console.error('Chat error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
