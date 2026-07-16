import React, { useState, useEffect } from 'react'
import { useTask } from '../context/TaskContext'
// @ts-ignore
import { Bug, Save, BugOff, ChevronDown } from 'lucide-react'
import { useModal } from '../context/ModalContext'
import { ScraperStep, ScraperTask } from '../../../shared/types'
// @ts-ignore
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
// @ts-ignore
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
// @ts-ignore
import { CSS } from '@dnd-kit/utilities'

// 步骤卡片组件
function StepNode({
  step,
  index,
  onRemove,
  isActive,
  isExecuting,
  isTaskRunning,
  result,
  onEdit,
  dragHandleProps,
  activeStepId,
  stepResults,
  isChild = false
}: any) {
  const { setPendingStep, setActiveStepId, activeDropzone, setActiveDropzone } = useTask()

  const getTypeLabel = (type: ScraperStep['type']) => {
    switch (type) {
      case 'readText': return <span className="text-blue-400">读取文本</span>
      case 'readAttr': return <span className="text-purple-400">读取属性</span>
      case 'click': return <span className="text-orange-400">点击元素</span>
      case 'input': return <span className="text-green-400">输入文本</span>
      case 'waitForSelector': return <span className="text-gray-400">等待出现</span>
      case 'waitTimer': return <span className="text-yellow-400">固定等待</span>
      case 'downloadFile': return <span className="text-pink-400">下载文件</span>
      case 'navigate': return <span className="text-cyan-400">访问网页</span>
      case 'calculate': return <span className="text-pink-400">变量运算</span>
      case 'skipPopup': return <span className="text-amber-400">跳过弹窗</span>
      case 'if_else': return <span className="text-indigo-400">条件分支</span>
      case 'mouseMove': return <span className="text-lime-400">移动鼠标</span>
      case 'pressKey': return <span className="text-teal-400">模拟按键</span>
      case 'waitForText': return <span className="text-gray-400">等待文本</span>
      case 'scrollToElement': return <span className="text-sky-400">滚至元素</span>
      case 'scrollPage': return <span className="text-sky-400">页面滚动</span>
      case 'readLocalFile': return <span className="text-fuchsia-400">读取文件</span>
      case 'fileAction': return <span className="text-rose-400">文件操作</span>
      case 'runPython': return <span className="text-emerald-400">运行脚本</span>
      case 'goto': return <span className="text-violet-400">跳转步骤</span>
      case 'condition': return <span className="text-indigo-400">条件判断</span>
      case 'screenshot': return <span className="text-blue-400">网页截图</span>
      default: return <span className="text-gray-300">未知操作</span>
    }
  }

  const getDesc = (step: ScraperStep) => {
    switch (step.type) {
      case 'readText': return `存入变量 ${step.outputVariable || '未命名'}`
      case 'readAttr': return `读取属性 ${(step as any).attrName} -> ${step.outputVariable}`
      case 'click': return '执行点击操作'
      case 'input': return `输入: ${step.value}`
      case 'waitForSelector': return '等待此元素就绪'
      case 'waitTimer': return `等待 ${step.waitDuration || 1} 秒`
      case 'downloadFile': return `保存至: ${step.downloadDir || '默认目录'}`
      case 'navigate': return `前往: ${step.value}`
      case 'calculate': return `运算: ${step.value} -> [${step.outputVariable}]`
      case 'skipPopup': return '自动检测并关闭覆盖弹窗'
      case 'if_else': return `判断: ${step.conditionVar || '?'} ${step.conditionOperator || '=='} ${step.conditionValue || '?'}`
      case 'mouseMove': return '移动到该元素上方'
      case 'pressKey': return `按下按键: ${step.keyToPress || 'Enter'}`
      case 'waitForText': return `等待包含: ${step.value}`
      case 'scrollToElement': return `对齐方式: ${step.scrollAlignment || 'center'}`
      case 'scrollPage': return `方向: ${step.scrollDirection === 'pixels' ? `${step.scrollPixels}px` : step.scrollDirection}`
      case 'readLocalFile': return `提取至变量: ${step.outputVariable || '未配置'}`
      case 'fileAction': return `操作: ${step.fileActionType === 'delete' ? '删除' : step.fileActionType === 'mkdir' ? '新建' : '重命名'}`
      case 'runPython': return `结果变量: ${step.outputVariable || '无'}`
      case 'goto': return `目标 ID: ${step.gotoStepId ? step.gotoStepId.substring(0, 6) : '未配置'}`
      case 'condition': return `判断: ${step.conditionVar || '?'} ${step.conditionOperator || '=='} ${step.conditionValue || '?'}`
      case 'screenshot': return `截图路径: ${step.savePath || '默认目录'}`
      default: return '未配置参数'
    }
  }

  const handleContinue = () => {
    if (step.id) {
      const event = new CustomEvent('step-executing', { detail: step.id })
      window.dispatchEvent(event)
    }
    // @ts-ignore
    window.electronAPI.stepContinue()
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        className={`flex flex-col gap-2 ${isChild ? 'p-2' : 'p-3'} bg-gray-800/80 border rounded-lg group transition-colors select-none ${(isActive && !isTaskRunning) ? 'border-primary shadow-[0_0_15px_rgba(59,130,246,0.4)] animate-pulse bg-blue-900/20' :
            (isActive && isTaskRunning) ? 'border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.2)] bg-amber-900/10' :
              result?.success ? 'border-green-500/30 bg-green-900/10' :
                result?.error ? 'border-red-500/30 bg-red-900/10' :
                  'border-gray-700 hover:border-gray-500'
          }`}
        title={!isChild ? "双击进行编辑" : ""}
      >
        <div className="flex items-center gap-2 relative" onDoubleClick={onEdit}>
          {dragHandleProps && (
            <div {...dragHandleProps} className="cursor-grab text-gray-500 hover:text-gray-300 shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="12" r="1" /><circle cx="9" cy="5" r="1" /><circle cx="9" cy="19" r="1" />
                <circle cx="15" cy="12" r="1" /><circle cx="15" cy="5" r="1" /><circle cx="15" cy="19" r="1" />
              </svg>
            </div>
          )}

          <div className="bg-gray-900 text-gray-400 text-[12px] w-5 h-5 flex items-center justify-center rounded-full font-mono shrink-0">{index + 1}</div>

          <div className="flex-1 overflow-hidden">
            <div className="text-xs font-bold mb-0.5 flex gap-2 items-center">
              {getTypeLabel(step.type)}
              <span className="text-gray-500 dark:text-[#b1b8c0] truncate block flex-1 font-normal" title={step.selector}>
                {step.selector || '全局操作'}
              </span>
            </div>
            <div className="text-xs text-gray-300 truncate">
              {getDesc(step)}
            </div>
          </div>

          <div className="absolute right-0 top-0 bottom-0 flex items-center justify-end pl-8 bg-gradient-to-r from-transparent via-gray-800/90 to-gray-800 rounded-r opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <button
              onClick={() => onRemove(step.id)}
              className="text-gray-500 hover:text-red-400 transition-all p-1 pointer-events-auto"
              title="删除步骤"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
            </button>
          </div>
        </div>

        {(isActive && isTaskRunning) && (
          <button
            onClick={handleContinue}
            disabled={isExecuting}
            className={`w-full py-1.5 mt-1 text-white text-xs font-bold rounded shadow transition-all ${isExecuting
                ? 'bg-blue-600/50 cursor-not-allowed animate-none'
                : 'bg-primary hover:bg-blue-600 animate-none'
              }`}
          >
            {isExecuting ? '正在后台执行...' : '▶ 执行此步'}
          </button>
        )}

        {result && (
          <div className="text-xs bg-gray-900/50 py-1 px-2 rounded mt-0 overflow-hidden break-all" onDoubleClick={onEdit}>
            {result.success ? (
              <span className="text-green-400 font-mono font-bold">✅ 成功 {result.variables && Object.keys(result.variables).length > 0 ? `| 变量: ${JSON.stringify(result.variables)}` : ''}</span>
            ) : (
              <span className="text-red-400 font-mono font-bold">❌ 失败: {result.error}</span>
            )}
          </div>
        )}
      </div>

      {/* if_else 嵌套分支渲染 */}
      {step.type === 'if_else' && (
        <div className="flex gap-2 mt-1 mb-2">
          {/* True Branch */}
          <div className="flex-1 min-w-0 flex flex-col gap-2 bg-gray-800/30 p-2 rounded border border-green-500/40 dark:border-green-400/80 shadow-[0_0_8px_rgba(74,222,128,0.05)]">
            <div className="text-[10px] text-green-500 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> 满足条件 (True)
            </div>
            {(step.trueBranchSteps || []).map((childStep: any, childIndex: number) => (
              <StepNode
                key={childStep.id}
                step={childStep}
                index={childIndex}
                onRemove={onRemove}
                isActive={activeStepId === childStep.id}
                isExecuting={isExecuting}
                isTaskRunning={isTaskRunning}
                result={stepResults?.[childStep.id]}
                onEdit={() => {
                  if (!isTaskRunning) {
                    setPendingStep(null)
                    setActiveStepId(childStep.id)
                  }
                }}
                activeStepId={activeStepId}
                stepResults={stepResults}
                isChild={true}
              />
            ))}
            <button
              onClick={() => {
                setActiveDropzone({ parentId: step.id, branch: 'true' })
                setPendingStep({
                  id: Math.random().toString(36).substring(2, 10),
                  type: 'navigate',
                  selector: '',
                  selectorXPath: '',
                  tagName: '',
                  innerText: '',
                  outputVariable: '',
                  value: '',
                  attrName: '',
                  description: '手动添加的分支步骤'
                })
                setActiveStepId(null)
              }}
              className={`w-full py-1.5 rounded border border-dashed flex justify-center items-center transition-colors ${
                activeDropzone?.parentId === step.id && activeDropzone?.branch === 'true'
                  ? 'border-green-500 text-green-500 bg-green-500/10'
                  : 'border-gray-700 text-gray-500 hover:border-green-500/50 hover:text-green-500/80 hover:bg-green-500/5'
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          </div>

          {/* False Branch */}
          <div className="flex-1 min-w-0 flex flex-col gap-2 bg-gray-800/30 p-2 rounded border border-red-500/40 dark:border-red-400/80 shadow-[0_0_8px_rgba(248,113,113,0.05)]">
            <div className="text-[10px] text-red-500 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> 不满足 (False)
            </div>
            {(step.falseBranchSteps || []).map((childStep: any, childIndex: number) => (
              <StepNode
                key={childStep.id}
                step={childStep}
                index={childIndex}
                onRemove={onRemove}
                isActive={activeStepId === childStep.id}
                isExecuting={isExecuting}
                isTaskRunning={isTaskRunning}
                result={stepResults?.[childStep.id]}
                onEdit={() => {
                  if (!isTaskRunning) {
                    setPendingStep(null)
                    setActiveStepId(childStep.id)
                  }
                }}
                activeStepId={activeStepId}
                stepResults={stepResults}
                isChild={true}
              />
            ))}
            <button
              onClick={() => {
                setActiveDropzone({ parentId: step.id, branch: 'false' })
                setPendingStep({
                  id: Math.random().toString(36).substring(2, 10),
                  type: 'navigate',
                  selector: '',
                  selectorXPath: '',
                  tagName: '',
                  innerText: '',
                  outputVariable: '',
                  value: '',
                  attrName: '',
                  description: '手动添加的分支步骤'
                })
                setActiveStepId(null)
              }}
              className={`w-full py-1.5 rounded border border-dashed flex justify-center items-center transition-colors ${
                activeDropzone?.parentId === step.id && activeDropzone?.branch === 'false'
                  ? 'border-red-500 text-red-500 bg-red-500/10'
                  : 'border-gray-700 text-gray-500 hover:border-red-500/50 hover:text-red-500/80 hover:bg-red-500/5'
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function SortableStep(props: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.step.id })
  const style = { 
    transform: CSS.Translate.toString(transform), 
    transition,
    ...(isDragging ? { zIndex: 9999, position: 'relative' as const } : {})
  }
  
  return (
    <div ref={setNodeRef} style={style}>
      <StepNode {...props} dragHandleProps={{...attributes, ...listeners}} />
    </div>
  )
}

export default function StepsList() {
  const { task, updateTask, removeStep, isDebugMode, setIsDebugMode, resetTask, setPendingStep, activeStepId, setActiveStepId, visitedUrls, setActiveDropzone } = useTask()
  const modal = useModal()
  const [showUrlHistory, setShowUrlHistory] = useState(false)

  const insertParam = () => {
    if (task.batchParam?.paramName) {
      updateTask({ targetUrl: (task.targetUrl || '') + `{{${task.batchParam.paramName}}}` })
    }
  }

  const [executingStepId, setExecutingStepId] = useState<string | null>(null)
  const [stepResults, setStepResults] = useState<Record<string, { success: boolean; variables?: any; error?: string }>>({})
  const [isTaskRunning, setIsTaskRunning] = useState(false)
  const [isChained, setIsChained] = useState(false)
  const [isTimeoutMenuOpen, setIsTimeoutMenuOpen] = useState(false)

  useEffect(() => {
    // @ts-ignore
    if (window.electronAPI) {
      // @ts-ignore
      window.electronAPI.getAllTasks().then(res => {
        if (res?.success && res.data && task.id) {
          const chained = res.data.some((t: ScraperTask) => t.nextTaskId === task.id)
          setIsChained(chained)
        } else {
          setIsChained(false)
        }
      })
    }
  }, [task.id])

  React.useEffect(() => {
    // @ts-ignore
    if (!window.electronAPI) return

    // @ts-ignore
    const unsubStepReady = window.electronAPI.onStepReady((data: any) => {
      if (typeof data === 'string') {
        setActiveStepId(data)
        setExecutingStepId(null)
      } else if (!data.taskId || data.taskId === task.id) {
        setActiveStepId(data.stepId)
        setExecutingStepId(null)
      }
    })

    // @ts-ignore
    const unsubStepResult = window.electronAPI.onStepResult((data: any) => {
      if (!data.taskId || data.taskId === task.id) {
        setStepResults(prev => ({ ...prev, [data.stepId]: data }))
        setActiveStepId(null)
        setExecutingStepId(null)
      }
    })

    // @ts-ignore
    const unsubTaskComplete = window.electronAPI.onTaskComplete((data: any) => {
      if (!data || !data.taskId || data.taskId === task.id) {
        setActiveStepId(null)
        setExecutingStepId(null)
        setIsTaskRunning(false)
      }
    })

    // @ts-ignore
    const unsubTaskError = window.electronAPI.onTaskError((errData: any) => {
      if (typeof errData === 'string' || !errData.taskId || errData.taskId === task.id) {
        setActiveStepId(null)
        setIsTaskRunning(false)
      }
    })

    const handleStepExecuting = (e: any) => {
      setExecutingStepId(e.detail)
    }
    window.addEventListener('step-executing', handleStepExecuting)

    // @ts-ignore
    const unsubTaskStarted = window.electronAPI.onTaskStarted && window.electronAPI.onTaskStarted((data: any) => {
      if (!data || !data.taskId || data.taskId === task.id) {
        setStepResults({})
        setActiveStepId(null)
        setExecutingStepId(null)
        setIsTaskRunning(true)
      }
    })

    return () => {
      unsubStepReady && unsubStepReady()
      unsubStepResult && unsubStepResult()
      unsubTaskComplete && unsubTaskComplete()
      unsubTaskError && unsubTaskError()
      unsubTaskStarted && unsubTaskStarted()
      window.removeEventListener('step-executing', handleStepExecuting)
    }
  }, [task.id])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: any) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const items = task.steps || []
      const oldIndex = items.findIndex(i => i.id === active.id)
      const newIndex = items.findIndex(i => i.id === over.id)
      updateTask({ steps: arrayMove(items, oldIndex, newIndex) })
    }
  }

  const handleSave = async () => {
    if (!task.name || task.name.trim() === '') {
      modal.toast('未命名无法保存，请先填写任务名称！')
      return
    }

    if (!task.targetUrl || task.targetUrl.trim() === '') {
      modal.toast('目标URL输入为空，无法保存任务，请输入或选择URL')
      return
    }

    let taskToSave = { ...task };
    let hasFreqWarning = false;
    if (taskToSave.scheduleConfigured && taskToSave.scheduleType === 'frequency') {
      const val = taskToSave.scheduleFrequency?.value;
      if (val === undefined || val === null || val === '' as any || val <= 0) {
        hasFreqWarning = true;
        taskToSave.scheduleConfigured = false;
        updateTask({ scheduleConfigured: false });
      }
    }

    // @ts-ignore
    if (window.electronAPI) {
      // @ts-ignore
      const res = await window.electronAPI.saveTask(taskToSave)
      if (res && !res.success) {
        modal.toast('保存失败: ' + (res.error || '未知错误'))
      } else {
        if (hasFreqWarning) {
          modal.toast('任务已保存，但未能成功开启定频，已为您自动取消勾选（时间间隔为空或无效）！')
        } else {
          modal.toast('任务保存成功！')
        }
        window.dispatchEvent(new CustomEvent('task-saved', { detail: taskToSave.id }))
        window.dispatchEvent(new CustomEvent('navigate-to', { detail: 'tasks' }))
        resetTask()
      }
    }
  }

  const handleAddManualStep = () => {
    setActiveDropzone(null)
    setPendingStep({
      id: Math.random().toString(36).substring(2, 10),
      type: 'waitTimer',
      selector: '',
      selectorXPath: '',
      tagName: '',
      innerText: '',
      outputVariable: '',
      value: '',
      attrName: '',
      description: '手动添加的等待步骤'
    })
    setActiveStepId(null)
  }

  return (
    <div className="h-full flex flex-col">
      {/* 顶部工具栏区 */}
      <div className="flex-none mb-4 pb-0 flex gap-3">
        <div className="flex-1 flex items-center">
          <input
            type="text"
            className="w-full bg-transparent text-lg leading-[28px] h-[28px] font-bold outline-none border-b border-transparent focus:border-primary px-1 transition-colors placeholder:text-[var(--text-faint)] placeholder:opacity-50 focus:placeholder:opacity-0 translate-y-[2px]"
            style={{ color: 'var(--text-primary)' }}
            value={task.name}
            onChange={e => updateTask({ name: e.target.value })}
            placeholder="请填入任务名称"
            onFocus={(e) => e.target.placeholder = ''}
            onBlur={(e) => e.target.placeholder = '请填入任务名称'}
          />
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          <button
            onClick={() => setIsDebugMode(!isDebugMode)}
            className={`px-6 py-1.5 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 border ${isDebugMode
                ? 'bg-amber-500/20 text-amber-600 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                : 'bg-gray-800 border-gray-700 text-gray-300 hover:opacity-80'
              }`}
            style={!isDebugMode ? { backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)', borderColor: 'var(--border)' } : undefined}
            title="开启单步调试模式，引擎执行时将在每步前暂停"
          >
            {isDebugMode ? <Bug size={16} /> : <BugOff size={16} />}
            {isDebugMode ? '调试开启' : '调试关闭'}
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-1.5 rounded-lg font-bold text-sm shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-2"
            style={{ backgroundColor: 'var(--success)', color: '#fff' }}
          >
            <Save size={16} className="fill-white/20" />
            保存任务
          </button>
        </div>
      </div>

      {/* 目标网页 URL 移植区 */}
      <div className="relative bg-gray-900/40 border border-gray-700 rounded-lg p-3 flex flex-col gap-2 mb-1 shrink-0" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
        <label className="text-xs font-bold flex items-center justify-between" style={{ color: 'var(--text-secondary)' }}>
          <span className="flex items-center gap-1.5">🌐 目标网页 URL</span>
          <div className="flex items-center gap-3">
            {task.batchParam?.enabled && task.batchParam.paramName && (
              <span
                className="text-[11px] cursor-pointer hover:underline"
                style={{ color: 'var(--accent)' }}
                onClick={insertParam}
              >
                插入变量 {'{{'}{task.batchParam.paramName}{'}}'}
              </span>
            )}
            <div>
              <button
                onClick={() => setShowUrlHistory(!showUrlHistory)}
                className="text-[11px] hover:opacity-80 flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors font-medium"
                style={{ color: 'var(--text-muted)' }}
                title="查看访问过的历史 URL"
              >
                历史记录 ▼
              </button>
            </div>
          </div>
        </label>
        <input
          type="text"
          placeholder="支持 {{变量名}} 语法"
          className="text-xs px-2.5 py-1.5 rounded-lg outline-none border focus:border-primary w-full"
          style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
          value={task.targetUrl || ''}
          onChange={e => updateTask({ targetUrl: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && task.targetUrl) {
              e.preventDefault();
              let navUrl = task.targetUrl;
              if (!navUrl.startsWith('http')) {
                navUrl = 'https://' + navUrl;
              }
              // @ts-ignore
              window.electronAPI.navigateBrowser(navUrl);
            }
          }}
        />

        {showUrlHistory && (
          <div className="absolute top-[calc(100%+4px)] left-0 right-0 rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.25)] z-50 max-h-48 overflow-y-auto border border-cyan-500/60" style={{ backgroundColor: 'var(--bg-panel)' }}>
            {visitedUrls.length === 0 ? (
              <div className="p-2 text-[11px] text-center font-normal" style={{ color: 'var(--text-muted)' }}>暂无访问记录</div>
            ) : (
              visitedUrls.map((url, idx) => (
                <div
                  key={idx}
                  className="px-3 py-2 text-[11px] cursor-pointer truncate transition-colors border-b last:border-0 font-normal hover:opacity-80"
                  style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-subtle)' }}
                  onClick={() => {
                    updateTask({ targetUrl: url })
                    setShowUrlHistory(false)
                  }}
                  title={url}
                >
                  {url}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* 步骤列表区 */}
      <div className="flex justify-between items-center mb-2 px-1 mt-2">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-sm" style={{ color: 'var(--text-secondary)' }}>执行管线</h3>
          <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>共 {(task.steps || []).length} 步</span>
        </div>
        <div className="relative" onMouseLeave={() => setIsTimeoutMenuOpen(false)}>
          <button 
            onClick={() => setIsTimeoutMenuOpen(!isTimeoutMenuOpen)}
            className="text-xs px-2 h-[26px] flex items-center gap-1 rounded transition-colors border hover:opacity-80" 
            style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--bg-main)', borderColor: 'var(--border)' }}
            title="强制步进超时时间 (超过后强行跳过该步)"
          >
            {task.timeoutSeconds ? `${task.timeoutSeconds}s 强制步进` : '不限时'} <ChevronDown size={12} />
          </button>
          <div 
            className={`absolute right-0 top-full pt-1 w-32 transition-all z-10 ${isTimeoutMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`} 
          >
            <div 
              className="rounded shadow-[0_0_15px_rgba(6,182,212,0.4)] border border-cyan-500/60 overflow-hidden"
              style={{ backgroundColor: 'var(--bg-surface)' }}
            >
              {[
                { label: '不限时', value: 0 },
                { label: '5秒强制步进', value: 5 },
                { label: '10秒强制步进', value: 10 },
                { label: '20秒强制步进', value: 20 },
                { label: '30秒强制步进', value: 30 },
                { label: '60秒强制步进', value: 60 },
                { label: '120秒强制步进', value: 120 },
                { label: '180秒强制步进', value: 180 },
              ].map(opt => (
                <button 
                  key={opt.value}
                  onClick={() => {
                    updateTask({ timeoutSeconds: opt.value })
                    setIsTimeoutMenuOpen(false)
                  }} 
                  className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${task.timeoutSeconds === opt.value ? 'bg-black/20 font-bold' : 'hover:bg-black/10 dark:hover:bg-white/5'}`}
                  style={{ color: task.timeoutSeconds === opt.value ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {isChained && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-2 mb-3 mx-1">
          <p className="text-[11px] text-primary font-medium flex items-center gap-1.5">
            🔗 受到其他任务链式调用，可能会继承外部变量
          </p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto thin-scrollbar pr-1 pb-4">
        {(!task.steps || task.steps.length === 0) ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 text-sm border border-dashed border-gray-800 rounded-xl text-center">
            <div className="text-3xl mb-2 opacity-50">📋</div>
            暂无任务步骤<br />请从左侧页面提取
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={(task.steps || []).map(s => s.id)} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-2">
                {(task.steps || []).map((step, index) => (
                  <SortableStep
                    key={step.id}
                    step={step}
                    index={index}
                    onRemove={removeStep}
                    isActive={activeStepId === step.id}
                    isExecuting={executingStepId === step.id}
                    isTaskRunning={isTaskRunning}
                    result={stepResults[step.id]}
                    onEdit={() => {
                      if (!isTaskRunning) {
                        setPendingStep(null)
                        setActiveStepId(step.id)
                      }
                    }}
                    activeStepId={activeStepId}
                    stepResults={stepResults}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      <div className="pt-3 border-t border-gray-800 shrink-0">
        <button onClick={handleAddManualStep} className="w-full py-1.5 text-xs rounded border transition-colors opacity-80 hover:opacity-100" style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)', borderColor: 'var(--border)' }}>
          + 手动添加自定义步骤
        </button>
      </div>
    </div>
  )
}
