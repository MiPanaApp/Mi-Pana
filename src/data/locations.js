export const LOCATION_DATA = {
  ES: {
    level1Label: 'Comunidad Autónoma',
    level2Label: 'Ciudad / Municipio',
    labels: { level1: 'Comunidad Autónoma', level2: 'Ciudad / Municipio', level3: 'Barrio' },
    data: {
      'Andalucía': { 'Sevilla': [], 'Málaga': [], 'Córdoba': [], 'Granada': [], 'Almería': [], 'Cádiz': [], 'Huelva': [], 'Jaén': [] },
      'Aragón': { 'Zaragoza': [], 'Huesca': [], 'Teruel': [] },
      'Asturias': { 'Oviedo': [], 'Gijón': [], 'Avilés': [] },
      'Baleares': { 'Palma': [], 'Ibiza': [], 'Mahón': [], 'Ciutadella': [] },
      'Canarias': { 'Las Palmas de G.C.': [], 'Santa Cruz de Tenerife': [], 'La Laguna': [], 'Arrecife': [] },
      'Cantabria': { 'Santander': [], 'Torrelavega': [] },
      'Castilla-La Mancha': { 'Toledo': [], 'Albacete': [], 'Ciudad Real': [], 'Cuenca': [], 'Guadalajara': [] },
      'Castilla y León': { 'Valladolid': [], 'Burgos': [], 'Salamanca': [], 'León': [], 'Ávila': [], 'Segovia': [], 'Soria': [], 'Zamora': [], 'Palencia': [] },
      'Cataluña': { 'Barcelona': ['Eixample', 'Gràcia', 'Sants-Montjuïc', 'Ciutat Vella', 'Sarrià-Sant Gervasi'], 'Hospitalet': ['Bellvitge', 'Collblanc', 'La Florida'], 'Badalona': [], 'Tarragona': [], 'Lérida': [], 'Girona': [] },
      'Comunidad Valenciana': { 'Valencia': ['Ciutat Vella', 'Eixample', 'Extramurs', 'El Pla del Real', 'Quatre Carreres'], 'Alicante': [], 'Elche': [], 'Castellón': [], 'Torrevieja': [] },
      'Extremadura': { 'Badajoz': [], 'Cáceres': [], 'Mérida': [] },
      'Galicia': { 'Vigo': [], 'La Coruña': [], 'Ponteveda': [], 'Santiago de Compostela': [], 'Ourense': [], 'Lugo': [] },
      'La Rioja': { 'Logroño': [], 'Calahorra': [] },
      'Madrid': { 
        'Madrid': ['Centro', 'Salamanca', 'Chamberí', 'Retiro', 'Tetuán', 'Moncloa', 'Arganzuela'], 
        'Móstoles': [], 'Alcázar de San Juan': [], 'Alcalá de Henares': ['Centro Histórico', 'Ensanche', 'Espartales'], 
        'Getafe': [], 'Leganés': [], 'Alcorcon': [], 'Fuenlabrada': [], 'Torrejón de Ardoz': [], 'Pozuelo': [], 'Parla': [] 
      },
      'Murcia': { 'Murcia': [], 'Cartagena': [], 'Lorca': [] },
      'Navarra': { 'Pamplona': [], 'Tudela': [], 'Barañáin': [] },
      'País Vasco': { 'Bilbao': [], 'Vitoria': [], 'San Sebastián': [] },
      'Ceuta': { 'Ceuta': [] },
      'Melilla': { 'Melilla': [] }
    }
  },
  CO: {
    level1Label: 'Departamento',
    level2Label: 'Ciudad / Municipio',
    labels: { level1: 'Departamento', level2: 'Ciudad / Municipio', level3: 'Comuna' },
    data: {
      'Antioquia': { 'Medellín': ['El Poblado', 'Laureles-Estadio', 'Belén', 'La Candelaria'], 'Bello': [], 'Itagüí': [], 'Envigado': [], 'Rionegro': [], 'Turbo': [] },
      'Bogotá D.C.': { 'Bogotá': ['Chapinero', 'Usaquén', 'Suba', 'Teusaquillo'] },
      'Bolívar': { 'Cartagena': [], 'Magangué': [], 'Turbaco': [] },
      'Boyacá': { 'Tunja': [], 'Duitama': [], 'Sogamoso': [] },
      'Caldas': { 'Manizales': [], 'La Dorada': [], 'Chinchiía': [] },
      'Córdoba': { 'Montería': [], 'Lorica': [], 'Sahagún': [] },
      'Cundinamarca': { 'Soacha': [], 'Facatativá': [], 'Zipaquirá': [], 'Chia': [], 'Madrid': [], 'Fusagasugá': [] },
      'Magdalena': { 'Santa Marta': [], 'Ciénaga': [], 'Fundación': [] },
      'Meta': { 'Villavicencio': [], 'Acacias': [], 'Granada': [] },
      'Nariño': { 'San Juan de Pasto': [], 'Ipiales': [], 'Tumaco': [] },
      'Norte de Santander': { 'Cúcuta': [], 'Ocã±a': [], 'Pamplona': [] },
      'Risaralda': { 'Pereira': [], 'Dosquebradas': [], 'Santa Rosa de Cabal': [] },
      'Santander': { 'Bucaramanga': [], 'Floridablanca': [], 'Girón': [], 'Piedecuesta': [] },
      'Sucre': { 'Sincelejo': [], 'Corozal': [], 'San Marcos': [] },
      'Tolima': { 'Ibagué': [], 'Espinal': [], 'Melgar': [] },
      'Valle del Cauca': { 'Cali': [], 'Buenaventura': [], 'Palmira': [], 'Tuluá': [], 'Buga': [] }
    }
  },
  VE: {
    level1Label: 'Estado',
    level2Label: 'Ciudad / Municipio',
    labels: { level1: 'Estado', level2: 'Ciudad / Municipio', level3: 'Parroquia' },
    data: {
      'Amazonas': { 'Puerto Ayacucho': [] },
      'Anzoátegui': { 'Barcelona': [], 'Puerto La Cruz': [], 'El Tigre': [] },
      'Apure': { 'San Fernando de Apure': [], 'Biruaca': [] },
      'Aragua': { 'Maracay': [], 'La Victoria': [], 'Turmero': [], 'Cagua': [] },
      'Barinas': { 'Barinas': [], 'Barinas ciudad': [] },
      'Bolívar': { 'Ciudad Bolívar': [], 'Puerto Ordaz': [], 'Ciudad Guayana': [] },
      'Carabobo': { 'Valencia': [], 'Maracay': [], 'Guácamo': [] },
      'Cojedes': { 'San Carlos': [], 'Tinaco': [] },
      'Delta Amacuro': { 'Tucupita': [] },
      'Distrito Capital': { 'Caracas': [] },
      'Falcon': { 'Coro': [], 'La Vela': [], 'Punto Fijo': [] },
      'Guárico': { 'San Juan de Los Morros': [], 'Altagracia de Orituco': [] },
      'Lara': { 'Barquisimeto': [], 'Cabudare': [], 'Carora': [] },
      'Miranda': { 'Los Teques': [], 'Guátere': [], 'Ocumare del Tuy': [], 'Charallave': [], 'Púas': [] },
      'Merida': { 'Mérida': [], 'El Vigía': [], 'Tovar': [] },
      'Monagas': { 'Maturín': [], 'Caripito': [], 'Temblador': [] },
      'Nueva Esparta': { 'La Asunción': [], 'Porlamar': [], 'Pampatar': [] },
      'Portuguesa': { 'Acarigua': [], 'Araure': [], 'Guanare': [] },
      'Sucre': { 'Cumaná': [], 'Cariaco': [], 'Carúpano': [] },
      'Táchira': { 'San Cristóbal': [], 'Rubio': [], 'Táriba': [] },
      'Trujillo': { 'Trujillo': [], 'Valera': [], 'Motatán': [] },
      'Vargas': { 'La Guaira': [], 'Naiguatá': [] },
      'Yaracuy': { 'San Felipe': [], 'Yaritagua': [], 'Chivacoa': [] },
      'Zulia': { 'Maracaibo': [], 'Cabimas': [], 'Ciudad Ojeda': [] }
    }
  },
  US: {
    level1Label: 'Estado',
    level2Label: 'Ciudad',
    labels: { level1: 'Estado', level2: 'Ciudad', level3: 'Zip Code' },
    data: {
      'California': { 'Los Ángeles': [], 'San Francisco': [], 'San Diego': [], 'Sacramento': [], 'Fresno': [] },
      'Florida': { 'Miami': [], 'Orlando': [], 'Tampa': [], 'Jacksonville': [], 'Fort Lauderdale': [] },
      'Texas': { 'Houston': [], 'Dallas': [], 'San Antonio': [], 'Austin': [], 'El Paso': [] },
      'New York': { 'Nueva York': [], 'Buffalo': [], 'Rochester': [], 'Syracuse': [] },
      'Georgia': { 'Atlanta': [], 'Augusta': [], 'Columbus': [], 'Savannah': [] },
      'Illinois': { 'Chicago': [], 'Aurora': [], 'Rockford': [], 'Joliet': [] },
      'New Jersey': { 'Newark': [], 'Jersey City': [], 'Paterson': [], 'Elizabeth': [] },
      'Virginia': { 'Virginia Beach': [], 'Norfolk': [], 'Chesapeake': [], 'Richmond': [] },
      'Carolina del Norte': { 'Charlotte': [], 'Raleigh': [], 'Greensboro': [], 'Durham': [] },
      'Nevada': { 'Las Vegas': [], 'Henderson': [], 'Reno': [], 'North Las Vegas': [] }
    }
  },
  CL: {
    level1Label: 'Región',
    level2Label: 'Ciudad / Municipio',
    labels: { level1: 'Región', level2: 'Ciudad / Municipio', level3: 'Comuna' },
    data: {
      'Arica y Parinacota': { 'Arica': [], 'Putre': [] },
      'Tarapacá': { 'Iquique': [], 'Alto Hospicio': [] },
      'Antofagasta': { 'Antofagasta': [], 'Calama': [], 'Tocopilla': [] },
      'Atacama': { 'Copiapó': [], 'Valledén': [], 'Caldera': [] },
      'Coquimbo': { 'La Serena': [], 'Coquimbo': [], 'Ovalle': [] },
      'Valparaíso': { 'Valparaíso': [], 'Viña del Mar': [], 'Quilpué': [], 'San Antonio': [] },
      'Metropolitana': { 'Santiago': [], 'Puente Alto': [], 'Las Condes': [], 'Maipú': [], 'La Florida': [] },
      "O'Higgins": { 'Rancagua': [], 'San Fernando': [], 'Machalí': [] },
      'Maule': { 'Talca': [], 'Curicó': [], 'Linares': [] },
      'Ñuble': { 'Chillán': [], 'San Carlos': [], 'Quirihue': [] },
      'Biobío': { 'Concepción': [], 'Talcahuano': [], 'Los Ángeles': [] },
      'Araucanía': { 'Temuco': [], 'Angol': [], 'Victoria': [] },
      'Los Ríos': { 'Valdivia': [], 'La Unión': [], 'Panguipulli': [] },
      'Los Lagos': { 'Puerto Montt': [], 'Osorno': [], 'Castro': [] },
      'Aysén': { 'Coihaique': [], 'Chile Chico': [] },
      'Magallanes': { 'Punta Arenas': [], 'Puerto Natales': [] }
    }
  },
  PA: {
    level1Label: 'Provincia',
    level2Label: 'Distrito / Ciudad',
    labels: { level1: 'Provincia', level2: 'Distrito / Ciudad', level3: 'Corregimiento' },
    data: {
      'Panamá': { 'Ciudad de Panamá': [], 'San Miguelito': [], 'Tocumen': [] },
      'Panamá Oeste': { 'La Chorrera': [], 'Arraiján': [], 'Capira': [] },
      'Colón': { 'Colón': [], 'Portobelo': [] },
      'Coclé': { 'Penanomé': [], 'Aguadulce': [], 'Natá': [] },
      'Herrera': { 'Chitré': [], 'Las Minas': [], 'Paríta': [] },
      'Los Santos': { 'Las Tablas': [], 'Guárare': [] },
      'Veraguas': { 'Santiago': [], 'La Mesa': [], 'Calobre': [] },
      'Bocas del Toro': { 'Bocas del Toro': [], 'Changuinola': [] },
      'Chiriqui': { 'David': [], 'Boquete': [], 'La Concepción': [] },
      'Darién': { 'La Palma': [], 'Metetí': [] }
    }
  },
  PE: {
    level1Label: 'Departamento',
    level2Label: 'Ciudad / Distrito',
    labels: { level1: 'Departamento', level2: 'Ciudad / Distrito', level3: 'Zona' },
    data: {
      'Lima': { 'Lima': [], 'Miraflores': [], 'San Isidro': [], 'Callao': [], 'San Martin de Porres': [] },
      'Arequipa': { 'Arequipa': [], 'Cayma': [], 'Hunter': [] },
      'La Libertad': { 'Trujillo': [], 'Virú': [], 'Chepen': [] },
      'Lambayeque': { 'Chiclayo': [], 'Ferreñafe': [], 'Lambayeque': [] },
      'Piura': { 'Piura': [], 'Sullana': [], 'Talara': [] },
      'Cusco': { 'Cusco': [], 'San Sebastián': [], 'Wanchaq': [] },
      'Iquitos': { 'Iquitos': [], 'Nauta': [], 'Requena': [] },
      'Ucayali': { 'Pucallpa': [], 'Yarinacocha': [], 'Coronel Portillo': [] }
    }
  },
  EC: {
    level1Label: 'Provincia',
    level2Label: 'Ciudad / Cantón',
    labels: { level1: 'Provincia', level2: 'Ciudad / Cantón', level3: 'Parroquia' },
    data: {
      'Pichincha': { 'Quito': [], 'Cayambe': [], 'Rumiñahui': [] },
      'Guayas': { 'Guayaquil': [], 'Samborondón': [], 'Daule': [] },
      'Azuay': { 'Cuenca': [], 'Gualaceo': [], 'Santa Isabel': [] },
      'Manabí': { 'Portoviejo': [], 'Manta': [], 'Chone': [] },
      'El Oro': { 'Machala': [], 'Pasaje': [], 'Santa Rosa': [] },
      'Loja': { 'Loja': [], 'Catamayo': [], 'Macará': [] },
      'Imbabura': { 'Ibarra': [], 'Otavalo': [], 'Cotacachi': [] },
      'Tungurahua': { 'Ambato': [], 'Pelileo': [], 'Baños': [] }
    }
  },
  DO: {
    level1Label: 'Provincia',
    level2Label: 'Municipio',
    labels: { level1: 'Provincia', level2: 'Municipio', level3: 'Sector' },
    data: {
      'Distrito Nacional': { 'Santo Domingo': [] },
      'Santiago': { 'Santiago de los Caballeros': [], 'Villa Bisono': [] },
      'Santo Domingo': { 'Santo Domingo Este': [], 'Santo Domingo Norte': [], 'Boca Chica': [] },
      'La Vega': { 'La Vega': [], 'Jarabacoa': [], 'Constanza': [] },
      'San Cristóbal': { 'San Cristóbal': [], 'Baní': [], 'Palenque': [] },
      'La Romana': { 'La Romana': [], 'San Pedro de Macorís': [], 'Higüey': [] },
      'Puerto Plata': { 'Puerto Plata': [], 'Sosúa': [], 'Cabarete': [] }
    }
  },
  AR: {
    level1Label: 'Provincia',
    level2Label: 'Ciudad / Municipio',
    labels: { level1: 'Provincia', level2: 'Ciudad / Municipio', level3: 'Barrio' },
    data: {
      'Buenos Aires': { 'Buenos Aires': [], 'La Plata': [], 'Mar del Plata': [], 'Quilmes': [], 'Morón': [] },
      'CABA': { 'Ciudad Autónoma de Buenos Aires': [] },
      'Córdoba': { 'Córdoba': [], 'Villa María': [], 'Río Cuarto': [] },
      'Santa Fe': { 'Rosario': [], 'Santa Fe': [], 'Rafaela': [], 'Venado Tuerto': [] },
      'Mendoza': { 'Mendoza': [], 'San Rafael': [], 'Godoy Cruz': [], 'Luján de Cuyo': [] },
      'Tucumán': { 'San Miguel de Tucumán': [], 'Tafí Viejo': [], 'Bandía': [] },
      'Salta': { 'Salta': [], 'Orán': [], 'Tartagal': [] },
      'Neuquén': { 'Neuquén': [], 'San Martín de los Andes': [], 'Plottier': [] },
      'Chubut': { 'Rawson': [], 'Comodoro Rivadavia': [], 'Puerto Madryn': [] }
    }
  }
};
