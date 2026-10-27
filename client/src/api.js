/* ═══════════════════════════════════════════════════════════════════
   Festival Rush – API Client
   ═══════════════════════════════════════════════════════════════════ */

const BASE = '/api';

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || `Request failed (${res.status})`);
  return data;
}

/* Auth */
export const login = (email, password) => request('POST', '/auth/login', { email, password });
export const register = (name, email, password) =>
  request('POST', '/auth/register', { name, email, password });
export const getProfile = () => request('GET', '/auth/profile');

/* Products */
export const getProducts = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return request('GET', `/products${qs ? `?${qs}` : ''}`);
};
export const getProduct = (id) => request('GET', `/products/${id}`);
export const getCategories = () => request('GET', '/products/categories');
export const searchProducts = (q) => request('GET', `/products?search=${encodeURIComponent(q)}`);

/* Cart */
export const getCart = () => request('GET', '/cart');
export const addToCart = (productId, quantity = 1) =>
  request('POST', '/cart/add', { product_id: productId, quantity });
export const updateCartItem = (itemId, quantity) =>
  request('PUT', `/cart/${itemId}`, { quantity });
export const removeFromCart = (itemId) =>
  request('DELETE', `/cart/${itemId}`);
export const clearCart = () => request('DELETE', '/cart/clear');

/* Chat */
export const sendChatMessage = (messages) => request('POST', '/chat', { messages });

/* Orders */
export const checkout = (shippingAddress, paymentMethod = 'credit_card') =>
  request('POST', '/orders', { shipping_address: shippingAddress, paymentMethod });
export const getOrders = () => request('GET', '/orders');
export const getOrder = (id) => request('GET', `/orders/${id}`);
