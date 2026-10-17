import { cn } from '~/components/cn'
import { stageStyles, type Stage } from '~/components/stages'

/** A deal's stage, in the stage's colour. */
export default function StageBadge({ stage, className }: { readonly stage: Stage; readonly className?: string }) {
  const style = stageStyles[stage]

  return (
    <span
      className={cn(
        'inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium ring-1 ring-inset',
        style.badge,
        className
      )}
    >
      <span className={cn('size-1.5 rounded-full', style.dot)} aria-hidden="true" />
      {style.label}
    </span>
  )
}
