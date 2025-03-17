'use client'

import { ProcessedMapData, GeoJsonFeature } from '@/lib/types'
import dynamic from 'next/dynamic'

// Dynamically import Leaflet components with no SSR
const MapWithNoSSR = dynamic(
  () => import('./LeafletMap'),
  { 
    ssr: false,
    loading: () => (
      <div className="h-[600px] w-full rounded-lg overflow-hidden border border-gray-300 bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">Loading map...</div>
      </div>
    )
  }
)

interface MapComponentProps {
  data: ProcessedMapData
}

export default function MapComponent({ data }: MapComponentProps) {
  if (!data || !data.tagGroups || data.tagGroups.length === 0) {
    return <div className="p-4 bg-gray-100 rounded-md">No data available to display</div>
  }
  
  // Extract all features for initial bounds
  const allFeatures = data.tagGroups
    .flatMap(group => group.features || [])
    .filter(feature => feature !== undefined) as GeoJsonFeature[]
  
  return (
    <div className="h-[600px] w-full rounded-lg overflow-hidden border border-gray-300">
      <MapWithNoSSR data={data} allFeatures={allFeatures} />
    </div>
  )
} 