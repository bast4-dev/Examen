// src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <p className="p-8">Chargement…</p>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

export default ProtectedRoute;
