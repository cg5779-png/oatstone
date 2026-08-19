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

export function MapPinIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </Icon>
  )
}

export function FileTextIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h8" />
      <path d="M8 17h8" />
      <path d="M8 9h2" />
    </Icon>
  )
}

export function BoxIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M21 8.5 12 3 3 8.5" />
      <path d="M21 8.5V16.5L12 21 3 16.5V8.5" />
      <path d="M12 12v9" />
      <path d="M3 8.5 12 12l9-3.5" />
    </Icon>
  )
}

export function LayersIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 2 2 7l10 5 10-5-10-5Z" />
      <path d="m2 17 10 5 10-5" />
      <path d="m2 12 10 5 10-5" />
    </Icon>
  )
}

const SERVICE_ICONS = {
  survey: MapPinIcon,
  drawing: FileTextIcon,
  '3d': BoxIcon,
  integrated: LayersIcon,
} as const

export type ServiceIconName = keyof typeof SERVICE_ICONS

export function ServiceIcon({ name, className = '' }: { name: ServiceIconName; className?: string }) {
  const IconComponent = SERVICE_ICONS[name]
  return <IconComponent className={className} />
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
