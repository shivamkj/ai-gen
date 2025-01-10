import dotenv from 'dotenv'
import { readFileSync } from 'node:fs'
const envSecret = dotenv.parse(readFileSync('./.env.development.local'))

import { OpenAI } from 'openai'
import type { Request, Response } from 'express'
import { SQLiteClient } from './sqlite'

const db = new SQLiteClient('./chats.db')
const openai = new OpenAI({ baseURL: 'https://api.deepseek.com/v1', apiKey: envSecret.DEEPSEEK_API_KEY })

// Create tables
await db.serialize(async () => {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS chats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      model TEXT NOT NULL,
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
  const { model = 'deepseek-chat' } = req.body

  const result = await db.execute('INSERT INTO chats (model) VALUES (?)', [model])

  res.json({
    chatId: result.lastID,
    model,
    createdAt: new Date().toISOString(),
  })
}

// Reply to chat with streaming
export async function replyToChat(req: Request, res: Response) {
  console.log('eejs')
  const chatId = req.params.id
  const { message } = req.query

  if (!message) {
    return res.status(400).json({ error: 'Message is required' })
  }

  // Save user message
  await db.execute('INSERT INTO messages (chat_id, role, content) VALUES (?, ?, ?)', [chatId, 'user', message])

  // Get model used for this chat
  const { model } = await db.queryOne<{ model: string }>('SELECT model FROM chats WHERE id = ?', [chatId])

  type MessageRows = { role: string; content: string }

  const messages = await db.query<MessageRows>(
    'SELECT role, content FROM messages WHERE chat_id = ? ORDER BY created_at ASC',
    [chatId]
  )

  try {
    const completion = await openai.chat.completions.create({
      model: model,
      messages: messages as any,
      stream: false,
    })

    const response = {
      content: completion.choices[0]?.message?.content || '',
      input: completion.usage?.prompt_tokens,
      output: completion.usage?.completion_tokens,
    }

    // Save assistant response
    await db.execute('INSERT INTO messages (chat_id, role, content) VALUES (?, ?, ?)', [
      chatId,
      'assistant',
      response.content,
    ])

    return res.json(response)
  } catch (error) {
    res.status(500).json({ error: error })
  }
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
