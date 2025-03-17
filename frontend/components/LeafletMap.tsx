'use client'

import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, GeoJSON, LayersControl, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { ProcessedMapData, GeoJsonFeature, TagGroup } from '@/lib/types'

// Generate a color based on a string (tag name)
const stringToColor = (str: string) => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  let color = '#'
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF
    color += ('00' + value.toString(16)).substr(-2)
  }
  return color
}

// Component to fit map bounds to GeoJSON data
function FitBounds({ features }: { features: GeoJsonFeature[] }) {
  const map = useMap()
  
  useEffect(() => {
    if (features && features.length > 0) {
      try {
        const geoJsonLayer = L.geoJSON(features as any)
        const bounds = geoJsonLayer.getBounds()
        map.fitBounds(bounds, { padding: [50, 50] })
      } catch (error) {
        console.error('Error fitting bounds:', error)
      }
    }
  }, [features, map])
  
  return null
}

// Custom Legend component
function Legend({ tagGroups }: { tagGroups: TagGroup[] }) {
  return (
    <div className="leaflet-bottom leaflet-right" style={{ zIndex: 1000 }}>
      <div className="leaflet-control leaflet-bar bg-white p-3 rounded-md shadow-md" style={{ margin: '10px' }}>
        <h4 className="font-bold mb-2 text-sm">Legend</h4>
        <div className="space-y-2">
          {tagGroups.map((group, index) => {
            const color = stringToColor(group.tag)
            
            return (
              <div key={index} className="flex items-center">
                <div 
                  className="w-5 h-5 mr-2 border border-black" 
                  style={{ backgroundColor: color, opacity: 0.5 }}
                ></div>
                <span className="text-xs">{group.tag} ({group.postalCodes.length})</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

interface LeafletMapProps {
  data: ProcessedMapData;
  allFeatures: GeoJsonFeature[];
}

export default function LeafletMap({ data, allFeatures }: LeafletMapProps) {
  const [mapKey, setMapKey] = useState(Date.now())
  
  // Set default center and zoom
  const defaultCenter: [number, number] = [39.8283, -98.5795] // Center of US
  const defaultZoom = 4
  
  // Fix Leaflet icon issue
  useEffect(() => {
    // Fix Leaflet default icon issue
    delete (L.Icon.Default.prototype as any)._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    })
  }, [])
  
  // Update map when data changes
  useEffect(() => {
    setMapKey(Date.now())
  }, [data])
  
  if (!data || !data.tagGroups || data.tagGroups.length === 0) {
    return <div className="p-4 bg-gray-100 rounded-md">No data available to display</div>
  }
  
  return (
    <MapContainer
      key={mapKey}
      center={defaultCenter}
      zoom={defaultZoom}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <FitBounds features={allFeatures} />
      
      {/* Add the Legend component */}
      <Legend tagGroups={data.tagGroups} />
      
      <LayersControl position="topright">
        {data.tagGroups.map((group, index) => {
          const color = stringToColor(group.tag)
          const groupFeatures = group.features || []
          
          if (groupFeatures.length === 0) return null
          
          return (
            <LayersControl.Overlay 
              key={index} 
              name={`${group.tag} (${group.postalCodes.length} postal codes)`}
              checked={true}
            >
              <GeoJSON
                data={groupFeatures as any}
                style={() => ({
                  color: '#000000', // Black border color
                  weight: 1.5, // Slightly thinner border for better visibility
                  opacity: 1, // Full opacity for borders
                  fillColor: color, // Fill color based on tag
                  fillOpacity: 0.5 // Slightly higher fill opacity
                })}
                onEachFeature={(feature, layer) => {
                  const props = feature.properties
                  
                  // Create a more detailed popup based on available properties
                  let popupContent = `
                    <div class="p-2">
                      <h3 class="font-bold text-lg border-b pb-1 mb-2">${props.postal_code}</h3>
                      <div class="space-y-1">
                  `;
                  
                  // Add station-program combination
                  if (props.delivery_station && props.program_type) {
                    const isMainStation = props.is_main_station ? 
                      '<span class="bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded-full ml-1">Main</span>' : '';
                    popupContent += `
                      <p><span class="font-semibold">Station:</span> ${props.delivery_station} ${isMainStation}</p>
                      <p><span class="font-semibold">Program:</span> ${props.program_type.toUpperCase()}</p>
                    `;
                  }
                  
                  // Add coordinates
                  popupContent += `
                    <p><span class="font-semibold">Coordinates:</span> ${props.lat}, ${props.long}</p>
                  `;
                  
                  // Add population if available
                  if (props.demographics && props.demographics.length > 0) {
                    const latestDemographic = props.demographics.reduce((latest: {year: number, population: number}, current: {year: number, population: number}) => {
                      return latest.year > current.year ? latest : current;
                    }, { year: 0, population: 0 });
                    
                    popupContent += `
                      <p><span class="font-semibold">Population (${latestDemographic.year}):</span> ${latestDemographic.population.toLocaleString()}</p>
                    `;
                  }
                  
                  // Close the popup content
                  popupContent += `
                      </div>
                    </div>
                  `;
                  
                  layer.bindPopup(popupContent);
                }}
              />
            </LayersControl.Overlay>
          )
        })}
      </LayersControl>
    </MapContainer>
  )
} 