import express from 'express'
import { getAllChats, getChatHistory, replyToChat, startChat } from './server'

export const app = express()

app.use(express.json())
app.use((_, res, next) => {
  res.removeHeader('x-powered-by')
  next()
})

// Define your Express routes
app.get('/api/hello', (_, res) => {
  res.json({ message: 'Hello from Express!' })
})

app.post('/api/chats', startChat)
app.post('/api/chats/:id/reply', replyToChat)
app.get('/api/chats/:id', getChatHistory)
app.get('/api/chats', getAllChats)
