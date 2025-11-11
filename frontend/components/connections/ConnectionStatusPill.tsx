type Status = 'active' | 'expired' | 'error' | 'disabled'

interface ConnectionStatusPillProps {
  status: string
  className?: string
}

export function ConnectionStatusPill({ status, className = '' }: ConnectionStatusPillProps) {
  const normalizedStatus = status.toLowerCase() as Status

  const statusConfig: Record<Status, { label: string; bgColor: string; textColor: string }> = {
    active: {
      label: 'Active',
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
    },
    expired: {
      label: 'Expired',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-800',
    },
    error: {
      label: 'Error',
      bgColor: 'bg-red-100',
      textColor: 'text-red-800',
    },
    disabled: {
      label: 'Disabled',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-800',
    },
  }

  const config = statusConfig[normalizedStatus] || statusConfig.disabled

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor} ${className}`}
    >
      {config.label}
    </span>
  )
}

