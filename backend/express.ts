import express from 'express'
import { getAllChats, getChatHistory, replyToChat, startChat } from './server'

export const app = express()

app.use(express.json())

// Define your Express routes
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from Express!' })
})

app.post('/api/chats', startChat)
app.post('/api/chats/:id/reply', replyToChat)
app.get('/api/chats/:id', getChatHistory)
app.get('/api/chats', getAllChats)
