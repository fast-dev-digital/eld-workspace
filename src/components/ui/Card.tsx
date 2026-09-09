import React from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  noPadding?: boolean
  interactive?: boolean
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  noPadding = false,
  interactive = false,
  ...props
}) => {
  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-zinc-200/80 shadow-xs',
        interactive && 'transition-all duration-150 hover:shadow-sm hover:border-zinc-300/90 cursor-pointer',
        !noPadding && 'p-5',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
