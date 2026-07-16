import React, { useState, useEffect, useRef } from 'react'

const isMac = typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().includes('mac')

export default function ShortcutSettingsModal({ 
  isOpen, 
  onClose,
  initialShortcut,
  onSave
}: { 
  isOpen: boolean, 
  onClose: () => void,
  initialShortcut: string,
  onSave: (shortcut: string) => void
}) {
  const [currentKeys, setCurrentKeys] = useState<string[]>(initialShortcut ? initialShortcut.split('+') : [])
  const [isRecording, setIsRecording] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      setCurrentKeys(initialShortcut ? initialShortcut.split('+') : [])
      setIsRecording(false)
    }
  }, [isOpen, initialShortcut])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isRecording) return
      e.preventDefault()
      e.stopPropagation()

      const keys: string[] = []
      if (e.ctrlKey || e.metaKey) keys.push(isMac ? 'Command' : 'Ctrl')
      if (e.altKey) keys.push(isMac ? 'Option' : 'Alt')
      if (e.shiftKey) keys.push('Shift')

      // 忽略单独的修饰键
      if (!['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) {
        let key = e.key.toUpperCase()
        if (key === ' ') key = 'Space'
        keys.push(key)
        setCurrentKeys(keys)
        setIsRecording(false) // 录制完一次按键组合就自动停止
      } else {
        setCurrentKeys(keys) // 仅按下修饰键时实时更新显示
      }
    }

    if (isRecording) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isRecording])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        ref={containerRef}
        className="border rounded-2xl w-[400px] shadow-2xl overflow-hidden flex flex-col"
        style={{ backgroundColor: 'var(--bg-panel)', borderColor: 'var(--border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2">
            <span className="text-lg">⚙️</span>
            <h2 className="text-[15px] font-bold tracking-wide" style={{ color: 'var(--text-primary)' }}>拾取元素快捷键设置</h2>
          </div>
          <button onClick={onClose} className="transition-colors hover:opacity-80" style={{ color: 'var(--text-muted)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-5 items-center" style={{ backgroundColor: 'var(--bg-main)' }}>
          <p className="text-sm text-center leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            设置一个全局快捷键，方便在任何页面直接进入/退出元素拾取模式，而无需移动鼠标去点击按钮。
          </p>

          <div 
            className={`w-full h-20 rounded-xl border flex items-center justify-center gap-2 transition-all cursor-pointer ${
              isRecording 
                ? 'shadow-[0_0_15px_rgba(59,130,246,0.3)] animate-pulse' 
                : 'hover:opacity-80'
            }`}
            style={{
              borderColor: isRecording ? 'var(--primary)' : 'var(--border)',
              backgroundColor: isRecording ? 'rgba(59,130,246,0.1)' : 'var(--bg-elevated)',
            }}
            onClick={() => setIsRecording(true)}
          >
            {currentKeys.length === 0 ? (
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{isRecording ? '请按下你要设置的快捷键组合...' : '点击此处开始录制'}</span>
            ) : (
              currentKeys.map((key, idx) => (
                <React.Fragment key={idx}>
                  <kbd 
                    className="px-3 py-1.5 border rounded-md text-sm font-mono shadow-sm"
                    style={{ backgroundColor: 'var(--bg-panel)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                  >
                    {key}
                  </kbd>
                  {idx < currentKeys.length - 1 && <span className="font-bold" style={{ color: 'var(--text-muted)' }}>+</span>}
                </React.Fragment>
              ))
            )}
          </div>

          <div className="text-xs flex gap-4 w-full justify-center" style={{ color: 'var(--text-muted)' }}>
            <button 
              className="hover:text-primary transition-colors underline underline-offset-2"
              style={{ color: 'var(--text-secondary)' }}
              onClick={() => setCurrentKeys(isMac ? ['Option', 'X'] : ['Alt', 'X'])}
            >
              恢复默认 ({isMac ? 'Option+X' : 'Alt+X'})
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t flex justify-end gap-3" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-bold transition-opacity hover:opacity-80"
            style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
          >
            取消
          </button>
          <button 
            onClick={() => {
              onSave(currentKeys.join('+'))
              onClose()
            }}
            disabled={currentKeys.length === 0 || isRecording}
            className="px-5 py-2 rounded-xl text-sm font-bold transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{ backgroundColor: 'var(--accent)', color: '#ffffff' }}
          >
            保存设置
          </button>
        </div>
      </div>
    </div>
  )
}
