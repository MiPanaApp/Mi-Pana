import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, ImagePlus, ChevronLeft, CheckCircle2, Loader2, X, MapPin } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../store/useStore';
import { db, storage } from '../lib/firebase';
import { collection, addDoc, getDoc, getDocs, doc, serverTimestamp, query, orderBy, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ChevronDown, Tag } from 'lucide-react';
import { getCategoryIcon, getBrandColor, sortCategories } from '../data/categories';
import panaExito from '../assets/pana_exito.png';

// Mapa de datos por país: { label (nombre del nivel), level1: [{ name, cities }] }
const LOCATION_DATA = {
  ES: {
    level1Label: 'Comunidad Autónoma',
    level2Label: 'Ciudad / Municipio',
    regions: [
      { name: 'Andalucía', cities: ['Sevilla', 'Málaga', 'Córdoba', 'Granada', 'Almería', 'Cádiz', 'Huelva', 'Jaén'] },
      { name: 'Aragón', cities: ['Zaragoza', 'Huesca', 'Teruel'] },
      { name: 'Asturias', cities: ['Oviedo', 'Gijón', 'Avilés'] },
      { name: 'Baleares', cities: ['Palma', 'Ibiza', 'Mahón', 'Ciutadella'] },
      { name: 'Canarias', cities: ['Las Palmas de G.C.', 'Santa Cruz de Tenerife', 'La Laguna', 'Arrecife'] },
      { name: 'Cantabria', cities: ['Santander', 'Torrelavega'] },
      { name: 'Castilla-La Mancha', cities: ['Toledo', 'Albacete', 'Ciudad Real', 'Cuenca', 'Guadalajara'] },
      { name: 'Castilla y León', cities: ['Valladolid', 'Burgos', 'Salamanca', 'León', 'Ávila', 'Segovia', 'Soria', 'Zamora', 'Palencia'] },
      { name: 'Cataluña', cities: ['Barcelona', 'Hospitalet', 'Badalona', 'Tarragona', 'Lérida', 'Girona'] },
      { name: 'Comunidad Valenciana', cities: ['Valencia', 'Alicante', 'Elche', 'Castellón', 'Torrevieja'] },
      { name: 'Extremadura', cities: ['Badajoz', 'Cáceres', 'Mérida'] },
      { name: 'Galicia', cities: ['Vigo', 'La Coruña', 'Ponteveda', 'Santiago de Compostela', 'Ourense', 'Lugo'] },
      { name: 'La Rioja', cities: ['Logroño', 'Calahorra'] },
      { name: 'Madrid', cities: ['Madrid', 'Móstoles', 'Alcázar de San Juan', 'Alcalá de Henares', 'Getafe', 'Leganés', 'Alcorcon', 'Fuenlabrada', 'Torrejón de Ardoz', 'Pozuelo', 'Parla'] },
      { name: 'Murcia', cities: ['Murcia', 'Cartagena', 'Lorca'] },
      { name: 'Navarra', cities: ['Pamplona', 'Tudela', 'Barañáin'] },
      { name: 'País Vasco', cities: ['Bilbao', 'Vitoria', 'San Sebastián'] },
      { name: 'Ceuta', cities: ['Ceuta'] },
      { name: 'Melilla', cities: ['Melilla'] },
    ]
  },
  CO: {
    level1Label: 'Departamento',
    level2Label: 'Ciudad / Municipio',
    regions: [
      { name: 'Antioquia', cities: ['Medellín', 'Bello', 'Itagüí', 'Envigado', 'Rionegro', 'Turbo'] },
      { name: 'Bogotá D.C.', cities: ['Bogotá'] },
      { name: 'Bolívar', cities: ['Cartagena', 'Magangué', 'Turbaco'] },
      { name: 'Boyacá', cities: ['Tunja', 'Duitama', 'Sogamoso'] },
      { name: 'Caldas', cities: ['Manizales', 'La Dorada', 'Chinchiía'] },
      { name: 'Córdoba', cities: ['Montería', 'Lorica', 'Sahagún'] },
      { name: 'Cundinamarca', cities: ['Soacha', 'Facatativá', 'Zipaquirá', 'Chia', 'Madrid', 'Fusagasugá'] },
      { name: 'Magdalena', cities: ['Santa Marta', 'Ciénaga', 'Fundación'] },
      { name: 'Meta', cities: ['Villavicencio', 'Acacias', 'Granada'] },
      { name: 'Nariño', cities: ['San Juan de Pasto', 'Ipiales', 'Tumaco'] },
      { name: 'Norte de Santander', cities: ['Cúcuta', 'Ocã±a', 'Pamplona'] },
      { name: 'Risaralda', cities: ['Pereira', 'Dosquebradas', 'Santa Rosa de Cabal'] },
      { name: 'Santander', cities: ['Bucaramanga', 'Floridablanca', 'Girón', 'Piedecuesta'] },
      { name: 'Sucre', cities: ['Sincelejo', 'Corozal', 'San Marcos'] },
      { name: 'Tolima', cities: ['Ibagué', 'Espinal', 'Melgar'] },
      { name: 'Valle del Cauca', cities: ['Cali', 'Buenaventura', 'Palmira', 'Tuluá', 'Buga'] },
    ]
  },
  VE: {
    level1Label: 'Estado',
    level2Label: 'Ciudad / Municipio',
    regions: [
      { name: 'Amazonas', cities: ['Puerto Ayacucho'] },
      { name: 'Anzoátegui', cities: ['Barcelona', 'Puerto La Cruz', 'El Tigre'] },
      { name: 'Apure', cities: ['San Fernando de Apure', 'Biruaca'] },
      { name: 'Aragua', cities: ['Maracay', 'La Victoria', 'Turmero', 'Cagua'] },
      { name: 'Barinas', cities: ['Barinas', 'Barinas ciudad'] },
      { name: 'Bolívar', cities: ['Ciudad Bolívar', 'Puerto Ordaz', 'Ciudad Guayana'] },
      { name: 'Carabobo', cities: ['Valencia', 'Maracay', 'Guácamo'] },
      { name: 'Cojedes', cities: ['San Carlos', 'Tinaco'] },
      { name: 'Delta Amacuro', cities: ['Tucupita'] },
      { name: 'Distrito Capital', cities: ['Caracas'] },
      { name: 'Falcon', cities: ['Coro', 'La Vela', 'Punto Fijo'] },
      { name: 'Guárico', cities: ['San Juan de Los Morros', 'Altagracia de Orituco'] },
      { name: 'Lara', cities: ['Barquisimeto', 'Cabudare', 'Carora'] },
      { name: 'Miranda', cities: ['Los Teques', 'Guátere', 'Ocumare del Tuy', 'Charallave', 'Púas'] },
      { name: 'Merida', cities: ['Mérida', 'El Vigía', 'Tovar'] },
      { name: 'Monagas', cities: ['Maturín', 'Caripito', 'Temblador'] },
      { name: 'Nueva Esparta', cities: ['La Asunción', 'Porlamar', 'Pampatar'] },
      { name: 'Portuguesa', cities: ['Acarigua', 'Araure', 'Guanare'] },
      { name: 'Sucre', cities: ['Cumaná', 'Cariaco', 'Carúpano'] },
      { name: 'Táchira', cities: ['San Cristóbal', 'Rubio', 'Táriba'] },
      { name: 'Trujillo', cities: ['Trujillo', 'Valera', 'Motatán'] },
      { name: 'Vargas', cities: ['La Guaira', 'Naiguatá'] },
      { name: 'Yaracuy', cities: ['San Felipe', 'Yaritagua', 'Chivacoa'] },
      { name: 'Zulia', cities: ['Maracaibo', 'Cabimas', 'Ciudad Ojeda'] },
    ]
  },
  US: {
    level1Label: 'Estado',
    level2Label: 'Ciudad',
    regions: [
      { name: 'California', cities: ['Los Ángeles', 'San Francisco', 'San Diego', 'Sacramento', 'Fresno'] },
      { name: 'Florida', cities: ['Miami', 'Orlando', 'Tampa', 'Jacksonville', 'Fort Lauderdale'] },
      { name: 'Texas', cities: ['Houston', 'Dallas', 'San Antonio', 'Austin', 'El Paso'] },
      { name: 'New York', cities: ['Nueva York', 'Buffalo', 'Rochester', 'Syracuse'] },
      { name: 'Georgia', cities: ['Atlanta', 'Augusta', 'Columbus', 'Savannah'] },
      { name: 'Illinois', cities: ['Chicago', 'Aurora', 'Rockford', 'Joliet'] },
      { name: 'New Jersey', cities: ['Newark', 'Jersey City', 'Paterson', 'Elizabeth'] },
      { name: 'Virginia', cities: ['Virginia Beach', 'Norfolk', 'Chesapeake', 'Richmond'] },
      { name: 'Carolina del Norte', cities: ['Charlotte', 'Raleigh', 'Greensboro', 'Durham'] },
      { name: 'Nevada', cities: ['Las Vegas', 'Henderson', 'Reno', 'North Las Vegas'] },
    ]
  },
  CL: {
    level1Label: 'Región',
    level2Label: 'Ciudad / Municipio',
    regions: [
      { name: 'Arica y Parinacota', cities: ['Arica', 'Putre'] },
      { name: 'Tarapacá', cities: ['Iquique', 'Alto Hospicio'] },
      { name: 'Antofagasta', cities: ['Antofagasta', 'Calama', 'Tocopilla'] },
      { name: 'Atacama', cities: ['Copiapó', 'Valledén', 'Caldera'] },
      { name: 'Coquimbo', cities: ['La Serena', 'Coquimbo', 'Ovalle'] },
      { name: 'Valparaíso', cities: ['Valparaíso', 'Viña del Mar', 'Quilpué', 'San Antonio'] },
      { name: 'Metropolitana', cities: ['Santiago', 'Puente Alto', 'Las Condes', 'Maipú', 'La Florida'] },
      { name: "O'Higgins", cities: ['Rancagua', 'San Fernando', 'Machalí'] },
      { name: 'Maule', cities: ['Talca', 'Curicó', 'Linares'] },
      { name: 'Ñuble', cities: ['Chillán', 'San Carlos', 'Quirihue'] },
      { name: 'Biobío', cities: ['Concepción', 'Talcahuano', 'Los Ángeles'] },
      { name: 'Araucanía', cities: ['Temuco', 'Angol', 'Victoria'] },
      { name: 'Los Ríos', cities: ['Valdivia', 'La Unión', 'Panguipulli'] },
      { name: 'Los Lagos', cities: ['Puerto Montt', 'Osorno', 'Castro'] },
      { name: 'Aysén', cities: ['Coihaique', 'Chile Chico'] },
      { name: 'Magallanes', cities: ['Punta Arenas', 'Puerto Natales'] },
    ]
  },
  PA: {
    level1Label: 'Provincia',
    level2Label: 'Distrito / Ciudad',
    regions: [
      { name: 'Panamá', cities: ['Ciudad de Panamá', 'San Miguelito', 'Tocumen'] },
      { name: 'Panamá Oeste', cities: ['La Chorrera', 'Arraiján', 'Capira'] },
      { name: 'Colón', cities: ['Colón', 'Portobelo'] },
      { name: 'Coclé', cities: ['Penanomé', 'Aguadulce', 'Natá'] },
      { name: 'Herrera', cities: ['Chitré', 'Las Minas', 'Paríta'] },
      { name: 'Los Santos', cities: ['Las Tablas', 'Guárare'] },
      { name: 'Veraguas', cities: ['Santiago', 'La Mesa', 'Calobre'] },
      { name: 'Bocas del Toro', cities: ['Bocas del Toro', 'Changuinola'] },
      { name: 'Chiriqui', cities: ['David', 'Boquete', 'La Concepción'] },
      { name: 'Darién', cities: ['La Palma', 'Metetí'] },
    ]
  },
  PE: {
    level1Label: 'Departamento',
    level2Label: 'Ciudad / Distrito',
    regions: [
      { name: 'Lima', cities: ['Lima', 'Miraflores', 'San Isidro', 'Callao', 'San Martin de Porres'] },
      { name: 'Arequipa', cities: ['Arequipa', 'Cayma', 'Hunter'] },
      { name: 'La Libertad', cities: ['Trujillo', 'Virú', 'Chepen'] },
      { name: 'Lambayeque', cities: ['Chiclayo', 'Ferreñafe', 'Lambayeque'] },
      { name: 'Piura', cities: ['Piura', 'Sullana', 'Talara'] },
      { name: 'Cusco', cities: ['Cusco', 'San Sebastián', 'Wanchaq'] },
      { name: 'Iquitos', cities: ['Iquitos', 'Nauta', 'Requena'] },
      { name: 'Ucayali', cities: ['Pucallpa', 'Yarinacocha', 'Coronel Portillo'] },
    ]
  },
  EC: {
    level1Label: 'Provincia',
    level2Label: 'Ciudad / Cantón',
    regions: [
      { name: 'Pichincha', cities: ['Quito', 'Cayambe', 'Rumiñahui'] },
      { name: 'Guayas', cities: ['Guayaquil', 'Samborondón', 'Daule'] },
      { name: 'Azuay', cities: ['Cuenca', 'Gualaceo', 'Santa Isabel'] },
      { name: 'Manabí', cities: ['Portoviejo', 'Manta', 'Chone'] },
      { name: 'El Oro', cities: ['Machala', 'Pasaje', 'Santa Rosa'] },
      { name: 'Loja', cities: ['Loja', 'Catamayo', 'Macará'] },
      { name: 'Imbabura', cities: ['Ibarra', 'Otavalo', 'Cotacachi'] },
      { name: 'Tungurahua', cities: ['Ambato', 'Pelileo', 'Baños'] },
    ]
  },
  DO: {
    level1Label: 'Provincia',
    level2Label: 'Municipio',
    regions: [
      { name: 'Distrito Nacional', cities: ['Santo Domingo'] },
      { name: 'Santiago', cities: ['Santiago de los Caballeros', 'Villa Bisono'] },
      { name: 'Santo Domingo', cities: ['Santo Domingo Este', 'Santo Domingo Norte', 'Boca Chica'] },
      { name: 'La Vega', cities: ['La Vega', 'Jarabacoa', 'Constanza'] },
      { name: 'San Cristóbal', cities: ['San Cristóbal', 'Baní', 'Palenque'] },
      { name: 'La Romana', cities: ['La Romana', 'San Pedro de Macorís', 'Higüey'] },
      { name: 'Puerto Plata', cities: ['Puerto Plata', 'Sosúa', 'Cabarete'] },
    ]
  },
  AR: {
    level1Label: 'Provincia',
    level2Label: 'Ciudad / Municipio',
    regions: [
      { name: 'Buenos Aires', cities: ['Buenos Aires', 'La Plata', 'Mar del Plata', 'Quilmes', 'Morón'] },
      { name: 'CABA', cities: ['Ciudad Autónoma de Buenos Aires'] },
      { name: 'Córdoba', cities: ['Córdoba', 'Villa María', 'Río Cuarto'] },
      { name: 'Santa Fe', cities: ['Rosario', 'Santa Fe', 'Rafaela', 'Venado Tuerto'] },
      { name: 'Mendoza', cities: ['Mendoza', 'San Rafael', 'Godoy Cruz', 'Luján de Cuyo'] },
      { name: 'Tucumán', cities: ['San Miguel de Tucumán', 'Tafí Viejo', 'Bandía'] },
      { name: 'Salta', cities: ['Salta', 'Orán', 'Tartagal'] },
      { name: 'Neuquén', cities: ['Neuquén', 'San Martín de los Andes', 'Plottier'] },
      { name: 'Chubut', cities: ['Rawson', 'Comodoro Rivadavia', 'Puerto Madryn'] },
    ]
  },
};

// Mapeo: código del store -> clave de LOCATION_DATA
const COUNTRY_TO_LOC = { ES: 'ES', CO: 'CO', VE: 'VE', US: 'US', CL: 'CL', PA: 'PA', PE: 'PE', EC: 'EC', DO: 'DO', AR: 'AR' };


const COUNTRY_CODES = [
  { code: '+34', flag: '🇪🇸', name: 'España' },
  { code: '+58', flag: '🇻🇪', name: 'Venezuela' },
  { code: '+57', flag: '🇨🇴', name: 'Colombia' },
  { code: '+1', flag: '🇺🇸', name: 'USA' },
  { code: '+56', flag: '🇨🇱', name: 'Chile' },
  { code: '+507', flag: '🇵🇦', name: 'Panamá' },
  { code: '+51', flag: '🇵🇪', name: 'Perú' },
  { code: '+593', flag: '🇪🇨', name: 'Ecuador' },
  { code: '+1', flag: '🇩🇴', name: 'Rep. Dom.' },
  { code: '+54', flag: '🇦🇷', name: 'Argentina' },
];

export default function CreateListing() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { userData } = useAuth(); // Avatar y datos del perfil de Firestore
  const { selectedCountry } = useStore();
  const mainInputRef = useRef(null);
  const carouselInputRef = useRef(null);

  const [form, setForm] = useState({ title: '', category: '', price: '', whatsapp: '', description: '', keywords: '' });
  const [location, setLocation] = useState({ level1: '', level2: '' }); // lugar del anuncio
  const [categories, setCategories] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [selectedPrefix, setSelectedPrefix] = useState(COUNTRY_CODES[0]);
  const [isPrefixOpen, setIsPrefixOpen] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [carouselFiles, setCarouselFiles] = useState([]);
  const [carouselPreviews, setCarouselPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Asegurar que abrimos al principio de la página
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch categories from Firestore
  useEffect(() => {
    let isMounted = true;
    const fetchCategories = async () => {
      try {
        const q = query(collection(db, 'categories'), orderBy('name', 'asc'));
        const querySnapshot = await getDocs(q);
        
        if (!isMounted) return;

        let cats = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Filtrar duplicados en el cliente por si acaso (evita mostrar repetidos si la DB está sucia)
        const uniqueCats = [];
        const seenNames = new Set();
        cats.forEach(c => {
          if (!seenNames.has(c.name)) {
            seenNames.add(c.name);
            uniqueCats.push(c);
          }
        });
        cats = uniqueCats;

        // Seeding si no hay ninguna
        if (cats.length === 0) {
          const defaultCats = ['Comida', 'Envios', 'Inmobiliaria', 'Formación', 'Deporte', 'Empleo', 'Servicios', 'Ventas', 'Legal', 'Salud', 'Otros'];
          const newCats = [];
          
          for (const name of defaultCats) {
            // Verificamos por si otra instancia ya la creó
            const checkQ = query(collection(db, 'categories'), where('name', '==', name));
            const checkSnap = await getDocs(checkQ);
            if (checkSnap.empty) {
              const docRef = await addDoc(collection(db, 'categories'), { name });
              newCats.push({ id: docRef.id, name });
            }
          }
          if (newCats.length > 0) cats = newCats;
        }

        const sortedCats = sortCategories(cats);
        setCategories(sortedCats);
        if (sortedCats.length > 0) {
          setForm(prev => ({ ...prev, category: sortedCats[0].name }));
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    fetchCategories();
    return () => { isMounted = false; };
  }, []);

  // Fetch User Custom Default Country/Prefix
  useEffect(() => {
    if (!user) return;
    const fetchUserCountry = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.country) {
            // "🇪🇸 España" -> match "España"
            const countryName = userData.country.split(' ').slice(1).join(' ');
            const matchedPrefix = COUNTRY_CODES.find(c => c.name === countryName);
            if (matchedPrefix) setSelectedPrefix(matchedPrefix);
          }
        }
      } catch (err) {
        console.error("Error fetching user country:", err);
      }
    };
    fetchUserCountry();
  }, [user]);

  // Función para obtener icono y color según el nombre
  const getCategoryStyle = (name, index) => {
    return { 
      Icon: getCategoryIcon(name) || Tag, 
      color: getBrandColor(index) 
    };
  };

  const selectedStyle = getCategoryStyle(form.category, categories.findIndex(c => c.name === form.category));

  const handleMainClick = () => mainInputRef.current.click();
  const handleCarouselClick = () => carouselInputRef.current.click();

  const handleMainChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('La imagen principal debe pesar menos de 5MB');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleCarouselChange = (e) => {
    const files = Array.from(e.target.files);
    const totalCount = carouselFiles.length + files.length;
    
    if (totalCount > 10) {
      setError('Puedes subir hasta un máximo de 10 fotos adicionales.');
      return;
    }

    const newFiles = [...carouselFiles];
    const newPreviews = [...carouselPreviews];

    files.forEach(file => {
      if (file.size < 5 * 1024 * 1024) {
        newFiles.push(file);
        newPreviews.push(URL.createObjectURL(file));
      } else {
        setError('Alguna imagen del carrusel supera los 5MB y no se añadió.');
      }
    });

    setCarouselFiles(newFiles);
    setCarouselPreviews(newPreviews);
    setError('');
  };

  const removeMainImage = (e) => {
    e.stopPropagation();
    setImageFile(null);
    setImagePreview(null);
  };

  const removeCarouselItem = (index) => {
    const newFiles = [...carouselFiles];
    const newPreviews = [...carouselPreviews];
    newFiles.splice(index, 1);
    newPreviews.splice(index, 1);
    setCarouselFiles(newFiles);
    setCarouselPreviews(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageFile) {
      setError('Sube al menos la foto principal para tu anuncio.');
      return;
    }

    const keywordsArray = form.keywords.split(',').map(k => k.trim()).filter(Boolean);
    if (keywordsArray.length < 3 || keywordsArray.length > 10) {
      setError('Debes incluir entre 3 y 10 palabras claves, separadas por coma.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Fucción para subir archivos a Firebase Storage
      const uploadFile = async (file, folder) => {
        const fileExtension = file.name.split('.').pop();
        const randomID = Date.now().toString() + Math.floor(Math.random() * 10000).toString();
        const userId = user?.uid || 'test-user-id';
        const storageRef = ref(storage, `${folder}/${userId}/${randomID}.${fileExtension}`);
        const snapshot = await uploadBytes(storageRef, file);
        return getDownloadURL(snapshot.ref);
      };

      // 2. Subir imagen principal
      const mainImageURL = await uploadFile(imageFile, 'images');

      // 3. Subir imágenes del carrusel en paralelo
      const carouselURLs = await Promise.all(
        carouselFiles.map(file => uploadFile(file, 'carousel'))
      );

      // 4. Guardar en Firestore
      const newProduct = {
        name: form.title,
        price: form.price,
        category: form.category,
        whatsapp: `${selectedPrefix.code}${form.whatsapp.replace(/\s+/g, '')}`,
        description: form.description,
        keywords: form.keywords.split(',').map(k => k.trim()).filter(Boolean),
        image: mainImageURL,
        carouselImages: carouselURLs,
        location: {
          country: selectedCountry,
          level1: location.level1,
          level2: location.level2,
        },
        userId: user?.uid || 'test-user-id',
        userName: user?.displayName || userData?.name || 'Usuario de Prueba',
        sellerAvatar: user?.photoURL || userData?.avatar || '',
        sellerEmail: user?.email || '',
        createdAt: serverTimestamp(),
        rating: 5.0,
        reviewCount: 0,
        premium: false,
        verified: false,
      };

      await addDoc(collection(db, 'products'), newProduct);

      setSuccess(true);
      setTimeout(() => {
        navigate('/home');
      }, 2500);

    } catch (err) {
      console.error(err);
      setError('Hubo un error al publicar tu anuncio. Verifica tu conexión.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#E0E5EC] flex flex-col items-center justify-center px-6 pb-24 text-center">
        <motion.img 
          initial={{ scale: 0.5, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          src={panaExito}
          alt="Éxito"
          className="w-[280px] h-auto object-contain mb-4 drop-shadow-[0_15px_30px_rgba(0,0,0,0.1)]"
        />
        <h2 className="text-3xl font-black text-[#1A1A3A] mb-2">¡Anuncio Publicado!</h2>
        <p className="text-[#1A1A3A]/60 font-medium">Tu anuncio ya está visible para todos los Panas.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#E0E5EC] min-h-screen pb-32">
      {/* Header Sticky */}
      <div className="sticky top-0 z-50 bg-[#E0E5EC]/80 backdrop-blur-xl px-4 pt-10 md:pt-4 pb-4 flex items-center shadow-sm">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 bg-[#E0E5EC] rounded-xl shadow-[4px_4px_8px_rgba(163,177,198,0.6),-4px_-4px_8px_rgba(255,255,255,0.8)] active:shadow-[inset_3px_3px_6px_rgba(163,177,198,0.6),inset_-3px_-3px_6px_rgba(255,255,255,0.8)] transition-all"
        >
          <ChevronLeft className="w-6 h-6 text-[#1A1A3A]" />
        </button>
        <h1 className="ml-4 text-xl font-black text-[#1A1A3A] tracking-wide">Crear Anuncio</h1>
      </div>

      <div className="max-w-md mx-auto px-5 mt-6">
        
        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-[#D90429]/10 rounded-2xl text-[#D90429] text-sm font-bold shadow-inner"
            >
              ⚠️ {error}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          
          {/* UPLOAD IMAGEN PRINCIPAL */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-bold text-[#1A1A3A]/70 ml-2">Foto Principal <span className="text-red-500">*</span></span>
            <div 
              onClick={handleMainClick}
              className={`relative overflow-hidden w-full h-56 bg-[#E0E5EC] rounded-[2rem] flex flex-col items-center justify-center cursor-pointer transition-all border-4 border-[#E0E5EC] ${imagePreview 
                ? 'shadow-[6px_6px_12px_rgba(163,177,198,0.7),-6px_-6px_12px_rgba(255,255,255,0.9)]' 
                : 'shadow-[inset_8px_8px_16px_rgba(163,177,198,0.6),inset_-8px_-8px_16px_rgba(255,255,255,0.8)]'
              }`}
            >
              <input 
                type="file" 
                ref={mainInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleMainChange}
                disabled={loading}
              />
              
              {imagePreview ? (
                <>
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <button 
                    type="button"
                    onClick={removeMainImage}
                    className="absolute top-3 right-3 p-2 bg-red-500/80 backdrop-blur-md rounded-full text-white shadow-lg z-10"
                  >
                    <X size={18} strokeWidth={3} />
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center gap-3 text-[#1A1A3A]/40">
                  <ImagePlus size={48} strokeWidth={1.5} />
                  <span className="font-bold text-sm">Toca para subir foto</span>
                </div>
              )}
            </div>
          </div>

          {/* FOTOS DEL CARRUSEL (Máx 10) */}
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center ml-2">
              <span className="text-sm font-bold text-[#1A1A3A]/70">Fotos del Carrusel (Max 10)</span>
              <span className="text-[10px] font-black text-[#1A1A3A]/40 uppercase tracking-widest">{carouselFiles.length} / 10</span>
            </div>
            
            <div className="grid grid-cols-4 gap-3">
              {/* Previews del carrusel */}
              <AnimatePresence>
                {carouselPreviews.map((preview, index) => (
                  <motion.div
                    key={preview}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    layout
                    className="relative aspect-square rounded-2xl overflow-hidden bg-[#E0E5EC] shadow-[4px_4px_8px_rgba(163,177,198,0.6),-4px_-4px_8px_rgba(255,255,255,0.8)] group"
                  >
                    <img src={preview} alt={`Carousel ${index}`} className="w-full h-full object-cover" />
                    <button 
                      type="button"
                      onClick={() => removeCarouselItem(index)}
                      className="absolute top-1 right-1 p-1.5 bg-red-500/90 rounded-full text-white shadow-md z-10 md:opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} strokeWidth={3} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Botón para añadir más (Solo si < 10) */}
              {carouselFiles.length < 10 && (
                <motion.div 
                  whileTap={{ scale: 0.96 }}
                  onClick={handleCarouselClick}
                  className="aspect-square rounded-[2rem] bg-[#E0E5EC] shadow-[inset_6px_6px_12px_rgba(163,177,198,0.7),inset_-6px_-6px_12px_rgba(255,255,255,0.8)] flex items-center justify-center cursor-pointer text-[#1A1A3A]/30 hover:text-[#1A1A3A]/50 transition-all active:shadow-[inset_8px_8px_16px_rgba(163,177,198,0.8),inset_-8px_-8px_16px_rgba(255,255,255,0.9)]"
                >
                  <ImagePlus size={24} strokeWidth={2} />
                  <input 
                    type="file" 
                    ref={carouselInputRef}
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleCarouselChange}
                    disabled={loading}
                  />
                </motion.div>
              )}
            </div>
            <p className="text-[10px] text-[#1A1A3A]/40 font-bold ml-2 italic">* Se recomiendan fotos horizontales (16:9) o cuadradas (1:1).</p>
          </div>

          <div className="h-px w-full bg-gradient-to-r from-transparent via-[#a3b1c6]/30 to-transparent my-2" />

          {/* TITULO */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center ml-2">
              <span className="text-sm font-bold text-[#1A1A3A]/70">Titulo del Aviso (que anuncias) <span className="text-red-500">*</span></span>
              <span className={`text-[10px] font-bold tracking-tight ${form.title.length >= 30 ? 'text-red-500' : 'text-[#1A1A3A]/40'}`}>
                {form.title.length} / 35
              </span>
            </div>
            <input 
              type="text" 
              required
              maxLength={35}
              disabled={loading}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ej: Tequeños caseros 50 uds"
              className="w-full h-14 px-5 bg-[#E0E5EC] rounded-2xl shadow-[inset_4px_4px_8px_rgba(163,177,198,0.6),inset_-4px_-4px_8px_rgba(255,255,255,0.8)] text-[#1A1A3A] font-semibold placeholder:text-gray-400/70 text-base focus:outline-none focus:ring-2 focus:ring-[#1A1A3A]/10 transition-all"
            />
          </div>

          {/* DESCRIPCION (Movida debajo del título) */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center ml-2">
              <span className="text-sm font-bold text-[#1A1A3A]/70">Descripción del Anuncio <span className="text-red-500">*</span></span>
               <span className={`text-[10px] font-bold tracking-tight ${form.description.length >= 480 ? 'text-red-500' : 'text-[#1A1A3A]/40'}`}>
                {form.description.length} / 500 caracteres
               </span>
            </div>
            <textarea 
              required
              maxLength={500}
              disabled={loading}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Detalles sobre lo que ofreces, ubicación, envíos, garantias, etc..."
              className="w-full h-40 p-5 bg-[#E0E5EC] rounded-2xl shadow-[inset_4px_4px_8px_rgba(163,177,198,0.6),inset_-4px_-4px_8px_rgba(255,255,255,0.8)] text-[#1A1A3A] font-semibold placeholder:text-gray-400/70 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A3A]/10 transition-all resize-none"
            />
          </div>

          {/* KEYWORDS */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-bold text-[#1A1A3A]/70 ml-2">Palabras Clave <span className="text-red-500">*</span></span>
            <input 
              type="text" 
              required
              disabled={loading}
              value={form.keywords}
              onChange={(e) => setForm({ ...form, keywords: e.target.value })}
              placeholder="Ej: venezolano, snack, fiesta, casero"
              className="w-full h-14 px-5 bg-[#E0E5EC] rounded-2xl shadow-[inset_4px_4px_8px_rgba(163,177,198,0.6),inset_-4px_-4px_8px_rgba(255,255,255,0.8)] text-[#1A1A3A] font-semibold placeholder:text-gray-400/70 text-base focus:outline-none focus:ring-2 focus:ring-[#1A1A3A]/10 transition-all"
            />
            <p className="text-[10px] text-[#1A1A3A]/40 font-bold ml-2 italic">* Separa las palabras con comas para mejorar la búsqueda.</p>
          </div>

          {/* CATEGORIA y PRECIO (Grilla de 2 columnas) */}
          <div className="flex gap-4">
            <div className="flex-col gap-2 flex-1 flex relative">
              <span className="text-sm font-bold text-[#1A1A3A]/70 ml-2">Categoría <span className="text-red-500">*</span></span>
              
              {/* Custom Dropdown */}
              <div className="relative">
                <div 
                  onClick={() => !loading && setIsDropdownOpen(!isDropdownOpen)}
                  className={`w-full h-14 px-5 flex items-center justify-between bg-[#E0E5EC] rounded-2xl cursor-pointer transition-all ${isDropdownOpen 
                    ? 'shadow-[inset_4px_4px_8px_rgba(163,177,198,0.6),inset_-4px_-4px_8px_rgba(255,255,255,0.8)]' 
                    : 'shadow-[6px_6px_12px_rgba(163,177,198,0.7),-6px_-6px_12px_rgba(255,255,255,0.9)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {form.category && (
                      <selectedStyle.Icon 
                        size={18} 
                        style={{ color: selectedStyle.color }}
                        className="flex-shrink-0"
                      />
                    )}
                    <span className="text-[#1A1A3A] font-semibold text-base">
                      {form.category || 'Seleccionar...'}
                    </span>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-[#1A1A3A] transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </div>

                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 5, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      className="absolute left-0 right-0 top-full z-[60] mt-2 bg-[#E0E5EC] rounded-2xl shadow-[8px_8px_16px_rgba(163,177,198,0.8),-8px_-8px_16px_rgba(255,255,255,1)] border border-white/40 overflow-hidden"
                    >
                      <div className="max-h-68 overflow-y-auto custom-scrollbar p-2 flex flex-col gap-1">
                        {categories.length > 0 ? (
                          categories.map((cat, idx) => {
                            const style = getCategoryStyle(cat.name, idx);
                            const isSelected = form.category === cat.name;

                            return (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() => {
                                  setForm({ ...form, category: cat.name });
                                  setIsDropdownOpen(false);
                                }}
                                className={`w-full px-4 py-3 rounded-xl text-left font-bold text-sm transition-all flex items-center justify-between group ${isSelected 
                                  ? 'bg-[#1A1A3A] text-white shadow-lg' 
                                  : 'text-[#1A1A3A]/70 hover:bg-white/50'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <style.Icon 
                                    size={18} 
                                    style={{ color: isSelected ? '#fff' : style.color }}
                                    className="transition-colors"
                                  />
                                  {cat.name}
                                </div>
                                {isSelected && (
                                  <CheckCircle2 size={14} className="text-white" />
                                )}
                              </button>
                            );
                          })
                        ) : (
                          <div className="p-4 text-center text-xs text-[#1A1A3A]/40 font-bold italic">
                            Cargando categorías...
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="flex-col gap-2 w-[120px] flex">
              <span className="text-sm font-bold text-[#1A1A3A]/70 ml-2">Precio (€) <span className="text-red-500">*</span></span>
              <input 
                type="text" 
                required
                disabled={loading}
                value={(form.price || '').toString().replace('.', ',')}
                onChange={(e) => {
                  let val = e.target.value.replace(',', '.'); // internal normalization
                  // Allow empty, digits, and at most one dot with up to 2 decimal places
                  if (val === '' || /^\d*[.]?\d{0,2}$/.test(val)) {
                    setForm({ ...form, price: val });
                  }
                }}
                placeholder="0,00"
                className="w-full h-14 px-4 bg-[#E0E5EC] rounded-2xl shadow-[inset_4px_4px_8px_rgba(163,177,198,0.6),inset_-4px_-4px_8px_rgba(255,255,255,0.8)] text-[#1A1A3A] font-black placeholder:text-gray-400/70 text-lg focus:outline-none focus:ring-2 focus:ring-[#1A1A3A]/10 transition-all text-center"
              />
            </div>
          </div>

          {/* LUGAR */}
          {(() => {
            const locKey = COUNTRY_TO_LOC[selectedCountry] || 'ES';
            const locData = LOCATION_DATA[locKey];
            const selectedRegionObj = locData.regions.find(r => r.name === location.level1);
            const cities = selectedRegionObj ? selectedRegionObj.cities : [];

            return (
              <div className="flex flex-col gap-3">
                <span className="text-sm font-bold text-[#1A1A3A]/70 ml-2 flex items-center gap-1.5">
                  <MapPin size={14} className="text-[#D90429]" />
                  Lugar del Anuncio <span className="text-red-500">*</span>
                </span>

                <div className="flex flex-col sm:flex-row gap-3">
                  {/* Selector Level 1 (Comunidad / Departamento / Estado / Región...) */}
                  <div className="relative flex-1 min-w-0">
                    <div
                      onClick={() => { setIsLocationDropdownOpen(!isLocationDropdownOpen); setIsCityDropdownOpen(false); }}
                      className={`w-full h-14 px-4 flex items-center justify-between bg-[#E0E5EC] rounded-2xl cursor-pointer transition-all ${
                        isLocationDropdownOpen
                          ? 'shadow-[inset_4px_4px_8px_rgba(163,177,198,0.6),inset_-4px_-4px_8px_rgba(255,255,255,0.8)]'
                          : 'shadow-[6px_6px_12px_rgba(163,177,198,0.7),-6px_-6px_12px_rgba(255,255,255,0.9)]'
                      }`}
                    >
                      <span className={`text-sm font-semibold truncate ${location.level1 ? 'text-[#1A1A3A]' : 'text-gray-400/70'}`}>
                        {location.level1 || locData.level1Label}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-[#1A1A3A]/50 flex-shrink-0 transition-transform duration-300 ${isLocationDropdownOpen ? 'rotate-180' : ''}`} />
                    </div>

                    <AnimatePresence>
                      {isLocationDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 5, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          className="absolute left-0 right-0 top-full z-[60] mt-1 bg-[#E0E5EC] rounded-2xl shadow-[8px_8px_16px_rgba(163,177,198,0.8),-8px_-8px_16px_rgba(255,255,255,1)] border border-white/40 overflow-hidden"
                        >
                          <div className="max-h-56 overflow-y-auto custom-scrollbar p-2 flex flex-col gap-1">
                            {locData.regions.map((region) => (
                              <button
                                key={region.name}
                                type="button"
                                onClick={() => {
                                  setLocation({ level1: region.name, level2: '' });
                                  setIsLocationDropdownOpen(false);
                                }}
                                className={`w-full px-4 py-2.5 rounded-xl text-left font-bold text-sm transition-all ${
                                  location.level1 === region.name
                                    ? 'bg-[#1A1A3A] text-white'
                                    : 'text-[#1A1A3A]/70 hover:bg-white/50'
                                }`}
                              >
                                {region.name}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Selector Level 2 (Ciudad) — solo si hay level1 */}
                  <div className="relative flex-1 min-w-0">
                    <div
                      onClick={() => {
                        if (!location.level1) return;
                        setIsCityDropdownOpen(!isCityDropdownOpen);
                        setIsLocationDropdownOpen(false);
                      }}
                      className={`w-full h-14 px-4 flex items-center justify-between bg-[#E0E5EC] rounded-2xl transition-all ${
                        !location.level1
                          ? 'opacity-50 cursor-not-allowed shadow-[inset_4px_4px_8px_rgba(163,177,198,0.4),inset_-4px_-4px_8px_rgba(255,255,255,0.6)]'
                          : isCityDropdownOpen
                            ? 'cursor-pointer shadow-[inset_4px_4px_8px_rgba(163,177,198,0.6),inset_-4px_-4px_8px_rgba(255,255,255,0.8)]'
                            : 'cursor-pointer shadow-[6px_6px_12px_rgba(163,177,198,0.7),-6px_-6px_12px_rgba(255,255,255,0.9)]'
                      }`}
                    >
                      <span className={`text-sm font-semibold truncate ${location.level2 ? 'text-[#1A1A3A]' : 'text-gray-400/70'}`}>
                        {location.level2 || locData.level2Label}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-[#1A1A3A]/50 flex-shrink-0 transition-transform duration-300 ${isCityDropdownOpen ? 'rotate-180' : ''}`} />
                    </div>

                    <AnimatePresence>
                      {isCityDropdownOpen && cities.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 5, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          className="absolute left-0 right-0 top-full z-[60] mt-1 bg-[#E0E5EC] rounded-2xl shadow-[8px_8px_16px_rgba(163,177,198,0.8),-8px_-8px_16px_rgba(255,255,255,1)] border border-white/40 overflow-hidden"
                        >
                          <div className="max-h-56 overflow-y-auto custom-scrollbar p-2 flex flex-col gap-1">
                            {cities.map((city) => (
                              <button
                                key={city}
                                type="button"
                                onClick={() => {
                                  setLocation(prev => ({ ...prev, level2: city }));
                                  setIsCityDropdownOpen(false);
                                }}
                                className={`w-full px-4 py-2.5 rounded-xl text-left font-bold text-sm transition-all ${
                                  location.level2 === city
                                    ? 'bg-[#1A1A3A] text-white'
                                    : 'text-[#1A1A3A]/70 hover:bg-white/50'
                                }`}
                              >
                                {city}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                <p className="text-[10px] text-[#1A1A3A]/40 font-bold ml-2 italic">
                  * Primero selecciona {locData.level1Label.toLowerCase()}, luego la ciudad.
                </p>
              </div>
            );
          })()}

          {/* WHATSAPP */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-bold text-[#1A1A3A]/70 ml-2">WhatsApp <span className="text-red-500">*</span></span>
            <div className="flex gap-2">
              {/* Prefix Selector */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsPrefixOpen(!isPrefixOpen)}
                  className="h-14 px-3 bg-[#E0E5EC] rounded-2xl shadow-[6px_6px_12px_rgba(163,177,198,0.7),-6px_-6px_12px_rgba(255,255,255,0.95)] flex items-center gap-2 font-bold text-[#1A1A3A] hover:bg-white/40 transition-all border border-white/20 active:shadow-inner"
                >
                  <span className="text-xl">{selectedPrefix.flag}</span>
                  <span className="text-sm">{selectedPrefix.code}</span>
                  <ChevronDown size={14} className={`text-[#1A1A3A]/40 transition-transform ${isPrefixOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isPrefixOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 10, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute left-0 bottom-full z-[70] w-64 bg-[#E0E5EC] rounded-2xl shadow-[8px_8px_16px_rgba(0,0,0,0.1)] border border-white/40 overflow-hidden mb-1 p-2"
                    >
                      <div className="max-h-60 overflow-y-auto custom-scrollbar flex flex-col gap-1">
                        {COUNTRY_CODES.map((item) => (
                          <button
                            key={item.name + item.code}
                            type="button"
                            onClick={() => {
                              setSelectedPrefix(item);
                              setIsPrefixOpen(false);
                            }}
                            className={`flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all ${selectedPrefix.name === item.name 
                              ? 'bg-[#1A1A3A] text-white' 
                              : 'text-[#1A1A3A]/70 hover:bg-white/80'
                            }`}
                          >
                            <span className="text-xl">{item.flag}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold">{item.code}</span>
                              <span className="text-sm font-bold opacity-80">{item.name}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <input 
                type="tel" 
                required
                disabled={loading}
                value={form.whatsapp}
                onChange={(e) => setForm({ ...form, whatsapp: e.target.value.replace(/\D/g, '') })}
                placeholder="600 000 000"
                className="flex-1 h-14 px-5 bg-[#E0E5EC] rounded-2xl shadow-[inset_4px_4px_8px_rgba(163,177,198,0.6),inset_-4px_-4px_8px_rgba(255,255,255,0.8)] text-[#1A1A3A] font-semibold placeholder:text-gray-400/70 text-base focus:outline-none focus:ring-2 focus:ring-[#1A1A3A]/10 transition-all"
              />
            </div>
          </div>

          <div className="h-6" />

          {/* BOTON SUBMIT */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={loading}
            type="submit"
            className="w-full h-16 bg-[#1A1A3A] text-white rounded-[2rem] font-black text-lg shadow-[8px_8px_16px_rgba(26,26,58,0.3)] active:shadow-inner flex items-center justify-center gap-3 disabled:bg-gray-400 transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" />
                <span>Publicando...</span>
              </>
            ) : (
              <span>Publicar Anuncio</span>
            )}
          </motion.button>

        </form>

        <p className="mt-8 text-center text-[#1A1A3A]/40 text-xs font-bold leading-relaxed">
          Al publicar, aceptas nuestros <span className="underline">Términos y Condiciones</span> y confirmas que tu anuncio cumple con las normas de la comunidad.
        </p>
      </div>
    </div>
  );
}
