import { useQuery, useMutation, invalidateQuery } from '@/query'
import { baseUrl } from '@/hooks'
import { Ctx } from '@/chat-page'
import { TrashIcon } from '@/icons'
import { useAction } from '@/global-state'

type ChatHistory = { id: number; title: string; date: string }

export function ChatHistory({ selectedChatId }: { selectedChatId: number | undefined }) {
  const { isPending, data } = useQuery<ChatHistory[]>({
    queryKey: ['chatHistory'] as const,
    queryFn: () => fetch(`${baseUrl}/api/chats`).then((res) => res.json()),
  })
  const { setChat } = useAction(Ctx)

  const { mutate: deleteChat } = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`${baseUrl}/api/chats/${id}`, { method: 'DELETE' })
      return response.json()
    },
    onSuccess: (_, id) => {
      if (id == selectedChatId) setChat(undefined)
      invalidateQuery(['chatHistory'])
    },
  })

  function handleDeleteChat(messageId: number) {
    const confirmed = window.confirm('Are you sure?')
    if (confirmed) deleteChat(messageId)
  }

  if (isPending || !data) return <div>Loading</div>

  return (
    <>
      {data.map((chat: any) => (
        <div
          key={chat.id}
          className={`p-2 hover:bg-gray-700 rounded-sm cursor-pointer flex justify-between items-center${selectedChatId == chat.id ? ' bg-gray-800' : ''}`}
          onClick={() => setChat(chat.id)}>
          <div>
            <div className="text-white font-medium line-clamp-2" style={{ overflowWrap: 'anywhere' }}>
              {chat.title}
            </div>
            <div className="text-sm text-gray-500">{chat.created_at}</div>
          </div>
          <TrashIcon className="text-red-600 size-5 shrink-0" onClick={() => handleDeleteChat(chat.id)} />
        </div>
      ))}
    </>
  )
}
