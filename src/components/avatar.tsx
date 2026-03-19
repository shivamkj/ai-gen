import { useState } from 'preact/hooks'

interface AvatarProps {
  src?: string
  className?: string
  name?: string
  initials?: string
  alt?: string
}

export function Avatar({ src, className, name, initials, alt }: AvatarProps) {
  const [imageError, setImageError] = useState(false)

  return (
    <div
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200 object-cover size-12 text-base${className ? ` ${className}` : ''}`}>
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
