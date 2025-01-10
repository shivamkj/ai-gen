import type { Request, Response } from 'express'
import { SQLiteClient } from './sqlite'
import { AiResponse, deepSeek } from './ai-apis'

const db = new SQLiteClient('./chats.db')

// Create tables
await db.transaction(async () => {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS chats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      model TEXT NOT NULL,
      provider TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await db.execute(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id INTEGER,
      role TEXT CHECK(role IN ('user', 'assistant', 'system')),
      content TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(chat_id) REFERENCES chats(id)
    )
  `)
})

// Start new chat
export async function startChat(req: Request, res: Response) {
  const { model = 'deepseek-chat', provider } = req.body

  if (!provider || !model) throw new Error('model & provider startChat')

  const result = await db.execute('INSERT INTO chats (model) VALUES (?)', [model])

  res.json({
    chatId: result.lastID,
    model,
    createdAt: new Date().toISOString(),
  })
}

// Reply to chat with streaming
export async function replyToChat(req: Request, res: Response) {
  const chatId = req.params.id
  const { message } = req.query

  if (!message) {
    return res.status(400).json({ error: 'Message is required' })
  }

  const response = await db.transaction(async () => {
    // Save user message
    await db.execute('INSERT INTO messages (chat_id, role, content) VALUES (?, ?, ?)', [chatId, 'user', message])

    // Get model used for this chat
    const { model } = await db.queryOne<{ model: string }>('SELECT model FROM chats WHERE id = ?', [chatId])

    type MessageRows = { role: string; content: string }

    const messages = await db.query<MessageRows>(
      'SELECT role, content FROM messages WHERE chat_id = ? ORDER BY created_at ASC',
      [chatId]
    )

    let aiResponse: AiResponse

    switch (model) {
      case 'deepseek-chat':
        aiResponse = await deepSeek('deepseek-chat', [messages[messages.length - 1]])
        break
      default:
        throw new Error('Unknown error')
    }

    // Save assistant response
    await db.execute('INSERT INTO messages (chat_id, role, content) VALUES (?, ?, ?)', [
      chatId,
      'assistant',
      aiResponse.content,
    ])

    return aiResponse
  })

  res.json(response)
}

// Get chat history
export async function getChatHistory(req: Request, res: Response) {
  const chatId = req.params.id

  const messges = await db.query(
    `SELECT m.id, m.role, m.content, m.created_at 
         FROM messages m
         WHERE m.chat_id = ?
         ORDER BY m.created_at ASC`,
    [chatId]
  )
  return res.json(messges)
}

export async function getAllChats(_: Request, res: Response) {
  const chats = await db.query(
    `SELECT c.id, c.model, c.created_at, 
                  COUNT(m.id) as message_count
           FROM chats c
           LEFT JOIN messages m ON c.id = m.chat_id
           GROUP BY c.id
           ORDER BY c.created_at DESC`
  )
  return res.json(chats)
}

process.on('SIGINT', () => {
  db.close()
  process.exit()
})
