import React, { useEffect, useState } from 'react'
import { useTask } from '../context/TaskContext'
import { Play, Square, Pause, ChevronRight, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { useModal } from '../context/ModalContext'

export default function RunStatusBar() {
  const { task, isDebugMode } = useTask()
  const modal = useModal()

  const [status, setStatus] = useState<'idle' | 'running' | 'paused' | 'complete' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [variables, setVariables] = useState<Record<string, string>>({})
  const [currentStepId, setCurrentStepId] = useState<string | null>(null)
  const [skippedCount, setSkippedCount] = useState<number>(0)

  const [downloadProgress, setDownloadProgress] = useState<{ percent: number, received: number, total: number, state: string } | null>(null)

  useEffect(() => {
    // Check if currently active
    if (task?.id) {
      const currentTaskId = task.id;
      // @ts-ignore
      if (window.electronAPI && window.electronAPI.getEngineStatus) {
        // @ts-ignore
        window.electronAPI.getEngineStatus(currentTaskId).then((res: any) => {
          if (res?.success && res.data) {
            const engineStatus = res.data;
            setStatus(engineStatus.isPaused ? 'paused' : 'running')
            if (engineStatus.currentStepId) setCurrentStepId(engineStatus.currentStepId)
            // @ts-ignore
            if (engineStatus.variables) setVariables(engineStatus.variables)
          } else {
            setStatus('idle')
            setCurrentStepId(null)
          }
        })
      }
    }

    // @ts-ignore
    if (!window.electronAPI) return

    // @ts-ignore
    const unsubStepReady = window.electronAPI.onStepReady((data: any) => {
      if (typeof data === 'string') {
        setStatus('paused')
        setCurrentStepId(data)
      } else if (!data.taskId || data.taskId === task.id) {
        setStatus('paused')
        setCurrentStepId(data.stepId)
      }
    })

    // @ts-ignore
    const unsubStepResult = window.electronAPI.onStepResult((data: any) => {
      if (!data.taskId || data.taskId === task.id) {
        setDownloadProgress(null) // clear download progress on step finish
        if (data.success) {
          if (data.variables) {
            setVariables(prev => ({ ...prev, ...data.variables }))
          }
        } else {
          console.warn('Step failed:', data.error)
        }
      }
    })

    // @ts-ignore
    const unsubDownloadProgress = window.electronAPI.onDownloadProgress?.((data: any) => {
      if (!data.taskId || data.taskId === task.id) {
        // If we received progress, it means the step has started executing, so optimistic update UI out of 'paused'
        setStatus(prev => prev === 'paused' ? 'running' : prev)

        if (data.state === 'completed' || data.percent >= 100) {
          setDownloadProgress(null)
        } else {
          setDownloadProgress({
            percent: data.percent,
            received: data.received,
            total: data.total,
            state: data.state
          })
        }
      }
    })

    // @ts-ignore
    const unsubTaskComplete = window.electronAPI.onTaskComplete((data: any) => {
      if (!data || !data.taskId || data.taskId === task.id) {
        setStatus('complete')
        if (data.variables) setVariables(data.variables)

        let totalSkipped = 0;
        if (data.batchResults) {
          totalSkipped = data.batchResults.reduce((acc: number, r: any) => acc + (r.skippedSteps ? r.skippedSteps.length : 0), 0)
        } else if (data.skippedSteps) {
          totalSkipped = data.skippedSteps.length
        }
        setSkippedCount(totalSkipped)
      }
    })

    // @ts-ignore
    const unsubTaskError = window.electronAPI.onTaskError((errData: any) => {
      if (typeof errData === 'string' || !errData.taskId || errData.taskId === task.id) {
        setStatus('error')
        setErrorMsg(typeof errData === 'string' ? errData : errData.error)
      }
    })

    // @ts-ignore
    const unsubTaskStarted = window.electronAPI.onTaskStarted && window.electronAPI.onTaskStarted((data: any) => {
      if (!data || !data.taskId || data.taskId === task.id) {
        setStatus('running')
        setErrorMsg('')
        setVariables({})
        setCurrentStepId(null)
        setSkippedCount(0)
      }
    })

    return () => {
      unsubStepReady && unsubStepReady()
      unsubStepResult && unsubStepResult()
      unsubTaskComplete && unsubTaskComplete()
      unsubTaskError && unsubTaskError()
      unsubTaskStarted && unsubTaskStarted()
      unsubDownloadProgress && unsubDownloadProgress()
    }

  }, [task?.id])

  const handleRun = async () => {
    if (!task.name || task.name.trim() === '') {
      modal.toast('无法运行：请先为任务填写名称！')
      return
    }

    if (!task.steps || task.steps.length === 0) {
      modal.toast('无法运行：请先添加至少一个执行步骤！')
      return
    }

    if (task.batchParam?.enabled && (!task.batchParam.paramValues || task.batchParam.paramValues.length === 0)) {
      modal.toast('无法运行：启用了多并发参数，但未提供任何参数值！')
      return
    }

    setStatus('running')
    setErrorMsg('')
    setVariables({})
    setCurrentStepId(null)
    setSkippedCount(0)
    setDownloadProgress(null)
    try {
      // @ts-ignore
      await window.electronAPI.runTask(task, isDebugMode)
    } catch (e: any) {
      setStatus('error')
      setErrorMsg(e.message)
    }
  }

  const handleStop = async () => {
    const ok = await modal.confirm('确定要强制中止正在运行的任务吗？')
    if (!ok) return
    // @ts-ignore
    await window.electronAPI.stopTask()
  }

  if (status === 'idle') {
    return (
      <div
        className="border rounded-xl p-3 flex items-center justify-between shadow-lg shrink-0"
        style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-main)' }}>
            <Play size={14} style={{ color: 'var(--text-muted)' }} className="ml-0.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>引擎已就绪</span>
            <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>点击右侧按钮开始全自动执行此爬虫任务</span>
          </div>
        </div>
        <button
          onClick={handleRun}
          className="px-6 py-1.5 rounded-lg font-bold text-sm shadow-[0_0_15px_var(--accent-glow)] hover:shadow-[0_0_20px_var(--accent-glow-strong)] transition-all flex items-center gap-2 border-none"
          style={{
            backgroundColor: 'var(--accent)',
            color: '#fff',
            '--accent-glow': 'color-mix(in srgb, var(--accent) 40%, transparent)',
            '--accent-glow-strong': 'color-mix(in srgb, var(--accent) 60%, transparent)'
          } as any}
        >
          <Play size={16} className="fill-white" />
          开始运行
        </button>
      </div>
    )
  }

  const getStatusColor = () => {
    switch (status) {
      case 'running': return 'var(--accent)'
      case 'paused': return 'var(--warning)'
      case 'complete': return skippedCount > 0 ? 'var(--warning)' : 'var(--success)'
      case 'error': return 'var(--danger)'
      default: return 'var(--text-muted)'
    }
  }

  const getStatusBg = () => {
    switch (status) {
      case 'running': return 'var(--accent-subtle)'
      case 'paused': return 'var(--warning-subtle)'
      case 'complete': return skippedCount > 0 ? 'var(--warning-subtle)' : 'var(--success-subtle)'
      case 'error': return 'var(--danger-subtle)'
      default: return 'transparent'
    }
  }

  return (
    <div
      className="border rounded-xl p-3 flex items-center justify-between shadow-lg shrink-0 transition-colors"
      style={{ backgroundColor: getStatusBg(), borderColor: getStatusBg() }}
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0">
          {status === 'running' && <Loader2 size={24} className="animate-spin" style={{ color: getStatusColor() }} />}
          {status === 'paused' && <Pause size={20} style={{ color: getStatusColor() }} />}
          {status === 'complete' && skippedCount === 0 && <CheckCircle size={24} style={{ color: getStatusColor() }} />}
          {status === 'complete' && skippedCount > 0 && <AlertCircle size={24} style={{ color: getStatusColor() }} />}
          {status === 'error' && <AlertCircle size={24} style={{ color: getStatusColor() }} />}
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold" style={{ color: getStatusColor() }}>
              {status === 'running' ? '任务正在全自动执行中...' :
                status === 'paused' ? '引擎已暂停 (等待调试)' :
                  status === 'complete' ? (skippedCount > 0 ? `任务未全部执行，有 ${skippedCount} 个步骤失败/超时` : '任务执行完毕') :
                    '任务执行异常中断'}
            </span>
            {currentStepId && status !== 'complete' && status !== 'error' && (
              <span
                className="text-[10px] px-2 py-0.5 rounded border font-medium"
                style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
              >
                当前步: {(() => {
                  if (!task.steps) return 0;
                  let idx = task.steps.findIndex(s => s.id === currentStepId);
                  if (idx === -1) {
                    idx = task.steps.findIndex(s =>
                      s.type === 'if_else' && (
                        (s.trueBranchSteps || []).some(c => c.id === currentStepId) ||
                        (s.falseBranchSteps || []).some(c => c.id === currentStepId)
                      )
                    );
                  }
                  return idx + 1;
                })()} / {task.steps?.length || 0}
              </span>
            )}
          </div>

          <div className="text-[11px] max-w-xl truncate" style={{ color: 'var(--text-secondary)' }}>
            {status === 'error' ? errorMsg :
              status === 'complete' ? `成功收集到 ${Object.keys(variables).filter(k => !k.startsWith('_SYS_')).length} 个变量。` :
                '已捕获变量: ' + (Object.keys(variables).filter(k => !k.startsWith('_SYS_')).length > 0 ? JSON.stringify(Object.fromEntries(Object.entries(variables).filter(([k]) => !k.startsWith('_SYS_')))) : '无')}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {/* Download Progress */}
        {downloadProgress && (
          <div className="flex flex-col items-end justify-center gap-1.5 mr-2 w-48 mt-1">
            <span className="text-[10px] font-medium flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
              <Loader2 size={10} className="animate-spin" />
              正在下载 {downloadProgress.percent}% ({(downloadProgress.received / 1024 / 1024).toFixed(1)}M / {downloadProgress.total ? (downloadProgress.total / 1024 / 1024).toFixed(1) + 'M' : '未知'})
            </span>
            <div className="w-full rounded-full h-1.5 overflow-hidden" style={{ backgroundColor: 'var(--bg-elevated)' }}>
              <div
                className="h-1.5 transition-all duration-300 ease-out"
                style={{ width: `${downloadProgress.percent}%`, backgroundColor: getStatusColor() }}
              />
            </div>
          </div>
        )}
        {status !== 'complete' && status !== 'error' && (
          <button
            onClick={handleStop}
            className="border px-4 py-1.5 rounded-lg font-bold text-sm transition-all flex items-center gap-1"
            style={{ backgroundColor: 'var(--danger-subtle)', borderColor: 'var(--danger)', color: 'var(--danger)' }}
          >
            <Square size={14} style={{ fill: 'currentColor' }} />
            中止执行
          </button>
        )}

        {(status === 'complete' || status === 'error') && (
          <button
            onClick={() => {
              setStatus('idle');
              window.dispatchEvent(new CustomEvent('task-idle'));
            }}
            className="px-4 py-1.5 rounded-lg font-bold text-sm transition-all border"
            style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)', borderColor: 'var(--border-strong)' }}
          >
            返回就绪
          </button>
        )}
      </div>
    </div>
  )
}
