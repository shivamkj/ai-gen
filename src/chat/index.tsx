import { createContext, useState } from 'react'
import { Send, Bot, History, Settings, Sun, Moon } from 'lucide-react'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { ContextVal, initStore, StoreReturn, useStore } from './global-state'

const DARK_MODE_KEY = 'DARK_MODE'

const Ctx = createContext<ContextVal<typeof chatStore>>(null)

interface ChatState {
  chatHistory: { id: number; title: string; date: string }[]
}

interface ChatActions {}

function chatStore(set: (val: Partial<ChatState>) => void): StoreReturn<ChatState, ChatActions> {
  return {
    chatHistory: [],
    onInit: async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      set({
        chatHistory: [
          { id: 1, title: 'Previous Chat 1', date: '2024-01-06' },
          { id: 2, title: 'Previous Chat 2', date: '2024-01-07' },
        ],
      })
      console.log('onInit')
    },
  }
}

export const ChatInterface = () => {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [selectedModel, setSelectedModel] = useState('gpt-3.5')
  const [isDark, setIsDark] = useState(false)
  const storeValue = initStore(chatStore)

  function toggleDarkMode() {
    const isDarkMode = !isDark
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
      document.documentElement.style.colorScheme = 'dark'
    } else {
      document.documentElement.classList.remove('dark')
      document.documentElement.style.colorScheme = 'light'
    }
    localStorage.setItem(DARK_MODE_KEY, isDarkMode.toString())
    setIsDark(!isDark)
  }

  const handleSend = () => {
    if (!input.trim()) return

    const newMessage = {
      id: messages.length + 1,
      content: input,
      sender: 'user',
      timestamp: new Date().toISOString(),
    }

    setMessages([...messages, newMessage])
    setInput('')

    setTimeout(() => {
      const aiResponse = {
        id: messages.length + 2,
        content: `Response to: ${input}`,
        sender: 'ai',
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, aiResponse])
    }, 1000)
  }

  return (
    <Ctx.Provider value={storeValue}>
      <div className={`flex h-screen ${isDark ? 'dark bg-gray-900' : 'bg-gray-100'}`}>
        <div className={`w-64 border-r p-4 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
          <div className="flex items-center gap-2 mb-6">
            <Bot className={`h-6 w-6 ${isDark ? 'text-white' : ''}`} />
            <h1 className={`text-xl font-bold ${isDark ? 'text-white' : ''}`}>AI Chat</h1>
          </div>

          <Button className="w-full mb-4">New Chat</Button>

          <div className={`flex items-center gap-2 mb-4 ${isDark ? 'text-white' : ''}`}>
            <History className="h-4 w-4" />
            <span className="font-medium">Chat History</span>
          </div>

          <ScrollArea className="h-[calc(100vh-200px)]">
            <ChatHistory />
          </ScrollArea>
        </div>

        <div className="flex-1 flex flex-col">
          <div
            className={`p-4 border-b flex items-center justify-between ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
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

            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <ScrollArea className={`flex-1 p-4 ${isDark ? 'bg-gray-900' : ''}`}>
            {messages.map((message) => (
              <div key={message.id} className={`mb-4 ${message.sender === 'user' ? 'ml-auto' : 'mr-auto'}`}>
                <Card
                  className={`p-3 max-w-md ${
                    message.sender === 'user'
                      ? 'bg-blue-500 text-white ml-auto'
                      : isDark
                        ? 'bg-gray-800 text-white'
                        : 'bg-white'
                  }`}>
                  {message.content}
                </Card>
              </div>
            ))}
          </ScrollArea>

          <div className={`p-4 border-t ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type your message..."
                className={`flex-1 ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder:text-gray-400' : ''}`}
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

function ChatHistory() {
  const chatHistory = useStore(Ctx, (s) => s.chatHistory)
  console.log('chatHistory', chatHistory)

  return (
    <>
      {chatHistory.map((chat) => (
        <div key={chat.id} className={`p-2 hover:bg-gray-700 rounded cursor-pointer dark:text-gray-300`}>
          <div className="font-medium">{chat.title}</div>
          <div className={`text-sm text-gray-500 dark:text-gray-400`}>{chat.date}</div>
        </div>
      ))}
    </>
  )
}
