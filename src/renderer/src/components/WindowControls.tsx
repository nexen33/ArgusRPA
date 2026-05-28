import React, { useState } from 'react'
import { useModal } from '../context/ModalContext'

export default function WindowControls() {
  const [hovered, setHovered] = useState(false)
  const modal = useModal()

  const handleMinimize = () => {
    (window as any).electronAPI.windowMinimize()
  }

  const handleMaximize = () => {
    (window as any).electronAPI.windowMaximize()
  }

  const handleClose = async () => {
    const result = await modal.confirm({
      title: '关闭程序',
      message: '请选择是要完全退出程序，还是最小化到后台运行？',
      confirmText: '完全退出',
      cancelText: '最小化到托盘'
    })
    if (result === true) {
      (window as any).electronAPI.windowClose(true)
    } else if (result === false) {
      (window as any).electronAPI.windowClose(false)
    }
  }

  return (
    <div 
      className="absolute top-0 left-0 w-[60px] h-[36px] flex items-center justify-center gap-2 z-[10000] group" 
      style={{ WebkitAppRegion: 'no-drag' } as any}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button 
        onClick={handleClose}
        className={`rounded-full bg-red-500 hover:bg-red-400 flex items-center justify-center transition-all overflow-hidden border border-black/10 dark:border-transparent shadow-sm w-2.5 h-2.5 ${hovered ? 'scale-[1.25]' : ''}`}
        title="关闭"
      />
      <button 
        onClick={handleMinimize}
        className={`rounded-full bg-yellow-500 hover:bg-yellow-400 flex items-center justify-center transition-all overflow-hidden border border-black/10 dark:border-transparent shadow-sm w-2.5 h-2.5 ${hovered ? 'scale-[1.25]' : ''}`}
        title="最小化"
      />
      <button 
        onClick={handleMaximize}
        className={`rounded-full bg-green-500 hover:bg-green-400 flex items-center justify-center transition-all overflow-hidden border border-black/10 dark:border-transparent shadow-sm w-2.5 h-2.5 ${hovered ? 'scale-[1.25]' : ''}`}
        title="最大化"
      />
    </div>
  )
}
