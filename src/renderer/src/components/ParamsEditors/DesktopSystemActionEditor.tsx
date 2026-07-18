import React from 'react'

export default function DesktopSystemActionEditor({ currentStep }: any) {
  const isSystemAction = ['imageMatch', 'launchApp', 'closeApp', 'windowControl', 'systemSearch', 'sendWin32Message'].includes(currentStep?.type)

  if (!isSystemAction) return null

  return (
    <div className="flex flex-col items-center justify-center p-6 border border-dashed border-gray-700 bg-gray-900/40 rounded-xl mt-2 text-center shadow-inner">
      <div className="text-2xl mb-2">🔒</div>
      <div className="text-[13px] font-bold text-gray-400 mb-1">系统底层操作参数面板 (已隔离)</div>
      <div className="text-[11px] text-gray-500 leading-relaxed max-w-[280px]">
        包含 Win32 消息投递、进程注入及系统级窗口句柄调度等敏感算法。<br/>
        该部分源码在此开源版中已被物理屏蔽，请谅解。
      </div>
    </div>
  )
}
