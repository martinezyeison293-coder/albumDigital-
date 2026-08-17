import React, { useState } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = 'http://localhost:5000/api';

export default function PackOpeningPage() {
  const { token, user, updateUser } = useAuthStore();
  const [opening, setOpening] = useState(false);
  const [revealedStickers, setRevealedStickers] = useState([]);

  const handleOpenPack = async () => {
    if (user?.availablePacks?.basic <= 0) {
      alert('No tienes sobres disponibles.');
      return;
    }

    setOpening(true);
    setRevealedStickers([]);

    try {
      const res = await axios.post(`${API_URL}/packs/open`, {}, { headers: { Authorization: `Bearer ${token}` } });
      updateUser({ availablePacks: res.data.availablePacks });

      // Simulate animation delay
      setTimeout(() => {
        setOpening(false);
        setRevealedStickers(res.data.obtainedStickers);
      }, 2000);
    } catch (err) {
      setOpening(false);
      alert(err.response?.data?.message || 'Error al abrir');
    }
  };

  return (
    <div className="pack-page">
      <h2>Abrir Sobres</h2>
      <p>Sobres disponibles: {user?.availablePacks?.basic}</p>

      <div className="pack-container">
        {!opening && revealedStickers.length === 0 && (
          <motion.div
            className="pack"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleOpenPack}
          >
            <img src="/pack/pack.png" alt="Sobre Básico" />
            <p>Click para abrir</p>
          </motion.div>
        )}

        {opening && (
          <motion.div
            className="pack opening"
            animate={{ rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            <img src="/pack/pack.png" alt="Abriendo..." />
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {revealedStickers.length > 0 && (
          <motion.div
            className="revealed-stickers"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h3>¡Obtuviste estas láminas!</h3>
            <div className="stickers-row">
              {revealedStickers.map((sticker, i) => (
                <motion.div
                  key={i}
                  className={`card rarity-${sticker.rarity}`}
                  initial={{ opacity: 0, scale: 0.5, rotateY: 90 }}
                  animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                  transition={{ delay: i * 0.3, duration: 0.5 }}
                >
                  <img src={sticker.image} alt={sticker.name} />
                  <p>{sticker.name}</p>
                  <span className="rarity-badge">{sticker.rarity.toUpperCase()}</span>
                </motion.div>
              ))}
            </div>
            <button className="btn-primary" onClick={() => setRevealedStickers([])}>Continuar</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
