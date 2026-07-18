import React, { useState } from 'react'
import { useTask } from '../context/TaskContext'
import { Clock, Layers, Link as LinkIcon, Bell, LineChart, ChevronLeft, Save } from 'lucide-react'
import BatchParamEditor from './BatchParamEditor'

export default function GlobalConfigPanel() {
  const { task, updateTask } = useTask()
  const [activeConfigCard, setActiveConfigCard] = useState<string | null>(null)

  const [availableConfigs, setAvailableConfigs] = useState<any[]>([])
  const [availableTasks, setAvailableTasks] = useState<any[]>([])
  React.useEffect(() => {
    // @ts-ignore
    window.electronAPI.getAllNotificationConfigs?.().then(res => {
      setAvailableConfigs(res?.data || [])
    }).catch(() => { })

    // @ts-ignore
    window.electronAPI.getAllTasks?.().then(res => {
      if (res?.success) {
        setAvailableTasks(res.data.filter((t: any) => t.id !== task.id))
      }
    }).catch(() => { })
  }, [task.id])

  const configCards = [
    { id: 'schedule', icon: Clock, title: '定时运行', desc: '本机时区自动触发', checked: !!task.scheduleConfigured, onChange: (val: boolean) => updateTask({ scheduleConfigured: val }) },
    { id: 'batch', icon: Layers, title: task.taskType === 'desktop' ? '顺序批量参数' : '多并发参数', desc: task.taskType === 'desktop' ? '按顺序执行任务循环' : '批量执行任务循环', checked: !!task.batchParam?.enabled, onChange: (val: boolean) => updateTask({ batchParam: { ...(task.batchParam || { paramName: '', paramValues: [] }), enabled: val } }) },
    { id: 'chain', icon: LinkIcon, title: '任务链触发', desc: '成功后调用下一任务', checked: !!task.nextTaskId, onChange: (val: boolean) => updateTask({ nextTaskId: val ? (availableTasks[0]?.id || '') : undefined }) },
    { id: 'notify', icon: Bell, title: '结果通知', desc: '自动发送执行报告', checked: !!task.notificationConfigId, onChange: (val: boolean) => updateTask({ notificationConfigId: val ? (availableConfigs[0]?.id || '') : undefined }) },
    { id: 'monitor', icon: LineChart, title: '运行监控', desc: '收集结果供监控面板', checked: !!task.monitorEnabled, onChange: (val: boolean) => updateTask({ monitorEnabled: val, monitorMode: val ? (task.monitorMode || 'normal') : undefined }) }
  ]
  const activeCardData = configCards.find(c => c.id === activeConfigCard)

  return (
    <div className="h-full flex flex-col p-3">
      <div className="flex items-center mb-3 shrink-0">
        <div 
          className="border rounded-xl px-4 py-2 bg-gray-800 border-gray-700 shadow-sm"
          style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)' }}
        >
          <h3 
            className="font-bold text-[13px] tracking-widest text-gray-300"
            style={{ color: 'var(--text-secondary)' }}
          >
            全局任务配置
          </h3>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col pt-1">
        {!activeConfigCard ? (
          <>
            <div className="grid grid-cols-2 gap-2">
              {configCards.map(c => (
                <div
                  key={c.id}
                  onClick={() => setActiveConfigCard(c.id)}
                  className="rounded-xl p-2.5 flex flex-col gap-1 cursor-pointer hover:-translate-y-[2px] transition-all group shadow-sm relative overflow-hidden animate-in fade-in zoom-in-95 duration-300 border"
                  style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)' }}
                >
                  <div className="flex justify-between items-center relative z-10">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300 delay-150 ${c.checked ? 'bg-primary' : ''}`}
                      style={!c.checked ? { backgroundColor: 'var(--bg-surface)', color: 'var(--text-muted)' } : undefined}
                    >
                      <c.icon
                        size={14}
                        className={`transition-colors duration-300 ${c.checked ? 'text-white' : 'group-hover:text-primary'}`}
                      />
                    </div>
                    <div
                      className={`w-8 h-4 rounded-full relative transition-colors ${c.checked ? 'bg-primary' : 'bg-gray-700'}`}
                      onClick={(e) => { e.stopPropagation(); c.onChange(!c.checked) }}
                    >
                      <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-transform ${c.checked ? 'translate-x-4' : 'translate-x-0'}`} />
                    </div>
                  </div>
                  <div className="relative z-10 mt-2">
                    <h4 className="text-[14px] font-bold transition-colors group-hover:text-[var(--accent)]" style={{ color: 'var(--text-primary)' }}>{c.title}</h4>
                    <p className="text-[12px] mt-0.5 leading-tight" style={{ color: 'var(--text-muted)' }}>{c.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col h-full animate-in slide-in-from-right-4 fade-in duration-300 relative">
            <div className="flex justify-between items-center mt-1 mb-2 shrink-0 relative">
              <button
                onClick={() => {
                  if (activeConfigCard === 'schedule' && (!task.scheduleType || task.scheduleType === 'time')) {
                    updateTask({ schedule: (task.schedule || []).filter(t => t && t.trim() !== '') });
                  }
                  setActiveConfigCard(null);
                }}
                className="flex items-center gap-1 text-[12px] font-bold transition-colors px-2.5 py-1 rounded-md border shadow-sm hover:opacity-80"
                style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--primary)', color: 'var(--primary)' }}
              >
                <ChevronLeft size={14} /> 返回
              </button>

              {activeConfigCard === 'schedule' && (
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex bg-gray-900 rounded-lg p-0.5 border border-gray-700 shadow-inner w-fit">
                  <button className={`px-4 py-1 text-[12px] font-bold rounded-md transition-all ${(!task.scheduleType || task.scheduleType === 'time') ? 'bg-gray-700 text-primary shadow-sm' : 'text-gray-500 hover:text-gray-300'}`} onClick={() => updateTask({ scheduleType: 'time' })}>时刻</button>
                  <button className={`px-4 py-1 text-[12px] font-bold rounded-md transition-all ${task.scheduleType === 'frequency' ? 'bg-gray-700 text-primary shadow-sm' : 'text-gray-500 hover:text-gray-300'}`} onClick={() => updateTask({ scheduleType: 'frequency' })}>频率</button>
                </div>
              )}

              {activeCardData && (
                <button
                  onClick={() => activeCardData.onChange(!activeCardData.checked)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border shadow-sm group cursor-pointer transition-all duration-300 delay-150 ${activeCardData.checked ? 'bg-primary border-transparent' : ''}`}
                  style={!activeCardData.checked ? { backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-muted)' } : undefined}
                >
                  <activeCardData.icon
                    size={12}
                    className={`transition-colors duration-300 ${activeCardData.checked ? 'text-white opacity-100' : 'opacity-80 group-hover:text-primary'}`}
                  />
                  <span
                    className={`text-[12px] font-bold transition-colors duration-300 ${activeCardData.checked ? 'text-white' : 'group-hover:text-primary'}`}
                  >
                    {activeCardData.title}
                  </span>
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 thin-scrollbar pr-1">
              {activeConfigCard === 'schedule' && (
                <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-2">
                  {(!task.scheduleType || task.scheduleType === 'time') && (
                    <>
                      <div className="text-[12px] -mb-1 leading-tight flex justify-between" style={{ color: 'var(--text-secondary)' }}>
                        <span>以本机时区为准自动触发。</span>
                        <span>已设: {(task.schedule || []).filter(t => t && t.trim() !== '').length}/12</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {Array.from({ length: 12 }).map((_, idx) => (
                          <div key={idx} className="flex items-center bg-gray-800/30 rounded-lg pl-2 pr-1 py-1 border border-transparent hover:border-gray-700 transition-colors">
                            <span className="text-xs text-gray-300 font-mono w-4 shrink-0">{idx + 1}.</span>
                            <input type="time" className="w-full bg-transparent text-[13px] font-medium text-gray-300 px-1 outline-none focus:text-primary transition-colors cursor-pointer" value={(task.schedule || [])[idx] || ''} onChange={e => {
                              const newArr = [...(task.schedule || [])]
                              while (newArr.length < 12) newArr.push('')
                              newArr[idx] = e.target.value
                              updateTask({ schedule: newArr })
                            }} />
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {task.scheduleType === 'frequency' && (
                    <>
                      <div className="text-[12px] -mb-1 leading-tight" style={{ color: 'var(--text-secondary)' }}>设置固定时间间隔循环运行。启动引擎后开始计时。</div>
                      <div className="flex flex-col gap-3 bg-gray-800/40 p-2.5 rounded-lg border border-gray-700 shadow-inner">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-bold shrink-0 pl-1" style={{ color: 'var(--text-secondary)' }}>每隔</span>
                          <input 
                            type="number" min="1" 
                            max={task.scheduleFrequency?.unit === 'hours' ? 24 : task.scheduleFrequency?.unit === 'minutes' ? 1440 : 86400}
                            className="bg-gray-900 text-sm text-primary px-3 py-1 rounded-lg outline-none border border-gray-600 focus:border-primary w-20 text-center font-mono font-bold shadow-sm" value={task.scheduleFrequency?.value ?? ''} onChange={e => {
                            const raw = e.target.value;
                            let val: number | '' = raw === '' ? '' : parseInt(raw);
                            const unit = task.scheduleFrequency?.unit || 'hours';
                            const maxVal = unit === 'hours' ? 24 : unit === 'minutes' ? 1440 : 86400;
                            if (typeof val === 'number' && val > maxVal) val = maxVal;
                            updateTask({ scheduleFrequency: { value: val as any, unit, startTime: task.scheduleFrequency?.startTime, endTime: task.scheduleFrequency?.endTime } });
                          }} />
                          <select className="bg-gray-900 text-[13px] text-gray-300 px-2 py-1 rounded-lg outline-none border border-gray-600 focus:border-primary flex-1 cursor-pointer font-medium shadow-sm appearance-none" style={{ backgroundImage: 'linear-gradient(45deg, transparent 50%, gray 50%), linear-gradient(135deg, gray 50%, transparent 50%)', backgroundPosition: 'calc(100% - 14px) calc(1em + 1px), calc(100% - 10px) calc(1em + 1px)', backgroundSize: '4px 4px, 4px 4px', backgroundRepeat: 'no-repeat' }} value={task.scheduleFrequency?.unit || 'hours'} onChange={e => {
                            const newUnit = e.target.value as any;
                            const maxVal = newUnit === 'hours' ? 24 : newUnit === 'minutes' ? 1440 : 86400;
                            let val = task.scheduleFrequency?.value || 1;
                            if (val > maxVal) val = maxVal;
                            updateTask({ scheduleFrequency: { value: val, unit: newUnit, startTime: task.scheduleFrequency?.startTime, endTime: task.scheduleFrequency?.endTime } });
                          }}>
                            <option value="hours">小时执行一次</option>
                            <option value="minutes">分钟执行一次</option>
                            <option value="seconds">秒执行一次</option>
                          </select>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[13px] font-bold shrink-0 pl-1" style={{ color: 'var(--text-secondary)' }}>起止时间 (可选)</span>
                          <input 
                            type="time" 
                            className="bg-gray-900 text-sm font-mono text-gray-300 px-1 py-1 rounded-lg outline-none border border-gray-600 focus:border-primary flex-1 text-center"
                            value={task.scheduleFrequency?.startTime || ''}
                            onChange={e => updateTask({ scheduleFrequency: { ...(task.scheduleFrequency || { value: 1, unit: 'hours' }), startTime: e.target.value } })}
                          />
                          <span className="text-gray-500 text-[13px] font-bold">至</span>
                          <input 
                            type="time" 
                            className="bg-gray-900 text-sm font-mono text-gray-300 px-1 py-1 rounded-lg outline-none border border-gray-600 focus:border-primary flex-1 text-center"
                            value={task.scheduleFrequency?.endTime || ''}
                            onChange={e => updateTask({ scheduleFrequency: { ...(task.scheduleFrequency || { value: 1, unit: 'hours' }), endTime: e.target.value } })}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {activeConfigCard === 'batch' && (
                <div className="flex flex-col gap-3 h-full animate-in fade-in slide-in-from-top-2">
                  <BatchParamEditor />
                </div>
              )}

              {activeConfigCard === 'chain' && (
                <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-2">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-medium" style={{ color: 'var(--text-secondary)' }}>选择要触发的任务</label>
                    <select className="bg-gray-800 text-[13px] text-gray-300 px-2.5 py-1.5 rounded-lg outline-none border border-gray-700 focus:border-primary w-full appearance-none" style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M5 7l5 5 5-5'/%3e%3c/svg%3e")`, backgroundPosition: 'right 6px center', backgroundRepeat: 'no-repeat', backgroundSize: '1.2em 1.2em', paddingRight: '28px' }} value={task.nextTaskId || ''} onChange={e => updateTask({ nextTaskId: e.target.value })}>
                      <option value="">-- 不触发任何任务 --</option>
                      {availableTasks.map(t => (
                        <option key={t.id} value={t.id}>{t.name || '未命名任务'}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {activeConfigCard === 'notify' && (
                <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-2">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-medium" style={{ color: 'var(--text-secondary)' }}>选择通知模板</label>
                    <select className="bg-gray-800 text-[13px] text-gray-300 px-2.5 py-1.5 rounded-lg outline-none border border-gray-700 focus:border-primary w-full appearance-none" style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M5 7l5 5 5-5'/%3e%3c/svg%3e")`, backgroundPosition: 'right 6px center', backgroundRepeat: 'no-repeat', backgroundSize: '1.2em 1.2em', paddingRight: '28px' }} value={task.notificationConfigId || ''} onChange={e => updateTask({ notificationConfigId: e.target.value })}>
                      <option value="">-- 不发送通知 --</option>
                      {availableConfigs.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {activeConfigCard === 'monitor' && (
                <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-2">
                  <div className="text-[12px] -mb-1 leading-tight" style={{ color: 'var(--text-secondary)' }}>
                    收集此任务的执行结果供监控面板展示。<br />图表模式需要输出结果包含数值。
                  </div>
                  <div className="flex gap-2">
                    <label className={`flex-1 py-1.5 border rounded flex items-center justify-center gap-1.5 cursor-pointer text-[13px] transition-colors ${task.monitorMode === 'normal' || !task.monitorMode ? 'bg-primary/20 border-primary/50 text-primary font-bold' : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'}`}>
                      <input type="radio" className="hidden" checked={task.monitorMode === 'normal' || !task.monitorMode} onChange={() => updateTask({ monitorMode: 'normal' })} />
                      <span className={`w-2 h-2 rounded-full border border-current ${task.monitorMode === 'normal' || !task.monitorMode ? 'bg-primary' : ''}`}></span>
                      常规模式
                    </label>
                    <label
                      className={`flex-1 py-1.5 border rounded flex items-center justify-center gap-1.5 cursor-pointer text-[13px] transition-colors ${task.monitorMode === 'chart' ? 'bg-primary/20 border-primary/50 text-primary font-bold' : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'}`}
                      title="需要结果中包含可识别的数值"
                    >
                      <input type="radio" className="hidden" checked={task.monitorMode === 'chart'} onChange={() => updateTask({ monitorMode: 'chart' })} />
                      <span className={`w-2 h-2 rounded-full border border-current ${task.monitorMode === 'chart' ? 'bg-primary' : ''}`}></span>
                      图表模式
                    </label>
                  </div>
                  <div className="flex flex-col gap-1.5 mt-2">
                    <label className="text-[12px] font-medium" style={{ color: 'var(--text-secondary)' }}>选择要记录的输出变量</label>
                    <div className="bg-gray-800/40 rounded border border-gray-700 p-2 flex flex-col gap-1.5 max-h-[150px] overflow-y-auto thin-scrollbar">
                      {(() => {
                        const allVars: string[] = [];
                        task.steps?.forEach(s => {
                          if (s.outputVariable) allVars.push(s.outputVariable);
                          if (s.networkRequestConfig?.capsules) {
                            s.networkRequestConfig.capsules.forEach((c: any) => {
                              if (c.variableName && c.variableName.trim() !== '') {
                                allVars.push(c.variableName);
                              }
                            });
                          }
                        });
                        const uniqueVars = Array.from(new Set(allVars));

                        if (uniqueVars.length === 0) {
                          return <div className="text-[11px] text-gray-500 text-center py-2">暂无可用变量，请在步骤中配置输出变量</div>;
                        }

                        return uniqueVars.map(varName => {
                          const isNormal = task.monitorMode === 'normal' || !task.monitorMode;
                          let currentSelected = isNormal ? task.monitorSelectedVarsNormal : task.monitorSelectedVarsChart;
                          
                          if (currentSelected === undefined) {
                            if (isNormal) {
                              currentSelected = uniqueVars;
                              setTimeout(() => updateTask({ monitorSelectedVarsNormal: currentSelected }), 0);
                            } else {
                              const heuristicRegex = /price|num|rate|cost|amount|count|percent|money|数值|额|率|量|verbrauch|preis|anzahl|kosten|menge/i;
                              currentSelected = uniqueVars.filter(v => heuristicRegex.test(v));
                              setTimeout(() => updateTask({ monitorSelectedVarsChart: currentSelected }), 0);
                            }
                          }

                          const isChecked = currentSelected?.includes(varName);

                          return (
                            <label key={varName} className="flex items-center gap-2 cursor-pointer group">
                              <input
                                type="checkbox"
                                className="hidden"
                                checked={!!isChecked}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  let newSelected = [...(currentSelected || [])];
                                  if (checked && !newSelected.includes(varName)) newSelected.push(varName);
                                  if (!checked) newSelected = newSelected.filter(v => v !== varName);

                                  if (isNormal) {
                                    updateTask({ monitorSelectedVarsNormal: newSelected });
                                  } else {
                                    updateTask({ monitorSelectedVarsChart: newSelected });
                                  }
                                }}
                              />
                              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isChecked ? 'bg-primary border-primary' : 'bg-gray-900 border-gray-600 group-hover:border-gray-500'}`}>
                                {isChecked && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                              </div>
                              <span className="text-[12px] text-gray-300 font-mono flex-1 truncate group-hover:text-white transition-colors">{varName}</span>
                            </label>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-1 shrink-0">
              <button
                onClick={() => {
                  if (activeConfigCard === 'schedule' && (!task.scheduleType || task.scheduleType === 'time')) {
                    updateTask({ schedule: (task.schedule || []).filter(t => t && t.trim() !== '') });
                  }
                  setActiveConfigCard(null);
                }}
                className="w-full py-2 rounded-lg text-sm font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-2"
                style={{ backgroundColor: 'var(--success)', color: '#fff' }}
              >
                <Save size={16} className="fill-white/20" /> 保存与返回
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
