'use client'

import { useState, useEffect } from 'react'
import { fetchNodeCoverage, fetchEffectiveWeeks } from '@/lib/api'
import { ProcessedMapData, TagGroup, GeoJsonFeature } from '@/lib/types'

interface JurisdictionFormProps {
  onSubmit: (data: ProcessedMapData, summary: any) => void
}

export default function JurisdictionForm({ onSubmit }: JurisdictionFormProps) {
  const [deliveryStation, setDeliveryStation] = useState('')
  const [effectiveWeek, setEffectiveWeek] = useState('')
  const [programType, setProgramType] = useState('all')
  const [recursive, setRecursive] = useState(false)
  const [availableWeeks, setAvailableWeeks] = useState<string[]>([])
  const [stationSuggestions, setStationSuggestions] = useState<string[]>([])
  const [showStationSuggestions, setShowStationSuggestions] = useState(false)
  const [showWeekSuggestions, setShowWeekSuggestions] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastSubmittedData, setLastSubmittedData] = useState<string | null>(null)

  // Mock data for station suggestions - in a real app, this would come from an API
  const mockStations = [
    'DAB1', 'DAB2', 'DAB3', 'DAB4', 'DAB5',
    'SEA1', 'SEA2', 'SEA3', 'SEA4', 'SEA5',
    'NYC1', 'NYC2', 'NYC3', 'NYC4', 'NYC5',
    'LAX1', 'LAX2', 'LAX3', 'LAX4', 'LAX5'
  ]

  // Fallback mock data for effective weeks
  const mockWeeks = [
    '2023-01', '2023-02', '2023-03', '2023-04', '2023-05',
    '2023-06', '2023-07', '2023-08', '2023-09', '2023-10',
    '2023-11', '2023-12', '2023-13', '2023-14', '2023-15',
    '2023-16', '2023-17', '2023-18', '2023-19', '2023-20'
  ]

  useEffect(() => {
    // Fetch available effective weeks from API
    const fetchWeeks = async () => {
      try {
        const weeks = await fetchEffectiveWeeks();
        if (weeks && weeks.length > 0) {
          setAvailableWeeks(weeks);
          // Set default effective week to the earliest available
          setEffectiveWeek(weeks[0]);
        } else {
          // Fallback to mock data if API returns empty
          setAvailableWeeks(mockWeeks);
          setEffectiveWeek(mockWeeks[0]);
        }
      } catch (error) {
        console.error('Error fetching effective weeks:', error);
        // Fallback to mock data if API fails
        setAvailableWeeks(mockWeeks);
        setEffectiveWeek(mockWeeks[0]);
      }
    };
    
    fetchWeeks();
  }, []);

  useEffect(() => {
    // Filter station suggestions based on input
    if (deliveryStation.trim() === '') {
      setStationSuggestions([])
    } else {
      const filteredStations = mockStations.filter(station => 
        station.toLowerCase().includes(deliveryStation.toLowerCase())
      )
      setStationSuggestions(filteredStations)
    }
  }, [deliveryStation])

  const handleDeliveryStationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDeliveryStation(e.target.value)
    setShowStationSuggestions(true)
  }

  const handleStationSelect = (station: string) => {
    setDeliveryStation(station)
    setShowStationSuggestions(false)
  }

  const handleEffectiveWeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEffectiveWeek(e.target.value)
    setShowWeekSuggestions(true)
  }

  const handleWeekSelect = (week: string) => {
    setEffectiveWeek(week)
    setShowWeekSuggestions(false)
  }

  const handleProgramTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setProgramType(e.target.value)
  }

  const handleRecursiveChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRecursive(e.target.checked)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    
    try {
      if (!deliveryStation.trim()) {
        throw new Error('Please enter a delivery station')
      }
      
      // Create a string representation of the current form data to check for changes
      const currentDataString = JSON.stringify({ deliveryStation, effectiveWeek, programType, recursive })
      
      // Skip API call if the data hasn't changed
      if (currentDataString === lastSubmittedData) {
        setIsLoading(false)
        return
      }
      
      // Fetch data from API
      const response = await fetchNodeCoverage({
        delivery_station: deliveryStation,
        effective_week: effectiveWeek || undefined,
        program_type: programType === 'all' ? undefined : programType,
        geometry: true,
        population: true,
        recursive: recursive
      })
      
      console.log("API Response:", response);
      
      // Create a map of station-program combinations
      const stationProgramMap = new Map<string, GeoJsonFeature[]>()
      
      // Process each feature to organize by station-program combination
      response.features.forEach((feature: GeoJsonFeature) => {
        const station = feature.properties.delivery_station || 'unknown'
        const program = feature.properties.program_type || 'unknown'
        const key = `${station}:${program}`
        
        if (!stationProgramMap.has(key)) {
          stationProgramMap.set(key, [])
        }
        
        stationProgramMap.get(key)?.push(feature)
      })
      
      console.log("Station-Program Combinations:", Array.from(stationProgramMap.keys()));
      
      // Create tag groups for each station-program combination
      const tagGroups: TagGroup[] = []
      
      stationProgramMap.forEach((features, key) => {
        const [station, program] = key.split(':')
        const postalCodes = features.map(feature => feature.properties.postal_code)
        
        // Check if this is the main station (the one the user searched for)
        const isMainStation = station.toLowerCase().includes(deliveryStation.toLowerCase())
        
        tagGroups.push({
          tag: `${station} - ${program.toUpperCase()}`,
          features,
          postalCodes,
          isStation: true,
          stationName: station,
          programType: program
        })
      })
      
      // Sort tag groups to put main station combinations first
      tagGroups.sort((a, b) => {
        const aIsMain = a.stationName?.toLowerCase().includes(deliveryStation.toLowerCase()) ? 1 : 0
        const bIsMain = b.stationName?.toLowerCase().includes(deliveryStation.toLowerCase()) ? 1 : 0
        return bIsMain - aIsMain // Main stations first
      })
      
      // If program_type is 'all', add a tag group for all features
      if (programType === 'all' && tagGroups.length > 1) {
        const allPostalCodes = response.features.map((feature: any) => feature.properties.postal_code)
        
        tagGroups.unshift({
          tag: 'All Combinations',
          features: response.features,
          postalCodes: allPostalCodes
        })
      }
      
      // Create summary data for each station-program combination
      const summaryData: Record<string, any> = {}
      
      tagGroups.forEach(group => {
        if (group.tag === 'All Combinations') return // Skip the "All Combinations" group for summary
        
        // Calculate total population from the latest year for each postal code
        let totalPopulation = 0
        const postalCodeSet = new Set<string>()
        
        const features = group.features || []
        features.forEach((feature: GeoJsonFeature) => {
          postalCodeSet.add(feature.properties.postal_code)
          
          const demographics = feature.properties.demographics || []
          if (demographics.length > 0) {
            // Find the latest year's population
            const latestDemographic = demographics.reduce((latest, current) => {
              return latest.year > current.year ? latest : current
            }, { year: 0, population: 0 })
            
            totalPopulation += latestDemographic.population || 0
          }
        })
        
        // Determine if this is the main station
        const isMainStation = group.stationName ? group.stationName.toLowerCase().includes(deliveryStation.toLowerCase()) : false
        
        summaryData[group.tag] = {
          node: group.stationName || 'unknown',
          program: group.programType || 'unknown',
          effectiveWeek,
          postalCodeCount: postalCodeSet.size,
          population: totalPopulation,
          postalCodes: Array.from(postalCodeSet),
          isMainStation: isMainStation,
          recursive: recursive
        }
      })
      
      console.log("Summary Data:", summaryData);
      
      // Create processed data for the map and charts
      const processedData: ProcessedMapData = {
        geoJson: response,
        tagGroups
      }
      
      // Save the current data string to avoid unnecessary API calls
      setLastSubmittedData(currentDataString)
      
      onSubmit(processedData, summaryData)
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching data')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Delivery Station Input */}
        <div className="relative">
          <label htmlFor="delivery-station" className="block text-sm font-medium text-gray-700 mb-1">
            Delivery Station
          </label>
          <input
            type="text"
            id="delivery-station"
            value={deliveryStation}
            onChange={handleDeliveryStationChange}
            onFocus={() => setShowStationSuggestions(true)}
            onBlur={() => setTimeout(() => setShowStationSuggestions(false), 200)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-amazon-blue focus:border-amazon-blue"
            placeholder="e.g. DAB5"
            required
          />
          {showStationSuggestions && stationSuggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
              {stationSuggestions.map((station, index) => (
                <div
                  key={index}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleStationSelect(station)}
                >
                  {station}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Effective Week Input */}
        <div className="relative">
          <label htmlFor="effective-week" className="block text-sm font-medium text-gray-700 mb-1">
            Effective Week
          </label>
          <input
            type="text"
            id="effective-week"
            value={effectiveWeek}
            onChange={handleEffectiveWeekChange}
            onFocus={() => setShowWeekSuggestions(true)}
            onBlur={() => setTimeout(() => setShowWeekSuggestions(false), 200)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-amazon-blue focus:border-amazon-blue"
            placeholder="e.g. 2023-01"
          />
          {showWeekSuggestions && availableWeeks.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
              {availableWeeks
                .filter(week => week.toLowerCase().includes(effectiveWeek.toLowerCase()))
                .map((week, index) => (
                  <div
                    key={index}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => handleWeekSelect(week)}
                  >
                    {week}
                  </div>
                ))}
            </div>
          )}
        </div>
        
        {/* Program Type Select */}
        <div>
          <label htmlFor="program-type" className="block text-sm font-medium text-gray-700 mb-1">
            Program Type
          </label>
          <select
            id="program-type"
            value={programType}
            onChange={handleProgramTypeChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-amazon-blue focus:border-amazon-blue"
          >
            <option value="all">All Programs</option>
            <option value="core">Core</option>
            <option value="ssd">SSD</option>
          </select>
        </div>
      </div>
      
      {/* Recursive Option */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="recursive"
          checked={recursive}
          onChange={handleRecursiveChange}
          className="h-4 w-4 text-amazon-blue focus:ring-amazon-blue border-gray-300 rounded"
        />
        <label htmlFor="recursive" className="ml-2 block text-sm text-gray-700">
          Include all delivery stations covering the same postal codes (Recursive Search)
        </label>
      </div>
      
      <div>
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amazon-blue hover:bg-amazon-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amazon-blue ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {isLoading ? 'Loading...' : 'View Jurisdiction'}
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