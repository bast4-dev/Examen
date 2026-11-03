// src/services/http.js
import axios from 'axios';

// URL de l'API configurable par environnement (fichier .env : VITE_API_URL)
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// withCredentials : le navigateur envoie automatiquement le cookie HttpOnly d'authentification
const http = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 10000,
});

// Extrait un message lisible d'une erreur API (message + détails de validation)
export const getErrorMessage = (error, fallback = 'Une erreur est survenue. Veuillez réessayer.') => {
  const data = error?.response?.data;
  if (!data?.message) return fallback;
  return data.details?.length ? `${data.message} :\n- ${data.details.join('\n- ')}` : data.message;
};

export default http;
