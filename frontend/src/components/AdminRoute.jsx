// src/components/AdminRoute.jsx
// Confort d'affichage uniquement : la vraie protection est le contrôle du rôle par l'API
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <p className="p-8">Chargement…</p>;
  if (user?.role !== 'admin') return <Navigate to="/" replace />;
  return children;
};

export default AdminRoute;
