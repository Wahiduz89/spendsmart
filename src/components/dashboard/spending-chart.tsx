'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'
import { formatCurrency } from "@/lib/utils"

ChartJS.register(ArcElement, Tooltip, Legend)

interface SpendingChartProps {
  data: Array<{
    category: string
    amount: number
    color: string
  }>
}

export function SpendingChart({ data }: SpendingChartProps) {
  const totalSpending = data.reduce((sum, item) => sum + item.amount, 0)

  const chartData = {
    labels: data.map(item => item.category),
    datasets: [
      {
        data: data.map(item => item.amount),
        backgroundColor: data.map(item => item.color),
        borderColor: data.map(item => item.color),
        borderWidth: 1,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || ''
            const value = formatCurrency(context.parsed)
            const percentage = ((context.parsed / totalSpending) * 100).toFixed(1)
            return `${label}: ${value} (${percentage}%)`
          },
        },
      },
    },
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Spending by Category</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-[300px]">
            <p className="text-sm text-gray-500">
              No spending data available for this month
            </p>
          </div>
        ) : (
          <div className="h-[300px]">
            <Doughnut data={chartData} options={options} />
          </div>
        )}
        
        {data.length > 0 && (
          <div className="mt-6 space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Top Categories</h4>
            {data
              .sort((a, b) => b.amount - a.amount)
              .slice(0, 5)
              .map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span>{item.category}</span>
                  </div>
                  <span className="font-medium">{formatCurrency(item.amount)}</span>
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}