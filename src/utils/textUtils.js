export const normalizeText = (text) => {
  if (!text) return '';
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^\w\s]/gi, '') // remove special characters
    .toLowerCase()
    .trim();
};

export const getWords = (text) => {
  if (!text) return [];
  const normalized = normalizeText(text);
  const words = normalized.split(/\s+/);
  const stopWords = ['de', 'la', 'el', 'y', 'en', 'a', 'los', 'las', 'un', 'una', 'con', 'por', 'para'];
  return words.filter(w => w.length > 1 && !stopWords.includes(w));
};

export const generateSubstrings = (text) => {
  const norm = normalizeText(text);
  if (!norm) return [];
  
  const substrings = [];
  // Restringimos a prefijos de al menos 3 caracteres
  const minLength = 3;
  if (norm.length < minLength) {
    return [norm];
  }

  for (let i = minLength; i <= norm.length; i++) {
    substrings.push(norm.slice(0, i));
  }
  return substrings;
};
