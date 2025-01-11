import clsx from 'clsx'
import { useState } from 'react'

interface AvatarProps extends Omit<React.ComponentProps<'div'>, 'size'> {
  src?: string
  className?: string
  name?: string
  initials?: string
  alt?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function Avatar({ src, className, size, name, initials, alt, ...props }: AvatarProps) {
  const [imageError, setImageError] = useState(false)

  return (
    <div
      className={clsx(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200 object-cover size-12 text-base',
        className
      )}
      {...props}>
      {src && !imageError ? (
        <img src={src} alt={alt || name} onError={() => setImageError(true)} loading="lazy" />
      ) : (
        <span className="font-medium text-gray-600" role="img" aria-label={name}>
          {initials}
        </span>
      )}
    </div>
  )
}
