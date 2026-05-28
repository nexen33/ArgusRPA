import React, { useState } from 'react'
import { useTask } from '../context/TaskContext'
import { useModal } from '../context/ModalContext'
import { Lock, Clock, Layers, Link as LinkIcon, Bell, LineChart, ChevronLeft, Save } from 'lucide-react'
import BatchParamEditor from './BatchParamEditor'

export default function ParamsPanel() {
  const { task, updateTask, activeStepId, setActiveStepId, setIsPickerMode, visitedUrls, pendingStep, setPendingStep } = useTask()
  const modal = useModal()
  const [activeConfigCard, setActiveConfigCard] = useState<string | null>(null)

  React.useEffect(() => {
    // @ts-ignore
    if (!window.electronAPI) return
    // @ts-ignore
    const unsub = window.electronAPI.onElementSelected((data: any) => {
      setIsPickerMode(false)
      // @ts-ignore
      window.electronAPI.setPickerMode(false)

      const newStep = {
        id: Math.random().toString(36).substring(2, 10),
        type: 'click', // Default action type
        selector: data.cssSelector || '',
        selectorXPath: data.xpath || '',
        tagName: data.tagName || '',
        innerText: data.innerText || '',
        outputVariable: '',
        value: '',
        attrName: '',
        description: ''
      }

      setPendingStep(newStep)
      setActiveStepId(null) // deselect active step to show creation panel
    })
    return () => {
      unsub && unsub()
    }
  }, [setIsPickerMode, setActiveStepId])
  
  React.useEffect(() => {
    if (activeStepId) {
      setActiveConfigCard(null)
    }
  }, [activeStepId])

  const activeStep = task.steps?.find(s => s.id === activeStepId)
  const currentStep = pendingStep || activeStep
  const isPending = !!pendingStep

  const confirmPendingStep = () => {
    if (!pendingStep) return
    updateTask({ steps: [...(task.steps || []), pendingStep] })
    setPendingStep(null)
    setActiveStepId(null)
  }

  const cancelPendingStep = () => {
    setPendingStep(null)
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
      modal.toast('❌ 无法运行：请先填写登录页 URL')
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
    const newSteps = task.steps?.map(s => s.id === activeStepId ? { ...s, ...updates } : s)
    updateTask({ steps: newSteps })
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

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'readText': return '读取文本'
      case 'readAttr': return '读取属性'
      case 'click': return '点击元素'
      case 'input': return '输入文本'
      case 'waitForSelector': return '等待出现'
      case 'waitTimer': return '固定等待'
      case 'downloadFile': return '下载文件'
      case 'navigate': return '访问网页'
      case 'calculate': return '变量运算'
      case 'screenshot': return '网页截图'
      case 'skipPopup': return '智能跳过弹窗'
      default: return type
    }
  }

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
                <button
                  onClick={() => setActiveStepId(null)}
                  className="text-green-500 hover:text-green-400 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 w-7 h-7 flex items-center justify-center rounded transition-colors font-bold text-lg"
                  title="完成编辑并保存"
                >
                  ✓
                </button>
              )}
            </div>

            {/* 元素基本信息预览 */}
            {(currentStep.tagName || currentStep.innerText) && (
              <div className="bg-gray-900/60 p-2.5 rounded border border-gray-700 shadow-inner">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded font-mono font-bold uppercase shrink-0">
                    {currentStep.tagName}
                  </span>
                  <span className="text-[11px] text-gray-400 truncate" title={currentStep.innerText}>
                    {currentStep.innerText || '<无文本内容>'}
                  </span>
                </div>
              </div>
            )}

            {/* 操作类型下拉 */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] text-gray-500 dark:text-[#b1b8c0] font-medium">操作类型</label>
              <div className="relative">
                <select
                  className="bg-gray-800 text-xs text-gray-200 px-2.5 py-2 rounded-lg outline-none border border-gray-600 focus:border-primary w-full appearance-none font-medium cursor-pointer shadow-sm hover:border-gray-500 transition-colors"
                  value={currentStep.type}
                  onChange={e => {
                    const newType = e.target.value
                    if (newType === 'skipPopup' && !currentStep.value) {
                      updateCurrentStep({ type: newType, value: '"稍后", "跳过", "暂不", "以后再说", "我知道了", "取消", "残忍拒绝", "关闭"' })
                    } else {
                      updateCurrentStep({ type: newType })
                    }
                  }}
                >
                  <option value="click">👆 点击此元素</option>
                  <option value="input">⌨️ 向此元素输入文本</option>
                  <option value="readText">📄 读取文本内容</option>
                  <option value="readAttr">🏷️ 读取属性值</option>
                  <option value="waitForSelector">⏳ 等待此元素出现</option>
                  <option value="waitTimer">⏱️ 固定时长等待 (全局)</option>
                  <option value="downloadFile">📥 点击并等待文件下载</option>
                  <option value="navigate">🌐 访问网页 (全局)</option>
                  <option value="condition">🔀 条件判断网关</option>
                  <option value="calculate">🧮 变量数学运算</option>
                  <option value="screenshot">📸 网页/元素截图</option>
                  <option value="skipPopup">🚫 智能跳过页面弹窗 (全局)</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">
                  ▼
                </div>
              </div>
            </div>

            {/* CSS Selector */}
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

            {/* XPath */}
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

            {/* 固定时长等待设置 */}
            {currentStep.type === 'waitTimer' && (
              <div className="flex flex-col gap-1.5 border-l-2 border-primary pl-2 my-2 animate-in slide-in-from-left-2">
                <label className="text-[11px] text-gray-400 font-medium">等待时长 (秒)</label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  className="bg-gray-800 text-xs text-gray-300 px-2.5 py-1.5 rounded-lg outline-none border border-gray-700 focus:border-primary w-full"
                  value={currentStep.waitDuration || ''}
                  onChange={e => updateCurrentStep({ waitDuration: parseFloat(e.target.value) })}
                  placeholder="例如: 3.5"
                />
              </div>
            )}

            {/* 根据 type 渲染不同字段 */}
            {currentStep.type === 'input' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] text-gray-500 dark:text-[#b1b8c0] font-medium">输入静态文本或 {'{{变量名}}'}</label>
                <input
                  className="bg-gray-900 text-xs text-gray-300 px-2.5 py-1.5 rounded-lg outline-none border border-gray-700 focus:border-primary w-full"
                  value={currentStep.value || ''}
                  onChange={e => updateCurrentStep({ value: e.target.value })}
                  placeholder="要输入的值"
                />
              </div>
            )}
            {currentStep.type === 'readText' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] text-gray-500 dark:text-[#b1b8c0] font-medium">输入变量名</label>
                <input
                  className="bg-gray-900 text-xs text-gray-300 px-2.5 py-1.5 rounded-lg outline-none border border-gray-700 focus:border-primary w-full"
                  value={currentStep.outputVariable || ''}
                  onChange={e => updateCurrentStep({ outputVariable: e.target.value })}
                  placeholder="例如: price"
                />
              </div>
            )}
            {currentStep.type === 'readAttr' && (
              <div className="flex flex-col gap-3 p-3 mt-1 bg-gray-800/50 rounded border border-gray-700">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] text-primary font-medium">输入属性名</label>
                  <input
                    className="bg-gray-900 text-xs text-gray-200 px-2.5 py-2 rounded-lg outline-none border border-gray-600 focus:border-primary w-full"
                    value={currentStep.attrName || ''}
                    onChange={e => updateCurrentStep({ attrName: e.target.value })}
                    placeholder="例如: href 或 src"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] text-primary font-medium">输入变量名</label>
                  <input
                    className="bg-gray-900 text-xs text-gray-200 px-2.5 py-2 rounded-lg outline-none border border-gray-600 focus:border-primary w-full"
                    value={currentStep.outputVariable || ''}
                    onChange={e => updateCurrentStep({ outputVariable: e.target.value })}
                    placeholder="例如: linkUrl"
                  />
                </div>
              </div>
            )}
            {currentStep.type === 'calculate' && (
              <div className="flex flex-col gap-3 p-3 mt-1 bg-gray-800/50 rounded border border-gray-700">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] text-primary font-medium">数学表达式 (支持 {'{{变量名}}'})</label>
                  <input
                    className="bg-gray-900 text-xs text-gray-200 px-2.5 py-2 rounded-lg outline-none border border-gray-600 focus:border-primary w-full"
                    value={currentStep.value || ''}
                    onChange={e => updateCurrentStep({ value: e.target.value })}
                    placeholder="例如: {{price}} * 0.8"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] text-primary font-medium">存入变量名</label>
                  <input
                    className="bg-gray-900 text-xs text-gray-200 px-2.5 py-2 rounded-lg outline-none border border-gray-600 focus:border-primary w-full"
                    value={currentStep.outputVariable || ''}
                    onChange={e => updateCurrentStep({ outputVariable: e.target.value })}
                    placeholder="例如: finalPrice"
                  />
                </div>
              </div>
            )}
            {currentStep.type === 'screenshot' && (
              <div className="flex flex-col gap-3 p-3 mt-1 bg-gray-800/50 rounded border border-gray-700">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] text-gray-500 dark:text-[#b1b8c0] font-medium">可选：自定义本地保存路径</label>
                  <input
                    className="bg-gray-900 text-xs text-gray-200 px-2.5 py-2 rounded-lg outline-none border border-gray-600 focus:border-primary w-full"
                    value={currentStep.savePath || ''}
                    onChange={e => updateCurrentStep({ savePath: e.target.value })}
                    placeholder="默认: Argus_issue/run_images"
                  />
                </div>
                <div className="flex items-center gap-2 pt-1 border-t border-gray-700">
                  <input
                    type="checkbox"
                    id="ocrEnabled"
                    checked={!!currentStep.ocrEnabled}
                    onChange={e => updateCurrentStep({ ocrEnabled: e.target.checked })}
                    className="rounded border-gray-600 text-primary focus:ring-primary bg-gray-900"
                  />
                  <label htmlFor="ocrEnabled" className="text-[11px] text-gray-300 cursor-pointer font-bold">
                    启用本地 OCR 识别文字
                  </label>
                </div>
                {currentStep.ocrEnabled && (
                  <div className="flex gap-3 pl-6">
                    <div className="flex flex-col gap-1.5 flex-1">
                      <label className="text-[11px] text-primary font-medium">OCR 识别语种</label>
                      <select
                        className="bg-gray-900 text-xs text-gray-200 px-2.5 py-2 rounded-lg outline-none border border-gray-600 focus:border-primary w-full"
                        value={currentStep.ocrLanguage || 'chi_sim+eng'}
                        onChange={e => updateCurrentStep({ ocrLanguage: e.target.value })}
                      >
                        <option value="chi_sim+eng">中文(简) + 英文</option>
                        <option value="eng">仅英文</option>
                        <option value="deu">德语</option>
                        <option value="chi_tra+eng">中文(繁) + 英文</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5 flex-1">
                      <label className="text-[11px] text-primary font-medium">存入变量名</label>
                      <input
                        className="bg-gray-900 text-xs text-gray-200 px-2.5 py-2 rounded-lg outline-none border border-gray-600 focus:border-primary w-full"
                        value={currentStep.outputVariable || ''}
                        onChange={e => updateCurrentStep({ outputVariable: e.target.value })}
                        placeholder="ocrResult"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
            {currentStep.type === 'downloadFile' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] text-gray-500 dark:text-[#b1b8c0] font-medium">自定义文件名 (不带后缀)</label>
                <input
                  className="bg-gray-900 text-xs text-gray-300 px-2.5 py-1.5 rounded-lg outline-none border border-gray-700 focus:border-primary w-full"
                  value={currentStep.downloadFileName || ''}
                  onChange={e => updateCurrentStep({ downloadFileName: e.target.value })}
                  placeholder="支持 {{_SYS_CURRENT_DATE_}} 或 yyyymmdd"
                />
              </div>
            )}
            {currentStep.type === 'navigate' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] text-gray-500 dark:text-[#b1b8c0] font-medium">跳转网址</label>
                <input
                  className="bg-gray-900 text-xs text-gray-300 px-2.5 py-1.5 rounded-lg outline-none border border-gray-700 focus:border-primary w-full font-mono"
                  value={currentStep.value || ''}
                  onChange={e => updateCurrentStep({ value: e.target.value })}
                  placeholder="例如: https://baidu.com"
                />
              </div>
            )}
            {currentStep.type === 'skipPopup' && (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] text-gray-500 dark:text-[#b1b8c0] font-medium">关闭关键词词库</label>
                  <textarea
                    className="bg-gray-900 text-xs text-gray-300 px-2.5 py-1.5 rounded-lg outline-none border border-gray-700 focus:border-primary w-full font-mono min-h-[60px]"
                    value={currentStep.value || ''}
                    onChange={e => updateCurrentStep({ value: e.target.value })}
                    placeholder="以双引号和逗号隔开..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 cursor-pointer group w-max">
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={!!currentStep.preScreenshot}
                      onChange={e => {
                        const isChecked = e.target.checked;
                        updateCurrentStep({ 
                          preScreenshot: isChecked,
                          notifyAfterScreenshot: isChecked ? currentStep.notifyAfterScreenshot : false
                        });
                      }}
                    />
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${currentStep.preScreenshot ? 'bg-primary border-primary' : 'bg-gray-900 border-gray-600 group-hover:border-gray-500'}`}>
                      {currentStep.preScreenshot && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                    </div>
                    <span className="text-[12px] text-gray-400 group-hover:text-gray-300 transition-colors">弹窗处理前截图</span>
                  </label>
                  
                  <label className={`flex items-center gap-2 cursor-pointer group w-max ${!currentStep.preScreenshot ? 'opacity-50 pointer-events-none' : ''}`}>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={!!currentStep.notifyAfterScreenshot}
                      onChange={e => updateCurrentStep({ notifyAfterScreenshot: e.target.checked })}
                      disabled={!currentStep.preScreenshot}
                    />
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${currentStep.notifyAfterScreenshot ? 'bg-primary border-primary' : 'bg-gray-900 border-gray-600 group-hover:border-gray-500'}`}>
                      {currentStep.notifyAfterScreenshot && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                    </div>
                    <span className="text-[12px] text-gray-400 group-hover:text-gray-300 transition-colors">截图后系统通知</span>
                  </label>
                </div>
              </div>
            )}
            {currentStep.type === 'condition' && (
              <div className="flex flex-col gap-3 p-3 mt-1 bg-gray-800/50 rounded border border-gray-700">
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="text-[11px] text-primary font-medium mb-1.5 block">变量名</label>
                    <input
                      className="bg-gray-900 text-xs text-gray-200 px-2.5 py-2 rounded-lg outline-none border border-gray-600 focus:border-primary w-full"
                      value={currentStep.conditionVar || ''}
                      onChange={e => updateCurrentStep({ conditionVar: e.target.value })}
                      placeholder="例如: percent"
                    />
                  </div>
                  <div className="w-20">
                    <label className="text-[11px] text-primary font-medium mb-1.5 block">操作符</label>
                    <select
                      className="bg-gray-900 text-xs text-gray-200 px-2.5 py-2 rounded-lg outline-none border border-gray-600 focus:border-primary w-full"
                      value={currentStep.conditionOperator || '=='}
                      onChange={e => updateCurrentStep({ conditionOperator: e.target.value as any })}
                    >
                      <option value="==">==</option>
                      <option value="!=">!=</option>
                      <option value="&gt;">&gt;</option>
                      <option value="&gt;=">&gt;=</option>
                      <option value="&lt;">&lt;</option>
                      <option value="&lt;=">&lt;=</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="text-[11px] text-primary font-medium mb-1.5 block">目标值</label>
                    <input
                      className="bg-gray-900 text-xs text-gray-200 px-2.5 py-2 rounded-lg outline-none border border-gray-600 focus:border-primary w-full"
                      value={currentStep.conditionValue || ''}
                      onChange={e => updateCurrentStep({ conditionValue: e.target.value })}
                      placeholder="例如: 95"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-primary font-medium mb-1.5 block">条件不满足时</label>
                  <select
                    className="bg-gray-900 text-xs text-gray-200 px-2.5 py-2 rounded-lg outline-none border border-gray-600 focus:border-primary w-full"
                    value={currentStep.conditionFailAction || 'error'}
                    onChange={e => updateCurrentStep({ conditionFailAction: e.target.value as any })}
                  >
                    <option value="error">报错退出当前任务</option>
                    <option value="skip">静默跳过剩余步骤</option>
                    <option value="skip_notify">静默跳过并取消通知</option>
                  </select>
                </div>
              </div>
            )}
            {currentStep.type === 'downloadFile' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] text-gray-500 dark:text-[#b1b8c0] font-medium">输入保存目录路径 (可选)</label>
                <input
                  className="bg-gray-900 text-xs text-gray-300 px-2.5 py-1.5 rounded-lg outline-none border border-gray-700 focus:border-primary w-full"
                  value={currentStep.downloadDir || ''}
                  onChange={e => updateCurrentStep({ downloadDir: e.target.value })}
                  placeholder="留空则使用系统默认下载目录"
                />
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
            <h2 className="font-bold text-lg text-gray-200">操作中心</h2>
            <div className="flex flex-col items-center justify-center h-[136px] text-gray-500 text-sm text-center bg-gray-900/50 rounded-lg">
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
                      <div className="flex items-center gap-2 bg-gray-800/40 p-2.5 rounded-lg border border-gray-700 shadow-inner">
                        <span className="text-[13px] font-bold shrink-0 pl-1" style={{ color: 'var(--text-secondary)' }}>每隔</span>
                        <input type="number" min="1" className="bg-gray-900 text-sm text-primary px-3 py-1.5 rounded-lg outline-none border border-gray-600 focus:border-primary w-20 text-center font-mono font-bold shadow-sm" value={task.scheduleFrequency?.value ?? ''} onChange={e => {
                          const raw = e.target.value;
                          const val = raw === '' ? '' : parseInt(raw);
                          updateTask({ scheduleFrequency: { value: val as any, unit: task.scheduleFrequency?.unit || 'hours' } });
                        }} />
                        <select className="bg-gray-900 text-[13px] text-gray-300 px-3 py-1.5 rounded-lg outline-none border border-gray-600 focus:border-primary flex-1 cursor-pointer font-medium shadow-sm appearance-none" style={{ backgroundImage: 'linear-gradient(45deg, transparent 50%, gray 50%), linear-gradient(135deg, gray 50%, transparent 50%)', backgroundPosition: 'calc(100% - 14px) calc(1em + 1px), calc(100% - 10px) calc(1em + 1px)', backgroundSize: '4px 4px, 4px 4px', backgroundRepeat: 'no-repeat' }} value={task.scheduleFrequency?.unit || 'hours'} onChange={e => updateTask({ scheduleFrequency: { value: task.scheduleFrequency?.value || 1, unit: e.target.value as any } })}>
                          <option value="hours">小时</option>
                          <option value="minutes">分钟</option>
                          <option value="seconds">秒</option>
                        </select>
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
                    <select className="bg-gray-800 text-[13px] text-gray-300 px-2.5 py-1.5 rounded-lg outline-none border border-gray-700 focus:border-primary w-full" value={task.nextTaskId || ''} onChange={e => updateTask({ nextTaskId: e.target.value })}>
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
                    <select className="bg-gray-800 text-[13px] text-gray-300 px-2.5 py-1.5 rounded-lg outline-none border border-gray-700 focus:border-primary w-full" value={task.notificationConfigId || ''} onChange={e => updateTask({ notificationConfigId: e.target.value })}>
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
