import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

const base = (size: number): SVGProps<SVGSVGElement> => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
})

export const FridgeIcon = ({ size = 24, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <rect x="5" y="2.5" width="14" height="19" rx="2.5" />
    <path d="M5 9.5h14M8.5 5.5v2M8.5 12.5v3" />
  </svg>
)

export const BowlIcon = ({ size = 24, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <path d="M4 11h16a8 8 0 0 1-16 0z" />
    <path d="M9 7c0-1.5 1-1.5 1-3M13 7c0-1.5 1-1.5 1-3" />
  </svg>
)

export const CartIcon = ({ size = 24, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6.2" />
    <circle cx="10" cy="20" r="1" />
    <circle cx="18" cy="20" r="1" />
  </svg>
)

export const PlusIcon = ({ size = 20, ...p }: IconProps) => (
  <svg {...base(size)} strokeWidth={2.4} {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)

export const BackIcon = ({ size = 22, ...p }: IconProps) => (
  <svg {...base(size)} strokeWidth={2.2} {...p}>
    <path d="M15 6l-6 6 6 6" />
  </svg>
)

export const ChevronIcon = ({ size = 18, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <path d="M9 6l6 6-6 6" />
  </svg>
)

export const CheckIcon = ({ size = 14, ...p }: IconProps) => (
  <svg {...base(size)} strokeWidth={3.2} {...p}>
    <path d="M5 12l5 5 9-10" />
  </svg>
)

export const SearchIcon = ({ size = 20, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </svg>
)

export const CloseIcon = ({ size = 18, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
)

export const PlayIcon = ({ size = 20, ...p }: IconProps) => (
  <svg {...base(size)} fill="currentColor" stroke="none" {...p}>
    <path d="M8 5v14l11-7z" />
  </svg>
)

export const GridIcon = ({ size = 20, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <rect x="4" y="4" width="7" height="7" rx="1.5" />
    <rect x="13" y="4" width="7" height="7" rx="1.5" />
    <rect x="4" y="13" width="7" height="7" rx="1.5" />
    <rect x="13" y="13" width="7" height="7" rx="1.5" />
  </svg>
)

export const ListIcon = ({ size = 20, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <rect x="4" y="5" width="4" height="4" rx="1" />
    <rect x="4" y="15" width="4" height="4" rx="1" />
    <path d="M11 7h9M11 17h9" />
  </svg>
)
