import React from 'react'

interface TableProps {
  children: React.ReactNode
  className?: string
  [key: string]: any
}

const Table = ({ children, className = '', ...props }: TableProps) => {
  return (
    <div className="w-full overflow-auto rounded-lg">
      <table className={`w-full ${className}`} {...props}>
        {children}
      </table>
    </div>
  )
}

const TableHeader = ({ children, className = '', ...props }: TableProps) => {
  return (
    <thead className={`border-b border-yellow-500/30 ${className}`} {...props}>
      {children}
    </thead>
  )
}

const TableBody = ({ children, className = '', ...props }: TableProps) => {
  return (
    <tbody className={`${className}`} {...props}>
      {children}
    </tbody>
  )
}

const TableRow = ({ children, className = '', ...props }: TableProps) => {
  return (
    <tr className={`border-b border-gray-800 transition-all hover:bg-yellow-500/5 ${className}`} {...props}>
      {children}
    </tr>
  )
}

const TableHead = ({ children, className = '', ...props }: TableProps) => {
  return (
    <th className={`h-12 px-4 text-left align-middle font-semibold text-yellow-500 ${className}`} {...props}>
      {children}
    </th>
  )
}

const TableCell = ({ children, className = '', ...props }: TableProps) => {
  return (
    <td className={`p-4 align-middle text-gray-300 ${className}`} {...props}>
      {children}
    </td>
  )
}

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell }