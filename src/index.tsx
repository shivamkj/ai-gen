import { render } from 'preact'
import './index.css'
// @ts-expect-error
import Temp from './temp'
import { ChatInterface } from './chat-page'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

render(
  <QueryClientProvider client={queryClient}>
    {/* @ts-expect-error */}
    <ChatInterface />
  </QueryClientProvider>, document.getElementById('root')!
)
