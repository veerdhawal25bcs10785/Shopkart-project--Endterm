import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Customer Auth APIs
export const registerCustomer = async (data) => {
  const res = await api.post('/customers/register', data);
  return res.data;
};

export const loginCustomer = async (credentials) => {
  const res = await api.post('/customers/login', credentials);
  return res.data;
};

export const getMyProfile = async () => {
  const res = await api.get('/customers/me');
  return res.data;
};

export const logoutCustomer = async () => {
  const res = await api.post('/customers/logout');
  return res.data;
};

// Product APIs
export const getProducts = async (params = {}) => {
  const cleanParams = {};
  if (params.search && params.search.trim()) cleanParams.search = params.search.trim();
  if (params.category && params.category !== 'All' && params.category !== '') {
    cleanParams.category = params.category;
  }
  if (params.sort && params.sort !== 'default') cleanParams.sort = params.sort;

  const res = await api.get('/products', { params: cleanParams });
  return res.data;
};

export const getProductById = async (id) => {
  const res = await api.get(`/products/${id}`);
  return res.data;
};

export const createProduct = async (productData) => {
  const res = await api.post('/products', productData);
  return res.data;
};

// Wishlist APIs (Lab 04)
export const addToWishlist = async (productId) => {
  const res = await api.post(`/wishlist/${productId}`);
  return res.data;
};

export const getWishlist = async () => {
  const res = await api.get('/wishlist');
  return res.data;
};

export const removeFromWishlist = async (productId) => {
  const res = await api.delete(`/wishlist/${productId}`);
  return res.data;
};

export const toggleWishlist = async (productId) => {
  const res = await api.patch(`/wishlist/${productId}/toggle`);
  return res.data;
};

export const getWishlistCount = async () => {
  const res = await api.get('/wishlist/count');
  return res.data;
};

// Cart APIs (Lab 05)
export const addToCart = async (productId) => {
  const res = await api.post(`/cart/${productId}`);
  return res.data;
};

export const getCart = async () => {
  const res = await api.get('/cart');
  return res.data;
};

export const updateCartQuantity = async (productId, quantity) => {
  const res = await api.patch(`/cart/${productId}`, { quantity });
  return res.data;
};

export const removeFromCart = async (productId) => {
  const res = await api.delete(`/cart/${productId}`);
  return res.data;
};

export const clearCart = async () => {
  const res = await api.delete('/cart');
  return res.data;
};

// Order & Checkout APIs (Lab 06)
export const createPaymentOrder = async (shippingAddress) => {
  const res = await api.post('/orders/create-payment-order', { shippingAddress });
  return res.data;
};

export const verifyPayment = async (paymentData) => {
  const res = await api.post('/orders/verify-payment', paymentData);
  return res.data;
};

export const getMyOrders = async () => {
  const res = await api.get('/orders');
  return res.data;
};

export const getOrderById = async (orderId) => {
  const res = await api.get(`/orders/${orderId}`);
  return res.data;
};

export default api;


