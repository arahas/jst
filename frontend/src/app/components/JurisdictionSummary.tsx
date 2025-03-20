'use client';

import { useMemo } from 'react';

interface JurisdictionSummaryProps {
  data: any; // GeoJSON response from the API
  mainStation: string; // The station that was searched for
}

interface SummaryCard {
  node: string;
  program: string;
  effectiveWeek: string;
  postalCodes: string[];
  population: number;
  isMainStation: boolean;
}

const getProgramBadgeClasses = (program: string) => {
  switch (program.toLowerCase()) {
    case 'core':
      return 'bg-blue-100 text-blue-800';
    case 'ssd':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function JurisdictionSummary({ data, mainStation }: JurisdictionSummaryProps) {
  const summaryCards = useMemo(() => {
    if (!data?.features) return [];

    // Group features by delivery station and program type
    const groupedData = new Map<string, SummaryCard>();

    data.features.forEach((feature: any) => {
      const node = feature.properties.delivery_station;
      const program = feature.properties.program_type;
      const effectiveWeek = feature.properties.effective_week;
      const postalCode = feature.properties.postal_code;
      const isMainStation = node === mainStation;
      
      // Get latest year's population
      let population = 0;
      if (feature.properties.demographics && feature.properties.demographics.length > 0) {
        const latestYear = Math.max(
          ...feature.properties.demographics.map((d: any) => d.year)
        );
        const latestDemographic = feature.properties.demographics.find(
          (d: any) => d.year === latestYear
        );
        population = latestDemographic?.population || 0;
      }

      const key = `${node}-${program}`;
      if (!groupedData.has(key)) {
        groupedData.set(key, {
          node,
          program,
          effectiveWeek,
          postalCodes: [],
          population: 0,
          isMainStation
        });
      }

      const cardData = groupedData.get(key)!;
      cardData.postalCodes.push(postalCode);
      cardData.population += population;
    });

    // Sort cards to show main station first
    return Array.from(groupedData.values()).sort((a, b) => {
      if (a.isMainStation !== b.isMainStation) {
        return a.isMainStation ? -1 : 1;
      }
      return a.node.localeCompare(b.node);
    });
  }, [data, mainStation]);

  if (!summaryCards.length) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-500">
        No jurisdiction data available
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {summaryCards.map((card, index) => (
        <div
          key={`${card.node}-${card.program}`}
          className={`bg-white p-6 rounded-lg shadow-md border transition-shadow ${
            card.isMainStation 
              ? 'border-blue-300 shadow-blue-100' 
              : 'border-gray-200'
          } hover:shadow-lg`}
        >
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-semibold text-gray-900">
                {card.node}
              </h3>
              {card.isMainStation && (
                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs font-medium">
                  Main
                </span>
              )}
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getProgramBadgeClasses(card.program)}`}>
              {card.program.toUpperCase()}
            </span>
          </div>

          <p className="text-sm text-gray-500 mb-4">
            Effective Week: {card.effectiveWeek}
          </p>

          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-500">Coverage Statistics</p>
              <div className="mt-1 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-2xl font-semibold text-gray-900">
                    {card.postalCodes.length}
                  </p>
                  <p className="text-sm text-gray-500">Postal Codes</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold text-gray-900">
                    {card.population.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">Population</p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500 mb-2">Postal Codes</p>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-600 break-words">
                  {card.postalCodes.sort().join(', ')}
                </p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 