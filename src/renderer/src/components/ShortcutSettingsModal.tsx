import React, { useState, useEffect, useRef } from 'react'

const isMac = typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().includes('mac')

export default function ShortcutSettingsModal({ 
  isOpen, 
  onClose,
  initialToggleShortcut,
  initialConfirmShortcut,
  onSave
}: { 
  isOpen: boolean, 
  onClose: () => void,
  initialToggleShortcut: string,
  initialConfirmShortcut: string,
  onSave: (toggle: string, confirm: string) => void
}) {
  const [toggleKeys, setToggleKeys] = useState<string[]>(initialToggleShortcut ? initialToggleShortcut.split('+') : [])
  const [confirmKeys, setConfirmKeys] = useState<string[]>(initialConfirmShortcut ? initialConfirmShortcut.split('+') : [])
  const [recordingTarget, setRecordingTarget] = useState<'toggle' | 'confirm' | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      setToggleKeys(initialToggleShortcut ? initialToggleShortcut.split('+') : [])
      setConfirmKeys(initialConfirmShortcut ? initialConfirmShortcut.split('+') : [])
      setRecordingTarget(null)
    }
  }, [isOpen, initialToggleShortcut, initialConfirmShortcut])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!recordingTarget) return
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
        if (recordingTarget === 'toggle') setToggleKeys(keys)
        else setConfirmKeys(keys)
        setRecordingTarget(null) // 录制完一次按键组合就自动停止
      } else {
        if (recordingTarget === 'toggle') setToggleKeys(keys)
        else setConfirmKeys(keys)
      }
    }

    if (recordingTarget) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [recordingTarget])

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
            <h2 className="text-[15px] font-bold tracking-wide" style={{ color: 'var(--text-primary)' }}>选取元素快捷键设置</h2>
          </div>
          <button onClick={onClose} className="transition-colors hover:opacity-80" style={{ color: 'var(--text-muted)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-6" style={{ backgroundColor: 'var(--bg-main)' }}>
          {/* Toggle Shortcut */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <h3 className="text-[13px] font-bold" style={{ color: 'var(--text-primary)' }}>开启/关闭 选取器模式 (全局)</h3>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                在任何页面按下此快捷键，直接进入或退出元素选取模式。
              </p>
            </div>
            <div 
              className={`w-full h-14 rounded-xl border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                recordingTarget === 'toggle' ? 'shadow-[0_0_15px_rgba(59,130,246,0.3)] animate-pulse' : 'hover:opacity-80'
              }`}
              style={{
                borderColor: recordingTarget === 'toggle' ? 'var(--primary)' : 'var(--border)',
                backgroundColor: recordingTarget === 'toggle' ? 'rgba(59,130,246,0.1)' : 'var(--bg-elevated)',
              }}
              onClick={() => setRecordingTarget('toggle')}
            >
              {toggleKeys.length === 0 ? (
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{recordingTarget === 'toggle' ? '请按下你要设置的快捷键组合...' : '点击此处开始录制'}</span>
              ) : (
                toggleKeys.map((key, idx) => (
                  <React.Fragment key={idx}>
                    <kbd className="px-3 py-1 border rounded-md text-sm font-mono shadow-sm" style={{ backgroundColor: 'var(--bg-panel)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>{key}</kbd>
                    {idx < toggleKeys.length - 1 && <span className="font-bold" style={{ color: 'var(--text-muted)' }}>+</span>}
                  </React.Fragment>
                ))
              )}
            </div>
            <div className="flex justify-end">
              <button className="text-[11px] hover:text-primary transition-colors underline underline-offset-2" style={{ color: 'var(--text-secondary)' }} onClick={() => setToggleKeys(isMac ? ['Option', 'X'] : ['Alt', 'X'])}>
                恢复默认 ({isMac ? 'Option+X' : 'Alt+X'})
              </button>
            </div>
          </div>

          {/* Confirm Shortcut */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <h3 className="text-[13px] font-bold" style={{ color: 'var(--text-primary)' }}>获取元素快捷键 (局部)</h3>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                在选取器模式(蓝框显示)下，按下此快捷键立即获取悬停元素的 CSS 和 XPath，无需鼠标点击。（焦点需在浏览器框内）
              </p>
            </div>
            <div 
              className={`w-full h-14 rounded-xl border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                recordingTarget === 'confirm' ? 'shadow-[0_0_15px_rgba(59,130,246,0.3)] animate-pulse' : 'hover:opacity-80'
              }`}
              style={{
                borderColor: recordingTarget === 'confirm' ? 'var(--primary)' : 'var(--border)',
                backgroundColor: recordingTarget === 'confirm' ? 'rgba(59,130,246,0.1)' : 'var(--bg-elevated)',
              }}
              onClick={() => setRecordingTarget('confirm')}
            >
              {confirmKeys.length === 0 ? (
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{recordingTarget === 'confirm' ? '请按下你要设置的快捷键组合...' : '点击此处开始录制'}</span>
              ) : (
                confirmKeys.map((key, idx) => (
                  <React.Fragment key={idx}>
                    <kbd className="px-3 py-1 border rounded-md text-sm font-mono shadow-sm" style={{ backgroundColor: 'var(--bg-panel)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>{key}</kbd>
                    {idx < confirmKeys.length - 1 && <span className="font-bold" style={{ color: 'var(--text-muted)' }}>+</span>}
                  </React.Fragment>
                ))
              )}
            </div>
            <div className="flex justify-end">
              <button className="text-[11px] hover:text-primary transition-colors underline underline-offset-2" style={{ color: 'var(--text-secondary)' }} onClick={() => setConfirmKeys(isMac ? ['Option'] : ['Alt'])}>
                恢复默认 ({isMac ? 'Option' : 'Alt'})
              </button>
            </div>
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
              onSave(toggleKeys.join('+'), confirmKeys.join('+'))
              onClose()
            }}
            disabled={toggleKeys.length === 0 || confirmKeys.length === 0 || recordingTarget !== null}
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
