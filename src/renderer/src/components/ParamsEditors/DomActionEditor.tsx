import React, { useState, useEffect } from 'react'
import { ActionEditorProps } from './types'

function SmartXPathSelector({ currentStep, updateCurrentStep }: { currentStep: any, updateCurrentStep: any }) {
  const [originalXPath, setOriginalXPath] = useState<string | undefined>(currentStep.selectorXPath);
  const [selectedOption, setSelectedOption] = useState<string>('none');

  useEffect(() => {
    setOriginalXPath(currentStep.selectorXPath);
    setSelectedOption('none');
  }, [currentStep.id]);

  useEffect(() => {
    if (selectedOption !== 'none' && currentStep.selectorXPath !== selectedOption) {
      setSelectedOption('none');
      setOriginalXPath(currentStep.selectorXPath);
    }
  }, [currentStep.selectorXPath]);

  const text = currentStep.innerText?.trim() || '';
  if (!text) return null;

  const options = [
    { label: '不替换 (保留原始 XPath)', value: 'none' },
    { label: `//span[contains(text(), "${text}")]`, value: `//span[contains(text(), "${text}")]` },
    { label: `//div[contains(text(), "${text}")]`, value: `//div[contains(text(), "${text}")]` },
    { label: `//*[contains(text(), "${text}")]/.. (向上寻找父容器)`, value: `//*[contains(text(), "${text}")]/..` },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedOption(val);
    if (val === 'none') {
      updateCurrentStep({ selectorXPath: originalXPath || '', selector: '' });
    } else {
      updateCurrentStep({ selectorXPath: val, selector: '' });
    }
  };

  return (
    <div className="flex flex-col">
      <label className="text-[12px] text-gray-500 dark:text-[#b1b8c0] font-medium mb-1.5">
        Xpath 智能替换 (基于抓取文字)
      </label>
      <select
        className="bg-gray-900 text-xs text-gray-300 px-2.5 py-1.5 rounded-lg outline-none border border-gray-700 focus:border-primary w-full appearance-none"
        style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M5 7l5 5 5-5'/%3e%3c/svg%3e")`, backgroundPosition: 'right 6px center', backgroundRepeat: 'no-repeat', backgroundSize: '1.2em 1.2em', paddingRight: '28px' }}
        value={selectedOption}
        onChange={handleChange}
      >
        {options.map((opt, i) => (
          <option key={i} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

export default function DomActionEditor({ currentStep, updateCurrentStep, renderVarLabel }: ActionEditorProps) {
  return (
    <>
      {currentStep.type === 'click' && (
        <div className="flex flex-col gap-1.5 mt-1.5">
          <label className="flex items-start gap-2 bg-gray-900 text-xs text-gray-300 px-2.5 py-2 rounded-lg outline-none border border-gray-700 cursor-pointer hover:border-gray-500 transition-colors select-none">
            <input
              type="checkbox"
              checked={!!currentStep.smartParentClick}
              onChange={e => {
                const isChecked = e.target.checked;
                let newSelector = currentStep.selector || '';
                if (isChecked && newSelector) {
                  newSelector = newSelector.replace(/\s*>\s*(svg|path|img|rect|circle).*$/i, '');
                  newSelector = newSelector.replace(/\s+(svg|path|img|rect|circle).*$/i, '');
                }
                updateCurrentStep({
                  smartParentClick: isChecked,
                  ...(isChecked && newSelector !== currentStep.selector ? { selector: newSelector } : {})
                });
              }}
              className="mt-0.5 rounded border-gray-600 text-primary focus:ring-primary bg-gray-900 cursor-pointer w-3.5 h-3.5 shrink-0"
            />
            <div className="flex flex-col">
              <span className="font-bold text-gray-200">针对 CSS 的智能穿透点击</span>
              <span className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                过滤 CSS 最内层的 svg/path/img 标签，解决点击无响应
              </span>
            </div>
          </label>

          <SmartXPathSelector currentStep={currentStep} updateCurrentStep={updateCurrentStep} />
        </div>
      )}

      {currentStep.type === 'input' && (
        <div className="flex flex-col gap-1.5">
          {renderVarLabel("输入静态文本或 {{变量名}}", "value", "input-val-field")}
          <input
            id="input-val-field"
            className="bg-gray-900 text-xs text-gray-300 px-2.5 py-1.5 rounded-lg outline-none border border-gray-700 focus:border-primary w-full"
            value={currentStep.value || ''}
            onChange={e => updateCurrentStep({ value: e.target.value })}
            placeholder="要输入的值"
          />
        </div>
      )}

      {currentStep.type === 'mouseMove' && (
        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] text-gray-500 dark:text-[#b1b8c0] font-medium">附加操作</label>
          <label className="flex items-center gap-2 bg-gray-900 text-xs text-gray-300 px-2.5 py-1.5 rounded-lg outline-none border border-gray-700 cursor-pointer hover:border-gray-500 transition-colors select-none">
            <input
              type="checkbox"
              checked={!!currentStep.takeScreenshot}
              onChange={e => updateCurrentStep({ takeScreenshot: e.target.checked })}
              className="rounded border-gray-600 text-primary focus:ring-primary bg-gray-900 cursor-pointer w-3.5 h-3.5"
            />
            <span>移动鼠标后顺便截图 (存至 run_images)</span>
          </label>
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] text-gray-500 font-medium">到达后维持 (步)</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="10"
                step="1"
                className="bg-gray-900 text-xs text-gray-300 px-2.5 py-1.5 rounded-lg outline-none border border-gray-700 focus:border-primary w-24"
                value={currentStep.waitDuration === undefined ? 0 : currentStep.waitDuration}
                onChange={e => {
                  if (e.target.value === '') {
                    updateCurrentStep({ waitDuration: '' as any });
                    return;
                  }
                  let val = parseInt(e.target.value, 10);
                  if (isNaN(val)) val = 0;
                  if (val < 0) val = 0;
                  if (val > 10) val = 10;
                  updateCurrentStep({ waitDuration: val });
                }}
              />
              <span className="text-[12px] text-gray-400">后续步数 (0 ~ 10)</span>
            </div>
          </div>
        </div>
      )}

      {currentStep.type === 'readText' && (
        <div className="flex flex-col gap-1.5 p-2.5 mt-1 bg-gray-800/50 rounded-lg border border-gray-700">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[12px] text-gray-500 dark:text-[#b1b8c0] font-medium">输入变量名</label>
              {currentStep.innerText && (
                <span className="text-[11px] text-primary font-bold">
                  识别类型为: {
                    (() => {
                      const raw = currentStep.innerText.trim();
                      if (/^[\d.]+\s*%$/.test(raw)) return '数字 (%)';
                      if (/[¥$€£]/.test(raw)) return '货币';
                      if (/^([\d.]+)\s*(万|亿)/.test(raw)) return '中文量级';
                      if (/^([\d.]+)\s*([kKmMbB])$/.test(raw)) return '英文量级';
                      if (/^-?[\d,.]+\.?\d*$/.test(raw)) return '数字';
                      return '字符';
                    })()
                  }
                </span>
              )}
            </div>
            <input
              className="bg-gray-900 text-xs text-gray-300 px-2.5 py-1.5 rounded-lg outline-none border border-gray-700 focus:border-primary w-full"
              value={currentStep.outputVariable || ''}
              onChange={e => updateCurrentStep({ outputVariable: e.target.value })}
              placeholder="例如: price"
            />
          </div>
          {(currentStep.innerText && /[.,]/.test(currentStep.innerText)) && (
            <div className="flex items-center gap-3">
              <span className="text-[12px] text-gray-500 font-medium">数值千分位格式化:</span>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="numberLocale"
                  className="accent-primary w-3 h-3 bg-gray-900 border-gray-600"
                  checked={currentStep.numberLocale === 'en' || !currentStep.numberLocale}
                  onChange={() => updateCurrentStep({ numberLocale: 'en' })}
                />
                <span className="text-[12px] text-gray-300">英 (1,000.00)</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="numberLocale"
                  className="accent-primary w-3 h-3 bg-gray-900 border-gray-600"
                  checked={currentStep.numberLocale === 'de'}
                  onChange={() => updateCurrentStep({ numberLocale: 'de' })}
                />
                <span className="text-[12px] text-gray-300">德 (1.000,00)</span>
              </label>
            </div>
          )}
        </div>
      )}

      {currentStep.type === 'readAttr' && (
        <div className="flex flex-col gap-1.5 p-2.5 mt-1 bg-gray-800/50 rounded-lg border border-gray-700">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] text-gray-500 dark:text-[#b1b8c0] font-medium">输入属性名</label>
            <input
              className="bg-gray-900 text-xs text-gray-300 px-2.5 py-1.5 rounded-lg outline-none border border-gray-700 focus:border-primary w-full"
              value={currentStep.attrName || ''}
              onChange={e => updateCurrentStep({ attrName: e.target.value })}
              placeholder="例如: href 或 src"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] text-gray-500 dark:text-[#b1b8c0] font-medium">存入变量名</label>
            <input
              className="bg-gray-900 text-xs text-gray-300 px-2.5 py-1.5 rounded-lg outline-none border border-gray-700 focus:border-primary w-full"
              value={currentStep.outputVariable || ''}
              onChange={e => updateCurrentStep({ outputVariable: e.target.value })}
              placeholder="例如: linkUrl"
            />
          </div>
        </div>
      )}

      {currentStep.type === 'pressKey' && (
        <div className="flex flex-col gap-1.5 p-3 mt-1 bg-gray-800/50 rounded-lg border border-gray-700">
          <label className="text-[12px] text-gray-500 dark:text-[#b1b8c0] font-medium">按键类型</label>
          <select
            className="bg-gray-900 text-xs text-gray-300 px-2.5 py-1.5 rounded-lg outline-none border border-gray-700 focus:border-primary w-full"
            value={currentStep.keyToPress || 'Enter'}
            onChange={e => updateCurrentStep({ keyToPress: e.target.value })}
          >
            <option value="Enter">Enter (回车)</option>
            <option value="Escape">Escape (退出)</option>
            <option value="Tab">Tab (制表符)</option>
            <option value="Space">Space (空格)</option>
            <option value="ArrowDown">ArrowDown (向下箭头)</option>
            <option value="ArrowUp">ArrowUp (向上箭头)</option>
          </select>
        </div>
      )}

      {currentStep.type === 'waitForText' && (
        <div className="flex flex-col gap-1.5 p-3 mt-1 bg-gray-800/50 rounded-lg border border-gray-700">
          <div className="flex flex-col gap-1.5">
            {renderVarLabel("包含或等于的文本", "value", "wait-text-field")}
            <input
              id="wait-text-field"
              type="text"
              className="bg-gray-900 text-xs text-gray-300 px-2.5 py-1.5 rounded-lg outline-none border border-gray-700 focus:border-primary w-full"
              value={currentStep.value || ''}
              onChange={e => updateCurrentStep({ value: e.target.value })}
              placeholder="例如: 导出成功"
            />
          </div>
          <div className="flex flex-col gap-1.5 mt-1.5">
            <label className="text-[12px] text-gray-500 dark:text-[#b1b8c0] font-medium">最大超时时长 (秒)</label>
            <input
              type="number"
              min="1"
              className="bg-gray-900 text-xs text-gray-300 px-2.5 py-1.5 rounded-lg outline-none border border-gray-700 focus:border-primary w-full"
              value={currentStep.waitForTimeoutSeconds || 30}
              onChange={e => updateCurrentStep({ waitForTimeoutSeconds: Number(e.target.value) })}
            />
          </div>
        </div>
      )}

      {currentStep.type === 'scrollToElement' && (
        <div className="flex flex-col gap-1.5 p-3 mt-1 bg-gray-800/50 rounded-lg border border-gray-700">
          <label className="text-[12px] text-gray-500 dark:text-[#b1b8c0] font-medium">对齐方式</label>
          <select
            className="bg-gray-900 text-xs text-gray-300 px-2.5 py-1.5 rounded-lg outline-none border border-gray-700 focus:border-primary w-full"
            value={currentStep.scrollAlignment || 'center'}
            onChange={e => updateCurrentStep({ scrollAlignment: e.target.value as any })}
          >
            <option value="center">居中对齐 (Center)</option>
            <option value="start">顶部对齐 (Start)</option>
            <option value="end">底部对齐 (End)</option>
          </select>
        </div>
      )}
    </>
  )
}
