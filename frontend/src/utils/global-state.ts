import { useContext, useEffect, useRef, useState } from 'preact/hooks'

interface Callbacks {
  onInit?: () => Promise<void>
  onClose?: () => Promise<void>
}

export type ContextVal<T extends (...args: any) => any> = StoreApi<Omit<ReturnType<T>, 'onInit' | 'onClose'>> | null
export type StoreI<StoreData> = Omit<StoreData, 'onInit' | 'onClose'> & Callbacks
export type SetState<T> = (partial: Partial<T> | ((state: T) => Partial<T>)) => void

export interface StoreApi<T> {
  getState: () => T
  setState: SetState<T>
  subscribe: (listener: () => void) => () => void
}

export function createStore<T>(initializer: (set: SetState<T>) => T): StoreApi<T> {
  let state: T
  const listeners = new Set<() => void>()

  const set: SetState<T> = (partial) => {
    const update = typeof partial === 'function' ? (partial as (s: T) => Partial<T>)(state) : partial
    state = { ...state, ...update }
    listeners.forEach((l) => l())
  }

  state = initializer(set)

  return {
    getState: () => state,
    setState: set,
    subscribe: (listener) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}

export function useStore<T, U>(store: StoreApi<T>, selector: (s: T) => U): U {
  const [value, setValue] = useState(() => selector(store.getState()))
  useEffect(() => {
    return store.subscribe(() => setValue(selector(store.getState())))
  }, [store])
  return value
}

export function initStore<T extends Callbacks>(initializer: (set: SetState<T>) => T): StoreApi<T> {
  const storeRef = useRef<StoreApi<T>>()

  if (!storeRef.current) {
    storeRef.current = createStore(initializer)
  }

  useEffect(() => {
    storeRef.current!.getState().onInit?.()
    return () => storeRef.current!.getState().onClose?.() as void
  }, [])

  return storeRef.current
}

export function useStoreX<T, U>(StoreContext: preact.Context<StoreApi<T> | null>, selector: (state: T) => U): U {
  const store = useContext(StoreContext)
  if (!store) throw new Error('Missing StoreProvider')
  return useStore(store, selector)
}

export function useAction<T>(StoreContext: preact.Context<StoreApi<T> | null>): T {
  const store = useContext(StoreContext)
  if (!store) throw new Error('Missing StoreProvider')
  return store.getState()
}
