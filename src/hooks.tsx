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
    mutationFn: async (data: { message: string; imageData?: string }) => {
      if (chatId == null) {
        const url = new URL('/api/chats/start', baseUrl)
        const body = JSON.stringify({ message: data.message, model, imageData: data.imageData })
        const resp = await fetch(url, { method: 'POST', body, headers: { 'Content-Type': 'application/json' } })
        return resp.json()
      }
      const url = new URL(`/api/chats/${chatId}/reply`, baseUrl)
      const body = JSON.stringify({ message: data.message, imageData: data.imageData })
      return fetch(url, { method: 'POST', body, headers: { 'Content-Type': 'application/json' } }).then((resp) =>
        resp.json()
      )
    },
    onError: (error, data) => {
      console.error(error)
      console.log('==data==')
      console.log(data)
      console.log('==data==')
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
    onClick: function () { }, // Callback after click
  }).showToast()
}
