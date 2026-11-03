// src/services/api.js
import http from './http';

export const fetchProducts = () => http.get('/products');

export const createOrder = (orderData) => http.post('/orders', orderData);

export const login = (credentials) => http.post('/auth/login', credentials);

export const register = (formData) => http.post('/auth/register', formData);

export const logout = () => http.post('/auth/logout');

export const fetchCurrentUser = () => http.get('/auth/me');
