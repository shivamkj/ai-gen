import express from 'express'
import { deleteChat, deleteMessage, getAllChats, getAllMessages, replyChat, startChat } from './server.ts'

const PORT = 6712
export const app = express()

// Define your Express routes
app.get('/api/test', (_, res) => {
  res.json({ message: 'OK' })
})

if (process.argv[1].endsWith('backend/express.ts')) {
  app.use(express.static('dist'))
  app.listen(PORT, () => console.log(`App listening on port ${PORT} | Link: http://localhost:6712/`))
}

app.get('/api/chats', getAllChats)
app.post('/api/chats/start', startChat)
app.post('/api/chats/:id/reply', replyChat)
app.delete('/api/chats/:id', deleteChat)
app.get('/api/chats/:id/messages', getAllMessages)
app.delete('/api/messages/:id', deleteMessage)
