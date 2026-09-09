import React from 'react'
import { clsx } from 'clsx'

export interface BadgeProps {
  children: React.ReactNode
  variant?: 'orange' | 'dark' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray'
  size?: 'sm' | 'md'
  className?: string
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'gray',
  size = 'md',
  className,
}) => {
  const variantStyles = {
    orange: 'bg-brand-50 text-brand-700 border-brand-200/80 font-medium',
    dark: 'bg-zinc-900 text-zinc-100 border-zinc-800 font-medium',
    blue: 'bg-sky-50 text-sky-700 border-sky-200/80 font-medium',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 font-medium',
    yellow: 'bg-amber-50 text-amber-700 border-amber-200/80 font-medium',
    red: 'bg-rose-50 text-rose-700 border-rose-200/80 font-medium',
    purple: 'bg-purple-50 text-purple-700 border-purple-200/80 font-medium',
    gray: 'bg-zinc-100 text-zinc-600 border-zinc-200/80 font-medium',
  }

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[10px] tracking-wide',
    md: 'px-2.5 py-0.5 text-[11px] tracking-normal',
  }

  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full border select-none transition-colors',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {children}
    </span>
  )
}
