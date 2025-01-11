import { useQuery } from '@tanstack/react-query'
import { baseUrl } from './use-completion'
import { Ctx } from '@/chat-page'
import clsx from 'clsx'
import { Trash2Icon } from 'lucide-react'
import { useAction } from '@/global-state'

type ChatHistory = { id: number; title: string; date: string }

export function ChatHistory({ selectedChatId }: { selectedChatId: number | undefined }) {
  const { isPending, data } = useQuery<ChatHistory[]>({
    queryKey: ['chatHistory'],
    queryFn: () => fetch(`${baseUrl}/api/chats/`).then((res) => res.json()),
  })
  const { setChat } = useAction(Ctx)

  if (isPending) return <div>Loading</div>

  return (
    <>
      {data!.map((chat: any) => (
        <div
          key={chat.id}
          className={clsx(
            `p-2 hover:bg-gray-700 rounded cursor-pointer flex justify-between items-center`,
            selectedChatId == chat.id && 'bg-gray-900'
          )}
          onClick={() => setChat(chat.id)}>
          <div>
            <div className="text-white font-medium">{chat.id}</div>
            <div className={`text-sm text-gray-500`}>{chat.created_at}</div>
          </div>
          <Trash2Icon className="text-red-600 size-5" />
        </div>
      ))}
    </>
  )
}
