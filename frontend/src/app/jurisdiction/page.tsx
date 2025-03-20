'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import JurisdictionForm from '../components/JurisdictionForm';
import JurisdictionSummary from '../components/JurisdictionSummary';

// Dynamically import components that use window object
const JurisdictionMap = dynamic(
  () => import('../components/JurisdictionMap'),
  { ssr: false }
);

const JurisdictionChart = dynamic(
  () => import('../components/JurisdictionChart'),
  { ssr: false }
);

interface JurisdictionData {
  delivery_station: string;
  effective_week: string;
  program_type: string;
  recursive: boolean;
  data?: any;
}

export default function JurisdictionPage() {
  const [jurisdictionData, setJurisdictionData] = useState<JurisdictionData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Group features by delivery station and program type
  const groupedData = useMemo(() => {
    if (!jurisdictionData?.data?.features) return [];

    const groups = new Map<string, {
      node: string;
      program: string;
      isMainStation: boolean;
    }>();

    jurisdictionData.data.features.forEach((feature: any) => {
      const node = feature.properties.delivery_station;
      const program = feature.properties.program_type;
      const key = `${node}-${program}`;
      const isMainStation = node === jurisdictionData.delivery_station;

      if (!groups.has(key)) {
        groups.set(key, { node, program, isMainStation });
      }
    });

    // Convert to array and sort (main station first, then alphabetically)
    return Array.from(groups.values()).sort((a, b) => {
      if (a.isMainStation !== b.isMainStation) {
        return a.isMainStation ? -1 : 1;
      }
      return a.node.localeCompare(b.node);
    });
  }, [jurisdictionData]);

  const handleFormSubmit = async (formData: {
    delivery_station: string;
    effective_week: string;
    program_type: 'all' | 'core' | 'ssd';
    recursive: boolean;
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      // Construct API URL with query parameters
      const apiUrl = new URL('/node/', process.env.NEXT_PUBLIC_API_URL);
      apiUrl.searchParams.append('delivery_station', formData.delivery_station);
      apiUrl.searchParams.append('effective_week', formData.effective_week);
      apiUrl.searchParams.append('program_type', formData.program_type);
      apiUrl.searchParams.append('recursive', formData.recursive.toString());
      apiUrl.searchParams.append('geometry', 'true');
      apiUrl.searchParams.append('population', 'true');

      const response = await fetch(apiUrl.toString());

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      setJurisdictionData({
        ...formData,
        data
      });
    } catch (error) {
      console.error('Error fetching jurisdiction data:', error);
      setError(`Failed to fetch data. Please check if the API server is running at ${process.env.NEXT_PUBLIC_API_URL}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Jurisdiction Viewer</h1>
      <p className="text-gray-600">
        View delivery station jurisdictions and their associated postal codes.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-md">
        <JurisdictionForm onSubmit={handleFormSubmit} />
      </div>

      {/* Display results */}
      {isLoading ? (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-gray-600">Loading jurisdiction data...</div>
        </div>
      ) : jurisdictionData?.data && (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Results</h2>
          
          {/* Jurisdiction Summary Cards */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Jurisdiction Summary</h3>
            <JurisdictionSummary 
              data={jurisdictionData.data} 
              mainStation={jurisdictionData.delivery_station}
            />
          </div>

          {/* Map View */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Geographic Coverage</h3>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <JurisdictionMap 
                data={jurisdictionData.data} 
                mainStation={jurisdictionData.delivery_station}
              />
            </div>
          </div>

          {/* Population Charts */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Population Trends</h3>
            <div className="grid grid-cols-1 gap-6">
              {groupedData.map(({ node, program, isMainStation }) => (
                <JurisdictionChart
                  key={`${node}-${program}`}
                  data={jurisdictionData.data}
                  node={node}
                  program={program}
                  isMainStation={isMainStation}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 