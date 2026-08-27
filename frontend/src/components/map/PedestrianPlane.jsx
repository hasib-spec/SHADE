import { PolygonLayer } from '@deck.gl/layers';

/**
 * The killer visual feature: a translucent plane floating exactly 2m above the grid.
 * Represents where FortyGuard collects data and where pedestrians experience the heat.
 */
const PedestrianPlane = (data) => {
  if (!data || !data.bounds) return null;

  return new PolygonLayer({
    id: 'pedestrian-plane-layer',
    data: [{ polygon: data.bounds }], // Array of coordinates defining the area
    pickable: false,
    stroked: true,
    filled: true,
    wireframe: true,
    lineWidthMinPixels: 2,
    getPolygon: d => d.polygon,
    getElevation: 2, // Exactly 2 meters
    getFillColor: [0, 255, 157, 30], // Tech-green translucent
    getLineColor: [0, 255, 157, 150],
    getLineWidth: 2
  });
};

export default PedestrianPlane;
