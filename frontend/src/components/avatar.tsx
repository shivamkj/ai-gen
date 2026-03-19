interface AvatarProps {
  className?: string
  name?: string
  initials?: string
}

export function Avatar({ className, name, initials }: AvatarProps) {
  return (
    <div
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200 object-cover size-12 text-base${className ? ` ${className}` : ''}`}>
      <span className="font-medium text-gray-600" role="img" aria-label={name}>
        {initials}
      </span>
    </div>
  )
}
