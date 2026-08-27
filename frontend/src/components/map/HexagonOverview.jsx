import { HexagonLayer } from '@deck.gl/aggregation-layers';
import { getHeatColor } from '../../utils/colors';

/**
 * Renders 3D extruded hexagons representing aggregated heat/HERI data.
 * Useful for the zoomed-out overview.
 */
const HexagonOverview = (data) => {
  if (!data) return null;

  return new HexagonLayer({
    id: 'hexagon-layer',
    data: data.points || [],
    pickable: true,
    extruded: true,
    radius: 50,
    elevationScale: 4,
    getPosition: d => d.coordinates,
    getElevationWeight: d => d.temperature, // Or HERI score
    getColorWeight: d => d.temperature,
    colorRange: [
      [217, 242, 255], 
      [255, 236, 217], 
      [255, 161, 90],  
      [255, 76, 26],   
      [191, 22, 0]
    ],
    transitions: {
      elevationScale: 1000
    }
  });
};

export default HexagonOverview;
