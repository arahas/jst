'use client';

import { useState, useEffect } from 'react';

interface JurisdictionFormProps {
  onSubmit: (data: {
    delivery_station: string;
    effective_week: string;
    program_type: 'all' | 'core' | 'ssd';
    recursive: boolean;
  }) => void;
}

interface FormData {
  delivery_station: string;
  effective_week: string;
  program_type: 'all' | 'core' | 'ssd';
  recursive: boolean;
}

export default function JurisdictionForm({ onSubmit }: JurisdictionFormProps) {
  // Form state
  const [formData, setFormData] = useState<FormData>({
    delivery_station: '',
    effective_week: '',
    program_type: 'all',
    recursive: false
  });

  // UI state for searchable dropdowns
  const [effectiveWeeks, setEffectiveWeeks] = useState<string[]>([]);
  const [isLoadingWeeks, setIsLoadingWeeks] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtered suggestions state
  const [stationSuggestions, setStationSuggestions] = useState<string[]>([]);
  const [showStationSuggestions, setShowStationSuggestions] = useState(false);

  // Fetch effective weeks on component mount
  useEffect(() => {
    const fetchEffectiveWeeks = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/effective-weeks/`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const weeks = await response.json();
        setEffectiveWeeks(weeks);
        // Set default to earliest week
        if (weeks.length > 0) {
          setFormData(prev => ({ ...prev, effective_week: weeks[0] }));
        }
      } catch (error) {
        console.error('Error fetching effective weeks:', error);
        setError('Failed to load effective weeks. Please try again later.');
      } finally {
        setIsLoadingWeeks(false);
      }
    };

    fetchEffectiveWeeks();
  }, []);

  // Handle delivery station input with search functionality
  const handleStationInput = async (value: string) => {
    setFormData(prev => ({ ...prev, delivery_station: value }));
    setShowStationSuggestions(true);

    try {
      // Call the node endpoint with partial match to get suggestions
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/node/?delivery_station=${value}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      // Extract unique delivery stations from the response
      const stations = new Set<string>();
      if (data.metadata?.delivery_stations) {
        data.metadata.delivery_stations.forEach((station: string) => stations.add(station));
      }
      setStationSuggestions(Array.from(stations));
    } catch (error) {
      console.error('Error fetching station suggestions:', error);
      setStationSuggestions([]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.delivery_station) {
      setError('Please enter a delivery station');
      return;
    }
    setError(null);
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Delivery Station Input with Suggestions */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Delivery Station
        </label>
        <input
          type="text"
          value={formData.delivery_station}
          onChange={(e) => handleStationInput(e.target.value)}
          onFocus={() => setShowStationSuggestions(true)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter delivery station (e.g., DAB5)"
          required
        />
        {showStationSuggestions && stationSuggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
            {stationSuggestions.map((station) => (
              <div
                key={station}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  setFormData(prev => ({ ...prev, delivery_station: station }));
                  setShowStationSuggestions(false);
                }}
              >
                {station}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Effective Week Select */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Effective Week
        </label>
        <select
          value={formData.effective_week}
          onChange={(e) => setFormData(prev => ({ ...prev, effective_week: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoadingWeeks}
        >
          {isLoadingWeeks ? (
            <option>Loading weeks...</option>
          ) : (
            effectiveWeeks.map(week => (
              <option key={week} value={week}>
                {week}
              </option>
            ))
          )}
        </select>
      </div>

      {/* Program Type Select */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Program Type
        </label>
        <select
          value={formData.program_type}
          onChange={(e) => setFormData(prev => ({ 
            ...prev, 
            program_type: e.target.value as 'all' | 'core' | 'ssd'
          }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All</option>
          <option value="core">Core</option>
          <option value="ssd">SSD</option>
        </select>
      </div>

      {/* Recursive Search Checkbox */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="recursive"
          checked={formData.recursive}
          onChange={(e) => setFormData(prev => ({ ...prev, recursive: e.target.checked }))}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="recursive" className="ml-2 block text-sm text-gray-700">
          Include recursive search
        </label>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        disabled={isLoadingWeeks}
      >
        {isLoadingWeeks ? 'Loading...' : 'Submit'}
      </button>
    </form>
  );
} 