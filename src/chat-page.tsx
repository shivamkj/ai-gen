import { createContext, useEffect, useRef } from 'react'
import { Send, Bot, History } from 'lucide-react'
import { ContextVal, initStore, StoreI, SetState } from './global-state'
import { useStore } from 'zustand'
import clsx from 'clsx'
import useAICompletion from '@/hooks'
import { Loader } from '@/components/loader'
import { ChatHistory } from '@/components/chat-history'
import { models, SelectModel } from '@/components/select-models'
import { Messages } from '@/components/messages'

export const Ctx = createContext<ContextVal<typeof chatStore>>(null)

export interface ChatStore {
  seletedChatId: number | undefined
  selectedModel: string
  setChat: (chatId: number | undefined) => void
  changeModel: (modelId: string) => void
}

function chatStore(set: SetState<ChatStore>): StoreI<ChatStore> {
  return {
    seletedChatId: undefined,
    selectedModel: models[0].modelId,
    changeModel: (modelId) => set((prev) => ({ ...prev, selectedModel: modelId })),
    setChat: (chatId) => set((prev) => ({ ...prev, seletedChatId: chatId })),
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

  const { mutate, isPending } = useAICompletion(selectedChatId, storeValue)

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
