import React from 'react'
import BrowserPlaceholder from './BrowserPlaceholder'
import StepsList from './StepsList'
import ParamsPanel from './ParamsPanel'
import { useTask } from '../context/TaskContext'

import RunStatusBar from './RunStatusBar'

type Tab = { id: string, url: string, title: string }

export default function TaskConfigurator() {
  const { task, updateTask, isPickerMode, setIsPickerMode, addVisitedUrl } = useTask()

  const [tabs, setTabs] = React.useState<Tab[]>([
    { id: 'main', url: task.targetUrl || '', title: 'Main Tab' }
  ])
  const [activeTabId, setActiveTabId] = React.useState('main')

  React.useEffect(() => {
    // Sync main tab URL if task.targetUrl changes externally
    setTabs(prev => prev.map(t => t.id === 'main' ? { ...t, url: task.targetUrl || '' } : t))
  }, [task.targetUrl])

  React.useEffect(() => {
    // @ts-ignore
    if (!window.electronAPI) return

    const onNewTab = (data: { tabId: string, url: string, title: string }) => {
      setTabs(prev => [...prev, { id: data.tabId, url: data.url, title: data.title }])
      setActiveTabId(data.tabId)
    }

    const onNavigated = (data: { tabId: string, url: string }) => {
      setTabs(prev => prev.map(t => t.id === data.tabId ? { ...t, url: data.url } : t))
      addVisitedUrl(data.url)
    }

    const onTitleUpdated = (data: { tabId: string, title: string }) => {
      setTabs(prev => prev.map(t => t.id === data.tabId ? { ...t, title: data.title } : t))
    }

    // @ts-ignore
    const removeNewTab = window.electronAPI.onNewBrowserTab(onNewTab)
    // @ts-ignore
    const removeNavigated = window.electronAPI.onBrowserNavigated(onNavigated)
    // @ts-ignore
    const removeTitleUpdated = window.electronAPI.onBrowserTitleUpdated(onTitleUpdated)

    return () => {
      if (removeNewTab) removeNewTab()
      if (removeNavigated) removeNavigated()
      if (removeTitleUpdated) removeTitleUpdated()
    }
  }, [])

  React.useEffect(() => {
    // @ts-ignore
    if (window.electronAPI && task.id) {
      // @ts-ignore
      window.electronAPI.setActiveTask(task.id)
    }
    return () => {
      // @ts-ignore
      if (window.electronAPI) window.electronAPI.setActiveTask(null)
    }
  }, [task.id])

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0]
  const currentInputUrl = activeTab?.url || ''

  const handleNavigate = (e: React.FormEvent) => {
    e.preventDefault()
    let target = currentInputUrl
    
    // 如果存在并发参数，用第一条参数值临时替换进行页面加载，以便用户可以正常抓取元素
    if (task.batchParam?.enabled && task.batchParam.paramName && task.batchParam.paramValues?.length > 0) {
      const regex = new RegExp(`\\{\\{${task.batchParam.paramName}\\}\\}`, 'g')
      target = target.replace(regex, task.batchParam.paramValues[0].value)
    }

    if (!target.startsWith('http') && target.trim().length > 0) target = 'https://' + target
    
    // @ts-ignore
    window.electronAPI.navigateBrowser(target)
  }

  const switchTab = (id: string) => {
    setActiveTabId(id)
    // @ts-ignore
    window.electronAPI.switchBrowserTab(id)
  }

  const closeTab = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (id === 'main') return
    // @ts-ignore
    window.electronAPI.closeBrowserTab(id)
    setTabs(prev => prev.filter(t => t.id !== id))
    if (activeTabId === id) {
      setActiveTabId('main')
    }
  }

  const togglePickerMode = () => {
    const newState = !isPickerMode
    setIsPickerMode(newState)
    // @ts-ignore
    window.electronAPI.setPickerMode(newState)
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="px-3 pt-3">
        <RunStatusBar />
      </div>
      
      <div className="flex-1 flex p-3 gap-3 min-h-0">
        {/* Left Column: Browser (Flexible Width) */}
      <div className="flex-1 min-w-[400px] h-full flex flex-col bg-darkPanel rounded-xl border border-gray-800 overflow-hidden shadow-2xl relative">
        {/* 配置模式高亮边缘提示 */}
        {isPickerMode && (
          <div className="absolute inset-0 border-2 border-primary pointer-events-none z-50 rounded-xl" />
        )}
        
        {/* Tab Bar Container */}
        <div 
          className="flex items-end px-2 pt-1.5 gap-1 overflow-x-auto scrollbar-hide relative z-10 bg-black/5 dark:bg-black/20 rounded-tl-xl" 
        >
          {tabs.map(tab => {
            const isActive = activeTabId === tab.id;
            return (
              <div 
                key={tab.id}
                onClick={() => switchTab(tab.id)}
                className={`group flex items-center gap-2 px-3 py-1.5 text-xs min-w-[120px] max-w-[200px] cursor-pointer transition-all select-none relative ${
                  isActive 
                    ? 'rounded-t-lg font-medium shadow-[0_-2px_8px_rgba(0,0,0,0.04)] z-20' 
                    : 'rounded-t-lg hover:bg-black/5 dark:hover:bg-white/5 opacity-80 hover:opacity-100 z-10'
                }`}
                style={{ 
                  backgroundColor: isActive ? 'var(--bg-elevated)' : 'transparent',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)'
                }}
              >
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isActive ? 'bg-primary shadow-[0_0_8px_rgba(59,130,246,0.8)]' : 'bg-gray-400'}`}></div>
                <span className="truncate flex-1 text-xs tracking-wide" title={tab.title}>{tab.title}</span>
                {tab.id !== 'main' && (
                  <button 
                    onClick={(e) => closeTab(e, tab.id)}
                    className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${
                      isActive ? 'hover:bg-black/10 dark:hover:bg-white/10' : 'opacity-0 group-hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10'
                    }`}
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Address Bar Area */}
        <div 
          className="py-1.5 border-b flex items-center px-3 gap-2 relative z-20 shadow-sm transition-colors"
          style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-color)' }}
        >
          <form onSubmit={handleNavigate} className="flex-1">
            <div className="relative flex items-center group">
              <div className="absolute left-3 text-gray-400 group-focus-within:text-primary transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
              <input 
                type="text" 
                className="w-full text-xs pl-8 pr-3 py-1.5 rounded-full outline-none focus:ring-2 ring-primary/40 transition-all border border-transparent hover:border-gray-300 dark:hover:border-gray-600 focus:border-transparent"
                style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)' }}
                placeholder="输入目标网址并按回车加载..."
                value={currentInputUrl}
                onChange={(e) => {
                  const newUrl = e.target.value
                  setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, url: newUrl } : t))
                }}
              />
            </div>
          </form>
          
          <button 
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(currentInputUrl)
            }}
            className="w-7 h-7 rounded-full transition-all flex items-center justify-center text-gray-500 hover:text-primary hover:bg-black/5 dark:hover:bg-white/10"
            title="复制 URL"
          >
            <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          
          <div className="w-[1px] h-4 bg-gray-300 dark:bg-gray-700 mx-0.5"></div>
          
          <button 
            onClick={togglePickerMode}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-all flex items-center gap-1.5 border border-transparent ${
              isPickerMode 
                ? 'bg-primary text-white shadow-[0_2px_10px_rgba(59,130,246,0.4)]' 
                : 'bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-[var(--text-primary)] border-gray-200 dark:border-gray-700'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
            </svg>
            {isPickerMode ? '退出选择' : '选择元素'}
          </button>
        </div>
        <div className="flex-1 relative">
          <BrowserPlaceholder />
        </div>
      </div>

      {/* Middle Column: Params Panel */}
      <div className="w-[360px] shrink-0 h-full bg-darkPanel rounded-xl border border-gray-800 px-2 pt-3 pb-2 shadow-xl">
        <ParamsPanel />
      </div>

      {/* Right Column: Steps List */}
      <div className="w-[360px] shrink-0 h-full bg-darkPanel rounded-xl border border-gray-800 px-3 pt-4 pb-3 shadow-xl">
        <StepsList />
      </div>
    </div>
    </div>
  )
}
