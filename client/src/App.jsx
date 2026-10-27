import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import * as api from './api';

/* ═══════════════════════════════════════════════════════════════════
   Context — Auth + Cart + Toast
   ═══════════════════════════════════════════════════════════════════ */
const AppContext = createContext();
export const useApp = () => useContext(AppContext);

function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(true);

  const toast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);

  /* Restore session */
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }
    api.getProfile()
      .then(data => { setUser(data.user || data); })
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, []);

  /* Load cart when user logs in */
  useEffect(() => {
    if (!user) return;
    api.getCart()
      .then(data => setCart({ items: data.items || [], total: data.total || 0 }))
      .catch(() => {});
  }, [user]);

  const loginUser = async (email, password) => {
    const data = await api.login(email, password);
    localStorage.setItem('token', data.token);
    setUser(data.user);
    toast('Welcome back! 🎉', 'success');
    return data;
  };

  const registerUser = async (name, email, password) => {
    const data = await api.register(name, email, password);
    localStorage.setItem('token', data.token);
    setUser(data.user);
    toast('Account created successfully!', 'success');
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setCart({ items: [], total: 0 });
    toast('Logged out', 'info');
  };

  const refreshCart = async () => {
    if (!user) return;
    try {
      const data = await api.getCart();
      setCart({ items: data.items || [], total: data.total || 0 });
    } catch {}
  };

  const addItemToCart = async (productId, qty = 1) => {
    if (!user) { toast('Please login to add items to cart', 'error'); return false; }
    try {
      await api.addToCart(productId, qty);
      await refreshCart();
      toast('Added to cart! 🛒', 'success');
      return true;
    } catch (e) { toast(e.message, 'error'); return false; }
  };

  const value = {
    user, cart, toasts, loading,
    loginUser, registerUser, logout,
    refreshCart, addItemToCart, toast,
  };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

/* ═══════════════════════════════════════════════════════════════════
   Toast Container
   ═══════════════════════════════════════════════════════════════════ */
function ToastContainer() {
  const { toasts } = useApp();
  if (!toasts.length) return null;
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {t.type === 'success' && '✓ '}
          {t.type === 'error' && '✕ '}
          {t.message}
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Header
   ═══════════════════════════════════════════════════════════════════ */
function Header() {
  const { user, cart, logout } = useApp();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const cartCount = cart.items.reduce((s, i) => s + i.quantity, 0);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/products?search=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <header className="header" id="site-header">
      <div className="container header-inner">
        <Link to="/" className="header-logo" id="logo">
          🎪 Festival Rush
        </Link>

        <form className="header-search" onSubmit={handleSearch}>
          <span className="header-search-icon">🔍</span>
          <input
            type="search"
            placeholder="Search products…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            id="search-input"
          />
        </form>

        <nav className="header-nav" id="main-nav">
          <Link to="/products" className="header-nav-link" id="nav-products">Shop</Link>
          {user ? (
            <>
              <Link to="/orders" className="header-nav-link" id="nav-orders">Orders</Link>
              <button className="header-nav-link" onClick={logout} id="nav-logout">Logout</button>
            </>
          ) : (
            <Link to="/login" className="header-nav-link" id="nav-login">Login</Link>
          )}
          <button className="header-cart-btn" onClick={() => navigate('/cart')} id="nav-cart">
            🛒 Cart
            {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
          </button>
        </nav>
      </div>
    </header>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Footer
   ═══════════════════════════════════════════════════════════════════ */
function Footer() {
  return (
    <footer className="footer" id="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="footer-brand-name">🎪 Festival Rush</div>
            <p className="footer-brand">
              Your #1 destination for festive shopping deals. Quality products,
              unbeatable prices, and a seamless experience — every season.
            </p>
          </div>
          <div className="footer-col">
            <h4>Shop</h4>
            <ul><li>Electronics</li><li>Fashion</li><li>Home & Kitchen</li><li>Deals</li></ul>
          </div>
          <div className="footer-col">
            <h4>Support</h4>
            <ul><li>Help Center</li><li>Shipping Info</li><li>Returns</li><li>Contact Us</li></ul>
          </div>
          <div className="footer-col">
            <h4>Company</h4>
            <ul><li>About Us</li><li>Careers</li><li>Blog</li><li>Press</li></ul>
          </div>
        </div>
        <div className="footer-bottom">
          © 2026 Festival Rush. Built for the celebration of tech & deals.
        </div>
      </div>
    </footer>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Stars Component
   ═══════════════════════════════════════════════════════════════════ */
function Stars({ rating = 0, count }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return (
    <span className="stars" aria-label={`${rating} out of 5 stars`}>
      {[...Array(5)].map((_, i) => (
        <span key={i}>{i < full ? '★' : i === full && half ? '★' : '☆'}</span>
      ))}
      {count !== undefined && <span className="card-rating-count">({count})</span>}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   HOME PAGE
   ═══════════════════════════════════════════════════════════════════ */
const CATEGORY_ICONS = {
  Electronics: '📱', Fashion: '👗', 'Home & Kitchen': '🏠',
  Sports: '⚽', Books: '📚', Beauty: '💄', Toys: '🧸',
  default: '🛍️',
};

function HomePage() {
  const navigate = useNavigate();
  const { addItemToCart } = useApp();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    api.getProducts({ limit: 8 })
      .then(data => setProducts(data.products || []))
      .catch(() => {})
      .finally(() => setLoadingProducts(false));
    api.getCategories()
      .then(data => {
        const cats = data.categories || data || [];
        setCategories(cats.map(c => typeof c === 'string' ? c : c.name));
      })
      .catch(() => {});
  }, []);

  return (
    <main>
      {/* Hero */}
      <section className="hero" id="hero">
        <div className="container hero-content">
          <div className="hero-badge">🔥 Festive Season Sale — Up to 60% Off!</div>
          <h1>
            Shop the <span className="gradient-text">Festival Rush</span><br />
            Before It's Gone
          </h1>
          <p>
            Discover exclusive deals on electronics, fashion, home essentials and more.
            Limited-time festive offers curated just for you.
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/products')} id="hero-shop-btn">
              🛍️ Shop Now
            </button>
            <button className="btn btn-secondary btn-lg" onClick={() => navigate('/products?category=Electronics')} id="hero-deals-btn">
              ⚡ Top Deals
            </button>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="hero-stat-value">500+</div>
              <div className="hero-stat-label">Products</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">50K+</div>
              <div className="hero-stat-label">Happy Customers</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">60%</div>
              <div className="hero-stat-label">Max Discount</div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="section" id="categories-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Shop by <span className="highlight">Category</span></h2>
          </div>
          <div className="categories-grid">
            {categories.map(cat => (
              <div
                key={cat}
                className="category-card"
                onClick={() => navigate(`/products?category=${encodeURIComponent(cat)}`)}
              >
                <div className="category-icon">{CATEGORY_ICONS[cat] || CATEGORY_ICONS.default}</div>
                <div className="category-name">{cat}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="section" id="featured-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">🔥 Trending <span className="highlight">Deals</span></h2>
            <button className="btn btn-ghost" onClick={() => navigate('/products')}>View All →</button>
          </div>
          {loadingProducts ? (
            <div className="products-grid">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="card" style={{ height: 360 }}>
                  <div className="skeleton" style={{ height: 200 }} />
                  <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div className="skeleton" style={{ height: 16 }} />
                    <div className="skeleton" style={{ height: 16, width: '60%' }} />
                    <div className="skeleton" style={{ height: 32, marginTop: 16 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="products-grid">
              {products.map((p, idx) => (
                <ProductCard key={p.id} product={p} index={idx} onAdd={addItemToCart} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Promo Banner */}
      <section className="section" id="promo-section">
        <div className="container">
          <div style={{
            background: 'linear-gradient(135deg, rgba(233,69,96,0.15), rgba(15,52,96,0.2))',
            borderRadius: 'var(--radius-l)',
            border: '1px solid var(--clr-border)',
            padding: '48px',
            textAlign: 'center',
          }}>
            <h2 style={{ fontFamily: 'var(--ff-heading)', fontSize: '1.8rem', marginBottom: 12 }}>
              🎉 Don't Miss the Festival Rush!
            </h2>
            <p style={{ color: 'var(--clr-text-muted)', maxWidth: 500, margin: '0 auto 24px', fontSize: '1.05rem' }}>
              Enjoy exclusive festive deals, flash sales, and limited-edition products. Celebrate
              every season with incredible savings.
            </p>
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/register')} id="promo-register-btn">
              Create Account — It's Free
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   ProductCard (shared)
   ═══════════════════════════════════════════════════════════════════ */
function ProductCard({ product: p, index = 0, onAdd }) {
  const navigate = useNavigate();
  const discount = p.originalPrice && p.originalPrice > p.price
    ? Math.round((1 - p.price / p.originalPrice) * 100)
    : 0;

  return (
    <div
      className="card product-card animate-fade-up"
      style={{ animationDelay: `${index * 0.08}s` }}
      id={`product-card-${p.id}`}
    >
      <div className="card-image" onClick={() => navigate(`/products/${p.id}`)} style={{ cursor: 'pointer' }}>
        {p.imageUrl ? (
          <img src={p.imageUrl} alt={p.name} loading="lazy" />
        ) : (
          CATEGORY_ICONS[p.category_name || p.category] || '🛍️'
        )}
        <div className="card-badges">
          {discount > 0 && <span className="badge badge-sale">{discount}% OFF</span>}
          {p.stock <= 5 && p.stock > 0 && <span className="badge badge-out" style={{ background: 'var(--clr-warning)', color: '#1a1a2e' }}>Low Stock</span>}
          {p.stock === 0 && <span className="badge badge-out">Sold Out</span>}
        </div>
        <button className="card-wishlist" aria-label="Add to wishlist">♡</button>
      </div>
      <div className="card-body">
        <div className="card-category">{p.category_name || p.category || 'General'}</div>
        <h3 className="card-title" onClick={() => navigate(`/products/${p.id}`)} style={{ cursor: 'pointer' }}>
          {p.name}
        </h3>
        <div className="card-rating">
          <Stars rating={p.rating || 4} />
          <span className="card-rating-count">({p.reviewCount || 0})</span>
        </div>
        <div className="card-footer">
          <div className="card-price">
            <span className="price price-current">₹{Number(p.price).toLocaleString()}</span>
            {discount > 0 && (
              <span className="price price-original" style={{ marginLeft: 8 }}>
                ₹{Number(p.originalPrice).toLocaleString()}
              </span>
            )}
          </div>
          <button
            className="add-to-cart"
            onClick={(e) => { e.stopPropagation(); onAdd(p.id); }}
            disabled={p.stock === 0}
            id={`add-to-cart-${p.id}`}
          >
            {p.stock === 0 ? 'Sold Out' : '+ Cart'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   PRODUCTS PAGE (Browse / Search / Filter)
   ═══════════════════════════════════════════════════════════════════ */
function ProductsPage() {
  const { addItemToCart } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const category = searchParams.get('category') || '';
  const search = searchParams.get('search') || '';
  const sort = searchParams.get('sort') || '';

  useEffect(() => {
    api.getCategories()
      .then(data => {
        const cats = data.categories || data || [];
        setCategories(cats.map(c => typeof c === 'string' ? c : c.name));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = { page, limit: 12 };
    if (category) params.category = category;
    if (search) params.search = search;
    if (sort) params.sort = sort;

    api.getProducts(params)
      .then(data => {
        setProducts(data.products || []);
        setTotalPages((data.pagination && data.pagination.pages) || 1);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [category, search, sort, page]);

  const setFilter = (key, val) => {
    const p = new URLSearchParams(searchParams);
    if (val) p.set(key, val);
    else p.delete(key);
    setSearchParams(p);
    setPage(1);
  };

  return (
    <main className="section" id="products-page">
      <div className="container">
        <div className="section-header">
          <h1 className="section-title">
            {search ? `Results for "${search}"` : category ? category : 'All Products'}
          </h1>
        </div>

        {/* Filters bar */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
          <button
            className={`btn btn-sm ${!category ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter('category', '')}
            id="filter-all"
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              className={`btn btn-sm ${category === cat ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter('category', cat)}
            >
              {CATEGORY_ICONS[cat] || '🛍️'} {cat}
            </button>
          ))}
          <select
            className="input"
            style={{ width: 'auto', padding: '8px 12px', fontSize: '0.85rem' }}
            value={sort}
            onChange={e => setFilter('sort', e.target.value)}
            id="sort-select"
          >
            <option value="">Sort by</option>
            <option value="price_asc">Price: Low → High</option>
            <option value="price_desc">Price: High → Low</option>
            <option value="name_asc">Name: A → Z</option>
            <option value="newest">Newest First</option>
          </select>
        </div>

        {loading ? (
          <div className="products-grid">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="card" style={{ height: 360 }}>
                <div className="skeleton" style={{ height: 200 }} />
                <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className="skeleton" style={{ height: 16 }} />
                  <div className="skeleton" style={{ height: 16, width: '60%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <h3>No products found</h3>
            <p>Try adjusting your filters or search terms.</p>
          </div>
        ) : (
          <>
            <div className="products-grid">
              {products.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} onAdd={addItemToCart} />
              ))}
            </div>
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 40 }}>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    className={`btn btn-sm ${page === i + 1 ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   PRODUCT DETAIL PAGE
   ═══════════════════════════════════════════════════════════════════ */
function ProductDetailPage() {
  const { id } = useParams();
  const { addItemToCart } = useApp();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getProduct(id)
      .then(data => setProduct(data.product || data))
      .catch(() => navigate('/products'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;
  if (!product) return null;

  const discount = product.originalPrice && product.originalPrice > product.price
    ? Math.round((1 - product.price / product.originalPrice) * 100) : 0;

  const handleAdd = async () => {
    const ok = await addItemToCart(product.id, quantity);
    if (ok) setQuantity(1);
  };

  return (
    <main className="container" id="product-detail-page">
      <div style={{ padding: '16px 0' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>← Back</button>
      </div>
      <div className="product-detail animate-fade-up">
        <div className="product-detail-image">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} />
          ) : (
            CATEGORY_ICONS[product.category_name || product.category] || '🛍️'
          )}
        </div>
        <div className="product-detail-info">
          <div className="product-detail-category">{product.category_name || product.category || 'General'}</div>
          <h1 className="product-detail-title" id="product-title">{product.name}</h1>
          <div className="product-detail-rating">
            <Stars rating={product.rating || 4} />
            <span style={{ color: 'var(--clr-text-muted)', fontSize: '0.9rem' }}>
              ({product.reviewCount || 0} reviews)
            </span>
            {discount > 0 && <span className="badge badge-sale">{discount}% OFF</span>}
          </div>
          <div className="product-detail-price" id="product-price">
            ₹{Number(product.price).toLocaleString()}
          </div>
          {discount > 0 && (
            <div className="product-detail-original">
              MRP: ₹{Number(product.originalPrice).toLocaleString()}
            </div>
          )}
          <p className="product-detail-desc">{product.description}</p>

          <div className="product-detail-stock">
            <span className={`stock-dot ${
              product.stock > 10 ? 'in-stock' : product.stock > 0 ? 'low-stock' : 'out-stock'
            }`} />
            {product.stock > 10
              ? 'In Stock'
              : product.stock > 0
              ? `Only ${product.stock} left!`
              : 'Out of Stock'
            }
          </div>

          {product.stock > 0 && (
            <>
              <div className="product-detail-quantity">
                <span style={{ fontWeight: 500 }}>Qty:</span>
                <button className="qty-btn" onClick={() => setQuantity(q => Math.max(1, q - 1))} id="qty-minus">−</button>
                <div className="qty-value" id="qty-value">{quantity}</div>
                <button className="qty-btn" onClick={() => setQuantity(q => Math.min(product.stock, q + 1))} id="qty-plus">+</button>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-primary btn-lg" onClick={handleAdd} id="add-to-cart-btn" style={{ flex: 1 }}>
                  🛒 Add to Cart
                </button>
                <button className="btn btn-secondary btn-lg" onClick={async () => { await handleAdd(); navigate('/cart'); }} id="buy-now-btn">
                  ⚡ Buy Now
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   CART PAGE
   ═══════════════════════════════════════════════════════════════════ */
function CartPage() {
  const { user, cart, refreshCart, toast } = useApp();
  const navigate = useNavigate();
  const [updating, setUpdating] = useState(false);

  if (!user) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🔒</div>
        <h3>Please login to view your cart</h3>
        <p>Your cart items are saved and waiting for you!</p>
        <button className="btn btn-primary" onClick={() => navigate('/login')} style={{ marginTop: 16 }}>Login</button>
      </div>
    );
  }

  const updateQty = async (productId, newQty) => {
    setUpdating(true);
    try {
      if (newQty <= 0) await api.removeFromCart(productId);
      else await api.updateCartItem(productId, newQty);
      await refreshCart();
    } catch (e) { toast(e.message, 'error'); }
    setUpdating(false);
  };

  const removeItem = async (productId) => {
    setUpdating(true);
    try {
      await api.removeFromCart(productId);
      await refreshCart();
      toast('Item removed', 'info');
    } catch (e) { toast(e.message, 'error'); }
    setUpdating(false);
  };

  if (!cart.items.length) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🛒</div>
        <h3>Your cart is empty</h3>
        <p>Add some amazing festive deals to get started!</p>
        <button className="btn btn-primary" onClick={() => navigate('/products')} style={{ marginTop: 16 }}>
          Start Shopping
        </button>
      </div>
    );
  }

  return (
    <main className="container" id="cart-page">
      <h1 className="section-title" style={{ padding: '32px 0 0' }}>
        Shopping <span className="highlight">Cart</span>
      </h1>
      <div className="cart-layout">
        <div className="cart-items">
          {cart.items.map(item => (
            <div key={item.productId || item.id} className="cart-item animate-fade-up">
              <div className="cart-item-image">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} />
                ) : (
                  CATEGORY_ICONS[item.category_name || item.category] || '🛍️'
                )}
              </div>
              <div className="cart-item-info">
                <div className="cart-item-name">{item.name || item.productName}</div>
                <div className="cart-item-price">₹{Number(item.price).toLocaleString()}</div>
                <div className="cart-item-controls">
                  <button
                    className="qty-btn"
                    onClick={() => updateQty(item.productId || item.id, item.quantity - 1)}
                    disabled={updating}
                  >−</button>
                  <span className="qty-value">{item.quantity}</span>
                  <button
                    className="qty-btn"
                    onClick={() => updateQty(item.productId || item.id, item.quantity + 1)}
                    disabled={updating}
                  >+</button>
                  <button
                    className="cart-item-remove"
                    onClick={() => removeItem(item.productId || item.id)}
                    disabled={updating}
                  >
                    🗑️ Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="cart-summary">
          <h3>Order Summary</h3>
          <div className="cart-summary-row">
            <span>Items ({cart.items.reduce((s, i) => s + i.quantity, 0)})</span>
            <span>₹{Number(cart.total).toLocaleString()}</span>
          </div>
          <div className="cart-summary-row">
            <span>Shipping</span>
            <span style={{ color: 'var(--clr-success)' }}>Free</span>
          </div>
          <div className="cart-summary-row">
            <span>Festive Discount</span>
            <span style={{ color: 'var(--clr-accent)' }}>−₹0</span>
          </div>
          <div className="cart-summary-row total">
            <span>Total</span>
            <span className="price">₹{Number(cart.total).toLocaleString()}</span>
          </div>
          <button
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: 24 }}
            onClick={() => navigate('/checkout')}
            id="checkout-btn"
          >
            Proceed to Checkout
          </button>
        </div>
      </div>
    </main>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   CHECKOUT PAGE
   ═══════════════════════════════════════════════════════════════════ */
function CheckoutPage() {
  const { user, cart, refreshCart, toast } = useApp();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [address, setAddress] = useState({
    fullName: '', street: '', city: '', state: '', zip: '', phone: '',
  });

  if (!user) { navigate('/login'); return null; }
  if (!cart.items.length) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🛒</div>
        <h3>Cart is empty</h3>
        <p>Add items to your cart before checkout.</p>
        <button className="btn btn-primary" onClick={() => navigate('/products')} style={{ marginTop: 16 }}>
          Shop Now
        </button>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!address.street || !address.city || !address.zip) {
      toast('Please fill in all required fields', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const addrString = `${address.fullName}, ${address.street}, ${address.city}, ${address.state} ${address.zip}`;
      await api.checkout(addrString, 'credit_card');
      await refreshCart();
      toast('Order placed successfully! 🎉', 'success');
      navigate('/orders');
    } catch (e) {
      toast(e.message, 'error');
    }
    setSubmitting(false);
  };

  return (
    <main className="container checkout-page" id="checkout-page">
      <h1 className="section-title" style={{ marginBottom: 32 }}>
        Checkout
      </h1>
      <form onSubmit={handleSubmit}>
        <div className="checkout-grid">
          <div className="checkout-form">
            <div className="checkout-section">
              <h3>📦 Shipping Address</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="input-group">
                  <label>Full Name</label>
                  <input
                    className="input" placeholder="John Doe"
                    value={address.fullName}
                    onChange={e => setAddress(a => ({ ...a, fullName: e.target.value }))}
                    id="checkout-name"
                  />
                </div>
                <div className="input-group">
                  <label>Street Address *</label>
                  <input
                    className="input" placeholder="123 Main Street" required
                    value={address.street}
                    onChange={e => setAddress(a => ({ ...a, street: e.target.value }))}
                    id="checkout-street"
                  />
                </div>
                <div className="checkout-row">
                  <div className="input-group">
                    <label>City *</label>
                    <input
                      className="input" placeholder="Mumbai" required
                      value={address.city}
                      onChange={e => setAddress(a => ({ ...a, city: e.target.value }))}
                      id="checkout-city"
                    />
                  </div>
                  <div className="input-group">
                    <label>State</label>
                    <input
                      className="input" placeholder="Maharashtra"
                      value={address.state}
                      onChange={e => setAddress(a => ({ ...a, state: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="checkout-row">
                  <div className="input-group">
                    <label>PIN Code *</label>
                    <input
                      className="input" placeholder="400001" required
                      value={address.zip}
                      onChange={e => setAddress(a => ({ ...a, zip: e.target.value }))}
                      id="checkout-zip"
                    />
                  </div>
                  <div className="input-group">
                    <label>Phone</label>
                    <input
                      className="input" placeholder="+91 98765 43210"
                      value={address.phone}
                      onChange={e => setAddress(a => ({ ...a, phone: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="checkout-section">
              <h3>💳 Payment</h3>
              <p style={{ color: 'var(--clr-text-muted)', fontSize: '0.9rem' }}>
                This is a demo checkout. Payment will be simulated.
              </p>
              <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
                {['Credit Card', 'UPI', 'Net Banking'].map(m => (
                  <div
                    key={m}
                    style={{
                      flex: 1, padding: '16px', textAlign: 'center',
                      background: 'var(--clr-bg-glass-strong)', border: '1px solid var(--clr-border)',
                      borderRadius: 'var(--radius-m)', fontSize: '0.85rem', fontWeight: 500,
                    }}
                  >
                    {m}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="cart-summary" style={{ top: 100 }}>
            <h3>Order Summary</h3>
            {cart.items.map(item => (
              <div key={item.productId || item.id} className="cart-summary-row">
                <span style={{ fontSize: '0.85rem' }}>
                  {(item.name || item.productName)} × {item.quantity}
                </span>
                <span>₹{(item.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
            <div className="cart-summary-row">
              <span>Shipping</span>
              <span style={{ color: 'var(--clr-success)' }}>Free</span>
            </div>
            <div className="cart-summary-row total">
              <span>Total</span>
              <span className="price">₹{Number(cart.total).toLocaleString()}</span>
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: 24 }}
              disabled={submitting}
              id="place-order-btn"
            >
              {submitting ? 'Processing…' : '🎉 Place Order'}
            </button>
          </div>
        </div>
      </form>
    </main>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   AUTH PAGES
   ═══════════════════════════════════════════════════════════════════ */
function LoginPage() {
  const { loginUser } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginUser(email, password);
      navigate('/');
    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  return (
    <div className="auth-page" id="login-page">
      <div className="auth-card animate-fade-up">
        <h2>Welcome Back</h2>
        <p className="auth-subtitle">Sign in to continue shopping</p>
        {error && <div className="auth-error">{error}</div>}
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Email</label>
            <input
              className="input" type="email" placeholder="you@example.com"
              value={email} onChange={e => setEmail(e.target.value)} required
              id="login-email"
            />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input
              className="input" type="password" placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)} required
              id="login-password"
            />
          </div>
          <button type="submit" className="btn btn-primary btn-lg" disabled={loading} id="login-submit">
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
        <div className="auth-footer">
          Don't have an account? <Link to="/register">Create one</Link>
        </div>
        <div style={{ marginTop: 16, padding: 12, background: 'var(--clr-bg-glass-strong)', borderRadius: 'var(--radius-m)', fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>
          <strong>Demo:</strong> customer@test.com / Customer123! or admin@test.com / Admin123!
        </div>
      </div>
    </div>
  );
}

function RegisterPage() {
  const { registerUser } = useApp();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await registerUser(name, email, password);
      navigate('/');
    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  return (
    <div className="auth-page" id="register-page">
      <div className="auth-card animate-fade-up">
        <h2>Join Festival Rush</h2>
        <p className="auth-subtitle">Create your account and start shopping</p>
        {error && <div className="auth-error">{error}</div>}
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Full Name</label>
            <input
              className="input" placeholder="John Doe"
              value={name} onChange={e => setName(e.target.value)} required
              id="register-name"
            />
          </div>
          <div className="input-group">
            <label>Email</label>
            <input
              className="input" type="email" placeholder="you@example.com"
              value={email} onChange={e => setEmail(e.target.value)} required
              id="register-email"
            />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input
              className="input" type="password" placeholder="Min 8 chars, uppercase, number, special"
              value={password} onChange={e => setPassword(e.target.value)} required minLength={8}
              id="register-password"
            />
          </div>
          <button type="submit" className="btn btn-primary btn-lg" disabled={loading} id="register-submit">
            {loading ? 'Creating…' : 'Create Account'}
          </button>
        </form>
        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   ORDERS PAGE
   ═══════════════════════════════════════════════════════════════════ */
function OrdersPage() {
  const { user, toast } = useApp();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    api.getOrders()
      .then(data => setOrders(data.orders || []))
      .catch(e => toast(e.message, 'error'))
      .finally(() => setLoading(false));
  }, [user, navigate, toast]);

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <main className="container" id="orders-page">
      <h1 className="section-title" style={{ padding: '32px 0' }}>
        My <span className="highlight">Orders</span>
      </h1>
      {orders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📦</div>
          <h3>No orders yet</h3>
          <p>Start shopping to see your orders here!</p>
          <button className="btn btn-primary" onClick={() => navigate('/products')} style={{ marginTop: 16 }}>
            Shop Now
          </button>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map(order => (
            <div key={order.id} className="order-card animate-fade-up">
              <div className="order-header">
                <div>
                  <div className="order-number">Order #{order.id}</div>
                  <div className="order-date">
                    {new Date(order.created_at || order.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </div>
                </div>
                <span className={`order-status ${order.status}`}>{order.status}</span>
              </div>
              {order.items && (
                <div className="order-items">
                  {order.items.map((item, i) => (
                    <div key={i} className="order-item-row">
                      <span>{item.product_name || item.name || item.productName} × {item.quantity}</span>
                      <span>₹{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="order-total">
                <span>Total:</span>
                <span className="price">₹{Number(order.total || order.totalAmount).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   ChatBot — Floating AI Assistant
   ═══════════════════════════════════════════════════════════════════ */
function ChatBot() {
  const { user, refreshCart, toast } = useApp();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Greeting on first open
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: "Hi! 🎉 I'm your Festival Rush AI assistant! Tell me what you're looking for — clothing, decorations, gifts — and I'll find the perfect festive products for you. I can even add items to your cart!",
      }]);
    }
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    if (!user) {
      toast('Please login to use the AI assistant', 'error');
      return;
    }

    const userMsg = { role: 'user', content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      // Send only user/assistant messages (no tool messages — server handles those)
      const chatHistory = updatedMessages.filter(m => m.role === 'user' || m.role === 'assistant');
      const data = await api.sendChatMessage(chatHistory);

      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);

      if (data.cartAdded) {
        toast(`🛒 ${data.cartAdded}`, 'success');
        refreshCart();
      }
    } catch (e) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '⚠️ Sorry, I ran into an issue. Please try again in a moment.',
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div className="chatbot-wrap">
      {open && (
        <div className="chatbot-panel">
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <span className="chatbot-avatar">🎉</span>
              <div>
                <div className="chatbot-title">Festival Rush AI</div>
                <div className="chatbot-subtitle">Your shopping assistant</div>
              </div>
            </div>
            <button className="chatbot-close" onClick={() => setOpen(false)}>✕</button>
          </div>

          <div className="chatbot-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-msg ${msg.role}`}>
                {msg.role === 'assistant' && <span className="chat-icon">🎉</span>}
                <div className="chat-bubble">{msg.content}</div>
              </div>
            ))}
            {loading && (
              <div className="chat-msg assistant">
                <span className="chat-icon">🎉</span>
                <div className="chat-bubble typing">
                  <span /><span /><span />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chatbot-footer">
            <input
              ref={inputRef}
              className="chatbot-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={user ? 'Ask about products, festivals...' : 'Login to chat'}
              disabled={loading || !user}
            />
            <button
              className="chatbot-send"
              onClick={sendMessage}
              disabled={loading || !input.trim() || !user}
            >
              ➤
            </button>
          </div>
        </div>
      )}

      <button
        className={`chatbot-toggle ${open ? 'active' : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-label="AI Shopping Assistant"
      >
        {open ? '✕' : '🤖'}
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   APP — Router
   ═══════════════════════════════════════════════════════════════════ */
export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Header />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/orders" element={<OrdersPage />} />
        </Routes>
        <Footer />
        <ToastContainer />
        <ChatBot />
      </AppProvider>
    </BrowserRouter>
  );
}
