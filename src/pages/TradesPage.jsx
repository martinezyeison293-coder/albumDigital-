import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { laminaUrl } from '../data/laminas';
import ProfileCard from '../components/fx/ProfileCard';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const PACK_LABELS = { basic: 'Básico', premium: 'Premium', legendary: 'Legendario' };
const RARITY_LABELS = { common: 'Común', rare: 'Rara', epic: 'Épica', legendary: 'Legendaria' };
const RARITY_GLOW = {
  common: 'rgba(156,163,175,0.25)',
  rare: 'rgba(108,99,255,0.25)',
  epic: 'rgba(168,85,247,0.25)',
  legendary: 'rgba(255,215,0,0.25)'
};
const STATUS_INFO = {
  pending: { label: 'Pendiente', cls: 'badge-pending' },
  accepted: { label: 'Aceptado', cls: 'badge-accepted' },
  rejected: { label: 'Rechazado', cls: 'badge-rejected' },
  cancelled: { label: 'Cancelado', cls: 'badge-cancelled' }
};

function itemKey(item) {
  return item.kind === 'pack' ? `pack:${item.packType}` : `sticker:${item.stickerId}`;
}

function StickerPick({ sticker, selected, onToggle }) {
  const glow = RARITY_GLOW[sticker.rarity] || RARITY_GLOW.common;
  return (
    <div
      className={`trade-sticker${selected ? ' selected' : ''}`}
      onClick={onToggle}
      title={`${sticker.name} · ${RARITY_LABELS[sticker.rarity] || sticker.rarity}`}
      style={{ cursor: 'pointer' }}
    >
      <ProfileCard
        className="sticker-profile"
        avatarUrl={laminaUrl(sticker.image)}
        iconUrl={laminaUrl(sticker.image)}
        name={sticker.name}
        title={RARITY_LABELS[sticker.rarity] || sticker.rarity}
        handle={`#${sticker.number}`}
        status={RARITY_LABELS[sticker.rarity] || sticker.rarity}
        rarity={sticker.rarity}
        behindGlowColor={glow}
        showUserInfo
        enableTilt={false}
      />
    </div>
  );
}

function PackPicks({ counts, selectedSet, onToggle }) {
  return (
    <div className="pack-picks">
      {Object.entries(PACK_LABELS).map(([type, label]) => {
        const count = counts?.[type] || 0;
        if (count <= 0) return null;
        return (
          <button
            key={type}
            type="button"
            className={`pack-pick${selectedSet.has(`pack:${type}`) ? ' selected' : ''}`}
            onClick={() => onToggle(`pack:${type}`)}
          >
            📦 Sobre {label} ({count})
          </button>
        );
      })}
    </div>
  );
}

function ItemChips({ items }) {
  return (
    <div className="trade-items">
      {items.map((item, i) => (
        <span key={i} className="trade-item-chip">
          {item.kind === 'pack'
            ? `📦 ${PACK_LABELS[item.packType]}`
            : `🖼️ #${item.stickerId?.number} ${item.stickerId?.name || ''}`}
        </span>
      ))}
    </div>
  );
}

export default function TradesPage() {
  const { token, user } = useAuthStore();
  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  const [mine, setMine] = useState(null);
  const [trades, setTrades] = useState([]);
  const [loadingTrades, setLoadingTrades] = useState(true);

  const [partnerUsername, setPartnerUsername] = useState('');
  const [searching, setSearching] = useState(false);
  const [partner, setPartner] = useState(null);
  const [partnerError, setPartnerError] = useState('');

  const [offerSel, setOfferSel] = useState(new Set());
  const [requestSel, setRequestSel] = useState(new Set());
  const [creating, setCreating] = useState(false);
  const [busyTrade, setBusyTrade] = useState(null);

  const loadTrades = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/trades`, authHeaders);
      setTrades(res.data.trades || []);
    } catch (err) {
      console.error('Error cargando intercambios', err);
    } finally {
      setLoadingTrades(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (!user) return;
    axios.get(`${API_URL}/trades/tradeable/${encodeURIComponent(user.username)}`, authHeaders)
      .then((res) => setMine(res.data))
      .catch((err) => console.error('Error cargando tus items', err));
    loadTrades();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user?.username]);

  const toggleSel = (setter) => (key) => {
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const searchPartner = async () => {
    const name = partnerUsername.trim();
    if (!name) return;
    if (name === user.username) {
      setPartner(null);
      setPartnerError('No puedes intercambiar contigo mismo');
      return;
    }
    setSearching(true);
    setPartnerError('');
    setPartner(null);
    setRequestSel(new Set());
    try {
      const res = await axios.get(`${API_URL}/trades/tradeable/${encodeURIComponent(name)}`, authHeaders);
      setPartner(res.data);
    } catch (err) {
      setPartnerError(err.response?.data?.message || 'Usuario no encontrado');
    } finally {
      setSearching(false);
    }
  };

  const buildItems = (selSet) =>
    Array.from(selSet).map((key) =>
      key.startsWith('pack:')
        ? { kind: 'pack', packType: key.slice(5) }
        : { kind: 'sticker', stickerId: key.slice(8) }
    );

  const canCreate = offerSel.size > 0 && requestSel.size > 0 && partner && !creating;

  const handleCreate = async () => {
    setCreating(true);
    try {
      await axios.post(`${API_URL}/trades`, {
        toUsername: partner.user.username,
        offer: buildItems(offerSel),
        request: buildItems(requestSel)
      }, authHeaders);
      setOfferSel(new Set());
      setRequestSel(new Set());
      alert('Propuesta enviada. Espera la respuesta del otro usuario.');
      await Promise.all([loadTrades()]);
    } catch (err) {
      alert(err.response?.data?.message || 'Error al crear el intercambio');
    } finally {
      setCreating(false);
    }
  };

  const tradeAction = async (id, action) => {
    setBusyTrade(id);
    try {
      await axios.post(`${API_URL}/trades/${id}/${action}`, {}, authHeaders);
      await loadTrades();
    } catch (err) {
      alert(err.response?.data?.message || 'Error en la operación');
    } finally {
      setBusyTrade(null);
    }
  };

  const incoming = trades.filter((t) => t.status === 'pending' && t.toUser?._id === user.id);
  const outgoing = trades.filter((t) => t.status === 'pending' && t.fromUser?._id === user.id);
  const history = trades.filter((t) => t.status !== 'pending');

  const renderSide = (title, data, sel, toggler) => (
    <div className="trade-panel glass-panel">
      <h3>{title}</h3>
      {!data ? (
        <p className="trade-empty">—</p>
      ) : (
        <>
          <PackPicks
            counts={data.availablePacks}
            selectedSet={sel}
            onToggle={toggler}
          />
          {data.stickers.length === 0 ? (
            <p className="trade-empty">Sin láminas disponibles para intercambiar</p>
          ) : (
            <div className="trade-grid">
              {data.stickers.map((s) => (
                <StickerPick
                  key={s._id}
                  sticker={s}
                  selected={sel.has(itemKey({ kind: 'sticker', stickerId: s._id }))}
                  onToggle={() => toggler(itemKey({ kind: 'sticker', stickerId: s._id }))}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );

  const renderTradeRow = (t) => {
    const isReceiver = t.toUser?._id === user.id;
    const status = STATUS_INFO[t.status];
    return (
      <li key={t._id} className="trade-row">
        <div className="trade-row-main">
          <div className="trade-parties">
            {t.fromUser?.username} → {t.toUser?.username}
            <span className={`trade-badge ${status.cls}`}>{status.label}</span>
          </div>
          <div className="trade-exchange">
            <ItemChips items={t.offeredItems} />
            <span className="trade-arrow">⇄</span>
            <ItemChips items={t.requestedItems} />
          </div>
        </div>
        {t.status === 'pending' && (
          <div className="trade-actions">
            {isReceiver ? (
              <>
                <button className="btn-place" disabled={busyTrade === t._id} onClick={() => tradeAction(t._id, 'accept')}>Aceptar</button>
                <button className="btn-reject" disabled={busyTrade === t._id} onClick={() => tradeAction(t._id, 'reject')}>Rechazar</button>
              </>
            ) : (
              <button className="btn-reject" disabled={busyTrade === t._id} onClick={() => tradeAction(t._id, 'cancel')}>Cancelar</button>
            )}
          </div>
        )}
      </li>
    );
  };

  return (
    <div className="trade-page">
      <header className="album-header">
        <div>
          <h1 className="album-title">Intercambios</h1>
          <p className="album-subtitle">Canjea láminas repetidas y sobres con otros usuarios</p>
        </div>
        <div className="stats">
          <span className="stat-chip">Usuario: <b>{user?.username}</b></span>
        </div>
      </header>

      <section className="trade-create">
        <div className="trade-search">
          <input
            type="text"
            placeholder="Usuario con quien intercambiar..."
            value={partnerUsername}
            onChange={(e) => setPartnerUsername(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchPartner()}
          />
          <button className="btn-search" onClick={searchPartner} disabled={searching}>
            {searching ? 'Buscando...' : 'Buscar'}
          </button>
        </div>
        {partnerError && <p className="trade-error">{partnerError}</p>}
        {partner && (
          <p className="trade-found">
            Intercambiando con <b>{partner.user.username}</b> · selecciona lo que ofreces y lo que pides
          </p>
        )}

        <div className="trade-columns">
          {renderSide('Ofreces (tuyos)', mine, offerSel, toggleSel(setOfferSel))}
          {renderSide(
            partner ? `Pides (de ${partner.user.username})` : 'Pides (busca un usuario)',
            partner,
            requestSel,
            toggleSel(setRequestSel)
          )}
        </div>

        <div className="trade-submit">
          <button className="btn-primary" disabled={!canCreate} onClick={handleCreate}>
            {creating ? 'Enviando...' : 'Proponer intercambio'}
          </button>
        </div>
      </section>

      <section className="admin-section">
        <h2>Solicitudes recibidas ({incoming.length})</h2>
        {loadingTrades ? (
          <p className="trade-empty">Cargando...</p>
        ) : incoming.length === 0 ? (
          <p className="trade-empty">No tienes propuestas pendientes.</p>
        ) : (
          <ul className="trade-list">{incoming.map(renderTradeRow)}</ul>
        )}
      </section>

      <section className="admin-section">
        <h2>Tus propuestas enviadas ({outgoing.length})</h2>
        {outgoing.length === 0 ? (
          <p className="trade-empty">No hay propuestas activas.</p>
        ) : (
          <ul className="trade-list">{outgoing.map(renderTradeRow)}</ul>
        )}
      </section>

      <section className="admin-section">
        <h2>Historial</h2>
        {history.length === 0 ? (
          <p className="trade-empty">Sin historial todavía.</p>
        ) : (
          <ul className="trade-list">{history.map(renderTradeRow)}</ul>
        )}
      </section>
    </div>
  );
}
