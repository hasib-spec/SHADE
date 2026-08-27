import { IconLayer } from '@deck.gl/layers';

const ICON_MAPPING = {
  marker: {x: 0, y: 0, width: 128, height: 128, mask: true}
};

/**
 * Renders icons at the locations of proposed interventions.
 */
const InterventionMarkers = (interventions) => {
  if (!interventions || interventions.length === 0) return null;

  return new IconLayer({
    id: 'intervention-markers',
    data: interventions,
    pickable: true,
    iconAtlas: 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/website/icon-atlas.png',
    iconMapping: ICON_MAPPING,
    getIcon: d => 'marker',
    sizeScale: 10,
    getPosition: d => d.coordinates,
    getSize: d => 3,
    getColor: d => [0, 255, 157], // Accent color
  });
};

export default InterventionMarkers;
