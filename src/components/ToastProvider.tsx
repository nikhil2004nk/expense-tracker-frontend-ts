import { createContext, useContext, useMemo, useState, useCallback, type ReactNode } from 'react'
import Toast, { ToastContainer } from './common/Toast'

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

  const remove = useCallback((id: string) => setToasts((t) => t.filter((x) => x.id !== id)), [])

  const show = useCallback((message: string, { type = 'success', duration = 3000 }: { type?: ToastType; duration?: number } = {}) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((t) => [...t, { id, message, type }])
    if (duration > 0) setTimeout(() => remove(id), duration)
  }, [remove])

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
