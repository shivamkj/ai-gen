import { useState, useEffect, useRef } from 'preact/hooks'

type QueryKey = readonly unknown[]

const listeners = new Map<string, Set<() => void>>()

function keyStr(key: QueryKey) {
  return JSON.stringify(key)
}

function subscribe(key: string, cb: () => void) {
  if (!listeners.has(key)) listeners.set(key, new Set())
  listeners.get(key)!.add(cb)
  return () => {
    listeners.get(key)?.delete(cb)
  }
}

export function invalidateQuery(queryKey: QueryKey) {
  listeners.get(keyStr(queryKey))?.forEach((cb) => cb())
}

export function useQuery<T>({
  queryKey,
  queryFn,
  enabled = true,
}: {
  queryKey: QueryKey
  queryFn: () => Promise<T>
  enabled?: boolean
}) {
  const [data, setData] = useState<T | undefined>(undefined)
  const [isPending, setIsPending] = useState(enabled)
  const key = keyStr(queryKey)
  const fnRef = useRef(queryFn)
  fnRef.current = queryFn

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    async function run() {
      setIsPending(true)
      try {
        const result = await fnRef.current()
        if (!cancelled) setData(result)
      } finally {
        if (!cancelled) setIsPending(false)
      }
    }
    run()
    const unsub = subscribe(key, run)
    return () => {
      cancelled = true
      unsub()
    }
  }, [key, enabled])

  return { data, isPending }
}

export function useMutation<TData, TVariables>({
  mutationFn,
  onSuccess,
  onError,
}: {
  mutationFn: (v: TVariables) => Promise<TData>
  onSuccess?: (data: TData, variables: TVariables) => void
  onError?: (error: Error, variables: TVariables) => void
}) {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  async function mutate(variables: TVariables) {
    setIsPending(true)
    setError(null)
    try {
      const data = await mutationFn(variables)
      onSuccess?.(data, variables)
    } catch (e) {
      const err = e as Error
      setError(err)
      onError?.(err, variables)
    } finally {
      setIsPending(false)
    }
  }

  return { mutate, isPending, error }
}
