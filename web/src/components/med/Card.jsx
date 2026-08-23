import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

export function Card({ className, delay = 0, hoverLift = true, children, ...props }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={hoverLift ? { y: -4 } : undefined}
      className={cn(
        'rounded-2xl border border-slate-200 bg-white p-5 shadow-soft transition-shadow hover:shadow-lift sm:p-6',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export function CardTitle({ children, icon, action }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2.5">
        {icon && <span className="shrink-0 text-indigo-600">{icon}</span>}
        <h2 className="truncate text-base font-semibold sm:text-lg">{children}</h2>
      </div>
      {action}
    </div>
  )
}
