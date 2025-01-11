import { useQueryClient, useMutation } from '@tanstack/react-query'
// @ts-expect-error
import Toastify from 'toastify-js'

export const baseUrl = `http://${window.location.host}`

export default function useAICompletion(chatId: number | undefined) {
  const queryClient = useQueryClient()

  const { mutate, error, isPending } = useMutation({
    mutationKey: ['chat', chatId],
    mutationFn: async (prompt: string) => {
      const url = new URL(`/api/chats/${chatId}/reply`, baseUrl)
      url.searchParams.append('message', prompt)
      console.log(url.toString())
      const resp = await fetch(url, { method: 'POST' }).then((res) => res.json())
      return resp
    },
    onError: (error) => {
      console.error(error)
      showErrorToast(`Unexpected Error Occured: ${error?.name}: ${error?.message}`)
    },
    onSuccess: () => {
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
