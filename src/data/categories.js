import { 
  FiCoffee, FiPackage, FiTool, FiShoppingBag, FiBriefcase, FiHeart, 
  FiHome 
} from 'react-icons/fi';
import { Dumbbell, BookCheck, CirclePlus, Scale } from 'lucide-react';

export const CATEGORIES = [
  { id: "Comida", name: "Comida", icon: FiCoffee },
  { id: "Envios", name: "Envios", icon: FiPackage },
  { id: "Inmobiliaria", name: "Inmobiliaria", icon: FiHome },
  { id: "Formación", name: "Formación", icon: BookCheck },
  { id: "Deporte", name: "Deporte", icon: Dumbbell },
  { id: "Empleo", name: "Empleo", icon: FiBriefcase },
  { id: "Servicios", name: "Servicios", icon: FiTool },
  { id: "Ventas", name: "Ventas", icon: FiShoppingBag },
  { id: "Legal", name: "Legal", icon: Scale },
  { id: "Salud", name: "Salud", icon: FiHeart },
  { id: "Otros", name: "Otros", icon: CirclePlus },
];

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
