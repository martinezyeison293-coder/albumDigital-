import React, { useState } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import { laminaByFile, laminaUrl } from '../data/laminas';
import Confetti from '../components/fx/Confetti';
import CountUp from '../components/fx/CountUp';
import ProfileCard from '../components/fx/ProfileCard';
import PackTear from '../components/PackTear';
import LevelUpOverlay from '../components/progression/LevelUpOverlay';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const PACK_IMG = laminaByFile['sobre.png'] || '/pack/pack.png';

const RARITY_INFO = {
  common: { label: 'Común', glow: 'rgba(156,163,175,0.25)' },
  rare: { label: 'Rara', glow: 'rgba(108,99,255,0.25)' },
  epic: { label: 'Épica', glow: 'rgba(168,85,247,0.25)' },
  legendary: { label: 'Legendaria', glow: 'rgba(255,215,0,0.25)' }
};

const PACK_TYPES = {
  basic: {
    label: 'Sobre Básico',
    cost: 25,
    cards: '5 láminas',
    desc: 'Sin garantía',
    glow: 'rgba(108,99,255,0.6)'
  },
  premium: {
    label: 'Sobre Premium',
    cost: 60,
    cards: '5 láminas',
    desc: 'Mín. 1 Rara garantizada',
    glow: 'rgba(168,85,247,0.7)'
  },
  legendary: {
    label: 'Sobre Legendario',
    cost: 150,
    cards: '7 láminas',
    desc: 'Mín. 1 Épica + chance Legendaria',
    glow: 'rgba(255,215,0,0.8)'
  }
};

export default function PackOpeningPage() {
  const { token, user, updateUser } = useAuthStore();
  const [packType, setPackType] = useState('basic');
  const [opening, setOpening] = useState(false);
  const [revealedStickers, setRevealedStickers] = useState([]);
  const [newOnes, setNewOnes] = useState([]);
  const [celebrate, setCelebrate] = useState(false);
  const [xpGained, setXpGained] = useState(0);
  const [levelUp, setLevelUp] = useState(null);

  const packsOf = (type) => user?.availablePacks?.[type] || 0;
  const canOpen = () => packsOf(packType) > 0 || (user?.credits || 0) >= PACK_TYPES[packType].cost;

  const handleOpenPack = async () => {
    if (opening) return;
    if (!canOpen()) {
      alert(`No tienes sobres ${PACK_TYPES[packType].label} ni créditos suficientes (${PACK_TYPES[packType].cost} créditos).`);
      return;
    }

    setOpening(true);
    setRevealedStickers([]);
    setNewOnes([]);
    setXpGained(0);
    setLevelUp(null);

    try {
      const res = await axios.post(
        `${API_URL}/packs/open`,
        { type: packType },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      updateUser({
        availablePacks: res.data.availablePacks,
        credits: res.data.credits,
        xp: res.data.xp,
        level: res.data.level
      });
      setNewOnes(res.data.newOnes.map((s) => s.number));

      setTimeout(() => {
        setOpening(false);
        setRevealedStickers(res.data.obtainedStickers);
        setXpGained(res.data.xpGained || 0);
        if (res.data.leveledUp) {
          setLevelUp({
            previousLevel: res.data.previousLevel,
            newLevel: res.data.level,
            unlocks: res.data.unlocks,
            packsGranted: res.data.packsGranted
          });
        }
        const hasSpecial = res.data.obtainedStickers.some(
          (s) => s.rarity === 'epic' || s.rarity === 'legendary'
        );
        if (hasSpecial) {
          setCelebrate(true);
          setTimeout(() => setCelebrate(false), 3000);
        }
      }, 2200);
    } catch (err) {
      setOpening(false);
      console.error('Error al abrir sobre:', err);
      const msg = err.response?.data?.message || err.message || 'Error al abrir';
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
        <span className="stat-chip">
          Credits: <CountUp value={user?.credits || 0} />
        </span>
        <span className="stat-chip">XP: <CountUp value={user?.xp || 0} /></span>
        <span className="stat-chip">Nivel: {user?.level ?? 1}</span>
      </div>

      {!opening && revealedStickers.length === 0 && (
        <div className="pack-type-selector">
          {Object.entries(PACK_TYPES).map(([type, info]) => (
            <button
              key={type}
              className={`pack-type-card${packType === type ? ' selected' : ''}`}
              style={{ '--pack-glow': info.glow }}
              onClick={() => setPackType(type)}
              disabled={opening}
            >
              <span className="pack-type-count">{packsOf(type)}</span>
              <span className="pack-type-label">{info.label}</span>
              <span className="pack-type-cards">{info.cards}</span>
              <span className="pack-type-desc">{info.desc}</span>
              <span className="pack-type-cost">
                {packsOf(type) > 0 ? '¡Gratis!' : `${info.cost} créditos`}
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="pack-container">
        {!opening && revealedStickers.length === 0 && (
          <div className={`pack idle-pack pack-${packType}`}>
            <PackTear src={PACK_IMG} onOpen={handleOpenPack} disabled={!canOpen() || opening} />
            <p className="pack-hint">Mantén presionado y arrastra hacia un lado para rasgar el sobre</p>
          </div>
        )}

        {opening && (
          <motion.div
            className={`pack opening pack-${packType}`}
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
            <span className="xp-gain-chip">+{xpGained} XP</span>
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
            <button className="btn-primary" onClick={() => setRevealedStickers([])}>
              Continuar
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <LevelUpOverlay levelUp={levelUp} onClose={() => setLevelUp(null)} />
    </div>
  );
}
