import { createContext, useRef } from 'react'
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
function handleTextInputSize(e: React.FormEvent<HTMLTextAreaElement>) {
  const inputElement = e.target as HTMLTextAreaElement
  inputElement.style.height = 'auto'
  inputElement.style.height = inputElement.scrollHeight + 'px'
  e.stopPropagation()
}

export const ChatInterface = () => {
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const storeValue = initStore<StoreI<ChatStore>>(chatStore)
  const selectedChatId = useStore(storeValue, (s) => s.seletedChatId)
  const { setChat } = storeValue.getState()
  const { mutate, isPending } = useAICompletion(selectedChatId, storeValue)

  function handleSend() {
    if (inputRef.current == null) return
    const input = inputRef.current!.value.trim()
    inputRef.current.value = ''
    if (!input) return
    mutate(input)
  }

  return (
    <Ctx.Provider value={storeValue}>
      <div className="flex h-screen dark bg-gray-950">
        <div className="w-64 border-r p-4 bg-gray-900 border-gray-700 h-screen overflow-y-auto">
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

          <ChatHistory selectedChatId={selectedChatId} />
        </div>

        <div className="flex-1 flex flex-col max-h-screen max-w-[calc(100vw-16rem)]">
          <SelectModel chatId={selectedChatId} />

          <Messages chatId={selectedChatId} />

          {isPending && <Loader />}

          <div className="p-4 border-t bg-gray-900 border-gray-500">
            <div className="flex gap-2 items-center">
              <textarea
                // onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                className={clsx(
                  'bg-transparent text-sm text-white placeholder:text-zinc-400 focus-visible:ring-gray-300 rounded-md border p-2 focus-visible:ring-1 disabled:opacity-50',
                  'h-auto max-h-96 w-full overflow-hidden resize-none flex-1'
                )}
                placeholder="Type your message..."
                onInput={handleTextInputSize}
                ref={inputRef}
              />
              <button className="border border-gray-500 rounded px-6 size-16" onClick={handleSend}>
                <Send className="h-4 w-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Ctx.Provider>
  )
}
