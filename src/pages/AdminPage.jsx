import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import Aurora from '../components/fx/Aurora';
import CountUp from '../components/fx/CountUp';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ACTION_LABEL = {
  register: 'Registro',
  login: 'Login',
  daily_credits: 'Créditos diarios',
  pack_open: 'Abrir sobre',
  sticker_obtained: 'Lámina obtenida',
  sticker_placed: 'Lámina pegada',
  level_up: 'Subida de nivel',
  trade_created: 'Intercambio propuesto',
  trade_accepted: 'Intercambio aceptado',
  trade_rejected: 'Intercambio rechazado',
  trade_cancelled: 'Intercambio cancelado',
  admin_view: 'Vista admin'
};

export default function AdminPage() {
  const { token, user } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [grantUser, setGrantUser] = useState('');
  const [grantCredits, setGrantCredits] = useState('');
  const [grantPacks, setGrantPacks] = useState('');
  const [granting, setGranting] = useState(false);

  const load = useCallback(async () => {
    const headers = { Authorization: `Bearer ${token}` };
    const [s, u, a] = await Promise.all([
      axios.get(`${API_URL}/admin/stats`, { headers }),
      axios.get(`${API_URL}/admin/users`, { headers }),
      axios.get(`${API_URL}/admin/activity`, { headers })
    ]);
    setStats(s.data);
    setUsers(u.data.users || []);
    setActivities(a.data.activities || []);
  }, [token]);

  useEffect(() => {
    const init = async () => {
      try {
        await load();
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [token, load]);

  const handleGrant = async (e) => {
    e.preventDefault();
    setGranting(true);
    try {
      await axios.post(`${API_URL}/admin/grant`, {
        username: grantUser,
        credits: Number(grantCredits) || 0,
        packs: Number(grantPacks) || 0
      }, { headers: { Authorization: `Bearer ${token}` } });
      await load();
      setGrantUser('');
      setGrantCredits('');
      setGrantPacks('');
      alert('Créditos/sobres otorgados.');
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || err.message));
    } finally {
      setGranting(false);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="admin-denied glass-panel">
        <h2>Acceso denegado</h2>
        <p>Esta sección es solo para administradores.</p>
      </div>
    );
  }

  return (
    <>
      <Aurora />
      <div className="admin-page">
        <h1>Panel de Administración</h1>
        {loading ? (
          <p>Cargando...</p>
        ) : (
          <>
            <div className="admin-stats">
              <div className="stat-card"><span>Usuarios</span><b><CountUp value={stats?.users || 0} /></b></div>
              <div className="stat-card"><span>Láminas</span><b><CountUp value={stats?.stickers || 0} /></b></div>
              <div className="stat-card"><span>Colecciones</span><b><CountUp value={stats?.collections || 0} /></b></div>
              <div className="stat-card"><span>Actividad</span><b><CountUp value={stats?.activities || 0} /></b></div>
            </div>

            <section className="admin-section">
              <h2>Otorgar créditos / sobres</h2>
              <form className="grant-form" onSubmit={handleGrant}>
                <input
                  type="text"
                  placeholder="Usuario"
                  value={grantUser}
                  onChange={e => setGrantUser(e.target.value)}
                  required
                  minLength={3}
                />
                <input
                  type="number"
                  placeholder="Créditos (+N)"
                  min="0"
                  value={grantCredits}
                  onChange={e => setGrantCredits(e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Sobres (+N)"
                  min="0"
                  value={grantPacks}
                  onChange={e => setGrantPacks(e.target.value)}
                />
                <button type="submit" className="btn btn-primary" disabled={granting}>
                  {granting ? 'Otorgando...' : 'Otorgar'}
                </button>
              </form>
            </section>

            <section className="admin-section">
              <h2>Usuarios</h2>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Usuario</th><th>Rol</th><th>Créditos</th><th>XP</th><th>Nivel</th><th>Sobres</th><th>Creado</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u._id}>
                      <td>{u.username}</td>
                      <td>{u.role}</td>
                      <td>{u.credits}</td>
                      <td>{u.xp}</td>
                      <td>{u.level}</td>
                      <td>{u.availablePacks?.basic ?? 0}</td>
                      <td>{new Date(u.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section className="admin-section">
              <h2>Registro de Actividad</h2>
              <ul className="activity-list">
                {activities.map(a => (
                  <li key={a._id}>
                    <span className="act-action">{ACTION_LABEL[a.action] || a.action}</span>
                    <span className="act-user">{a.username || a.userId}</span>
                    <span className="act-detail">{a.details ? JSON.stringify(a.details) : ''}</span>
                    <span className="act-time">{new Date(a.createdAt).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </div>
    </>
  );
}