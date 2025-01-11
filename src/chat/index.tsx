import { createContext, useEffect, useRef } from 'react'
import { Send, Bot, History, Trash2Icon } from 'lucide-react'
import { ScrollArea } from './scroll-area'
import { ContextVal, initStore, StoreI, SetState, useAction, useStoreX, baseUrl } from './global-state'
import { useStore } from 'zustand'
import { useQuery } from '@tanstack/react-query'
import clsx from 'clsx'
import useAICompletion from './use-completion'
import { Avatar } from './avatar'
import { Loader } from './loader'
import { Markdown } from './markdown'

const Ctx = createContext<ContextVal<typeof chatStore>>(null)

type ChatHistory = { id: number; title: string; date: string }

interface ChatStore {
  seletedChatId: number | undefined
  selectedModel: string
  setChat: (chatId: number | undefined) => void
  changeModel: (modelId: string) => void
}

function chatStore(set: SetState<ChatStore>): StoreI<ChatStore> {
  return {
    seletedChatId: undefined,
    selectedModel: 'gpt-3.5',
    changeModel: (modelId) => set((prev) => ({ ...prev, selectedModel: modelId })),
    setChat: (chatId) => set((prev) => ({ ...prev, seletedChatId: chatId })),
    onInit: async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      console.log('onInit')
    },
  }
}

export const ChatInterface = () => {
  const inputRef = useRef<HTMLInputElement>(null)
  const storeValue = initStore<StoreI<ChatStore>>(chatStore)
  const selectedChatId = useStore(storeValue, (s) => s.seletedChatId)
  const { setChat } = storeValue.getState()

  useEffect(() => {
    document.documentElement.classList.add('dark')
    document.documentElement.style.colorScheme = 'dark'
  }, [])

  const { mutate, isPending } = useAICompletion(selectedChatId)

  const handleSend = () => {
    if (inputRef.current == null) return
    const input = inputRef.current!.value.trim()
    inputRef.current.value = ''
    if (!input) return
    mutate(input)
  }

  return (
    <Ctx.Provider value={storeValue}>
      <div className="flex h-screen dark bg-gray-900">
        <div className="w-64 border-r p-4 bg-gray-800 border-gray-700">
          <div className="flex items-center gap-2 mb-6">
            <Bot className="h-6 w-6 text-white" />
            <h1 className="text-xl font-bold text-white">AI Chat</h1>
          </div>

          <button
            type="button"
            className="w-full text-white focus:ring-4 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-4 bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-blue-800"
            onClick={() => setChat(undefined)}>
            New Chat
          </button>

          <div className="flex items-center gap-2 mb-4 text-white">
            <History className="h-4 w-4" />
            <span className="font-medium">Chat History</span>
          </div>
          <div className="h-[calc(100vh-200px)]">
            <ChatHistory selectedChatId={selectedChatId} />
          </div>
        </div>

        <div className="flex-1 flex flex-col max-h-screen">
          <SelectModel chatId={selectedChatId} />

          <Messages chatId={selectedChatId} />

          {isPending && <Loader />}

          <div className="p-4 border-t bg-gray-800 border-gray-700">
            <div className="flex gap-2">
              <input
                // onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                className={clsx(
                  'border-gray-500 file:text-zinc-50 placeholder:text-zinc-400 focus-visible:ring-zinc-300 flex h-9 w-full rounded-md border bg-transparent px-3 py-1 shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50 text-sm',
                  'flex-1 bg-gray-700 border-gray-600 text-white placeholder:text-gray-400'
                )}
                placeholder="Type your message..."
                ref={inputRef}
              />
              <button className="border border-gray-500 rounded px-6" onClick={handleSend}>
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Ctx.Provider>
  )
}

function Messages({ chatId }: { chatId: number | undefined }) {
  const { data } = useQuery({
    queryKey: ['chat', chatId],
    enabled: chatId != null,
    queryFn: () => fetch(`${baseUrl}/api/chats/${chatId}`).then((res) => res.json()),
  })

  const scrollAreaRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    if (!scrollAreaRef.current) return
    const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
    if (scrollContainer) scrollContainer.scrollTop = scrollContainer.scrollHeight
  }

  useEffect(() => {
    scrollToBottom()
  }, [data])

  if (data == null) return <div className="flex-1 text-2xl"></div>

  return (
    <ScrollArea outerClass="flex-1 bg-gray-900" innerClass='p-4' ref={scrollAreaRef}>
      {data.map((message, index) => (
        <div key={index} className={`mb-4 flex ${message.role === 'assistant' ? 'flex-row-reverse justify-end' : ''}`}>
          <div
            className={clsx(
              `border-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 text-zinc-50 rounded-xl border bg-white shadow p-6`,
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

const models = [
  {
    name: 'Deepseek v3',
    modelId: 'deepseek-chat	',
    provider: 'deepseek',
  },
  {
    name: 'Claude 3.5 Sonnet',
    modelId: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
    provider: 'bedrock',
  },
]

function SelectModel({ chatId: selectedChatId }: { chatId: number | undefined }) {
  const selectedModel = useStoreX(Ctx, (s) => s.selectedModel)
  const { changeModel } = useAction(Ctx)

  return (
    <div className="p-4 border-b flex items-center justify-between bg-gray-800 border-gray-700">
      {selectedChatId == undefined && (
        <select
          name="models"
          id="models"
          className="w-48 border text-sm rounded-lg block p-2.5 bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500"
          onChange={(e) => changeModel(e.target.value)}
          value={selectedModel}>
          {models.map((m, index) => (
            <option key={index} value={m.modelId}>
              {m.name}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}

function ChatHistory({ selectedChatId }: { selectedChatId: number | undefined }) {
  const { isPending, data } = useQuery<ChatHistory[]>({
    queryKey: ['chatHistory'],
    queryFn: () => fetch(`${baseUrl}/api/chats/`).then((res) => res.json()),
  })
  const { setChat } = useAction(Ctx)

  if (isPending) return <div>Loading</div>

  return (
    <>
      {data!.map((chat) => (
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
