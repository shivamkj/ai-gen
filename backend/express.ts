import express from 'express'

export const expressApp = express()

// Define your Express routes
expressApp.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from Express!' })
})
