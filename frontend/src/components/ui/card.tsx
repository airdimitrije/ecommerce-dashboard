import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  [key: string]: any
}

export const Card = ({ children, className = '', ...props }: CardProps) => {
  return (
    <div className={`rounded-xl bg-gradient-to-br from-gray-900 to-black border border-yellow-500/20 shadow-2xl backdrop-blur-sm ${className}`} {...props}>
      {children}
    </div>
  )
}

export const CardContent = ({ children, className = '', ...props }: CardProps) => {
  return (
    <div className={`p-6 ${className}`} {...props}>
      {children}
    </div>
  )
}