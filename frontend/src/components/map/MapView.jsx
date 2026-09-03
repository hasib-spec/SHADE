import React, { useEffect, useState, useMemo } from 'react';
import DeckGL from '@deck.gl/react';
import { Map } from 'react-map-gl';
import { PolygonLayer, PathLayer, ScatterplotLayer, ColumnLayer } from '@deck.gl/layers';
import { useMapStore } from '../../store/useMapStore';
import CellTacticalModal from './CellTacticalModal';
import { FiClock, FiSun, FiAlertTriangle, FiShield, FiCheckCircle } from 'react-icons/fi';

const MARYVALE_VIEW_STATE = { longitude: -112.1771, latitude: 33.4942, zoom: 15.1, pitch: 58, bearing: 22 };
const ARCADIA_VIEW_STATE = { longitude: -111.9540, latitude: 33.4980, zoom: 15.1, pitch: 58, bearing: 22 };

const MAP_STYLE = 'mapbox://styles/mapbox/dark-v11';
const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN; // provided via .env — never hardcode tokens in source

export default function MapView({ activeRouteData }) {
  const { 
    selectedDistrict, 
    selectedHour,
    viewMode, 
    gridData, 
    setSelectedCell,
    selectedCell,
    currentPlan,
    temperatureMode,
    viewState: storeViewState,
    setViewState: setStoreViewState
  } = useMapStore();

  const [hoverInfo, setHoverInfo] = useState(null);
  const [hoveredIntervention, setHoveredIntervention] = useState(null);

  const [viewState, setViewState] = useState(
    selectedDistrict.toLowerCase().includes('arcadia') ? ARCADIA_VIEW_STATE : MARYVALE_VIEW_STATE
  );

  // Sync view state when storeViewState changes (e.g. from Co-Pilot Focus button or Global Geocoder)
  useEffect(() => {
    if (storeViewState) {
      setViewState(storeViewState);
    }
  }, [storeViewState]);

  // Initial grid data fetch on mount if empty
  useEffect(() => {
    if (!gridData || gridData.length === 0) {
      useMapStore.getState().setSelectedDistrict(selectedDistrict);
    }
  }, []);

  // Compute bounding box polygon for 2m Pedestrian Plane around active grid
  const districtBounds = useMemo(() => {
    if (!gridData || gridData.length === 0) {
      return selectedDistrict.toLowerCase().includes('arcadia')
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

  // Live Diurnal Metrics
  const diurnalStats = useMemo(() => {
    if (!gridData || gridData.length === 0) return { avg: '38.5', max: '42.0', critical: 0, total: 400 };
    const temps = gridData.map(c => Number(c.temp_2m) || 35.0);
    const avg = temps.reduce((a, b) => a + b, 0) / temps.length;
    const max = Math.max(...temps);
    const critical = gridData.filter(c => (Number(c.temp_2m) || 0) >= 42.0).length;
    return { avg: avg.toFixed(1), max: max.toFixed(1), critical, total: gridData.length };
  }, [gridData]);

  // Formatted interventions list with coordinates
  const activeInterventions = useMemo(() => {
    if (!currentPlan?.interventions || currentPlan.interventions.length === 0) return [];
    return currentPlan.interventions.map((item, idx) => ({
      ...item,
      id: item.cell_id || `int_${idx}`,
      lat: item.lat || (gridData[0]?.lat || 33.4942),
      lon: item.lon || (gridData[0]?.lon || -112.1771)
    }));
  }, [currentPlan, gridData]);

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
              const temp = Number(d.temp_2m) || 35.0;
              return Math.max(10, (temp - 28.0) * 18.0);
            }
            return 2;
          },
          getFillColor: d => {
            const isSelected = selectedCell && (selectedCell.id === d.id || (selectedCell.lat === d.lat && selectedCell.lon === d.lon));
            if (isSelected) {
              return [0, 229, 255, 255]; // Laser Cyan highlight
            }

            // Check if this cell is part of active AI deployed intervention plan
            const isAllocated = activeInterventions.some(item => 
              item.cell_id === d.id || (Math.abs(item.lat - d.lat) < 0.00015 && Math.abs(item.lon - d.lon) < 0.00015)
            );
            if (isAllocated) {
              return [0, 245, 155, 250]; // Glowing Cyber Emerald
            }

            const temp = Number(d.temp_2m) || 35.0;
            if (temperatureMode === 'mrt_perceived') {
              if (temp > 48) return [255, 0, 128, 240];
              if (temp > 44) return [220, 38, 127, 230];
              if (temp > 40) return [147, 51, 234, 210];
              return [59, 130, 246, 180];
            }

            // Dynamic Diurnal Heat Gradient:
            if (temp >= 48.0) return [255, 25, 65, 240];   // Scorching Crimson
            if (temp >= 44.0) return [255, 90, 20, 230];   // Solar Orange/Red
            if (temp >= 40.0) return [255, 175, 0, 215];   // High Amber
            if (temp >= 36.0) return [240, 210, 30, 195];  // Moderate Warm Yellow
            return [0, 245, 155, 175];                     // Cool Emerald
          },
          getLineColor: d => {
            const isSelected = selectedCell && (selectedCell.id === d.id || (selectedCell.lat === d.lat && selectedCell.lon === d.lon));
            if (isSelected) return [0, 229, 255, 255];
            
            const isAllocated = activeInterventions.some(item => 
              item.cell_id === d.id || (Math.abs(item.lat - d.lat) < 0.00015 && Math.abs(item.lon - d.lon) < 0.00015)
            );
            return isAllocated ? [0, 245, 155, 255] : [255, 255, 255, 25];
          },
          getLineWidth: d => {
            const isSelected = selectedCell && (selectedCell.id === d.id || (selectedCell.lat === d.lat && selectedCell.lon === d.lon));
            if (isSelected) return 4;
            const isAllocated = activeInterventions.some(item => 
              item.cell_id === d.id || (Math.abs(item.lat - d.lat) < 0.00015 && Math.abs(item.lon - d.lon) < 0.00015)
            );
            return isAllocated ? 3 : 1;
          },
          onHover: info => setHoverInfo(info),
          onClick: info => {
            if (info.object) {
              setSelectedCell(info.object);
            }
          },
          updateTriggers: {
            getFillColor: [temperatureMode, viewMode, selectedCell, activeInterventions, selectedHour, gridData],
            getLineColor: [selectedCell, activeInterventions],
            getLineWidth: [selectedCell, activeInterventions],
            getElevation: [viewMode, selectedHour, gridData]
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
          getFillColor: [0, 245, 155, 25],
          getLineColor: [0, 245, 155, 190],
          getLineWidth: 2
        })
      );
    }

    // 3. AI Deployed Tactical Intervention Beacons (Towering 3D Pillars above prisms)
    if (activeInterventions.length > 0) {
      // 3A. Towering Neon Emerald Pillars
      layerList.push(
        new ColumnLayer({
          id: 'ai-intervention-beacons',
          data: activeInterventions,
          diskResolution: 12,
          radius: 12,
          extruded: true,
          pickable: true,
          elevationScale: 1,
          getPosition: d => [d.lon, d.lat],
          getElevation: 260,
          getFillColor: [0, 245, 155, 190],
          getLineColor: [255, 255, 255, 255],
          lineWidthMinPixels: 2,
          stroked: true,
          onHover: info => setHoveredIntervention(info.object || null),
          onClick: info => {
            if (info.object) {
              const matchingCell = gridData.find(c => Math.abs(c.lat - info.object.lat) < 0.0002 && Math.abs(c.lon - info.object.lon) < 0.0002);
              if (matchingCell) setSelectedCell(matchingCell);
            }
          }
        })
      );

      // 3B. High Pulsing Concentric Rings
      layerList.push(
        new ScatterplotLayer({
          id: 'ai-intervention-rings',
          data: activeInterventions,
          getPosition: d => [d.lon, d.lat, 265],
          getRadius: 28,
          radiusMinPixels: 8,
          radiusMaxPixels: 35,
          getFillColor: [0, 245, 155, 80],
          getLineColor: [0, 245, 155, 255],
          lineWidthMinPixels: 3,
          stroked: true,
          filled: true,
          pickable: false
        })
      );
    }

    // 4. Cool-Route Navigation Paths Layer (Track 1)
    if (activeRouteData) {
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
  }, [gridData, viewMode, temperatureMode, activeInterventions, districtBounds, selectedCell, activeRouteData, selectedHour]);

  const formatHourDisplay = (h) => {
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    return `${displayH}:00 ${period}`;
  };

  return (
    <div className="absolute inset-0 w-full h-full bg-[#08090D] overflow-hidden select-none">
      {!MAPBOX_ACCESS_TOKEN && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 bg-[#08090D]/95 border border-amber-500/40 rounded-xl p-5 max-w-sm text-center font-mono text-xs text-amber-300 space-y-2">
          <div className="text-sm font-bold">Mapbox token not configured</div>
          <div className="text-gray-400 leading-relaxed">Set <span className="text-cyan-300">VITE_MAPBOX_TOKEN</span> in <span className="text-cyan-300">frontend/.env</span> (see .env.example). Base map tiles are disabled without it; the app's data and API features still work.</div>
        </div>
      )}
      <DeckGL
        viewState={viewState}
        onViewStateChange={({ viewState }) => {
          setViewState(viewState);
          setStoreViewState(viewState);
        }}
        controller={true}
        layers={layers}
      >
        <Map
          reuseMaps
          mapStyle={MAP_STYLE}
          mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
        />
      </DeckGL>

      {/* Floating Diurnal Heat Evolution & Timeline Telemetry HUD (Top-Left) */}
      <div className="absolute top-4 left-4 z-20 bg-[#08090D]/90 backdrop-blur-xl border border-white/[0.1] rounded-xl p-3.5 shadow-2xl font-mono text-xs text-white max-w-xs space-y-2">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-1.5">
          <div className="flex items-center gap-1.5 text-cyan-300 font-bold text-xs">
            <FiClock className="text-cyan-400" />
            <span>{formatHourDisplay(selectedHour)} Timeline Telemetry</span>
          </div>
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${selectedHour >= 14 && selectedHour <= 16 ? 'bg-red-950 text-red-300 border border-red-500/50' : 'bg-cyan-950 text-cyan-300'}`}>
            {selectedHour >= 14 && selectedHour <= 16 ? 'PEAK HEATWAVE' : 'DIURNAL CYCLE'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px] tabular-nums">
          <div className="bg-black/50 p-2 rounded-lg border border-white/[0.06]">
            <span className="text-[9px] text-gray-400 block font-sans uppercase">District Mean</span>
            <span className="text-red-400 font-bold text-sm">{diurnalStats.avg}°C</span>
          </div>
          <div className="bg-black/50 p-2 rounded-lg border border-white/[0.06]">
            <span className="text-[9px] text-gray-400 block font-sans uppercase">Hotspot Peak</span>
            <span className="text-red-500 font-extrabold text-sm">{diurnalStats.max}°C</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] text-gray-300 pt-1 border-t border-white/[0.06]">
          <span className="flex items-center gap-1 text-amber-300">
            <FiAlertTriangle size={11} /> Crisis Cells (&gt;42°C):
          </span>
          <span className="font-bold text-red-400">{diurnalStats.critical} / {diurnalStats.total}</span>
        </div>

        {activeInterventions.length > 0 && (
          <div className="pt-1.5 border-t border-emerald-500/30 flex items-center justify-between text-[10px] text-emerald-400 font-bold">
            <span className="flex items-center gap-1">
              <FiShield size={11} /> Tactical Cooling Active:
            </span>
            <span>{activeInterventions.length} sites deployed</span>
          </div>
        )}
      </div>

      {/* Interactive Selected Cell Tactical Modal (Bottom-Left) */}
      <CellTacticalModal />

      {/* Hover Tooltip for Intervention Beacons */}
      {hoveredIntervention && (
        <div 
          className="absolute z-30 pointer-events-none bg-emerald-950/95 border border-emerald-400/80 rounded-xl p-3 shadow-2xl backdrop-blur-xl text-xs font-mono text-white max-w-xs"
          style={{ left: '50%', top: '15%', transform: 'translateX(-50%)' }}
        >
          <div className="flex items-center gap-2 border-b border-emerald-500/40 pb-1 mb-1.5 text-emerald-300 font-bold">
            <FiCheckCircle size={14} className="text-emerald-400" />
            <span>Deployed Tactical Cooling Site</span>
          </div>
          <div className="text-[11px] space-y-1 text-gray-200">
            <div>Type: <strong className="text-white capitalize">{hoveredIntervention.intervention_type?.replace('_', ' ') || 'Tactical Shade'}</strong></div>
            <div>Projected Cooling: <strong className="text-emerald-300">{hoveredIntervention.cooling_delta ? `${hoveredIntervention.cooling_delta}°C` : '-2.8°C Air / -15.0°C MRT'}</strong></div>
            <div>Protected Seniors: <strong className="text-cyan-300">{hoveredIntervention.residents_covered || 450} residents</strong></div>
          </div>
        </div>
      )}

      {/* Atmospheric Hover Tooltip Overlay (Row-based layout with zero blank overflows) */}
      {hoverInfo && hoverInfo.object && !selectedCell && !hoveredIntervention && (
        <div 
          className="absolute z-20 pointer-events-none bg-[#08090D]/95 border border-cyan-400/50 rounded-xl p-3.5 shadow-2xl backdrop-blur-xl text-xs font-mono text-white min-w-[240px] max-w-xs transition-all duration-150"
          style={{ left: hoverInfo.x + 18, top: hoverInfo.y + 18 }}
        >
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-1.5 mb-2.5">
            <span className="font-bold text-cyan-300 truncate max-w-[140px]">
              {hoverInfo.object.id || hoverInfo.object.cell_id || '20m² Micro-Cell'}
            </span>
            <span className="text-[9px] text-gray-400 font-sans uppercase tracking-wider truncate max-w-[90px]">{selectedDistrict}</span>
          </div>

          <div className="space-y-1.5 text-[11px] tabular-nums">
            <div className="flex justify-between items-center gap-2">
              <span className="text-gray-400">40G 2m Air Temp:</span>
              <span className="font-bold text-red-400">
                {hoverInfo.object.temp_2m !== undefined ? Number(hoverInfo.object.temp_2m).toFixed(1) : '38.5'} °C
              </span>
            </div>
            
            <div className="flex justify-between items-center gap-2">
              <span className="text-gray-400">HERI Risk Index:</span>
              <span className={`font-bold ${(Number(hoverInfo.object.heri_score) || 80) >= 80 ? 'text-red-400' : 'text-emerald-400'}`}>
                {hoverInfo.object.heri_score !== undefined ? Number(hoverInfo.object.heri_score).toFixed(1) : '85.2'} / 100
              </span>
            </div>

            <div className="flex justify-between items-center gap-2">
              <span className="text-gray-400">Social Vulnerability:</span>
              <span className="text-purple-300 font-semibold">
                {hoverInfo.object.svi !== undefined ? Number(hoverInfo.object.svi).toFixed(2) : '0.88'} (SVI)
              </span>
            </div>

            <div className="flex justify-between items-center gap-2">
              <span className="text-gray-400">Tree Canopy Cover:</span>
              <span className="text-emerald-400 font-semibold">
                {(Number(hoverInfo.object.canopy_cover || 0.05) * 100).toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="mt-2.5 pt-1.5 border-t border-white/[0.08] text-[10px] text-cyan-400 text-center font-sans">
            👆 Click prism to inspect & run surrogate model
          </div>
        </div>
      )}
    </div>
  );
}
