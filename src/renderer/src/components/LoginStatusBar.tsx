import React, { useEffect, useState } from 'react'

export default function LoginStatusBar() {
  const [status, setStatus] = useState<'hidden' | 'required' | 'success' | 'cancelled'>('hidden')
  const [message, setMessage] = useState('')

  useEffect(() => {
    // @ts-ignore
    if (!window.electronAPI) return

    // @ts-ignore
    const removeReq = window.electronAPI.onLoginRequired((data: any) => {
      setStatus('required')
      try {
        const hostname = new URL(data.url).hostname
        setMessage(`⚠️ ${hostname} 登录已过期，请在弹出的安全窗口中完成登录...`)
      } catch (e) {
        setMessage('⚠️ 登录已过期，请在弹出的安全窗口中完成登录...')
      }
    })

    // @ts-ignore
    const removeSuccess = window.electronAPI.onLoginSuccess(() => {
      setStatus('success')
      setMessage('✅ 登录成功，正在继续任务...')
      setTimeout(() => {
        setStatus('hidden')
      }, 3000)
    })

    // @ts-ignore
    const removeCancel = window.electronAPI.onLoginCancelled(() => {
      setStatus('cancelled')
      setMessage('❌ 登录被取消，爬虫任务已终止。')
      setTimeout(() => {
        setStatus('hidden')
      }, 3000)
    })
    
    return () => {
      if (removeReq) removeReq()
      if (removeSuccess) removeSuccess()
      if (removeCancel) removeCancel()
    }
  }, [])

  if (status === 'hidden') return null

  let bgColor = 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-500/20 dark:text-yellow-300 dark:border-yellow-500/50'
  if (status === 'success') bgColor = 'bg-green-100 text-green-800 border-green-300 dark:bg-green-500/20 dark:text-green-300 dark:border-green-500/50'
  if (status === 'cancelled') bgColor = 'bg-red-100 text-red-800 border-red-300 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/50'

  return (
    <div className={`w-full py-2 px-4 border-b flex items-center justify-between text-sm font-medium transition-colors ${bgColor}`}>
      <div className="flex-1 text-center">
        {message}
      </div>
      {status === 'required' && (
        <button 
          onClick={() => setStatus('hidden')}
          className="ml-4 w-6 h-6 flex items-center justify-center rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          title="关闭提示"
        >
          ✕
        </button>
      )}
    </div>
  )
}
