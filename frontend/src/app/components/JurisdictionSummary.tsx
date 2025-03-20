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
      return 'bg-[#eaf4fe] text-[#0066c0]';
    case 'ssd':
      return 'bg-[#f1f8f1] text-[#007600]';
    default:
      return 'bg-[#f5f5f5] text-[#232F3F]';
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
      <div className="amazon-card text-center text-[#232F3F]">
        No jurisdiction data available
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {summaryCards.map((card, index) => (
        <div
          key={`${card.node}-${card.program}`}
          className={`amazon-card ${
            card.isMainStation 
              ? 'border-[#ff9900] shadow-[0_0_3px_1px_rgba(255,153,0,0.3)]' 
              : ''
          }`}
        >
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-semibold text-[#111111]">
                {card.node}
              </h3>
              {card.isMainStation && (
                <span className="px-2 py-0.5 bg-[#fff8e7] text-[#c45500] rounded text-xs font-medium">
                  Main
                </span>
              )}
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getProgramBadgeClasses(card.program)}`}>
              {card.program.toUpperCase()}
            </span>
          </div>

          <p className="text-sm text-[#232F3F] mb-4">
            Effective Week: {card.effectiveWeek}
          </p>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-[#232F3F]">Coverage Statistics</p>
              <div className="mt-2 grid grid-cols-2 gap-6">
                <div>
                  <p className="text-2xl font-semibold text-[#111111]">
                    {card.postalCodes.length}
                  </p>
                  <p className="text-sm text-[#232F3F]">Postal Codes</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold text-[#111111]">
                    {card.population.toLocaleString()}
                  </p>
                  <p className="text-sm text-[#232F3F]">Population</p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-[#232F3F] mb-2">Postal Codes</p>
              <div className="bg-[#f5f5f5] p-3 rounded">
                <p className="text-sm text-[#111111] break-words">
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