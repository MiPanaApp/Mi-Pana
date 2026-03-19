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
      },
      favorites: [],
      
      setCountry: (country) => set({ selectedCountry: country }),
      setRegion: (region) => set({ selectedRegion: region }),
      setActiveCategory: (category) => set({ activeCategory: category }),
      setIsFilterOpen: (isOpen) => set({ isFilterOpen: isOpen }),
      setIsSortOpen: (isOpen) => set({ isSortOpen: isOpen }),
      setSortBy: (sort) => set({ sortBy: sort }),
      setFilters: (newFilters) => set((state) => ({ 
        filters: { ...state.filters, ...newFilters } 
      })),
      toggleFavorite: (productId) => set((state) => ({
        favorites: state.favorites.includes(productId)
          ? state.favorites.filter(id => id !== productId)
          : [...state.favorites, productId]
      })),
      
      clearLocation: () => set({ selectedCountry: 'ES', selectedRegion: '' }),
    }),
    {
      name: 'mi-pana-storage',
    }
  )
);
