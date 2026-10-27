const { getDb } = require('../config/db');

function transform(p) {
    if (!p) return p;
    return {
        ...p,
        imageUrl: p.image_url || null,
        originalPrice: p.original_price || null,
        reviewCount: p.review_count || 0,
        isFeatured: p.is_featured === 1,
    };
}

class ProductService {
    getAll({ page = 1, limit = 12, category, search, minPrice, maxPrice, sort }) {
        const db = getDb();
        let query = 'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE 1=1';
        const params = [];

        if (category) {
            if (!isNaN(category)) {
                query += ' AND p.category_id = ?';
                params.push(Number(category));
            } else {
                query += ' AND c.name = ?';
                params.push(category);
            }
        }

        if (search) {
            query += ' AND (p.name LIKE ? OR p.description LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        if (minPrice) {
            query += ' AND p.price >= ?';
            params.push(minPrice);
        }

        if (maxPrice) {
            query += ' AND p.price <= ?';
            params.push(maxPrice);
        }

        // Count total
        const countQuery = query.replace('SELECT p.*, c.name as category_name', 'SELECT COUNT(*) as total');
        const { total } = db.prepare(countQuery).get(...params);

        // Sorting
        switch (sort) {
            case 'price_asc': query += ' ORDER BY p.price ASC'; break;
            case 'price_desc': query += ' ORDER BY p.price DESC'; break;
            case 'rating': query += ' ORDER BY p.rating DESC'; break;
            case 'newest': query += ' ORDER BY p.created_at DESC'; break;
            default: query += ' ORDER BY p.is_featured DESC, p.rating DESC';
        }

        // Pagination
        const offset = (page - 1) * limit;
        query += ' LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const products = db.prepare(query).all(...params).map(transform);

        return {
            products,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }

    getById(id) {
        const db = getDb();
        const product = db.prepare(
            'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?'
        ).get(id);
        if (!product) throw new Error('Product not found');
        return transform(product);
    }

    getFeatured() {
        const db = getDb();
        return db.prepare(
            'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.is_featured = 1 LIMIT 8'
        ).all().map(transform);
    }

    getCategories() {
        const db = getDb();
        return db.prepare('SELECT * FROM categories').all();
    }

    create(data) {
        const db = getDb();
        const result = db.prepare(
            'INSERT INTO products (name, description, price, original_price, image_url, category_id, stock, rating, review_count, is_featured) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        ).run(data.name, data.description, data.price, data.original_price || null, data.image_url || null, data.category_id, data.stock || 0, data.rating || 0, data.review_count || 0, data.is_featured || 0);
        return transform(this.getById(result.lastInsertRowid));
    }

    update(id, data) {
        const db = getDb();
        const fields = [];
        const values = [];
        for (const [key, value] of Object.entries(data)) {
            if (value !== undefined) {
                fields.push(`${key} = ?`);
                values.push(value);
            }
        }
        if (fields.length === 0) throw new Error('No fields to update');
        values.push(id);
        db.prepare(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`).run(...values);
        return this.getById(id);
    }

    delete(id) {
        const db = getDb();
        db.prepare('DELETE FROM products WHERE id = ?').run(id);
    }
}

module.exports = new ProductService();
