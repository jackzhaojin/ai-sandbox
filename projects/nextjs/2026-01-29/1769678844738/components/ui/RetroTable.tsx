import React from 'react'

interface Column {
  key: string
  header: string
  render?: (value: any, row: any) => React.ReactNode
}

interface RetroTableProps {
  columns: Column[]
  data: any[]
  className?: string
}

export function RetroTable({ columns, data, className = '' }: RetroTableProps) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full border-2 border-green-500">
        <thead>
          <tr className="border-b-2 border-green-500 bg-green-950/20">
            {columns.map((column) => (
              <th
                key={column.key}
                className="px-4 py-3 text-left text-green-400 font-mono uppercase text-sm"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-8 text-center text-green-600 font-mono"
              >
                &gt; NO DATA AVAILABLE
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="border-b border-green-900 hover:bg-green-950/30 transition-colors"
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="px-4 py-3 text-green-400 font-mono text-sm"
                  >
                    {column.render
                      ? column.render(row[column.key], row)
                      : row[column.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
