import { useQueryClient, useMutation } from '@tanstack/react-query'
// @ts-expect-error
import Toastify from 'toastify-js'
import { ChatStore } from './chat-page'
import { StoreI } from './global-state'
import { StoreApi, useStore } from 'zustand'

export const baseUrl = `http://${window.location.host}`

export default function useAICompletion(chatId: number | undefined, chatStore: StoreApi<StoreI<ChatStore>>) {
  const queryClient = useQueryClient()

  const model = useStore(chatStore, (s) => s.selectedModel)
  const { setChat } = chatStore.getState()

  const { mutate, error, isPending } = useMutation({
    mutationKey: ['chat', chatId],
    mutationFn: async (prompt: string) => {
      if (chatId == null) {
        const url = new URL('/api/chats/start', baseUrl)
        const body = JSON.stringify({ message: prompt, model })
        const resp = await fetch(url, { method: 'POST', body, headers: { 'Content-Type': 'application/json' } })
        return resp.json()
      }
      const url = new URL(`/api/chats/${chatId}/reply`, baseUrl)
      url.searchParams.append('message', prompt)
      return fetch(url, { method: 'POST' }).then((resp) => resp.json())
    },
    onError: (error, prompt) => {
      console.error(error)
      console.log('==prompt==')
      console.log(prompt)
      console.log('==prompt==')
      showErrorToast(`Unexpected Error Occured: ${error?.name}: ${error?.message}`)
    },
    onSuccess: (data) => {
      const createdChatId = data?.chat?.id
      if (createdChatId != null) {
        setChat(createdChatId)
        queryClient.invalidateQueries({ queryKey: ['chatHistory'] })
      }
      queryClient.invalidateQueries({ queryKey: ['chat', chatId] })
    },
  })

  return { mutate, error, isPending } as const
}

function showErrorToast(message: string) {
  Toastify({
    text: message,
    duration: 8000,
    newWindow: true,
    close: true,
    gravity: 'top',
    position: 'left',
    stopOnFocus: true,
    style: { background: 'red' },
    onClick: function () {}, // Callback after click
  }).showToast()
}
