import React, { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import TaskConfigurator from './components/TaskConfigurator'
import DesktopTaskConfigurator from './components/DesktopTaskConfigurator'
import CreateTaskGateway from './components/CreateTaskGateway'
import TaskList from './components/TaskList'
import LoginStatusBar from './components/LoginStatusBar'
import WindowControls from './components/WindowControls'

import NotificationPage from './components/NotificationPage'
import MonitorPanel from './components/MonitorPanel'
import SettingsPage from './components/SettingsPage'
import ErrorBoundary from './components/ErrorBoundary'
import { useTask } from './context/TaskContext'
import ActivationPage from './components/ActivationPage'
// @ts-ignore
import DesktopWidget from './components/DesktopWidget'

function App() {
  const { resetTask, task, updateTask } = useTask()
  const [activePage, setActivePage] = useState<'create_gateway' | 'configurator' | 'configurator_desktop' | 'tasks' | 'notifications' | 'monitor' | 'settings'>('create_gateway')
  const [lastConfigurator, setLastConfigurator] = useState<'configurator' | 'configurator_desktop' | 'create_gateway'>('create_gateway')
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [mountedPages, setMountedPages] = useState<Set<string>>(new Set(['create_gateway']))
  const [isAppReady, setIsAppReady] = useState(false)
  const [preMinimizedPage, setPreMinimizedPage] = useState<string | null>(null)
  const [isApiModalOpen, setIsApiModalOpen] = useState(false)

  const activePageRef = React.useRef(activePage)
  React.useEffect(() => {
    activePageRef.current = activePage
  }, [activePage])

  const lastConfiguratorRef = React.useRef(lastConfigurator)
  React.useEffect(() => {
    lastConfiguratorRef.current = lastConfigurator
  }, [lastConfigurator])

  const taskRef = React.useRef(task)
  React.useEffect(() => {
    taskRef.current = task
  }, [task])

  React.useEffect(() => {
    setMountedPages(prev => new Set(prev).add(activePage))
    if (activePage === 'configurator_desktop') {
      document.body.classList.add('theme-desktop')
    } else if (activePage !== 'tasks') {
      document.body.classList.remove('theme-desktop')
    }
  }, [activePage])

  const handleSetPage = (page: any) => {
    let targetPage = page;
    if (page === 'current_configurator') {
      targetPage = lastConfigurator;
    }
    setActivePage(targetPage);
    if (targetPage === 'configurator' || targetPage === 'configurator_desktop' || targetPage === 'create_gateway') {
      setLastConfigurator(targetPage);
    }
    
    if (targetPage === 'configurator') {
      updateTask({ taskType: 'web' });
    } else if (targetPage === 'configurator_desktop') {
      updateTask({ taskType: 'desktop' });
    }
  }

  React.useEffect(() => {
    // @ts-ignore
    if (!window.electronAPI) return

    // Load global theme
    // @ts-ignore
    window.electronAPI.getTheme().then(res => {
      if (res.success && res.data) {
        document.documentElement.className = res.data === 'dark' ? 'theme-dark dark' : 'theme-light'
      }
    }).finally(() => {
      // 短暂延迟确保 CSS 变量被 DOM 树完全吸收
      requestAnimationFrame(() => setIsAppReady(true))
    })

    if (!localStorage.getItem('argus_v1_2_0_changelog_seen')) {
      setActivePage('settings')
      localStorage.setItem('argus_v1_2_0_changelog_seen', 'true')
    }
    // @ts-ignore
    const removeGlobalError = window.electronAPI.onGlobalError((err: string) => {
      setGlobalError('⚠️ 后台发生错误，详见日志: ' + err)
      setTimeout(() => setGlobalError(null), 5000)
    })

    const handleNavigateEvent = (e: any) => {
      if (e.detail) handleSetPage(e.detail)
    }
    window.addEventListener('navigate-to', handleNavigateEvent)

    // @ts-ignore
    const removeHidden = window.electronAPI.onWindowHidden && window.electronAPI.onWindowHidden(() => {
      const current = activePageRef.current;
      // Phase 40.8: 仅当在路由主页时才切走节约 GPU，保护配置器等长周期页面的现场
      if (current === 'create_gateway') {
        setPreMinimizedPage(current);
        handleSetPage('settings');
      }
    });

    // @ts-ignore
    const removeRestored = window.electronAPI.onWindowRestored && window.electronAPI.onWindowRestored(() => {
      setPreMinimizedPage(prev => {
        // Phase 40.8: 只有记忆的是路由页才强制还原，其他保持原样
        if (prev === 'create_gateway') {
           handleSetPage('create_gateway');
        }
        return null;
      });
    });

    const handleApiModalVisible = (e: any) => {
      setIsApiModalOpen(!!e.detail)
    }
    window.addEventListener('api-modal-visible', handleApiModalVisible)

    return () => {
      if (removeGlobalError) removeGlobalError()
      window.removeEventListener('navigate-to', handleNavigateEvent)
      window.removeEventListener('api-modal-visible', handleApiModalVisible)
      if (removeHidden) removeHidden()
      if (removeRestored) removeRestored()
    }
  }, [])

  useEffect(() => {
    let timer: any
    if (activePage !== 'configurator' && activePage !== 'configurator_desktop' && activePage !== 'create_gateway') {
      timer = setTimeout(async () => {
        const currentTask = taskRef.current;
        const isDesktop = lastConfigurator === 'configurator_desktop';
        const isWeb = lastConfigurator === 'configurator';

        let shouldSave = false;
        if (isDesktop && currentTask.name) {
          currentTask.taskType = 'desktop';
          shouldSave = true;
        }
        if (isWeb && currentTask.name && currentTask.targetUrl) {
          currentTask.taskType = 'web';
          shouldSave = true;
        }

        if (shouldSave) {
          // @ts-ignore
          if (window.electronAPI && window.electronAPI.saveTask) {
            // @ts-ignore
            await window.electronAPI.saveTask(currentTask);
          }
        }

        resetTask()
        setLastConfigurator('create_gateway')
      }, 30000)
    }
    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [activePage, lastConfigurator])

  if (window.location.hash === '#/activation') {
    return <ActivationPage />
  }
  if (window.location.hash === '#/desktop-widget') {
    return <DesktopWidget />
  }

  if (!isAppReady) {
    // 启动占位符改为完全透明，配合主窗口的透明属性，隐藏突兀的黑色色块
    return <div className="flex h-screen w-screen bg-transparent p-1.5">
      <div className="flex flex-1 bg-transparent rounded-xl" />
    </div>
  }

  return (
    <div className="flex h-screen w-screen bg-transparent p-1.5">
      {/* 增加全局淡入动画 (animate-in fade-in)，提供更流畅、高级的启动视觉体验 */}
      <div className="flex flex-1 overflow-hidden bg-darkBg rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.4)] border border-gray-800 relative animate-in fade-in duration-300 fill-mode-both">
        <div className="absolute top-0 left-0 right-32 h-[36px] z-[9999]" style={{ WebkitAppRegion: 'drag' } as any} />
        <WindowControls />
        <Sidebar activePage={activePage} onNavigate={handleSetPage} />
        <div className="flex-1 flex flex-col relative overflow-hidden">
          <LoginStatusBar />
          <div className="flex-1 overflow-hidden flex flex-col relative bg-transparent">
            <ErrorBoundary>
              {activePage === 'create_gateway' && (
                <div className="flex-1 h-full flex flex-col animate-in fade-in zoom-in-[0.98] duration-300 fill-mode-both">
                  <CreateTaskGateway onSelectEnvironment={(env) => handleSetPage(env === 'web' ? 'configurator' : 'configurator_desktop')} />
                </div>
              )}
              {mountedPages.has('configurator') && (
                <div className={activePage === 'configurator' ? 'flex-1 h-full flex flex-col animate-in fade-in zoom-in-[0.98] duration-300 fill-mode-both' : 'hidden'}>
                  <TaskConfigurator />
                </div>
              )}
              {mountedPages.has('configurator_desktop') && (
                <div className={activePage === 'configurator_desktop' ? 'flex-1 h-full flex flex-col animate-in fade-in zoom-in-[0.98] duration-300 fill-mode-both' : 'hidden'}>
                  <DesktopTaskConfigurator onBack={() => handleSetPage('create_gateway')} />
                </div>
              )}

              {/* Dynamic Pages (Destroyed on unmount to save memory) */}
              {!['create_gateway', 'configurator', 'configurator_desktop'].includes(activePage) && (
                <div className="flex-1 h-full flex flex-col animate-in fade-in zoom-in-[0.98] duration-300 fill-mode-both">
                  {activePage === 'tasks' && <TaskList onNavigate={handleSetPage} />}
                  {activePage === 'notifications' && <NotificationPage />}
                  {activePage === 'monitor' && <MonitorPanel />}
                  {activePage === 'settings' && <SettingsPage />}
                </div>
              )}
            </ErrorBoundary>
          </div>
        </div>

        {globalError && (
          <div className="absolute bottom-6 right-6 bg-red-600 text-white px-4 py-3 rounded-lg shadow-2xl z-50 font-bold max-w-sm border border-red-500 animate-in slide-in-from-bottom-5">
            {globalError}
          </div>
        )}


      </div>
    </div>
  )
}

export default App
