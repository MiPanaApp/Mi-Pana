import spainData from '../data/spain_locations.json';

export function useSpainLocations() {

  // Obtener todas las comunidades autónomas
  const getCommunities = () =>
    spainData.communities.map(c => ({
      code: c.code,
      name: c.name
    }));

  // Obtener provincias de una comunidad por su código
  const getProvinces = (communityCode) => {
    const community = spainData.communities
      .find(c => c.code === communityCode);
    if (!community) return [];
    return community.provinces.map(p => ({
      code: p.code,
      name: p.name
    }));
  };

  // Obtener municipios de una provincia por su código
  const getMunicipalities = (communityCode, provinceCode) => {
    const community = spainData.communities
      .find(c => c.code === communityCode);
    if (!community) return [];
    const province = community.provinces
      .find(p => p.code === provinceCode);
    if (!province) return [];
    return province.municipalities.map(m => ({
      code: m.toLowerCase().replace(/\s+/g, '-')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
      name: m
    }));
  };

  // Buscar municipio por nombre (para búsquedas con autocompletado)
  const searchMunicipality = (query) => {
    if (!query || query.length < 2) return [];
    const q = query.toLowerCase();
    const results = [];
    spainData.communities.forEach(community => {
      community.provinces.forEach(province => {
        province.municipalities.forEach(municipality => {
          if (municipality.toLowerCase().includes(q)) {
            results.push({
              municipality,
              province: province.name,
              provinceCode: province.code,
              community: community.name,
              communityCode: community.code
            });
          }
        });
      });
    });
    return results.slice(0, 10);
  };

  // Obtener todos los datos en estructura plana (para filtros globales)
  const getAllLocations = () => {
    const locations = [];
    spainData.communities.forEach(community => {
      community.provinces.forEach(province => {
        province.municipalities.forEach(municipality => {
          locations.push({
            community: community.name,
            communityCode: community.code,
            province: province.name,
            provinceCode: province.code,
            municipality
          });
        });
      });
    });
    return locations;
  };

  // Resolver nombre de comunidad a partir del código
  const getCommunityName = (communityCode) => {
    const community = spainData.communities.find(c => c.code === communityCode);
    return community ? community.name : '';
  };

  // Resolver nombre de provincia a partir de código de comunidad y provincia
  const getProvinceName = (communityCode, provinceCode) => {
    const community = spainData.communities.find(c => c.code === communityCode);
    if (!community) return '';
    const province = community.provinces.find(p => p.code === provinceCode);
    return province ? province.name : '';
  };

  return {
    getCommunities,
    getProvinces,
    getMunicipalities,
    searchMunicipality,
    getAllLocations,
    getCommunityName,
    getProvinceName,
    totalCommunities: spainData.communities.length,
    totalProvinces: spainData.communities
      .reduce((acc, c) => acc + c.provinces.length, 0),
    totalMunicipalities: spainData.communities
      .reduce((acc, c) => acc + c.provinces
        .reduce((a, p) => a + p.municipalities.length, 0), 0)
  };
}
