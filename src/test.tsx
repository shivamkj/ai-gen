import { StrictMode } from 'react'
// @ts-expect-error
import { createRoot } from 'react-dom/client'
import './index.css'
// @ts-expect-error
import Temp from './temp'
import './test.css'
import 'toastify-js/src/toastify.css'
import { ChatInterface } from './chat'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export const TestPage = () => {
  return (
    <ChatInterface />
    // <Frame>
    //  <div></div>
    // </Frame>
  )
}

function Frame({ children }: { children: React.ReactNode }) {
  return <div className="flex w-full items-center justify-center p-4">{children}</div>
}

const queryClient = new QueryClient()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <TestPage />
    </QueryClientProvider>
  </StrictMode>
)
