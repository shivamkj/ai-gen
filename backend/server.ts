import type { Request, Response } from 'express'
import { SQLiteClient } from './sqlite'
import { AiResponse, bedrock, deepSeek } from './ai-apis'

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

export async function processChat(chatId: string, message: string, model: string) {
  return db.transaction(async () => {
    // Save user message
    await db.execute('INSERT INTO messages (chat_id, role, content) VALUES (?, ?, ?)', [chatId, 'user', message])

    type MessageRows = { role: string; content: string }

    const messages = await db.query<MessageRows>(
      'SELECT role, content FROM messages WHERE chat_id = ? ORDER BY created_at ASC',
      [chatId]
    )

    let aiResponse: AiResponse

    if (model.startsWith('deepseek')) {
      aiResponse = await deepSeek(model, [messages[messages.length - 1]])
    } else if (model.startsWith('us.')) {
      aiResponse = await bedrock(model, [messages[messages.length - 1]])
    } else {
      throw new Error('Unknown model error')
    }

    // Save assistant response
    await db.execute('INSERT INTO messages (chat_id, role, content) VALUES (?, ?, ?)', [
      chatId,
      'assistant',
      aiResponse.content,
    ])

    return aiResponse
  })
}

export async function startChat(req: Request, res: Response) {
  const { message, model } = req.query
  if (!message || !model) throw new Error('message & model startChat')

  const result = await db.execute('INSERT INTO chats (model) VALUES (?)', [model])
  const chatId = result.lastID as any

  const response = await processChat(chatId, message as string, model as string)
  res.json({ chat: { id: chatId, model, createdAt: new Date().toISOString() }, response })
}

// Reply to chat with streaming
export async function replyChat(req: Request, res: Response) {
  const { id } = req.params
  const { message } = req.query
  if (!message) throw new Error('chatId & message startChat')

  // Get model used for this chat
  const { model } = await db.queryOne<{ model: string }>('SELECT model FROM chats WHERE id = ?', [id])

  const response = await processChat(id, message as string, model)
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
  res.json(messges)
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
  res.json(chats)
}

export async function deleteChat(req: Request, res: Response) {
  const chatId = req.params.id

  await db.transaction(async () => {
    await db.execute('DELETE FROM messages WHERE chat_id = ?;', [chatId])
    await db.execute('DELETE FROM chats WHERE id = ?;', [chatId])
  })

  res.json('"OK"')
}

process.on('SIGINT', () => {
  db.close()
  process.exit()
})
