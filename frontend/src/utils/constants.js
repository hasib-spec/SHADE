/**
 * Phoenix Center Coordinates (Maryvale district)
 */
export const PHOENIX_CENTER = {
  lat: 33.4942,
  lng: -112.1771
};

/**
 * Intervention types, costs, and visualization params.
 * Costs and cooling deltas MUST stay aligned with the backend cooling matrix
 * (backend/optimization/knapsack.py INTERVENTION_COSTS + backend/inference/cooling_matrix.py)
 * and the README table. Previously the frontend disagreed with the backend
 * (shade $5,000 vs $8,000; tree $800 vs $1,500; pavement $15,000 vs $3,000) — fixed here.
 */
export const INTERVENTION_TYPES = {
  SHADE_SAIL: {
    id: 'shade_structure',
    name: 'Shade Structure',
    cost: 8000,
    icon: 'umbrella',
    color: '#0099ff',
    airTempDelta: -2.8,
    mrtDelta: -15.0
  },
  TREE: {
    id: 'tree_canopy',
    name: 'Canopy Tree',
    cost: 1500,
    icon: 'tree',
    color: '#00ff9d',
    airTempDelta: -2.5,
    mrtDelta: -10.0
  },
  COOL_PAVEMENT: {
    id: 'cool_pavement',
    name: 'Cool Pavement',
    cost: 3000, // per treatment unit, aligned with backend INTERVENTION_COSTS
    icon: 'road',
    color: '#d9f2ff',
    airTempDelta: -0.9,
    mrtDelta: -3.0
  },
  MISTING: {
    id: 'misting',
    name: 'Misting Station',
    cost: 5000,
    icon: 'droplet',
    color: '#0055ff',
    airTempDelta: -4.0,
    mrtDelta: -5.0
  }
};
