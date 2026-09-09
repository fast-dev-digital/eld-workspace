import React from 'react'
import { clsx } from 'clsx'

interface ELDLogoProps {
  variant?: 'orange' | 'white' | 'dark'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showSubtitle?: boolean
  subtitle?: string
  className?: string
}

export const ELDLogo: React.FC<ELDLogoProps> = ({
  variant = 'orange',
  size = 'md',
  showSubtitle = false,
  subtitle = 'WORKSPACE',
  className,
}) => {
  // Dimensions
  const dimensions = {
    sm: { height: 22, width: 68 },
    md: { height: 28, width: 88 },
    lg: { height: 38, width: 120 },
    xl: { height: 50, width: 156 },
  }

  const { width, height } = dimensions[size]

  // Colors
  // In orange mode (logo 1): Letters are #FF5500, inner dot is #09090B
  // In white mode (logo 2): Letters are #FFFFFF, inner dot is #FF5500
  // In dark mode: Letters are #09090B, inner dot is #FF5500
  let letterColor = '#FF5500'
  let dotColor = '#09090B'

  if (variant === 'white') {
    letterColor = '#FFFFFF'
    dotColor = '#FF5500'
  } else if (variant === 'dark') {
    letterColor = '#09090B'
    dotColor = '#FF5500'
  }

  return (
    <div className={clsx('inline-flex items-center gap-2.5 select-none', className)}>
      <svg
        width={width}
        height={height}
        viewBox="0 0 240 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        {/* Letter E: 3 horizontal rounded pill bars */}
        <rect x="0" y="4" width="76" height="16" rx="8" fill={letterColor} />
        <rect x="0" y="32" width="76" height="16" rx="8" fill={letterColor} />
        <rect x="0" y="60" width="76" height="16" rx="8" fill={letterColor} />

        {/* Letter L: L-shape with rounded corners */}
        <path
          d="M88 12C88 7.58172 91.5817 4 96 4C100.418 4 104 7.58172 104 12V60C104 64.4183 107.582 68 112 68H164C168.418 68 172 71.5817 172 76C172 80.4183 168.418 84 164 84H104C95.1634 84 88 76.8366 88 68V12Z"
          fill={letterColor}
        />

        {/* Letter D: Custom stylized D with smooth curved corner */}
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M178 4C180.209 4 182 5.79086 182 8V8C182 17.9411 190.059 26 200 26H206C224.778 26 240 41.2223 240 60C240 73.2548 229.255 84 216 84H182C177.582 84 174 80.4183 174 76C174 71.5817 177.582 68 182 68H216C220.418 68 224 64.4183 224 60C224 50.0589 215.941 42 206 42H200C181.222 42 166 26.7777 166 8V8C166 5.79086 167.791 4 170 4H178Z"
          fill={letterColor}
        />

        {/* Inner dot / pill inside D */}
        <rect x="188" y="47" width="18" height="18" rx="5" fill={dotColor} />
      </svg>

      {showSubtitle && (
        <div className="flex flex-col justify-center">
          <span
            className={clsx(
              'text-[10px] font-black tracking-widest leading-none uppercase',
              variant === 'white' ? 'text-white/90' : 'text-zinc-900'
            )}
          >
            {subtitle}
          </span>
          <span
            className={clsx(
              'text-[8px] font-medium tracking-wider leading-tight uppercase',
              variant === 'white' ? 'text-zinc-400' : 'text-zinc-500'
            )}
          >
            Agência
          </span>
        </div>
      )}
    </div>
  )
}
