'use client'

import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface DataPoint {
  name: string
  value: number
  [key: string]: any
}

interface RetroLineChartProps {
  data: DataPoint[]
  dataKey?: string
  xAxisKey?: string
  title?: string
  className?: string
}

export function RetroLineChart({
  data,
  dataKey = 'value',
  xAxisKey = 'name',
  title,
  className = ''
}: RetroLineChartProps) {
  return (
    <div className={`border-2 border-green-500 bg-black p-6 shadow-[0_0_20px_rgba(0,255,0,0.3)] ${className}`}>
      {title && (
        <h3 className="text-xl font-bold text-green-500 mb-4 font-mono uppercase retro-glow">
          {title}
        </h3>
      )}
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid
            stroke="#004400"
            strokeDasharray="3 3"
          />
          <XAxis
            dataKey={xAxisKey}
            stroke="#00ff00"
            tick={{ fill: '#00ff00', fontFamily: 'monospace', fontSize: 12 }}
          />
          <YAxis
            stroke="#00ff00"
            tick={{ fill: '#00ff00', fontFamily: 'monospace', fontSize: 12 }}
          />
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
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke="#00ff00"
            strokeWidth={2}
            dot={{ fill: '#00ff00', r: 4, strokeWidth: 2 }}
            activeDot={{ r: 6, fill: '#00ff88' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
