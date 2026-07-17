import React, { useState } from 'react'
import { useTask } from '../context/TaskContext'
import { useModal } from '../context/ModalContext'
import { Lock, Clock, Layers, Link as LinkIcon, Bell, LineChart, ChevronLeft, Save, Import, ArrowRight, ArrowRightLeft, AlertTriangle, ArrowDownLeft, ChevronDown, ChevronRight, ShieldCheck } from 'lucide-react'
import { parseChromeRecorderJSON } from '../utils/chromeRecorderParser'
import BatchParamEditor from './BatchParamEditor'
import { DomActionEditor, SystemActionEditor, FlowActionEditor } from './ParamsEditors'
import { SmartXPathSelector } from './ParamsEditors/DomActionEditor'

const GLOBAL_TYPES = ['waitTimer', 'navigate', 'calculate', 'skipPopup', 'scrollPage', 'readLocalFile', 'fileAction', 'runPython', 'goto']


export default function ParamsPanel() {
  const { task, updateTask, activeStepId, setActiveStepId, isPickerMode, setIsPickerMode, visitedUrls, pendingStep, setPendingStep, activeDropzone, setActiveDropzone } = useTask()
  const modal = useModal()
  const [activeConfigCard, setActiveConfigCard] = useState<string | null>(null)
  const [actionTypeDropdownOpen, setActionTypeDropdownOpen] = useState(false)
  const [downloadAdvancedExpanded, setDownloadAdvancedExpanded] = useState(false)

  const isReselectRef = React.useRef(false)

  React.useEffect(() => {
    // @ts-ignore
    if (!window.electronAPI) return
    // @ts-ignore
    const unsub = window.electronAPI.onElementSelected((data: any) => {
      setIsPickerMode(false)
      // @ts-ignore
      window.electronAPI.setPickerMode(false)

      if (isReselectRef.current && activeStepId) {
        updateActiveStep({
          selector: data.cssSelector || '',
          selectorXPath: data.xpath || '',
          tagName: data.tagName || '',
          innerText: data.innerText || '',
          clickMode: data.isIframe ? 'cdp' : 'dom'
        })
        isReselectRef.current = false
        return
      }

      setPendingStep((prev: any) => {
        if (prev) {
          return {
            ...prev,
            type: GLOBAL_TYPES.includes(prev.type) ? 'click' : prev.type,
            selector: data.cssSelector || '',
            selectorXPath: data.xpath || '',
            tagName: data.tagName || '',
            innerText: data.innerText || '',
            clickMode: data.isIframe ? 'cdp' : 'dom'
          }
        }
        return {
          id: Math.random().toString(36).substring(2, 10),
          type: 'click', // Default action type
          selector: data.cssSelector || '',
          selectorXPath: data.xpath || '',
          tagName: data.tagName || '',
          innerText: data.innerText || '',
          outputVariable: '',
          value: '',
          attrName: '',
          description: '',
          clickMode: data.isIframe ? 'cdp' : 'dom'
        }
      })
      setActiveStepId(null) // deselect active step to show creation panel
    })
    return () => {
      unsub && unsub()
    }
  }, [setIsPickerMode, setActiveStepId, activeStepId])

  React.useEffect(() => {
    if (!isPickerMode) {
      isReselectRef.current = false
    }
  }, [isPickerMode])

  React.useEffect(() => {
    if (activeStepId) {
      setActiveConfigCard(null)
    }
  }, [activeStepId])

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

    if ((pendingStep.type === 'click' || pendingStep.type === 'mouseMove') && pendingStep.autoExecuteAfterAdd !== false) {
      setIsPickerMode(false)
      // @ts-ignore
      window.electronAPI?.testSingleStep?.(pendingStep, task.id)
    }

    setPendingStep(null)
    setActiveStepId(null)
    setActiveDropzone(null)
  }

  const cancelPendingStep = () => {
    setPendingStep(null)
    setActiveDropzone(null)
  }

  const handleClearSession = () => {
    if (task.targetUrl) {
      // @ts-ignore
      window.electronAPI.clearSession(task.targetUrl)
    }
  }

  const handleTriggerLogin = () => {
    if (!task.loginPageUrl) {
      // @ts-ignore
      modal.toast('无法运行：请先填写登录页 URL')
      return
    }

    let url = task.targetUrl || task.loginPageUrl
    let loginPageUrl = task.loginPageUrl

    if (!url.startsWith('http')) url = 'https://' + url
    if (!loginPageUrl.startsWith('http')) loginPageUrl = 'https://' + loginPageUrl

    // @ts-ignore
    window.electronAPI.triggerLogin({
      url,
      loginPageUrl,
      loginSuccessUrlPrefix: task.loginSuccessUrlPrefix,
      loginSuccessSelectorCheck: task.loginSuccessSelectorCheck,
      sessionCookieName: task.sessionCookieName
    })
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

  // Determine available configs for notifications and tasks
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
      case 'downloadFile': return '下载文件'
      case 'navigate': return '访问网页 (全局)'
      case 'calculate': return '变量运算 (全局)'
      case 'screenshot': return '网页截图'
      case 'skipPopup': return '跳过弹窗 (全局)'
      case 'condition': return '条件判断网关'
      case 'mouseMove': return '移动到该元素处'
      case 'if_else': return '条件分支'
      case 'pressKey': return '模拟按键'
      case 'waitForText': return '文本轮询等待'
      case 'scrollToElement': return '滚动到元素可视区'
      case 'scrollPage': return '全局页面滚动'
      case 'readLocalFile': return '读取本地文件 (全局)'
      case 'fileAction': return '本地文件操作 (全局)'
      case 'runPython': return '运行 .py 脚本 (全局)'
      case 'goto': return '跳转到步骤 (局部循环)'
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
    { id: 'login', icon: Lock, title: '前置登录', desc: '运行时前置会话校验', checked: !!task.isLoginRequired, onChange: (val: boolean) => updateTask({ isLoginRequired: val }) },
    { id: 'schedule', icon: Clock, title: '定时运行', desc: '本机时区自动触发', checked: !!task.scheduleConfigured, onChange: (val: boolean) => updateTask({ scheduleConfigured: val }) },
    { id: 'batch', icon: Layers, title: '多并发参数', desc: '批量执行任务循环', checked: !!task.batchParam?.enabled, onChange: (val: boolean) => updateTask({ batchParam: { ...(task.batchParam || { paramName: '', paramValues: [] }), enabled: val } }) },
    { id: 'chain', icon: LinkIcon, title: '任务链触发', desc: '成功后调用下一任务', checked: !!task.nextTaskId, onChange: (val: boolean) => updateTask({ nextTaskId: val ? (availableTasks[0]?.id || '') : undefined }) },
    { id: 'notify', icon: Bell, title: '结果通知', desc: '自动发送执行报告', checked: !!task.notificationConfigId, onChange: (val: boolean) => updateTask({ notificationConfigId: val ? (availableConfigs[0]?.id || '') : undefined }) },
    { id: 'monitor', icon: LineChart, title: '运行监控', desc: '收集结果供监控面板', checked: !!task.monitorEnabled, onChange: (val: boolean) => updateTask({ monitorEnabled: val, monitorMode: val ? (task.monitorMode || 'normal') : undefined }) }
  ]
  const activeCardData = configCards.find(c => c.id === activeConfigCard)


  return (
    <div className="h-full flex flex-col p-0 bg-darkPanel">
      {/* 步骤配置区域 */}
      <div className="flex-none flex flex-col gap-1.5 pb-2">
        {currentStep ? (
          <>
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg text-gray-200">
                {isPending ? '✨ 元素捕获卡片' : `参数配置 - ${getTypeLabel(currentStep.type)}`}
              </h2>
              {isPending ? (
                <span className="px-3 py-1 text-[12px] font-bold text-amber-500 border border-amber-600/80 rounded-md bg-amber-500/10">
                  待添加
                </span>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      isReselectRef.current = true
                      setIsPickerMode(true)
                      // @ts-ignore
                      window.electronAPI.setPickerMode(true)
                    }}
                    className="text-amber-500 hover:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-2 h-7 flex items-center justify-center gap-1 rounded-md transition-colors"
                    title="重新选择此元素"
                  >
                    <ArrowDownLeft size={16} strokeWidth={2.5} />
                    <span className="text-[12px] font-bold">重新选取</span>
                  </button>
                  <button
                    onClick={() => setActiveStepId(null)}
                    className="text-green-500 hover:text-green-400 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 w-7 h-7 flex items-center justify-center rounded-md transition-colors font-bold text-lg"
                    title="完成编辑并保存"
                  >
                    ✓
                  </button>
                </div>
              )}
            </div>

            {/* 元素基本信息预览 */}
            {(currentStep.tagName || currentStep.innerText) && (
              <div className="flex gap-2 w-full">
                <div className={`bg-gray-900/60 p-2.5 rounded-lg border border-gray-700 shadow-inner min-w-0 ${['delay', 'waitTimer', 'if_else', 'loop', 'end_loop', 'runTask', 'navigate', 'goto', 'condition', 'calculate', 'skipPopup', 'scrollPage', 'readLocalFile', 'fileAction', 'runPython'].includes(currentStep.type) ? 'flex-1' : 'flex-[3]'}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded font-mono font-bold uppercase shrink-0">
                      {currentStep.tagName}
                    </span>
                    <span className="text-[11px] text-gray-400 truncate flex-1" title={currentStep.innerText}>
                      {currentStep.innerText || '<无文本内容>'}
                    </span>
                  </div>
                </div>
                {!['delay', 'waitTimer', 'if_else', 'loop', 'end_loop', 'runTask', 'navigate', 'goto', 'condition', 'calculate', 'skipPopup', 'scrollPage', 'readLocalFile', 'fileAction', 'runPython'].includes(currentStep.type) && (
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

            {/* 操作类型下拉 */}
            <div className="flex flex-col gap-1.5 relative" style={{ zIndex: 50 }}>
              <label className="text-[12px] text-gray-500 dark:text-[#b1b8c0] font-medium">操作类型</label>
              <div
                className="relative"
                tabIndex={-1}
                onBlur={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget)) setActionTypeDropdownOpen(false)
                }}
              >
                <button
                  type="button"
                  onClick={() => setActionTypeDropdownOpen(prev => !prev)}
                  className="bg-gray-800 text-xs text-gray-200 px-2.5 py-2 rounded-lg outline-none border border-gray-600 hover:border-primary w-full flex items-center justify-between shadow-sm transition-colors text-left font-medium"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-4 text-center inline-block">
                      {currentStep.type === 'click' ? '👆' :
                        currentStep.type === 'input' ? '🔤' :
                          currentStep.type === 'readText' ? '📄' :
                            currentStep.type === 'readAttr' ? '🏷️' :
                              currentStep.type === 'waitForSelector' ? '⏳' :
                                currentStep.type === 'downloadFile' ? '📥' :
                                  currentStep.type === 'condition' ? '🔀' :
                                    currentStep.type === 'if_else' ? '🔀' :
                                      currentStep.type === 'screenshot' ? '📸' :
                                        currentStep.type === 'mouseMove' ? '🖱️' :
                                          currentStep.type === 'pressKey' ? '⌨️' :
                                            currentStep.type === 'waitForText' ? '🔎' :
                                              currentStep.type === 'scrollToElement' ? '🔽' :
                                                currentStep.type === 'scrollPage' ? '📜' :
                                                  currentStep.type === 'waitTimer' ? '⏱️' :
                                                    currentStep.type === 'navigate' ? '🌐' :
                                                      currentStep.type === 'calculate' ? '🧮' :
                                                        currentStep.type === 'skipPopup' ? '🚫' :
                                                          currentStep.type === 'readLocalFile' ? '📂' :
                                                            currentStep.type === 'fileAction' ? '🛠️' :
                                                              currentStep.type === 'runPython' ? '🐍' :
                                                                currentStep.type === 'goto' ? '🔄' : ''}
                    </span>
                    <span>
                      {currentStep.type === 'click' ? '点击此元素' :
                        currentStep.type === 'input' ? '向此元素输入文本' :
                          currentStep.type === 'readText' ? '读取文本内容' :
                            currentStep.type === 'readAttr' ? '读取属性值' :
                              currentStep.type === 'waitForSelector' ? '等待此元素出现' :
                                currentStep.type === 'downloadFile' ? '点击并等待文件下载' :
                                  currentStep.type === 'condition' ? '条件判断 (中止/跳过)' :
                                    currentStep.type === 'if_else' ? '条件分支 (If-Else)' :
                                      currentStep.type === 'screenshot' ? '网页/元素截图' :
                                        currentStep.type === 'mouseMove' ? '移动到该元素处' :
                                          currentStep.type === 'pressKey' ? '模拟按键' :
                                            currentStep.type === 'waitForText' ? '文本轮询等待' :
                                              currentStep.type === 'scrollToElement' ? '滚动至可视区' :
                                                currentStep.type === 'scrollPage' ? '全局页面滚动' :
                                                  currentStep.type === 'waitTimer' ? '固定时长等待 (全局)' :
                                                    currentStep.type === 'navigate' ? '访问网页 (全局)' :
                                                      currentStep.type === 'calculate' ? '变量数学运算 (全局)' :
                                                        currentStep.type === 'skipPopup' ? '智能跳过弹窗 (全局)' :
                                                          currentStep.type === 'readLocalFile' ? '读取本地结构化文件 (全局)' :
                                                            currentStep.type === 'fileAction' ? '本地文件系统操作 (全局)' :
                                                              currentStep.type === 'runPython' ? '运行 .py 脚本 (全局)' :
                                                                currentStep.type === 'goto' ? '跳转到步骤 (局部循环)' : currentStep.type}
                    </span>
                  </div>
                  <span className="text-gray-400 text-[10px]">▼</span>
                </button>
                <div className={`absolute left-0 top-full mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-xl dark:shadow-[0_8px_20px_rgba(59,130,246,0.15)] transition-all z-50 p-2 ${actionTypeDropdownOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
                  <div className="grid grid-cols-2 gap-2">
                    {/* 元素操作 */}
                    <div className="flex flex-col gap-0.5">
                      <div className="text-xs text-gray-500 dark:text-gray-300 px-2 py-1 mb-1 border-b border-gray-700/50">元素操作</div>
                      {[
                        { value: 'click', icon: '👆', label: '点击此元素' },
                        { value: 'input', icon: '🔤', label: '输入文本' },
                        { value: 'pressKey', icon: '⌨️', label: '模拟按键' },
                        { value: 'readText', icon: '📄', label: '读取文本内容' },
                        { value: 'readAttr', icon: '🏷️', label: '读取属性值' },
                        { value: 'waitForSelector', icon: '⏳', label: '等待此元素出现' },
                        { value: 'waitForText', icon: '🔎', label: '文本轮询等待' },
                        { value: 'scrollToElement', icon: '🔽', label: '滚动至可视区' },
                        { value: 'mouseMove', icon: '🖱️', label: '移动到该元素处' },
                        { value: 'downloadFile', icon: '📥', label: '点击并等待下载' },
                        { value: 'condition', icon: '🔀', label: '条件判断 (中止/跳过)' },
                        ...(!isNestedStep ? [{ value: 'if_else', icon: '🔀', label: '条件分支 (if-else)' }] : []),
                        { value: 'screenshot', icon: '📸', label: '网页/元素截图' }
                      ].map(opt => (
                        <button
                          key={opt.value}
                          onClick={(e) => {
                            e.preventDefault()
                            if (opt.value === 'skipPopup' && !currentStep.value) {
                              updateCurrentStep({ type: opt.value as any, value: '"稍后", "跳过", "暂不", "以后再说", "我知道了", "取消", "残忍拒绝", "关闭"' })
                            } else if (currentStep.type === 'skipPopup' && currentStep.value === '"稍后", "跳过", "暂不", "以后再说", "我知道了", "取消", "残忍拒绝", "关闭"') {
                              updateCurrentStep({ type: opt.value as any, value: '' })
                            } else {
                              updateCurrentStep({ type: opt.value as any })
                            }
                            setActionTypeDropdownOpen(false)
                          }}
                          className={`text-left px-2 py-1.5 text-xs rounded transition-colors flex items-center gap-2 ${currentStep.type === opt.value ? 'bg-primary text-white' : 'text-gray-300 hover:bg-gray-700 dark:hover:text-white'}`}
                        >
                          <span className="w-4 text-center">{opt.icon}</span>
                          <span className="truncate">{opt.label}</span>
                        </button>
                      ))}
                    </div>
                    {/* 全局操作 */}
                    <div className="flex flex-col gap-0.5">
                      <div className="text-xs text-gray-500 dark:text-gray-300 px-2 py-1 mb-1 border-b border-gray-700/50">全局操作</div>
                      {[
                        { value: 'waitTimer', icon: '⏱️', label: '固定时长等待 (全局)' },
                        { value: 'scrollPage', icon: '📜', label: '全局页面滚动 (全局)' },
                        { value: 'navigate', icon: '🌐', label: '访问网页 (全局)' },
                        { value: 'calculate', icon: '🧮', label: '变量数学运算 (全局)' },
                        { value: 'skipPopup', icon: '🚫', label: '智能跳过弹窗 (全局)' },
                        { value: 'readLocalFile', icon: '📂', label: '读取结构化文件 (全局)' },
                        { value: 'fileAction', icon: '🛠️', label: '文件系统操作 (全局)' },
                        { value: 'runPython', icon: '🐍', label: '运行 .py 脚本 (全局)' },
                        { value: 'goto', icon: '🔄', label: '跳转到步骤 (局部循环)' }
                      ].map(opt => (
                        <button
                          key={opt.value}
                          disabled={!!currentStep.selector}
                          onClick={(e) => {
                            e.preventDefault()
                            if (opt.value === 'skipPopup' && !currentStep.value) {
                              updateCurrentStep({ type: opt.value as any, value: '"稍后", "跳过", "暂不", "以后再说", "我知道了", "取消", "残忍拒绝", "关闭"' })
                            } else if (currentStep.type === 'skipPopup' && currentStep.value === '"稍后", "跳过", "暂不", "以后再说", "我知道了", "取消", "残忍拒绝", "关闭"') {
                              updateCurrentStep({ type: opt.value as any, value: '' })
                            } else {
                              updateCurrentStep({ type: opt.value as any })
                            }
                            setActionTypeDropdownOpen(false)
                          }}
                          className={`text-left px-2 py-1.5 text-xs rounded transition-colors flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed ${currentStep.type === opt.value ? 'bg-primary text-white' : 'text-gray-300 hover:bg-gray-700 dark:hover:text-white'}`}
                        >
                          <span className="w-4 text-center">{opt.icon}</span>
                          <span className="truncate">{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CSS Selector */}
            {!GLOBAL_TYPES.includes(currentStep.type) && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] text-gray-500 dark:text-[#b1b8c0] font-medium">CSS Selector</label>
                <input
                  type="text"
                  className="bg-gray-900 text-xs text-gray-300 px-2.5 py-1.5 rounded-lg outline-none border border-gray-700 focus:border-primary w-full font-mono"
                  value={currentStep.selector || ''}
                  onChange={e => updateCurrentStep({ selector: e.target.value })}
                  placeholder="例如: .submit-btn"
                />
              </div>
            )}

            {/* XPath */}
            {!GLOBAL_TYPES.includes(currentStep.type) && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] text-gray-500 dark:text-[#b1b8c0] font-medium">XPath</label>
                <input
                  type="text"
                  className="bg-gray-900 text-xs text-gray-300 px-2.5 py-1.5 rounded-lg outline-none border border-gray-700 focus:border-primary w-full font-mono"
                  value={currentStep.selectorXPath || ''}
                  onChange={e => updateCurrentStep({ selectorXPath: e.target.value })}
                  placeholder="例如: //div[@class='test']"
                />
              </div>
            )}

            {/* Auto Execute & Click Mode Toggle */}
            {(currentStep.type === 'click' || currentStep.type === 'mouseMove' || currentStep.type === 'input') && (isPending || currentStep.type !== 'mouseMove') && (
              <div className="flex items-center justify-between" style={{ margin: '2px 0' }}>
                {isPending ? (
                  <label className={`flex items-center gap-2 bg-gray-900 text-xs text-gray-300 px-2.5 py-1.5 rounded-lg outline-none border border-gray-700 cursor-pointer hover:border-gray-500 transition-colors select-none ${currentStep.type === 'mouseMove' || currentStep.type === 'downloadFile' ? 'w-full' : 'w-fit'}`}>
                    <input
                      type="checkbox"
                      checked={currentStep.autoExecuteAfterAdd !== false}
                      onChange={e => updateCurrentStep({ autoExecuteAfterAdd: e.target.checked })}
                      className="rounded border-gray-600 text-primary focus:ring-primary bg-gray-900 cursor-pointer w-3.5 h-3.5"
                    />
                    <span>添加步骤后自动执行一次操作</span>
                  </label>
                ) : <div />}
                
                {(currentStep.type !== 'mouseMove' && currentStep.type !== 'downloadFile') && (
                  <div className="relative flex bg-gray-900 border border-gray-700 rounded-lg p-0.5 select-none items-center w-[124px]" style={{ height: isPending ? '100%' : '28px' }}>
                    {/* Sliding Background */}
                    <div 
                      className="absolute bg-blue-600 rounded-md shadow-sm transition-all duration-300 ease-out"
                      style={{ 
                        top: '2px',
                        bottom: '2px',
                        left: '2px',
                        width: 'calc(50% - 2px)',
                        transform: (!currentStep.clickMode || currentStep.clickMode === 'cdp') ? 'translateX(0)' : 'translateX(100%)'
                      }}
                    />
                    <div
                      onClick={() => updateCurrentStep({ clickMode: 'cdp' })}
                      className={`relative z-10 flex-1 text-[11px] px-1 py-1 cursor-pointer transition-colors text-center font-bold ${(!currentStep.clickMode || currentStep.clickMode === 'cdp') ? 'text-white' : 'text-gray-400 hover:text-gray-200'}`}
                    >
                      物理CDP
                    </div>
                    <div
                      onClick={() => updateCurrentStep({ clickMode: 'dom' })}
                      className={`relative z-10 flex-1 text-[11px] px-1 py-1 cursor-pointer transition-colors text-center font-bold ${(currentStep.clickMode === 'dom') ? 'text-white' : 'text-gray-400 hover:text-gray-200'}`}
                    >
                      代码DOM
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 统一使用新拆分的组件渲染各种动作的参数配置区域 */}
            <DomActionEditor currentStep={currentStep} updateCurrentStep={updateCurrentStep} renderVarLabel={renderVarLabel} />
            <SystemActionEditor currentStep={currentStep} updateCurrentStep={updateCurrentStep} availableVars={availableVars} renderVarLabel={renderVarLabel} />
            <FlowActionEditor currentStep={currentStep} updateCurrentStep={updateCurrentStep} availableVars={availableVars} renderVarLabel={renderVarLabel} task={task} />

            {/* 点击操作高级设置 for downloadFile */}
            {currentStep.type === 'downloadFile' && (
              <div className="border border-gray-700 rounded-lg bg-gray-800/50 mt-1 overflow-hidden transition-all duration-300 ease-in-out">
                <button
                  onClick={() => setDownloadAdvancedExpanded(!downloadAdvancedExpanded)}
                  className="w-full flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-300 hover:bg-gray-700/50 transition-colors"
                >
                  {downloadAdvancedExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  点击操作高级设置
                </button>
                <div 
                  className="transition-all duration-300 ease-in-out"
                  style={{ maxHeight: downloadAdvancedExpanded ? '800px' : '0', opacity: downloadAdvancedExpanded ? 1 : 0 }}
                >
                  <div className="p-3 pt-0 flex flex-col gap-3">
                    
                    {/* 1. Auto Execute & Click Mode Toggle (Identical to top level) */}
                    <div className="flex items-center justify-between" style={{ margin: '2px 0' }}>
                      {isPending ? (
                        <label className="flex items-center gap-2 bg-gray-900 text-xs text-gray-300 px-2.5 py-1.5 rounded-lg outline-none border border-gray-700 cursor-pointer hover:border-gray-500 transition-colors select-none w-fit">
                          <input
                            type="checkbox"
                            checked={!!currentStep.autoExecuteAfterAdd}
                            onChange={e => updateCurrentStep({ autoExecuteAfterAdd: e.target.checked })}
                            className="rounded border-gray-600 text-primary focus:ring-primary bg-gray-900 cursor-pointer w-3.5 h-3.5"
                          />
                          <span>添加步骤后自动执行一次操作</span>
                        </label>
                      ) : <div />}
                      
                      <div className="relative flex bg-gray-900 border border-gray-700 rounded-lg p-0.5 select-none items-center w-[124px]" style={{ height: isPending ? '100%' : '28px' }}>
                        {/* Sliding Background */}
                        <div 
                          className="absolute bg-blue-600 rounded-md shadow-sm transition-all duration-300 ease-out"
                          style={{ 
                            top: '2px',
                            bottom: '2px',
                            left: '2px',
                            width: 'calc(50% - 2px)',
                            transform: (!currentStep.clickMode || currentStep.clickMode === 'cdp') ? 'translateX(0)' : 'translateX(100%)'
                          }}
                        />
                        <div
                          onClick={() => updateCurrentStep({ clickMode: 'cdp' })}
                          className={`relative z-10 flex-1 text-[11px] px-1 py-1 cursor-pointer transition-colors text-center font-bold ${(!currentStep.clickMode || currentStep.clickMode === 'cdp') ? 'text-white' : 'text-gray-400 hover:text-gray-200'}`}
                        >
                          物理CDP
                        </div>
                        <div
                          onClick={() => updateCurrentStep({ clickMode: 'dom' })}
                          className={`relative z-10 flex-1 text-[11px] px-1 py-1 cursor-pointer transition-colors text-center font-bold ${(currentStep.clickMode === 'dom') ? 'text-white' : 'text-gray-400 hover:text-gray-200'}`}
                        >
                          代码DOM
                        </div>
                      </div>
                    </div>

                    {/* 2. Smart Parent Click */}
                    <label className="flex items-start gap-2 bg-gray-900 text-xs text-gray-300 px-2.5 py-2 rounded-lg outline-none border border-gray-700 cursor-pointer hover:border-gray-500 transition-colors select-none">
                      <input
                        type="checkbox"
                        checked={!!currentStep.smartParentClick}
                        onChange={e => updateCurrentStep({ smartParentClick: e.target.checked })}
                        className="mt-0.5 rounded border-gray-600 text-primary focus:ring-primary bg-gray-900 cursor-pointer w-3.5 h-3.5 shrink-0"
                      />
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-200">智能穿透点击</span>
                        <span className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                          过滤双路内层的 svg/path/img 等标签，解决点击无响应
                        </span>
                      </div>
                    </label>

                    {/* 3. SmartXPathSelector */}
                    <SmartXPathSelector currentStep={currentStep} updateCurrentStep={updateCurrentStep} />

                  </div>
                </div>
              </div>
            )}

            {isPending && (
              <div className="grid grid-cols-2 gap-3 mt-1">
                <button
                  onClick={cancelPendingStep}
                  className="py-2 rounded-lg bg-gray-800 text-gray-300 border border-gray-600 hover:bg-gray-700 hover:border-gray-500 hover:text-white text-[13px] font-bold transition-all shadow-sm"
                >
                  取消
                </button>
                <button
                  onClick={confirmPendingStep}
                  className="py-2 rounded-lg bg-blue-600 text-white border border-blue-500 hover:bg-blue-500 hover:border-blue-400 shadow-[0_0_12px_rgba(37,99,235,0.4)] hover:shadow-[0_0_16px_rgba(59,130,246,0.6)] text-[13px] font-bold transition-all"
                >
                  添加为步骤
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center justify-between min-h-8">
              <h2 className="font-bold text-lg text-gray-200 ml-2">操作中心</h2>
              {(!task.steps || task.steps.length === 0) && !isPending && (
                <button
                  onClick={() => {
                    const input = document.getElementById('chrome-recorder-import-input') as HTMLInputElement
                    if (input) input.click()
                  }}
                  className="text-xs font-normal text-gray-300 bg-gray-800 border border-gray-700 hover:opacity-80 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-opacity"
                >
                  <Import size={14} className="text-gray-400" />
                  从 Chrome Recorder 导入
                </button>
              )}
            </div>
            <input 
              type="file" 
              id="chrome-recorder-import-input" 
              accept=".json" 
              className="hidden" 
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  const content = await file.text();
                  const result = parseChromeRecorderJSON(content);
                  if (result.validCount === 0) {
                    modal.toast('未能解析到任何有效步骤，请确认文件格式是否正确。');
                    return;
                  }
                  
                  const confirmed = await modal.confirm({
                    title: '确认导入操作步骤',
                    icon: <ArrowRightLeft className="text-primary w-[18px] h-[18px]" />,
                    message: (
                      <div className="flex flex-col gap-[18px] -mt-1.5">
                        <div className="flex items-center justify-between text-[13px] bg-gray-800/40 px-3 py-2 rounded-lg border border-gray-700 shadow-inner">
                          <span className="text-gray-300">成功解析了 <strong className="text-primary text-[15px] px-0.5">{result.total}</strong> 步记录</span>
                          <ArrowRight size={16} className="text-gray-500 shrink-0" />
                          <span className="text-gray-300 text-right">智能转换为 <strong className="text-primary text-[15px] px-0.5">{result.validCount}</strong> 个节点</span>
                        </div>
                        <div className="bg-gray-800/60 rounded-lg border border-gray-700 max-h-48 overflow-y-auto p-2 flex flex-col gap-1.5 thin-scrollbar">
                          {result.targetUrl && (
                            <div className="flex items-center gap-2 text-[12px]">
                              <span className="w-5 h-5 rounded-full bg-gray-700 text-gray-300 flex items-center justify-center font-mono shrink-0 text-[10px]">0</span>
                              <div className="flex-1 min-w-0 flex items-center gap-2 opacity-80">
                                <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded text-[10px] uppercase shrink-0 font-bold tracking-wider">URL</span>
                                <span className="text-gray-500 dark:text-gray-400 truncate flex-1 min-w-0">目标网址: {result.targetUrl}</span>
                              </div>
                            </div>
                          )}
                          {result.steps.map((s, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-[12px]">
                              <span className="w-5 h-5 rounded-full bg-gray-700 text-gray-300 flex items-center justify-center font-mono shrink-0 text-[10px]">{idx + 1}</span>
                              <div className="flex-1 min-w-0 flex items-center gap-2">
                                <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded text-[10px] uppercase shrink-0 font-bold tracking-wider">{s.type}</span>
                                <span className="text-gray-400 truncate flex-1 min-w-0">{s.description || '无描述'}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5 flex items-center justify-center gap-1.5 font-medium">
                          <AlertTriangle size={14} className="shrink-0" />
                          导入后将应用至当前管线，您可以手动继续微调参数
                        </p>
                      </div>
                    ),
                    confirmText: '确认导入'
                  });

                  if (confirmed) {
                    let newUrl = task.targetUrl;
                    if (result.targetUrl) {
                      newUrl = result.targetUrl;
                    }
                    updateTask({ steps: result.steps, targetUrl: newUrl });
                    modal.toast('Chrome Recorder 步骤导入成功！');
                  }
                } catch (err: any) {
                  modal.toast(`导入失败: ${err.message}`);
                }
                e.target.value = '';
              }}
            />
            <div className="flex flex-col items-center justify-center h-[136px] text-gray-500 text-sm text-center bg-gray-900/50 rounded-lg mt-1.5">
              <span>请在左侧选择元素 或 右侧新建步骤</span>
              <span>以在此处配置其参数</span>
            </div>
          </>
        )}
      </div>

      {/* 分割线与全局配置标题 */}
      {!activeConfigCard && (
        <div className="flex items-center mb-1 shrink-0">
          <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }}></div>
          <h3 className="font-bold text-[12px] px-3 tracking-wider shrink-0" style={{ color: 'var(--text-muted)' }}>
            全局任务配置
          </h3>
          <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }}></div>
        </div>
      )}

      {/* 下半区：全局配置与批量参数 */}
      <div className="flex-1 overflow-y-auto flex flex-col pt-1">
        {!activeConfigCard ? (
          <>
            <div className="grid grid-cols-2 gap-2">
              {configCards.map(c => (
                <div
                  key={c.id}
                  onClick={() => setActiveConfigCard(c.id)}
                  className="rounded-xl p-2 flex flex-col gap-1 cursor-pointer hover:-translate-y-[2px] transition-all group shadow-sm relative overflow-hidden animate-in fade-in zoom-in-95 duration-300 border"
                  style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)' }}
                >
                  <div className="flex justify-between items-center relative z-10">
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-300 delay-150 ${c.checked ? 'bg-primary' : ''}`}
                      style={!c.checked ? { backgroundColor: 'var(--bg-surface)', color: 'var(--text-muted)' } : undefined}
                    >
                      <c.icon
                        size={13}
                        className={`transition-colors duration-300 ${c.checked ? 'text-white' : 'group-hover:text-primary'}`}
                      />
                    </div>
                    <div
                      className={`w-7 h-4 rounded-full relative transition-colors ${c.checked ? 'bg-primary' : 'bg-gray-700'}`}
                      onClick={(e) => { e.stopPropagation(); c.onChange(!c.checked) }}
                    >
                      <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-transform ${c.checked ? 'translate-x-3' : 'translate-x-0'}`} />
                    </div>
                  </div>
                  <div className="relative z-10 mt-1">
                    <h4 className="text-[13px] font-bold transition-colors group-hover:text-[var(--accent)]" style={{ color: 'var(--text-primary)' }}>{c.title}</h4>
                    <p className="text-[12px] mt-0.5 leading-tight" style={{ color: 'var(--text-muted)' }}>{c.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col h-full animate-in slide-in-from-right-4 fade-in duration-300 relative">
            <div className="flex justify-between items-center mt-1 mb-2 shrink-0 relative">
              <button
                onClick={() => {
                  if (activeConfigCard === 'schedule' && (!task.scheduleType || task.scheduleType === 'time')) {
                    updateTask({ schedule: (task.schedule || []).filter(t => t && t.trim() !== '') });
                  }
                  setActiveConfigCard(null);
                }}
                className="flex items-center gap-1 text-[12px] font-bold transition-colors px-2.5 py-1 rounded-md border shadow-sm hover:opacity-80"
                style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--primary)', color: 'var(--primary)' }}
              >
                <ChevronLeft size={14} /> 返回
              </button>

              {activeConfigCard === 'schedule' && (
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex bg-gray-900 rounded-lg p-0.5 border border-gray-700 shadow-inner w-fit">
                  <button className={`px-4 py-1 text-[12px] font-bold rounded-md transition-all ${(!task.scheduleType || task.scheduleType === 'time') ? 'bg-gray-700 text-primary shadow-sm' : 'text-gray-500 hover:text-gray-300'}`} onClick={() => updateTask({ scheduleType: 'time' })}>时刻</button>
                  <button className={`px-4 py-1 text-[12px] font-bold rounded-md transition-all ${task.scheduleType === 'frequency' ? 'bg-gray-700 text-primary shadow-sm' : 'text-gray-500 hover:text-gray-300'}`} onClick={() => updateTask({ scheduleType: 'frequency' })}>频率</button>
                </div>
              )}

              {activeConfigCard === 'login' && (
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center bg-gray-900 rounded-lg p-0.5 border border-gray-700 shadow-inner w-fit">
                  <button
                    className="px-4 py-1 text-[12px] font-bold rounded-md transition-all text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-gray-700"
                    onClick={handleClearSession}
                  >
                    清空
                  </button>
                  <div className="w-px h-3 bg-gray-500 dark:bg-white mx-0.5"></div>
                  <button
                    className="px-4 py-1 text-[12px] font-bold rounded-md transition-all text-primary hover:bg-blue-50 dark:hover:bg-gray-700"
                    onClick={handleTriggerLogin}
                  >
                    测试
                  </button>
                </div>
              )}

              {activeCardData && (
                <button
                  onClick={() => activeCardData.onChange(!activeCardData.checked)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border shadow-sm group cursor-pointer transition-all duration-300 delay-150 ${activeCardData.checked ? 'bg-primary border-transparent' : ''}`}
                  style={!activeCardData.checked ? { backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-muted)' } : undefined}
                >
                  <activeCardData.icon
                    size={12}
                    className={`transition-colors duration-300 ${activeCardData.checked ? 'text-white opacity-100' : 'opacity-80 group-hover:text-primary'}`}
                  />
                  <span
                    className={`text-[12px] font-bold transition-colors duration-300 ${activeCardData.checked ? 'text-white' : 'group-hover:text-primary'}`}
                  >
                    {activeCardData.title}
                  </span>
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 thin-scrollbar pr-1">
              {activeConfigCard === 'login' && (
                <div className="flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-2">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-medium" style={{ color: 'var(--text-secondary)' }}>登录页 URL</label>
                    <input type="text" className="bg-gray-800 text-xs text-gray-300 px-2.5 py-1.5 rounded-lg outline-none border border-gray-700 focus:border-primary w-full" value={task.loginPageUrl || ''} onChange={e => updateTask({ loginPageUrl: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-medium" style={{ color: 'var(--text-secondary)' }}>Cookie 标识键名</label>
                    <input type="text" className="bg-gray-800 text-xs text-gray-300 px-2.5 py-1.5 rounded-lg outline-none border border-gray-700 focus:border-primary w-full" value={task.sessionCookieName || ''} onChange={e => updateTask({ sessionCookieName: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-medium" style={{ color: 'var(--text-secondary)' }}>登录成功校验前缀 (可选)</label>
                    <input type="text" className="bg-gray-800 text-xs text-gray-300 px-2.5 py-1.5 rounded-lg outline-none border border-gray-700 focus:border-primary w-full" value={task.loginSuccessUrlPrefix || ''} onChange={e => updateTask({ loginSuccessUrlPrefix: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-medium" style={{ color: 'var(--text-secondary)' }}>成功校验 Selector (可选)</label>
                    <input type="text" className="bg-gray-800 text-xs text-gray-300 px-2.5 py-1.5 rounded-lg outline-none border border-gray-700 focus:border-primary w-full" value={task.loginSuccessSelectorCheck || ''} onChange={e => updateTask({ loginSuccessSelectorCheck: e.target.value })} />
                  </div>
                </div>
              )}

              {activeConfigCard === 'schedule' && (
                <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-2">

                  {(!task.scheduleType || task.scheduleType === 'time') && (
                    <>
                      <div className="text-[12px] -mb-1 leading-tight flex justify-between" style={{ color: 'var(--text-secondary)' }}>
                        <span>以本机时区为准自动触发。</span>
                        <span>已设: {(task.schedule || []).filter(t => t && t.trim() !== '').length}/12</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {Array.from({ length: 12 }).map((_, idx) => (
                          <div key={idx} className="flex items-center bg-gray-800/30 rounded-lg pl-2 pr-1 py-1 border border-transparent hover:border-gray-700 transition-colors">
                            <span className="text-xs text-gray-300 font-mono w-4 shrink-0">{idx + 1}.</span>
                            <input type="time" className="w-full bg-transparent text-[13px] font-medium text-gray-300 px-1 outline-none focus:text-primary transition-colors cursor-pointer" value={(task.schedule || [])[idx] || ''} onChange={e => {
                              const newArr = [...(task.schedule || [])]
                              while (newArr.length < 12) newArr.push('')
                              newArr[idx] = e.target.value
                              updateTask({ schedule: newArr })
                            }} />
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {task.scheduleType === 'frequency' && (
                    <>
                      <div className="text-[12px] -mb-1 leading-tight" style={{ color: 'var(--text-secondary)' }}>设置固定时间间隔循环运行。启动引擎后开始计时。</div>
                      <div className="flex flex-col gap-3 bg-gray-800/40 p-2.5 rounded-lg border border-gray-700 shadow-inner">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-bold shrink-0 pl-1" style={{ color: 'var(--text-secondary)' }}>每隔</span>
                          <input 
                            type="number" min="1" 
                            max={task.scheduleFrequency?.unit === 'hours' ? 24 : task.scheduleFrequency?.unit === 'minutes' ? 1440 : 86400}
                            className="bg-gray-900 text-sm text-primary px-3 py-1 rounded-lg outline-none border border-gray-600 focus:border-primary w-20 text-center font-mono font-bold shadow-sm" value={task.scheduleFrequency?.value ?? ''} onChange={e => {
                            const raw = e.target.value;
                            let val: number | '' = raw === '' ? '' : parseInt(raw);
                            const unit = task.scheduleFrequency?.unit || 'hours';
                            const maxVal = unit === 'hours' ? 24 : unit === 'minutes' ? 1440 : 86400;
                            if (typeof val === 'number' && val > maxVal) val = maxVal;
                            updateTask({ scheduleFrequency: { value: val as any, unit, startTime: task.scheduleFrequency?.startTime, endTime: task.scheduleFrequency?.endTime } });
                          }} />
                          <select className="bg-gray-900 text-[13px] text-gray-300 px-2 py-1 rounded-lg outline-none border border-gray-600 focus:border-primary flex-1 cursor-pointer font-medium shadow-sm appearance-none" style={{ backgroundImage: 'linear-gradient(45deg, transparent 50%, gray 50%), linear-gradient(135deg, gray 50%, transparent 50%)', backgroundPosition: 'calc(100% - 14px) calc(1em + 1px), calc(100% - 10px) calc(1em + 1px)', backgroundSize: '4px 4px, 4px 4px', backgroundRepeat: 'no-repeat' }} value={task.scheduleFrequency?.unit || 'hours'} onChange={e => {
                            const newUnit = e.target.value as any;
                            const maxVal = newUnit === 'hours' ? 24 : newUnit === 'minutes' ? 1440 : 86400;
                            let val = task.scheduleFrequency?.value || 1;
                            if (val > maxVal) val = maxVal;
                            updateTask({ scheduleFrequency: { value: val, unit: newUnit, startTime: task.scheduleFrequency?.startTime, endTime: task.scheduleFrequency?.endTime } });
                          }}>
                            <option value="hours">小时执行一次</option>
                            <option value="minutes">分钟执行一次</option>
                            <option value="seconds">秒执行一次</option>
                          </select>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[13px] font-bold shrink-0 pl-1" style={{ color: 'var(--text-secondary)' }}>起止时间 (可选)</span>
                          <input 
                            type="time" 
                            className="bg-gray-900 text-sm font-mono text-gray-300 px-1 py-1 rounded-lg outline-none border border-gray-600 focus:border-primary flex-1 text-center"
                            value={task.scheduleFrequency?.startTime || ''}
                            onChange={e => updateTask({ scheduleFrequency: { ...(task.scheduleFrequency || { value: 1, unit: 'hours' }), startTime: e.target.value } })}
                          />
                          <span className="text-gray-500 text-[13px] font-bold">至</span>
                          <input 
                            type="time" 
                            className="bg-gray-900 text-sm font-mono text-gray-300 px-1 py-1 rounded-lg outline-none border border-gray-600 focus:border-primary flex-1 text-center"
                            value={task.scheduleFrequency?.endTime || ''}
                            onChange={e => updateTask({ scheduleFrequency: { ...(task.scheduleFrequency || { value: 1, unit: 'hours' }), endTime: e.target.value } })}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {activeConfigCard === 'batch' && (
                <div className="flex flex-col gap-3 h-full animate-in fade-in slide-in-from-top-2">
                  <BatchParamEditor />
                </div>
              )}

              {activeConfigCard === 'chain' && (
                <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-2">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-medium" style={{ color: 'var(--text-secondary)' }}>选择要触发的任务</label>
                    <select className="bg-gray-800 text-[13px] text-gray-300 px-2.5 py-1.5 rounded-lg outline-none border border-gray-700 focus:border-primary w-full appearance-none" style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M5 7l5 5 5-5'/%3e%3c/svg%3e")`, backgroundPosition: 'right 6px center', backgroundRepeat: 'no-repeat', backgroundSize: '1.2em 1.2em', paddingRight: '28px' }} value={task.nextTaskId || ''} onChange={e => updateTask({ nextTaskId: e.target.value })}>
                      <option value="">-- 不触发任何任务 --</option>
                      {availableTasks.map(t => (
                        <option key={t.id} value={t.id}>{t.name || '未命名任务'}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {activeConfigCard === 'notify' && (
                <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-2">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-medium" style={{ color: 'var(--text-secondary)' }}>选择通知模板</label>
                    <select className="bg-gray-800 text-[13px] text-gray-300 px-2.5 py-1.5 rounded-lg outline-none border border-gray-700 focus:border-primary w-full appearance-none" style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M5 7l5 5 5-5'/%3e%3c/svg%3e")`, backgroundPosition: 'right 6px center', backgroundRepeat: 'no-repeat', backgroundSize: '1.2em 1.2em', paddingRight: '28px' }} value={task.notificationConfigId || ''} onChange={e => updateTask({ notificationConfigId: e.target.value })}>
                      <option value="">-- 不发送通知 --</option>
                      {availableConfigs.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {activeConfigCard === 'monitor' && (
                <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-2">
                  <div className="text-[12px] -mb-1 leading-tight" style={{ color: 'var(--text-secondary)' }}>
                    收集此任务的执行结果供监控面板展示。<br />图表模式需要输出结果包含数值。
                  </div>
                  <div className="flex gap-2">
                    <label className={`flex-1 py-1.5 border rounded flex items-center justify-center gap-1.5 cursor-pointer text-[13px] transition-colors ${task.monitorMode === 'normal' || !task.monitorMode ? 'bg-primary/20 border-primary/50 text-primary font-bold' : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'}`}>
                      <input type="radio" className="hidden" checked={task.monitorMode === 'normal' || !task.monitorMode} onChange={() => updateTask({ monitorMode: 'normal' })} />
                      <span className={`w-2 h-2 rounded-full border border-current ${task.monitorMode === 'normal' || !task.monitorMode ? 'bg-primary' : ''}`}></span>
                      常规模式
                    </label>
                    <label
                      className={`flex-1 py-1.5 border rounded flex items-center justify-center gap-1.5 cursor-pointer text-[13px] transition-colors ${task.monitorMode === 'chart' ? 'bg-primary/20 border-primary/50 text-primary font-bold' : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'}`}
                      title="需要结果中包含可识别的数值（如 90%, 1.5w 等）"
                    >
                      <input type="radio" className="hidden" checked={task.monitorMode === 'chart'} onChange={() => updateTask({ monitorMode: 'chart' })} />
                      <span className={`w-2 h-2 rounded-full border border-current ${task.monitorMode === 'chart' ? 'bg-primary' : ''}`}></span>
                      图表模式
                    </label>
                  </div>
                  {/* Variables Selection */}
                  <div className="flex flex-col gap-1.5 mt-2">
                    <label className="text-[12px] font-medium" style={{ color: 'var(--text-secondary)' }}>选择要记录的输出变量</label>
                    <div className="bg-gray-800/40 rounded border border-gray-700 p-2 flex flex-col gap-1.5 max-h-[150px] overflow-y-auto thin-scrollbar">
                      {task.steps?.filter(s => s.outputVariable).length === 0 ? (
                        <div className="text-[11px] text-gray-500 text-center py-2">暂无可用变量，请在步骤中配置输出变量</div>
                      ) : (
                        task.steps?.filter(s => s.outputVariable).map(s => {
                          const varName = s.outputVariable!;
                          const isNormal = task.monitorMode === 'normal' || !task.monitorMode;

                          // Smart auto-check initialization logic
                          let currentSelected = isNormal ? task.monitorSelectedVarsNormal : task.monitorSelectedVarsChart;
                          if (currentSelected === undefined) {
                            if (isNormal) {
                              // Normal defaults to all
                              currentSelected = task.steps?.filter(st => st.outputVariable).map(st => st.outputVariable!) || [];
                              setTimeout(() => updateTask({ monitorSelectedVarsNormal: currentSelected }), 0);
                            } else {
                              // Chart defaults to heuristic match (zh, en, de)
                              const heuristicRegex = /price|num|rate|cost|amount|count|percent|money|数值|额|率|量|verbrauch|preis|anzahl|kosten|menge/i;
                              currentSelected = task.steps?.filter(st => st.outputVariable && heuristicRegex.test(st.outputVariable)).map(st => st.outputVariable!) || [];
                              setTimeout(() => updateTask({ monitorSelectedVarsChart: currentSelected }), 0);
                            }
                          }

                          const isChecked = currentSelected?.includes(varName);

                          return (
                            <label key={s.id} className="flex items-center gap-2 cursor-pointer group">
                              <input
                                type="checkbox"
                                className="hidden"
                                checked={!!isChecked}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  let newSelected = [...(currentSelected || [])];
                                  if (checked && !newSelected.includes(varName)) newSelected.push(varName);
                                  if (!checked) newSelected = newSelected.filter(v => v !== varName);

                                  if (isNormal) {
                                    updateTask({ monitorSelectedVarsNormal: newSelected });
                                  } else {
                                    updateTask({ monitorSelectedVarsChart: newSelected });
                                  }
                                }}
                              />
                              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isChecked ? 'bg-primary border-primary' : 'bg-gray-900 border-gray-600 group-hover:border-gray-500'}`}>
                                {isChecked && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                              </div>
                              <span className="text-[12px] text-gray-300 font-mono flex-1 truncate group-hover:text-white transition-colors">{varName}</span>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-1 shrink-0">
              <button
                onClick={() => {
                  if (activeConfigCard === 'schedule' && (!task.scheduleType || task.scheduleType === 'time')) {
                    updateTask({ schedule: (task.schedule || []).filter(t => t && t.trim() !== '') });
                  }
                  setActiveConfigCard(null);
                }}
                className="w-full py-2 rounded-lg text-sm font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-2"
                style={{ backgroundColor: 'var(--success)', color: '#fff' }}
              >
                <Save size={16} className="fill-white/20" /> 保存与返回
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
