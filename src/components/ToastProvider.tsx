import { createContext, useContext, useMemo, useState, useCallback, useRef, useEffect, type ReactNode } from 'react'
import Toast, { ToastContainer } from './common/Toast'
import { TIMING } from '../config/constants'

type ToastType = 'success' | 'error' | 'warning' | 'info'

type ToastContextValue = {
  show: (message: string, opts?: { type?: ToastType; duration?: number }) => void
  remove: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>')
  return ctx
}

export default function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: ToastType }>>([])
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const remove = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id))
    // Clean up timer reference
    const timer = timersRef.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timersRef.current.delete(id)
    }
  }, [])

  const show = useCallback((message: string, { type = 'success', duration = TIMING.TOAST_DURATION }: { type?: ToastType; duration?: number } = {}) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((t) => [...t, { id, message, type }])
    
    if (duration > 0) {
      const timer = setTimeout(() => remove(id), duration)
      timersRef.current.set(id, timer)
    }
  }, [remove])
  
  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer))
      timersRef.current.clear()
    }
  }, [])

  const value = useMemo(() => ({ show, remove }), [show, remove])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer>
        {toasts.map((t) => (
          <Toast key={t.id} message={t.message} type={t.type} onClose={() => remove(t.id)} />
        ))}
      </ToastContainer>
    </ToastContext.Provider>
  )
}
