'use client'

import React from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface DataPoint {
  name: string
  value: number
}

interface RetroPieChartProps {
  data: DataPoint[]
  title?: string
  className?: string
}

const COLORS = ['#00ff00', '#00ffff', '#ffff00', '#ff00ff', '#00ff88', '#88ff00']

export function RetroPieChart({ data, title, className = '' }: RetroPieChartProps) {
  return (
    <div className={`border-2 border-green-500 bg-black p-6 shadow-[0_0_20px_rgba(0,255,0,0.3)] ${className}`}>
      {title && (
        <h3 className="text-xl font-bold text-green-500 mb-4 font-mono uppercase retro-glow">
          {title}
        </h3>
      )}
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#00ff00"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
                stroke="#000"
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#000',
              border: '2px solid #00ff00',
              fontFamily: 'monospace',
              color: '#00ff00'
            }}
          />
          <Legend
            wrapperStyle={{
              fontFamily: 'monospace',
              color: '#00ff00'
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
