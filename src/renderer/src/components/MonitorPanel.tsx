import React, { useEffect, useState, useMemo } from 'react'
import { Activity, Download, Trash2, ChevronDown, ChevronRight, ChevronLeft, Calendar, BarChart2, LineChart as LineChartIcon } from 'lucide-react'
import { MonitorRecord, ScraperTask } from '../../../shared/types'
import { useTask } from '../context/TaskContext'
import { useModal } from '../context/ModalContext'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot, Legend } from 'recharts'

export default function MonitorPanel() {
  const { loadTask } = useTask()
  const modal = useModal()
  
  const [tasks, setTasks] = useState<ScraperTask[]>([])
  const [records, setRecords] = useState<MonitorRecord[]>([])
  const [selectedTaskId, setSelectedTaskId] = useState<string>('all')
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())
  const [selectedDates, setSelectedDates] = useState<Record<string, string>>({})
  const [renderCount, setRenderCount] = useState(1)

  useEffect(() => {
    if (renderCount < tasks.length) {
      const timer = setTimeout(() => {
        setRenderCount(c => c + 2)
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [renderCount, tasks.length])

  const fetchData = async () => {
    // @ts-ignore
    if (window.electronAPI) {
      // @ts-ignore
      const resT = await window.electronAPI.getAllTasks()
      const allTasks = resT?.data || []
      setTasks(allTasks)
      
      // @ts-ignore
      const resR = await window.electronAPI.getMonitorRecords()
      if (resR.success) setRecords(resR.data || [])
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const hasRecords = (taskId: string) => records.some(r => r.taskId === taskId)
  const monitorTasks = tasks.filter(t => hasRecords(t.id))
  
  const handleExport = async (taskId: string, format: 'csv' | 'txt') => {
    // @ts-ignore
    const res = await window.electronAPI.exportMonitorRecords(taskId, format)
    if (res.success && res.data) {
      modal.toast('导出成功！')
    }
  }

  const handleDelete = async (taskId: string) => {
    const ok = await modal.confirm({ title: '删除记录', message: '确定要清空该任务的所有监控记录吗？' })
    if (ok) {
      // @ts-ignore
      await window.electronAPI.deleteMonitorRecords(taskId)
      fetchData()
    }
  }

  const toggleExpand = (taskId: string) => {
    const next = new Set(expandedCards)
    if (next.has(taskId)) next.delete(taskId)
    else next.add(taskId)
    setExpandedCards(next)
  }

  const formatDate = (ts: number, short = false) => {
    const d = new Date(ts)
    if (short) {
      return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    }
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  const getDateKey = (ts: number) => {
    const d = new Date(ts)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  const renderDatePicker = (taskId: string, uniqueDates: string[], selectedDate: string, isMonitorEnabled: boolean) => {
    if (uniqueDates.length === 0) return null;

    const idx = uniqueDates.indexOf(selectedDate)
    const hasPrev = idx > 0
    const hasNext = idx !== -1 && idx < uniqueDates.length - 1

    return (
      <div className="flex items-center gap-2">
        {!isMonitorEnabled && (
          <span className="text-[11px] text-yellow-500 font-bold border border-yellow-500/30 bg-yellow-500/10 px-2 flex items-center h-[26px] rounded" title="该任务虽然产生了历史数据，但目前在编辑页面中未开启监控开关">
            运行监控设置未开启
          </span>
        )}
        <div className="flex items-center bg-gray-900 border border-gray-700 rounded shadow-inner overflow-hidden h-[26px]">
          <button 
          onClick={() => {
            if (hasPrev) setSelectedDates(prev => ({ ...prev, [taskId]: uniqueDates[idx - 1] }))
          }}
          disabled={!hasPrev}
          className={`px-1.5 h-full flex items-center justify-center transition-colors ${hasPrev ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-700 cursor-not-allowed'}`}
        >
          <ChevronLeft size={14} />
        </button>
        <div className="relative flex items-center border-l border-r border-gray-700 h-full group">
          <Calendar size={12} className="text-primary ml-2 mr-1 opacity-70" />
          <select
            className="bg-transparent text-[13px] text-gray-300 font-mono font-bold outline-none cursor-pointer appearance-none pl-1 pr-6 h-full"
            value={selectedDate}
            onChange={e => setSelectedDates(prev => ({ ...prev, [taskId]: e.target.value }))}
            style={{ WebkitAppRegion: 'no-drag' } as any}
          >
            {uniqueDates.map(d => (
              <option key={d} value={d} className="bg-gray-800">{d}</option>
            ))}
          </select>
          <ChevronDown size={12} className="text-gray-500 absolute right-2 pointer-events-none group-hover:text-gray-300 transition-colors" />
        </div>
        <button 
          onClick={() => {
            if (hasNext) setSelectedDates(prev => ({ ...prev, [taskId]: uniqueDates[idx + 1] }))
          }}
          disabled={!hasNext}
          className={`px-1.5 h-full flex items-center justify-center transition-colors ${hasNext ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-700 cursor-not-allowed'}`}
        >
          <ChevronRight size={14} />
        </button>
        </div>
      </div>
    )
  }

  const renderNormalCard = (task: ScraperTask, taskRecords: MonitorRecord[]) => {
    const uniqueDates = Array.from(new Set(taskRecords.map(r => getDateKey(r.timestamp)))).sort()
    const selectedDate = selectedDates[task.id] && uniqueDates.includes(selectedDates[task.id])
      ? selectedDates[task.id]
      : (uniqueDates.length > 0 ? uniqueDates[uniqueDates.length - 1] : '')
      
    const filteredRecords = taskRecords.filter(r => getDateKey(r.timestamp) === selectedDate)
    
    const latest = filteredRecords[filteredRecords.length - 1]
    const expanded = expandedCards.has(task.id)
    const history = [...filteredRecords].reverse().slice(0, expanded ? undefined : 5)
    
    return (
      <div key={task.id} className="bg-darkPanel border border-gray-800 rounded-xl p-5 mb-4 shadow-lg animate-slide-in-left">
        <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-3">
          <h3 className="text-lg font-bold text-gray-200 flex items-center gap-2">
            <Activity size={18} className="text-primary" />
            {task.name}
          </h3>
          <div className="flex items-center gap-2">
            {renderDatePicker(task.id, uniqueDates, selectedDate, !!task.monitorEnabled)}
            <div className="relative group">
              <button className="text-xs text-gray-400 hover:text-gray-200 px-2 h-[26px] flex items-center gap-1 border border-gray-700 rounded">
                导出 <ChevronDown size={12} />
              </button>
              <div className="absolute right-0 top-full mt-1 w-24 bg-gray-800 border border-gray-700 rounded shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                <button onClick={() => handleExport(task.id, 'csv')} className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-700 hover:text-white">.CSV 表格</button>
                <button onClick={() => handleExport(task.id, 'txt')} className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-700 hover:text-white">.TXT 文本</button>
              </div>
            </div>
            <button onClick={() => handleDelete(task.id)} className="text-gray-500 hover:text-red-400 p-1" title="清空记录"><Trash2 size={14} /></button>
          </div>
        </div>
        
        {latest ? (
          <>
            <div className="mb-2">
              <div className="text-xs text-gray-500 mb-0.5">最后采集：{formatDate(latest.timestamp)}</div>
              <div className="text-lg font-bold text-primary truncate" title={String(latest.primaryValue)}>{latest.primaryValue}</div>
            </div>
            
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-gray-400 font-bold mb-2">
                <span>历史记录 ({filteredRecords.length})</span>
                {filteredRecords.length > 5 && (
                  <button onClick={() => toggleExpand(task.id)} className="text-primary hover:underline">
                    {expanded ? '收起' : '展开全部'}
                  </button>
                )}
              </div>
              <div className="space-y-1">
                {history.map(r => (
                  <div key={r.id} className="flex flex-col py-1.5 border-t border-gray-800/50 first:border-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 font-mono">{formatDate(r.timestamp, true)}</span>
                      {r.batchValues ? (
                        <span className="text-sm font-bold text-gray-300 ml-4 line-clamp-2 leading-relaxed">
                          {r.batchValues.map(bv => `【${bv.alias}: ${bv.primaryValue}】`).join(' ')}
                        </span>
                      ) : (
                        <span className="text-sm font-bold text-gray-300">{r.primaryValue}</span>
                      )}
                    </div>
                    {Object.keys(r.variables).length > 1 && (
                      <div className="text-[10px] text-gray-600 mt-0.5 truncate">
                        其他变量: {Object.entries(r.variables).filter(([k]) => k !== Object.keys(r.variables)[0]).map(([k,v]) => `${k}=${v}`).join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-6 text-gray-500 text-sm">暂无数据记录</div>
        )}
      </div>
    )
  }

  const renderChartCard = (task: ScraperTask, taskRecords: MonitorRecord[]) => {
    const uniqueDates = Array.from(new Set(taskRecords.map(r => getDateKey(r.timestamp)))).sort()
    const selectedDate = selectedDates[task.id] && uniqueDates.includes(selectedDates[task.id])
      ? selectedDates[task.id]
      : (uniqueDates.length > 0 ? uniqueDates[uniqueDates.length - 1] : '')
      
    const filteredRecords = taskRecords.filter(r => getDateKey(r.timestamp) === selectedDate)

    const numRecords = filteredRecords.filter(r => (r.isNumeric && r.numericValue !== null) || (r.batchValues && r.batchValues.some(bv => bv.numericValue !== null)))
    
    // Outlier detection (skip for batch records to simplify)
    let outliers: MonitorRecord[] = []
    
    if (numRecords.length > 1 && !numRecords[0].batchValues) {
      const values = numRecords.map(r => r.numericValue as number)
      const mean = values.reduce((a, b) => a + b, 0) / values.length
      const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length
      const stdDev = Math.sqrt(variance)
      outliers = numRecords.filter(r => Math.abs((r.numericValue as number) - mean) > 3 * stdDev)
    }

    const unit = numRecords.length > 0 ? numRecords[0].unit : ''

    let domainMin: number | 'auto' | string = 'auto'
    let domainMax: number | 'auto' | string = 'auto'

    if (numRecords.length > 0) {
      if (unit === '%') {
        domainMin = 0
        domainMax = 100
      } else {
        let values: number[] = []
        if (numRecords[0].batchValues) {
          values = numRecords.flatMap(r => r.batchValues!.map(bv => bv.numericValue).filter(v => v !== null) as number[])
        } else {
          values = numRecords.map(r => r.numericValue as number)
        }
        
        if (values.length > 0) {
          const min = Math.min(...values)
          const max = Math.max(...values)
          if (min === max) {
            domainMin = min * 0.95
            domainMax = max * 1.05
          } else {
            const pad = (max - min) * 0.1
            domainMin = min - pad
            domainMax = max + pad
          }
        }
      }
    }

    const data = numRecords.map(r => {
      const base: any = {
        ...r,
        timeLabel: formatDate(r.timestamp, true)
      }
      if (r.batchValues) {
        r.batchValues.forEach(bv => {
          if (bv.numericValue !== null) {
            base[bv.alias] = bv.numericValue;
          }
        })
      }
      return base;
    })

    const isBatchChart = numRecords.length > 0 && numRecords.some(r => !!r.batchValues);
    const batchAliases = isBatchChart ? Array.from(new Set(numRecords.flatMap(r => r.batchValues ? r.batchValues.map(bv => bv.alias) : []))) : [];
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#eab308', '#6366f1'];

    return (
      <div key={task.id} className="bg-darkPanel border border-gray-800 rounded-xl p-5 mb-4 shadow-lg flex flex-col h-[400px] animate-slide-in-left">
        <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-3 shrink-0">
          <h3 className="text-lg font-bold text-gray-200 flex items-center gap-2">
            <LineChartIcon size={18} className="text-primary" />
            {task.name} <span className="text-xs text-gray-500 font-normal ml-2">({data.length} 条数值记录)</span>
          </h3>
          <div className="flex items-center gap-2">
            {renderDatePicker(task.id, uniqueDates, selectedDate, !!task.monitorEnabled)}
            <div className="relative group">
              <button className="text-xs text-gray-400 hover:text-gray-200 px-2 h-[26px] flex items-center gap-1 border border-gray-700 rounded">
                导出 <ChevronDown size={12} />
              </button>
              <div className="absolute right-0 top-full mt-1 w-24 bg-gray-800 border border-gray-700 rounded shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                <button onClick={() => handleExport(task.id, 'csv')} className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-700 hover:text-white">.CSV 表格</button>
                <button onClick={() => handleExport(task.id, 'txt')} className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-700 hover:text-white">.TXT 文本</button>
              </div>
            </div>
            <button onClick={() => handleDelete(task.id)} className="text-gray-500 hover:text-red-400 p-1" title="清空记录"><Trash2 size={14} /></button>
          </div>
        </div>
        
        {data.length > 0 ? (
          <div className="flex-1 min-h-0 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis dataKey="timeLabel" stroke="#9ca3af" fontSize={11} tickMargin={10} />
                <YAxis 
                  domain={[domainMin, domainMax]} 
                  stroke="#9ca3af" 
                  fontSize={11} 
                  tickFormatter={(val) => {
                    const num = Number(val)
                    if (isNaN(num)) return `${val}`
                    if (Math.abs(num) >= 1000000) return `${(num / 1000000).toFixed(1)}M${unit}`
                    return `${Number.isInteger(num) ? num : num.toFixed(2)}${unit}`
                  }}
                  width={65}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '8px' }}
                  itemStyle={{ color: '#e5e7eb', fontWeight: 'bold' }}
                  labelStyle={{ color: '#9ca3af', marginBottom: '4px' }}
                  formatter={(value: any, name: any) => [`${value}${unit}`, isBatchChart ? name : '数值'] as any}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px', color: '#9ca3af' }} />
                {!isBatchChart && (
                  <Line 
                    type="monotone" 
                    dataKey="numericValue" 
                    name="数值 (单次)"
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: '#60a5fa', strokeWidth: 0 }}
                    isAnimationActive={false}
                    connectNulls={true}
                  />
                )}
                {isBatchChart && batchAliases.map((alias, idx) => (
                  <Line 
                    key={alias}
                    type="monotone" 
                    dataKey={alias} 
                    name={alias}
                    stroke={colors[idx % colors.length]} 
                    strokeWidth={2}
                    dot={{ r: 3, fill: colors[idx % colors.length], strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: colors[idx % colors.length], strokeWidth: 0 }}
                    isAnimationActive={false}
                    connectNulls={true}
                  />
                ))}
                {outliers.map((o) => (
                  <ReferenceDot 
                    key={o.id} 
                    x={formatDate(o.timestamp, true)} 
                    y={o.numericValue as number} 
                    r={5} 
                    fill="#f59e0b" 
                    stroke="none" 
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
            暂无包含数值的可视化记录
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-darkBg">
      <style>{`
        @keyframes slideInLeft {
          0% {
            opacity: 0;
            transform: translateX(-30px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slide-in-left {
          animation: slideInLeft 0.3s ease-out forwards;
        }
      `}</style>
      <div className="pr-3 pt-6 pb-4 shrink-0 flex items-center justify-between" style={{ paddingLeft: '32px', WebkitAppRegion: 'drag' } as any}>
        <div>
          <h1 className="text-2xl font-bold text-gray-200 flex items-center gap-2">
            <Activity className="text-primary" />
            运行监控
          </h1>
          <p className="text-gray-500 text-sm mt-1">查看和导出爬虫任务的历史运行数据</p>
        </div>
        
        {monitorTasks.length > 0 && (
          <select 
            className="bg-gray-900 text-sm text-gray-300 px-3 py-2 rounded-lg outline-none border border-gray-700 focus:border-primary"
            value={selectedTaskId}
            onChange={e => setSelectedTaskId(e.target.value)}
            style={{ WebkitAppRegion: 'no-drag' } as any}
          >
            <option value="all">所有监控任务</option>
            {monitorTasks.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        )}
      </div>

      <div 
        className="flex-1 px-3 pb-6 overflow-y-auto w-full [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {monitorTasks.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-gray-500">
            <Activity size={48} className="opacity-20 mb-4" />
            <p>暂无开启监控的任务。</p>
            <p className="text-xs mt-2">请在“配置器”页面的全局参数中，勾选“开启运行监控”。</p>
          </div>
        ) : (
          <div className="space-y-6">
            {monitorTasks
              .filter(t => selectedTaskId === 'all' || t.id === selectedTaskId)
              .map((task, index) => {
                const isRendered = index < renderCount;
                if (!isRendered) {
                  return (
                    <div key={task.id} className="bg-darkPanel border border-gray-800 rounded-xl p-5 mb-4 shadow-lg flex items-center justify-center h-[200px]">
                      <div className="flex flex-col items-center gap-2 text-gray-500 animate-pulse">
                         <Activity size={24} className="opacity-50" />
                         <span className="text-sm">渲染图表中...</span>
                      </div>
                    </div>
                  )
                }

                const taskRecords = records.filter(r => r.taskId === task.id)
                if (task.monitorMode === 'chart') {
                  return renderChartCard(task, taskRecords)
                }
                return renderNormalCard(task, taskRecords)
            })}
          </div>
        )}
      </div>
    </div>
  )
}
