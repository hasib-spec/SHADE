import React, { useEffect, useState, useMemo } from 'react';
import DeckGL from '@deck.gl/react';
import { Map } from 'react-map-gl';
import { PolygonLayer, GeoJsonLayer } from '@deck.gl/layers';
import { HexagonLayer } from '@deck.gl/aggregation-layers';
import { useMapStore } from '../../store/useMapStore';
import MapControls from './MapControls';
import { getHeriColor, getHeatColor } from '../../utils/colors';

const MARYVALE_VIEW_STATE = { longitude: -112.1771, latitude: 33.4942, zoom: 14.8, pitch: 55, bearing: 20 };
const ARCADIA_VIEW_STATE = { longitude: -111.9540, latitude: 33.4980, zoom: 14.8, pitch: 55, bearing: 20 };

const MAP_STYLE = 'mapbox://styles/mapbox/dark-v11';
const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

export default function MapView() {
  const { 
    selectedDistrict, 
    viewMode, 
    gridData, 
    setGridData,
    setSelectedCell,
    selectedCell,
    currentPlan,
    temperatureMode
  } = useMapStore();

  const [hoverInfo, setHoverInfo] = useState(null);
  const [viewState, setViewState] = useState(
    selectedDistrict.toLowerCase() === 'arcadia' ? ARCADIA_VIEW_STATE : MARYVALE_VIEW_STATE
  );

  // Sync view state when district changes
  useEffect(() => {
    const targetState = selectedDistrict.toLowerCase() === 'arcadia' ? ARCADIA_VIEW_STATE : MARYVALE_VIEW_STATE;
    setViewState(targetState);
  }, [selectedDistrict]);

  // Initial grid data fetch on mount if empty
  useEffect(() => {
    if (!gridData || gridData.length === 0) {
      useMapStore.getState().setSelectedDistrict(selectedDistrict);
    }
  }, []);

  // Compute bounding box polygon for 2m Pedestrian Plane
  const districtBounds = useMemo(() => {
    if (!gridData || gridData.length === 0) {
      return selectedDistrict.toLowerCase() === 'arcadia'
        ? [[-111.962, 33.492], [-111.946, 33.492], [-111.946, 33.504], [-111.962, 33.504]]
        : [[-112.185, 33.488], [-112.169, 33.488], [-112.169, 33.500], [-112.185, 33.500]];
    }
    const lons = gridData.map(c => c.lon);
    const lats = gridData.map(c => c.lat);
    const minLon = Math.min(...lons) - 0.001;
    const maxLon = Math.max(...lons) + 0.001;
    const minLat = Math.min(...lats) - 0.001;
    const maxLat = Math.max(...lats) + 0.001;
    return [[minLon, minLat], [maxLon, minLat], [maxLon, maxLat], [minLon, maxLat]];
  }, [gridData, selectedDistrict]);

  // Build Deck.gl Layers
  const layers = useMemo(() => {
    const layerList = [];

    // 1. 20m² Micro-Cell Grid Layer (Extruded Heat/HERI Prisms)
    if (gridData && gridData.length > 0) {
      layerList.push(
        new PolygonLayer({
          id: '20m-micro-cells-layer',
          data: gridData,
          pickable: true,
          stroked: true,
          filled: true,
          extruded: viewMode === '3d_hex' || viewMode === '20m_cells',
          wireframe: false,
          lineWidthMinPixels: 1,
          getPolygon: d => d.polygon_coords || [
            [d.lon - 0.0001, d.lat - 0.0001],
            [d.lon + 0.0001, d.lat - 0.0001],
            [d.lon + 0.0001, d.lat + 0.0001],
            [d.lon - 0.0001, d.lat + 0.0001]
          ],
          getElevation: d => {
            if (viewMode === '3d_hex') {
              return (d.heri_score || ((d.temp_2m - 35) * 8)) * 3.5;
            }
            return 2; // Flat 2m base elevation
          },
          getFillColor: d => {
            const heri = d.heri_score !== undefined ? d.heri_score : (d.temp_2m > 42 ? 88 : 30);
            if (temperatureMode === 'mrt_perceived') {
              // MRT Perceived scale (Red to Purple)
              return [Math.min(255, 140 + heri * 1.1), 30, Math.min(255, 40 + heri * 2.1), 210];
            }
            // HERI risk color gradient: Green -> Yellow -> Orange -> Red -> Purple
            if (heri >= 80) return [239, 68, 68, 230]; // Critical Red
            if (heri >= 60) return [249, 115, 22, 210]; // High Orange
            if (heri >= 40) return [234, 179, 8, 190];  // Moderate Yellow
            return [34, 197, 94, 160];                   // Low Green
          },
          getLineColor: [255, 255, 255, 40],
          getLineWidth: 1,
          onHover: info => setHoverInfo(info),
          onClick: info => {
            if (info.object) {
              setSelectedCell(info.object);
            }
          },
          updateTriggers: {
            getFillColor: [temperatureMode, viewMode],
            getElevation: [viewMode]
          }
        })
      );
    }

    // 2. Translucent 2m Pedestrian Measurement Plane (FortyGuard Philosophy)
    if (viewMode === '2m_plane' || viewMode === '3d_hex') {
      layerList.push(
        new PolygonLayer({
          id: 'pedestrian-plane-layer',
          data: [{ polygon: districtBounds }],
          pickable: false,
          stroked: true,
          filled: true,
          wireframe: true,
          lineWidthMinPixels: 2,
          getPolygon: d => d.polygon,
          getElevation: 25, // Visual elevation plane for pedestrian zone
          getFillColor: [0, 255, 157, 25], // Glowing cyber-green
          getLineColor: [0, 255, 157, 180],
          getLineWidth: 2
        })
      );
    }

    // 3. Planned Intervention Overlays
    if (currentPlan && currentPlan.allocations) {
      layerList.push(
        new PolygonLayer({
          id: 'intervention-allocations-layer',
          data: currentPlan.allocations,
          pickable: true,
          stroked: true,
          filled: true,
          extruded: true,
          getPolygon: d => [
            [d.lon - 0.00015, d.lat - 0.00015],
            [d.lon + 0.00015, d.lat - 0.00015],
            [d.lon + 0.00015, d.lat + 0.00015],
            [d.lon - 0.00015, d.lat + 0.00015]
          ],
          getElevation: 60,
          getFillColor: [59, 130, 246, 230], // Cooling Blue
          getLineColor: [147, 197, 253, 255],
          getLineWidth: 3,
          onHover: info => setHoverInfo(info)
        })
      );
    }

    return layerList;
  }, [gridData, viewMode, temperatureMode, currentPlan, districtBounds]);

  return (
    <div className="absolute inset-0 w-full h-full bg-shade-dark overflow-hidden">
      <DeckGL
        viewState={viewState}
        onViewStateChange={({ viewState }) => setViewState(viewState)}
        controller={true}
        layers={layers}
      >
        <Map
          reuseMaps
          mapStyle={MAP_STYLE}
          mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
        />
      </DeckGL>

      {/* Floating Map Controls Top-Left */}
      <div className="absolute top-4 left-4 z-10">
        <MapControls />
      </div>

      {/* Tooltip Overlay */}
      {hoverInfo && hoverInfo.object && (
        <div 
          className="absolute z-20 pointer-events-none bg-shade-panel/95 border border-shade-accent/40 rounded-lg p-3 shadow-2xl backdrop-blur-md text-xs font-mono text-white max-w-xs"
          style={{ left: hoverInfo.x + 12, top: hoverInfo.y + 12 }}
        >
          <div className="flex items-center justify-between border-b border-shade-border pb-1 mb-2">
            <span className="font-bold text-shade-accent">{hoverInfo.object.cell_id || '20m² Micro-Cell'}</span>
            <span className="text-gray-400">{hoverInfo.object.district || selectedDistrict}</span>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
            <span className="text-gray-400">40G 2m Air Temp:</span>
            <span className="font-bold text-red-400">{hoverInfo.object.temp_2m || '44.6'} °C</span>
            
            <span className="text-gray-400">HERI Risk Index:</span>
            <span className={`font-bold ${(hoverInfo.object.heri_score || 85) >= 80 ? 'text-red-400' : 'text-green-400'}`}>
              {hoverInfo.object.heri_score !== undefined ? hoverInfo.object.heri_score : 88.4} / 100
            </span>

            <span className="text-gray-400">CDC SVI Vulnerability:</span>
            <span className="text-purple-300 font-semibold">{hoverInfo.object.svi || '0.94'} (High)</span>

            <span className="text-gray-400">Tree Canopy Cover:</span>
            <span className="text-emerald-400 font-semibold">{(hoverInfo.object.canopy_cover * 100 || 5.2).toFixed(1)}%</span>

            <span className="text-gray-400">Seniors / 20m²:</span>
            <span className="text-orange-300 font-semibold">{hoverInfo.object.elderly_density || 42} residents</span>
          </div>
          <div className="mt-2 pt-1 border-t border-shade-border text-[10px] text-gray-400 text-center">
            Click cell to simulate tactical cooling intervention
          </div>
        </div>
      )}
    </div>
  );
}
