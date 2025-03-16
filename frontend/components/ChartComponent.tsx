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
  ChartOptions
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
        },
        title: {
          display: true,
          text: `Population by Year for ${data.tag}`,
        },
        tooltip: {
          mode: 'index',
          intersect: false,
        },
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
        },
      },
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