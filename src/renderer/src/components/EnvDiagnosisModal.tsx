import React, { useState, useEffect } from 'react'

type DiagnosisResult = {
  name: string
  status: 'success' | 'error' | 'warning' | 'pending'
  detail: string
}

export default function EnvDiagnosisModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [results, setResults] = useState<DiagnosisResult[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const runDiagnostics = async () => {
    setIsRunning(true)
    setResults([])

    // 预填充占位
    const placeholders: DiagnosisResult[] = [
      { name: 'Node.js', status: 'pending', detail: '...' },
      { name: 'Electron', status: 'pending', detail: '...' },
      { name: 'Python', status: 'pending', detail: '...' },
      { name: 'Python 依赖 (requests)', status: 'pending', detail: '...' },
      { name: '网络连通性', status: 'pending', detail: '...' },
      { name: 'GPU 加速', status: 'pending', detail: '...' },
    ]
    setResults(placeholders)

    // @ts-ignore
    if (!window.electronAPI) return

    try {
      // @ts-ignore
      const res = await window.electronAPI.runEnvDiagnostics()
      const rawResults = res?.success ? res.data : res;

      // 瀑布流展示效果
      if (Array.isArray(rawResults)) {
        for (let i = 0; i < rawResults.length; i++) {
          await new Promise(r => setTimeout(r, 400)) // 人工延迟制造瀑布流效果
          setResults(prev => {
            const next = [...prev]
            next[i] = rawResults[i]
            return next
          })
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsRunning(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      runDiagnostics()
    }
  }, [isOpen])

  if (!isOpen) return null

  const hasPythonError = results.some(r => r.name === 'Python' && r.status === 'error')
  const hasRequestsError = results.some(r => r.name === 'Python 依赖 (requests)' && r.status === 'error')

  return (
    <div className="fixed inset-1.5 rounded-xl overflow-hidden z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div
        className="border rounded-2xl w-[500px] shadow-2xl overflow-hidden flex flex-col"
        style={{ backgroundColor: 'var(--bg-panel)', borderColor: 'var(--border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isRunning ? 'text-primary animate-spin' : ''}`} style={{ backgroundColor: isRunning ? 'var(--accent-subtle)' : 'var(--bg-main)', color: isRunning ? 'var(--accent)' : 'var(--text-secondary)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
            </div>
            <div>
              <h2 className="text-[16px] font-bold tracking-wide" style={{ color: 'var(--text-primary)' }}>系统环境诊断</h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{isRunning ? '正在进行全维度链路检测...' : '检测完成'}</p>
            </div>
          </div>
          <button onClick={() => {
            if (isRunning) setIsRunning(false);
            onClose();
          }} className="transition-colors hover:opacity-70" style={{ color: 'var(--text-muted)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-3 max-h-[60vh] overflow-y-auto thin-scrollbar relative" style={{ backgroundColor: 'var(--bg-main)' }}>
          {results.map((r, i) => (
            <div
              key={i}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-500`}
              style={{
                backgroundColor: r.status === 'pending' ? 'var(--bg-elevated)' :
                  r.status === 'success' ? 'rgba(34, 197, 94, 0.1)' :
                    r.status === 'warning' ? 'rgba(245, 158, 11, 0.1)' :
                      'rgba(239, 68, 68, 0.1)',
                borderColor: r.status === 'pending' ? 'var(--border)' :
                  r.status === 'success' ? 'rgba(34, 197, 94, 0.2)' :
                    r.status === 'warning' ? 'rgba(245, 158, 11, 0.2)' :
                      'rgba(239, 68, 68, 0.2)',
                opacity: r.status === 'pending' ? 0.6 : 1
              }}
            >
              <div className="flex items-center gap-3">
                {r.status === 'pending' && <span className="animate-pulse" style={{ color: 'var(--text-muted)' }}>●</span>}
                {r.status === 'success' && <span className="text-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)] rounded-full w-2 h-2"></span>}
                {r.status === 'warning' && <span className="text-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)] rounded-full w-2 h-2"></span>}
                {r.status === 'error' && <span className="text-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] rounded-full w-2 h-2"></span>}
                <span className="font-medium" style={{ color: r.status === 'error' ? 'var(--danger)' : 'var(--text-primary)' }}>{r.name}</span>
              </div>
              <div className={`text-sm font-mono ${r.status === 'success' ? 'text-green-600 dark:text-green-400' :
                  r.status === 'warning' ? 'text-amber-600 dark:text-amber-400' :
                    r.status === 'error' ? 'text-red-600 dark:text-red-400 font-bold' :
                      ''
                }`} style={r.status === 'pending' ? { color: 'var(--text-muted)' } : {}}>
                {r.detail}
              </div>
            </div>
          ))}

          {/* Error Wizard */}
          {(hasPythonError || hasRequestsError) && !isRunning && (
            <div className="mt-2 p-4 border rounded-xl animate-in slide-in-from-bottom-4 duration-500" style={{ backgroundColor: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
              <h3 className="font-bold flex items-center gap-2 mb-2" style={{ color: 'var(--danger)' }}>
                <span>⚠️</span> 发现环境缺失
              </h3>

              {hasPythonError && (
                <div className="mb-4">
                  <p className="text-xs mb-3 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    您的系统尚未安装 Python 或环境变量配置不正确。Python 是运行核心自动化脚本的基础。
                  </p>
                  <div className="space-y-2 text-xs font-mono">
                    <div className="p-2 rounded border" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Windows:</span> winget install -e --id Python.Python.3.11
                    </div>
                    <div className="p-2 rounded border" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>macOS:</span> brew install python
                    </div>
                  </div>
                </div>
              )}

              {hasRequestsError && !hasPythonError && (
                <div>
                  <p className="text-xs mb-3 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    您的 Python 环境中缺少 requests 库。若后续需要执行自定义网络请求脚本，请先安装该依赖。
                  </p>
                  <div className="space-y-2 text-xs font-mono">
                    <div className="p-2 rounded border" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>终端运行:</span> pip install requests
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t flex justify-end gap-3" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <button
            onClick={runDiagnostics}
            disabled={isRunning}
            className="px-4 py-2 rounded-xl text-sm font-bold transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
          >
            重新检测
          </button>
          <button
            onClick={onClose}
            disabled={isRunning}
            className="px-5 py-2 rounded-xl text-sm font-bold transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{ backgroundColor: 'var(--accent)', color: '#ffffff' }}
          >
            完成
          </button>
        </div>
      </div>
    </div>
  )
}
