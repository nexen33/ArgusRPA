import React, { useEffect, useState } from 'react'
import { Bell, Save, Activity, RefreshCw, Plus, Trash2, Edit2, Play, ChevronDown, ChevronUp, Code, Info, Flag, Globe, Copy } from 'lucide-react'
import { NotificationConfig, ScraperTask } from '../../../shared/types'
import { useModal } from '../context/ModalContext'

let globalNotificationSaveTimer: NodeJS.Timeout | null = null;

export default function NotificationPage() {
  const modal = useModal()
  // --- Global Settings State ---
  const [slackBotToken, setSlackBotToken] = useState('')
  const [slackAppToken, setSlackAppToken] = useState('')
  const [slackWebhook, setSlackWebhook] = useState('')
  const [feishuWebhook, setFeishuWebhook] = useState('')
  const [feishuSigningSecret, setFeishuSigningSecret] = useState('')
  const [feishuKeywords, setFeishuKeywords] = useState('')
  const [larkAppId, setLarkAppId] = useState('')
  const [larkAppSecret, setLarkAppSecret] = useState('')
  const [isEditingKeywords, setIsEditingKeywords] = useState(false)
  const [isSlackOpen, setIsSlackOpen] = useState(false)
  const [showApiInfoModal, setShowApiInfoModal] = useState(false)
  const [activePort, setActivePort] = useState(47990)
  const [showPlatformPopover, setShowPlatformPopover] = useState(false)
  const timerRef = React.useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // @ts-ignore
    if (window.electronAPI && window.electronAPI.getActivePort) {
      // @ts-ignore
      window.electronAPI.getActivePort().then((res: any) => {
        if (res && res.success && res.data) {
          setActivePort(res.data);
        }
      }).catch(() => { });
    }
  }, []);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('api-modal-visible', { detail: showApiInfoModal }));
  }, [showApiInfoModal]);

  useEffect(() => {
    if (!showPlatformPopover) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.platform-popover-container')) {
        setShowPlatformPopover(false);
      }
    };
    window.addEventListener('click', handleOutsideClick);
    return () => {
      window.removeEventListener('click', handleOutsideClick);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [showPlatformPopover]);

  const triggerPlatformPopover = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowPlatformPopover(prev => {
      const next = !prev;
      if (next) {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          setShowPlatformPopover(false);
        }, 5000);
      }
      return next;
    });
  };

  const resetPopoverTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setShowPlatformPopover(false);
    }, 5000);
  };

  const [savingGlobal, setSavingGlobal] = useState(false)
  const [globalMessage, setGlobalMessage] = useState('')
  const [slackTesting, setSlackTesting] = useState(false)
  const [slackMessage, setSlackMessage] = useState('')
  const [feishuTesting, setFeishuTesting] = useState(false)
  const [feishuMessage, setFeishuMessage] = useState('')
  const [larkTesting, setLarkTesting] = useState(false)
  const [larkMessage, setLarkMessage] = useState('')

  // --- Advanced Configs State ---
  const [configs, setConfigs] = useState<NotificationConfig[]>([])
  const [editingConfig, setEditingConfig] = useState<Partial<NotificationConfig> | null>(() => {
    const draft = sessionStorage.getItem('argus-notification-draft');
    if (draft) {
      try { return JSON.parse(draft); } catch (e) { }
    }
    return null;
  })
  const [savingConfig, setSavingConfig] = useState(false)
  const editingConfigRef = React.useRef(editingConfig);

  useEffect(() => {
    if (globalNotificationSaveTimer) {
      clearTimeout(globalNotificationSaveTimer);
      globalNotificationSaveTimer = null;
    }

    return () => {
      const draftStr = sessionStorage.getItem('argus-notification-draft');
      if (draftStr) {
        let draft: any = null;
        try { draft = JSON.parse(draftStr); } catch (e) { }

        if (draft && draft.id) {
          globalNotificationSaveTimer = setTimeout(async () => {
            try {
              // @ts-ignore
              if (window.electronAPI && window.electronAPI.saveAdvancedNotificationConfig) {
                // @ts-ignore
                await window.electronAPI.saveAdvancedNotificationConfig(draft);
                sessionStorage.removeItem('argus-notification-draft');
              }
            } catch (e) { }
          }, 30000);
        }
      }
    };
  }, []);

  useEffect(() => {
    editingConfigRef.current = editingConfig;
    if (editingConfig) {
      sessionStorage.setItem('argus-notification-draft', JSON.stringify(editingConfig));
    } else {
      sessionStorage.removeItem('argus-notification-draft');
    }
  }, [editingConfig]);

  // Test Modal State
  const [showTestModal, setShowTestModal] = useState(false)
  const [testRows, setTestRows] = useState<Record<string, string>[]>([{}]) // For mock data
  const [testResult, setTestResult] = useState('')
  const [isTesting, setIsTesting] = useState(false)

  // Cursor Tracking State
  const [cursorState, setCursorState] = useState<{ field: 'prefix' | 'template' | 'summaryTemplate' | 'localTemplate', start: number, end: number } | null>(null);

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
    setLarkAppId(globalConf.larkAppId || '')
    setLarkAppSecret(globalConf.larkAppSecret || '')

    // Load Advanced Configs
    // @ts-ignore
    const advRes = await window.electronAPI.getAllNotificationConfigs()
    setConfigs(advRes?.data || [])

    // Load tasks to extract available variables
    // @ts-ignore
    const tasksRes = await window.electronAPI.getAllTasks()
    const tasks: ScraperTask[] = tasksRes?.data || []
    const vars = new Set<string>()
    const extractVarsFromSteps = (steps: any[]) => {
      if (!steps) return;
      steps.forEach(s => {
        if (s.outputVariable) vars.add(s.outputVariable)
        if (s.networkRequestConfig?.capsules) {
          s.networkRequestConfig.capsules.forEach((c: any) => {
            if (c.variableName && c.variableName.trim() !== '') {
              vars.add(c.variableName)
            }
          })
        }
        if (s.trueBranchSteps) extractVarsFromSteps(s.trueBranchSteps)
        if (s.falseBranchSteps) extractVarsFromSteps(s.falseBranchSteps)
      })
    }

    tasks.forEach(t => {
      if (t.batchParam?.enabled && t.batchParam.paramName) {
        vars.add(t.batchParam.paramName)
      }
      extractVarsFromSteps(t.steps)
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
        feishuKeywords,
        larkAppId,
        larkAppSecret
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

  const testLarkBot = async () => {
    if (!larkAppId || !larkAppSecret) {
      modal.toast('请先填写 App ID 和 App Secret');
      return;
    }
    setLarkTesting(true)
    setLarkMessage('')
    try {
      // @ts-ignore
      const res = await window.electronAPI.testLarkBotConnection(larkAppId, larkAppSecret)
      if (res.success) {
        showTempMessage(setLarkMessage, '✅ 测试发送成功');
      } else {
        showTempMessage(setLarkMessage, '❌ 发送失败: ' + res.error);
      }
    } catch (e: any) {
      let msg = e.message;
      if (msg.includes('is not a function')) {
        msg = '底层验证接口尚未装载，请重启桌面端进程 (npm run dev)';
      }
      showTempMessage(setLarkMessage, '❌ 测试出错: ' + msg)
    } finally {
      setLarkTesting(false)
    }
  }

  const handleExportBotScript = async (platformType: 'feishu' | 'lark') => {
    if (!larkAppId || !larkAppSecret) {
      showTempMessage(setLarkMessage, '❌ 请先填写 App ID 和 App Secret，然后再导出');
      return;
    }
    setLarkMessage('');
    setShowPlatformPopover(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    try {
      // @ts-ignore
      const res = await window.electronAPI.generateBotScript({ appId: larkAppId, appSecret: larkAppSecret, platformType });
      if (res.success) {
        showTempMessage(setLarkMessage, `✅ 脚本已成功生成至 Argus_issue/feishu_starter 目录 (${platformType === 'lark' ? 'Lark' : '飞书'}版)`);
      } else if (res.error !== '用户取消保存') {
        showTempMessage(setLarkMessage, '❌ 导出失败: ' + res.error);
      }
    } catch (e: any) {
      let msg = e.message;
      if (msg.includes('is not a function')) {
        msg = '底层接口尚未装载，请重启桌面端进程 (npm run dev)';
      }
      showTempMessage(setLarkMessage, '❌ 导出异常: ' + msg);
    }
  }

  // --- Advanced Config Handlers ---
  const handleNewConfig = () => {
    const newConf = {
      id: Math.random().toString(36).substr(2, 9),
      name: '新通知配置',
      platform: [],
      feishuWebhookUrl: '',
      slackWebhookUrl: '',
      prefix: '【ArgusBot】',
      template: '',
      batchMode: 'each' as const,
      summaryTemplate: '{{#each rows}}\n- 结果: {{example}}\n{{/each}}'
    };
    setEditingConfig(newConf)
  }

  const handleSaveConfig = async () => {
    if (!editingConfigRef.current || !editingConfigRef.current.id) return;
    const configToSave = editingConfigRef.current;

    setSavingConfig(true)
    try {
      // @ts-ignore
      await window.electronAPI.saveAdvancedNotificationConfig(configToSave)
      await loadData()
      setEditingConfig(null)
      sessionStorage.removeItem('argus-notification-draft')

      // 验证并用感叹号开头提醒用户配置全局信息
      if (configToSave.platform?.includes('websocket') && (!larkAppId || !larkAppSecret)) {
        modal.toast('请在左栏配置 Websocket 的 App ID 与 App Secret 以启用推送！');
      }
      if (configToSave.platform?.includes('slack') && (!slackWebhook && !slackBotToken)) {
        modal.toast('请在左栏配置 Slack 以启用 Slack 推送！');
      }
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
      } else if (maskType === 'feishu') {
        const prefixLen = value.startsWith('http') ? 16 : 8;
        if (value.length > prefixLen) {
          displayValue = value.substring(0, prefixLen) + '•'.repeat(Math.max(0, value.length - prefixLen));
        }
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

  const togglePlatform = (p: 'feishuLark' | 'slack' | 'local' | 'websocket') => {
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

  const handleInputCursor = (e: React.SyntheticEvent<HTMLInputElement | HTMLTextAreaElement>, field: 'prefix' | 'template' | 'summaryTemplate' | 'localTemplate') => {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement;
    setCursorState({ field, start: target.selectionStart || 0, end: target.selectionEnd || 0 });
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
    <div className="flex-1 flex flex-col bg-darkBg h-full overflow-hidden relative">
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
        <div className="w-1/3 border border-gray-800 rounded-xl bg-darkPanel flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto thin-scrollbar p-5 pb-2 space-y-2">
            <section>
              <h2
                className="text-lg font-bold border-b border-gray-800 dark:border-[var(--border)] pb-2 cursor-pointer flex items-center justify-between transition-opacity hover:opacity-80 select-none text-[var(--text-primary)]"
                onClick={() => setIsSlackOpen(!isSlackOpen)}
              >
                Slack 配置
                {isSlackOpen ? <ChevronUp size={18} className="text-gray-500" /> : <ChevronDown size={18} className="text-gray-500" />}
              </h2>
              <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${isSlackOpen ? 'max-h-[400px] opacity-100 mt-3' : 'max-h-0 opacity-0 mt-0'}`}
              >
                <div className="space-y-3 max-h-[300px] overflow-y-auto thin-scrollbar pr-1 pb-1">
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 font-bold mb-1 block">Bot Token (xoxb-)</label>
                    <MaskedInput maskType="slack" value={slackBotToken} onChange={setSlackBotToken} placeholder="xoxb-..." />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 font-bold mb-1 block">App Token (xapp-)</label>
                    <MaskedInput maskType="slack" value={slackAppToken} onChange={setSlackAppToken} placeholder="xapp-..." />
                  </div>
                  <button
                    onClick={testSlack} disabled={slackTesting || !slackBotToken}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 rounded-xl text-sm transition-colors disabled:opacity-50 w-full justify-center mt-2"
                  >
                    {slackTesting ? <RefreshCw size={14} className="animate-spin" /> : <Activity size={14} />} 测试 Slack 通道
                  </button>
                  <div className="min-h-[16px] text-xs text-gray-500 text-center">{slackMessage}</div>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <div className="flex justify-between items-center border-b border-gray-800 dark:border-[var(--border)] pb-2">
                <h2 className="text-lg font-bold text-gray-200">Lark & 飞书 配置</h2>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-gray-300 border-l-4 border-blue-500 pl-2 -ml-1">自定义机器人 (Webhook)</h3>
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
                          <div className="absolute right-0 top-full mt-3 w-[320px] bg-darkPanel border border-gray-700 rounded-xl shadow-2xl z-50 p-4 z-[60]">
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
                <div className="flex flex-col gap-1.5 !mt-2">
                  <button
                    onClick={testFeishu} disabled={feishuTesting || !feishuWebhook}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 rounded-xl text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full justify-center"
                  >
                    {feishuTesting ? <RefreshCw size={14} className="animate-spin" /> : <Activity size={14} />} 发送 Webhook 测试
                  </button>
                  <div className="min-h-[16px] text-xs text-gray-400 text-center whitespace-pre-line leading-tight">{feishuMessage}</div>
                </div>
              </div>

              <div className="space-y-3 pt-1 pb-1">
                <h3 className="text-sm font-bold text-gray-300 border-l-4 border-blue-500 pl-2 -ml-1 flex items-center">
                  交互机器人 (Websocket)
                  <span
                    className="ml-auto cursor-pointer"
                    title="点击查看 Argus API 配置信息"
                    onClick={() => setShowApiInfoModal(true)}
                  >
                    <Info size={18} className="text-gray-400 hover:text-primary transition-colors" />
                  </span>
                </h3>
                <div>
                  <label className="text-xs text-gray-400 font-bold mb-1 block">App ID (cli_...)</label>
                  <MaskedInput maskType="feishu" value={larkAppId} onChange={setLarkAppId} placeholder="cli_..." />
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-bold mb-1 block">App Secret</label>
                  <MaskedInput maskType="feishu" value={larkAppSecret} onChange={setLarkAppSecret} placeholder="..." />
                </div>
                <div className="flex flex-col gap-1.5 !mt-2">
                  <button
                    onClick={testLarkBot} disabled={larkTesting || !larkAppId || !larkAppSecret}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 rounded-xl text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full justify-center"
                  >
                    {larkTesting ? <RefreshCw size={14} className="animate-spin" /> : <Activity size={14} />} 发送 Websocket 测试
                  </button>
                  <div className="min-h-[16px] text-xs text-gray-400 text-center whitespace-pre-line leading-tight">{larkMessage}</div>
                </div>
                <div className="relative platform-popover-container w-full h-[34px] !mt-1" style={{ perspective: '800px' }}>
                  <div
                    className="w-full h-full transition-transform duration-500"
                    style={{
                      transformStyle: 'preserve-3d',
                      transform: showPlatformPopover ? 'rotateX(180deg)' : 'rotateX(0deg)'
                    }}
                  >
                    {/* Front Face: The Button */}
                    <div
                      className="absolute inset-0 w-full h-full"
                      style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                    >
                      <button
                        onClick={triggerPlatformPopover}
                        disabled={!larkAppId || !larkAppSecret}
                        className="flex items-center gap-1.5 px-4 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 rounded-xl text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full h-full justify-center font-bold"
                      >
                        <Code size={14} /> 一键生成 Python 监听脚本
                      </button>
                    </div>

                    {/* Back Face: Platform Options */}
                    <div
                      onMouseEnter={resetPopoverTimer}
                      onClick={resetPopoverTimer}
                      className="absolute inset-0 w-full h-full bg-darkPanel border border-gray-700 rounded-xl p-0.5 flex gap-1 shadow-2xl"
                      style={{
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        transform: 'rotateX(180deg)',
                        backgroundColor: 'var(--bg-panel)',
                        borderColor: 'var(--border)'
                      }}
                    >
                      <button
                        onClick={() => handleExportBotScript('feishu')}
                        className="flex-1 text-center text-xs rounded-lg transition-colors font-bold flex items-center justify-center gap-1.5 h-full"
                        style={{ color: 'var(--text-primary)', backgroundColor: 'transparent' }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                      >
                        <Flag size={13} className="text-red-500 fill-red-500/20 relative -top-[1px]" />
                        <span>飞书 (国内版)</span>
                      </button>
                      <button
                        onClick={() => handleExportBotScript('lark')}
                        className="flex-1 text-center text-xs rounded-lg transition-colors font-bold flex items-center justify-center gap-1.5 h-full"
                        style={{ color: 'var(--text-primary)', backgroundColor: 'transparent' }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.2)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                      >
                        <Globe size={13} className="text-blue-500 relative -top-[1px]" />
                        <span>Lark (海外版)</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="px-5 pt-3 pb-3 border-t border-gray-800 shrink-0">
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
                  <div className="flex items-center gap-3">
                    <div className="flex gap-2">
                      <button onClick={() => setShowTestModal(true)} className="px-3 py-1.5 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-xl text-sm font-bold flex items-center gap-1">
                        <Play size={14} /> 模拟发送
                      </button>
                      <button onClick={handleSaveConfig} disabled={savingConfig} className="px-4 py-1.5 bg-primary text-white hover:bg-blue-600 rounded-xl text-sm font-bold flex items-center gap-1">
                        <Save size={14} /> 保存
                      </button>
                      <button onClick={() => { setEditingConfig(null); sessionStorage.removeItem('argus-notification-draft'); }} className="px-3 py-1.5 bg-gray-700 text-gray-200 hover:bg-gray-600 rounded-xl text-sm">取消</button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-400 font-bold">配置名称</label>
                    <input type="text" value={editingConfig.name} onChange={e => setEditingConfig({ ...editingConfig, name: e.target.value })} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-200 focus:border-primary outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-400 font-bold">消息前缀 (支持 <code>{`{{var}}`}</code>)</label>
                    <input
                      type="text"
                      value={editingConfig.prefix}
                      onChange={e => setEditingConfig({ ...editingConfig, prefix: e.target.value })}
                      onSelect={e => handleInputCursor(e, 'prefix')}
                      onClick={e => handleInputCursor(e, 'prefix')}
                      onKeyUp={e => handleInputCursor(e, 'prefix')}
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-200 focus:border-primary outline-none"
                      placeholder="例如：【ArgusBot】"
                    />
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
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                          <input type="checkbox" checked={editingConfig.platform?.includes('feishuLark')} onChange={() => togglePlatform('feishuLark')} className="accent-primary" /> Webhook
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                          <input type="checkbox" checked={editingConfig.platform?.includes('websocket')} onChange={() => togglePlatform('websocket')} className="accent-primary" /> Websocket
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                          <input type="checkbox" checked={editingConfig.platform?.includes('slack')} onChange={() => togglePlatform('slack')} className="accent-primary" /> Slack
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                          <input type="checkbox" checked={editingConfig.platform?.includes('local')} onChange={() => togglePlatform('local')} className="accent-primary" /> 本机系统通知
                        </label>
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
                      onSelect={e => handleInputCursor(e, 'template')}
                      onClick={e => handleInputCursor(e, 'template')}
                      onKeyUp={e => handleInputCursor(e, 'template')}
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
                        onSelect={e => handleInputCursor(e, 'summaryTemplate')}
                        onClick={e => handleInputCursor(e, 'summaryTemplate')}
                        onKeyUp={e => handleInputCursor(e, 'summaryTemplate')}
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
                      onSelect={e => handleInputCursor(e, 'localTemplate')}
                      onClick={e => handleInputCursor(e, 'localTemplate')}
                      onKeyUp={e => handleInputCursor(e, 'localTemplate')}
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
                  onClick={() => {
                    setEditingConfig(c);
                  }}
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
                        {p === 'feishuLark' ? 'WEBHOOK' : p}
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
          <div
            className="border p-6 rounded-xl shadow-2xl max-w-xl w-full"
            style={{ backgroundColor: 'var(--bg-panel)', borderColor: 'var(--border)' }}
          >
            <h2 className="text-lg font-bold mb-2 pl-3" style={{ color: 'var(--text-primary)' }}>模拟数据发送测试</h2>
            <p className="text-sm font-bold mb-4 pl-3" style={{ color: 'var(--text-primary)' }}>请输入模板中使用的变量对应的测试数据进行发送</p>

            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
              {testRows.map((row, rIdx) => (
                <div
                  key={rIdx}
                  className="p-3 border rounded-xl space-y-3 relative"
                  style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)' }}
                >
                  <div className="text-xs font-bold border-b pb-2 flex justify-between" style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
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
                        <label className="text-xs w-[168px] truncate" title={vName} style={{ color: 'var(--text-primary)' }}>{vName}:</label>
                        <input
                          type="text"
                          value={row[vName] || ''}
                          onChange={e => {
                            const newRows = [...testRows];
                            newRows[rIdx] = { ...newRows[rIdx], [vName]: e.target.value };
                            setTestRows(newRows);
                          }}
                          className="flex-1 border rounded-xl px-2 py-1 text-sm outline-none focus:border-primary"
                          style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
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

      {showApiInfoModal && (
        <div className="absolute inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" style={{ WebkitAppRegion: 'no-drag' } as any}>
          {/* 仅在顶部 36px 范围内提供拖拽相应（排除卡片自身） */}
          <div className="absolute top-0 left-0 right-0 h-[36px]" style={{ WebkitAppRegion: 'drag' } as any} />
          <div
            className="border rounded-2xl w-[600px] shadow-2xl overflow-hidden flex flex-col relative z-10"
            style={{ backgroundColor: 'var(--bg-panel)', borderColor: 'var(--border)', WebkitAppRegion: 'no-drag' } as any}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 py-3 border-b flex items-center justify-between" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2">
                <Info size={18} className="text-primary" />
                <h2 className="text-[16px] font-bold tracking-wide" style={{ color: 'var(--text-primary)' }}>关于 Argus API (用于交互机器人)</h2>
              </div>
              <button
                onClick={() => setShowApiInfoModal(false)}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-gray-800/30 hover:opacity-100 relative z-50 cursor-pointer"
                style={{ color: 'var(--text-muted)' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ pointerEvents: 'none' }}>
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 flex flex-col gap-6" style={{ backgroundColor: 'var(--bg-main)' }}>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>什么是 Argus API？</h3>
                  <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    Argus 提供了服务于 Websocket 的双向通信接口。通过配置 App ID 和 App Secret，您可以将 Argus 深度集成到飞书等企业服务中，实现对 RPA 任务的任务查询、远程触发和结果接收。
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>如何配置？ (Win)</h3>
                  <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    1. <strong style={{ color: 'var(--text-primary)' }}>配置接收端 (飞书/Lark)</strong>：在飞书开放平台获取 App ID 与 Secret，并在左侧填入，用于建立 Websocket 接收飞书端下发的消息。<br />
                    2. <strong style={{ color: 'var(--text-primary)' }}>本机执行端 (Argus 本地 API)</strong>：Argus 启动后会在后台开放以下端口供外部程序调用，进行任务执行与查询：
                  </p>
                  <div className="flex flex-col gap-1.5 mt-1.5">
                    <div className="flex items-center gap-2 py-1 px-2 rounded-lg border shadow-inner" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
                      <span className="text-[11px] bg-emerald-600 text-white dark:bg-emerald-500/30 dark:text-emerald-300 font-bold px-1.5 py-0.5 rounded">GET</span>
                      <code className="flex-1 text-[13px] font-mono select-all" style={{ color: 'var(--text-primary)' }}>{`http://127.0.0.1:${activePort}/api/v1/tasks/web`}</code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`http://127.0.0.1:${activePort}/api/v1/tasks/web`);
                          modal.toast('已复制 Argus 查询 API (网页任务)');
                        }}
                        className="px-2 py-0.5 text-[11px] rounded-md hover:opacity-80 transition-opacity whitespace-nowrap border"
                        style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
                      >
                        复制
                      </button>
                    </div>
                    <div className="flex items-center gap-2 py-1 px-2 rounded-lg border shadow-inner" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
                      <span className="text-[11px] bg-emerald-600 text-white dark:bg-emerald-500/30 dark:text-emerald-300 font-bold px-1.5 py-0.5 rounded">GET</span>
                      <code className="flex-1 text-[13px] font-mono select-all" style={{ color: 'var(--text-primary)' }}>{`http://127.0.0.1:${activePort}/api/v1/tasks/desktop`}</code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`http://127.0.0.1:${activePort}/api/v1/tasks/desktop`);
                          modal.toast('已复制 Argus 查询 API (桌面任务)');
                        }}
                        className="px-2 py-0.5 text-[11px] rounded-md hover:opacity-80 transition-opacity whitespace-nowrap border"
                        style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
                      >
                        复制
                      </button>
                    </div>
                    <div className="flex items-center gap-2 py-1 px-2 rounded-lg border shadow-inner" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
                      <span className="text-[11px] bg-blue-600 text-white dark:bg-blue-500/30 dark:text-blue-300 font-bold px-1.5 py-0.5 rounded">POST</span>
                      <code className="flex-1 text-[13px] font-mono select-all" style={{ color: 'var(--text-primary)' }}>{`http://127.0.0.1:${activePort}/api/v1/tasks/<id>/execute`}</code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`http://127.0.0.1:${activePort}/api/v1/tasks/<id>/execute`);
                          modal.toast('已复制 Argus 执行 API');
                        }}
                        className="px-2 py-0.5 text-[11px] rounded-md hover:opacity-80 transition-opacity whitespace-nowrap border"
                        style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
                      >
                        复制
                      </button>
                    </div>
                    <div className="flex items-center gap-2 py-1 px-2 rounded-lg border shadow-inner" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
                      <span className="text-[11px] bg-blue-600 text-white dark:bg-blue-500/30 dark:text-blue-300 font-bold px-1.5 py-0.5 rounded">POST</span>
                      <code className="flex-1 text-[13px] font-mono select-all" style={{ color: 'var(--text-primary)' }}>{`http://127.0.0.1:${activePort}/api/v1/tasks/stop`}</code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`http://127.0.0.1:${activePort}/api/v1/tasks/stop`);
                          modal.toast('已复制 Argus 停止 API');
                        }}
                        className="px-2 py-0.5 text-[11px] rounded hover:opacity-80 transition-opacity whitespace-nowrap border"
                        style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
                      >
                        复制
                      </button>
                    </div>
                  </div>
                  <p className="text-[13px] leading-relaxed mt-2" style={{ color: 'var(--text-secondary)' }}>
                    3. <strong style={{ color: 'var(--text-primary)' }}>安装 Python 环境与依赖</strong>：运行脚本依赖 Python 3 环境，请在终端中执行以下命令安装飞书官方 SDK 库：
                    <code className="font-mono bg-[var(--bg-elevated)] px-1.5 py-0.5 rounded-md text-[12px] border mx-1" style={{ color: 'var(--primary)', borderColor: 'var(--border)' }}>pip install lark-oapi</code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText('pip install lark-oapi');
                        modal.toast('已复制依赖安装命令');
                      }}
                      className="inline-flex w-5 h-5 rounded-md border items-center justify-center hover:opacity-80 transition-opacity align-middle relative top-[-1px]"
                      style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                      title="复制命令"
                    >
                      <Copy size={11} />
                    </button>
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <h3 className="text-sm font-bold text-primary">一键接入</h3>
                  <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    为了方便您快速集成，Argus 提供了<strong style={{ color: 'var(--text-primary)' }}> 一键生成 Python 监听脚本 </strong>功能。<br />
                    系统会同时在 <code className="font-mono bg-[var(--bg-elevated)] px-1 rounded" style={{ color: 'var(--primary)' }}>feishu_starter</code> 目录下生成以下两个文件：<br />
                    1. <code className="font-mono bg-[var(--bg-elevated)] px-1 rounded" style={{ color: 'var(--primary)' }}>argus_bot_listener.py</code>：核心监听代码，实现了自动发送与消息对话框回传。<br />
                    2. <code className="font-mono bg-[var(--bg-elevated)] px-1 rounded" style={{ color: 'var(--primary)' }}>start_argus_bot.bat</code>：后台启动批处理脚本。<br />
                    <h3 className="text-sm font-bold mt-3 mb-1" style={{ color: 'var(--text-primary)' }}>如何让其后台运行和开机自启？</h3>
                    直接双击运行 <code className="font-mono bg-[var(--bg-elevated)] px-1 rounded" style={{ color: 'var(--primary)' }}>start_argus_bot.bat</code> 文件即可<strong style={{ color: 'var(--text-primary)' }}>在后台静默运行（无命令行窗口，自动调用 pythonw）</strong>。若希望开机自启，请按 <kbd className="bg-[var(--bg-elevated)] px-1 rounded shadow-sm text-xs" style={{ color: 'var(--text-primary)' }}>Win + R</kbd> 打开运行，输入 <code className="font-mono bg-[var(--bg-elevated)] px-1 rounded" style={{ color: 'var(--primary)' }}>shell:startup</code> 并确定，接着将 <code className="font-mono bg-[var(--bg-elevated)] px-1 rounded" style={{ color: 'var(--primary)' }}>start_argus_bot.bat</code> 创建快捷方式拖入该自启动文件夹中即可。
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t flex justify-end gap-3" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
              <button
                onClick={() => setShowApiInfoModal(false)}
                className="px-5 py-2 rounded-xl text-sm font-bold transition-opacity hover:opacity-80"
                style={{ backgroundColor: 'var(--accent)', color: '#ffffff' }}
              >
                我知道了
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
