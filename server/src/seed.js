const { getDb } = require('./config/db');
const bcrypt = require('bcryptjs');

async function runSeed(db) {
    console.log('🌱 Seeding database...\n');

    // Clear existing data
    db.exec('DELETE FROM order_items');
    db.exec('DELETE FROM orders');
    db.exec('DELETE FROM cart_items');
    db.exec('DELETE FROM products');
    db.exec('DELETE FROM categories');
    db.exec('DELETE FROM users');

    // Reset auto-increment
    db.exec("DELETE FROM sqlite_sequence WHERE name IN ('users','categories','products','cart_items','orders','order_items')");

    // Create admin user
    const adminPassword = bcrypt.hashSync('Admin123!', 10);
    db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run('Admin', 'admin@test.com', adminPassword, 'admin');

    // Create test customer
    const customerPassword = bcrypt.hashSync('Customer123!', 10);
    db.prepare('INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)').run('Test User', 'customer@test.com', '9876543210', customerPassword);

    console.log('✅ Users created (admin@test.com / Admin123!, customer@test.com / Customer123!)');

    // Categories
    const categories = [
        { name: 'Electronics', icon: '📱', description: 'Smartphones, laptops, gadgets & accessories' },
        { name: 'Fashion', icon: '👗', description: 'Clothing, shoes, and accessories for all' },
        { name: 'Home & Kitchen', icon: '🏠', description: 'Furniture, decor, appliances & kitchen essentials' },
        { name: 'Sports & Outdoors', icon: '⚽', description: 'Fitness equipment, sportswear & outdoor gear' },
        { name: 'Beauty & Health', icon: '💄', description: 'Skincare, makeup, wellness & personal care' },
    ];

    const insertCategory = db.prepare('INSERT INTO categories (name, icon, description) VALUES (?, ?, ?)');
    for (const cat of categories) {
        insertCategory.run(cat.name, cat.icon, cat.description);
    }
    console.log('✅ Categories created');

    // Products
    const products = [
        // Electronics (category_id: 1)
        { name: 'ProMax Ultra Smartphone', description: 'Flagship smartphone with 6.7" AMOLED display, 108MP camera, 5G connectivity, and 5000mAh battery.', price: 899.99, original_price: 1099.99, category_id: 1, stock: 50, rating: 4.7, review_count: 234, is_featured: 1 },
        { name: 'AirWave Wireless Earbuds', description: 'Premium wireless earbuds with active noise cancellation, 30-hour battery life, and crystal-clear audio.', price: 129.99, original_price: 179.99, category_id: 1, stock: 120, rating: 4.5, review_count: 567, is_featured: 1 },
        { name: 'UltraBook Pro 15"', description: '15.6" laptop with Intel i7 processor, 16GB RAM, 512GB SSD, and dedicated graphics.', price: 1249.99, original_price: 1499.99, category_id: 1, stock: 30, rating: 4.6, review_count: 189, is_featured: 1 },
        { name: 'SmartWatch Series X', description: 'Advanced fitness tracking, blood oxygen monitoring, GPS, and always-on display. 7-day battery life.', price: 299.99, original_price: 399.99, category_id: 1, stock: 80, rating: 4.4, review_count: 445, is_featured: 0 },
        { name: 'Portable Bluetooth Speaker', description: '360° surround sound with deep bass. Waterproof IPX7, 20-hour playtime.', price: 79.99, original_price: 99.99, category_id: 1, stock: 150, rating: 4.3, review_count: 312, is_featured: 0 },
        { name: '4K Action Camera', description: 'Capture adventures in 4K. Waterproof to 30m, image stabilization, wide-angle lens.', price: 249.99, original_price: 329.99, category_id: 1, stock: 45, rating: 4.5, review_count: 178, is_featured: 0 },

        // Fashion (category_id: 2)
        { name: 'Premium Leather Jacket', description: 'Genuine leather biker jacket with quilted lining. Classic design that never goes out of style.', price: 199.99, original_price: 349.99, category_id: 2, stock: 40, rating: 4.8, review_count: 92, is_featured: 1 },
        { name: 'Designer Sunglasses', description: 'UV400 protection with polarized lenses. Lightweight titanium frame with anti-scratch coating.', price: 149.99, original_price: 199.99, category_id: 2, stock: 100, rating: 4.4, review_count: 256, is_featured: 0 },
        { name: 'Running Shoes Ultra', description: 'Lightweight running shoes with responsive cushioning and breathable mesh upper.', price: 129.99, original_price: 159.99, category_id: 2, stock: 200, rating: 4.6, review_count: 834, is_featured: 1 },
        { name: 'Casual Denim Collection', description: 'Premium stretch denim jeans with modern slim fit. Comfortable all-day wear.', price: 69.99, original_price: 89.99, category_id: 2, stock: 180, rating: 4.3, review_count: 421, is_featured: 0 },
        { name: 'Silk Festival Dress', description: 'Elegant silk dress with hand-embroidered details. Perfect for festival celebrations.', price: 159.99, original_price: 249.99, category_id: 2, stock: 35, rating: 4.9, review_count: 67, is_featured: 1 },
        { name: 'Canvas Backpack', description: 'Vintage-style canvas backpack with leather accents. Multiple compartments, padded laptop sleeve.', price: 59.99, original_price: 79.99, category_id: 2, stock: 90, rating: 4.2, review_count: 198, is_featured: 0 },

        // Home & Kitchen (category_id: 3)
        { name: 'Smart Coffee Maker', description: 'WiFi-enabled coffee maker with built-in grinder. Schedule brews from your phone.', price: 189.99, original_price: 249.99, category_id: 3, stock: 60, rating: 4.5, review_count: 334, is_featured: 1 },
        { name: 'Robot Vacuum Pro', description: 'Intelligent mapping, powerful suction, and scheduled cleaning. Works with Alexa and Google Home.', price: 349.99, original_price: 499.99, category_id: 3, stock: 25, rating: 4.7, review_count: 567, is_featured: 1 },
        { name: 'Organic Cotton Bedding Set', description: 'Luxurious 400-thread count organic cotton sheets, duvet cover, and pillowcases.', price: 89.99, original_price: 129.99, category_id: 3, stock: 70, rating: 4.6, review_count: 223, is_featured: 0 },
        { name: 'Cast Iron Cookware Set', description: '5-piece pre-seasoned cast iron set includes skillet, Dutch oven, griddle, and two pans.', price: 149.99, original_price: 199.99, category_id: 3, stock: 55, rating: 4.8, review_count: 145, is_featured: 0 },
        { name: 'Smart LED Light Strip', description: '10m RGB LED strip with app control, music sync, and voice commands. 16 million colors.', price: 34.99, original_price: 49.99, category_id: 3, stock: 250, rating: 4.1, review_count: 789, is_featured: 0 },
        { name: 'Air Purifier HEPA', description: 'True HEPA H13 filter removes 99.97% of allergens. Covers up to 500 sq ft.', price: 159.99, original_price: 219.99, category_id: 3, stock: 40, rating: 4.6, review_count: 312, is_featured: 0 },

        // Sports & Outdoors (category_id: 4)
        { name: 'Yoga Mat Premium', description: 'Extra thick 6mm eco-friendly yoga mat with alignment lines. Non-slip surface.', price: 49.99, original_price: 69.99, category_id: 4, stock: 300, rating: 4.4, review_count: 456, is_featured: 0 },
        { name: 'Resistance Band Set', description: 'Set of 5 progressive resistance bands with handles, door anchor, and ankle straps.', price: 29.99, original_price: 44.99, category_id: 4, stock: 500, rating: 4.5, review_count: 1023, is_featured: 0 },
        { name: 'Mountain Bike Helmet', description: 'MIPS-certified safety helmet with adjustable fit system. Lightweight EPS foam.', price: 89.99, original_price: 119.99, category_id: 4, stock: 85, rating: 4.7, review_count: 234, is_featured: 1 },
        { name: 'Camping Tent 4-Person', description: 'Waterproof 4-person dome tent with rainfly. Easy 10-minute setup.', price: 179.99, original_price: 259.99, category_id: 4, stock: 30, rating: 4.3, review_count: 189, is_featured: 0 },
        { name: 'Insulated Water Bottle', description: '32oz vacuum-insulated stainless steel bottle. Keeps drinks cold 24hrs or hot 12hrs.', price: 24.99, original_price: 34.99, category_id: 4, stock: 400, rating: 4.6, review_count: 1567, is_featured: 0 },

        // Beauty & Health (category_id: 5)
        { name: 'Vitamin C Serum Set', description: 'Professional-grade vitamin C serum with hyaluronic acid and vitamin E. Set of 3 bottles.', price: 44.99, original_price: 69.99, category_id: 5, stock: 200, rating: 4.5, review_count: 678, is_featured: 1 },
        { name: 'Electric Massage Gun', description: 'Deep tissue percussion massager with 6 heads and 30 speed levels. 6-hour battery.', price: 99.99, original_price: 149.99, category_id: 5, stock: 100, rating: 4.6, review_count: 445, is_featured: 0 },
        { name: 'Natural Hair Care Bundle', description: 'Sulfate-free shampoo, conditioner, and hair mask made with organic argan oil.', price: 39.99, original_price: 59.99, category_id: 5, stock: 150, rating: 4.3, review_count: 334, is_featured: 0 },
        { name: 'Aromatherapy Diffuser', description: 'Ultrasonic essential oil diffuser with 7 color LED. 300ml capacity. Includes 3 oils.', price: 34.99, original_price: 54.99, category_id: 5, stock: 180, rating: 4.4, review_count: 567, is_featured: 0 },
    ];

    const insertProduct = db.prepare(
        'INSERT INTO products (name, description, price, original_price, category_id, stock, rating, review_count, is_featured) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );

    for (const p of products) {
        insertProduct.run(p.name, p.description, p.price, p.original_price, p.category_id, p.stock, p.rating, p.review_count, p.is_featured);
    }
    console.log(`✅ ${products.length} products created`);
    console.log('\n🎉 Database seeded successfully!\n');
}

// Auto-seed if database is empty
async function seedIfEmpty() {
    const db = getDb();
    const row = db.prepare('SELECT COUNT(*) as count FROM users').get();
    if (row && row.count > 0) {
        console.log('✅ Database already has data, skipping seed');
        return;
    }
    await runSeed(db);
}

// Standalone execution: node src/seed.js
if (require.main === module) {
    const { initDatabase } = require('./config/db');
    initDatabase()
        .then(() => runSeed(getDb()))
        .then(() => process.exit(0))
        .catch(err => { console.error('Seed failed:', err); process.exit(1); });
}

module.exports = { seedIfEmpty };
