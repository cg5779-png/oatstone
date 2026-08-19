import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

const defaults: IconProps = {
  width: 36,
  height: 36,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

function Icon({ children, ...props }: IconProps & { children: React.ReactNode }) {
  return <svg {...defaults} {...props}>{children}</svg>
}

export function LightbulbIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M12 2v1" />
      <path d="M18.4 6.6l-.7.7" />
      <path d="M21 12h-1" />
      <path d="M18.4 17.4l-.7-.7" />
      <path d="M12 19v-5" />
      <path d="M5.6 17.4l.7-.7" />
      <path d="M4 12H3" />
      <path d="M5.6 6.6l.7.7" />
      <path d="M12 15a4 4 0 0 0 4-7.5A4 4 0 0 0 8 7.5a4 4 0 0 0 4 7.5z" />
    </Icon>
  )
}

export function MessagesIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="8.5" cy="11.5" r="4.5" />
      <path d="M13.5 7a4.5 4.5 0 0 1 4.5 4.5c0 2.5-2 4.5-4.5 4.5H14l-2.5 2.5V16" />
      <path d="M14.5 11.5h.01" />
      <path d="M16 11.5h.01" />
      <path d="M17.5 11.5h.01" />
    </Icon>
  )
}

export function SettingsIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v2.5" />
      <path d="M12 19.5V22" />
      <path d="M4.93 4.93l1.77 1.77" />
      <path d="M17.3 17.3l1.77 1.77" />
      <path d="M2 12h2.5" />
      <path d="M19.5 12H22" />
      <path d="M4.93 19.07l1.77-1.77" />
      <path d="M17.3 6.7l1.77-1.77" />
    </Icon>
  )
}

const VALUE_ICONS = {
  outset: LightbulbIcon,
  attitude: MessagesIcon,
  tone: SettingsIcon,
} as const

export type ValueIconName = keyof typeof VALUE_ICONS

export function ValueIcon({ name, className = '' }: { name: ValueIconName; className?: string }) {
  const IconComponent = VALUE_ICONS[name]
  return <IconComponent className={className} />
}
