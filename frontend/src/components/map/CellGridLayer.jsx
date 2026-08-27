import { GeoJsonLayer } from '@deck.gl/layers';

/**
 * Shows the actual 20m² grid cells.
 */
const CellGridLayer = (data) => {
  if (!data || !data.cells) return null;

  return new GeoJsonLayer({
    id: 'cell-grid-layer',
    data: data.cells,
    pickable: true,
    stroked: true,
    filled: true,
    extruded: false,
    lineWidthScale: 1,
    lineWidthMinPixels: 1,
    getFillColor: d => [255, 76, 26, d.properties.riskScore * 2.55], // Scale 0-100 to alpha
    getLineColor: [255, 255, 255, 50],
    getLineWidth: 1
  });
};

export default CellGridLayer;
