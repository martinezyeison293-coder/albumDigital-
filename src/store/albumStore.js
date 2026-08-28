import { create } from 'zustand';

export const useAlbumStore = create((set) => ({
  album: null,
  stickers: [],
  collection: null,
  openPack: null,
  setAlbumData: (album, stickers, collection) => set({ album, stickers, collection }),
  updateCollection: (collection) => set({ collection }),
  setOpenPack: (stickers) => set({ openPack: stickers || null }),
  clearOpenPack: () => set({ openPack: null })
}));
