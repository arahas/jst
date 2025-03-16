'use client'

import { useState } from 'react'
import LookupForm from '@/components/LookupForm'
import MapComponent from '@/components/MapComponent'
import ChartComponent from '@/components/ChartComponent'
import { ProcessedMapData } from '@/lib/types'

export default function Home() {
  const [mapData, setMapData] = useState<ProcessedMapData | null>(null)

  const handleFormSubmit = (data: ProcessedMapData) => {
    // Create a new object reference to ensure React detects the change
    setMapData({...data})
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-amazon-blue">ZIP Code Lookup</h2>
        <LookupForm onSubmit={handleFormSubmit} />
      </section>

      {mapData && (
        <>
          <section className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4 text-amazon-blue">ZIP Code Map</h2>
            <MapComponent data={mapData} />
          </section>

          <section className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4 text-amazon-blue">Population Charts</h2>
            <div className="grid grid-cols-1 gap-8">
              {mapData.tagGroups.map((group, index) => (
                <div key={`${group.tag}-${index}`} className="border p-4 rounded-lg">
                  <h3 className="text-xl font-semibold mb-4">{group.tag}</h3>
                  <ChartComponent data={group} />
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  )
} 