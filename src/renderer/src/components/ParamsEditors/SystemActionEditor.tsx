import React, { useState } from 'react'
import { ActionEditorProps } from './types'

export default function SystemActionEditor({ currentStep, updateCurrentStep, renderVarLabel, availableVars = [] }: ActionEditorProps) {
  const [rowDropdownOpen, setRowDropdownOpen] = useState(false);
  return (
    <>
      {currentStep.type === 'waitTimer' && (
        <div className="flex flex-col gap-1.5 border-l-2 border-primary pl-2 my-2 animate-in slide-in-from-left-2">
          <label className="text-[11px] text-gray-400 font-medium">等待时长 (秒)</label>
          <input
            type="number"
            min="0.1"
            step="0.1"
            className="bg-gray-800 text-xs text-gray-300 px-2.5 py-1.5 rounded-lg outline-none border border-gray-700 focus:border-primary w-full"
            value={currentStep.waitDuration || ''}
            onChange={e => updateCurrentStep({ waitDuration: parseFloat(e.target.value) })}
            placeholder="例如: 3.5"
          />
        </div>
      )}

      {currentStep.type === 'scrollPage' && (
        <div className="flex flex-col gap-1.5 p-3 mt-1 bg-gray-800/50 rounded-lg border border-gray-700">
          <label className="text-[12px] text-gray-500 dark:text-[#b1b8c0] font-medium">滚动方向</label>
          <select
            className="bg-gray-900 text-xs text-gray-300 px-2.5 py-1.5 rounded-lg outline-none border border-gray-700 focus:border-primary w-full"
            value={currentStep.scrollDirection || 'bottom'}
            onChange={e => updateCurrentStep({ scrollDirection: e.target.value as any })}
          >
            <option value="bottom">滚动到最底部</option>
            <option value="top">滚动到最顶部</option>
            <option value="pixels">按像素向下滚动</option>
          </select>
          {currentStep.scrollDirection === 'pixels' && (
            <div className="flex flex-col gap-1.5 mt-1.5">
              <label className="text-[12px] text-gray-500 dark:text-[#b1b8c0] font-medium">滚动像素值</label>
              <input
                type="number"
                className="bg-gray-900 text-xs text-gray-300 px-2.5 py-1.5 rounded-lg outline-none border border-gray-700 focus:border-primary w-full"
                value={currentStep.scrollPixels || 500}
                onChange={e => updateCurrentStep({ scrollPixels: Number(e.target.value) })}
              />
            </div>
          )}
        </div>
      )}

      {currentStep.type === 'navigate' && (
        <div className="flex flex-col gap-1.5">
          {renderVarLabel("跳转网址", "value", "nav-url-field")}
          <input
            id="nav-url-field"
            className="bg-gray-900 text-xs text-gray-300 px-2.5 py-1.5 rounded-lg outline-none border border-gray-700 focus:border-primary w-full font-mono"
            value={currentStep.value || ''}
            onChange={e => updateCurrentStep({ value: e.target.value })}
            placeholder="例如: https://baidu.com"
          />
        </div>
      )}

      {currentStep.type === 'calculate' && (
        <div className="flex flex-col gap-3 p-3 mt-1 bg-gray-800/50 rounded-lg border border-gray-700">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] text-blue-500 dark:text-blue-400 font-medium">数学表达式 (支持 {'{{变量名}}'})</label>
              <div className="flex items-center gap-0.5">
                {['+', '-', '*', '/', '()', '{{}}'].map(sym => (
                  <button 
                    key={sym}
                    onClick={() => {
                      const input = document.getElementById('calc-input') as HTMLInputElement;
                      if (input) {
                        const start = input.selectionStart || 0;
                        const end = input.selectionEnd || 0;
                        const currentVal = currentStep.value || '';
                        const newVal = currentVal.substring(0, start) + sym + currentVal.substring(end);
                        updateCurrentStep({ value: newVal });
                        
                        setTimeout(() => {
                          input.focus();
                          let cursorPos = start + sym.length;
                          if (sym === '()') cursorPos -= 1;
                          if (sym === '{{}}') cursorPos -= 2;
                          input.setSelectionRange(cursorPos, cursorPos);
                        }, 0);
                      } else {
                        updateCurrentStep({ value: (currentStep.value || '') + sym });
                      }
                    }}
                    className="text-[12px] text-gray-400 hover:text-primary bg-gray-900 hover:bg-gray-800 px-1.5 py-0.5 rounded transition-colors border border-gray-700 font-mono"
                  >
                    {sym}
                  </button>
                ))}
              </div>
            </div>
            <input
              id="calc-input"
              className="bg-gray-900 text-xs text-gray-200 px-2.5 py-2 rounded-lg outline-none border border-gray-600 focus:border-primary w-full"
              value={currentStep.value || ''}
              onChange={e => updateCurrentStep({ value: e.target.value })}
              placeholder="例如: {{price}} * 0.8"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] text-blue-500 dark:text-blue-400 font-medium">存入变量名</label>
            <input
              className="bg-gray-900 text-xs text-gray-200 px-2.5 py-2 rounded-lg outline-none border border-gray-600 focus:border-primary w-full"
              value={currentStep.outputVariable || ''}
              onChange={e => updateCurrentStep({ outputVariable: e.target.value })}
              placeholder="例如: finalPrice"
            />
          </div>
        </div>
      )}

      {currentStep.type === 'skipPopup' && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] text-gray-500 dark:text-[#b1b8c0] font-medium">关闭关键词词库</label>
            <textarea
              className="bg-gray-900 text-xs text-gray-300 px-2.5 py-1.5 rounded-lg outline-none border border-gray-700 focus:border-primary w-full font-mono min-h-[60px]"
              value={currentStep.value || ''}
              onChange={e => updateCurrentStep({ value: e.target.value })}
              placeholder="以双引号和逗号隔开..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 cursor-pointer group w-max">
              <input
                type="checkbox"
                className="hidden"
                checked={!!currentStep.preScreenshot}
                onChange={e => {
                  const isChecked = e.target.checked;
                  updateCurrentStep({
                    preScreenshot: isChecked,
                    notifyAfterScreenshot: isChecked ? currentStep.notifyAfterScreenshot : false
                  });
                }}
              />
              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${currentStep.preScreenshot ? 'bg-primary border-primary' : 'bg-gray-900 border-gray-600 group-hover:border-gray-500'}`}>
                {currentStep.preScreenshot && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
              </div>
              <span className="text-[12px] text-gray-400 group-hover:text-gray-300 transition-colors">弹窗处理前截图</span>
            </label>

            <label className={`flex items-center gap-2 cursor-pointer group w-max ${!currentStep.preScreenshot ? 'opacity-50 pointer-events-none' : ''}`}>
              <input
                type="checkbox"
                className="hidden"
                checked={!!currentStep.notifyAfterScreenshot}
                onChange={e => updateCurrentStep({ notifyAfterScreenshot: e.target.checked })}
                disabled={!currentStep.preScreenshot}
              />
              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${currentStep.notifyAfterScreenshot ? 'bg-primary border-primary' : 'bg-gray-900 border-gray-600 group-hover:border-gray-500'}`}>
                {currentStep.notifyAfterScreenshot && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
              </div>
              <span className="text-[12px] text-gray-400 group-hover:text-gray-300 transition-colors">截图后系统通知</span>
            </label>
          </div>
        </div>
      )}

      {currentStep.type === 'screenshot' && (
        <div className="flex flex-col gap-3 p-3 mt-1 bg-gray-800/50 rounded-lg border border-gray-700">
          <div className="flex flex-col gap-1.5">
            {renderVarLabel("可选：自定义本地保存路径", "savePath", "screenshot-path-field")}
            <input
              id="screenshot-path-field"
              className="bg-gray-900 text-xs text-gray-200 px-2.5 py-2 rounded-lg outline-none border border-gray-600 focus:border-primary w-full"
              value={currentStep.savePath || ''}
              onChange={e => updateCurrentStep({ savePath: e.target.value })}
              placeholder="默认: Argus_issue/run_images"
            />
          </div>
          <div className="flex items-center gap-2 pt-1 border-t border-gray-700">
            <input
              type="checkbox"
              id="ocrEnabled"
              checked={!!currentStep.ocrEnabled}
              onChange={e => updateCurrentStep({ ocrEnabled: e.target.checked })}
              className="rounded border-gray-600 text-primary focus:ring-primary bg-gray-900"
            />
            <label htmlFor="ocrEnabled" className="text-[11px] text-gray-300 cursor-pointer font-bold">
              启用本地 OCR 识别文字
            </label>
          </div>
          {currentStep.ocrEnabled && (
            <div className="flex gap-3 pl-6">
              <div className="flex flex-col gap-1.5 flex-1">
                <label className="text-[11px] text-blue-500 dark:text-blue-400 font-medium">OCR 识别语种</label>
                <select
                  className="bg-gray-900 text-xs text-gray-200 px-2.5 py-2 rounded-lg outline-none border border-gray-600 focus:border-primary w-full"
                  value={currentStep.ocrLanguage || 'chi_sim+eng'}
                  onChange={e => updateCurrentStep({ ocrLanguage: e.target.value })}
                >
                  <option value="chi_sim+eng">中文(简) + 英文</option>
                  <option value="eng">仅英文</option>
                  <option value="deu">德语</option>
                  <option value="chi_tra+eng">中文(繁) + 英文</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5 flex-1">
                <label className="text-[11px] text-blue-500 dark:text-blue-400 font-medium">存入变量名</label>
                <input
                  className="bg-gray-900 text-xs text-gray-200 px-2.5 py-2 rounded-lg outline-none border border-gray-600 focus:border-primary w-full"
                  value={currentStep.outputVariable || ''}
                  onChange={e => updateCurrentStep({ outputVariable: e.target.value })}
                  placeholder="ocrResult"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {currentStep.type === 'downloadFile' && (
        <>
          <div className="flex flex-col gap-1.5">
            {renderVarLabel("自定义文件名 (不带后缀)", "downloadFileName", "dl-file-name")}
            <input
              id="dl-file-name"
              className="bg-gray-900 text-xs text-gray-300 px-2.5 py-1.5 rounded-lg outline-none border border-gray-700 focus:border-primary w-full"
              value={currentStep.downloadFileName || ''}
              onChange={e => updateCurrentStep({ downloadFileName: e.target.value })}
              placeholder="支持 {{_SYS_CURRENT_DATE_}} 或 yyyymmdd"
            />
          </div>
          <div className="flex flex-col gap-1.5 mt-1">
            <label className="text-[12px] text-gray-500 dark:text-[#b1b8c0] font-medium">输入保存目录路径 (可选)</label>
            <input
              className="bg-gray-900 text-xs text-gray-300 px-2.5 py-1.5 rounded-lg outline-none border border-gray-700 focus:border-primary w-full"
              value={currentStep.downloadDir || ''}
              onChange={e => updateCurrentStep({ downloadDir: e.target.value })}
              placeholder="留空则使用系统默认下载目录"
            />
          </div>
        </>
      )}

      {currentStep.type === 'readLocalFile' && (
        <div className="flex flex-col gap-1.5 p-3 mt-1 bg-gray-800/50 rounded-lg border border-gray-700">
          <div className="flex flex-col gap-1.5">
            {renderVarLabel("本地文件绝对路径", "targetFilePath", "local-file-path")}
            <input
              id="local-file-path"
              type="text"
              className="bg-gray-900 text-xs text-gray-300 px-2.5 py-1.5 rounded-lg outline-none border border-gray-700 focus:border-primary w-full"
              value={currentStep.targetFilePath || ''}
              onChange={e => updateCurrentStep({ targetFilePath: e.target.value })}
              placeholder="例如: C:\Data\{{city}}_report.xlsx"
            />
          </div>
          <div className="flex flex-col gap-1.5 mt-1.5">
            <label className="text-[12px] text-gray-500 dark:text-[#b1b8c0] font-medium">文件格式</label>
            <select
              className="bg-gray-900 text-xs text-gray-300 px-2.5 py-1.5 rounded-lg outline-none border border-gray-700 focus:border-primary w-full"
              value={currentStep.fileFormat || 'excel'}
              onChange={e => updateCurrentStep({ fileFormat: e.target.value as any })}
            >
              <option value="excel">Excel (.xlsx, .xls)</option>
              <option value="csv">CSV (.csv)</option>
              <option value="txt">文本 (.txt)</option>
              <option value="word">Word (.docx)</option>
            </select>
          </div>
          {(currentStep.fileFormat === 'excel' || currentStep.fileFormat === 'csv' || !currentStep.fileFormat) && (
            <div className="grid grid-cols-2 gap-2 mt-1.5">
              <div className="flex flex-col gap-1.5 relative group/var" tabIndex={-1} onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) setRowDropdownOpen(false)
              }}>
                <label className="text-[12px] text-gray-500 dark:text-[#b1b8c0] font-medium">提取行号</label>
                <div className="relative">
                  <input
                    type="text"
                    className="bg-gray-900 text-xs text-gray-300 pl-2.5 pr-6 py-1.5 rounded-lg outline-none border border-gray-700 focus:border-primary w-full"
                    value={currentStep.excelRow ?? 2}
                    onChange={e => {
                      const val = e.target.value;
                      updateCurrentStep({ excelRow: isNaN(Number(val)) || val.includes('{') ? val : (val === '' ? '' : Number(val)) })
                    }}
                    onFocus={() => setRowDropdownOpen(true)}
                  />
                  <button 
                    onClick={() => setRowDropdownOpen(!rowDropdownOpen)}
                    className="absolute right-2 top-0 h-full flex items-center text-gray-400 hover:text-primary transition-colors"
                  >
                    <span className="text-[10px]">▼</span>
                  </button>
                </div>
                {availableVars && availableVars.length > 0 && (
                  <div className={`absolute left-0 top-full mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-xl transition-all z-50 p-1 max-h-40 overflow-y-auto custom-scrollbar ${rowDropdownOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
                    <div className="text-[10px] text-gray-500 px-2 py-1 mb-1 border-b border-gray-700/50">可用变量</div>
                    <div className="flex flex-col gap-0.5">
                      {availableVars.map(v => (
                        <button
                          key={v}
                          onClick={(e) => {
                            e.preventDefault();
                            updateCurrentStep({ excelRow: `{{${v}}}` });
                            setRowDropdownOpen(false);
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
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] text-gray-500 dark:text-[#b1b8c0] font-medium">提取列字母</label>
                <input
                  type="text"
                  className="bg-gray-900 text-xs text-gray-300 px-2.5 py-1.5 rounded-lg outline-none border border-gray-700 focus:border-primary w-full uppercase"
                  value={currentStep.excelCol ?? 'C'}
                  onChange={e => updateCurrentStep({ excelCol: e.target.value.toUpperCase() })}
                  placeholder="例如: C"
                />
              </div>
            </div>
          )}
          {(currentStep.fileFormat === 'txt' || currentStep.fileFormat === 'word') && (
            <div className="flex flex-col gap-1.5 mt-1.5">
              <label className="text-[12px] text-gray-500 dark:text-[#b1b8c0] font-medium">正则提取 (留空读取全文)</label>
              <input
                type="text"
                className="bg-gray-900 text-xs text-gray-300 px-2.5 py-1.5 rounded-lg outline-none border border-gray-700 focus:border-primary w-full"
                value={currentStep.textRegex || ''}
                onChange={e => updateCurrentStep({ textRegex: e.target.value })}
                placeholder="例如: 城市: (.*)"
              />
            </div>
          )}
          <div className="flex flex-col gap-1.5 mt-1.5">
            <label className="text-[12px] text-gray-500 dark:text-[#b1b8c0] font-medium">提取结果保存至变量</label>
            <input
              type="text"
              className="bg-gray-900 text-xs text-gray-300 px-2.5 py-1.5 rounded-lg outline-none border border-gray-700 focus:border-primary w-full"
              value={currentStep.outputVariable || ''}
              onChange={e => updateCurrentStep({ outputVariable: e.target.value })}
              placeholder="例如: extracted_data"
            />
          </div>
        </div>
      )}

      {currentStep.type === 'fileAction' && (
        <div className="flex flex-col gap-1.5 p-3 mt-1 bg-gray-800/50 rounded-lg border border-gray-700">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] text-gray-500 dark:text-[#b1b8c0] font-medium">操作类型</label>
            <select
              className="bg-gray-900 text-xs text-gray-300 px-2.5 py-1.5 rounded-lg outline-none border border-gray-700 focus:border-primary w-full"
              value={currentStep.fileActionType || 'rename'}
              onChange={e => updateCurrentStep({ fileActionType: e.target.value as any })}
            >
              <option value="rename">重命名 / 移动文件</option>
              <option value="delete">删除文件</option>
              <option value="mkdir">创建文件夹</option>
            </select>
          </div>
          {(currentStep.fileActionType === 'rename' || currentStep.fileActionType === 'delete' || !currentStep.fileActionType) && (
            <div className="flex flex-col gap-1.5 mt-1.5">
              {renderVarLabel("源文件绝对路径", "sourceFilePath", "file-action-src")}
              <input
                id="file-action-src"
                type="text"
                className="bg-gray-900 text-xs text-gray-300 px-2.5 py-1.5 rounded-lg outline-none border border-gray-700 focus:border-primary w-full"
                value={currentStep.sourceFilePath || ''}
                onChange={e => updateCurrentStep({ sourceFilePath: e.target.value })}
                placeholder="例如: C:\Downloads\export.xlsx"
              />
            </div>
          )}
          {(currentStep.fileActionType === 'rename' || currentStep.fileActionType === 'mkdir' || !currentStep.fileActionType) && (
            <div className="flex flex-col gap-1.5 mt-1.5">
              {renderVarLabel(currentStep.fileActionType === 'mkdir' ? '目标文件夹绝对路径' : '目标文件绝对路径', "targetFilePath", "file-action-tgt")}
              <input
                id="file-action-tgt"
                type="text"
                className="bg-gray-900 text-xs text-gray-300 px-2.5 py-1.5 rounded-lg outline-none border border-gray-700 focus:border-primary w-full"
                value={currentStep.targetFilePath || ''}
                onChange={e => updateCurrentStep({ targetFilePath: e.target.value })}
                placeholder={currentStep.fileActionType === 'mkdir' ? "例如: C:\\Data\\{{city}}" : "例如: C:\\Data\\{{city}}\\{{city}}_report.xlsx"}
              />
            </div>
          )}
        </div>
      )}

      {currentStep.type === 'runPython' && (
        <div className="flex flex-col gap-1.5 p-3 mt-1 bg-gray-800/50 rounded-lg border border-gray-700">
          <div className="flex flex-col gap-1.5">
            {renderVarLabel("Python 脚本绝对路径", "pythonScriptPath", "py-script-path")}
            <input
              id="py-script-path"
              type="text"
              className="bg-gray-900 text-xs text-gray-300 px-2.5 py-1.5 rounded-lg outline-none border border-gray-700 focus:border-primary w-full"
              value={currentStep.pythonScriptPath || ''}
              onChange={e => updateCurrentStep({ pythonScriptPath: e.target.value })}
              placeholder="例如: C:\scripts\process.py"
            />
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className="h-px bg-gray-700 flex-1"></div>
            <span className="text-[10px] text-gray-500">OR</span>
            <div className="h-px bg-gray-700 flex-1"></div>
          </div>
          <div className="flex flex-col gap-1.5 mt-1">
            {renderVarLabel(
              <span>内联 Python 代码片段 <span className="text-[10px] font-normal opacity-80">(内置 sys, json 与 argus_vars 字典)</span></span> as any, 
              "pythonCode", 
              "py-inline-code"
            )}
            <textarea
              id="py-inline-code"
              className="bg-gray-900 text-xs text-gray-300 px-2.5 py-1.5 rounded-lg outline-none border border-gray-700 focus:border-primary w-full font-mono min-h-[100px] leading-relaxed"
              value={currentStep.pythonCode || ''}
              onChange={e => updateCurrentStep({ pythonCode: e.target.value })}
              placeholder={"# 引擎已隐式注入: import sys, json\n# 引擎已隐式提取所有变量至字典: argus_vars\n\n# 示例: 读取变量\nval = argus_vars.get('my_var', '')\n\n# 打印的结果会被作为变量返回\nprint('Done!')"}
            />
          </div>
          <div className="flex flex-col gap-1.5 mt-1.5">
            <label className="text-[12px] text-gray-500 dark:text-[#b1b8c0] font-medium">将最后一行 Print 结果存至变量</label>
            <input
              type="text"
              className="bg-gray-900 text-xs text-gray-300 px-2.5 py-1.5 rounded-lg outline-none border border-gray-700 focus:border-primary w-full"
              value={currentStep.outputVariable || ''}
              onChange={e => updateCurrentStep({ outputVariable: e.target.value })}
              placeholder="例如: python_result"
            />
          </div>
        </div>
      )}
    </>
  )
}
