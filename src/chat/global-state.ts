import { useContext, useEffect, useRef } from 'react'
import { createStore, StateCreator, StoreApi, useStore as zustandUseStore } from 'zustand'

// interface CommonState {
//   initStatus: 'pending' | 'initialising' | 'initialised'
//   isClosed: boolean
// }

interface Callbacks {
  onInit?: () => Promise<void>
  onClose?: () => Promise<void>
}

export type ContextVal<T extends (...args: any) => any> = StoreApi<Omit<ReturnType<T>, 'onInit'>> | null

export type StoreReturn<State, Actions> = State & Actions & Callbacks

export function initStore<T>(initializer: StateCreator<T>): StoreApi<T> {
  // @ts-expect-error
  const storeRef = useRef<StoreApi<T>>()

  if (!storeRef.current) {
    storeRef.current = createStore(initializer)
  }

  useEffect(() => {
    // @ts-expect-error
    storeRef.current.getState()?.onInit()
  }, [])

  return storeRef.current
}

export function useStore<T, U>(StoreContext: React.Context<StoreApi<T> | null>, selector: (state: T) => U): U {
  const store = useContext(StoreContext)
  if (!store) {
    throw new Error('Missing StoreProvider')
  }
  return zustandUseStore(store, selector)
}
