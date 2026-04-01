import { create } from 'zustand';
import { db } from '../services/firebase';
import { collection, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import * as FiIcons from 'react-icons/fi';
import * as LuIcons from 'lucide-react';
import * as IoIcons from 'react-icons/io5';

// Helper para obtener el componente de icono según el nombre guardado en DB
export const getIconComponent = (iconName) => {
  // Fallback seguro: Intentar obtener un componente válido
  const FallbackIcon = FiIcons.FiPlusCircle || LuIcons.PlusCircle || LuIcons.Search || 'div';

  if (!iconName) return FallbackIcon;
  
  // 1. Intentar coincidencia exacta
  if (LuIcons[iconName]) return LuIcons[iconName];
  if (FiIcons[iconName]) return FiIcons[iconName];
  if (IoIcons[iconName]) return IoIcons[iconName];
  
  // 2. Intentar con prefijos si no los tiene
  const fiName = iconName.startsWith('Fi') ? iconName : `Fi${iconName}`;
  if (FiIcons[fiName]) return FiIcons[fiName];
  
  const ioName = iconName.startsWith('Io') ? iconName : `Io${iconName}`;
  if (IoIcons[ioName]) return IoIcons[ioName];

  const luName = iconName.charAt(0).toUpperCase() + iconName.slice(1);
  if (LuIcons[luName]) return LuIcons[luName];

  return FallbackIcon;
};

export const useCategoryStore = create((set) => ({
  categories: [],
  loading: true,
  error: null,

  // Inicializar tiempo real
  init: () => {
    // Quitamos 'where' para evitar errores de índice compuesto al inicio
    const q = query(
      collection(db, 'categories'),
      orderBy('order', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
      const allCats = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        iconComponent: getIconComponent(doc.data().icon)
      }));
      
      // Filtrar por activas en memoria para evitar configuración previa de índices en Firebase
      const activeCats = allCats.filter(c => c.active !== false);
      
      set({ categories: activeCats, loading: false });
    }, (error) => {
      console.error("Error fetching categories:", error);
      set({ error: error.message, loading: false });
    });
  },

  // Obtener todas para el admin (incluyendo inactivas)
  fetchAllForAdmin: () => {
    const q = query(collection(db, 'categories'), orderBy('order', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const categories = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        iconComponent: getIconComponent(doc.data().icon)
      }));
      set({ categories });
    });
  }
}));
