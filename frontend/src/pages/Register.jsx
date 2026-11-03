// src/pages/Register.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from '../services/api';
import { getErrorMessage } from '../services/http';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Contrôle côté client pour le confort ; la validation qui fait foi est faite par l'API
    if (!/^[a-zA-Z0-9]{3,30}$/.test(formData.username)) {
      setError("Le nom d'utilisateur doit contenir 3 à 30 lettres ou chiffres.");
      return;
    }
    // Même règle que l'API : 12 caractères dont majuscule, minuscule, chiffre et caractère spécial
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,128}$/.test(formData.password)) {
      setError(
        'Le mot de passe doit contenir au moins 12 caractères, dont une majuscule, une minuscule, un chiffre et un caractère spécial.'
      );
      return;
    }

    try {
      await register(formData);
      alert('Inscription réussie ! Vous pouvez maintenant vous connecter.');
      navigate('/login');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md w-80">
        <h2 className="text-2xl font-bold mb-4 text-center">Inscription</h2>
        {error && <p className="text-red-500 mb-4 whitespace-pre-line">{error}</p>}
        <input
          type="text"
          name="username"
          placeholder="Nom d'utilisateur"
          autoComplete="username"
          required
          minLength={3}
          maxLength={30}
          value={formData.username}
          onChange={handleChange}
          className="border border-gray-300 p-2 w-full mb-4"
        />
        <input
          type="email"
          name="email"
          placeholder="Adresse email"
          autoComplete="email"
          required
          maxLength={254}
          value={formData.email}
          onChange={handleChange}
          className="border border-gray-300 p-2 w-full mb-4"
        />
        <input
          type="password"
          name="password"
          placeholder="Mot de passe (12 caractères min.)"
          autoComplete="new-password"
          required
          minLength={12}
          maxLength={128}
          value={formData.password}
          onChange={handleChange}
          className="border border-gray-300 p-2 w-full mb-4"
        />
        <button type="submit" className="bg-blue-500 text-white p-2 w-full rounded">
          S’inscrire
        </button>
      </form>
    </div>
  );
};

export default Register;
