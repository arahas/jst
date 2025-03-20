'use client';

import { useState } from 'react';
import LookupForm from '../components/LookupForm';

interface PostalCodeEntry {
  tag: string;
  postalCodes: string;
}

interface LookupData {
  [tag: string]: {
    postalCodes: string[];
    data?: any; // Will be populated with API response
  };
}

export default function LookupPage() {
  const [lookupData, setLookupData] = useState<LookupData>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFormSubmit = async (entries: PostalCodeEntry[]) => {
    setIsLoading(true);
    setError(null);
    const newLookupData: LookupData = {};
    
    // Process each entry and make API calls
    for (const entry of entries) {
      const postalCodes = entry.postalCodes.split(',');
      
      try {
        // Make API call using environment variable
        const apiUrl = new URL('/zip-codes/', process.env.NEXT_PUBLIC_API_URL);
        apiUrl.searchParams.append('postal_codes', entry.postalCodes);
        apiUrl.searchParams.append('include_demographics', 'true');
        
        const response = await fetch(apiUrl.toString());
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Store the results
        newLookupData[entry.tag] = {
          postalCodes,
          data
        };
      } catch (error) {
        console.error(`Error fetching data for ${entry.tag}:`, error);
        setError(`Failed to fetch data for tag "${entry.tag}". Please check if the API server is running at ${process.env.NEXT_PUBLIC_API_URL}`);
        // Store the postal codes even if the API call failed
        newLookupData[entry.tag] = {
          postalCodes
        };
      }
    }
    
    // Update state with new data
    setLookupData(newLookupData);
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">ZIP Code Lookup</h1>
      <p className="text-gray-600">
        Search for ZIP codes to view their boundaries and demographic information.
      </p>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <LookupForm onSubmit={handleFormSubmit} />
      </div>
      
      {/* Display results */}
      {Object.entries(lookupData).length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Results</h2>
          {isLoading ? (
            <div className="text-gray-600">Loading...</div>
          ) : (
            Object.entries(lookupData).map(([tag, { postalCodes, data }]) => (
              <div key={tag} className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-2">{tag}</h3>
                <p className="text-gray-600 mb-4">
                  Postal Codes: {postalCodes.join(', ')}
                </p>
                {data ? (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500">
                      Data loaded successfully. Render your visualization components here.
                    </p>
                  </div>
                ) : (
                  <p className="text-red-600">Error loading data for this entry</p>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
} 