'use client'

import { useState } from 'react'

interface JurisdictionSummaryProps {
  data: {
    node: string
    program: string
    effectiveWeek: string
    postalCodeCount: number
    population: number
    postalCodes: string[]
  }
}

export default function JurisdictionSummary({ data }: JurisdictionSummaryProps) {
  const [showAllPostalCodes, setShowAllPostalCodes] = useState(false)
  
  // Format population with commas
  const formattedPopulation = data.population.toLocaleString()
  
  // Limit postal codes display
  const displayLimit = 5
  const hasMorePostalCodes = data.postalCodes.length > displayLimit
  const displayedPostalCodes = showAllPostalCodes 
    ? data.postalCodes 
    : data.postalCodes.slice(0, displayLimit)
  
  // Determine card color based on program type
  const getProgramColor = (program: string) => {
    switch (program.toLowerCase()) {
      case 'core':
        return 'border-blue-500 bg-blue-50'
      case 'ssd':
        return 'border-green-500 bg-green-50'
      default:
        return 'border-gray-500 bg-gray-50'
    }
  }
  
  const cardColor = getProgramColor(data.program)
  
  return (
    <div className={`rounded-lg border-l-4 ${cardColor} p-5 shadow-md`}>
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-bold">{data.program.toUpperCase()} Program</h3>
      </div>
      
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="text-sm text-gray-600">Node:</div>
          <div className="text-sm font-medium">{data.node}</div>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div className="text-sm text-gray-600">Effective Week:</div>
          <div className="text-sm font-medium">{data.effectiveWeek}</div>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div className="text-sm text-gray-600">Postal Code Count:</div>
          <div className="text-sm font-medium">{data.postalCodeCount}</div>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div className="text-sm text-gray-600">Jurisdiction Population:</div>
          <div className="text-sm font-medium">{formattedPopulation}</div>
        </div>
        
        <div>
          <div className="text-sm text-gray-600 mb-1">Postal Codes:</div>
          <div className="text-sm bg-white p-2 rounded border border-gray-200 max-h-32 overflow-y-auto">
            {displayedPostalCodes.map((code, index) => (
              <span key={index} className="inline-block bg-gray-100 rounded px-2 py-1 text-xs mr-1 mb-1">
                {code}
              </span>
            ))}
            {hasMorePostalCodes && !showAllPostalCodes && (
              <button
                onClick={() => setShowAllPostalCodes(true)}
                className="inline-block text-amazon-blue hover:underline text-xs ml-1"
              >
                +{data.postalCodes.length - displayLimit} more
              </button>
            )}
            {showAllPostalCodes && (
              <button
                onClick={() => setShowAllPostalCodes(false)}
                className="block text-amazon-blue hover:underline text-xs mt-1"
              >
                Show less
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 