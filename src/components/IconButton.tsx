import type { Icon } from '@phosphor-icons/react'

interface Props {
  readonly icon: Icon
  readonly label: string
  readonly onClick: () => void
  readonly className?: string
}

export function IconButton({ icon: IconComponent, label, onClick, className = '' }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`grid size-10 shrink-0 place-items-center rounded-full text-secondary transition-colors hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-accent ${className}`}
    >
      <IconComponent size={22} aria-hidden="true" />
    </button>
  )
}
