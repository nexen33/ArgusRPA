import React from 'react'

export default function DesktopActionEditor({ currentStep }: any) {
  const isElementAction = ['click', 'input', 'pressKey', 'readText', 'readAttr', 'waitForSelector', 'mouseMove', 'dragAndDrop', 'screenshot'].includes(currentStep?.type)
  
  if (!isElementAction) return null

  return (
    <div className="flex flex-col items-center justify-center p-6 border border-dashed border-gray-700 bg-gray-900/40 rounded-xl mt-2 text-center shadow-inner">
      <div className="text-2xl mb-2">🔒</div>
      <div className="text-[13px] font-bold text-gray-400 mb-1">桌面自动化引擎参数面板 (已隔离)</div>
      <div className="text-[11px] text-gray-500 leading-relaxed max-w-[280px]">
        涉及 UIA/OpenCV 双轨拾取、防屏蔽坐标计算及 Win32 底层控制等核心商业逻辑。<br/>
        该部分 UI 源码及 Zod 结构在此开源版中已受保护。体验完整功能请使用 Trial/Pro 安装包。
      </div>
    </div>
  )
}
