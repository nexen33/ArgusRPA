import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react'

interface ModalOptions {
  title: string;
  message: ReactNode;
  confirmText?: string;
  cancelText?: string;
  icon?: ReactNode;
}

interface ModalContextType {
  alert: (options: string | ModalOptions) => Promise<void>;
  confirm: (options: string | ModalOptions) => Promise<boolean | null>;
  toast: (message: string) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined)

export function ModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<ModalOptions | null>(null)
  const [type, setType] = useState<'alert' | 'confirm'>('alert')
  const [resolver, setResolver] = useState<{ resolve: (value: boolean | null | void) => void } | null>(null)
  
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const [toastTimer, setToastTimer] = useState<any>(null)

  useEffect(() => {
    // @ts-ignore
    if (window.electronAPI && window.electronAPI.setModalOpen) {
      // @ts-ignore
      window.electronAPI.setModalOpen(isOpen)
    }
  }, [isOpen])



  const openModal = (opts: string | ModalOptions, modalType: 'alert' | 'confirm') => {
    return new Promise<any>((resolve) => {
      if (typeof opts === 'string') {
        setOptions({ title: modalType === 'alert' ? '提示' : '请确认', message: opts })
      } else {
        setOptions(opts)
      }
      setType(modalType)
      setResolver({ resolve })
      setIsOpen(true)
    })
  }

  const alert = (opts: string | ModalOptions) => openModal(opts, 'alert')
  const confirm = (opts: string | ModalOptions) => openModal(opts, 'confirm')

  const handleClose = (result: boolean | null) => {
    setIsOpen(false)
    if (resolver) {
      resolver.resolve(result)
      setResolver(null)
    }
  }

  const toast = (msg: string) => {
    setToastMsg(msg)
    if (toastTimer) clearTimeout(toastTimer)
    const timer = setTimeout(() => {
      setToastMsg(null)
    }, 5000)
    setToastTimer(timer)
  }

  return (
    <ModalContext.Provider value={{ alert, confirm, toast }}>
      {children}
      
      {toastMsg && (() => {
        let icon = '✅'
        let colorClass = 'text-green-500'
        if (toastMsg.includes('无法') || toastMsg.includes('错误') || toastMsg.includes('失败') || toastMsg.includes('未能')) {
          icon = '❌'
          colorClass = 'text-red-500'
        } else if (toastMsg.includes('警告') || toastMsg.includes('注意')) {
          icon = '⚠️'
          colorClass = 'text-yellow-500'
        } else if (toastMsg.startsWith('请')) {
          icon = '❗️'
          colorClass = 'text-blue-400'
        }

        return (
          <div className="fixed top-[30px] left-1/2 -translate-x-1/2 z-[9999] animate-in slide-in-from-top-4 fade-in duration-300">
            <div className="px-5 py-2.5 rounded-full shadow-lg border text-sm font-medium flex items-center gap-2" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
              <span className={colorClass}>{icon}</span>
              {toastMsg}
            </div>
          </div>
        )
      })()}
      {isOpen && options && (
        <div className="fixed inset-1.5 rounded-xl overflow-hidden z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-[400px] border rounded-xl overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <div className="px-5 py-4 flex items-center gap-2 border-b relative" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
              <span className="text-xl flex items-center justify-center">{options.icon || (type === 'alert' ? 'ℹ️' : '🛡️')}</span>
              <span className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{options.title}</span>
              <button 
                onClick={() => handleClose(null)}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full transition-colors hover:bg-black/10 dark:hover:bg-white/10"
                style={{ color: 'var(--text-secondary)' }}
                title="关闭"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>
              {options.message}
            </div>
            <div className="px-5 py-4 flex justify-end gap-3 border-t" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
              {type === 'confirm' && (
                <button 
                  onClick={() => handleClose(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium border transition-opacity hover:opacity-80"
                  style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
                >
                  {options.cancelText || '取消'}
                </button>
              )}
              <button 
                onClick={() => handleClose(true)}
                className="px-5 py-2 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90 shadow-lg"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                {options.confirmText || '确定'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  )
}

export function useModal() {
  const context = useContext(ModalContext)
  if (!context) throw new Error('useModal must be used within ModalProvider')
  return context
}
