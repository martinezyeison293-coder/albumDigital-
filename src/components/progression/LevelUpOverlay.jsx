import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const UNLOCK_ICONS = {
  frame: '🖼️',
  background: '🌌',
  effect: '✨',
  page: '📄'
};

export default function LevelUpOverlay({ levelUp, onClose }) {
  const unlocks = Array.isArray(levelUp?.unlocks) ? levelUp.unlocks : [];
  const packs = levelUp?.packsGranted || {};
  const prevLevel = levelUp?.previousLevel ?? '?';
  const newLevel = levelUp?.newLevel ?? levelUp?.level ?? '?';

  return (
    <AnimatePresence>
      {levelUp && (
        <motion.div
          className="levelup-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="levelup-card"
            initial={{ scale: 0.5, y: 80, rotateX: -30 }}
            animate={{ scale: 1, y: 0, rotateX: 0 }}
            exit={{ scale: 0.6, y: 60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 180, damping: 18 }}
          >
            <div className="levelup-glow" />
            <span className="levelup-kicker">¡SUBISTE DE NIVEL!</span>
            <motion.div
              className="levelup-number"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.25, type: 'spring', stiffness: 260, damping: 12 }}
            >
              Nvl {prevLevel} → <span>{newLevel}</span>
            </motion.div>

            {unlocks.length > 0 && (
              <div className="levelup-unlocks">
                <h4>Nuevos desbloqueos</h4>
                {unlocks.map((u, i) => (
                  <motion.div
                    key={u.slug || i}
                    className="unlock-item"
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.15 }}
                  >
                    <span className="unlock-icon">{UNLOCK_ICONS[u.type] || '🎁'}</span>
                    <span>{u.name}</span>
                  </motion.div>
                ))}
              </div>
            )}

            {(packs.basic > 0 || packs.premium > 0 || packs.legendary > 0) && (
              <motion.p
                className="levelup-packs"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
              >
                {packs.basic > 0 && `+${packs.basic} básico${packs.basic !== 1 ? 's' : ''}`}
                {packs.premium > 0 && `${packs.basic > 0 ? ' · ' : ''}+${packs.premium} premium`}
                {packs.legendary > 0 && ` · +${packs.legendary} legendario`}
              </motion.p>
            )}

            <button className="btn-primary" onClick={onClose}>¡Continuar!</button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
