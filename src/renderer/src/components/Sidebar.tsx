import React from 'react'
import { LayoutDashboard, ListTodo, Activity, Settings, Plus, Bell } from 'lucide-react'
import { useTask } from '../context/TaskContext'

interface SidebarProps {
  activePage: 'create_gateway' | 'configurator' | 'configurator_desktop' | 'tasks' | 'notifications' | 'monitor' | 'settings';
  onNavigate: (page: 'create_gateway' | 'configurator' | 'configurator_desktop' | 'tasks' | 'notifications' | 'monitor' | 'settings') => void;
}

export default function Sidebar({ activePage, onNavigate }: SidebarProps) {
  const { resetTask } = useTask()
  const [logoError, setLogoError] = React.useState(false)
  const [logoLoaded, setLogoLoaded] = React.useState(false)

  const handleNewTask = () => {
    resetTask()
    onNavigate('create_gateway')
  }

  return (
    <div className="w-[60px] shrink-0 bg-darkPanel border-r border-gray-800 flex flex-col items-center pt-10 pb-6 gap-8 shadow-xl z-20 relative">
      {logoError ? (
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center font-bold text-lg shadow-lg text-white">A</div>
      ) : (
        <div className="w-10 h-10 flex items-center justify-center relative">
          {/* Logo with fade-in and glow effect */}
          <img 
            src="./logo.png" 
            draggable={false}
            onLoad={() => setLogoLoaded(true)}
            onError={() => setLogoError(true)} 
            className={`w-9 h-9 object-contain drop-shadow-md select-none pointer-events-none transition-all duration-1000 ease-out ${
              logoLoaded 
                ? 'opacity-100 blur-0 scale-100 drop-shadow-[0_0_12px_rgba(255,255,255,0.4)] brightness-110' 
                : 'opacity-0 blur-sm scale-75'
            }`} 
            style={{ imageRendering: 'high-quality' as any }} 
            alt="Logo" 
          />
        </div>
      )}
      
      <div className="flex flex-col gap-6 text-gray-400 w-full px-2">
        <button 
          onClick={handleNewTask}
          className="p-2 w-full flex justify-center text-primary hover:bg-primary/20 rounded-lg transition-colors"
          title="新建任务"
        >
          <Plus size={24} />
        </button>

        <button 
          onClick={() => onNavigate('current_configurator' as any)}
          className={`p-2 w-full flex justify-center rounded-lg transition-colors ${['configurator', 'configurator_desktop', 'create_gateway'].includes(activePage) ? 'text-primary bg-gray-800' : 'hover:text-gray-200 hover:bg-gray-800/50'}`}
          title="任务配置器"
        >
          <LayoutDashboard size={24} />
        </button>

        <button 
          onClick={() => onNavigate('tasks')}
          className={`p-2 w-full flex justify-center rounded-lg transition-colors ${activePage === 'tasks' ? 'text-primary bg-gray-800' : 'hover:text-gray-200 hover:bg-gray-800/50'}`}
          title="已有任务"
        >
          <ListTodo size={24} />
        </button>

        <button 
          onClick={() => onNavigate('monitor')}
          className={`p-2 w-full flex justify-center rounded-lg transition-colors ${activePage === 'monitor' ? 'text-primary bg-gray-800' : 'hover:text-gray-200 hover:bg-gray-800/50'}`}
          title="运行监控"
        >
          <Activity size={24} />
        </button>

        <button 
          onClick={() => onNavigate('notifications')}
          className={`p-2 w-full flex justify-center rounded-lg transition-colors ${activePage === 'notifications' ? 'text-primary bg-gray-800' : 'hover:text-gray-200 hover:bg-gray-800/50'}`}
          title="通知与远程控制配置"
        >
          <Bell size={24} />
        </button>
      </div>

      <div className="mt-auto w-full px-2">
        <button 
          onClick={() => onNavigate('settings')}
          className={`p-2 w-full flex justify-center rounded-lg transition-colors ${activePage === 'settings' ? 'text-primary bg-gray-800' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'}`}
          title="通用设置"
        >
          <Settings size={24} />
        </button>
      </div>
    </div>
  )
}
