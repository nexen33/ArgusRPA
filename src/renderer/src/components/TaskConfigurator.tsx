import React from 'react'
import BrowserPlaceholder from './BrowserPlaceholder'
import StepsList from './StepsList'
import ParamsPanel from './ParamsPanel'
import { useTask } from '../context/TaskContext'
import { useModal } from '../context/ModalContext'
import ShortcutSettingsModal from './ShortcutSettingsModal'
import { Settings } from 'lucide-react'

import RunStatusBar from './RunStatusBar'

type Tab = { id: string, url: string, title: string }

export default function TaskConfigurator() {
  const { task, updateTask, isPickerMode, setIsPickerMode, addVisitedUrl } = useTask()
  const modal = useModal()

  const [tabs, setTabs] = React.useState<Tab[]>([
    { id: 'main', url: task.targetUrl || '', title: 'Main Tab' }
  ])
  const [activeTabId, setActiveTabId] = React.useState('main')
  const [loadError, setLoadError] = React.useState<string | null>(null)

  const defaultPanelsWidth = 762; // 375 + 375 + 12 (gap)
  const minPanelsWidth = 450;
  const [panelsWidth, setPanelsWidth] = React.useState<number>(defaultPanelsWidth);
  const isCollapsed = panelsWidth === minPanelsWidth;

  const [isShortcutModalOpen, setIsShortcutModalOpen] = React.useState(false);
  const [contextMenuPos, setContextMenuPos] = React.useState<{x: number, y: number} | null>(null);
  const [pickerShortcut, setPickerShortcut] = React.useState<string>('');
  const [pickConfirmShortcut, setPickConfirmShortcut] = React.useState<string>('');
  const [snapshotUri, setSnapshotUri] = React.useState<string | null>(null);
  const cachedSnapshotPromiseRef = React.useRef<Promise<string | null> | null>(null);

  const scrollRef = React.useRef<HTMLDivElement>(null);
  const shadowScrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    // @ts-ignore
    if (window.electronAPI) {
      // @ts-ignore
      window.electronAPI.getPickerShortcut().then((res: any) => {
        setPickerShortcut(res?.success ? res.data : (res || ''));
      });
      // @ts-ignore
      if (window.electronAPI.getPickConfirmShortcut) {
        // @ts-ignore
        window.electronAPI.getPickConfirmShortcut().then((res: any) => {
          setPickConfirmShortcut(res?.success ? res.data : (res || ''));
        });
      }
    }
  }, []);

  React.useEffect(() => {
    const handleGlobalClick = () => setContextMenuPos(null);
    if (contextMenuPos) {
      window.addEventListener('click', handleGlobalClick);
    }
    return () => window.removeEventListener('click', handleGlobalClick);
  }, [contextMenuPos]);

  // Hide native WebContentsView when modal is open to avoid Z-index overlaps
  React.useEffect(() => {
    const isOverlayOpen = !!contextMenuPos || isShortcutModalOpen;
    // @ts-ignore
    if (window.electronAPI?.setModalOpen) {
      if (isOverlayOpen) {
        if (cachedSnapshotPromiseRef.current) {
          cachedSnapshotPromiseRef.current.then(uri => {
            if (uri) setSnapshotUri(uri);
            // @ts-ignore
            window.electronAPI.setModalOpen(true);
          });
        } else {
          // @ts-ignore
          if (window.electronAPI.captureActiveView) {
            // @ts-ignore
            window.electronAPI.captureActiveView().then(uri => {
              if (uri) setSnapshotUri(uri);
              // @ts-ignore
              window.electronAPI.setModalOpen(true);
            });
          } else {
            // @ts-ignore
            window.electronAPI.setModalOpen(true);
          }
        }
      } else {
        // @ts-ignore
        window.electronAPI.setModalOpen(false);
        setSnapshotUri(null);
        cachedSnapshotPromiseRef.current = null;
      }
    }
  }, [contextMenuPos, isShortcutModalOpen]);

  React.useEffect(() => {
    const main = scrollRef.current;
    const shadow = shadowScrollRef.current;
    if (!main || !shadow) return;
    const onScroll = () => {
      shadow.scrollLeft = main.scrollLeft;
    };
    main.addEventListener('scroll', onScroll, { passive: true });
    return () => main.removeEventListener('scroll', onScroll);
  }, []);

  const togglePanelsWidth = () => {
    setPanelsWidth(isCollapsed ? defaultPanelsWidth : minPanelsWidth);
  };

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

    const onNavigationStarted = (data: { tabId: string, url: string }) => {
      setLoadError(null)
    }

    const onLoadFailed = (data: { tabId: string, url: string, errorDescription: string }) => {
      setLoadError(`网页加载失败 或 可能已为空 (${data.errorDescription})`)
    }

    // @ts-ignore
    const removeNewTab = window.electronAPI.onNewBrowserTab(onNewTab)
    // @ts-ignore
    const removeNavigated = window.electronAPI.onBrowserNavigated(onNavigated)
    // @ts-ignore
    const removeTitleUpdated = window.electronAPI.onBrowserTitleUpdated(onTitleUpdated)
    // @ts-ignore
    const removeNavigationStarted = window.electronAPI.onBrowserNavigationStarted ? window.electronAPI.onBrowserNavigationStarted(onNavigationStarted) : undefined
    // @ts-ignore
    const removeLoadFailed = window.electronAPI.onBrowserLoadFailed ? window.electronAPI.onBrowserLoadFailed(onLoadFailed) : undefined

    // 监听主进程的快捷键触发选择器模式
    const handleToggleFromMain = () => {
      window.dispatchEvent(new CustomEvent('toggle-picker-mode'))
    }
    // @ts-ignore
    const removeToggleFromMain = window.electronAPI.onTogglePickerModeFromMain && window.electronAPI.onTogglePickerModeFromMain(handleToggleFromMain)

    return () => {
      if (removeNewTab) removeNewTab()
      if (removeNavigated) removeNavigated()
      if (removeTitleUpdated) removeTitleUpdated()
      if (removeNavigationStarted) removeNavigationStarted()
      if (removeLoadFailed) removeLoadFailed()
      if (removeToggleFromMain) removeToggleFromMain()
    }
  }, [])

  React.useEffect(() => {
    // @ts-ignore
    if (window.electronAPI && task.id) {
      // @ts-ignore
      window.electronAPI.setActiveTask(task.id)
    }
    
    // Reset tabs when switching to a new task to clear old titles
    setTabs([{ id: 'main', url: task.targetUrl || '', title: 'Main Tab' }])
    setActiveTabId('main')

    // @ts-ignore
    const removeValidationListener = window.electronAPI?.onValidationRecorded?.((data: any) => {
      if (data.taskId === task.id) {
        const stepIndex = (task.steps || []).findIndex(s => s.id === data.stepId);
        if (stepIndex >= 0) {
          modal.toast(`第 ${stepIndex + 1} 步 网络请求补录成功，重新测试可获得更稳定结果`);
          const newSteps = (task.steps || []).map(s => {
            if (s.id === data.stepId) {
              return { ...s, validationConfig: { enabled: true, expectedUrlPattern: data.pattern, recordedMethod: data.recordedMethod || 'GET' }};
            }
            return s;
          });
          updateTask({ steps: newSteps });
        }
      }
    });

    return () => {
      // @ts-ignore
      if (window.electronAPI) window.electronAPI.setActiveTask(null)
      if (removeValidationListener) removeValidationListener();
    }
  }, [task.id, task.steps])

  React.useEffect(() => {
    const handleToggle = () => {
      const next = !isPickerMode;
      setIsPickerMode(next);
      // @ts-ignore
      if (window.electronAPI) window.electronAPI.setPickerMode(next, pickConfirmShortcut);
    };

    // Listen to custom DOM event (from button click)
    window.addEventListener('toggle-picker-mode', handleToggle as EventListener);
    
    // Listen to IPC event (from global shortcut in main process)
    let removeIpcListener: (() => void) | undefined;
    // @ts-ignore
    if (window.electronAPI?.onTogglePickerModeFromMain) {
      // @ts-ignore
      removeIpcListener = window.electronAPI.onTogglePickerModeFromMain(() => {
        handleToggle();
      });
    }

    return () => {
      window.removeEventListener('toggle-picker-mode', handleToggle as EventListener);
      if (removeIpcListener) removeIpcListener();
    };
  }, [isPickerMode, setIsPickerMode, pickConfirmShortcut]);
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
    window.electronAPI.setPickerMode(newState, pickConfirmShortcut)
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="px-3 pt-3 flex flex-col gap-2">
        <RunStatusBar />
      </div>
      
      <div className="flex-1 flex p-3 gap-2 min-h-0">
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
            onMouseEnter={() => {
              // Pre-capture screenshot on hover to eliminate right-click lag
              // @ts-ignore
              if (window.electronAPI?.captureActiveView && !cachedSnapshotPromiseRef.current) {
                // @ts-ignore
                cachedSnapshotPromiseRef.current = window.electronAPI.captureActiveView();
              }
            }}
            onMouseLeave={() => {
              // Only clear cache if menu isn't open
              if (!contextMenuPos && !isShortcutModalOpen) {
                cachedSnapshotPromiseRef.current = null;
              }
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              setContextMenuPos({ x: e.clientX, y: e.clientY });
            }}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-all flex items-center gap-1.5 border border-transparent ${
              isPickerMode 
                ? 'bg-primary text-white shadow-[0_2px_10px_rgba(59,130,246,0.4)]' 
                : 'bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-[var(--text-primary)] border-gray-200 dark:border-gray-700'
            }`}
            title={`右键设置快捷键 (${pickerShortcut})`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
            </svg>
            {isPickerMode ? '退出选择' : '选择元素'}
          </button>
        </div>
        <div className="flex-1 relative">
          {loadError && (
            <div className="absolute top-0 left-0 right-0 z-40 bg-red-500/10 border-b border-red-500/20 px-4 py-2 flex items-center justify-center backdrop-blur-sm shadow-sm animate-in slide-in-from-top-2">
              <div className="flex items-center gap-2 text-red-500 dark:text-red-400 text-xs font-medium">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="truncate">{loadError}</span>
                <button 
                  onClick={() => setLoadError(null)} 
                  className="ml-2 hover:bg-red-500/20 rounded p-0.5 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
          <BrowserPlaceholder />
          {snapshotUri && (
            <div 
              className="absolute inset-0 z-[10] bg-cover bg-no-repeat pointer-events-none"
              style={{ 
                backgroundImage: `url(${snapshotUri})`,
                backgroundPosition: 'left top',
                animation: 'blurFadeIn 0.15s ease-out forwards'
              }}
            />
          )}
        </div>
      </div>
      
      {/* Context Menu for Picker Shortcut */}
      {contextMenuPos && (
        <div 
          className="fixed z-[9999] bg-darkPanel border border-gray-700 rounded-md shadow-xl overflow-hidden py-0.5 min-w-[100px]"
          style={{ left: contextMenuPos.x, top: contextMenuPos.y }}
        >
          <button 
            onClick={() => {
              setContextMenuPos(null);
              setIsShortcutModalOpen(true);
            }}
            className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-white/5 transition-colors flex items-center gap-1.5"
          >
            <Settings size={12} className="text-gray-400" /> 快捷键设置
          </button>
        </div>
      )}

      {/* Shortcut Settings Modal */}
      <ShortcutSettingsModal 
        isOpen={isShortcutModalOpen} 
        onClose={() => setIsShortcutModalOpen(false)} 
        initialToggleShortcut={pickerShortcut}
        initialConfirmShortcut={pickConfirmShortcut}
        onSave={(newToggle, newConfirm) => {
          setPickerShortcut(newToggle);
          setPickConfirmShortcut(newConfirm);
          // @ts-ignore
          if (window.electronAPI) {
            // @ts-ignore
            window.electronAPI.setPickerShortcut(newToggle);
            // @ts-ignore
            window.electronAPI.setPickConfirmShortcut(newConfirm);
          }
        }}
      />

      {/* Dragger Handle */}
      <div 
        className="w-0 flex flex-col items-center justify-center shrink-0 z-10 relative"
      >
        <div 
          className="absolute w-4 h-full cursor-pointer flex items-center justify-center group"
          onClick={togglePanelsWidth}
          title={isCollapsed ? "展开面板恢复" : "收缩面板腾出浏览器空间"}
        >
          <div className="w-[4px] group-hover:w-[16px] h-12 group-hover:h-16 bg-gray-400 dark:bg-primary rounded-full opacity-60 group-hover:opacity-100 transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] flex items-center justify-center overflow-hidden dark:shadow-[0_0_6px_rgba(59,130,246,0.5)]">
             <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white flex items-center justify-center">
                {isCollapsed ? (
                  <svg className="w-3 h-3 translate-x-[-0.5px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
                ) : (
                  <svg className="w-3 h-3 translate-x-[1px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                )}
             </div>
          </div>
        </div>
      </div>

      {/* Middle & Right Column Wrapper */}
      <div 
        className="relative shrink-0 h-full transition-all"
        style={{ width: `${panelsWidth}px` }}
      >
        {/* SHADOW LAYER (Absolute, behind main, taller and wider to prevent shadow clipping) */}
        <div 
          ref={shadowScrollRef}
          className="absolute top-0 overflow-hidden pointer-events-none z-0"
          style={{ 
            left: '-30px',
            right: '-30px',
            paddingLeft: '30px',
            paddingRight: '30px',
            bottom: '-30px', 
            paddingBottom: '30px',
            WebkitMaskImage: panelsWidth < 762 
              ? 'linear-gradient(to right, black 0%, black calc(100% - 54px), transparent calc(100% - 30px), transparent 100%)' 
              : 'none'
          }}
        >
          <div className="flex gap-3 h-full w-max">
            {/* Fake panels just to cast independent shadows */}
            <div className="w-[375px] shrink-0 h-full rounded-xl shadow-xl bg-transparent"></div>
            <div className="w-[375px] shrink-0 h-full rounded-xl shadow-xl bg-transparent"></div>
          </div>
        </div>

        {/* MAIN FOREGROUND LAYER (Scrolling, perfect rounded corners, no shadows) */}
        <div 
          ref={scrollRef}
          className="relative flex gap-3 h-full w-full overflow-x-auto thin-scrollbar overflow-y-hidden rounded-xl transform-gpu will-change-scroll z-10"
        >
          {/* Middle Column: Params Panel */}
          <div className="w-[375px] shrink-0 h-full bg-darkPanel rounded-xl border border-gray-800 px-2 pt-3 pb-2 transform-gpu">
            <ParamsPanel />
          </div>

          {/* Right Column: Steps List */}
          <div className="w-[375px] shrink-0 h-full bg-darkPanel rounded-xl border border-gray-800 px-3 pt-4 pb-3 transform-gpu">
            <StepsList />
          </div>
        </div>

        {/* Collapsed State Right Edge Glow Indicator (Pure Contoured Aura) */}
        <div 
          className={`absolute pointer-events-none transition-opacity duration-700 z-20 ${
            isCollapsed ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            top: '-30px', bottom: '-30px', left: '-30px', right: '-30px',
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, transparent calc(100% - 58px), black calc(100% - 42px), black 100%)'
          }}
        >
          <div 
            className="absolute rounded-xl animate-pulse"
            style={{
              top: '30px', bottom: '31px', left: '30px', right: '30px',
              animationDuration: '3s',
              boxShadow: '0 0 20px 4px rgba(59,130,246,0.35), 0 0 8px 1px rgba(59,130,246,0.5)'
            }}
          />
        </div>
      </div>
    </div>
    </div>
  )
}
