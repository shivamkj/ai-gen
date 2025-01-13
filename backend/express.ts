import express from 'express'
import { deleteChat, getAllChats, getAllMessages, replyChat, startChat } from './server'

export const app = express()

// Define your Express routes
app.get('/api/test', (_, res) => {
  res.json({ message: 'OK' })
})
app.get('/api/chats', getAllChats)
app.post('/api/chats/start', startChat)
app.post('/api/chats/:id/reply', replyChat)
app.delete('/api/chats/:id', deleteChat)
app.get('/api/chats/:id/messages', getAllMessages)
