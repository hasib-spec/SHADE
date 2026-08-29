import React, { useEffect, useState, useMemo } from 'react';
import DeckGL from '@deck.gl/react';
import { Map } from 'react-map-gl';
import { PolygonLayer, PathLayer } from '@deck.gl/layers';
import { useMapStore } from '../../store/useMapStore';
import CellTacticalModal from './CellTacticalModal';

const MARYVALE_VIEW_STATE = { longitude: -112.1771, latitude: 33.4942, zoom: 15.1, pitch: 58, bearing: 22 };
const ARCADIA_VIEW_STATE = { longitude: -111.9540, latitude: 33.4980, zoom: 15.1, pitch: 58, bearing: 22 };

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
    const minLon = Math.min(...lons) - 0.0006;
    const maxLon = Math.max(...lons) + 0.0006;
    const minLat = Math.min(...lats) - 0.0006;
    const maxLat = Math.max(...lats) + 0.0006;
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
          getPolygon: d => d.polygon || d.polygon_coords || [
            [d.lon - 0.0001, d.lat - 0.0001],
            [d.lon + 0.0001, d.lat - 0.0001],
            [d.lon + 0.0001, d.lat + 0.0001],
            [d.lon - 0.0001, d.lat + 0.0001]
          ],
          getElevation: d => {
            if (viewMode === '3d_hex') {
              const heri = d.heri_score !== undefined ? d.heri_score : 50;
              return Math.max(12, heri * 3.2);
            }
            return 2; // Flat base
          },
          getFillColor: d => {
            const isSelected = selectedCell && (selectedCell.id === d.id || (selectedCell.lat === d.lat && selectedCell.lon === d.lon));
            if (isSelected) {
              return [0, 229, 255, 255]; // Laser Cyan highlight
            }
            
            const heri = d.heri_score !== undefined ? d.heri_score : (d.temp_2m > 42 ? 88 : 30);
            if (temperatureMode === 'mrt_perceived') {
              return [Math.min(255, 130 + heri * 1.2), 35, Math.min(255, 50 + heri * 2.1), 220];
            }
            // Multi-bracket heat risk color grading:
            if (heri >= 80) return [255, 51, 85, 230];   // Critical Laser Crimson
            if (heri >= 60) return [255, 153, 0, 215];   // High Solar Amber
            if (heri >= 40) return [250, 204, 21, 195];  // Moderate Yellow
            return [0, 245, 155, 175];                   // Cyber Emerald (Low Risk)
          },
          getLineColor: d => {
            const isSelected = selectedCell && (selectedCell.id === d.id || (selectedCell.lat === d.lat && selectedCell.lon === d.lon));
            return isSelected ? [0, 229, 255, 255] : [255, 255, 255, 30];
          },
          getLineWidth: d => {
            const isSelected = selectedCell && (selectedCell.id === d.id || (selectedCell.lat === d.lat && selectedCell.lon === d.lon));
            return isSelected ? 4 : 1;
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

    // 2. Translucent 2m Pedestrian Measurement Plane (FortyGuard Principle)
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
          getElevation: 18,
          getFillColor: [0, 245, 155, 25], // Cyber emerald translucent glow
          getLineColor: [0, 245, 155, 190],
          getLineWidth: 2
        })
      );
    }

    // 3. Cool-Route Navigation Paths Layer (Track 1)
    if (activeRouteData) {
      // Direct Path (Crimson Laser)
      layerList.push(
        new PathLayer({
          id: 'direct-path-layer',
          data: [{ path: activeRouteData.direct_route.coordinates }],
          getPath: d => d.path,
          getColor: [255, 51, 85, 230],
          getWidth: 8,
          widthMinPixels: 4,
          pickable: true
        })
      );

      // Shaded Cool Corridor Path (Cyber Emerald)
      layerList.push(
        new PathLayer({
          id: 'cool-path-layer',
          data: [{ path: activeRouteData.cool_route.coordinates }],
          getPath: d => d.path,
          getColor: [0, 245, 155, 255],
          getWidth: 12,
          widthMinPixels: 6,
          pickable: true
        })
      );
    }

    return layerList;
  }, [gridData, viewMode, temperatureMode, currentPlan, districtBounds, selectedCell, activeRouteData]);

  return (
    <div className="absolute inset-0 w-full h-full bg-[#08090D] overflow-hidden select-none">
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

      {/* Atmospheric Hover Tooltip Overlay */}
      {hoverInfo && hoverInfo.object && !selectedCell && (
        <div 
          className="absolute z-20 pointer-events-none bg-[#08090D]/95 border border-cyan-400/40 rounded-xl p-3.5 shadow-2xl backdrop-blur-xl text-xs font-mono text-white max-w-xs transition-all duration-150"
          style={{ left: hoverInfo.x + 18, top: hoverInfo.y + 18 }}
        >
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-1.5 mb-2">
            <span className="font-bold text-cyan-300">
              {hoverInfo.object.id?.slice(0, 13) || '20m² Micro-Cell'}
            </span>
            <span className="text-[10px] text-gray-400 font-sans uppercase tracking-wider">{selectedDistrict}</span>
          </div>

          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px] tabular-nums">
            <span className="text-gray-400">40G 2m Air Temp:</span>
            <span className="font-bold text-red-400">
              {hoverInfo.object.temp_2m ? Number(hoverInfo.object.temp_2m).toFixed(1) : '44.8'} °C
            </span>
            
            <span className="text-gray-400">HERI Risk Index:</span>
            <span className={`font-bold ${(hoverInfo.object.heri_score || 85) >= 80 ? 'text-red-400' : 'text-emerald-400'}`}>
              {hoverInfo.object.heri_score !== undefined ? Number(hoverInfo.object.heri_score).toFixed(1) : '88.4'} / 100
            </span>

            <span className="text-gray-400">CDC SVI Vulnerability:</span>
            <span className="text-purple-300 font-semibold">{hoverInfo.object.svi || '0.94'}</span>

            <span className="text-gray-400">Tree Canopy:</span>
            <span className="text-emerald-400 font-semibold">{(Number(hoverInfo.object.canopy_cover || 0.058) * 100).toFixed(1)}%</span>
          </div>

          <div className="mt-2.5 pt-1.5 border-t border-white/[0.08] text-[10px] text-cyan-400 text-center font-sans">
            👆 Click prism to inspect & run surrogate model
          </div>
        </div>
      )}
    </div>
  );
}
