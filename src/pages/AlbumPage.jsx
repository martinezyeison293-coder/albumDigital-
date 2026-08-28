import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { useAlbumStore } from '../store/albumStore';
import { laminaUrl } from '../data/laminas';
import ProfileCard from '../components/fx/ProfileCard';
import CountUp from '../components/fx/CountUp';
import Confetti from '../components/fx/Confetti';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const PAGE_SIZE = 10;

const RARITY_INFO = {
  common: { label: 'Común', glow: 'rgba(156,163,175,0.25)' },
  rare: { label: 'Rara', glow: 'rgba(108,99,255,0.25)' },
  epic: { label: 'Épica', glow: 'rgba(168,85,247,0.25)' },
  legendary: { label: 'Legendaria', glow: 'rgba(255,215,0,0.25)' }
};

export default function AlbumPage() {
  const { token, user, updateUser } = useAuthStore();
  const { album, stickers, collection, openPack, setAlbumData, updateCollection, clearOpenPack } = useAlbumStore();
  const [currentPage, setCurrentPage] = useState(0);
  const [placing, setPlacing] = useState(null);
  const [celebrate, setCelebrate] = useState(false);
  const [dragSticker, setDragSticker] = useState(null);
  const [dropOver, setDropOver] = useState(null);

  const fetchAlbum = async () => {
    try {
      const res = await axios.get(`${API_URL}/albums/current`, { headers: { Authorization: `Bearer ${token}` } });
      setAlbumData(res.data.album, res.data.stickers, res.data.collection);
    } catch (err) {
      console.error('Failed to fetch album', err);
    }
  };

  useEffect(() => {
    fetchAlbum();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePlaceSticker = async (stickerId) => {
    setPlacing(stickerId);
    try {
      const res = await axios.post(`${API_URL}/collection/place/${stickerId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      updateCollection(res.data.collection);
      updateUser({ xp: res.data.xp, credits: res.data.credits, level: res.data.level, availablePacks: res.data.availablePacks });
      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 1500);
    } catch (err) {
      alert(err.response?.data?.message || 'Error al pegar');
    } finally {
      setPlacing(null);
    }
  };

  const takeFromPack = async (sticker) => {
    setPlacing(sticker._id);
    try {
      const res = await axios.post(`${API_URL}/collection/place/${sticker._id}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      updateCollection(res.data.collection);
      updateUser({ xp: res.data.xp, credits: res.data.credits, level: res.data.level, availablePacks: res.data.availablePacks });
      const remaining = openPack.filter((s) => s._id !== sticker._id);
      if (remaining.length) {
        useAlbumStore.getState().setOpenPack(remaining);
      } else {
        clearOpenPack();
      }
      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 1500);
    } catch (err) {
      alert(err.response?.data?.message || 'Error al pegar');
    } finally {
      setPlacing(null);
    }
  };

  const stickerPage = (sticker) => Math.floor((sticker.number - 1) / PAGE_SIZE);

  const handleDragStart = (e, sticker) => {
    setDragSticker(sticker);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', sticker._id);
    try {
      e.dataTransfer.setDragImage(e.currentTarget, 40, 40);
    } catch { /* ignore */ }
  };

  const handleDragEnd = () => {
    setDragSticker(null);
    setDropOver(null);
  };

  const handleSlotDragOver = (e, sticker) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropOver(sticker._id);
  };

  const handleSlotDragLeave = () => setDropOver(null);

  const handleSlotDrop = (e, sticker) => {
    e.preventDefault();
    setDropOver(null);
    if (!dragSticker) return;
    if (dragSticker._id === sticker._id) {
      takeFromPack(dragSticker);
    } else {
      alert(`Esa lámina (#${dragSticker.number}) va en la sección ${stickerPage(dragSticker) + 1}. Navega hasta ahí y suéltala en su lugar.`);
    }
    setDragSticker(null);
  };

  if (!album) return <div className="loading">Cargando álbum...</div>;

  const sortedStickers = [...stickers].sort((a, b) => (a.number || 0) - (b.number || 0));
  const total = sortedStickers.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(currentPage, totalPages - 1);
  const pageItems = sortedStickers.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const firstNumber = pageItems.length ? pageItems[0].number : '-';
  const lastNumber = pageItems.length ? pageItems[pageItems.length - 1].number : '-';
  const placedTotal = collection?.collectedStickers?.filter(s => s.isPlaced).length || 0;
  const placedInPage = pageItems.filter(s => collection?.collectedStickers?.some(c => c.stickerId === s._id && c.isPlaced)).length;

  const goPrev = () => setCurrentPage(p => Math.max(0, p - 1));
  const goNext = () => setCurrentPage(p => Math.min(totalPages - 1, p + 1));

  return (
    <div className="album-page">
      <Confetti active={celebrate} />

      <header className="album-header">
        <div>
          <h1 className="album-title">{album.name}</h1>
          <p className="album-subtitle">
            Progreso: <CountUp value={placedTotal} /> / {total} laminas pegadas
          </p>
        </div>
        <div className="stats">
          <span className="stat-chip">XP: <CountUp value={user?.xp || 0} /></span>
          <span className="stat-chip credits-chip">Credits: {user?.credits ?? 0}</span>
          <span className="stat-chip">Sobres: {user?.availablePacks?.basic ?? 0}</span>
        </div>
      </header>

      <div className={`album-with-pack${openPack && openPack.length > 0 ? ' has-pack' : ''}`}>
        {openPack && openPack.length > 0 && (
          <motion.aside
            className="open-pack"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <div className="open-pack-head">
              <h2>🛍️ Tu sobre</h2>
              <span className="openpack-count">{openPack.length} dentro</span>
            </div>

            <div className="open-pack-envelope">
              <div className="open-pack-flap" />
              <div className="open-pack-stickers">
                {openPack.map((sticker, i) => {
                  const ri = RARITY_INFO[sticker.rarity] || RARITY_INFO.common;
                  const targetPage = stickerPage(sticker);
                  const inThisPage = targetPage === page;
                  return (
                    <div
                      key={sticker._id}
                      className={`open-pack-sticker${dragSticker?._id === sticker._id ? ' dragging' : ''}`}
                      style={{ '--i': i, '--card-glow': ri.glow }}
                      draggable
                      onDragStart={(e) => handleDragStart(e, sticker)}
                      onDragEnd={handleDragEnd}
                      title="Agárrala y suéltala sobre su lugar en el álbum"
                    >
                      <img src={laminaUrl(sticker.image)} alt={sticker.name} className="open-pack-sticker-img" />
                      <div className="open-pack-sticker-body">
                        <span className={`openpack-rarity rarity-${sticker.rarity}`}>{ri.label}</span>
                        <span className={`openpack-target ${inThisPage ? 'ok' : ''}`}>
                          {inThisPage ? '✓ Va aquí (esta sección)' : `Lugar: sección ${targetPage + 1}`}
                        </span>
                        <button
                          className="btn-place"
                          disabled={placing === sticker._id}
                          onClick={() => takeFromPack(sticker)}
                        >
                          {placing === sticker._id ? 'Pegando…' : 'Pegar +10 XP'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="open-pack-hint">Arrastra cada lámina hasta su hueco en el álbum</p>
            </div>
          </motion.aside>
        )}

        <div className="album-book-wrap">
          <div className="album-book">
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            className="album-page-flip"
            initial={{ rotateY: -70, opacity: 0, x: -80 }}
            animate={{ rotateY: 0, opacity: 1, x: 0 }}
            exit={{ rotateY: 70, opacity: 0, x: 80 }}
            transition={{ duration: 0.45, ease: 'easeInOut' }}
          >
            <div className="page-card">
              <div className="page-header">
                <div className="page-section">
                  <span className="page-title">Sección {page + 1}</span>
                  <span className="page-range">Láminas #{firstNumber}–#{lastNumber}</span>
                </div>
                <div className="page-progress">
                  <span><CountUp value={placedInPage} /> / {pageItems.length} pegadas</span>
                  <div className="page-progress-bar">
                    <div className="page-progress-fill" style={{ width: `${pageItems.length ? (placedInPage / pageItems.length) * 100 : 0}%` }} />
                  </div>
                </div>
              </div>

              <div className="stickers-grid">
                {pageItems.map((sticker) => {
                  const inCollection = collection?.collectedStickers.find(s => s.stickerId === sticker._id);
                  const isPlaced = inCollection?.isPlaced;
                  const hasUnplaced = inCollection && inCollection.quantity > 0 && !isPlaced;
                  const ri = RARITY_INFO[sticker.rarity] || RARITY_INFO.common;
                  const canDrop = dragSticker && dragSticker._id === sticker._id;
                  const isDropTarget = dropOver === sticker._id;

                  return (
                    <motion.div
                      key={sticker._id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                      onDragOver={(e) => handleSlotDragOver(e, sticker)}
                      onDragLeave={handleSlotDragLeave}
                      onDrop={(e) => handleSlotDrop(e, sticker)}
                    >
                      <div className={`sticker-slot-wrap${isDropTarget ? ' drop-target' : ''}${canDrop ? ' can-drop' : ''}`}>
                      {isPlaced ? (
                        <ProfileCard
                          className="sticker-profile"
                          avatarUrl={laminaUrl(sticker.image)}
                          iconUrl={laminaUrl(sticker.image)}
                          name={sticker.name}
                          title={ri.label}
                          handle={`#${sticker.number}`}
                          status={ri.label}
                          rarity={sticker.rarity}
                          behindGlowColor={ri.glow}
                          showUserInfo
                          contactText={hasUnplaced ? 'Pegar' : undefined}
                          onContactClick={hasUnplaced ? () => handlePlaceSticker(sticker._id) : undefined}
                        />
                      ) : (
                        <div className="sticker-slot empty">
                          <div className="slot-number">#{sticker.number}</div>
                          <div className="placeholder">?</div>
                          <div className="sticker-info">
                            {canDrop && <span className="drop-hint">Suelta aquí</span>}
                            {hasUnplaced && (
                              <button className="btn-place" disabled={placing === sticker._id} onClick={() => handlePlaceSticker(sticker._id)}>
                                {placing === sticker._id ? 'Pegando...' : 'Pegar'} +10 XP
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
          </div>

          <div className="page-nav">
            <button className="nav-btn" onClick={goPrev} disabled={page === 0} aria-label="Página anterior">‹</button>
            <div className="page-dots">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  className={`page-dot${i === page ? ' active' : ''}`}
                  onClick={() => setCurrentPage(i)}
                  aria-label={`Ir a sección ${i + 1}`}
                  title={`Sección ${i + 1}`}
                />
              ))}
            </div>
            <button className="nav-btn" onClick={goNext} disabled={page === totalPages - 1} aria-label="Página siguiente">›</button>
          </div>
        </div>
      </div>
    </div>
  );
}