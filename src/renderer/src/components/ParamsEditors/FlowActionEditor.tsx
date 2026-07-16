import React, { useState } from 'react'
import { ActionEditorProps } from './types'

export default function FlowActionEditor({ currentStep, updateCurrentStep, availableVars = [], task }: ActionEditorProps) {
  const [varDropdownOpen, setVarDropdownOpen] = useState(false)
  const [operatorDropdownOpen, setOperatorDropdownOpen] = useState(false)

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'readText': return '读取文本'
      case 'readAttr': return '读取属性'
      case 'click': return '点击元素'
      case 'input': return '输入文本'
      case 'waitForSelector': return '等待出现'
      case 'waitTimer': return '固定等待'
      case 'downloadFile': return '下载文件'
      case 'navigate': return '访问网页 (全局)'
      case 'calculate': return '变量运算 (全局)'
      case 'screenshot': return '网页截图'
      case 'skipPopup': return '跳过弹窗 (全局)'
      case 'condition': return '条件判断网关'
      case 'mouseMove': return '移动到该元素处'
      case 'if_else': return '条件分支'
      case 'pressKey': return '模拟按键'
      case 'waitForText': return '文本轮询等待'
      case 'scrollToElement': return '滚动到元素可视区'
      case 'scrollPage': return '全局页面滚动'
      case 'readLocalFile': return '读取本地文件 (全局)'
      case 'fileAction': return '本地文件操作 (全局)'
      case 'runPython': return '运行 .py 脚本 (全局)'
      case 'goto': return '跳转到步骤 (局部循环)'
      default: return type
    }
  }

  return (
    <>
      {(currentStep.type === 'condition' || currentStep.type === 'if_else') && (
        <div className="flex flex-col gap-3 p-3 mt-1 bg-gray-800/50 rounded-lg border border-gray-700">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="text-[11px] text-primary font-medium mb-1.5 block">
                {currentStep.selector ? '将其变量名设为' : '变量名'}
              </label>
              {currentStep.selector ? (
                <input
                  className="bg-gray-900 text-xs text-gray-200 px-2.5 py-2 rounded-lg outline-none border border-gray-600 focus:border-primary w-full"
                  value={currentStep.conditionVar || ''}
                  onChange={e => updateCurrentStep({ conditionVar: e.target.value })}
                  placeholder="例如: percent"
                />
              ) : (
                <div className="relative group/var" tabIndex={-1} onBlur={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget)) setVarDropdownOpen(false)
                }}>
                  <input
                    className="bg-gray-900 text-xs text-gray-200 px-2.5 py-2 rounded-lg outline-none border border-gray-600 focus:border-primary w-full"
                    value={currentStep.conditionVar || ''}
                    onChange={e => updateCurrentStep({ conditionVar: e.target.value })}
                    onFocus={() => setVarDropdownOpen(true)}
                    placeholder="例如: percent"
                  />
                  {availableVars.length > 0 && (
                    <div className={`absolute left-0 top-full mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-xl transition-all z-50 p-1 max-h-40 overflow-y-auto custom-scrollbar ${varDropdownOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
                      <div className="text-[10px] text-gray-500 px-2 py-1 mb-1 border-b border-gray-700/50">可用变量</div>
                      <div className="flex flex-col gap-0.5">
                        {availableVars.map(v => (
                          <button
                            key={v}
                            onClick={(e) => {
                              e.preventDefault();
                              updateCurrentStep({ conditionVar: v });
                              setVarDropdownOpen(false);
                            }}
                            className="text-left px-2 py-1.5 text-xs rounded text-gray-300 hover:bg-gray-700 hover:text-white truncate"
                            title={v}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="w-24 relative" tabIndex={-1} onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget)) setOperatorDropdownOpen(false)
            }}>
              <label className="text-[11px] text-primary font-medium mb-1.5 block">判断条件</label>
              <button
                onClick={() => setOperatorDropdownOpen(prev => !prev)}
                className="bg-gray-900 text-xs text-gray-200 px-2.5 h-[34px] rounded-lg outline-none border border-gray-600 hover:border-primary w-full flex items-center justify-between"
              >
                {currentStep.conditionOperator === 'is_empty' ? '为空' :
                  currentStep.conditionOperator === 'not_empty' ? '不为空' :
                    currentStep.conditionOperator === 'contains' ? '包含' :
                      currentStep.conditionOperator === 'not_contains' ? '不包含' :
                        (currentStep.conditionOperator || '==')}
                <span className="text-gray-400 text-[10px]">▼</span>
              </button>
              <div className={`absolute left-1/2 -translate-x-1/2 top-full mt-1 w-32 bg-gray-800 border border-gray-700 rounded-lg shadow-xl transition-all z-50 p-1 ${operatorDropdownOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
                <div className="grid grid-cols-2 gap-1">
                  {['==', '!=', '>', '>=', '<', '<='].map(op => (
                    <button key={op} onClick={() => { updateCurrentStep({ conditionOperator: op as any }); setOperatorDropdownOpen(false); }} className={`w-full text-center px-1 py-1.5 text-xs rounded ${currentStep.conditionOperator === op ? 'bg-primary text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}>{op}</button>
                  ))}
                  <button onClick={() => { updateCurrentStep({ conditionOperator: 'is_empty' }); setOperatorDropdownOpen(false); }} className={`w-full text-center px-1 py-1.5 text-xs rounded ${currentStep.conditionOperator === 'is_empty' ? 'bg-primary text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}>为空</button>
                  <button onClick={() => { updateCurrentStep({ conditionOperator: 'not_empty' }); setOperatorDropdownOpen(false); }} className={`w-full text-center px-1 py-1.5 text-xs rounded ${currentStep.conditionOperator === 'not_empty' ? 'bg-primary text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}>不为空</button>
                  <button onClick={() => { updateCurrentStep({ conditionOperator: 'contains' }); setOperatorDropdownOpen(false); }} className={`w-full text-center px-1 py-1.5 text-xs rounded ${currentStep.conditionOperator === 'contains' ? 'bg-primary text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}>包含</button>
                  <button onClick={() => { updateCurrentStep({ conditionOperator: 'not_contains' }); setOperatorDropdownOpen(false); }} className={`w-full text-center px-1 py-1.5 text-xs rounded ${currentStep.conditionOperator === 'not_contains' ? 'bg-primary text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}>不包含</button>
                </div>
              </div>
            </div>
            <div className="flex-1">
              <label className="text-[11px] text-primary font-medium mb-1.5 block">目标值</label>
              <input
                className={`bg-gray-900 text-xs text-gray-200 px-2.5 py-2 rounded-lg outline-none border focus:border-primary w-full transition-colors ${(currentStep.conditionOperator === 'is_empty' || currentStep.conditionOperator === 'not_empty')
                  ? 'border-gray-700 text-gray-600 cursor-not-allowed opacity-50 bg-gray-900/50'
                  : 'border-gray-600'
                  }`}
                value={currentStep.conditionValue || ''}
                onChange={e => updateCurrentStep({ conditionValue: e.target.value })}
                placeholder={(currentStep.conditionOperator === 'is_empty' || currentStep.conditionOperator === 'not_empty') ? "不需要填" : "文本或数字"}
                disabled={currentStep.conditionOperator === 'is_empty' || currentStep.conditionOperator === 'not_empty'}
              />
            </div>
          </div>
          {currentStep.type === 'condition' && (
            <div>
              <label className="text-[11px] text-primary font-medium mb-1.5 block">条件不满足时</label>
              <select
                className="bg-gray-900 text-xs text-gray-200 px-2.5 py-2 rounded-lg outline-none border border-gray-600 focus:border-primary w-full"
                value={currentStep.conditionFailAction || 'error'}
                onChange={e => updateCurrentStep({ conditionFailAction: e.target.value as any })}
              >
                <option value="error">报错退出当前任务</option>
                <option value="skip">静默跳过剩余步骤</option>
                <option value="skip_notify">静默跳过并取消通知</option>
              </select>
            </div>
          )}
        </div>
      )}

      {currentStep.type === 'goto' && (
        <div className="flex flex-col gap-1.5 p-3 mt-1 bg-gray-800/50 rounded-lg border border-gray-700">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] text-gray-500 dark:text-[#b1b8c0] font-medium">目标跳转步骤</label>
            <select
              className="bg-gray-900 text-xs text-gray-300 px-2.5 py-1.5 rounded-lg outline-none border border-gray-700 focus:border-primary w-full"
              value={currentStep.gotoStepId || ''}
              onChange={e => updateCurrentStep({ gotoStepId: e.target.value })}
            >
              <option value="" disabled>-- 请选择跳转目标 --</option>
              {(task?.steps || []).map((s: any, i: number) => (
                <option key={s.id} value={s.id}>
                  [{i + 1}] {getTypeLabel(s.type)} {s.innerText ? `- ${s.innerText.substring(0, 10)}...` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </>
  )
}
