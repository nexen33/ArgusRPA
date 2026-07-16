import React, { useState } from 'react'
import Sidebar from './components/Sidebar'
import TaskConfigurator from './components/TaskConfigurator'
import TaskList from './components/TaskList'
import LoginStatusBar from './components/LoginStatusBar'
import WindowControls from './components/WindowControls'

import NotificationPage from './components/NotificationPage'
import MonitorPanel from './components/MonitorPanel'
import SettingsPage from './components/SettingsPage'
import ErrorBoundary from './components/ErrorBoundary'
import { useTask } from './context/TaskContext'

function App() {
  const { resetTask } = useTask()
  const [activePage, setActivePage] = useState<'configurator' | 'tasks' | 'notifications' | 'monitor' | 'settings'>('configurator')
  const [globalError, setGlobalError] = useState<string | null>(null)

  React.useEffect(() => {
    // @ts-ignore
    if (!window.electronAPI) return
    
    // Load global theme
    // @ts-ignore
    window.electronAPI.getTheme().then(res => {
      if (res.success && res.data) {
        document.documentElement.className = res.data === 'dark' ? 'theme-dark dark' : 'theme-light'
      }
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

    const handleNavigate = (e: any) => {
      if (e.detail) setActivePage(e.detail)
    }
    window.addEventListener('navigate-to', handleNavigate)

    return () => {
      if (removeGlobalError) removeGlobalError()
      window.removeEventListener('navigate-to', handleNavigate)
    }
  }, [])

  React.useEffect(() => {
    let timer: any
    if (activePage !== 'configurator') {
      timer = setTimeout(() => {
        resetTask()
      }, 30000)
    }
    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [activePage])

  return (
    <div className="flex h-screen w-screen bg-transparent p-1.5">
      <div className="flex flex-1 overflow-hidden bg-darkBg rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.4)] border border-gray-800 relative">
        <div className="absolute top-0 left-0 right-32 h-[36px] z-[9999]" style={{ WebkitAppRegion: 'drag' } as any} />
        <WindowControls />
        <Sidebar activePage={activePage} onNavigate={setActivePage} />
        <div className="flex-1 flex flex-col relative overflow-hidden">
          <LoginStatusBar />
          <div key={activePage} className="flex-1 overflow-hidden flex flex-col animate-in fade-in zoom-in-[0.98] duration-300 fill-mode-both">
            <ErrorBoundary>
              {activePage === 'configurator' ? (
                <TaskConfigurator />
              ) : activePage === 'tasks' ? (
                <TaskList onNavigate={setActivePage} />
              ) : activePage === 'notifications' ? (
                <NotificationPage />
              ) : activePage === 'monitor' ? (
                <MonitorPanel />
              ) : (
                <SettingsPage />
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
