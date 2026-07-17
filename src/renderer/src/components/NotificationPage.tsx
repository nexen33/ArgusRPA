import React, { useEffect, useState } from 'react'
import { Bell, Save, Activity, RefreshCw, Plus, Trash2, Edit2, Play } from 'lucide-react'
import { NotificationConfig, ScraperTask } from '../../../shared/types'
import { useModal } from '../context/ModalContext'

export default function NotificationPage() {
  const modal = useModal()
  // --- Global Settings State ---
  const [slackBotToken, setSlackBotToken] = useState('')
  const [slackAppToken, setSlackAppToken] = useState('')
  const [slackWebhook, setSlackWebhook] = useState('')
  const [feishuWebhook, setFeishuWebhook] = useState('')
  const [feishuSigningSecret, setFeishuSigningSecret] = useState('')
  const [feishuKeywords, setFeishuKeywords] = useState('')
  const [isEditingKeywords, setIsEditingKeywords] = useState(false)

  const [savingGlobal, setSavingGlobal] = useState(false)
  const [globalMessage, setGlobalMessage] = useState('')
  const [slackTesting, setSlackTesting] = useState(false)
  const [slackMessage, setSlackMessage] = useState('')
  const [feishuTesting, setFeishuTesting] = useState(false)
  const [feishuMessage, setFeishuMessage] = useState('')

  // --- Advanced Configs State ---
  const [configs, setConfigs] = useState<NotificationConfig[]>([])
  const [editingConfig, setEditingConfig] = useState<Partial<NotificationConfig> | null>(null)
  const [savingConfig, setSavingConfig] = useState(false)

  // Test Modal State
  const [showTestModal, setShowTestModal] = useState(false)
  const [testRows, setTestRows] = useState<Record<string, string>[]>([{}]) // For mock data
  const [testResult, setTestResult] = useState('')
  const [isTesting, setIsTesting] = useState(false)

  // Cursor Tracking State
  const [cursorState, setCursorState] = useState<{ field: 'template' | 'summaryTemplate' | 'localTemplate', start: number, end: number } | null>(null);

  // Variables Helper
  const [availableVars, setAvailableVars] = useState<string[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    // @ts-ignore
    if (!window.electronAPI) return;

    // Load Global Config
    // @ts-ignore
    const globalRes = await window.electronAPI.getNotificationConfig()
    const globalConf = globalRes?.data || {}
    setSlackBotToken(globalConf.slackBotToken || '')
    setSlackAppToken(globalConf.slackAppToken || '')
    setSlackWebhook(globalConf.slackWebhookUrl || '')
    setFeishuWebhook(globalConf.feishuWebhookUrl || '')
    setFeishuSigningSecret(globalConf.feishuSigningSecret || '')
    setFeishuKeywords(globalConf.feishuKeywords || '监控,消耗,启动,停止,%,聚光,时间,指令,程序,数值')

    // Load Advanced Configs
    // @ts-ignore
    const advRes = await window.electronAPI.getAllNotificationConfigs()
    setConfigs(advRes?.data || [])

    // Load tasks to extract available variables
    // @ts-ignore
    const tasksRes = await window.electronAPI.getAllTasks()
    const tasks: ScraperTask[] = tasksRes?.data || []
    const vars = new Set<string>()
    tasks.forEach(t => {
      if (t.batchParam?.enabled && t.batchParam.paramName) {
        vars.add(t.batchParam.paramName)
      }
      t.steps.forEach(s => {
        if (s.outputVariable) vars.add(s.outputVariable)
      })
    })
    
    // 添加系统内置变量
    vars.add('_SYS_CURRENT_TIME_')
    vars.add('_SYS_CURRENT_DATE_')
    vars.add('_SYS_CURRENT_DATETIME_')
    vars.add('multi_parameter_name')
    vars.add('_SYS_SKIPPED_POPUPS_')
    
    setAvailableVars(Array.from(vars))
  }

  const showTempMessage = (setter: any, msg: string) => {
    setter(msg);
    setTimeout(() => setter(''), 5000);
  }

  // --- Global Settings Handlers ---
  const handleSaveGlobal = async () => {
    setSavingGlobal(true)
    setGlobalMessage('')
    try {
      // @ts-ignore
      await window.electronAPI.saveNotificationConfig({
        slackBotToken, slackAppToken, slackWebhookUrl: slackWebhook,
        feishuWebhookUrl: feishuWebhook,
        feishuSigningSecret,
        feishuKeywords
      })
      showTempMessage(setGlobalMessage, '✅ 全局配置已保存')
    } catch (e: any) {
      showTempMessage(setGlobalMessage, '❌ 保存失败: ' + e.message)
    } finally {
      setSavingGlobal(false)
    }
  }

  const testSlack = async () => {
    setSlackTesting(true)
    setSlackMessage('')
    try {
      // @ts-ignore
      const res = await window.electronAPI.testSlackConnection()
      if (res.success) {
        showTempMessage(setSlackMessage, '✅ Slack 验证成功！(请在 Slack 发送 "启动" 测试)')
      } else {
        showTempMessage(setSlackMessage, '❌ 验证失败: ' + res.error)
      }
    } catch (e: any) {
      showTempMessage(setSlackMessage, '❌ 测试出错: ' + e.message)
    } finally {
      setSlackTesting(false)
    }
  }

  const testFeishu = async () => {
    setFeishuTesting(true)
    setFeishuMessage('')
    try {
      // @ts-ignore
      const res = await window.electronAPI.testFeishuConnection(feishuWebhook, feishuSigningSecret, feishuKeywords)
      if (res.success) {
        showTempMessage(setFeishuMessage, '✅ Lark/飞书 验证成功！请检查Bot消息')
      } else {
        showTempMessage(setFeishuMessage, '❌ 发送失败: ' + formatErrorMsg(res.error))
      }
    } catch (e: any) {
      showTempMessage(setFeishuMessage, '❌ 测试出错: ' + e.message)
    } finally {
      setFeishuTesting(false)
    }
  }

  // --- Advanced Config Handlers ---
  const handleNewConfig = () => {
    setEditingConfig({
      id: Math.random().toString(36).substr(2, 9),
      name: '新通知配置',
      platform: [],
      feishuWebhookUrl: '',
      slackWebhookUrl: '',
      prefix: '【ArgusBot】',
      template: '',
      batchMode: 'each',
      summaryTemplate: '{{#each rows}}\n- 结果: {{example}}\n{{/each}}'
    })
  }

  const handleSaveConfig = async () => {
    if (!editingConfig || !editingConfig.id) return;
    setSavingConfig(true)
    try {
      // @ts-ignore
      await window.electronAPI.saveAdvancedNotificationConfig(editingConfig)
      await loadData()
      setEditingConfig(null)
    } catch (e: any) {
      alert('保存失败: ' + e.message)
    } finally {
      setSavingConfig(false)
    }
  }

  const handleDeleteConfig = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const confirmed = await modal.confirm({ title: '确认删除', message: '确定要删除该通知模板吗？此操作无法撤销。' });
    if (!confirmed) return;
    // @ts-ignore
    await window.electronAPI.deleteNotificationConfig(id)
    if (editingConfig?.id === id) setEditingConfig(null)
    await loadData()
  }

  const formatErrorMsg = (msg: string) => {
    if (!msg) return '未知错误';
    let result = msg;
    if (result.includes('sign match fail') || result.includes('timestamp is not within one hour')) {
      result = '飞书签名校验失败（秘钥不匹配或系统时间不准确）';
    } else if (result.includes('Timeout')) {
      result = '请求超时，请检查网络';
    } else if (result.includes('Key Words Not Found')) {
      result = '未包含自定义关键词\n（请同时注意模式使用唯一性，请检查机器人后台校验方式，只可二选一）';
    }
    return result;
  }

  const handleTestNotification = async () => {
    if (!editingConfig) return;
    setIsTesting(true)
    setTestResult('发送中...')
    try {
      if (editingConfig.batchMode === 'summary') {
        const batchResults = testRows.map(row => ({ row: {}, variables: row }))
        // @ts-ignore
        const res = await window.electronAPI.testNotification(editingConfig, { __testRows: testRows })
        if (res.success) showTempMessage(setTestResult, '✅ 测试发送成功')
        else showTempMessage(setTestResult, '❌ 发送失败: ' + formatErrorMsg(res.error))
      } else {
        // @ts-ignore
        const res = await window.electronAPI.testNotification(editingConfig, testRows[0] || {})
        if (res.success) showTempMessage(setTestResult, '✅ 测试发送成功')
        else showTempMessage(setTestResult, '❌ 发送失败: ' + formatErrorMsg(res.error))
      }
    } catch (e: any) {
      showTempMessage(setTestResult, '❌ 错误: ' + formatErrorMsg(e.message))
    } finally {
      setIsTesting(false)
    }
  }

  const MaskedInput = ({ value, onChange, maskType, placeholder }: { value: string, onChange: (v: string) => void, maskType: 'slack' | 'feishu' | 'none', placeholder: string }) => {
    const [focused, setFocused] = useState(false);
    let displayValue = value;
    if (!focused && value) {
      if (maskType === 'slack' && value.length > 12) {
        displayValue = value.substring(0, 12) + '•'.repeat(Math.max(0, value.length - 12));
      } else if (maskType === 'feishu' && value.length > 8) {
        displayValue = '•'.repeat(Math.max(0, value.length - 8)) + value.substring(value.length - 8);
      }
    }
    return (
      <input
        type="text"
        value={displayValue}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder-gray-600"
        placeholder={placeholder}
      />
    );
  }

  const togglePlatform = (p: 'feishuLark' | 'slack' | 'local') => {
    if (!editingConfig) return;
    const platforms = editingConfig.platform || [];
    if (platforms.includes(p)) {
      setEditingConfig({ ...editingConfig, platform: platforms.filter(x => x !== p) })
    } else {
      setEditingConfig({ ...editingConfig, platform: [...platforms, p] })
    }
  }

  const paddedInputs = Array.from({ length: 10 }, (_, i) => {
    const arr = feishuKeywords.split(',').map(k => k.trim())
    return arr[i] || ''
  })

  const updateKeyword = (index: number, value: string) => {
    const safeValue = value.replace(/,/g, '');
    const newArr = [...paddedInputs];
    newArr[index] = safeValue;
    setFeishuKeywords(newArr.join(','));
  }

  const handleTextareaCursor = (e: React.SyntheticEvent<HTMLTextAreaElement>, field: 'template' | 'summaryTemplate' | 'localTemplate') => {
    const target = e.target as HTMLTextAreaElement;
    setCursorState({ field, start: target.selectionStart, end: target.selectionEnd });
  }

  const handleVariableClick = (v: string) => {
    const textToInsert = `{{${v}}}`;
    navigator.clipboard.writeText(textToInsert);
    
    if (cursorState && editingConfig) {
      const field = cursorState.field;
      let currentValue = editingConfig[field] || '';
      if (field === 'localTemplate' && editingConfig.localTemplate === undefined) {
         currentValue = '[聚光提示] 任务执行完毕\n摘要: {{#each rows}} {{SellerId}}: {{Progress}} {{/each}}';
      }
      
      const newValue = currentValue.substring(0, cursorState.start) + textToInsert + currentValue.substring(cursorState.end);
      setEditingConfig({ ...editingConfig, [field]: newValue });
      
      // Update cursor position so they can keep clicking to insert consecutively
      setCursorState({
        field,
        start: cursorState.start + textToInsert.length,
        end: cursorState.start + textToInsert.length
      });
      
      modal.toast(`已复制并键入: ${textToInsert}`);
    } else {
      modal.toast(`已复制: ${textToInsert}`);
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-darkBg h-full overflow-hidden">
      <div className="pr-3 pt-6 pb-4 shrink-0 flex items-center justify-between" style={{ paddingLeft: '32px', WebkitAppRegion: 'drag' } as any}>
        <div>
          <h1 className="text-2xl font-bold text-gray-200 flex items-center gap-2">
            <Bell className="text-primary" />
            消息推送 & 远程控制
          </h1>
          <p className="text-gray-500 text-sm mt-1">全局接入 Token 与多套独立消息模板配置区</p>
        </div>
      </div>

      <div className="flex-1 flex gap-6 px-3 pb-6 overflow-hidden">
        {/* 左侧：全局配置区 */}
        <div className="w-1/3 border border-gray-800 rounded-xl p-5 space-y-3 bg-darkPanel flex flex-col">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-200 border-b border-gray-800 pb-2">Slack 配置</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 font-bold mb-1 block">Bot Token (xoxb-)</label>
                <MaskedInput maskType="slack" value={slackBotToken} onChange={setSlackBotToken} placeholder="xoxb-..." />
              </div>
              <div>
                <label className="text-xs text-gray-400 font-bold mb-1 block">App Token (xapp-)</label>
                <MaskedInput maskType="slack" value={slackAppToken} onChange={setSlackAppToken} placeholder="xapp-..." />
              </div>
              <button
                onClick={testSlack} disabled={slackTesting || !slackBotToken}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 rounded-xl text-sm transition-colors disabled:opacity-50 w-full justify-center mt-2"
              >
                {slackTesting ? <RefreshCw size={14} className="animate-spin" /> : <Activity size={14} />} 测试 Slack 通道
              </button>
              <div className="min-h-[16px] text-xs text-gray-400 text-center">{slackMessage}</div>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex justify-between items-center border-b border-gray-800 pb-2">
              <h2 className="text-lg font-bold text-gray-200">Lark & 飞书 配置</h2>
              <div className="relative">
                {feishuSigningSecret ? (
                  <div className="px-3 py-1 rounded-full bg-gray-500/10 text-gray-400 text-xs border border-gray-600/30 cursor-not-allowed" title="请注意模式使用唯一性">签名模式</div>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        const nextState = !isEditingKeywords;
                        setIsEditingKeywords(nextState);
                        if (!nextState) {
                          // Trigger save when closing
                          handleSaveGlobal();
                        }
                      }}
                      className={`px-3 py-1 rounded-full text-xs border flex items-center gap-1.5 transition-all ${isEditingKeywords
                        ? 'bg-green-600 text-white border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.2)]'
                        : 'bg-green-600/80 text-white border-green-500/50 hover:bg-green-600'
                        }`}
                    >
                      关键词模式 {isEditingKeywords ? <Save size={12} /> : <Edit2 size={12} />}
                    </button>

                    {isEditingKeywords && (
                      <div className="absolute right-0 top-full mt-3 w-[320px] bg-darkPanel border border-gray-700 rounded-xl shadow-2xl z-50 p-4">
                        <div className="text-xs text-gray-400 mb-4 flex items-center justify-between border-b border-gray-800/50 pb-2">
                          <span className="font-medium text-gray-300">自定义关键词 <span className="text-gray-500 font-normal">(用于安全嗅探)</span></span>
                          <span className="text-green-500/70 font-mono bg-green-500/10 px-1.5 py-0.5 rounded">{paddedInputs.filter(Boolean).length}/10</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2.5">
                          {paddedInputs.map((kw, idx) => (
                            <input
                              key={idx}
                              type="text"
                              value={kw}
                              onChange={e => updateKeyword(idx, e.target.value)}
                              placeholder={`关键词 ${idx + 1}`}
                              className="bg-gray-900 text-gray-200 border border-gray-700 rounded-xl px-2.5 py-1.5 text-xs outline-none focus:border-green-500/50 focus:bg-gray-800 focus:shadow-[0_0_8px_rgba(34,197,94,0.15)] transition-all placeholder-gray-600"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 font-bold mb-1 block">Webhook URL</label>
                <MaskedInput maskType="feishu" value={feishuWebhook} onChange={setFeishuWebhook} placeholder="https://..." />
              </div>
              <div>
                <label className="text-xs text-gray-400 font-bold mb-1 block">签名校验（可选）</label>
                <input
                  type="password"
                  value={feishuSigningSecret}
                  onChange={e => setFeishuSigningSecret(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder-gray-600"
                  placeholder="填写后无需自定义词即可推送"
                />
              </div>
              <button
                onClick={testFeishu} disabled={feishuTesting || !feishuWebhook}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 rounded-xl text-sm transition-colors disabled:opacity-50 w-full justify-center mt-2"
              >
                {feishuTesting ? <RefreshCw size={14} className="animate-spin" /> : <Activity size={14} />} 发送 Webhook测试
              </button>
              <div className="min-h-[16px] text-xs text-gray-400 text-center whitespace-pre-line">{feishuMessage}</div>
            </div>
          </section>

          <div className="mt-auto pt-3 pb-0 border-t border-gray-800 shrink-0">
            <button
              onClick={handleSaveGlobal} disabled={savingGlobal}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-blue-600 border border-primary text-white rounded-xl font-bold transition-colors disabled:opacity-50 shadow-lg shadow-primary/20"
            >
              {savingGlobal ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
              {savingGlobal ? '保存中...' : '保存全局配置'}
            </button>
            <div className="min-h-[20px] text-sm font-medium text-gray-300 text-center mt-1">{globalMessage}</div>
          </div>
        </div>

        {/* 右侧：高级通知配置 */}
        <div className="w-2/3 flex flex-col gap-6">
          {/* 编辑区 */}
          <div className="flex-1 p-6 overflow-y-auto bg-darkPanel border border-gray-800 rounded-xl">
            {editingConfig ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                  <h2 className="text-lg font-bold text-gray-200">编辑通知模板</h2>
                  <div className="flex gap-2">
                    <button onClick={() => setShowTestModal(true)} className="px-3 py-1.5 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-xl text-sm font-bold flex items-center gap-1">
                      <Play size={14} /> 模拟发送
                    </button>
                    <button onClick={handleSaveConfig} disabled={savingConfig} className="px-4 py-1.5 bg-primary text-white hover:bg-blue-600 rounded-xl text-sm font-bold flex items-center gap-1">
                      <Save size={14} /> 保存
                    </button>
                    <button onClick={() => setEditingConfig(null)} className="px-3 py-1.5 bg-gray-700 text-gray-200 hover:bg-gray-600 rounded-xl text-sm">取消</button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-400 font-bold">配置名称</label>
                    <input type="text" value={editingConfig.name} onChange={e => setEditingConfig({ ...editingConfig, name: e.target.value })} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-200 focus:border-primary outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-400 font-bold">消息前缀</label>
                    <input type="text" value={editingConfig.prefix} onChange={e => setEditingConfig({ ...editingConfig, prefix: e.target.value })} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-200 focus:border-primary outline-none" placeholder="例如：【ArgusBot】" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs text-gray-400 font-bold">批量任务发送模式</label>
                    <select value={editingConfig.batchMode} onChange={e => setEditingConfig({ ...editingConfig, batchMode: e.target.value as 'each' | 'summary' })} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-200 focus:border-primary outline-none appearance-none" style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M5 7l5 5 5-5'/%3e%3c/svg%3e")`, backgroundPosition: 'right 8px center', backgroundRepeat: 'no-repeat', backgroundSize: '1.2em 1.2em', paddingRight: '32px' }}>
                      <option value="each">逐条发送 (每个结果发一条消息)</option>
                      <option value="summary">汇总发送 (将所有结果汇总成一条大消息)</option>
                    </select>
                  </div>

                  <div className="space-y-4">
                    <label className="text-xs text-gray-400 font-bold">推送目标配置</label>

                    <div className="space-y-3">
                      <div className="flex items-center gap-6">
                        <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                          <input type="checkbox" checked={editingConfig.platform?.includes('feishuLark')} onChange={() => togglePlatform('feishuLark')} className="accent-primary" /> 飞书/Lark
                        </label>
                        <div className="flex items-center">
                          <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                            <input type="checkbox" checked={editingConfig.platform?.includes('slack')} onChange={() => togglePlatform('slack')} className="accent-primary" /> Slack
                          </label>
                          {editingConfig.platform?.includes('slack') && (
                            <span className="text-xs text-gray-500 ml-0.5 relative top-[0.5px]">（全局配置）</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                            <input type="checkbox" checked={editingConfig.platform?.includes('local')} onChange={() => togglePlatform('local')} className="accent-primary" /> 本机系统通知
                          </label>
                        </div>
                      </div>

                      {editingConfig.platform?.includes('feishuLark') && (
                        <div className="flex items-center gap-2">
                          <input type="text" value={editingConfig.feishuWebhookUrl || ''} onChange={e => setEditingConfig({ ...editingConfig, feishuWebhookUrl: e.target.value })} className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-200 focus:border-primary outline-none" placeholder="输入飞书/Lark Webhook URL" />
                          <button
                            onClick={() => {
                              if (editingConfig.feishuWebhookUrl === feishuWebhook && feishuWebhook) {
                                setEditingConfig({ ...editingConfig, feishuWebhookUrl: '' })
                              } else if (feishuWebhook) {
                                setEditingConfig({ ...editingConfig, feishuWebhookUrl: feishuWebhook })
                              }
                            }}
                            className={`px-3 h-[37px] flex items-center justify-center text-xs font-bold rounded-xl border transition-colors shrink-0 ${editingConfig.feishuWebhookUrl === feishuWebhook && feishuWebhook ? 'bg-primary text-white border-primary' : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700'}`}
                            title={feishuWebhook ? '点击使用全局配置的 Webhook' : '请先在左侧配置全局 Webhook'}
                          >
                            使用全局默认
                          </button>
                        </div>
                      )}

                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-1 space-y-1">
                    <label className="text-xs text-gray-400 font-bold">单条模板 (支持 <code>{`{{var}}`}</code>)</label>
                    <textarea
                      value={editingConfig.template}
                      onChange={e => setEditingConfig({ ...editingConfig, template: e.target.value })}
                      onSelect={e => handleTextareaCursor(e, 'template')}
                      onClick={e => handleTextareaCursor(e, 'template')}
                      onKeyUp={e => handleTextareaCursor(e, 'template')}
                      className="w-full h-32 bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-200 focus:border-primary outline-none font-mono resize-none"
                      placeholder="抓取成功！结果：{{variable1}}"
                    />
                  </div>
                  {editingConfig.batchMode === 'summary' && (
                    <div className="flex-1 space-y-1">
                      <label className="text-xs font-bold" style={{ color: 'var(--warning)' }}>汇总模板 (必须包含 <code>{`{{#each rows}}...{{/each}}`}</code>)</label>
                      <textarea
                        value={editingConfig.summaryTemplate || ''}
                        onChange={e => setEditingConfig({ ...editingConfig, summaryTemplate: e.target.value })}
                        onSelect={e => handleTextareaCursor(e, 'summaryTemplate')}
                        onClick={e => handleTextareaCursor(e, 'summaryTemplate')}
                        onKeyUp={e => handleTextareaCursor(e, 'summaryTemplate')}
                        className="w-full h-32 bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-200 focus:border-primary outline-none font-mono resize-none"
                        placeholder={'汇总报告：\n{{#each rows}}\n- 账号: {{account}}\n{{/each}}'}
                      />
                    </div>
                  )}
                </div>

                {editingConfig.platform?.includes('local') && (
                  <div className="space-y-1">
                    <label className="text-xs text-gray-400 font-bold">本机系统通知推送</label>
                    <textarea
                      value={editingConfig.localTemplate !== undefined ? editingConfig.localTemplate : '[聚光提示] 任务执行完毕\n摘要: {{#each rows}} {{SellerId}}: {{Progress}} {{/each}}'}
                      onChange={e => setEditingConfig({ ...editingConfig, localTemplate: e.target.value })}
                      onSelect={e => handleTextareaCursor(e, 'localTemplate')}
                      onClick={e => handleTextareaCursor(e, 'localTemplate')}
                      onKeyUp={e => handleTextareaCursor(e, 'localTemplate')}
                      className="w-full h-24 bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-200 focus:border-primary outline-none font-mono resize-none"
                    />
                  </div>
                )}

                {availableVars.length > 0 && (
                  <div className="p-3 rounded-lg border border-gray-700 w-full" style={{ backgroundColor: 'rgba(128, 128, 128, 0.1)' }}>
                    <span className="text-xs text-gray-500 font-bold mr-2">任务中出现的输出变量 (点击复制):</span>
                    <div className="flex flex-wrap gap-2 mt-2 w-full">
                      {[
                        ...availableVars.filter(v => v.startsWith('_SYS_') || v === 'multi_parameter_name'),
                        ...availableVars.filter(v => !v.startsWith('_SYS_') && v !== 'multi_parameter_name')
                      ].map(v => (
                        <span 
                          key={v} 
                          onClick={() => handleVariableClick(v)}
                          title="点击复制并键入到光标处"
                          className="px-2 py-1 bg-gray-900 hover:bg-gray-800 cursor-pointer border border-transparent hover:border-gray-600 text-gray-300 text-xs rounded-xl font-mono select-none transition-colors active:bg-gray-700"
                        >
                          {`{{${v}}}`}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-4">
                <Bell size={48} className="opacity-20" />
                <p>从下方选择一个配置进行编辑，或创建一个新配置</p>
                <button onClick={handleNewConfig} className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-blue-600 text-white rounded-xl font-bold transition-colors shadow-lg shadow-primary/20">
                  <Plus size={16} /> 新建通知配置
                </button>
              </div>
            )}
          </div>

          {/* 列表区 */}
          <div className="shrink-0 max-h-64 bg-darkPanel border border-gray-800 rounded-xl p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-200">已保存的设置 {configs.length}</h3>
              {!editingConfig && (
                <button onClick={handleNewConfig} className="text-primary hover:text-blue-400 flex items-center gap-1 text-sm font-bold">
                  <Plus size={16} /> 新建
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {configs.map(c => (
                <div
                  key={c.id}
                  onClick={() => setEditingConfig(c)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer group ${editingConfig?.id === c.id ? 'bg-primary/10 border-primary' : 'bg-gray-900 border-gray-700 hover:border-gray-600 hover:bg-gray-800'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-gray-200 truncate pr-4">{c.name}</h4>
                    <button onClick={(e) => handleDeleteConfig(c.id, e)} className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {c.platform?.map(p => (
                      <span key={p} className="text-[10px] px-1.5 py-0.5 rounded-xl bg-gray-700 text-gray-200 font-bold uppercase tracking-wider">
                        {p === 'feishuLark' ? '飞书/Lark' : p}
                      </span>
                    ))}
                  </div>
                  <div className="text-xs text-gray-500 truncate mt-1">
                    <span className="text-gray-600">内容: </span>{c.batchMode === 'summary' ? (c.summaryTemplate || '空') : (c.template || '空')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 模拟测试弹窗 */}
      {showTestModal && editingConfig && (
        <div className="fixed inset-1.5 rounded-xl overflow-hidden z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-darkPanel border border-gray-800 p-6 rounded-xl shadow-2xl max-w-xl w-full">
            <h2 className="text-lg font-bold text-white mb-2">模拟数据发送测试</h2>
            <p className="text-xs text-gray-400 mb-6">请输入模板中使用的变量 mock 数据进行联调发送。</p>

            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
              {testRows.map((row, rIdx) => (
                <div key={rIdx} className="p-3 border border-gray-800 rounded-xl bg-gray-900 space-y-3 relative">
                  <div className="text-xs font-bold text-gray-500 border-b border-gray-800 pb-2 flex justify-between">
                    <span>行数据 {rIdx + 1}</span>
                    {testRows.length > 1 && (
                      <button onClick={() => setTestRows(testRows.filter((_, i) => i !== rIdx))} className="text-red-400 hover:text-red-300">删除</button>
                    )}
                  </div>
                  {/* Extract variables from template to show inputs */}
                  {Array.from(new Set([
                    ...((editingConfig.template || '').match(/{{([\w]+)}}/g) || []),
                    ...((editingConfig.summaryTemplate || '').match(/{{([\w]+)}}/g) || [])
                  ])).map(match => {
                    const vName = match.replace(/[{}]/g, '');
                    if (vName === '#each rows' || vName === '/each') return null;
                    return (
                      <div key={vName} className="flex items-center gap-3">
                        <label className="text-xs text-gray-400 w-24 truncate" title={vName}>{vName}:</label>
                        <input
                          type="text"
                          value={row[vName] || ''}
                          onChange={e => {
                            const newRows = [...testRows];
                            newRows[rIdx] = { ...newRows[rIdx], [vName]: e.target.value };
                            setTestRows(newRows);
                          }}
                          className="flex-1 bg-darkBg border border-gray-700 rounded-xl px-2 py-1 text-sm text-gray-200 outline-none focus:border-primary"
                        />
                      </div>
                    )
                  })}
                </div>
              ))}

              {editingConfig.batchMode === 'summary' && (
                <button onClick={() => setTestRows([...testRows, {}])} className="w-full py-2 border border-dashed border-gray-700 rounded-xl text-gray-400 hover:text-white hover:border-gray-500 text-sm flex items-center justify-center gap-2 transition-colors">
                  <Plus size={14} /> 添加一行 Mock 数据
                </button>
              )}
            </div>

            {testResult && (
              <div className="mt-4 p-3 rounded-xl bg-gray-900 border border-gray-800 text-sm text-gray-300 whitespace-pre-line">
                {testResult}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowTestModal(false)} className="px-4 py-2 bg-gray-800 text-gray-300 hover:bg-gray-700 rounded-xl text-sm transition-colors">关闭</button>
              <button onClick={handleTestNotification} disabled={isTesting} className="px-4 py-2 bg-primary hover:bg-blue-600 text-white font-bold rounded-xl text-sm transition-colors flex items-center gap-2">
                {isTesting ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />} 立即发送
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
