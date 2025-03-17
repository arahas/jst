'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
  Plugin
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { TagGroup, GeoJsonFeature, DemographicData } from '@/lib/types'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

// Create a custom plugin to display total population above each stacked bar
const TotalLabelsPlugin: Plugin<'bar'> = {
  id: 'totalLabels',
  afterDraw(chart) {
    const { ctx, data, chartArea, scales } = chart;
    
    if (!data.datasets.length) return;
    
    ctx.save();
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    
    // For each x-axis label (year)
    data.labels?.forEach((label, index) => {
      // Calculate total for this index across all datasets
      let total = 0;
      data.datasets.forEach(dataset => {
        total += Number(dataset.data[index]) || 0;
      });
      
      // Format the total with commas for thousands
      const formattedTotal = total.toLocaleString();
      
      // Position the label between the legend and the chart area
      const x = scales.x.getPixelForValue(index);
      // Safely access legend and position labels between legend and chart
      const legendBottom = chart.legend?.bottom || chartArea.top - 30;
      const y = legendBottom + 15;
      
      // Draw a small white background for better readability
      const textWidth = ctx.measureText(formattedTotal).width;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillRect(x - textWidth/2 - 4, y - 12, textWidth + 8, 16);
      
      // Draw the text
      ctx.fillStyle = '#000';
      ctx.fillText(formattedTotal, x, y);
    });
    
    ctx.restore();
  }
};

// Register the plugin globally
ChartJS.register(TotalLabelsPlugin);

interface ChartComponentProps {
  data: TagGroup
}

export default function ChartComponent({ data }: ChartComponentProps) {
  const [chartData, setChartData] = useState<ChartData<'bar'> | null>(null)
  const [chartOptions, setChartOptions] = useState<ChartOptions<'bar'> | null>(null)

  useEffect(() => {
    if (!data || !data.features || data.features.length === 0) return

    // Extract years and postal codes
    const allYears = new Set<number>()
    const postalCodeData: Record<string, Record<number, number>> = {}

    // Process features to extract demographic data by postal code and year
    data.features.forEach((feature: GeoJsonFeature) => {
      const postalCode = feature.properties.postal_code
      const demographics = feature.properties.demographics || []

      if (!postalCodeData[postalCode]) {
        postalCodeData[postalCode] = {}
      }

      demographics.forEach((demo: DemographicData) => {
        const year = demo.year
        const population = demo.population || 0
        
        allYears.add(year)
        postalCodeData[postalCode][year] = population
      })
    })

    // Sort years in ascending order
    const sortedYears = Array.from(allYears).sort((a, b) => a - b)
    
    // Generate colors for each postal code
    const colors = generateColors(Object.keys(postalCodeData).length)
    
    // Prepare datasets for Chart.js
    const datasets = Object.entries(postalCodeData).map(([postalCode, yearData], index) => {
      return {
        label: postalCode,
        data: sortedYears.map(year => yearData[year] || 0),
        backgroundColor: colors[index],
        stack: 'stack1'
      }
    })

    // Calculate total population for each year
    const yearTotals = sortedYears.map(year => {
      let total = 0
      Object.values(postalCodeData).forEach(yearData => {
        total += yearData[year] || 0
      })
      return total
    })

    // Set chart data
    setChartData({
      labels: sortedYears.map(year => year.toString()),
      datasets
    })

    // Set chart options
    setChartOptions({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top' as const,
          // Add more space below the legend
          labels: {
            boxHeight: 12,
            padding: 20 // Increased padding to create more space
          }
        },
        title: {
          display: true,
          text: `Population by Year for ${data.tag}`,
          padding: {
            bottom: 20 // Add padding below the title
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false,
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Year'
          },
          stacked: true,
        },
        y: {
          title: {
            display: true,
            text: 'Population'
          },
          stacked: true,
          ticks: {
            padding: 5
          }
        },
      },
      // Add padding at the top of the chart for the total labels
      layout: {
        padding: {
          top: 20 // Reduced from 40px to 20px
        }
      }
    })
  }, [data])

  // Generate colors for chart
  const generateColors = (count: number) => {
    const baseColors = [
      'rgba(255, 99, 132, 0.7)',
      'rgba(54, 162, 235, 0.7)',
      'rgba(255, 206, 86, 0.7)',
      'rgba(75, 192, 192, 0.7)',
      'rgba(153, 102, 255, 0.7)',
      'rgba(255, 159, 64, 0.7)',
      'rgba(199, 199, 199, 0.7)',
      'rgba(83, 102, 255, 0.7)',
      'rgba(40, 159, 64, 0.7)',
      'rgba(210, 199, 199, 0.7)',
    ]
    
    // If we need more colors than in our base set, generate them
    if (count <= baseColors.length) {
      return baseColors.slice(0, count)
    }
    
    const colors = [...baseColors]
    for (let i = baseColors.length; i < count; i++) {
      const r = Math.floor(Math.random() * 255)
      const g = Math.floor(Math.random() * 255)
      const b = Math.floor(Math.random() * 255)
      colors.push(`rgba(${r}, ${g}, ${b}, 0.7)`)
    }
    
    return colors
  }

  if (!chartData || !chartOptions) {
    return <div className="p-4 text-center text-gray-500">No population data available</div>
  }

  return (
    <div className="h-[400px] w-full">
      <Bar data={chartData} options={chartOptions} />
    </div>
  )
} 