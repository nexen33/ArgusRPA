import React, { useState } from 'react'
import { useTask } from '../context/TaskContext'
import { useModal } from '../context/ModalContext'
import { Lock, Clock, Layers, Link as LinkIcon, Bell, LineChart, ChevronLeft, Save, Import, ArrowRight, ArrowRightLeft, AlertTriangle, ArrowDownLeft, ChevronDown, ChevronRight, ShieldCheck } from 'lucide-react'
import { parseChromeRecorderJSON } from '../utils/chromeRecorderParser'
import BatchParamEditor from './BatchParamEditor'
import DesktopSystemActionEditor from './ParamsEditors/DesktopSystemActionEditor'
import DesktopFlowActionEditor from './ParamsEditors/DesktopFlowActionEditor'
import DesktopActionEditor from './ParamsEditors/DesktopActionEditor'

const GLOBAL_TYPES = ['waitTimer', 'calculate', 'readLocalFile', 'fileAction', 'runPython', 'goto', 'readClipboard', 'assignVariable']

export default function DesktopParamsPanel() {
  const { task, updateTask, activeStepId, setActiveStepId, isPickerMode, setIsPickerMode, pendingStep, setPendingStep, activeDropzone, setActiveDropzone } = useTask()
  const modal = useModal()
  const [activeConfigCard, setActiveConfigCard] = useState<string | null>(null)
  const [actionTypeDropdownOpen, setActionTypeDropdownOpen] = useState(false)

  React.useEffect(() => {
    // @ts-ignore
    if (!window.electronAPI) return
    // @ts-ignore
    const unsub = window.electronAPI.onElementSelected((data: any) => {
      setIsPickerMode(false)
      // @ts-ignore
      window.electronAPI.setPickerMode(false)

      setPendingStep((prev: any) => {
        if (prev) {
          return {
            ...prev,
            type: GLOBAL_TYPES.includes(prev.type) ? 'click' : prev.type,
            selector: data.cssSelector || '',
            tagName: data.tagName || '',
            innerText: data.innerText || '',
          }
        }
        return {
          id: Math.random().toString(36).substring(2, 10),
          type: 'click', // Default action type
          selector: data.cssSelector || '',
          tagName: data.tagName || '',
          innerText: data.innerText || '',
          outputVariable: '',
          value: '',
          attrName: '',
          description: '',
        }
      })
      setActiveStepId(null) // deselect active step to show creation panel
    })
    return () => {
      unsub && unsub()
    }
  }, [setIsPickerMode, setActiveStepId, activeStepId])

  React.useEffect(() => {
    if (activeStepId) {
      setActiveConfigCard(null)
    }
  }, [activeStepId])

  const handleAddManualStep = () => {
    if (isPending) return; // Already in add step mode, do nothing

    const newStep = {
      id: 'step-' + Date.now(),
      type: 'waitTimer',
      selector: '',
      waitDuration: 1,
      description: '',
    } as any
    if (activeStepId) {
      newStep.insertAfterId = activeStepId;
      setPendingStep(newStep);
      setActiveStepId(null);
    } else {
      setPendingStep(newStep)
    }
  }

  const findStepRecursively = (steps: any[], id: string): any => {
    for (const s of steps) {
      if (s.id === id) return s
      if (s.type === 'if_else') {
        if (s.trueBranchSteps) {
          const found = findStepRecursively(s.trueBranchSteps, id)
          if (found) return found
        }
        if (s.falseBranchSteps) {
          const found = findStepRecursively(s.falseBranchSteps, id)
          if (found) return found
        }
      }
    }
    return undefined
  }
  const activeStep = activeStepId ? findStepRecursively(task.steps || [], activeStepId) : undefined
  const currentStep = pendingStep || activeStep
  const isPending = !!pendingStep

  const confirmPendingStep = () => {
    if (!pendingStep) return

    if (pendingStep.type === 'readLocalFile' && (!pendingStep.fileFormat || pendingStep.fileFormat === 'excel' || pendingStep.fileFormat === 'csv')) {
      if (!pendingStep.excelCol || pendingStep.excelCol.trim() === '') {
        modal.toast('添加失败：必须填写「提取列字母」')
        return
      }
    }

    if (!activeDropzone) {
      if (pendingStep.insertAfterId) {
        const insertRecursive = (steps: any[]): any[] => {
          const newSteps: any[] = [];
          for (const s of steps) {
            newSteps.push(s);
            if (s.id === pendingStep.insertAfterId) {
              const { insertAfterId, ...stepToInsert } = pendingStep;
              newSteps.push(stepToInsert);
            }
            if (s.type === 'if_else') {
              s.trueBranchSteps = s.trueBranchSteps ? insertRecursive(s.trueBranchSteps) : [];
              s.falseBranchSteps = s.falseBranchSteps ? insertRecursive(s.falseBranchSteps) : [];
            }
          }
          return newSteps;
        };
        updateTask({ steps: insertRecursive(task.steps || []) });
      } else {
        updateTask({ steps: [...(task.steps || []), pendingStep] })
      }
    } else {
      const recursiveInsert = (steps: any[]): any[] => {
        return steps.map(s => {
          if (s.id === activeDropzone.parentId) {
            const branchKey = activeDropzone.branch === 'true' ? 'trueBranchSteps' : 'falseBranchSteps'
            return {
              ...s,
              [branchKey]: [...(s[branchKey] || []), pendingStep]
            }
          }
          if (s.type === 'if_else') {
            return {
              ...s,
              trueBranchSteps: s.trueBranchSteps ? recursiveInsert(s.trueBranchSteps) : [],
              falseBranchSteps: s.falseBranchSteps ? recursiveInsert(s.falseBranchSteps) : []
            }
          }
          return s
        })
      }
      updateTask({ steps: recursiveInsert(task.steps || []) })
    }

    setActiveStepId(null)
    setPendingStep(null)
    setActiveDropzone(null)
  }

  const cancelPendingStep = () => {
    setPendingStep(null)
    setActiveDropzone(null)
  }

  const updateActiveStep = (updates: any) => {
    if (!activeStepId) return
    const recursiveUpdate = (steps: any[]): any[] => {
      return steps.map(s => {
        if (s.id === activeStepId) {
          return { ...s, ...updates }
        }
        if (s.type === 'if_else') {
          return {
            ...s,
            trueBranchSteps: s.trueBranchSteps ? recursiveUpdate(s.trueBranchSteps) : [],
            falseBranchSteps: s.falseBranchSteps ? recursiveUpdate(s.falseBranchSteps) : []
          }
        }
        return s
      })
    }
    updateTask({ steps: recursiveUpdate(task.steps || []) })
  }

  const updateCurrentStep = (updates: any) => {
    if (isPending) {
      setPendingStep((prev: any) => ({ ...prev, ...updates }))
    } else {
      updateActiveStep(updates)
    }
  }

  const [availableConfigs, setAvailableConfigs] = useState<any[]>([])
  const [availableTasks, setAvailableTasks] = useState<any[]>([])
  React.useEffect(() => {
    // @ts-ignore
    window.electronAPI.getAllNotificationConfigs?.().then(res => {
      setAvailableConfigs(res?.data || [])
    }).catch(() => { })

    // @ts-ignore
    window.electronAPI.getAllTasks?.().then(res => {
      if (res?.success) {
        setAvailableTasks(res.data.filter((t: any) => t.id !== task.id))
      }
    }).catch(() => { })
  }, [task.id])

  const getAvailableVariables = () => {
    const vars = new Set<string>()
    if (task.batchParam?.enabled && task.batchParam.paramName) {
      vars.add(task.batchParam.paramName)
    }
    const extractVars = (steps: any[]) => {
      steps.forEach(s => {
        if (s.outputVariable) vars.add(s.outputVariable)
        if (s.trueBranchSteps) extractVars(s.trueBranchSteps)
        if (s.falseBranchSteps) extractVars(s.falseBranchSteps)
      })
    }
    extractVars(task.steps || [])
    return Array.from(vars)
  }
  const availableVars = getAvailableVariables()

  const renderVarLabel = (title: React.ReactNode, fieldName: string, id: string, className = "text-[12px] text-gray-500 dark:text-[#b1b8c0] font-medium") => (
    <div className="flex items-center justify-between">
      <label className={className}>{title}</label>
      <button
        title="快捷插入变量 {{}}"
        className="text-[10px] text-gray-400 hover:text-primary bg-gray-900 hover:bg-gray-800 px-1.5 py-0.5 rounded transition-colors border border-gray-700 font-mono"
        onClick={() => {
          const input = document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement;
          const val = (currentStep as any)[fieldName] || '';
          const start = input ? (input.selectionStart || 0) : val.length;
          const end = input ? (input.selectionEnd || 0) : val.length;
          const newVal = val.substring(0, start) + '{{}}' + val.substring(end);
          updateCurrentStep({ [fieldName]: newVal });

          setTimeout(() => {
            if (input) {
              input.focus();
              input.setSelectionRange(start + 2, start + 2);
            }
          }, 10);
        }}
      >
        {`{{}}`}
      </button>
    </div>
  )

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'readText': return '读取文本'
      case 'readAttr': return '读取属性'
      case 'click': return '点击元素'
      case 'input': return '输入文本'
      case 'waitForSelector': return '等待出现'
      case 'waitTimer': return '固定等待'
      case 'calculate': return '变量运算 (全局)'
      case 'screenshot': return '元素区域截图'
      case 'condition': return '条件判断网关'
      case 'mouseMove': return '移动到该元素处'
      case 'if_else': return '条件分支'
      case 'pressKey': return '模拟按键'
      case 'waitForText': return '文本轮询等待'
      case 'scrollToElement': return '滚动到元素可视区'
      case 'readLocalFile': return '读取本地文件 (全局)'
      case 'fileAction': return '本地文件操作 (全局)'
      case 'runPython': return '运行 .py 脚本 (全局)'
      case 'goto': return '跳转到步骤 (局部循环)'
      case 'readClipboard': return '读取剪贴板 (全局)'
      case 'assignVariable': return '文本植入'
      case 'launchApp': return '启动应用 (Win32)'
      case 'closeApp': return '关闭应用 (Win32)'
      case 'windowControl': return '桌面窗口控制 (Win32)'
      case 'systemSearch': return '开始菜单搜索 (Win32)'
      case 'sendWin32Message': return '发送系统消息 (Win32)'
      case 'imageMatch': return '通过截图选取 (视觉)'
      case 'dragAndDrop': return '按住拖拽'
      default: return type
    }
  }

  const checkIsNested = (steps: any[], targetId: string): boolean => {
    for (const step of steps) {
      if (step.type === 'if_else') {
        if ((step.trueBranchSteps || []).some((s: any) => s.id === targetId)) return true;
        if ((step.falseBranchSteps || []).some((s: any) => s.id === targetId)) return true;
        if (checkIsNested(step.trueBranchSteps || [], targetId)) return true;
        if (checkIsNested(step.falseBranchSteps || [], targetId)) return true;
      }
    }
    return false;
  }

  const isNestedStep = (isPending && !!activeDropzone) || (!isPending && currentStep && checkIsNested(task.steps || [], currentStep.id));

  const configCards = [
    { id: 'schedule', icon: Clock, title: '定时运行', desc: '本机时区自动触发', checked: !!task.scheduleConfigured, onChange: (val: boolean) => updateTask({ scheduleConfigured: val }) },
    { id: 'batch', icon: Layers, title: '多并发参数', desc: '批量执行任务循环', checked: !!task.batchParam?.enabled, onChange: (val: boolean) => updateTask({ batchParam: { ...(task.batchParam || { paramName: '', paramValues: [] }), enabled: val } }) },
    { id: 'chain', icon: LinkIcon, title: '任务链触发', desc: '成功后调用下一任务', checked: !!task.nextTaskId, onChange: (val: boolean) => updateTask({ nextTaskId: val ? (availableTasks[0]?.id || '') : undefined }) },
    { id: 'notify', icon: Bell, title: '结果通知', desc: '自动发送执行报告', checked: !!task.notificationConfigId, onChange: (val: boolean) => updateTask({ notificationConfigId: val ? (availableConfigs[0]?.id || '') : undefined }) },
    { id: 'monitor', icon: LineChart, title: '运行监控', desc: '收集结果供监控面板', checked: !!task.monitorEnabled, onChange: (val: boolean) => updateTask({ monitorEnabled: val, monitorMode: val ? (task.monitorMode || 'normal') : undefined }) }
  ]
  const activeCardData = configCards.find(c => c.id === activeConfigCard)


  return (
    <div className="h-full flex flex-col p-0 bg-darkPanel">
      {/* 操作面板 Header */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="bg-gray-800/80 border border-gray-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
            <span className="text-[13px] font-bold text-gray-200 tracking-wide">操作面板</span>
          </div>
        </div>
        <button
          onClick={handleAddManualStep}
          className={`px-3 py-1.5 text-[12px] font-bold rounded-lg border transition-all shrink-0 ${isPending ? 'shadow-inner' : 'shadow-sm hover:brightness-95 dark:hover:brightness-125'}`}
          style={{
            backgroundColor: isPending ? 'var(--bg-main)' : 'var(--bg-elevated)',
            color: isPending ? 'var(--text-faint)' : 'var(--text-secondary)',
            borderColor: isPending ? 'var(--border-strong)' : 'var(--border)'
          }}
        >
          {activeStepId || (isPending && pendingStep?.insertAfterId) ? '+ 在该步之后添加步骤' : '+ 手动添加步骤'}
        </button>
      </div>

      <div className="flex-1 flex flex-col h-full gap-2 overflow-hidden">
        {/* 操作类型选择区域 (Flattened Grid) */}
        <div className={`flex flex-col gap-2 shrink-0 transition-opacity duration-300 ${!currentStep ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-2 shadow-inner">
            <div className="grid grid-cols-3 gap-2 w-full">
              {/* 元素操作 */}
              <div className="flex flex-col gap-0">
                <div className="text-xs text-gray-500 dark:text-gray-300 px-2 py-1 mb-1 border-b border-gray-700/50">元素操作</div>
                {[
                  { value: 'click', icon: '👆', label: '点击此元素' },
                  { value: 'input', icon: '🔤', label: '输入文本' },
                  { value: 'pressKey', icon: '⌨️', label: '模拟按键' },
                  { value: 'readText', icon: '📄', label: '读取文本内容' },
                  { value: 'waitForSelector', icon: '⏳', label: '等待出现' },
                  { value: 'mouseMove', icon: '🖱️', label: '移动到此处' },
                  { value: 'dragAndDrop', icon: '🖐️', label: '按住拖拽' },
                  { value: 'condition', icon: '🔀', label: '条件判断' },
                  ...(!isNestedStep ? [{ value: 'if_else', icon: '🔀', label: '条件分支' }] : []),
                  { value: 'screenshot', icon: '📸', label: '元素区域截图' }
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={(e) => {
                      e.preventDefault()
                      updateCurrentStep({ type: opt.value as any })
                    }}
                    className={`text-left px-2 py-1 text-xs rounded transition-[background-color] flex items-center gap-2 ${currentStep?.type === opt.value ? 'bg-primary text-white shadow' : 'text-gray-300 hover:bg-gray-700 dark:hover:text-white'}`}
                  >
                    <span className="w-4 text-center">{opt.icon}</span>
                    <span className="truncate">{opt.label}</span>
                  </button>
                ))}
              </div>
              {/* 全局操作 */}
              <div className="flex flex-col gap-0">
                <div className="text-xs text-gray-500 dark:text-gray-300 px-2 py-1 mb-1 border-b border-gray-700/50">全局操作</div>
                {[
                  { value: 'waitTimer', icon: '⏱️', label: '固定时长等待' },
                  { value: 'calculate', icon: '🧮', label: '变量数学运算' },
                  { value: 'readLocalFile', icon: '📂', label: '读取结构文件' },
                  { value: 'fileAction', icon: '🛠️', label: '文件系统操作' },
                  { value: 'runPython', icon: '🐍', label: '运行脚本' },
                  { value: 'goto', icon: '🔄', label: '跳转到步骤' },
                  { value: 'readClipboard', icon: '📋', label: '读取剪贴板' },
                  { value: 'assignVariable', icon: '📝', label: '文本植入' }
                ].map(opt => (
                  <button
                    key={opt.value}
                    disabled={!!currentStep?.selector}
                    onClick={(e) => {
                      e.preventDefault()
                      updateCurrentStep({ type: opt.value as any })
                    }}
                    className={`text-left px-2 py-1 text-xs rounded transition-[background-color] flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed ${currentStep?.type === opt.value ? 'bg-primary text-white shadow' : 'text-gray-300 hover:bg-gray-700 dark:hover:text-white'}`}
                  >
                    <span className="w-4 text-center">{opt.icon}</span>
                    <span className="truncate">{opt.label}</span>
                  </button>
                ))}
              </div>
              {/* 系统操作 */}
              <div className="flex flex-col gap-0">
                <div className="text-xs text-gray-500 dark:text-gray-300 px-2 py-1 mb-1 border-b border-gray-700/50">系统操作</div>
                {[
                  { value: 'imageMatch', icon: '🖼️', label: '通过截图选取' },
                  { value: 'launchApp', icon: '🚀', label: '启动应用' },
                  { value: 'closeApp', icon: '🛑', label: '关闭进程' },
                  { value: 'windowControl', icon: '🖥️', label: '桌面窗口控制' },
                  { value: 'systemSearch', icon: '🔍', label: '开始菜单搜索' },
                  { value: 'sendWin32Message', icon: '✉️', label: '发送系统消息' }
                ].map(opt => (
                  <button
                    key={opt.value}
                    disabled={!!currentStep?.selector}
                    onClick={(e) => {
                      e.preventDefault()
                      updateCurrentStep({ type: opt.value as any })
                    }}
                    className={`text-left px-2 py-1 text-xs rounded transition-[background-color] flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed ${currentStep?.type === opt.value ? 'bg-primary text-white shadow' : 'text-gray-300 hover:bg-gray-700 dark:hover:text-white'}`}
                  >
                    <span className="w-4 text-center">{opt.icon}</span>
                    <span className="truncate">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 下方配置细节 */}
        {!currentStep ? (
          <div className="flex-1 flex flex-col mt-2">
            <div className="flex-1 border border-dashed border-gray-700/50 dark:border-gray-800/80 rounded-xl bg-gray-900/30 flex items-center justify-center min-h-[160px]">
              <div className="flex flex-col items-center justify-center text-gray-500 text-[13px] text-center leading-loose">
                <span>请在左侧选取屏幕元素</span>
                <span>或点击右上角手动添加步骤</span>
                <span>以在此处配置其参数</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2.5 mt-2 custom-scrollbar">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-sm text-gray-300">
                {isPending ? '✨ 配置新步骤参数' : `编辑步骤 - ${getTypeLabel(currentStep.type)}`}
              </h2>
              {!isPending && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveStepId(null)}
                    className="text-green-500 hover:text-green-400 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 w-6 h-6 flex items-center justify-center rounded transition-colors font-bold text-sm"
                    title="完成编辑并保存"
                  >
                    ✓
                  </button>
                </div>
              )}
            </div>

            {/* 元素基本信息预览 */}
            {(currentStep.tagName || currentStep.innerText || ['click', 'input', 'pressKey', 'readText', 'waitForSelector', 'mouseMove', 'condition', 'if_else', 'screenshot'].includes(currentStep.type)) && (
              <div className="flex gap-2 w-full">
                <div className={`bg-gray-900/60 p-2.5 rounded-lg border border-gray-700 shadow-inner min-w-0 ${['delay', 'waitTimer', 'if_else', 'loop', 'end_loop', 'runTask', 'goto', 'condition', 'calculate', 'readLocalFile', 'fileAction', 'runPython', 'assignVariable'].includes(currentStep.type) ? 'flex-1' : 'flex-[3]'}`}>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold uppercase shrink-0 border ${currentStep.tagName ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-orange-500/10 text-orange-400 border-orange-500/30'}`}>
                      {currentStep.tagName || '未绑定元素'}
                    </span>
                    <span className={`text-[11px] truncate flex-1 ${currentStep.tagName || currentStep.innerText ? 'text-gray-400' : 'text-orange-400/80'}`} title={currentStep.innerText}>
                      {currentStep.innerText || (currentStep.tagName ? '<无文本内容>' : '请重新拾取目标以绑定元素属性')}
                    </span>
                  </div>
                </div>
                {!['delay', 'waitTimer', 'if_else', 'loop', 'end_loop', 'runTask', 'goto', 'condition', 'calculate', 'readLocalFile', 'fileAction', 'runPython', 'assignVariable'].includes(currentStep.type) && (
                  <div className="flex-[2] min-w-0">
                    <input
                      type="text"
                      className="bg-gray-900/60 text-[11px] text-gray-300 px-2 py-2.5 rounded-lg outline-none border border-gray-700 focus:border-primary w-full h-full shadow-inner"
                      value={currentStep.description || ''}
                      onChange={e => updateCurrentStep({ description: e.target.value })}
                      placeholder="可自定义提示名称"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Removed Auto Execute Toggle */}

            {/* 参数配置区域 */}
            <DesktopActionEditor currentStep={currentStep} updateCurrentStep={updateCurrentStep} renderVarLabel={renderVarLabel} />
            <DesktopSystemActionEditor currentStep={currentStep} updateCurrentStep={updateCurrentStep} availableVars={availableVars} renderVarLabel={renderVarLabel} />
            <DesktopFlowActionEditor currentStep={currentStep} updateCurrentStep={updateCurrentStep} availableVars={availableVars} renderVarLabel={renderVarLabel} task={task} />

            {isPending && (
              <div className="grid grid-cols-2 gap-3 mt-1 shrink-0">
                <button
                  onClick={cancelPendingStep}
                  className="py-2 rounded-lg text-[13px] font-bold transition-all duration-300 border shadow-sm bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border)] hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-500 dark:hover:text-red-400"
                >
                  取消
                </button>
                <button
                  onClick={confirmPendingStep}
                  className="py-2 rounded-lg bg-primary text-white border-none hover:brightness-110 shadow-[0_0_12px_var(--accent-glow)] hover:shadow-[0_0_16px_var(--accent-glow-strong)] text-[13px] font-bold transition-all"
                  style={{
                    '--accent-glow': 'color-mix(in srgb, var(--accent) 40%, transparent)',
                    '--accent-glow-strong': 'color-mix(in srgb, var(--accent) 60%, transparent)'
                  } as any}
                >
                  添加为步骤
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
