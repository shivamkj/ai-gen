interface ScrollAreaProps {
  children: preact.ContainerNode
  outerClass?: string
  innerClass?: string
  outerRef?: preact.Ref<HTMLDivElement>
}

export function ScrollArea({ children, outerClass = '', innerClass = '', outerRef }: ScrollAreaProps) {
  return (
    <div className={`relative w-full overflow-hidden ${outerClass}`} ref={outerRef}>
      <div className={`h-full w-full overflow-auto ${innerClass}`} data-scrollable="true">
        {children}
      </div>
    </div>
  )
}
