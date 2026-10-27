const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', '..', 'data', 'festival.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db = null;
let dbWrapper = null;

// ─── Persistence ────────────────────────────────────────────────
function saveDb() {
  if (!db) return;
  try {
    const data = db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  } catch (e) {
    console.error('DB save error:', e.message);
  }
}

// ─── Schema ─────────────────────────────────────────────────────
function createTables() {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'customer' CHECK(role IN ('customer', 'admin')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      icon TEXT,
      description TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      original_price REAL,
      category_id INTEGER REFERENCES categories(id),
      image_url TEXT,
      stock INTEGER DEFAULT 0,
      rating REAL DEFAULT 0,
      review_count INTEGER DEFAULT 0,
      is_featured INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS cart_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      product_id INTEGER NOT NULL REFERENCES products(id),
      quantity INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, product_id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      order_number TEXT UNIQUE NOT NULL,
      total REAL NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','confirmed','processing','shipped','delivered','cancelled')),
      payment_status TEXT DEFAULT 'pending' CHECK(payment_status IN ('pending','completed','failed','refunded')),
      shipping_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id),
      product_id INTEGER NOT NULL REFERENCES products(id),
      product_name TEXT NOT NULL,
      price REAL NOT NULL,
      quantity INTEGER NOT NULL
    )
  `);
}

// ─── better-sqlite3–compatible wrapper over sql.js ──────────────
class DbWrapper {
  prepare(sql) {
    return new StatementWrapper(db, sql);
  }

  exec(sql) {
    db.run(sql);
    saveDb();
  }
}

class StatementWrapper {
  constructor(database, sql) {
    this._db = database;
    this._sql = sql;
  }

  run(...params) {
    this._db.run(this._sql, params);
    saveDb();
    return { changes: this._db.getRowsModified(), lastInsertRowid: getLastInsertRowId(this._db) };
  }

  get(...params) {
    const stmt = this._db.prepare(this._sql);
    stmt.bind(params);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row;
    }
    stmt.free();
    return undefined;
  }

  all(...params) {
    const results = [];
    const stmt = this._db.prepare(this._sql);
    stmt.bind(params);
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  }
}

function getLastInsertRowId(database) {
  const stmt = database.prepare('SELECT last_insert_rowid() as id');
  stmt.step();
  const result = stmt.getAsObject();
  stmt.free();
  return result.id;
}

// ─── Public API ─────────────────────────────────────────────────
function getDb() {
  if (!dbWrapper) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return dbWrapper;
}

async function initDatabase() {
  if (dbWrapper) return dbWrapper;

  const SQL = await initSqlJs();

  let buffer = null;
  if (fs.existsSync(DB_PATH)) {
    buffer = fs.readFileSync(DB_PATH);
  }

  db = buffer ? new SQL.Database(buffer) : new SQL.Database();

  db.run('PRAGMA journal_mode=WAL');
  db.run('PRAGMA foreign_keys=ON');

  createTables();
  saveDb();

  // Auto-save periodically
  setInterval(() => saveDb(), 5000);

  dbWrapper = new DbWrapper();
  return dbWrapper;
}

module.exports = { getDb, initDatabase, saveDb };
