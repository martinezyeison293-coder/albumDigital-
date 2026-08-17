import React, { useState } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import { laminaByFile, laminaUrl } from '../data/laminas';
import ClickSpark from '../components/fx/ClickSpark';
import Confetti from '../components/fx/Confetti';
import CountUp from '../components/fx/CountUp';
import ProfileCard from '../components/fx/ProfileCard';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const PACK_IMG = laminaByFile['sobre.png'] || '/pack/pack.png';

const RARITY_INFO = {
  common: { label: 'Común', glow: 'rgba(156,163,175,0.5)' },
  rare: { label: 'Rara', glow: 'rgba(108,99,255,0.7)' },
  epic: { label: 'Épica', glow: 'rgba(168,85,247,0.75)' },
  legendary: { label: 'Legendaria', glow: 'rgba(255,215,0,0.85)' }
};

export default function PackOpeningPage() {
  const { token, user, updateUser } = useAuthStore();
  const [opening, setOpening] = useState(false);
  const [revealedStickers, setRevealedStickers] = useState([]);
  const [newOnes, setNewOnes] = useState([]);
  const [celebrate, setCelebrate] = useState(false);

  const handleOpenPack = async () => {
    if (opening) return;
    const free = (user?.availablePacks?.basic || 0) + (user?.availablePacks?.premium || 0);
    if (free <= 0 && (user?.credits || 0) < 25) {
      alert('No tienes sobres ni créditos suficientes (25 créditos por sobre).');
      return;
    }

    setOpening(true);
    setRevealedStickers([]);
    setNewOnes([]);

    try {
      const res = await axios.post(`${API_URL}/packs/open`, {}, { headers: { Authorization: `Bearer ${token}` } });
      updateUser({ availablePacks: res.data.availablePacks, credits: res.data.credits });
      setNewOnes(res.data.newOnes.map(s => s.number));

      setTimeout(() => {
        setOpening(false);
        setRevealedStickers(res.data.obtainedStickers);
        const hasSpecial = res.data.obtainedStickers.some(s => s.rarity === 'epic' || s.rarity === 'legendary');
        if (hasSpecial) {
          setCelebrate(true);
          setTimeout(() => setCelebrate(false), 3000);
        }
      }, 2200);
    } catch (err) {
      setOpening(false);
      const msg = err.response?.data?.message || 'Error al abrir';
      alert(msg);
    }
  };

  const rarityLabel = { common: 'Común', rare: 'Rara', epic: 'Épica', legendary: 'Legendaria' };
  const isNew = (sticker) => newOnes.includes(sticker.number);

  return (
    <div className="pack-page">
      <Confetti active={celebrate} />
      <h2>Abrir Sobres</h2>
      <div className="pack-meta">
        <span className="stat-chip">Credits: <CountUp value={user?.credits || 0} /></span>
        <span className="stat-chip">Sobres: {(user?.availablePacks?.basic || 0) + (user?.availablePacks?.premium || 0)}</span>
        <span className="stat-chip pack-cost">Costo libre: 1 sobre · sin sobres: 25 créditos</span>
      </div>

      <div className="pack-container">
        {!opening && revealedStickers.length === 0 && (
          <motion.div
            className="pack"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleOpenPack}
          >
            <ClickSpark sparkColor="#ffd700" spawnCount={14}>
              <img src={PACK_IMG} alt="Sobre" className="pack-img" />
            </ClickSpark>
            <p>Click para abrir</p>
          </motion.div>
        )}

        {opening && (
          <motion.div
            className="pack opening"
            animate={{ rotate: [0, -12, 12, -12, 12, 0], scale: [1, 1.15, 1] }}
            transition={{ duration: 0.6, repeat: Infinity }}
          >
            <img src={PACK_IMG} alt="Abriendo..." className="pack-img" />
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {revealedStickers.length > 0 && (
          <motion.div
            className="revealed-stickers"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
          >
            <h3>¡Obtuviste estas láminas!</h3>
            <div className="stickers-row">
              {revealedStickers.map((sticker, i) => {
                const ri = RARITY_INFO[sticker.rarity] || RARITY_INFO.common;
                return (
                  <motion.div
                    key={i}
                    className="reveal-card"
                    initial={{ opacity: 0, scale: 0.5, rotateY: 90 }}
                    animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                    transition={{ delay: i * 0.4, duration: 0.55 }}
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    <ProfileCard
                      className="sticker-profile"
                      avatarUrl={laminaUrl(sticker.image)}
                      name={sticker.name}
                      title={rarityLabel[sticker.rarity]}
                      handle={`#${sticker.number}`}
                      status={isNew(sticker) ? '¡NUEVA!' : rarityLabel[sticker.rarity]}
                      behindGlowColor={ri.glow}
                      contactText={isNew(sticker) ? 'NUEVA' : 'REPETIDA'}
                    />
                  </motion.div>
                );
              })}
            </div>
            <button className="btn-primary" onClick={() => setRevealedStickers([])}>Continuar</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}