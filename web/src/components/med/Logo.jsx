import { Activity } from 'lucide-react'
import { cn } from '../../lib/utils'

export function Logo({ size = 'md', showWordmark = true, className }) {
  const box = size === 'lg' ? 'h-14 w-14' : size === 'sm' ? 'h-9 w-9' : 'h-11 w-11'
  const icon = size === 'lg' ? 'h-7 w-7' : size === 'sm' ? 'h-4.5 w-4.5' : 'h-5.5 w-5.5'
  const text = size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-base' : 'text-lg'

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className={cn('grid shrink-0 place-items-center rounded-2xl bg-gradient-primary shadow-primary', box)}>
        <Activity className={cn('text-white', icon)} strokeWidth={2.5} />
      </div>
      {showWordmark && (
        <div className="min-w-0">
          <p className={cn('truncate font-bold leading-tight', text)}>
            Med<span className="text-gradient-primary">Assist</span> AI
          </p>
          {size !== 'sm' && <p className="truncate text-xs text-muted-foreground">Symptom intelligence</p>}
        </div>
      )}
    </div>
  )
}
