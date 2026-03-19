export const LOCATION_DATA = {
  ES: {
    labels: { level1: 'Provincia', level2: 'Municipio', level3: 'Barrio' },
    data: {
      'Madrid': {
        'Madrid': ['Centro', 'Salamanca', 'Chamberí', 'Retiro', 'Tetuán', 'Moncloa', 'Arganzuela'],
        'Alcalá de Henares': ['Centro Histórico', 'Ensanche', 'Espartales'],
        'Alcobendas': ['Centro', 'Valdelasfuentes', 'La Moraleja']
      },
      'Barcelona': {
        'Barcelona': ['Eixample', 'Gràcia', 'Sants-Montjuïc', 'Ciutat Vella', 'Sarrià-Sant Gervasi'],
        "L'Hospitalet de Llobregat": ['Bellvitge', 'Collblanc', 'La Florida']
      },
      'Valencia': {
        'Valencia': ['Ciutat Vella', 'Eixample', 'Extramurs', 'El Pla del Real', 'Quatre Carreres']
      }
    }
  },
  CO: {
    labels: { level1: 'Departamento', level2: 'Ciudad', level3: 'Comuna' },
    data: {
      'Antioquia': {
        'Medellín': ['El Poblado', 'Laureles-Estadio', 'Belén', 'La Candelaria']
      },
      'Cundinamarca': {
        'Bogotá': ['Chapinero', 'Usaquén', 'Suba', 'Teusaquillo']
      }
    }
  }
};
