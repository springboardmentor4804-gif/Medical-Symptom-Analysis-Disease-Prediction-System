import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

const variants = {
  primary: 'bg-gradient-primary text-white shadow-primary',
  secondary: 'bg-white text-slate-700 border border-slate-300 shadow-soft hover:bg-slate-50',
  ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  teal: 'bg-teal-600 text-white shadow-soft',
  danger: 'bg-red-600 text-white shadow-soft',
}

const sizes = {
  sm: 'h-9 px-3.5 text-sm gap-1.5',
  md: 'h-11 px-5 text-sm gap-2',
  lg: 'h-13 px-7 text-base gap-2.5',
  icon: 'h-10 w-10',
}

export function Button({ variant = 'primary', size = 'md', className, disabled, children, ...props }) {
  return (
    <motion.button
      whileHover={disabled ? undefined : { y: -2, scale: 1.015 }}
      whileTap={disabled ? undefined : { y: 0, scale: 0.975 }}
      transition={{ type: 'spring', stiffness: 420, damping: 26 }}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center rounded-xl font-semibold',
        'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-45 disabled:shadow-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  )
}
