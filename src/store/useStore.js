import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useStore = create(
  persist(
    (set) => ({
      selectedCountry: 'ES',
      selectedRegion: '',
      activeCategory: 1,
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
      
      setCountry: (country) => set({ selectedCountry: country }),
      setRegion: (region) => set({ selectedRegion: region }),
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
      toggleFavorite: (productId) => set((state) => ({
        favorites: state.favorites.includes(productId)
          ? state.favorites.filter(id => id !== productId)
          : [...state.favorites, productId] // Se añaden al final, por lo que el más nuevo está al final (o podemos hacer [productId, ...state.favorites] para que sea al principio, pero así ya estaba. Lo dejamos así y revertimos al mostrar)
      })),
      addRecentSearch: (query) => set((state) => {
        if (!query.trim()) return state;
        // Agrega al principio, elimina duplicados, mantiene máx 10
        const newSearches = [query.trim(), ...state.recentSearches.filter(s => s !== query.trim())].slice(0, 10);
        return { recentSearches: newSearches };
      }),
      removeRecentSearch: (query) => set((state) => ({
        recentSearches: state.recentSearches.filter(s => s !== query)
      })),
      clearRecentSearches: () => set({ recentSearches: [] }),
      
      clearLocation: () => set({ selectedCountry: 'ES', selectedRegion: '' }),
    }),
    {
      name: 'mi-pana-storage',
    }
  )
);
