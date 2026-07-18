import React, { useState, useEffect, useRef } from 'react'

const isMac = typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().includes('mac')

export default function DesktopShortcutSettingsModal({ 
  isOpen, 
  onClose,
  initialScreenshotShortcut,
  onSave
}: { 
  isOpen: boolean, 
  onClose: () => void,
  initialScreenshotShortcut: string,
  onSave: (screenshotShortcut: string) => void
}) {
  const [screenshotKeys, setScreenshotKeys] = useState<string[]>(initialScreenshotShortcut ? initialScreenshotShortcut.split('+') : [])
  const [recordingTarget, setRecordingTarget] = useState<'screenshot' | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      setScreenshotKeys(initialScreenshotShortcut ? initialScreenshotShortcut.split('+') : [])
      setRecordingTarget(null)
    }
  }, [isOpen, initialScreenshotShortcut])

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
        setScreenshotKeys(keys)
        setRecordingTarget(null) // 录制完一次按键组合就自动停止
      } else {
        setScreenshotKeys(keys)
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
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={() => {
        if (recordingTarget) {
          if (screenshotKeys.length > 0) {
            onSave(screenshotKeys.join('+'))
          }
          setRecordingTarget(null)
        } else {
          onClose()
        }
      }}
    >
      <div 
        ref={containerRef}
        className="border rounded-2xl w-[400px] shadow-2xl overflow-hidden flex flex-col"
        style={{ backgroundColor: 'var(--bg-panel)', borderColor: 'var(--border)' }}
        onClick={(e) => {
          e.stopPropagation()
          if (recordingTarget) {
            if (screenshotKeys.length > 0) {
              onSave(screenshotKeys.join('+'))
            }
            setRecordingTarget(null)
          }
        }}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2">
            <span className="text-lg">⚙️</span>
            <h2 className="text-[15px] font-bold tracking-wide" style={{ color: 'var(--text-primary)' }}>桌面自动化快捷键设置</h2>
          </div>
          <button onClick={onClose} className="transition-colors hover:opacity-80" style={{ color: 'var(--text-muted)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-6" style={{ backgroundColor: 'var(--bg-main)' }}>
          
          {/* Default Hardcoded Shortcut */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <h3 className="text-[13px] font-bold" style={{ color: 'var(--text-primary)' }}>常规选取元素快捷键 (不可更改)</h3>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                在选取模式下，按下此组合键直接获取悬停位置的 UIA 元素节点。
              </p>
            </div>
            <div 
              className="w-full h-14 rounded-xl border flex items-center justify-center gap-2 opacity-80"
              style={{
                borderColor: 'var(--border)',
                backgroundColor: 'var(--bg-elevated)',
              }}
            >
              <kbd className="px-3 py-1 border rounded-md text-sm font-mono shadow-sm" style={{ backgroundColor: 'var(--bg-panel)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>Ctrl</kbd>
              <span className="font-bold" style={{ color: 'var(--text-muted)' }}>+</span>
              <kbd className="px-3 py-1 border rounded-md text-sm font-mono shadow-sm" style={{ backgroundColor: 'var(--bg-panel)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>左键单击</kbd>
            </div>
          </div>

          {/* Screenshot Shortcut */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <h3 className="text-[13px] font-bold" style={{ color: 'var(--text-primary)' }}>激活截图框选模式快捷键</h3>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                在选取模式下，按下此快捷键冻结画面进行局部截图框选。
              </p>
            </div>
            <div 
              className={`w-full h-14 rounded-xl border flex items-center justify-center gap-2 transition-all cursor-pointer \${
                recordingTarget === 'screenshot' ? 'shadow-[0_0_15px_rgba(59,130,246,0.3)] animate-pulse' : 'hover:opacity-80'
              }`}
              style={{
                borderColor: recordingTarget === 'screenshot' ? 'var(--primary)' : 'var(--border)',
                backgroundColor: recordingTarget === 'screenshot' ? 'rgba(59,130,246,0.1)' : 'var(--bg-elevated)',
              }}
              onClick={() => setRecordingTarget('screenshot')}
            >
              {screenshotKeys.length === 0 ? (
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{recordingTarget === 'screenshot' ? '请按下你要设置的快捷键组合...' : '点击此处开始录制'}</span>
              ) : (
                screenshotKeys.map((key, idx) => (
                  <React.Fragment key={idx}>
                    <kbd className="px-3 py-1 border rounded-md text-sm font-mono shadow-sm" style={{ backgroundColor: 'var(--bg-panel)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>{key}</kbd>
                    {idx < screenshotKeys.length - 1 && <span className="font-bold" style={{ color: 'var(--text-muted)' }}>+</span>}
                  </React.Fragment>
                ))
              )}
            </div>
            <div className="flex justify-end">
              <button 
                className="text-[11px] hover:text-primary transition-colors underline underline-offset-2" 
                style={{ color: 'var(--text-secondary)' }} 
                onClick={(e) => {
                  e.stopPropagation();
                  const defaultKeys = isMac ? 'Command+S' : 'Ctrl+S';
                  setScreenshotKeys(defaultKeys.split('+'));
                  onSave(defaultKeys);
                  setRecordingTarget(null);
                }}
              >
                恢复默认 ({isMac ? 'Command+S' : 'Ctrl+S'})
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
              onSave(screenshotKeys.join('+'))
              onClose()
            }}
            disabled={screenshotKeys.length === 0 || recordingTarget !== null}
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
