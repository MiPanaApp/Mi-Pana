import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { auth, db } from '../services/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

export const useStore = create(
  persist(
    (set, get) => ({
      selectedCountry: 'ES',
      hasChosenCountry: false, // Solo true si el usuario pasó por el Onboarding
      selectedRegion: '',
      activeCategory: 'Todas',
      isFilterOpen: false,
      isSortOpen: false,
      sortBy: 'relevance',
      filters: {
        price: { min: '', max: '' },
        onlyVerified: false,
        location: { level1: '', level2: '', level3: '' },
        searchQuery: '',
      },
      favorites: [],
      recentSearches: [], // Historial de búsquedas recientes
      userLocation: null, // Coordenadas gps reales del user si activó filtro ubicación
      
      setCountry: (country) => set({ selectedCountry: country }),
      setHasChosenCountry: (val) => set({ hasChosenCountry: val }),
      setRegion: (region) => set({ selectedRegion: region }),
      
      // Aliases as requested
      setSelectedCountry: (country) => set({ selectedCountry: country }),
      setSelectedRegion: (region) => set({ selectedRegion: region }),
      setUserLocation: (loc) => set({ userLocation: loc }),
      setActiveCategory: (category) => set({ activeCategory: category }),
      setIsFilterOpen: (isOpen) => set({ isFilterOpen: isOpen }),
      setIsSortOpen: (isOpen) => set({ isSortOpen: isOpen }),
      setSortBy: (sort) => set({ sortBy: sort }),
      setFilters: (newFilters) => set((state) => ({ 
        filters: { ...state.filters, ...newFilters } 
      })),
      setSearchQuery: (query) => set((state) => ({
        filters: { ...state.filters, searchQuery: query }
      })),
      setFavorites: (favs) => set({ favorites: Array.isArray(favs) ? favs : [] }),
      toggleFavorite: (productId) => set((state) => {
        const idStr = String(productId);
        const favorites = state.favorites || [];
        const exists = favorites.some(id => String(id) === idStr);
        
        // Sincronizar con Firestore si hay usuario (Fire and Forget)
        const user = auth.currentUser;
        if (user) {
          const userRef = doc(db, 'users', user.uid);
          updateDoc(userRef, {
            favorites: exists ? arrayRemove(idStr) : arrayUnion(idStr)
          }).catch(err => console.warn('[useStore] Error syncing favorite to Firestore:', err));
        }

        return {
          favorites: exists
            ? favorites.filter(id => String(id) !== idStr)
            : [...favorites, productId]
        };
      }),
      addRecentSearch: (query) => set((state) => {
        if (!query.trim()) return state;
        // Agrega al principio, elimina duplicados, mantiene máx 10
        const newSearches = [query.trim(), ...(state.recentSearches || []).filter(s => s !== query.trim())].slice(0, 10);
        return { recentSearches: newSearches };
      }),
      removeRecentSearch: (query) => set((state) => ({
        recentSearches: (state.recentSearches || []).filter(s => s !== query)
      })),
      clearRecentSearches: () => set({ recentSearches: [] }),
      clearFavorites: () => set({ favorites: [] }),
      
      clearLocation: () => set({ selectedCountry: 'ES', selectedRegion: '' }),
    }),
    {
      name: 'mi-pana-storage',
    }
  )
);
