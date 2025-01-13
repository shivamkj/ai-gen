import type { Request, Response } from 'express'
import { SQLiteClient } from './sqlite'
import { AiResponse, bedrock, deepSeek } from './ai-apis'
import { generateTitle } from './title-gen'

const db = new SQLiteClient('./chats.db')

// Create tables
await db.transaction(async () => {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS chats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      model TEXT NOT NULL,
      title TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await db.execute(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id INTEGER,
      role TEXT CHECK(role IN ('user', 'assistant', 'system')),
      content TEXT,
      input_token INTEGER,
      output_token INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(chat_id) REFERENCES chats(id)
    )
  `)
})

export async function processChat(chatId: string, message: string, model: string) {
  return db.transaction(async () => {
    type MessageRows = { role: string; content: string }
    // Get old messages
    const messages = await db.query<MessageRows>(
      'SELECT role, content FROM messages WHERE chat_id = ? ORDER BY created_at ASC',
      [chatId]
    )
    messages.push({ role: 'user', content: message }) // Add new message

    let aiResponse: AiResponse

    if (model.startsWith('deepseek')) {
      aiResponse = await deepSeek(model, messages)
    } else if (model.startsWith('us.')) {
      aiResponse = await bedrock(model, messages)
    } else {
      throw new Error('Unknown model error')
    }

    // Save user & assistant response
    await db.execute(
      'INSERT INTO messages (chat_id, role, content, input_token, output_token) VALUES (?, ?, ?, NULL, NULL), (?, ?, ?, ?, ?)',
      [
        chatId,
        'user',
        message,
        chatId,
        'assistant',
        aiResponse.content,
        aiResponse.input_token,
        aiResponse.output_token,
      ]
    )

    return aiResponse
  })
}

const systemPrompt = "You are an AI programming assistant. Don't explain code unless asked. "

export async function startChat(req: Request, res: Response) {
  const { message, model } = req.query
  if (!message || !model) throw new Error('message & model startChat')

  const title = generateTitle(message as string)

  const result = await db.execute('INSERT INTO chats (model, title) VALUES (?, ?)', [model, title])
  const chatId = result.lastID as any

  const finalMessage = systemPrompt + message
  const response = await processChat(chatId, finalMessage, model as string)
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

// Get chat messages
export async function getAllMessages(req: Request, res: Response) {
  const chatId = req.params.id

  const messges = await db.query(
    `SELECT m.id, m.role, m.content, m.created_at, m.input_token, m.output_token
         FROM messages m
         WHERE m.chat_id = ?
         ORDER BY m.created_at ASC`,
    [chatId]
  )
  res.json(messges)
}

export async function getAllChats(_: Request, res: Response) {
  const chats = await db.query(`SELECT c.id, c.model, c.title, c.created_at FROM chats c ORDER BY c.created_at DESC`)
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
