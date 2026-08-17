import React, { useState } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:5000/api';

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      const res = await axios.post(`${API_URL}${endpoint}`, { username, password });
      login(res.data.user, res.data.token);
      navigate('/');
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="login-container">
      <div className="glass-panel">
        <h1>MiÁlbum</h1>
        <h2>{isRegister ? 'Crear Cuenta' : 'Iniciar Sesión'}</h2>
        <form onSubmit={handleSubmit}>
          <input type="text" placeholder="Usuario" value={username} onChange={e => setUsername(e.target.value)} required />
          <input type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} required />
          <button type="submit">{isRegister ? 'Registrarse' : 'Entrar'}</button>
        </form>
        <p onClick={() => setIsRegister(!isRegister)} style={{ cursor: 'pointer', marginTop: '1rem', color: '#94A3B8' }}>
          {isRegister ? '¿Ya tienes cuenta? Entra' : '¿No tienes cuenta? Regístrate'}
        </p>
      </div>
    </div>
  );
}
