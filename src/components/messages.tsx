import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { ScrollArea } from './scroll-area'
import { Markdown } from './markdown'
import { Avatar } from './avatar'
import { baseUrl } from '@/hooks'
import clsx from 'clsx'

export function Messages({ chatId }: { chatId: number | undefined }) {
  const { data } = useQuery({
    queryKey: ['chat', chatId],
    enabled: chatId != null,
    queryFn: () => fetch(`${baseUrl}/api/chats/${chatId}`).then((res) => res.json()),
  })

  const scrollAreaRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    if (!scrollAreaRef.current) return
    const scrollContainer = scrollAreaRef.current.querySelector('[data-scrollable]')
    if (scrollContainer) scrollContainer.scrollTop = scrollContainer.scrollHeight
  }

  useEffect(() => {
    scrollToBottom()
  }, [data])

  if (data == null) return <div className="flex-1 text-2xl"></div>

  return (
    <ScrollArea outerClass="flex-1 bg-gray-900" innerClass="p-4" ref={scrollAreaRef}>
      {data.map((message: any, index: any) => (
        <div key={index} className={`mb-4 flex ${message.role === 'assistant' ? 'flex-row-reverse justify-end' : ''}`}>
          <div
            className={clsx(
              `border-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 text-zinc-50 rounded-xl border bg-white shadow p-6 overflow-x-hidden`,
              message.role === 'user' && 'bg-blue-500 text-white ml-auto'
            )}>
            <Markdown content={message.content} />
          </div>
          <Avatar className="mx-6" initials={message.role === 'user' ? 'YOU' : 'AI'} />
        </div>
      ))}
    </ScrollArea>
  )
}
