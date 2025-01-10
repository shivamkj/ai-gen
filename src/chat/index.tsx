import { createContext, useEffect, useRef } from 'react'
import { Send, Bot, History, Trash2Icon } from 'lucide-react'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { ContextVal, initStore, StoreI, SetState, useAction, useStoreX, baseUrl } from './global-state'
import { useStore } from 'zustand'
import { useQuery } from '@tanstack/react-query'
import clsx from 'clsx'
import useAICompletion from './use-completion'
import Markdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { a11yDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Loader } from './components'

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

          <Button className="w-full mb-4" onClick={() => setChat(undefined)}>
            New Chat
          </Button>

          <div className="flex items-center gap-2 mb-4 text-white">
            <History className="h-4 w-4" />
            <span className="font-medium">Chat History</span>
          </div>
          <ScrollArea className="h-[calc(100vh-200px)]">
            <ChatHistory selectedChatId={selectedChatId} />
          </ScrollArea>
        </div>

        <div className="flex-1 flex flex-col">
          <SelectModel chatId={selectedChatId} />

          <Messages chatId={selectedChatId} />

          {isPending && <Loader />}

          <div className="p-4 border-t bg-gray-800 border-gray-700">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                // onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type your message..."
                className="flex-1 bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
              />
              <Button onClick={handleSend}>
                <Send className="h-4 w-4" />
              </Button>
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
    <ScrollArea className={`flex-1 p-4 bg-gray-900`} ref={scrollAreaRef}>
      {data.map((message, index) => (
        <div key={index} className={`mb-4 flex ${message.role === 'assistant' ? 'flex-row-reverse justify-end' : ''}`}>
          <Card
            className={`p-6 ${message.role === 'user' ? 'bg-blue-500 text-white ml-auto' : 'bg-gray-800 text-white'}`}>
            <Markdown
              components={{
                code(props) {
                  const { children, className, node, ...rest } = props
                  const match = /language-(\w+)/.exec(className || '')
                  return match ? (
                    <SyntaxHighlighter
                      {...rest}
                      PreTag="div"
                      children={String(children).replace(/\n$/, '')}
                      language={match[1]}
                      style={a11yDark}
                    />
                  ) : (
                    <code {...rest} className={className}>
                      {children}
                    </code>
                  )
                },
              }}>
              {message.content}
            </Markdown>
          </Card>
          <Avatar className="mx-6">
            <AvatarFallback className="text-sm">{message.role === 'user' ? 'YOU' : 'AI'}</AvatarFallback>
          </Avatar>
        </div>
      ))}
    </ScrollArea>
  )
}

function SelectModel({ chatId: selectedChatId }: { chatId: number | undefined }) {
  const selectedModel = useStoreX(Ctx, (s) => s.selectedModel)
  const { changeModel } = useAction(Ctx)

  return (
    <div className="p-4 border-b flex items-center justify-between bg-gray-800 border-gray-700">
      {selectedChatId == undefined && (
        <Select value={selectedModel} onValueChange={changeModel}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="gpt-3.5">GPT-3.5</SelectItem>
              <SelectItem value="gpt-4">GPT-4</SelectItem>
              <SelectItem value="claude">Claude</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
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
            <div className="text-white font-medium text-gray-900">{chat.id}</div>
            <div className={`text-sm text-gray-500`}>{chat.created_at}</div>
          </div>
          <Trash2Icon className="text-red-600 size-5" />
        </div>
      ))}
    </>
  )
}
