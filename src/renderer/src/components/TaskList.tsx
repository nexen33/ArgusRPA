import React, { useEffect, useState, useRef } from 'react'
import { LayoutDashboard, Trash2, Edit, Play, Square, Copy, Download, Upload, Plus, GripVertical, Lock, Unlock } from 'lucide-react'
import { useTask } from '../context/TaskContext'
import { useModal } from '../context/ModalContext'
import { ScraperTask } from '../../../shared/types'

export default function TaskList({ onNavigate }: { onNavigate: (page: 'configurator') => void }) {
  const { loadTask, task: activeTask, resetTask } = useTask()
  const modal = useModal()
  const [tasks, setTasks] = useState<ScraperTask[]>([])
  const [activeTasks, setActiveTasks] = useState<Set<string>>(new Set())
  const [isExporting, setIsExporting] = useState(false)
  const [exportSelection, setExportSelection] = useState<Set<string>>(new Set())
  const [clearConfigsOnExport, setClearConfigsOnExport] = useState(false)
  const [notificationConfigs, setNotificationConfigs] = useState<any[]>([])
  const [highlightedTaskId, setHighlightedTaskId] = useState<string | null>(null)
  const [isTableScrolled, setIsTableScrolled] = useState(false)
  const headerScrollRef = useRef<HTMLDivElement>(null)
  const [isSortLocked, setIsSortLocked] = useState(true)
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null)
  
  useEffect(() => {
    return () => setIsSortLocked(true)
  }, [])

  const [colWidths, setColWidths] = useState(() => {
    const saved = localStorage.getItem('argus-col-widths')
    if (saved) {
      try { return JSON.parse(saved) } catch (e) { }
    }
    return {
      name: 256,
      steps: 110,
      batch: 112,
      schedule: 112,
      notify: 140,
      monitor: 120,
      created: 128,
      run: 160,
      actions: 140
    }
  })

  useEffect(() => {
    localStorage.setItem('argus-col-widths', JSON.stringify(colWidths))
  }, [colWidths])

  const handleResize = (col: keyof typeof colWidths, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const startX = e.clientX
    const startWidth = colWidths[col]
    let rafId: number | null = null

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (rafId) cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        setColWidths((prev: any) => ({
          ...prev,
          [col]: Math.min(600, Math.max(60, startWidth + (moveEvent.clientX - startX)))
        }))
      })
    }
    const onMouseUp = () => {
      if (rafId) cancelAnimationFrame(rafId)
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  const fetchTasks = async () => {
    // @ts-ignore
    if (window.electronAPI) {
      // @ts-ignore
      const res = await window.electronAPI.getAllTasks()
      setTasks(res?.data || [])

      // @ts-ignore
      if (window.electronAPI.getAllNotificationConfigs) {
        // @ts-ignore
        const confs = await window.electronAPI.getAllNotificationConfigs()
        setNotificationConfigs(confs?.data || [])
      }
    }
  }

  useEffect(() => {
    fetchTasks()
    
    const handleTaskSaved = (e: any) => {
      if (e.detail) {
        setHighlightedTaskId(e.detail)
        setTimeout(() => setHighlightedTaskId(null), 3000)
        fetchTasks() // refresh
      }
    }
    window.addEventListener('task-saved', handleTaskSaved)
    
    const checkActive = async () => {
      // @ts-ignore
      if (window.electronAPI && window.electronAPI.getActiveTasks) {
        try {
          // @ts-ignore
          const res = await window.electronAPI.getActiveTasks()
          if (res?.success && Array.isArray(res.data)) setActiveTasks(new Set(res.data))
        } catch (e) {
          console.warn('Failed to get active tasks, main process might need a restart.', e)
        }
      }
    }
    checkActive()
    const timer = setInterval(checkActive, 1000)
    
    return () => {
      clearInterval(timer)
      window.removeEventListener('task-saved', handleTaskSaved)
    }
  }, [])

  const handleEdit = (t: ScraperTask) => {
    loadTask(t)
    onNavigate('configurator')
  }

  const handleDelete = async (id: string) => {
    const ok = await modal.confirm('确定要彻底删除该任务吗？此操作无法撤销。')
    if (!ok) return
    // @ts-ignore
    await window.electronAPI.deleteTask(id)

    if (activeTask && activeTask.id === id) {
      resetTask()
    }

    fetchTasks()
  }

  const confirmExport = async () => {
    if (exportSelection.size === 0) {
      modal.toast('请至少选择一个任务')
      return
    }
    // @ts-ignore
    if (!window.electronAPI || !window.electronAPI.exportTasks) return
    // @ts-ignore
    const res = await window.electronAPI.exportTasks(Array.from(exportSelection), clearConfigsOnExport)
    if (res?.success) {
      modal.toast(`导出成功：${res.filePath}`)
      setIsExporting(false)
    } else if (res?.error) {
      modal.toast(`导出失败：${res.error}`)
    }
  }

  const toggleExportSelection = (id: string) => {
    setExportSelection(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleDuplicate = async (t: ScraperTask) => {
    // 匹配同原命名已经产生的副本编号
    // escape regex characters in task name
    const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(`^${escapeRegExp(t.name)}-副本(\\d+)$`)
    
    let maxN = 0
    tasks.forEach(task => {
      const match = task.name.match(regex)
      if (match) {
        maxN = Math.max(maxN, parseInt(match[1], 10))
      }
    })
    
    const newName = `${t.name}-副本${maxN + 1}`

    const newTask = {
      ...t,
      id: Math.random().toString(36).substring(2, 10),
      name: newName,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastRunAt: undefined,
      scheduleEnabled: false // 安全起见，复制出来的任务默认关闭定时
    }
    
    // @ts-ignore
    await window.electronAPI.saveTask(newTask)
    fetchTasks()
    modal.toast(`已成功复制任务: ${newName}`)
  }

  const pressTimers = React.useRef<Record<string, any>>({})
  const longPressFired = React.useRef<Record<string, boolean>>({})

  const handleMouseDown = (t: ScraperTask) => {
    longPressFired.current[t.id] = false
    if (activeTasks.has(t.id)) {
      pressTimers.current[t.id] = setTimeout(async () => {
        longPressFired.current[t.id] = true
        delete pressTimers.current[t.id]
        
        // (不再因为强制终止而关闭定时，保持用户的定时设定)

        // 2. Force stop foreground
        // @ts-ignore
        await window.electronAPI.stopTask()
        
        // 3. Force clear tracking and forcefully destroy background view
        // @ts-ignore
        if (window.electronAPI.forceClearActiveTask) {
          // @ts-ignore
          await window.electronAPI.forceClearActiveTask(t.id)
        }
        
        setActiveTasks(prev => {
          const next = new Set(prev)
          next.delete(t.id)
          return next
        })
        modal.toast(`已彻底强制终止任务: ${t.name}`)
      }, 2500)
    }
  }

  const handleMouseUp = (t: ScraperTask) => {
    if (longPressFired.current[t.id]) {
      longPressFired.current[t.id] = false
      return
    }

    if (pressTimers.current[t.id]) {
      clearTimeout(pressTimers.current[t.id])
      delete pressTimers.current[t.id]
    }
    
    handleToggleSchedule(t)
  }

  const handleMouseLeave = (t: ScraperTask) => {
    if (longPressFired.current[t.id]) {
      longPressFired.current[t.id] = false
      return
    }

    if (pressTimers.current[t.id]) {
      clearTimeout(pressTimers.current[t.id])
      delete pressTimers.current[t.id]
    }
  }

  const handleToggleSchedule = async (t: ScraperTask) => {
    if (activeTasks.has(t.id)) {
      modal.toast('任务正在执行中，若需强制终止请长按图标 2.5s');
      return;
    }

    if (!t.scheduleConfigured) {
      modal.toast(`已触发手动运行: ${t.name}`);
      // @ts-ignore
      window.electronAPI.runTask(t, false, true);
      return;
    }

    if (!t.scheduleEnabled) {
      const isFreqMode = t.scheduleType === 'frequency';
      const isValidFreq = isFreqMode && !!t.scheduleFrequency && typeof t.scheduleFrequency.value === 'number' && t.scheduleFrequency.value > 0;

      if (isFreqMode && !isValidFreq) {
        modal.toast('未能成功开启定频，因为时间间隔为空或无效，请进入配置页修复！');
        return;
      }
    }

    const updated = { ...t, scheduleEnabled: !t.scheduleEnabled };
    // @ts-ignore
    await window.electronAPI.saveTask(updated);
    fetchTasks();
  }

  const formatDate = (ts: number) => {
    if (!ts) return '-'
    const d = new Date(ts)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  const formatRunTime = (ts?: number) => {
    if (!ts) return '-'
    const d = new Date(ts)
    return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  const handleDragStart = (e: React.DragEvent, id: string) => {
    if (isSortLocked) return
    e.dataTransfer.setData('text/plain', id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault()
    if (isSortLocked) return
    if (dragOverTaskId !== id) {
      setDragOverTaskId(id)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    // Do not clear dragOverTaskId here to prevent child-element flicker
  }

  const handleDragEnd = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOverTaskId(null)
  }

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    setDragOverTaskId(null)
    if (isSortLocked) return
    
    const sourceId = e.dataTransfer.getData('text/plain')
    if (!sourceId || sourceId === targetId) return

    const sourceIndex = tasks.findIndex(t => t.id === sourceId)
    const targetIndex = tasks.findIndex(t => t.id === targetId)
    if (sourceIndex === -1 || targetIndex === -1) return

    const newTasks = [...tasks]
    const [movedTask] = newTasks.splice(sourceIndex, 1)
    newTasks.splice(targetIndex, 0, movedTask)
    
    setTasks(newTasks)
    
    // @ts-ignore
    if (window.electronAPI && window.electronAPI.updateTasksOrder) {
      // @ts-ignore
      await window.electronAPI.updateTasksOrder(newTasks.map(t => t.id))
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-darkBg h-full overflow-hidden">
      <style>{`
        @keyframes fadeInLeftList {
          0% {
            opacity: 0;
            transform: translateX(-20px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-fade-in-left-list {
          animation: fadeInLeftList 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
          opacity: 0;
        }
        .invisible-scrollbar::-webkit-scrollbar {
          width: 3px;
          height: 3px;
          background: transparent;
        }
        .invisible-scrollbar::-webkit-scrollbar-thumb {
          background: transparent;
        }
        .invisible-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
      `}</style>
      <div className="pr-3 pt-6 pb-4 flex items-center justify-between" style={{ paddingLeft: '32px', WebkitAppRegion: 'drag' } as any}>
        <div>
          <h1 className="text-2xl font-bold text-gray-200 flex items-center gap-2">
            <LayoutDashboard className="text-primary" />
            已有任务列表
          </h1>
          <p className="text-gray-500 text-sm mt-1">管理您所有的自动化爬虫编排任务</p>
        </div>
        <div className="flex gap-2 relative z-10" style={{ WebkitAppRegion: 'no-drag' } as any}>
          <button
            onClick={() => setIsSortLocked(!isSortLocked)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm active:scale-95 border ${
              isSortLocked 
                ? 'bg-slate-500/10 hover:bg-slate-500/20 text-slate-500 dark:text-slate-400 border-slate-500/20' 
                : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/20'
            } mr-2`}
          >
            {isSortLocked ? <Lock size={15} strokeWidth={2.5} /> : <Unlock size={15} strokeWidth={2.5} />}
            {isSortLocked ? '排序锁定' : '排序解锁'}
          </button>
          <button
            onClick={() => {
              setExportSelection(new Set(tasks.map(t => t.id)))
              setIsExporting(true)
            }}
            className="flex items-center gap-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm active:scale-95 border border-indigo-500/20"
          >
            <Upload size={16} strokeWidth={2.5} />
            导出任务
          </button>
          <button
            onClick={async () => {
              // @ts-ignore
              if (window.electronAPI && window.electronAPI.importTasks) {
                // @ts-ignore
                const res = await window.electronAPI.importTasks()
                if (res?.success) {
                  fetchTasks()
                  let msg = `已导入 ${res.importedCount} 条任务`
                  if (res.duplicatedCount > 0) {
                    msg += ` (重复 ${res.duplicatedCount} 条未导入)`
                  }
                  modal.toast(msg)
                } else if (res?.error && !res.canceled) {
                  modal.toast(`导入失败：${res.error}`)
                }
              }
            }}
            className="flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm active:scale-95 border border-emerald-500/20"
          >
            <Download size={16} strokeWidth={2.5} />
            导入任务
          </button>
          <button
            onClick={() => onNavigate('configurator')}
            className="flex items-center gap-2 bg-primary/20 hover:bg-primary/30 text-primary dark:text-white border border-primary/30 dark:border-slate-500/60 px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm active:scale-95 ml-2"
          >
            <Plus size={16} strokeWidth={3} /> 创建新任务
          </button>
        </div>
      </div>

      <div className="flex-1 bg-darkPanel rounded-xl border border-gray-800 overflow-hidden shadow-2xl flex flex-col mx-3 mb-6 min-h-0 relative">
        {/* Header container */}
        <div className={`flex-none z-20 bg-gray-900 transition-shadow duration-300 ${isTableScrolled ? 'shadow-[0_2px_10px_rgba(0,0,0,0.25)]' : ''}`}>
          <div className="overflow-x-hidden overflow-y-scroll invisible-scrollbar" ref={headerScrollRef}>
            <table className="w-full text-left border-collapse table-fixed" style={{ minWidth: Math.max((Object.values(colWidths) as number[]).reduce((a, b) => a + b, 0), 1000) + 'px' }}>
              <colgroup>
                <col style={{ width: colWidths.name }} />
                <col style={{ width: colWidths.steps }} />
                <col style={{ width: colWidths.batch }} />
                <col style={{ width: colWidths.schedule }} />
                <col style={{ width: colWidths.notify }} />
                <col style={{ width: colWidths.monitor }} />
                <col style={{ width: colWidths.created }} />
                <col style={{ width: colWidths.run }} />
                <col style={{ width: colWidths.actions }} />
              </colgroup>
              <thead>
                <tr className="bg-gray-900 border-b border-gray-800 text-sm text-gray-300 font-bold uppercase tracking-wider select-none">
                  <th className="p-0 border-r border-gray-800 last:border-0 align-top relative group">
                    <div className="px-4 py-4 overflow-hidden whitespace-nowrap">任务名称</div>
                    <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary z-10" onMouseDown={(e) => handleResize('name', e)} />
                  </th>
                  <th className="p-0 border-r border-gray-800 last:border-0 align-top relative group">
                    <div className="px-3 py-4 text-center overflow-hidden whitespace-nowrap">操作步骤数</div>
                    <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary z-10" onMouseDown={(e) => handleResize('steps', e)} />
                  </th>
                  <th className="p-0 border-r border-gray-800 last:border-0 align-top relative group">
                    <div className="px-3 py-4 text-center overflow-hidden whitespace-nowrap">批量状态</div>
                    <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary z-10" onMouseDown={(e) => handleResize('batch', e)} />
                  </th>
                  <th className="p-0 border-r border-gray-800 last:border-0 align-top relative group">
                    <div className="px-3 py-4 text-center overflow-hidden whitespace-nowrap">定时状态</div>
                    <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary z-10" onMouseDown={(e) => handleResize('schedule', e)} />
                  </th>
                  <th className="p-0 border-r border-gray-800 last:border-0 align-top relative group">
                    <div className="px-3 py-4 text-center overflow-hidden whitespace-nowrap">通知状态</div>
                    <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary z-10" onMouseDown={(e) => handleResize('notify', e)} />
                  </th>
                  <th className="p-0 border-r border-gray-800 last:border-0 align-top relative group">
                    <div className="px-3 py-4 text-center overflow-hidden whitespace-nowrap">运行监控</div>
                    <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary z-10" onMouseDown={(e) => handleResize('monitor', e)} />
                  </th>
                  <th className="p-0 border-r border-gray-800 last:border-0 align-top relative group">
                    <div className="px-3 py-4 text-center overflow-hidden whitespace-nowrap">创建日期</div>
                    <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary z-10" onMouseDown={(e) => handleResize('created', e)} />
                  </th>
                  <th className="p-0 border-r border-gray-800 last:border-0 align-top relative group">
                    <div className="px-3 py-4 text-center overflow-hidden whitespace-nowrap">上次运行时间</div>
                    <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary z-10" onMouseDown={(e) => handleResize('run', e)} />
                  </th>
                  <th className="p-0 align-top relative group">
                    <div className="px-4 py-4 text-center overflow-hidden whitespace-nowrap">操作</div>
                    <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary z-10" onMouseDown={(e) => handleResize('actions', e)} />
                  </th>
                </tr>
              </thead>
            </table>
          </div>
        </div>

        {/* Body container */}
        <div 
          className="overflow-y-auto overflow-x-auto thin-scrollbar flex-1 min-h-0"
          onScroll={(e) => {
            const isScrolled = e.currentTarget.scrollTop > 0;
            if (isTableScrolled !== isScrolled) {
              setIsTableScrolled(isScrolled);
            }
            if (headerScrollRef.current && headerScrollRef.current.scrollLeft !== e.currentTarget.scrollLeft) {
              headerScrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
            }
          }}
        >
          <table className="w-full text-left border-collapse table-fixed" style={{ minWidth: Math.max((Object.values(colWidths) as number[]).reduce((a, b) => a + b, 0), 1000) + 'px' }}>
            <colgroup>
              <col style={{ width: colWidths.name }} />
              <col style={{ width: colWidths.steps }} />
              <col style={{ width: colWidths.batch }} />
              <col style={{ width: colWidths.schedule }} />
              <col style={{ width: colWidths.notify }} />
              <col style={{ width: colWidths.monitor }} />
              <col style={{ width: colWidths.created }} />
              <col style={{ width: colWidths.run }} />
              <col style={{ width: colWidths.actions }} />
            </colgroup>
            <tbody>
              {tasks.map((t, index) => (
                <tr 
                  key={t.id} 
                  draggable={!isSortLocked}
                  onDragStart={(e) => handleDragStart(e, t.id)}
                  onDragOver={(e) => handleDragOver(e, t.id)}
                  onDragLeave={handleDragLeave}
                  onDragEnd={handleDragEnd}
                  onDrop={(e) => handleDrop(e, t.id)}
                  className={`border-b border-gray-800 transition-colors group animate-fade-in-left-list ${highlightedTaskId === t.id ? 'bg-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.4)]' : 'hover:bg-gray-800/30'} ${dragOverTaskId === t.id ? 'bg-primary/20 relative z-10 shadow-[inset_0_2px_0_0_#6366f1,inset_0_-2px_0_0_#6366f1]' : ''} ${!isSortLocked ? 'cursor-grab active:cursor-grabbing' : ''}`}
                  style={{ animationDelay: `${Math.min(index * 30, 800)}ms` }}
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      {!isSortLocked && (
                        <GripVertical size={16} className="text-amber-600 dark:text-amber-400 shrink-0" />
                      )}
                      <button
                        onMouseDown={() => handleMouseDown(t)}
                        onMouseUp={() => handleMouseUp(t)}
                        onMouseLeave={() => handleMouseLeave(t)}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                            activeTasks.has(t.id) 
                            ? 'bg-green-500/20 text-emerald-500 hover:bg-green-500/30 border border-green-500/30 shadow-[0_0_10px_rgba(16,185,129,0.3)] animate-pulse' 
                            : (t.scheduleConfigured && t.scheduleEnabled)
                            ? 'bg-green-500/20 text-emerald-500 hover:bg-green-500/30 border border-green-500/30 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700 hover:text-gray-200 shadow-sm'
                          }`}
                        title={activeTasks.has(t.id) ? '任务正在执行中...' : (t.scheduleConfigured && t.scheduleEnabled) ? '停止定时调度' : '启动'}
                      >
                        {activeTasks.has(t.id) || (t.scheduleConfigured && t.scheduleEnabled) ? <Square size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" className="ml-0.5" />}
                      </button>
                      <span className="font-bold text-gray-200 text-base truncate max-w-[180px]" title={t.name}>{t.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-4 text-center">
                    <span className="inline-block px-2.5 py-1 bg-gray-800 text-gray-300 text-xs rounded font-mono">
                      {(t.steps || []).length} 步
                    </span>
                  </td>
                  <td className="px-3 py-4 text-center">
                    {t.batchParam?.enabled ? (
                      <span 
                        className="inline-block px-2.5 py-1 text-xs rounded font-mono border" 
                        title="并发数量"
                        style={{ backgroundColor: 'var(--accent-subtle)', color: 'var(--accent)', borderColor: 'var(--border)' }}
                      >
                        {t.batchParam.paramValues?.length || 0}
                      </span>
                    ) : (
                      <span className="text-sm" style={{ color: 'var(--text-faint)' }}>-</span>
                    )}
                  </td>
                  <td className="px-3 py-4 text-center">
                    {!t.scheduleConfigured ? (
                      <span className="text-sm" style={{ color: 'var(--text-muted)' }}>未配置</span>
                    ) : t.scheduleType === 'frequency' && t.scheduleFrequency ? (
                      <span 
                        className="inline-block px-2 py-1 font-bold border text-[11px] rounded shadow-sm"
                        style={t.scheduleEnabled 
                          ? { backgroundColor: 'var(--accent-subtle)', color: 'var(--accent)', borderColor: 'var(--border)' }
                          : { backgroundColor: 'var(--bg-elevated)', color: 'var(--text-muted)', borderColor: 'var(--border)' }}
                      >
                        每 {t.scheduleFrequency.value} {t.scheduleFrequency.unit === 'hours' ? '时' : t.scheduleFrequency.unit === 'minutes' ? '分' : '秒'}
                      </span>
                    ) : t.schedule && t.schedule.length > 0 ? (
                      <span 
                        className="inline-block px-2 py-1 font-bold border text-[11px] rounded shadow-sm"
                        style={t.scheduleEnabled 
                          ? { backgroundColor: 'var(--success-subtle)', color: 'var(--success)', borderColor: 'var(--border)' }
                          : { backgroundColor: 'var(--bg-elevated)', color: 'var(--text-muted)', borderColor: 'var(--border)' }}
                      >
                        {t.schedule.length} 时段
                      </span>
                    ) : (
                      <span className="text-sm" style={{ color: 'var(--text-muted)' }}>无效配置</span>
                    )}
                  </td>
                  <td className="px-3 py-4 text-center">
                    <select
                      className="bg-gray-800 text-xs text-gray-200 pl-2.5 pr-2 py-1.5 rounded-md outline-none border border-gray-700 hover:border-gray-500 focus:border-primary w-full truncate cursor-pointer shadow-sm"
                      value={t.notificationConfigId || 'none'}
                      onChange={async (e) => {
                        const val = e.target.value;
                        const updated = { ...t, notificationConfigId: val === 'none' ? undefined : val };
                        // @ts-ignore
                        await window.electronAPI.saveTask(updated);
                        fetchTasks();
                      }}
                      title={notificationConfigs.find(c => c.id === t.notificationConfigId)?.name || '不通知'}
                    >
                      <option value="none">不通知</option>
                      {notificationConfigs.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-4 text-center">
                    {t.monitorEnabled ? (
                      t.monitorMode === 'chart' ? (
                        <span className="inline-block px-2 py-1 bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-500/20 text-xs rounded">
                          图表
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-1 bg-slate-100 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-500/20 text-xs rounded">
                          常规
                        </span>
                      )
                    ) : (
                      <span className="text-gray-600 text-sm">-</span>
                    )}
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-400 font-mono text-center">
                    {formatDate(t.createdAt)}
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-400 font-mono text-center">
                    {formatRunTime(t.lastRunAt)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleDuplicate(t)}
                        className="p-2 text-gray-400 hover:text-green-400 hover:bg-green-500/10 rounded transition-colors"
                        title="复制任务"
                      >
                        <Copy size={16} />
                      </button>
                      <button
                        onClick={() => handleEdit(t)}
                        className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded transition-colors"
                        title="加载并编辑"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                        title="彻底删除"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {tasks.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <LayoutDashboard size={32} className="opacity-20" />
                      <p>暂无任务，请前往配置器新建您的第一个自动化爬虫。</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export Modal */}
      {isExporting && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm animate-in fade-in duration-300">
          <div 
            className="border rounded-2xl w-[500px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            <div 
              className="p-5 pb-4 border-b flex justify-between items-center"
              style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)' }}
            >
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>批量导出任务</h2>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setExportSelection(new Set(tasks.map(t => t.id)))}
                    className="text-xs px-2 py-1 rounded border transition-colors hover:opacity-80"
                    style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                  >
                    全选
                  </button>
                  <button 
                    onClick={() => setExportSelection(new Set())}
                    className="text-xs px-2 py-1 rounded border transition-colors hover:opacity-80"
                    style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                  >
                    全不选
                  </button>
                  <label 
                    className="text-xs px-2 py-1 rounded border transition-colors cursor-pointer flex items-center gap-1.5 hover:opacity-80 group"
                    style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                  >
                    <input 
                      type="checkbox" 
                      className="w-3 h-3 rounded"
                      checked={clearConfigsOnExport}
                      onChange={(e) => setClearConfigsOnExport(e.target.checked)}
                      style={{ accentColor: 'var(--accent)' }}
                    />
                    <span>去除Slack/飞书配置</span>
                  </label>
                </div>
              </div>
              <button onClick={() => setIsExporting(false)} className="transition-colors hover:opacity-80" style={{ color: 'var(--text-muted)' }}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[50vh]" style={{ backgroundColor: 'var(--bg-main)' }}>
              <div className="space-y-1">
                {tasks.map(t => (
                  <label 
                    key={t.id} 
                    className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors border border-transparent group hover:bg-black/5 dark:hover:bg-white/5"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    <input 
                      type="checkbox" 
                      checked={exportSelection.has(t.id)}
                      onChange={() => toggleExportSelection(t.id)}
                      className="w-4 h-4 rounded focus:ring-offset-0"
                      style={{ 
                        accentColor: 'var(--accent)', 
                        backgroundColor: 'var(--bg-surface)', 
                        borderColor: 'var(--border)' 
                      }}
                    />
                    <span className="flex-1 text-sm font-medium truncate opacity-90 group-hover:opacity-100">{t.name}</span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{t.steps?.length || 0} 个步骤</span>
                  </label>
                ))}
                {tasks.length === 0 && <div className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>暂无任务</div>}
              </div>
            </div>

            <div 
              className="p-4 border-t flex justify-between items-center"
              style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)' }}
            >
              <div className="text-sm" style={{ color: 'var(--text-muted)' }}>已选择 <span className="font-bold" style={{ color: 'var(--accent)' }}>{exportSelection.size}</span> 个任务</div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsExporting(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:opacity-80"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  取消
                </button>
                <button 
                  onClick={confirmExport}
                  disabled={exportSelection.size === 0}
                  className="px-6 py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:brightness-110 text-white"
                  style={{ backgroundColor: 'var(--accent)' }}
                >
                  确认导出
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
