import React, { useEffect, useState, useRef } from 'react'
import { Square, Pause, Play, Loader2, CheckCircle, AlertCircle, Maximize2, Activity, Shrink } from 'lucide-react'

export default function DesktopWidget() {
  const [status, setStatus] = useState<'running' | 'paused' | 'complete' | 'error' | 'idle'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [currentStepId, setCurrentStepId] = useState<string | null>(null)
  const [task, setTask] = useState<any | null>(null)
  const [completedStepIds, setCompletedStepIds] = useState<Set<string>>(new Set())
  const [isDebugMode, setIsDebugMode] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Add transparent background to html/body for widget
    document.documentElement.style.background = 'transparent'
    document.body.style.background = 'transparent'
    
    // @ts-ignore
    if (!window.electronAPI) return
    
    // Listen to same events as RunStatusBar
    // @ts-ignore
    const unsubStarted = window.electronAPI.onTaskStarted && window.electronAPI.onTaskStarted((data: any) => {
      setStatus('running')
      setErrorMsg('')
      setCurrentStepId(null)
      setCompletedStepIds(new Set())
      if (data && data.isDebugMode !== undefined) setIsDebugMode(data.isDebugMode)
    })
    
    // @ts-ignore
    const unsubReady = window.electronAPI.onStepReady((data: any) => {
      if (data && data.isPaused) {
        setStatus('paused')
      }
      setCurrentStepId(typeof data === 'string' ? data : data.stepId)
    })
    
    // @ts-ignore
    const unsubResult = window.electronAPI.onStepResult((data: any) => {
      setStatus('running') // Assume running after result unless paused again
      if (data && data.stepId) {
        setCompletedStepIds(prev => new Set(prev).add(data.stepId))
      }
    })
    
    // @ts-ignore
    const unsubComplete = window.electronAPI.onTaskComplete(() => setStatus('complete'))
    // @ts-ignore
    const unsubError = window.electronAPI.onTaskError((err: any) => {
      setStatus('error')
      setErrorMsg(typeof err === 'string' ? err : err.error)
    })
    
    // Initial fetch
    // @ts-ignore
    window.electronAPI.getActiveTasks().then((res: any) => {
      if (res?.success && res.data && res.data.length > 0) {
        const activeTaskId = res.data[0];
        setStatus('running')
        
        // @ts-ignore
        window.electronAPI.getEngineStatus(activeTaskId).then((st: any) => {
          if (st?.data) {
            setStatus(st.data.isPaused ? 'paused' : 'running')
            setCurrentStepId(st.data.currentStepId)
            if (st.data.taskData) setTask(st.data.taskData);
            if (st.data.isDebugMode !== undefined) setIsDebugMode(st.data.isDebugMode)
          }
        })
      }
    })

    return () => {
      unsubStarted && unsubStarted()
      unsubReady && unsubReady()
      unsubResult && unsubResult()
      unsubComplete && unsubComplete()
      unsubError && unsubError()
    }
  }, [])

  // Auto-scroll to current step
  useEffect(() => {
    if (currentStepId && scrollRef.current) {
      const el = scrollRef.current.querySelector(`[data-step-id="${currentStepId}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentStepId])
  
  const handleStop = async () => {
    // @ts-ignore
    await window.electronAPI.stopTask()
  }

  const handleContinue = async () => {
    // @ts-ignore
    await window.electronAPI.stepContinue()
  }

  const handleRestore = () => {
    // @ts-ignore
    window.electronAPI.windowRestore()
  }

  const handleToggleExpand = () => {
    const nState = !isExpanded;
    setIsExpanded(nState);
    if (nState && scrollRef.current) {
      // 104 is the sum of header (40) + status (40) + footer (~24 due to shrinkage?)
      // It's safer to measure the full scrollHeight plus the fixed elements
      const listHeight = scrollRef.current.scrollHeight;
      const targetHeight = Math.min(104 + listHeight + 54, 600);
      // @ts-ignore
      window.electronAPI.resizeDesktopWidget && window.electronAPI.resizeDesktopWidget(targetHeight);
    } else {
      // @ts-ignore
      window.electronAPI.resizeDesktopWidget && window.electronAPI.resizeDesktopWidget(380);
    }
  }
  
  // Calculate index for deduction
  let currentStepIndex = -1;
  if (task && task.steps && currentStepId) {
     currentStepIndex = task.steps.findIndex((s: any) => s.id === currentStepId);
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'readText': return '读取文本'
      case 'readAttr': return '读取属性'
      case 'click': return '点击元素'
      case 'input': return '输入文本'
      case 'waitForSelector': return '等待出现'
      case 'waitTimer': return '固定等待'
      case 'calculate': return '变量运算 (全局)'
      case 'assignVariable': return '文本变量植入 (全局)'
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
      case 'launchApp': return '启动应用 (Win32)'
      case 'closeApp': return '关闭应用 (Win32)'
      case 'windowControl': return '桌面窗口控制 (Win32)'
      case 'systemSearch': return '开始菜单搜索 (Win32)'
      case 'sendWin32Message': return '发送系统消息 (Win32)'
      case 'imageMatch': return '通过截图选取 (视觉)'
      case 'dragAndDrop': return '按住拖拽'
      case 'readClipboard': return '读取剪贴板 (全局)'
      default: return type
    }
  }

  const getStepTitle = (step: any) => {
    const isDefaultImageMatch = step.type === 'imageMatch' && step.description === '通过截图选取: (图像识别)';
    const isDefaultWaitTimer = step.type === 'waitTimer' && (step.description === 'waitTimer' || step.description === '固定等待' || step.description === '固定时长等待');
    const isDefaultDragAndDrop = step.type === 'dragAndDrop' && (!step.description || step.description === 'dragAndDrop' || step.description === '按住拖拽');
    
    if (step.description && !isDefaultImageMatch && !isDefaultWaitTimer && !isDefaultDragAndDrop) return step.description;
    
    switch (step.type) {
      case 'imageMatch':
        let actionStr = '左键单击';
        if (step.actionAfterMatch === 'rightClick') actionStr = '右键单击';
        if (step.actionAfterMatch === 'doubleClick') actionStr = '左键双击';
        if (step.actionAfterMatch === 'hover') actionStr = '鼠标悬停';
        return actionStr;
      case 'waitTimer': return `等待 ${step.waitDuration || 0} 秒`;
      case 'input': return `输入: ${step.value || ''}`;
      case 'dragAndDrop': {
        const nx = Number(step.dragOffsetX) || 0;
        const ny = Number(step.dragOffsetY) || 0;
        let parts = [];
        if (nx > 0) parts.push(`右移${nx}px`); else if (nx < 0) parts.push(`左移${Math.abs(nx)}px`);
        if (ny > 0) parts.push(`下移${ny}px`); else if (ny < 0) parts.push(`上移${Math.abs(ny)}px`);
        return `按住拖拽: ${parts.length > 0 ? parts.join(', ') : '原地拖拽'}`;
      }
      case 'readClipboard': return `存入变量: ${step.outputVariable || '未命名'}`;
      case 'systemSearch': return `搜索: ${step.searchKeyword || '未配置'}`;
      case 'windowControl': {
        let opStr = step.windowCommand === 'focus' ? '前置并激活' : step.windowCommand === 'minimize_others_restore' ? '独占显示' : step.windowCommand === 'close' ? '关闭窗口' : step.windowCommand === 'minimize' ? '最小化' : step.windowCommand === 'maximize' ? '最大化' : step.windowCommand === 'restore' ? '还原' : '无指令';
        if (step.windowX !== undefined && step.windowY !== undefined && step.windowWidth !== undefined && step.windowHeight !== undefined) {
          opStr += ` | 调整尺寸: (${step.windowX},${step.windowY},${step.windowWidth},${step.windowHeight})`;
        }
        return `操作: ${opStr}`;
      }
      case 'sendWin32Message': return `消息码: ${step.win32Message || '未配置'}`;
      case 'launchApp': return `路径: ${step.appPath || '未配置'}`;
      case 'closeApp': return `进程名: ${step.processName || '未配置'}`;
      default: return getTypeLabel(step.type);
    }
  }

  const getStepSubtitle = (step: any) => {
    const baseLabel = getTypeLabel(step.type);
    if (step.type === 'click') {
      let mode = '左键单击';
      if (step.clickMode === 'rightClick') mode = '右键单击';
      if (step.clickMode === 'doubleClick') mode = '左键双击';
      return `${baseLabel}: ${mode}`;
    }
    if (step.type === 'dragAndDrop' || (step.type === 'imageMatch' && step.actionAfterMatch === 'dragAndDrop')) {
      const nx = Number(step.dragOffsetX) || 0;
      const ny = Number(step.dragOffsetY) || 0;
      let parts = [];
      if (nx > 0) parts.push(`右移${nx}px`); else if (nx < 0) parts.push(`左移${Math.abs(nx)}px`);
      if (ny > 0) parts.push(`下移${ny}px`); else if (ny < 0) parts.push(`上移${Math.abs(ny)}px`);
      return `${baseLabel}: ${parts.length > 0 ? parts.join(', ') : '原地拖拽'}`;
    }
    return baseLabel;
  }

  return (
    <div className="w-full h-screen overflow-hidden flex flex-col p-2 select-none" style={{ WebkitAppRegion: 'drag' } as any}>
      <div className="flex-1 bg-black/85 backdrop-blur-2xl border border-gray-700/60 rounded-2xl shadow-2xl flex flex-col overflow-hidden theme-desktop">
        
        {/* Header */}
        <div className="h-10 flex items-center justify-between px-4 border-b border-gray-800 bg-white/5">
          <div className="flex items-center gap-2.5">
            <div className={`w-2.5 h-2.5 rounded-full ${status === 'running' ? 'bg-purple-500 animate-pulse shadow-[0_0_8px_#a855f7]' : status === 'paused' ? 'bg-amber-500 shadow-[0_0_8px_#f59e0b]' : status === 'complete' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
            <span className="text-xs font-bold text-white tracking-wide">Argus 桌面自动执行</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleToggleExpand} className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-white/10" style={{ WebkitAppRegion: 'no-drag' } as any} title={isExpanded ? "还原尺寸" : "展开视图"}>
              {isExpanded ? <Shrink size={14} /> : <Maximize2 size={14} />}
            </button>
          </div>
        </div>

        {/* Content Top: Status Indicator */}
        <div className={`flex items-center shrink-0 border-b border-gray-800/50 bg-gradient-to-b from-white/5 to-transparent transition-all px-4 py-2 gap-2`}>
          <div className={`rounded-full flex items-center justify-center shadow-lg backdrop-blur-md border transition-all w-6 h-6 ${status === 'running' ? 'bg-purple-500/20 border-purple-500/50 text-purple-400' : status === 'paused' ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' : status === 'complete' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : status === 'error' ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-gray-800/30 border-gray-700/30 text-gray-500'}`}>
            {status === 'running' && <Activity size={12} className="animate-pulse" />}
            {status === 'paused' && <Pause size={12} />}
            {status === 'complete' && <CheckCircle size={12} />}
            {status === 'error' && <AlertCircle size={12} />}
            {status === 'idle' && <Square size={12} />}
          </div>
          
          <div className="flex-1 flex items-center justify-between min-w-0">
            <span className={`font-bold tracking-wide transition-all truncate pr-2 ${status === 'idle' ? 'text-[11px] text-gray-500' : 'text-[12px] text-white'}`}>
              {status === 'running' ? '正在执行任务' :
               status === 'paused' ? '任务已暂停' :
               status === 'complete' ? '任务执行完毕' :
               status === 'error' ? '任务异常中断' : '等待任务接入...'}
            </span>
            {isDebugMode && (
              <span className="shrink-0 px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 text-[10px] font-bold border border-orange-500/30">
                调试开启
              </span>
            )}
          </div>
        </div>
        {status === 'error' && <div className="px-4 pb-2 border-b border-gray-800/50 text-[11px] text-red-400 leading-tight opacity-90">{errorMsg}</div>}

        {/* Content Middle: Step Flow */}
        <div className="flex-1 overflow-y-auto p-3 custom-scrollbar" ref={scrollRef} style={{ WebkitAppRegion: 'no-drag' } as any}>
          {task && task.steps && task.steps.length > 0 ? (
            <div className="flex flex-col gap-1 relative">
              {/* Timeline line connecting items */}
              <div className="absolute left-[17px] top-4 bottom-4 w-px bg-gray-800 z-0">
                <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-black z-10"></div>
                <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-black z-10"></div>
              </div>
              
              {task.steps.map((step: any, index: number) => {
                 const isCurrent = currentStepId === step.id;
                 // Deduce completed: either explicitly in set or index < current index (rough heuristic)
                 const isCompleted = completedStepIds.has(step.id) || (currentStepIndex > -1 && index < currentStepIndex) || status === 'complete';

                 return (
                   <div key={step.id} data-step-id={step.id} className={`relative z-10 flex items-start gap-3 p-2.5 rounded-lg transition-all duration-300 ${isCurrent ? 'bg-purple-500/15 border border-purple-500/30 shadow-lg scale-[1.02]' : 'bg-transparent border border-transparent'}`}>
                     <div className="mt-0.5 shrink-0 w-[14px] h-[14px] flex items-center justify-center bg-black rounded-full relative">
                       {isCompleted ? (
                         <CheckCircle size={14} className="text-emerald-500" />
                       ) : isCurrent ? (
                         <Loader2 size={14} className="text-purple-400 animate-spin" />
                       ) : (
                         <div className="w-3.5 h-3.5 rounded-full border-[1.5px] border-gray-600 bg-black shadow-sm"></div>
                       )}
                     </div>
                     <div className="flex flex-col min-w-0">
                       <span className={`text-[13px] font-bold truncate ${isCurrent ? 'text-white' : isCompleted ? 'text-gray-200' : 'text-gray-400'}`}>
                         {getStepTitle(step)}
                       </span>
                       <span className={`text-[11px] font-bold mt-0.5 truncate ${isCurrent ? 'text-purple-300' : 'text-gray-400'} opacity-90`}>
                         {getStepSubtitle(step)}
                       </span>
                     </div>
                   </div>
                 );
              })}
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center opacity-30 text-white gap-2">
              <Activity size={24} />
              <span className="text-xs font-bold">暂无步骤流</span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-3 border-t border-gray-800 bg-white/5 flex gap-2 shrink-0" style={{ WebkitAppRegion: 'no-drag' } as any}>
          {(status === 'running' || status === 'paused') && (
            <>
              <button 
                onClick={handleContinue} 
                disabled={status === 'running'}
                className={`flex-1 py-2.5 font-bold rounded-lg text-sm transition-all flex items-center justify-center gap-2 border ${status === 'running' ? 'bg-gray-700/50 text-gray-400 border-gray-600/50 cursor-not-allowed' : 'bg-[#9c8bbd] hover:bg-[#b09ed3] text-white shadow-[0_4px_14px_rgba(156,139,189,0.39)] active:scale-95 border-[#a898c9]/50'}`}>
                <Play size={15} fill="currentColor" />
                继续执行
              </button>
              <button onClick={handleStop} title="中止任务" className="flex-none px-3 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-bold rounded-lg text-sm transition-all flex items-center justify-center gap-2 active:scale-95">
                <Square size={14} fill="currentColor" />
              </button>
            </>
          )}
          {(status === 'complete' || status === 'error' || status === 'idle') && (
            <button onClick={handleRestore} className="w-full py-2.5 bg-white hover:bg-gray-200 text-black font-bold rounded-lg text-sm transition-all flex items-center justify-center gap-2 active:scale-95 shadow-[0_2px_10px_rgba(255,255,255,0.2)]">
              返回主界面
            </button>
          )}
        </div>
        
      </div>
    </div>
  )
}
