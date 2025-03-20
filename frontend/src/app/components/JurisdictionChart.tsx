'use client';

import { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface JurisdictionChartProps {
  data: any; // GeoJSON response from the API
  node: string;
  program: string;
  isMainStation: boolean;
}

// Generate a color palette for ZIP codes while maintaining program type distinction
const generateZipColors = (count: number, program: string, isMainStation: boolean): string[] => {
  const programBaseHue = {
    core: 210,    // Blue
    ssd: 142,     // Green
    all: 231      // Indigo
  }[program.toLowerCase()] || 210;

  const saturation = isMainStation ? '75%' : '65%';
  const baseLight = isMainStation ? 50 : 65;

  return Array.from({ length: count }, (_, i) => {
    // Distribute hues around the base hue to create distinct but related colors
    const hue = (programBaseHue + (i * 30)) % 360;
    const lightness = baseLight + (i * 5) % 20; // Vary lightness slightly
    return `hsl(${hue}, ${saturation}, ${lightness}%)`;
  });
};

export default function JurisdictionChart({ data, node, program, isMainStation }: JurisdictionChartProps) {
  const chartData = useMemo(() => {
    // Extract all unique years across all postal codes
    const years = new Set<number>();
    const postalCodeData: { [key: string]: { [year: number]: number } } = {};

    // Filter features for this specific node and program
    const relevantFeatures = data.features.filter((feature: any) => 
      feature.properties.delivery_station === node && 
      feature.properties.program_type === program
    );

    // Process the data
    relevantFeatures.forEach((feature: any) => {
      const postalCode = feature.properties.postal_code;
      const demographics = feature.properties.demographics || [];

      demographics.forEach((demo: any) => {
        years.add(demo.year);
        if (!postalCodeData[postalCode]) {
          postalCodeData[postalCode] = {};
        }
        postalCodeData[postalCode][demo.year] = demo.population;
      });
    });

    // Sort years in ascending order
    const sortedYears = Array.from(years).sort((a, b) => a - b);

    // Sort postal codes by their most recent population (descending)
    const sortedPostalCodes = Object.entries(postalCodeData)
      .sort(([, aData], [, bData]) => {
        const latestYear = Math.max(...sortedYears);
        return (bData[latestYear] || 0) - (aData[latestYear] || 0);
      })
      .map(([code]) => code);

    // Generate colors for each postal code
    const colors = generateZipColors(sortedPostalCodes.length, program, isMainStation);

    // Create datasets for each postal code
    const datasets = sortedPostalCodes.map((postalCode, index) => ({
      label: postalCode,
      data: sortedYears.map(year => postalCodeData[postalCode][year] || 0),
      backgroundColor: colors[index],
      borderColor: colors[index],
      borderWidth: 1
    }));

    // Calculate total population for each year
    const totals = sortedYears.map(year => 
      Object.values(postalCodeData).reduce((sum, yearData) => 
        sum + (yearData[year] || 0), 0
      )
    );

    return {
      labels: sortedYears,
      datasets,
      totals
    };
  }, [data, node, program, isMainStation]);

  const options = {
    responsive: true,
    scales: {
      x: {
        stacked: true,
        title: {
          display: true,
          text: 'Year'
        }
      },
      y: {
        stacked: true,
        title: {
          display: true,
          text: 'Population'
        },
        beginAtZero: true
      }
    },
    plugins: {
      tooltip: {
        callbacks: {
          footer: (tooltipItems: any[]) => {
            const total = tooltipItems.reduce((sum, item) => sum + item.parsed.y, 0);
            return `Total: ${total.toLocaleString()}`;
          }
        }
      },
      legend: {
        position: 'right' as const,
        align: 'start' as const,
        labels: {
          boxWidth: 12,
          boxHeight: 12,
          padding: 10,
          font: {
            size: 11
          }
        }
      },
      title: {
        display: true,
        text: `Population Trends - ${node} ${program.toUpperCase()}${isMainStation ? ' (Main)' : ''}`,
        font: {
          size: 16
        }
      }
    }
  };

  // Custom plugin to display total on top of bars
  const totalLabelsPlugin = {
    id: 'totalLabels',
    afterDatasetsDraw(chart: any) {
      const ctx = chart.ctx;
      ctx.save();
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillStyle = '#666';

      chartData.totals.forEach((total, index) => {
        const meta = chart.getDatasetMeta(chart.data.datasets.length - 1);
        const x = meta.data[index].x;
        const y = meta.data[index].y;
        ctx.fillText(total.toLocaleString(), x, y - 5);
      });

      ctx.restore();
    }
  };

  if (chartData.datasets.length === 0) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-500">
        No population data available for {node} {program}
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <Bar
        data={{
          labels: chartData.labels,
          datasets: chartData.datasets
        }}
        options={options}
        plugins={[totalLabelsPlugin]}
      />
    </div>
  );
} 