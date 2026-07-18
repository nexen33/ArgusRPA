import React, { useEffect, useState } from 'react'
import { Settings, Trash2, Github, FileText, CheckCircle2, FolderPen, Activity } from 'lucide-react'
import { useModal } from '../context/ModalContext'
import { useTask } from '../context/TaskContext'
import EnvDiagnosisModal from './EnvDiagnosisModal'

export default function SettingsPage() {
  const modal = useModal()
  const { loadTask } = useTask()

  const [autoLaunch, setAutoLaunch] = useState(false)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [headlessMode, setHeadlessMode] = useState(true)
  const [hardwareAcceleration, setHardwareAcceleration] = useState(true)
  const [changelog, setChangelog] = useState('加载中...')
  const [version, setVersion] = useState('v1.3.5')
  const [loading, setLoading] = useState(true)
  const [argusIssuePath, setArgusIssuePath] = useState('')
  const [hasOtherDrives, setHasOtherDrives] = useState(false)
  const [isEnvModalOpen, setIsEnvModalOpen] = useState(false)
  const [licenseInfo, setLicenseInfo] = useState<any>(null)

  useEffect(() => {
    // Load initial settings
    const loadSettings = async () => {
      const api = (window as any).electronAPI
      if (api) {
        const [alRes, themeRes, hlRes, hwRes, clRes, vRes, pathRes, drivesRes, licRes] = await Promise.all([
          api.getAutoLaunch(),
          api.getTheme(),
          api.getHeadlessMode(),
          api.toggleHardwareAcceleration ? api.getHardwareAcceleration() : Promise.resolve({success:false}),
          api.readChangelog(),
          api.getVersion(),
          api.getArgusIssuePath ? api.getArgusIssuePath() : Promise.resolve(null),
          api.getHasOtherDrives ? api.getHasOtherDrives() : Promise.resolve(null),
          api.getLicenseInfo ? api.getLicenseInfo() : Promise.resolve(null)
        ])

        if (alRes?.success) setAutoLaunch(alRes.data)
        if (themeRes?.success) setTheme(themeRes.data)
        if (hlRes?.success) setHeadlessMode(hlRes.data)
        if (hwRes?.success) setHardwareAcceleration(hwRes.data)
        if (clRes?.success) setChangelog(clRes.data)
        if (vRes?.success) setVersion(vRes.data)
        if (pathRes?.success) setArgusIssuePath(pathRes.data)
        if (drivesRes?.success) setHasOtherDrives(drivesRes.data)
        if (licRes) setLicenseInfo(licRes)
      }
      setLoading(false)
    }
    loadSettings()
  }, [])

  const handleToggleAutoLaunch = async () => {
    const next = !autoLaunch
    setAutoLaunch(next)
    // @ts-ignore
    await window.electronAPI.setAutoLaunch(next)
  }

  const handleChangeTheme = async (t: 'dark' | 'light') => {
    setTheme(t)
    // @ts-ignore
    await window.electronAPI.setTheme(t)
    document.documentElement.className = t === 'dark' ? 'theme-dark dark' : 'theme-light'
  }

  const handleToggleHeadless = async () => {
    const next = !headlessMode
    setHeadlessMode(next)
    // @ts-ignore
    await window.electronAPI.setHeadlessMode(next)
  }

  const handleToggleHardwareAcceleration = async () => {
    const next = !hardwareAcceleration
    setHardwareAcceleration(next)
    // @ts-ignore
    await window.electronAPI.toggleHardwareAcceleration(next)
    modal.toast('硬件加速设置已更新，将在下次启动时生效')
  }

  const handleResetData = async () => {
    const ok = await modal.confirm({ title: '确认重置？', message: '所有任务和通知配置将被永久删除，此操作无法撤销。' })
    if (!ok) return

    // @ts-ignore
    const res = await window.electronAPI.resetAppData()
    if (res.success) {
      loadTask(null as any) // clear active task
      // Trigger a custom event to notify Sidebar / TaskList to refresh if needed
      window.dispatchEvent(new CustomEvent('app-data-reset'))
      alert('重置成功')
    }
  }

  const handleChangePath = async () => {
    // @ts-ignore
    const dirRes = await window.electronAPI.selectDirectory?.()
    if (dirRes?.success && dirRes.data) {
      // @ts-ignore
      const setRes = await window.electronAPI.setArgusIssueBasePath(dirRes.data)
      if (setRes?.success) {
        setArgusIssuePath(setRes.data)
        modal.toast('默认存储路径已更新')
      }
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden" style={{ backgroundColor: 'var(--bg-main)' }}>
      <style>{`
        @keyframes fadeInUpCard {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up-card {
          animation: fadeInUpCard 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
          opacity: 0;
        }
      `}</style>
      <div className="pr-3 pt-6 pb-4 shrink-0 flex items-center justify-between" style={{ paddingLeft: '32px', WebkitAppRegion: 'drag' } as any}>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Settings style={{ color: 'var(--accent)' }} />
            通用设置
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>全局系统参数与外观偏好</p>
        </div>
        <div style={{ WebkitAppRegion: 'no-drag' } as any}>
          <button
            onClick={() => setIsEnvModalOpen(true)}
            className="flex items-center gap-1 px-4 py-2 rounded-xl font-bold text-sm transition-colors border"
            style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
          >
            <Activity size={14} />
            环境诊断
          </button>
        </div>
      </div>

      <EnvDiagnosisModal isOpen={isEnvModalOpen} onClose={() => setIsEnvModalOpen(false)} />

      {loading ? (
        <div className="flex-1 px-3 pb-6 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin opacity-50"></div>
        </div>
      ) : (
        <div className="flex-1 px-3 pb-6 overflow-hidden flex flex-col">
          <div className="grid grid-cols-2 gap-4 flex-1 min-h-0 h-full" style={{ gridTemplateRows: '124px 124px 124px minmax(0, 1fr)' }}>

            {/* Row 1, Col 1: Auto Launch */}
            <div style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)', animationDelay: '0ms' }} className="border rounded-xl p-6 flex items-center justify-between shadow-sm h-full animate-fade-in-up-card">
              <div>
                <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>🚀 开机自动启动</h2>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>系统启动时自动后台运行，保持调度引擎在线</p>
              </div>
              <button
                onClick={handleToggleAutoLaunch}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${autoLaunch ? 'bg-blue-600' : 'bg-gray-600'}`}
                style={{ backgroundColor: autoLaunch ? 'var(--accent)' : 'var(--border)' }}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autoLaunch ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            {/* Row 1, Col 2: Theme */}
            <div style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)', animationDelay: '50ms' }} className="border rounded-xl p-6 shadow-sm h-full flex flex-col justify-center animate-fade-in-up-card">
              <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--text-primary)' }}>🎨 外观偏好</h2>
              <div className="flex gap-4">
                <button
                  onClick={() => handleChangeTheme('dark')}
                  style={{
                    borderColor: theme === 'dark' ? 'var(--accent)' : 'var(--border)',
                    backgroundColor: theme === 'dark' ? 'var(--accent-subtle)' : 'var(--bg-elevated)',
                    borderWidth: theme === 'dark' ? '2px' : '1px'
                  }}
                  className="flex-1 py-2 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                >
                  <span style={{ color: 'var(--text-primary)' }}>☾ 暗黑模式</span>
                  {theme === 'dark' && <CheckCircle2 size={16} style={{ color: 'var(--accent)' }} />}
                </button>
                <button
                  onClick={() => handleChangeTheme('light')}
                  style={{
                    borderColor: theme === 'light' ? 'var(--accent)' : 'var(--border)',
                    backgroundColor: theme === 'light' ? 'var(--accent-subtle)' : 'var(--bg-elevated)',
                    borderWidth: theme === 'light' ? '2px' : '1px'
                  }}
                  className="flex-1 py-2 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                >
                  <span style={{ color: 'var(--text-primary)' }}>☀ 浅色模式</span>
                  {theme === 'light' && <CheckCircle2 size={16} style={{ color: 'var(--accent)' }} />}
                </button>
              </div>
            </div>

            {/* Row 2, Col 1: Headless Mode */}
            <div style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)', animationDelay: '100ms' }} className="border rounded-xl px-6 py-4 flex flex-col justify-center shadow-sm h-full animate-fade-in-up-card">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>🖥 无头模式</h2>
                  <p className="text-sm mt-1 leading-tight" style={{ color: 'var(--text-muted)' }}>关闭时显示浏览器窗口，用于可视化调试</p>
                </div>
                <button
                  onClick={handleToggleHeadless}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
                  style={{ backgroundColor: headlessMode ? 'var(--accent)' : 'var(--border)' }}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${headlessMode ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              <div className={`transition-all duration-300 overflow-hidden ${headlessMode ? 'max-h-0 opacity-0 mt-0' : 'max-h-[36px] opacity-100 mt-2'}`}>
                <div
                  className="px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 border"
                  style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--warning)', borderColor: 'var(--border)' }}
                >
                  ⚠ 调试模式已开启：浏览器窗口将保持可见
                </div>
              </div>
            </div>

            {/* Row 2, Col 2: Hardware Acceleration */}
            <div style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)', animationDelay: '150ms' }} className="border rounded-xl p-6 flex items-center justify-between shadow-sm h-full animate-fade-in-up-card">
              <div>
                <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>⚡ 硬件加速</h2>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>使用 GPU 硬件加速渲染，若界面卡顿或崩溃请关闭此项</p>
              </div>
              <button
                onClick={handleToggleHardwareAcceleration}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
                style={{ backgroundColor: hardwareAcceleration ? 'var(--accent)' : 'var(--border)' }}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${hardwareAcceleration ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            {/* Row 3: Global Path */}
            <div style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)', animationDelay: '200ms' }} className="border rounded-xl p-6 flex items-center justify-between shadow-sm h-full overflow-hidden animate-fade-in-up-card">
              <div className="min-w-0 flex-1 mr-4">
                <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>📂 默认存储路径</h2>
                <p className="text-sm mt-1 font-mono truncate" style={{ color: 'var(--text-muted)' }} title={argusIssuePath}>当前: {argusIssuePath}</p>
                <p className="text-sm mt-1 truncate" style={{ color: 'var(--text-muted)' }} title="更改路径后，将在此目录下帮您强制创建Argus_issue及其附属文件夹">更改路径后，将在此目录下帮您强制创建Argus_issue及其附属文件夹</p>
              </div>
              <button
                onClick={handleChangePath}
                className="px-4 py-2 rounded-xl font-bold text-sm transition-opacity hover:opacity-80 flex items-center gap-1 shrink-0"
                style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
              >
                <FolderPen size={16} />
                更改路径
              </button>
            </div>

            {/* Row 3 (or 4): Reset App Data */}
            <div style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)', animationDelay: '250ms' }} className="border rounded-xl p-6 flex items-center justify-between shadow-sm h-full animate-fade-in-up-card">
              <div>
                <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>🗑 重置应用数据</h2>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>清除所有任务配置与通知模板</p>
              </div>
              <button
                onClick={handleResetData}
                style={{ backgroundColor: 'var(--danger)', color: 'white' }}
                className="px-4 py-2 rounded-xl font-bold text-sm transition-opacity hover:opacity-80 flex items-center gap-1 shrink-0"
              >
                重置数据 →
              </button>
            </div>

            {/* Last Row: About */}
            <div style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)', animationDelay: '300ms' }} className="border rounded-xl p-6 flex flex-col shadow-sm h-full min-h-0 relative animate-fade-in-up-card">
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-3xl tracking-normal drop-shadow-sm leading-none" style={{ color: 'var(--text-primary)', fontFamily: '"Pacifico", cursive' }}>Argus</h2>
                <div className="group relative flex items-center translate-y-[2px]">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border tracking-wide cursor-default ${
                    licenseInfo?.isTrial
                      ? 'bg-red-500/10 text-red-500 border-red-500/30 border-dashed'
                      : licenseInfo?.isPro
                        ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                        : 'bg-gray-500/20 text-gray-400 border-gray-600/30'
                    }`}>
                    {licenseInfo?.isTrial ? (licenseInfo.trialType === 'MONAT' ? 'MONAT' : 'TRIAL') : licenseInfo?.isPro ? 'PRO' : 'FREE'}
                  </span>
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                    <div
                      className="border shadow-xl rounded-lg px-3 py-1.5 text-xs whitespace-nowrap font-medium"
                      style={{
                        backgroundColor: 'var(--bg-elevated)',
                        borderColor: 'var(--border)',
                        color: (licenseInfo?.isPro && licenseInfo?.type === 'device' && licenseInfo?.expiresAt && Math.ceil((new Date(licenseInfo.expiresAt).getTime() - Date.now()) / 86400000) <= 30) ? '#ef4444' : 'var(--text-primary)'
                      }}
                    >
                      {(!licenseInfo?.isPro || licenseInfo?.type === 'lifetime') ? '永久有效' : `有效期还剩 ${Math.ceil((new Date(licenseInfo!.expiresAt).getTime() - Date.now()) / 86400000)} 天`}
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-sm font-medium mb-4 translate-y-[3px]" style={{ color: 'var(--text-secondary)' }}>可视化跨端 RPA 工具</p>
              <img src="./logo.png" onError={(e) => e.currentTarget.style.display = 'none'} className="absolute top-6 right-6 w-16 h-16 object-contain opacity-80" style={{ imageRendering: 'high-quality' as any, transform: 'translateZ(0)' }} alt="Logo" />
              <div className="mt-auto mb-3 flex justify-between items-end text-[12px] font-mono opacity-50" style={{ color: 'var(--text-muted)' }}>
                <span>It works. Go have a coffee.</span>
                <span>Copyright © 2026 Tun & PaMa AG</span>
              </div>
              <div className="pt-4 border-t shrink-0" style={{ borderColor: 'var(--border)' }}>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>当前版本</span>
                  <span className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{version}</span>
                </div>
              </div>
            </div>

            {/* Last Row: Changelog */}
            <div style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)', animationDelay: '350ms' }} className="border rounded-xl p-6 flex flex-col shadow-sm h-full min-h-0 animate-fade-in-up-card">
              <div className="flex justify-between items-center mb-4 shrink-0">
                <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <FileText size={18} style={{ color: 'var(--text-secondary)' }} />
                  更新日志
                </h3>
                <button
                  // @ts-ignore
                  onClick={() => window.electronAPI?.openReleasesPage()}
                  className="flex items-center gap-1 px-4 py-2 rounded-xl font-bold text-sm transition-colors border"
                  style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
                >
                  <Github size={14} /> 检查更新
                </button>
              </div>
              <div
                className="flex-1 min-h-0 rounded-xl p-4 text-xs font-mono whitespace-pre-wrap overflow-y-auto border"
                style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-muted)', borderColor: 'var(--border)' }}
              >
                {changelog}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
