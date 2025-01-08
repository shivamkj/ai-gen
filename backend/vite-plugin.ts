import type { Request, Response } from 'express'
import { ViteDevServer } from 'vite'
import { app } from './express'

export function viteExpressPlugin() {
  return {
    name: 'vite-express-plugin',
    configureServer(vite: ViteDevServer) {
      // Use Express as middleware for Vite
      vite.middlewares.use((req, res, next) => {
        // Check if the request matches an Express route
        if (req.url?.startsWith('/api')) {
          return app(req as Request, res as Response, next) // Pass the request to Express
        } else {
          next() // Let Vite handle other requests
        }
      })
    },
  }
}
