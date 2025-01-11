import { forwardRef } from 'react'

interface ScrollAreaProps {
  children: React.ReactNode
  outerClass?: string
  innerClass?: string
}

export const ScrollArea = forwardRef(__ScrollArea)

function __ScrollArea(
  { children, outerClass = '', innerClass = '' }: ScrollAreaProps,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  return (
    <div className={`relative w-full overflow-hidden ${outerClass}`} ref={ref}>
      <div className={`h-full w-full overflow-auto ${innerClass}`} data-scrollable="true">
        {children}
      </div>
    </div>
  )
}
