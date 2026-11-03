// src/services/adminApi.js
// Routes réservées aux administrateurs (le rôle est vérifié côté serveur)
import http from './http';

export const getOrders = () => http.get('/admin/orders');

export const getProducts = () => http.get('/admin/products');

export const updateOrderStatus = (orderId, status) => http.put(`/admin/orders/${orderId}/status`, { status });

export const validateOrder = (orderId) => http.put(`/admin/orders/${orderId}/validate`);

export const updateProductStock = (productId, stock) => http.put(`/admin/products/${productId}/stock`, { stock });
