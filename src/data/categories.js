import { 
  FiCoffee, FiPackage, FiTool, FiShoppingBag, FiBriefcase, FiHeart, 
  FiHome 
} from 'react-icons/fi';
import { Dumbbell, BookCheck, CirclePlus, Scale } from 'lucide-react';

export const CATEGORIES = [
  { id: 'comida', name: 'Comida', icon: FiCoffee },
  { id: 'envios', name: 'Envios', icon: FiPackage },
  { id: 'servicios', name: 'Servicios', icon: FiTool },
  { id: 'ventas', name: 'Ventas', icon: FiShoppingBag },
  { id: 'empleo', name: 'Empleo', icon: FiBriefcase },
  { id: 'salud', name: 'Salud', icon: FiHeart },
  { id: 'inmobiliaria', name: 'Inmobiliaria', icon: FiHome },
  { id: 'deporte', name: 'Deporte', icon: Dumbbell },
  { id: 'formacion', name: 'Formación', icon: BookCheck },
  { id: 'legal', name: 'Legal', icon: Scale },
  { id: 'otros', name: 'Otros', icon: CirclePlus },
];

export const getCategoryIcon = (id) => {
  const nameToMatch = typeof id === 'string' ? id.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : '';
  const cat = CATEGORIES.find(c => 
    c.id === id || 
    c.name === id || 
    c.id === nameToMatch ||
    c.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() === nameToMatch
  );
  return cat ? cat.icon : CirclePlus;
};

export const getBrandColor = (index) => {
  const colors = ['#0056B3', '#FFB400', '#D90429'];
  return colors[index % 3];
};

export const sortCategories = (categoriesList) => {
  return [...categoriesList].sort((a, b) => {
    // Maneja strings o objetos con propiedad "name"
    const nameA = typeof a === 'string' ? a : (a.name || '');
    const nameB = typeof b === 'string' ? b : (b.name || '');
    if (nameA === "Otros") return 1;
    if (nameB === "Otros") return -1;
    return nameA.localeCompare(nameB);
  });
};
