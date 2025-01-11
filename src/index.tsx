import { StrictMode } from 'react'
// @ts-expect-error
import { createRoot } from 'react-dom/client'
import './index.css'
import 'toastify-js/src/toastify.css'
// @ts-expect-error
import Temp from './temp'
import { ChatInterface } from './chat-page'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ChatInterface />
    </QueryClientProvider>
  </StrictMode>
)
