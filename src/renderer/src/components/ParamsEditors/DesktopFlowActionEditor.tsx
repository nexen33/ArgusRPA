import React from 'react'

export default function DesktopFlowActionEditor({ currentStep }: any) {
  const isFlowAction = ['waitTimer', 'calculate', 'readLocalFile', 'fileAction', 'runPython', 'goto', 'readClipboard', 'assignVariable', 'condition', 'if_else'].includes(currentStep?.type)

  if (!isFlowAction) return null

  return (
    <div className="flex flex-col items-center justify-center p-6 border border-dashed border-gray-700 bg-gray-900/40 rounded-xl mt-2 text-center shadow-inner">
      <div className="text-2xl mb-2">🔒</div>
      <div className="text-[13px] font-bold text-gray-400 mb-1">桌面工作流调度逻辑 (已隔离)</div>
      <div className="text-[11px] text-gray-500 leading-relaxed max-w-[280px]">
        包含高并发文件操作、Python 沙盒执行环境及桌面全局变量交换逻辑。<br/>
        涉及核心引擎安全边界，暂不随 UI 框架开源。
      </div>
    </div>
  )
}
