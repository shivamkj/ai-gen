import { useQueryClient, useMutation } from '@tanstack/react-query'
import { baseUrl } from './global-state'
import { toast } from '@/hooks/use-toast'

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
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: `${error.name}: ${error.message}`,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', chatId] })
    },
  })

  return { mutate, error, isPending } as const
}
