/**
 * Phoenix Center Coordinates (Maryvale district)
 */
export const PHOENIX_CENTER = {
  lat: 33.4942,
  lng: -112.1771
};

/**
 * Intervention types, costs, and visualization params
 */
export const INTERVENTION_TYPES = {
  SHADE_SAIL: {
    id: 'shade_sail',
    name: 'Shade Structure',
    cost: 5000,
    icon: 'umbrella',
    color: '#0099ff',
    airTempDelta: -2.0,
    mrtDelta: -15.0
  },
  TREE: {
    id: 'tree',
    name: 'Canopy Tree',
    cost: 800,
    icon: 'tree',
    color: '#00ff9d',
    airTempDelta: -2.5,
    mrtDelta: -8.0
  },
  COOL_PAVEMENT: {
    id: 'cool_pavement',
    name: 'Cool Pavement',
    cost: 15000, // per block
    icon: 'road',
    color: '#d9f2ff',
    airTempDelta: -1.0,
    mrtDelta: -5.0
  },
  MISTING: {
    id: 'misting',
    name: 'Misting System',
    cost: 2500,
    icon: 'droplet',
    color: '#0055ff',
    airTempDelta: -4.0,
    mrtDelta: -4.0
  }
};
