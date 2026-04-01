import { create } from 'zustand';
import { db } from '../services/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

export const useLocationStore = create((set, get) => ({
  countries: [],
  loading: true,
  error: null,

  // Inicializar escucha en tiempo real
  init: () => {
    const q = query(collection(db, 'countries'), orderBy('name', 'asc'));
    
    return onSnapshot(q, (snapshot) => {
      const countriesList = snapshot.docs.map(doc => ({
        id: doc.id, // ISO Code
        ...doc.data()
      }));
      set({ countries: countriesList, loading: false });
    }, (error) => {
      console.error("Error fetching countries:", error);
      set({ error: error.message, loading: false });
    });
  },

  // Obtener configuración de etiquetas para un país específico
  getCountryConfig: (isoCode) => {
    const country = get().countries.find(c => c.id === isoCode);
    return country?.config || { level1: 'Provincia', level2: 'Municipio' };
  },

  // Verificar si un país está activo
  isCountryActive: (isoCode) => {
    const country = get().countries.find(c => c.id === isoCode);
    return country?.status === 'active';
  },
  
  // Obtener estado detallado
  getCountryStatus: (isoCode) => {
    const country = get().countries.find(c => c.id === isoCode);
    return country?.status || 'hidden';
  }
}));
