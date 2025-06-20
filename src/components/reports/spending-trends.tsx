'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js'
import { Line } from 'react-chartjs-2'
import { formatCurrency } from "@/lib/utils"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

interface SpendingTrendsProps {
  data: Array<{
    month: string
    amount: number
  }>
}

export function SpendingTrends({ data }: SpendingTrendsProps) {
  const chartData = {
    labels: data.map(item => item.month),
    datasets: [
      {
        label: 'Monthly Spending',
        data: data.map(item => item.amount),
        borderColor: 'rgb(230, 126, 34)',
        backgroundColor: 'rgba(230, 126, 34, 0.1)',
        fill: true,
        tension: 0.3,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `Spending: ${formatCurrency(context.parsed.y)}`
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return formatCurrency(value)
          },
        },
      },
    },
  }

  const totalSpending = data.reduce((sum, item) => sum + item.amount, 0)
  const averageSpending = totalSpending / data.length
  const trend = data.length >= 2 
    ? ((data[data.length - 1].amount - data[data.length - 2].amount) / data[data.length - 2].amount) * 100
    : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 mb-6">
          {data.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-gray-500">No data available</p>
            </div>
          ) : (
            <Line data={chartData} options={options} />
          )}
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-gray-500">Average</p>
            <p className="text-sm font-semibold">{formatCurrency(averageSpending)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Total (6 months)</p>
            <p className="text-sm font-semibold">{formatCurrency(totalSpending)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Trend</p>
            <p className={`text-sm font-semibold ${trend > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}