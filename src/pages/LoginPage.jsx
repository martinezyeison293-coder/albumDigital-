import React, { useState } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import Aurora from '../components/fx/Aurora';
import GradientText from '../components/fx/GradientText';
import ClickSpark from '../components/fx/ClickSpark';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      const res = await axios.post(`${API_URL}${endpoint}`, { username, password });
      login(res.data.user, res.data.token);
      if (isRegister) alert('¡Bienvenido! Recibiste 100 créditos para abrir sobres.');
      else if (res.data.dailyCreditsGranted) alert('¡Bono diario! +20 créditos.');
      navigate('/');
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Aurora />
      <div className="login-container">
        <ClickSpark className="login-spark">
          <div className="glass-panel">
            <h1><GradientText>MiÁlbum</GradientText></h1>
            <h2>{isRegister ? 'Crear Cuenta' : 'Iniciar Sesión'}</h2>
            <form onSubmit={handleSubmit}>
              <input type="text" placeholder="Usuario" value={username} onChange={e => setUsername(e.target.value)} required />
              <input type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} required />
              <button type="submit" disabled={loading}>{loading ? '...' : (isRegister ? 'Registrarse' : 'Entrar')}</button>
            </form>
            <p className="welcome-hint">
              {isRegister
                ? 'Al registrarte recibes 100 créditos para abrir sobres y coleccionar láminas.'
                : 'Cada día recibes +20 créditos al iniciar sesión.'}
            </p>
            <p onClick={() => setIsRegister(!isRegister)} className="toggle-link">
              {isRegister ? '¿Ya tienes cuenta? Entra' : '¿No tienes cuenta? Regístrate'}
            </p>
          </div>
        </ClickSpark>
      </div>
    </>
  );
}