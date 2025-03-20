'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Polygon, LayerGroup, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { LatLngBounds, LatLngTuple } from 'leaflet';

interface JurisdictionMapProps {
  data: any; // GeoJSON response from the API
  mainStation: string;
}

// Generate distinct colors for different combinations
const generateColor = (node: string, program: string, isMainStation: boolean): string => {
  // Base colors for different program types
  const programColors = {
    core: {
      main: '#3B82F6',    // Blue
      other: '#93C5FD'    // Light Blue
    },
    ssd: {
      main: '#22C55E',    // Green
      other: '#86EFAC'    // Light Green
    },
    all: {
      main: '#6366F1',    // Indigo
      other: '#A5B4FC'    // Light Indigo
    }
  };

  const programType = program.toLowerCase() as keyof typeof programColors;
  return isMainStation ? programColors[programType].main : programColors[programType].other;
};

// Helper function to process coordinates from any geometry type
const processCoordinates = (geometry: any): number[][] => {
  if (!geometry?.coordinates) return [];

  switch (geometry.type) {
    case 'MultiPolygon':
      return geometry.coordinates.flatMap((polygon: number[][][]) => 
        polygon.flatMap((ring: number[][]) => ring)
      );
    case 'Polygon':
      return geometry.coordinates.flatMap((ring: number[][]) => ring);
    default:
      return [];
  }
};

// Helper component to set map bounds
function SetBoundsComponent({ bounds }: { bounds: LatLngBounds }) {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [map, bounds]);
  return null;
}

export default function JurisdictionMap({ data, mainStation }: JurisdictionMapProps) {
  // Group features by delivery station and program type
  const groupedFeatures = useMemo(() => {
    if (!data?.features) return new Map();

    const groups = new Map<string, {
      features: any[];
      isMainStation: boolean;
      program: string;
      node: string;
    }>();

    data.features.forEach((feature: any) => {
      const node = feature.properties.delivery_station;
      const program = feature.properties.program_type;
      const key = `${node}-${program}`;
      const isMainStation = node === mainStation;

      if (!groups.has(key)) {
        groups.set(key, {
          features: [],
          isMainStation,
          program,
          node
        });
      }
      groups.get(key)!.features.push(feature);
    });

    return groups;
  }, [data, mainStation]);

  // Calculate map bounds and center
  const { center, zoom, bounds } = useMemo(() => {
    let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
    let hasValidCoordinates = false;

    if (data?.features) {
      data.features.forEach((feature: any) => {
        const coordinates = processCoordinates(feature.geometry);
        
        coordinates.forEach((coord: number[]) => {
          if (coord && coord.length >= 2) {
            const [lng, lat] = coord;
            if (!isNaN(lat) && !isNaN(lng)) {
              minLat = Math.min(minLat, lat);
              maxLat = Math.max(maxLat, lat);
              minLng = Math.min(minLng, lng);
              maxLng = Math.max(maxLng, lng);
              hasValidCoordinates = true;
            }
          }
        });
      });
    }

    if (!hasValidCoordinates) {
      return {
        center: [39.8283, -98.5795] as LatLngTuple, // USA center
        zoom: 4,
        bounds: null
      };
    }

    const center: LatLngTuple = [(minLat + maxLat) / 2, (minLng + maxLng) / 2];
    const bounds = new LatLngBounds(
      [minLat, minLng],
      [maxLat, maxLng]
    );

    const latDiff = maxLat - minLat;
    const lngDiff = maxLng - minLng;
    const maxDiff = Math.max(latDiff, lngDiff);
    const zoom = Math.floor(14 - Math.log2(maxDiff * 10));

    return { center, zoom: Math.min(Math.max(zoom, 4), 18), bounds };
  }, [data]);

  // Track visible layers
  const [visibleLayers, setVisibleLayers] = useState<Set<string>>(
    new Set(Array.from(groupedFeatures.keys()))
  );

  const toggleLayer = (key: string) => {
    setVisibleLayers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  return (
    <div className="relative h-[600px] w-full">
      <MapContainer
        center={center}
        zoom={zoom}
        className="h-full w-full"
      >
        {bounds && <SetBoundsComponent bounds={bounds} />}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {Array.from(groupedFeatures.entries()).map(([key, group]) => (
          visibleLayers.has(key) && (
            <LayerGroup key={key}>
              {group.features.map((feature: any, featureIndex: number) => {
                if (!feature.geometry?.coordinates) return null;

                const coordinates = feature.geometry.type === 'MultiPolygon'
                  ? feature.geometry.coordinates.map((poly: number[][][]) =>
                      poly[0].map(([lng, lat]: number[]) => [lat, lng] as LatLngTuple)
                    )
                  : [feature.geometry.coordinates[0].map(([lng, lat]: number[]) => 
                      [lat, lng] as LatLngTuple
                    )];

                return coordinates.map((coords: LatLngTuple[], polyIndex: number) => (
                  <Polygon
                    key={`${featureIndex}-${polyIndex}`}
                    positions={coords}
                    pathOptions={{
                      color: 'white',
                      weight: 1,
                      fillColor: generateColor(group.node, group.program, group.isMainStation),
                      fillOpacity: 0.6
                    }}
                  >
                    <Tooltip sticky>
                      <div className="font-medium">
                        {feature.properties.postal_code}
                        <br />
                        {group.node} - {group.program}
                      </div>
                    </Tooltip>
                  </Polygon>
                ));
              })}
            </LayerGroup>
          )
        ))}
      </MapContainer>

      {/* Legend */}
      <div className="absolute top-4 right-4 bg-white p-4 rounded-lg shadow-md z-[1000] max-h-[calc(100%-2rem)] overflow-y-auto">
        <h4 className="font-semibold mb-3">Jurisdictions</h4>
        <div className="space-y-4">
          {Array.from(groupedFeatures.entries()).map(([key, group]) => (
            <div
              key={key}
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => toggleLayer(key)}
            >
              <div
                className="w-4 h-4 rounded"
                style={{
                  backgroundColor: generateColor(group.node, group.program, group.isMainStation),
                  opacity: visibleLayers.has(key) ? 1 : 0.3
                }}
              />
              <div className={visibleLayers.has(key) ? 'font-medium' : 'text-gray-400'}>
                <span>{group.node}</span>
                <span className="mx-1">-</span>
                <span className="uppercase">{group.program}</span>
                {group.isMainStation && (
                  <span className="ml-2 text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
                    Main
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 