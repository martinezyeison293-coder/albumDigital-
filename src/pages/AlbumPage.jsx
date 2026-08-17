import React, { useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { useAlbumStore } from '../store/albumStore';

const API_URL = 'http://localhost:5000/api';

export default function AlbumPage() {
  const { token, user, updateUser } = useAuthStore();
  const { album, stickers, collection, setAlbumData, updateCollection } = useAlbumStore();

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
  }, []);

  const handlePlaceSticker = async (stickerId) => {
    try {
      const res = await axios.post(`${API_URL}/collection/place/${stickerId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      updateCollection(res.data.collection);
      updateUser({ xp: res.data.xp });
      alert('¡Lámina pegada! +10 XP');
    } catch (err) {
      alert(err.response?.data?.message || 'Error al pegar');
    }
  };

  if (!album) return <div className="loading">Cargando álbum...</div>;

  return (
    <div className="album-page">
      <header className="album-header">
        <h1>{album.name}</h1>
        <div className="stats">
          <span>XP: {user?.xp}</span> | <span>Sobres: {user?.availablePacks?.basic}</span>
        </div>
      </header>
      
      <div className="stickers-grid">
        {stickers.map((sticker) => {
          const inCollection = collection?.collectedStickers.find(s => s.stickerId === sticker._id);
          const isPlaced = inCollection?.isPlaced;
          const hasUnplaced = inCollection && inCollection.quantity > 0 && !isPlaced;

          return (
            <div key={sticker._id} className={`sticker-slot rarity-${sticker.rarity} ${isPlaced ? 'placed' : 'empty'}`}>
              <div className="slot-number">#{sticker.number}</div>
              {isPlaced ? (
                <img src={sticker.image} alt={sticker.name} className="sticker-image" />
              ) : (
                <div className="placeholder">?</div>
              )}
              <div className="sticker-info">
                {hasUnplaced && <button className="btn-place" onClick={() => handlePlaceSticker(sticker._id)}>Pegar</button>}
                {isPlaced && <span className="sticker-name">{sticker.name}</span>}
                {inCollection && inCollection.quantity > (isPlaced ? 1 : 0) && (
                  <span className="badge-duplicate">Repetida: {inCollection.quantity - (isPlaced ? 1 : 0)}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
