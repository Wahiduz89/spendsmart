'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { formatCurrency } from "@/lib/utils"

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

interface CategoryBreakdownProps {
  data: Array<{
    category: string
    icon: string
    color: string
    amount: number
    count: number
    percentage: number
  }>
}

export function CategoryBreakdown({ data }: CategoryBreakdownProps) {
  const topCategories = data.slice(0, 8) // Show top 8 categories

  const chartData = {
    labels: topCategories.map(item => item.category),
    datasets: [
      {
        label: 'Amount Spent',
        data: topCategories.map(item => item.amount),
        backgroundColor: topCategories.map(item => item.color),
        borderColor: topCategories.map(item => item.color),
        borderWidth: 1,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const item = topCategories[context.dataIndex]
            return [
              `Amount: ${formatCurrency(context.parsed.x)}`,
              `Transactions: ${item.count}`,
              `Percentage: ${item.percentage.toFixed(1)}%`
            ]
          },
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return formatCurrency(value)
          },
        },
      },
    },
  }

  const totalAmount = data.reduce((sum, item) => sum + item.amount, 0)
  const totalTransactions = data.reduce((sum, item) => sum + item.count, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Category Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80 mb-6">
          {data.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-gray-500">No spending data available</p>
            </div>
          ) : (
            <Bar data={chartData} options={options} />
          )}
        </div>
        
        {data.length > 0 && (
          <div className="space-y-3">
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-sm font-medium">Total</span>
              <div className="text-right">
                <span className="text-sm font-semibold">{formatCurrency(totalAmount)}</span>
                <span className="text-xs text-gray-500 ml-2">({totalTransactions} transactions)</span>
              </div>
            </div>
            
            {data.slice(0, 5).map((item, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <span>{item.icon}</span>
                  <span className="font-medium">{item.category}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-xs text-gray-500">{item.percentage.toFixed(1)}%</span>
                  <span className="font-medium">{formatCurrency(item.amount)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}