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
      },
      
      setCountry: (country) => set({ selectedCountry: country }),
      setRegion: (region) => set({ selectedRegion: region }),
      setActiveCategory: (category) => set({ activeCategory: category }),
      setIsFilterOpen: (isOpen) => set({ isFilterOpen: isOpen }),
      setIsSortOpen: (isOpen) => set({ isSortOpen: isOpen }),
      setSortBy: (sort) => set({ sortBy: sort }),
      setFilters: (newFilters) => set((state) => ({ 
        filters: { ...state.filters, ...newFilters } 
      })),
      
      clearLocation: () => set({ selectedCountry: 'ES', selectedRegion: '' }),
    }),
    {
      name: 'mi-pana-storage',
    }
  )
);
