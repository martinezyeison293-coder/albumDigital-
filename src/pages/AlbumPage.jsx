import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { useAlbumStore } from '../store/albumStore';
import { laminaUrl } from '../data/laminas';
import TiltedCard from '../components/fx/TiltedCard';
import CountUp from '../components/fx/CountUp';
import Confetti from '../components/fx/Confetti';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function AlbumPage() {
  const { token, user, updateUser } = useAuthStore();
  const { album, stickers, collection, setAlbumData, updateCollection } = useAlbumStore();
  const [placing, setPlacing] = useState(null);
  const [celebrate, setCelebrate] = useState(false);
  const [lastPlaced, setLastPlaced] = useState(null);

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
      updateUser({ xp: res.data.xp, credits: res.data.credits });
      setLastPlaced(stickerId);
      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 1500);
    } catch (err) {
      alert(err.response?.data?.message || 'Error al pegar');
    } finally {
      setPlacing(null);
    }
  };

  if (!album) return <div className="loading">Cargando álbum...</div>;

  const placedCount = collection?.collectedStickers?.filter(s => s.isPlaced).length || 0;
  const total = stickers.length;

  return (
    <div className="album-page">
      <Confetti active={celebrate} />
      <header className="album-header">
        <div>
          <h1 className="album-title">{album.name}</h1>
          <p className="album-subtitle">
            Progreso: <CountUp value={placedCount} /> / {total} laminas pegadas
          </p>
        </div>
        <div className="stats">
          <span className="stat-chip">XP: <CountUp value={user?.xp || 0} /></span>
          <span className="stat-chip credits-chip">Credits: {user?.credits ?? 0}</span>
          <span className="stat-chip">Sobres: {user?.availablePacks?.basic ?? 0}</span>
        </div>
      </header>

      <div className="stickers-grid">
        {stickers.map((sticker) => {
          const inCollection = collection?.collectedStickers.find(s => s.stickerId === sticker._id);
          const isPlaced = inCollection?.isPlaced;
          const hasUnplaced = inCollection && inCollection.quantity > 0 && !isPlaced;

          return (
            <AnimatePresence key={sticker._id}>
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              >
                {isPlaced ? (
                  <TiltedCard maxTilt={8}>
                    <div className={`sticker-slot placed rarity-${sticker.rarity}`}>
                      <div className="slot-number">#{sticker.number}</div>
                      {lastPlaced === sticker._id ? (
                        <motion.img
                          key={`placed-${sticker._id}`}
                          src={laminaUrl(sticker.image)}
                          alt={sticker.name}
                          className="sticker-image"
                          initial={{ scale: 0, rotateY: 180 }}
                          animate={{ scale: 1, rotateY: 0 }}
                          transition={{ type: 'spring', stiffness: 120, damping: 12 }}
                        />
                      ) : (
                        <img src={laminaUrl(sticker.image)} alt={sticker.name} className="sticker-image" />
                      )}
                      <div className="sticker-info">
                        <span className="sticker-name">{sticker.number}</span>
                        <span className={`rarity-chip rarity-${sticker.rarity}`}>{sticker.rarity}</span>
                      </div>
                    </div>
                  </TiltedCard>
                ) : (
                  <div className={`sticker-slot empty`}>
                    <div className="slot-number">#{sticker.number}</div>
                    <div className="placeholder">?</div>
                    <div className="sticker-info">
                      {hasUnplaced && (
                        <button className="btn-place" disabled={placing === sticker._id} onClick={() => handlePlaceSticker(sticker._id)}>
                          {placing === sticker._id ? 'Pegando...' : 'Pegar'} +10 XP
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          );
        })}
      </div>
    </div>
  );
}