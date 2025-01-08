import { createContext, useEffect, useState } from 'react'
import { Send, Bot, History, Trash2Icon } from 'lucide-react'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { ContextVal, initStore, StoreI, SetState, useAction, useStoreX } from './global-state'
import { useStore } from 'zustand'
import { useQueries, useQuery } from '@tanstack/react-query'
import clsx from 'clsx'

const Ctx = createContext<ContextVal<typeof chatStore>>(null)

type ChatHistory = { id: number; title: string; date: string }

interface ChatStore {
  // chatHistory: { id: number; title: string; date: string }[]
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
  // const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const storeValue = initStore<StoreI<ChatStore>>(chatStore)
  const selectedChatId = useStore(storeValue, (s) => s.seletedChatId)
  const { setChat } = storeValue.getState()

  useEffect(() => {
    document.documentElement.classList.add('dark')
    document.documentElement.style.colorScheme = 'dark'
  }, [])

  console.log(Math.random(), selectedChatId)

  const handleSend = () => {
    if (!input.trim()) return

    // const newMessage = {
    //   id: messages.length + 1,
    //   content: input,
    //   sender: 'user',
    //   timestamp: new Date().toISOString(),
    // }

    // setMessages([...messages, newMessage])
    setInput('')

    // setTimeout(() => {
    //   const aiResponse = {
    //     id: messages.length + 2,
    //     content: `Response to: ${input}`,
    //     sender: 'ai',
    //     timestamp: new Date().toISOString(),
    //   }
    //   // setMessages((prev) => [...prev, aiResponse])
    // }, 1000)
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
          <Messages selectedChatId={selectedChatId} />

          <div className="p-4 border-t bg-gray-800 border-gray-700">
            <SelectModel selectedChatId={selectedChatId} />

            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
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

function Messages({ selectedChatId }: { selectedChatId: number | undefined }) {
  const [ress] = useQueries({
    queries: [
      {
        queryKey: ['chat', selectedChatId],
        queryFn: () => {
          if (selectedChatId == null) return null
          return fetch(`http://localhost:5173/api/chats/${selectedChatId}`).then((res) => res.json())
        },
      },
    ],
  })

  if (ress.data == null) return

  const messages = ress.data

  console.log('ddddd', messages)

  return (
    <ScrollArea className={`flex-1 p-4 bg-gray-900`}>
      {messages.map((message) => (
        <div key={message.id} className={`mb-4 ${message.role === 'user' ? 'ml-auto' : 'mr-auto'}`}>
          <Card
            className={`p-3 max-w-md ${
              message.role === 'user' ? 'bg-blue-500 text-white ml-auto' : 'bg-gray-800 text-white'
            }`}>
            {message.content}
          </Card>
        </div>
      ))}
    </ScrollArea>
  )
}

function SelectModel({ selectedChatId }: { selectedChatId: number | undefined }) {
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
    queryFn: () => fetch('http://localhost:5173/api/chats/').then((res) => res.json()),
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
