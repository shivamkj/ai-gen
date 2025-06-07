import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { ScrollArea } from './scroll-area'
import { Markdown } from './markdown'
import { Avatar } from './avatar'
import { baseUrl } from '@/hooks'
import clsx from 'clsx'
import { llmOutputToBash } from '../process_code.ts'

export function Messages({ chatId }: { chatId: number | undefined }) {
  const { data } = useQuery({
    queryKey: ['chat', chatId],
    enabled: chatId != null,
    queryFn: () => fetch(`${baseUrl}/api/chats/${chatId}/messages`).then((res) => res.json()),
  })

  const queryClient = useQueryClient()

  const { mutate: deleteMessage } = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`${baseUrl}/api/messages/${id}`, { method: 'DELETE' })
      return response.json()
    },
    onSuccess: (_) => {
      queryClient.invalidateQueries({ queryKey: ['chat', chatId] })
    },
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

  function deleteChat(messageId: number) {
    const confirmed = window.confirm('Are you sure?')
    if (confirmed) deleteMessage(messageId)
  }

  if (data == null) return <div className="flex-1 text-2xl"></div>

  return (
    <ScrollArea outerClass="flex-1" innerClass="p-4" ref={scrollAreaRef}>
      {data.map((message: any, index: any) => (
        <div
          key={index}
          className={`relative mb-4 flex ${message.role == 'assistant' ? 'flex-row-reverse justify-end' : ''}`}>
          {message.role == 'assistant' && <CopyCode content={message.content} />}
          <div
            className={clsx(
              `border-zinc-800 bg-gray-900 shadow-lg text-zinc-50 rounded-xl border p-6 overflow-x-hidden`,
              message.role == 'user' && 'bg-blue-500 text-white ml-auto'
            )}>
            <Markdown content={message.content} />
            <hr />
            <div className="flex justify-between font-light">
              {message.output_token != null ? (
                <div className="font-light mr-10">
                  Tokens: {message.input_token} (Input), {message.output_token} (Output)
                </div>
              ) : (
                <div />
              )}
              <div>
                <Trash2 className="text-red-700" onClick={(_) => deleteChat(message.id)} />
              </div>
            </div>
          </div>
          <Avatar className="mx-6" initials={message.role == 'user' ? 'YOU' : 'AI'} />
        </div>
      ))}
    </ScrollArea>
  )
}

function CopyCode({ content }: { content: string }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(llmOutputToBash(content))
    if (copied) return
    setCopied(true)
    setTimeout(() => setCopied(false), 1000)
  }

  return (
    <button
      type="button"
      className="absolute text-white rounded-lg text-sm px-5 py-2.5 me-2 mb-4 bg-blue-600 left-3 top-15"
      onClick={copy}>
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}
