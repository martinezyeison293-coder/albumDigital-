import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from './store/authStore';
import LoginPage from './pages/LoginPage';
import AlbumPage from './pages/AlbumPage';
import PackOpeningPage from './pages/PackOpeningPage';
import AdminPage from './pages/AdminPage';
import TradesPage from './pages/TradesPage';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Error capturado:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: '2rem', maxWidth: 800, margin: '10vh auto', fontFamily: 'monospace' }}>
          <h2 style={{ color: '#FFD700' }}>⚠️ Algo salió mal</h2>
          <pre style={{ background: '#1A1A2E', padding: '1rem', borderRadius: 8, whiteSpace: 'pre-wrap', color: '#F1F5F9' }}>
            {this.state.error?.toString()}
          </pre>
          <button
            onClick={() => { this.setState({ error: null }); window.location.href = '/'; }}
            style={{ padding: '0.7rem 1.5rem', background: '#6C63FF', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}
          >
            Volver al inicio
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function ProtectedRoute({ children }) {
  const { token, user } = useAuthStore();
  if (!token) return <Navigate to="/login" />;
  if (!user) return <div className="loading">Cargando sesión...</div>;
  return children;
}

// Restaura los datos del usuario al recargar la página (el token vive en localStorage)
function SessionRestore() {
  const { token, user, updateUser, logout } = useAuthStore();

  useEffect(() => {
    if (!token || user) return;
    let cancelled = false;
    axios.get(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (!cancelled) updateUser(res.data.user);
      })
      .catch(() => {
        if (!cancelled) logout();
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return null;
}

function Navbar() {
  const { token, logout, user } = useAuthStore();
  if (!token) return null;

  return (
    <nav className="navbar">
      <div className="logo">🎴 MiÁlbum</div>
      <div className="links">
        <Link to="/">Álbum</Link>
        <Link to="/packs">Abrir Sobres</Link>
        <Link to="/trades">Intercambios</Link>
        {user?.role === 'admin' && <Link to="/admin" className="admin-link">Admin</Link>}
      </div>
      <div className="user-info">
        <span className="nav-credits">💠 {user?.credits ?? 0}</span>
        <span>{user?.username} (Nvl {user?.level})</span>
        <button onClick={logout} className="btn-logout">Salir</button>
      </div>
    </nav>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <SessionRestore />
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute><AlbumPage /></ProtectedRoute>} />
          <Route path="/packs" element={<ProtectedRoute><PackOpeningPage /></ProtectedRoute>} />
          <Route path="/trades" element={<ProtectedRoute><TradesPage /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;