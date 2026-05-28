import React from 'react'
import { useTask } from '../context/TaskContext'

export default function BatchParamEditor() {
  const { task, updateTask } = useTask()
  const config = task.batchParam || { enabled: false, paramName: '', paramValues: [] }

  const handleAdd = () => {
    updateTask({
      batchParam: {
        ...config,
        paramValues: [...config.paramValues, { name: '', value: '' }]
      }
    })
  }

  const handleRemove = (idx: number) => {
    const newVals = [...config.paramValues]
    newVals.splice(idx, 1)
    updateTask({
      batchParam: { ...config, paramValues: newVals }
    })
  }

  const updateItem = (idx: number, field: 'name' | 'value', val: string) => {
    const newVals = [...config.paramValues]
    newVals[idx] = { ...newVals[idx], [field]: val }
    updateTask({
      batchParam: { ...config, paramValues: newVals }
    })
  }

  if (!config) return null

  return (
    <div className="w-full flex flex-col h-full animate-in fade-in slide-in-from-top-2">
      <div className="flex flex-col gap-1.5 mb-1">
        <label className="text-[12px] font-medium" style={{ color: 'var(--text-secondary)' }}>目标参数名 (如 sellerId)</label>
        <input 
          type="text" 
          placeholder="变量名，不包含 {{}}"
          className="bg-gray-800 text-xs text-gray-300 px-2.5 py-1.5 rounded outline-none border border-gray-700 focus:border-primary w-full"
          value={config.paramName}
          onChange={e => updateTask({ batchParam: { ...config, paramName: e.target.value } })}
        />
      </div>

      <div className="flex justify-between items-center mb-2 mt-2">
        <h4 className="text-[12px] font-bold" style={{ color: 'var(--text-secondary)' }}>运行参数列表 ({config.paramValues.length}/10)</h4>
        {config.paramValues.length >= 10 ? (
          <button className="text-xs bg-red-500/10 text-red-500 px-2 py-1 rounded border border-red-500/20 cursor-not-allowed">
            已达最大数量
          </button>
        ) : (
          <button onClick={handleAdd} className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-1 rounded border border-gray-600 transition-colors">
            + 添加参数组
          </button>
        )}
      </div>

      <div className="flex flex-col gap-1 flex-1 min-h-0 overflow-y-auto thin-scrollbar">
        {config.paramValues.map((item, idx) => (
          <div key={idx} className="flex items-center gap-1 bg-darkPanel p-1 rounded border border-gray-800 group">
            <span className="text-gray-500 font-mono text-[11px] w-4 text-center">{idx + 1}</span>
            <input 
              type="text" 
              placeholder="任务别名 (如 客户A)"
              className="w-1/3 bg-gray-800 text-xs text-gray-300 px-2.5 py-1.5 rounded outline-none border border-gray-700 focus:border-primary"
              value={item.name}
              onChange={e => updateItem(idx, 'name', e.target.value)}
            />
            <input 
              type="text" 
              placeholder="参数值 (如 10086)"
              className="flex-1 bg-gray-800 text-xs text-gray-300 px-2.5 py-1.5 rounded outline-none border border-gray-700 focus:border-primary"
              value={item.value}
              onChange={e => updateItem(idx, 'value', e.target.value)}
            />
            <button 
              onClick={() => handleRemove(idx)}
              className="opacity-50 group-hover:opacity-100 text-red-500 hover:bg-red-500/10 px-1.5 h-[28px] w-[28px] flex items-center justify-center rounded transition-all shrink-0 font-bold"
              title="删除此参数组"
            >
              ×
            </button>
          </div>
        ))}
        {config.paramValues.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-[11px] text-gray-600 py-3 border border-dashed border-gray-800 rounded">
            暂无参数组
          </div>
        )}
      </div>
    </div>
  )
}
