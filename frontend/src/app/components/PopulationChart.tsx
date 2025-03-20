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

interface PopulationChartProps {
  tag: string;
  data: {
    features: Array<{
      properties: {
        postal_code: string;
        demographics?: Array<{
          year: number;
          population: number;
        }>;
      };
    }>;
  };
}

export default function PopulationChart({ tag, data }: PopulationChartProps) {
  const chartData = useMemo(() => {
    // Extract all unique years across all postal codes
    const years = new Set<number>();
    const postalCodeData: { [key: string]: { [year: number]: number } } = {};

    // Process the data
    data.features.forEach(feature => {
      const postalCode = feature.properties.postal_code;
      const demographics = feature.properties.demographics || [];

      demographics.forEach(demo => {
        years.add(demo.year);
        if (!postalCodeData[postalCode]) {
          postalCodeData[postalCode] = {};
        }
        postalCodeData[postalCode][demo.year] = demo.population;
      });
    });

    // Sort years in ascending order
    const sortedYears = Array.from(years).sort((a, b) => a - b);

    // Create datasets for each postal code
    const datasets = Object.entries(postalCodeData).map(([postalCode, yearData]) => ({
      label: postalCode,
      data: sortedYears.map(year => yearData[year] || 0),
      backgroundColor: `hsl(${Math.random() * 360}, 70%, 50%)`,
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
  }, [data]);

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
        position: 'top' as const,
        labels: {
          boxWidth: 12,
          boxHeight: 12,
          padding: 10
        }
      },
      title: {
        display: true,
        text: `Population Trends - ${tag}`,
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
        No population data available for {tag}
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