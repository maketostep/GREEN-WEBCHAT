import type { InputHTMLAttributes } from 'react'

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  readonly label: string
  readonly onChange: (value: string) => void
}

export function TextField({ label, onChange, ...input }: Props) {
  return (
    <label className="block">
      <span className="mb-1 block text-[13px] text-secondary">{label}</span>
      <input
        {...input}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-xl border border-divider bg-white px-3 outline-hidden transition-colors placeholder:text-tertiary focus:border-accent"
      />
    </label>
  )
}
