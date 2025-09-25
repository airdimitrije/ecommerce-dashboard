import React from 'react'

interface ButtonProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'outline' | 'ghost' | 'gold'
  [key: string]: any
}

export const Button = ({ children, className = '', variant = 'default', ...props }: ButtonProps) => {
  const variants = {
    default: 'bg-gradient-to-r from-yellow-600 to-yellow-500 text-black hover:from-yellow-500 hover:to-yellow-400 shadow-lg shadow-yellow-500/20',
    outline: 'border border-yellow-500/50 bg-transparent text-yellow-500 hover:bg-yellow-500/10',
    ghost: 'hover:bg-yellow-500/10 text-yellow-500',
    gold: 'bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-black font-bold shadow-xl shadow-yellow-500/30 hover:shadow-yellow-500/50'
  }

  return (
    <button 
      className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-300 ${variants[variant]} ${className}`} 
      {...props}
    >
      {children}
    </button>
  )
}