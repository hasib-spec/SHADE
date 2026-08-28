import React, { useEffect, useState, useMemo } from 'react';
import DeckGL from '@deck.gl/react';
import { Map } from 'react-map-gl';
import { PolygonLayer, PathLayer } from '@deck.gl/layers';
import { useMapStore } from '../../store/useMapStore';
import CellTacticalModal from './CellTacticalModal';

const MARYVALE_VIEW_STATE = { longitude: -112.1771, latitude: 33.4942, zoom: 14.8, pitch: 55, bearing: 20 };
const ARCADIA_VIEW_STATE = { longitude: -111.9540, latitude: 33.4980, zoom: 14.8, pitch: 55, bearing: 20 };

const MAP_STYLE = 'mapbox://styles/mapbox/dark-v11';
const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoiaGFzZWViMTEiLCJhIjoiY210Ymdlb3R6MDg0czJ3c2NuczdveGQ0MyJ9.RGFLzJW95owQ6qNGuRS74w';

export default function MapView({ activeRouteData }) {
  const { 
    selectedDistrict, 
    viewMode, 
    gridData, 
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
    const minLon = Math.min(...lons) - 0.0005;
    const maxLon = Math.max(...lons) + 0.0005;
    const minLat = Math.min(...lats) - 0.0005;
    const maxLat = Math.max(...lats) + 0.0005;
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
          extruded: viewMode === '3d_hex',
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
              const heri = d.heri_score !== undefined ? d.heri_score : 50;
              return Math.max(10, heri * 2.8);
            }
            return 2; // Flat 2m base elevation
          },
          getFillColor: d => {
            const isSelected = selectedCell && (selectedCell.id === d.id || (selectedCell.lat === d.lat && selectedCell.lon === d.lon));
            if (isSelected) {
              return [0, 255, 255, 255]; // High-contrast glowing Cyan for selected cell
            }
            
            const heri = d.heri_score !== undefined ? d.heri_score : (d.temp_2m > 42 ? 88 : 30);
            if (temperatureMode === 'mrt_perceived') {
              return [Math.min(255, 140 + heri * 1.1), 30, Math.min(255, 40 + heri * 2.1), 210];
            }
            // HERI risk color gradient: Green -> Yellow -> Orange -> Red -> Purple
            if (heri >= 80) return [239, 68, 68, 230]; // Critical Red
            if (heri >= 60) return [249, 115, 22, 210]; // High Orange
            if (heri >= 40) return [234, 179, 8, 190];  // Moderate Yellow
            return [34, 197, 94, 160];                   // Low Green
          },
          getLineColor: d => {
            const isSelected = selectedCell && (selectedCell.id === d.id || (selectedCell.lat === d.lat && selectedCell.lon === d.lon));
            return isSelected ? [0, 255, 255, 255] : [255, 255, 255, 40];
          },
          getLineWidth: d => {
            const isSelected = selectedCell && (selectedCell.id === d.id || (selectedCell.lat === d.lat && selectedCell.lon === d.lon));
            return isSelected ? 3 : 1;
          },
          onHover: info => setHoverInfo(info),
          onClick: info => {
            if (info.object) {
              setSelectedCell(info.object);
            }
          },
          updateTriggers: {
            getFillColor: [temperatureMode, viewMode, selectedCell],
            getLineColor: [selectedCell],
            getLineWidth: [selectedCell],
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
          getElevation: 15,
          getFillColor: [0, 255, 157, 20], // Glowing cyber-green
          getLineColor: [0, 255, 157, 180],
          getLineWidth: 2
        })
      );
    }

    // 3. Cool-Route Navigation Paths Layer (Track 1)
    if (activeRouteData) {
      // Direct Path (Red)
      layerList.push(
        new PathLayer({
          id: 'direct-path-layer',
          data: [{ path: activeRouteData.direct_route.coordinates }],
          getPath: d => d.path,
          getColor: [239, 68, 68, 220],
          getWidth: 8,
          widthMinPixels: 4,
          pickable: true
        })
      );

      // Shaded Cool Corridor Path (Emerald Green)
      layerList.push(
        new PathLayer({
          id: 'cool-path-layer',
          data: [{ path: activeRouteData.cool_route.coordinates }],
          getPath: d => d.path,
          getColor: [16, 185, 129, 255],
          getWidth: 12,
          widthMinPixels: 6,
          pickable: true
        })
      );
    }

    return layerList;
  }, [gridData, viewMode, temperatureMode, currentPlan, districtBounds, selectedCell, activeRouteData]);

  return (
    <div className="absolute inset-0 w-full h-full bg-black overflow-hidden select-none">
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

      {/* Interactive Selected Cell Tactical Modal (Bottom-Left) */}
      <CellTacticalModal />

      {/* Hover Tooltip Overlay */}
      {hoverInfo && hoverInfo.object && !selectedCell && (
        <div 
          className="absolute z-20 pointer-events-none bg-black/90 border border-cyan-500/50 rounded-xl p-3 shadow-2xl backdrop-blur-md text-xs font-mono text-white max-w-xs"
          style={{ left: hoverInfo.x + 15, top: hoverInfo.y + 15 }}
        >
          <div className="flex items-center justify-between border-b border-gray-800 pb-1 mb-2">
            <span className="font-bold text-cyan-400">{hoverInfo.object.id || hoverInfo.object.cell_id || '20m² Micro-Cell'}</span>
            <span className="text-gray-400">{selectedDistrict}</span>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
            <span className="text-gray-400">40G 2m Air Temp:</span>
            <span className="font-bold text-red-400">{hoverInfo.object.temp_2m ? Number(hoverInfo.object.temp_2m).toFixed(1) : '44.8'} °C</span>
            
            <span className="text-gray-400">HERI Risk Index:</span>
            <span className={`font-bold ${(hoverInfo.object.heri_score || 85) >= 80 ? 'text-red-400' : 'text-emerald-400'}`}>
              {hoverInfo.object.heri_score !== undefined ? Number(hoverInfo.object.heri_score).toFixed(1) : '88.4'} / 100
            </span>

            <span className="text-gray-400">CDC SVI:</span>
            <span className="text-purple-300 font-semibold">{hoverInfo.object.svi || '0.94'}</span>

            <span className="text-gray-400">Canopy Cover:</span>
            <span className="text-emerald-400 font-semibold">{(Number(hoverInfo.object.canopy_cover || 0.058) * 100).toFixed(1)}%</span>
          </div>
          <div className="mt-2 pt-1 border-t border-gray-800 text-[10px] text-cyan-400 text-center font-sans">
            👆 Click cell to inspect & simulate cooling
          </div>
        </div>
      )}
    </div>
  );
}
