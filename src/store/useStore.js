import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useStore = create(
  persist(
    (set) => ({
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
      
      setCountry: (country) => set({ selectedCountry: country }),
      setHasChosenCountry: (val) => set({ hasChosenCountry: val }),
      setRegion: (region) => set({ selectedRegion: region }),
      
      // Aliases as requested
      setSelectedCountry: (country) => set({ selectedCountry: country }),
      setSelectedRegion: (region) => set({ selectedRegion: region }),
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
      toggleFavorite: (productId) => set((state) => {
        const idStr = String(productId);
        const exists = state.favorites.some(id => String(id) === idStr);
        return {
          favorites: exists
            ? state.favorites.filter(id => String(id) !== idStr)
            : [...state.favorites, productId]
        };
      }),
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
      clearFavorites: () => set({ favorites: [] }),
      
      clearLocation: () => set({ selectedCountry: 'ES', selectedRegion: '' }),
    }),
    {
      name: 'mi-pana-storage',
    }
  )
);
