import React from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import LoginPage from './pages/LoginPage';
import AlbumPage from './pages/AlbumPage';
import PackOpeningPage from './pages/PackOpeningPage';
import AdminPage from './pages/AdminPage';

function ProtectedRoute({ children }) {
  const { token } = useAuthStore();
  if (!token) return <Navigate to="/login" />;
  return children;
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
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<ProtectedRoute><AlbumPage /></ProtectedRoute>} />
        <Route path="/packs" element={<ProtectedRoute><PackOpeningPage /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;