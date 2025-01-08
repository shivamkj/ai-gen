import dotenv from 'dotenv'
import { readFileSync } from 'node:fs'
const envSecret = dotenv.parse(readFileSync('./.env.development.local'))

import sqlite3 from 'sqlite3'
import { OpenAI } from 'openai'
import type { Request, Response } from 'express'

const db = new sqlite3.Database('./chat.db')
const openai = new OpenAI({ baseURL: 'https://api.deepseek.com/v1', apiKey: envSecret.DEEPSEEK_API_KEY })

// Create tables
db.serialize(() => {
  db.run(`
        CREATE TABLE IF NOT EXISTS chats (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          model TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `)

  db.run(`
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

  db.run('INSERT INTO chats (model) VALUES (?)', [model], function (err) {
    if (err) return res.status(500).json({ error: err.message })

    res.json({
      chatId: this.lastID,
      model,
      createdAt: new Date().toISOString(),
    })
  })
}

// Reply to chat with streaming
export async function replyToChat(req: Request, res: Response) {
  const chatId = req.params.id
  const { message } = req.body

  if (!message) {
    return res.status(400).json({ error: 'Message is required' })
  }

  // Save user message
  db.run('INSERT INTO messages (chat_id, role, content) VALUES (?, ?, ?)', [chatId, 'user', message])

  db.get('SELECT model FROM chats WHERE id = ?', [chatId], (err, row) => {
    if (err) throw err
    const model = row?.model

    console.log('model', model)

    db.all(
      'SELECT role, content FROM messages WHERE chat_id = ? ORDER BY created_at ASC',
      [chatId],
      async (err, rows) => {
        if (err) return res.status(500).json({ error: err.message })

        const messages = rows.map((row) => ({
          role: row.role,
          content: row.content,
        }))

        try {
          console.log({
            model: model,
            messages,
            stream: true,
          })
          const stream = await openai.chat.completions.create({
            model: model,
            messages,
            stream: true,
          })

          res.setHeader('Content-Type', 'text/event-stream')
          res.setHeader('Cache-Control', 'no-cache')
          res.setHeader('Connection', 'keep-alive')

          let fullResponse = ''

          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || ''
            fullResponse += content
            res.write(`data: ${JSON.stringify({ content })}\n\n`)
          }

          // Save assistant response
          db.run('INSERT INTO messages (chat_id, role, content) VALUES (?, ?, ?)', [chatId, 'assistant', fullResponse])

          res.end()
        } catch (error) {
          res.status(500).json({ error: error.message })
        }
      }
    )
  })
}

// Get chat history
export function getChatHistory(req: Request, res: Response) {
  const chatId = req.params.id

  db.all(
    `SELECT m.id, m.role, m.content, m.created_at 
         FROM messages m
         WHERE m.chat_id = ?
         ORDER BY m.created_at ASC`,
    [chatId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message })
      res.json(rows)
    }
  )
}

export function getAllChats(req: Request, res: Response) {
  db.all(
    `SELECT c.id, c.model, c.created_at, 
                  COUNT(m.id) as message_count
           FROM chats c
           LEFT JOIN messages m ON c.id = m.chat_id
           GROUP BY c.id
           ORDER BY c.created_at DESC`,
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message })
      res.json(rows)
    }
  )
}

process.on('SIGINT', () => {
  db.close()
  process.exit()
})
