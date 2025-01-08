import { useContext, useEffect, useRef } from 'react'
import { createStore, StateCreator, StoreApi, useStore } from 'zustand'

interface Callbacks {
  onInit?: () => Promise<void>
  onClose?: () => Promise<void>
}

export type ContextVal<T extends (...args: any) => any> = StoreApi<Omit<ReturnType<T>, 'onInit' | 'onClose'>> | null

export type StoreI<StoreData> = Omit<StoreData, 'onInit' | 'onClose'> & Callbacks

export type SetState<T> = (partial: T | Partial<T> | ((state: T) => T | Partial<T>), replace?: false) => void

export function initStore<T extends Callbacks>(initializer: StateCreator<T>): StoreApi<T> {
  // @ts-expect-error
  const storeRef = useRef<StoreApi<T>>()

  if (!storeRef.current) {
    storeRef.current = createStore(initializer)
  }

  useEffect(() => {
    storeRef.current.getState().onInit?.()

    return () => storeRef.current.getState().onClose?.() as void
  }, [])

  return storeRef.current
}

export function useStoreX<T, U>(StoreContext: React.Context<StoreApi<T> | null>, selector: (state: T) => U): U {
  const store = useContext(StoreContext)
  if (!store) {
    throw new Error('Missing StoreProvider')
  }
  return useStore(store, selector)
}

export function useAction<T>(StoreContext: React.Context<StoreApi<T> | null>): T {
  const store = useContext(StoreContext)
  if (!store) {
    throw new Error('Missing StoreProvider')
  }
  return store.getState()
}
