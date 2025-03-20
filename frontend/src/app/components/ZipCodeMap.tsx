'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Polygon, LayerGroup, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { LatLngBounds, LatLngTuple, Map as LeafletMap } from 'leaflet';

interface ZipCodeMapProps {
  lookupData: {
    [tag: string]: {
      postalCodes: string[];
      data?: any;
    };
  };
}

// Generate distinct colors for different tags
const generateColor = (index: number): string => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD',
    '#D4A5A5', '#9B59B6', '#3498DB', '#E67E22', '#2ECC71'
  ];
  return colors[index % colors.length];
};

// Helper function to process coordinates from any geometry type
const processCoordinates = (geometry: any): number[][] => {
  if (!geometry?.coordinates) return [];

  switch (geometry.type) {
    case 'MultiPolygon':
      // MultiPolygon: coordinates is an array of Polygon coordinate arrays
      return geometry.coordinates.flatMap((polygon: number[][][]) => 
        // Each polygon has an array of linear rings (first is exterior, rest are holes)
        polygon.flatMap((ring: number[][]) => ring)
      );
    case 'Polygon':
      // Polygon: coordinates is an array of linear rings (first is exterior, rest are holes)
      return geometry.coordinates.flatMap((ring: number[][]) => ring);
    default:
      return [];
  }
};

export default function ZipCodeMap({ lookupData }: ZipCodeMapProps) {
  const [visibleTags, setVisibleTags] = useState<Set<string>>(new Set(Object.keys(lookupData)));
  
  // Calculate map bounds and center based on all postal codes
  const { center, zoom, bounds } = useMemo(() => {
    let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
    let hasValidCoordinates = false;

    Object.values(lookupData).forEach(({ data }) => {
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
    });

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

    // Calculate zoom level based on bounds
    const latDiff = maxLat - minLat;
    const lngDiff = maxLng - minLng;
    const maxDiff = Math.max(latDiff, lngDiff);
    const zoom = Math.floor(14 - Math.log2(maxDiff * 10));

    return { center, zoom: Math.min(Math.max(zoom, 4), 18), bounds };
  }, [lookupData]);

  const toggleTag = (tag: string) => {
    setVisibleTags(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tag)) {
        newSet.delete(tag);
      } else {
        newSet.add(tag);
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
        {bounds && (
          <SetBoundsComponent bounds={bounds} />
        )}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {Object.entries(lookupData).map(([tag, { data }], index) => (
          data?.features && visibleTags.has(tag) && (
            <LayerGroup key={tag}>
              {data.features.map((feature: any, featureIndex: number) => {
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
                      color: 'black',
                      weight: 1,
                      fillColor: generateColor(index),
                      fillOpacity: 0.4
                    }}
                  >
                    <Tooltip sticky>
                      {feature.properties.postal_code}
                    </Tooltip>
                  </Polygon>
                ));
              })}
            </LayerGroup>
          )
        ))}
      </MapContainer>

      {/* Legend */}
      <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-md z-[1000]">
        <h4 className="font-semibold mb-2">Tags</h4>
        <div className="space-y-2">
          {Object.keys(lookupData).map((tag, index) => (
            <div
              key={tag}
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => toggleTag(tag)}
            >
              <div
                className="w-4 h-4 rounded"
                style={{
                  backgroundColor: generateColor(index),
                  opacity: visibleTags.has(tag) ? 1 : 0.3
                }}
              />
              <span className={visibleTags.has(tag) ? 'font-medium' : 'text-gray-400'}>
                {tag}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Helper component to set map bounds
function SetBoundsComponent({ bounds }: { bounds: LatLngBounds }) {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [map, bounds]);
  return null;
} 