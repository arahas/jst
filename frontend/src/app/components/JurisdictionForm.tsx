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

interface ValidationErrors {
  delivery_station?: string;
}

export default function JurisdictionForm({ onSubmit }: JurisdictionFormProps) {
  // Form state
  const [formData, setFormData] = useState<FormData>({
    delivery_station: '',
    effective_week: '',
    program_type: 'all',
    recursive: false
  });

  // Validation state
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isDirty, setIsDirty] = useState(false);

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

  // Validate delivery station
  const validateDeliveryStation = (value: string): string | undefined => {
    if (!value) {
      return 'Delivery station is required';
    }
    
    // Check for exactly 4 characters: 3 letters followed by 1 number
    const stationPattern = /^[A-Za-z]{3}[0-9]$/;
    if (!stationPattern.test(value)) {
      return 'Delivery station must be 3 letters followed by 1 number (e.g., DNK5)';
    }
    
    return undefined;
  };

  // Handle delivery station input with validation
  const handleStationInput = (value: string) => {
    // Convert to uppercase as station codes are typically uppercase
    const upperValue = value.toUpperCase();
    setFormData(prev => ({ ...prev, delivery_station: upperValue }));
    setIsDirty(true);

    // Validate and set errors
    const error = validateDeliveryStation(upperValue);
    setErrors(prev => ({ ...prev, delivery_station: error }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDirty(true);

    // Validate before submission
    const stationError = validateDeliveryStation(formData.delivery_station);
    if (stationError) {
      setErrors({ delivery_station: stationError });
      return;
    }

    setErrors({});
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Delivery Station Input */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Delivery Station
        </label>
        <div className="relative">
          <input
            type="text"
            value={formData.delivery_station}
            onChange={(e) => handleStationInput(e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
              isDirty && errors.delivery_station
                ? 'border-red-300 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
            placeholder="Enter delivery station (e.g., DNK5)"
            maxLength={4}
            required
          />
          {formData.delivery_station && !errors.delivery_station && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </div>
        {isDirty && errors.delivery_station && (
          <p className="mt-1 text-sm text-red-600">
            {errors.delivery_station}
          </p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Format: 3 letters followed by 1 number (e.g., DNK5, DWA2)
        </p>
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
        className={`w-full px-4 py-2 text-white font-medium rounded-md 
          ${isDirty && errors.delivery_station
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700'
          }`}
        disabled={isDirty && !!errors.delivery_station}
      >
        Search
      </button>
    </form>
  );
} 