'use client'

import { useState, useEffect } from 'react'
import { fetchNodeReverseCoverage } from '@/lib/api'
import { ProcessedMapData, TagGroup } from '@/lib/types'

interface FormRow {
  id: string
  tag: string
  postalCodes: string
}

interface LookupFormProps {
  onSubmit: (data: ProcessedMapData) => void
}

export default function LookupForm({ onSubmit }: LookupFormProps) {
  const [rows, setRows] = useState<FormRow[]>([
    { id: '1', tag: '', postalCodes: '' }
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastSubmittedData, setLastSubmittedData] = useState<string | null>(null)

  const addRow = () => {
    setRows([...rows, { id: Date.now().toString(), tag: '', postalCodes: '' }])
  }

  const removeRow = (id: string) => {
    if (rows.length > 1) {
      setRows(rows.filter(row => row.id !== id))
    }
  }

  const updateRow = (id: string, field: keyof FormRow, value: string) => {
    setRows(rows.map(row => 
      row.id === id ? { ...row, [field]: value } : row
    ))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    
    try {
      // Group postal codes by tag
      const tagGroups = rows.reduce((acc: TagGroup[], row) => {
        if (!row.tag || !row.postalCodes.trim()) return acc
        
        // Parse postal codes from input (handle both comma and space separated)
        const postalCodesArray = row.postalCodes
          .split(/[\s,]+/)
          .map(code => code.trim())
          .filter(Boolean)
        
        if (postalCodesArray.length === 0) return acc
        
        return [...acc, {
          tag: row.tag,
          postalCodes: postalCodesArray
        }]
      }, [])
      
      if (tagGroups.length === 0) {
        throw new Error('Please enter at least one tag with postal codes')
      }
      
      // Create a string representation of the current form data to check for changes
      const currentDataString = JSON.stringify(tagGroups)
      
      // Skip API call if the data hasn't changed
      if (currentDataString === lastSubmittedData) {
        setIsLoading(false)
        return
      }
      
      // Fetch data for all postal codes
      const allPostalCodes = tagGroups.flatMap(group => group.postalCodes)
      
      const response = await fetchNodeReverseCoverage({
        postal_codes: allPostalCodes,
        geometry: true,
        population: true
      })
      
      // Process the response to organize by tags
      const processedData: ProcessedMapData = {
        geoJson: response,
        tagGroups: tagGroups.map(group => {
          const features = response.features.filter((feature: any) => 
            group.postalCodes.includes(feature.properties.postal_code)
          )
          
          return {
            tag: group.tag,
            features,
            postalCodes: group.postalCodes
          }
        })
      }
      
      // Save the current data string to avoid unnecessary API calls
      setLastSubmittedData(currentDataString)
      
      onSubmit(processedData)
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching data')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {rows.map((row) => (
        <div key={row.id} className="flex flex-wrap gap-4 items-start">
          <div className="w-full md:w-1/4">
            <label htmlFor={`tag-${row.id}`} className="block text-sm font-medium text-gray-700 mb-1">
              Tag
            </label>
            <input
              type="text"
              id={`tag-${row.id}`}
              value={row.tag}
              onChange={(e) => updateRow(row.id, 'tag', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-amazon-blue focus:border-amazon-blue"
              placeholder="e.g. DAB5"
              required
            />
          </div>
          
          <div className="w-full md:w-2/3">
            <label htmlFor={`postal-codes-${row.id}`} className="block text-sm font-medium text-gray-700 mb-1">
              Postal Codes
            </label>
            <input
              type="text"
              id={`postal-codes-${row.id}`}
              value={row.postalCodes}
              onChange={(e) => updateRow(row.id, 'postalCodes', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-amazon-blue focus:border-amazon-blue"
              placeholder="e.g. 98004 98005 98006 or 98004, 98005, 98006"
              required
            />
          </div>
          
          <div className="flex items-end pb-1">
            <button
              type="button"
              onClick={() => removeRow(row.id)}
              className="p-2 text-red-600 hover:text-red-800 disabled:opacity-50"
              disabled={rows.length <= 1}
              aria-label="Remove row"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      ))}
      
      <div className="flex gap-4">
        <button
          type="button"
          onClick={addRow}
          className="flex items-center px-4 py-2 bg-amazon-blue text-white rounded-md hover:bg-amazon-lightblue focus:outline-none focus:ring-2 focus:ring-amazon-yellow"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add Row
        </button>
        
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-amazon-yellow text-amazon-blue font-medium rounded-md hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-amazon-yellow disabled:opacity-50"
        >
          {isLoading ? 'Loading...' : 'Submit'}
        </button>
      </div>
      
      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
    </form>
  )
} 