// Mapa de monedas por código ISO de país
export const CURRENCY_MAP = {
  ES: { symbol: '€',  code: 'EUR', name: 'Euro' },
  PT: { symbol: '€',  code: 'EUR', name: 'Euro' },
  US: { symbol: '$',  code: 'USD', name: 'Dólar estadounidense' },
  EC: { symbol: '$',  code: 'USD', name: 'Dólar estadounidense' },
  PA: { symbol: 'B/.', code: 'PAB', name: 'Balboa / Dólar' },
  CO: { symbol: '$',  code: 'COP', name: 'Peso colombiano' },
  AR: { symbol: '$',  code: 'ARS', name: 'Peso argentino' },
  CL: { symbol: '$',  code: 'CLP', name: 'Peso chileno' },
  PE: { symbol: 'S/', code: 'PEN', name: 'Sol' },
  DO: { symbol: 'RD$', code: 'DOP', name: 'Peso dominicano' },
  MX: { symbol: '$',  code: 'MXN', name: 'Peso mexicano' },
  VE: { symbol: 'Bs.', code: 'VES', name: 'Bolívar' },
};

// Devuelve el objeto de moneda para un código ISO dado
// Si el país no está en el mapa, devuelve Euro como fallback
export const getCurrency = (countryCode) => {
  return CURRENCY_MAP[countryCode] || { symbol: '€', code: 'EUR', name: 'Euro' };
};

// Devuelve solo el símbolo
export const getCurrencySymbol = (countryCode) => {
  return getCurrency(countryCode).symbol;
};
