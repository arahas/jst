'use client'

import { useState } from 'react'
import JurisdictionForm from '@/components/JurisdictionForm'
import JurisdictionSummary from '@/components/JurisdictionSummary'
import MapComponent from '@/components/MapComponent'
import ChartComponent from '@/components/ChartComponent'
import { ProcessedMapData } from '@/lib/types'

export default function JurisdictionViewer() {
  const [jurisdictionData, setJurisdictionData] = useState<ProcessedMapData | null>(null)
  const [summaryData, setSummaryData] = useState<any>(null)

  const handleFormSubmit = (data: ProcessedMapData, summary: any) => {
    setJurisdictionData({...data})
    setSummaryData(summary)
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-amazon-blue">Jurisdiction Viewer</h2>
        <JurisdictionForm onSubmit={handleFormSubmit} />
      </section>

      {summaryData && (
        <section className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4 text-amazon-blue">Jurisdiction Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.keys(summaryData).map((programType) => (
              <JurisdictionSummary 
                key={programType} 
                data={summaryData[programType]} 
              />
            ))}
          </div>
        </section>
      )}

      {jurisdictionData && (
        <>
          <section className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4 text-amazon-blue">Jurisdiction Map</h2>
            <MapComponent data={jurisdictionData} />
          </section>

          <section className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4 text-amazon-blue">Population Charts</h2>
            <div className="grid grid-cols-1 gap-8">
              {jurisdictionData.tagGroups.map((group, index) => (
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