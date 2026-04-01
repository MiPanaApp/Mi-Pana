import { 
  FiCoffee, FiPackage, FiTool, FiShoppingBag, FiBriefcase, FiHeart, 
  FiHome 
} from 'react-icons/fi';
import { Dumbbell, BookCheck, CirclePlus, Scale } from 'lucide-react';

export const CATEGORIES = []; // Deprecated: Use useCategoryStore for dynamic categories.

export const getCategoryIcon = (id) => {
  const cat = CATEGORIES.find(c => c.id === id || c.name === id);
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
