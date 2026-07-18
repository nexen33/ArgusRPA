import React, { useState, useEffect } from 'react';
import { Target, Check, Trash2, Plus, ArrowRight, Loader2, X, Link as LinkIcon, MousePointer2, Search, RotateCcw } from 'lucide-react';
import { useModal } from '../../context/ModalContext';
import { useTask } from '../../context/TaskContext';

export function NetworkRequestEditor({ currentStep, updateCurrentStep, renderVarLabel }: any) {
  const modal = useModal();
  const { visitedUrls, task } = useTask();
  const [sniffStatus, setSniffStatus] = useState<'idle' | 'sniffing' | 'finished'>('idle');
  const [sniffUrl, setSniffUrl] = useState(currentStep?.networkRequestConfig?.sniffTargetUrl || '');
  const [sniffCountdown, setSniffCountdown] = useState(0);
  const [sniffedData, setSniffedData] = useState<Array<{ url: string, value: string, jsonPath: string, score?: number, matchType?: 'exact' | 'fuzzy' | 'none' }>>([]);
  const [expectedValues, setExpectedValues] = useState<string[]>(['']);
  const [editingExpectedIdx, setEditingExpectedIdx] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [showUrlHistory, setShowUrlHistory] = useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchActive && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchActive]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (sniffStatus === 'sniffing' && sniffCountdown > 0) {
      timer = setTimeout(() => setSniffCountdown(prev => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [sniffStatus, sniffCountdown]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 1000);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (currentStep?.networkRequestConfig?.sniffTargetUrl) {
      setSniffUrl(currentStep.networkRequestConfig.sniffTargetUrl);
    }
  }, [currentStep?.id]);

  useEffect(() => {
    return () => {
      // @ts-ignore
      if (window.electronAPI && window.electronAPI.cancelSniffNetwork) {
        // @ts-ignore
        window.electronAPI.cancelSniffNetwork().catch(() => {});
      }
    };
  }, []);

  const sortedSniffedData = React.useMemo(() => {
    let data = sniffedData.filter(d =>
      debouncedSearchQuery ? d.value.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) : true
    );
    const validExpected = expectedValues.filter(v => v.trim() !== '');

    if (validExpected.length === 0) {
      const scoredData = data.map(d => ({ ...d, score: 0, matchType: 'none' as const }));
      scoredData.sort((a, b) => a.value.localeCompare(b.value, 'zh-CN', { numeric: true }));
      return scoredData.slice(0, 300);
    }

    const scoredData = data.map(item => {
      let maxScore = 0;
      let matchType: 'exact' | 'fuzzy' | 'none' = 'none';

      for (const expected of validExpected) {
        if (item.value === expected) {
          maxScore = 100;
          matchType = 'exact';
          break;
        }

        // 应对接口按分/厘返回的情况 (例：接口 6000000，用户期望 60,000.00)
        const strippedExp = expected.replace(/[,.]/g, '');
        const strippedItem = item.value.replace(/[,.]/g, '');
        if (strippedItem === strippedExp && strippedItem !== '') {
          maxScore = 100;
          matchType = 'exact';
          break;
        }

        const expNumStr = expected.replace(/,/g, '');
        const itemNumStr = item.value.replace(/,/g, '');
        const expNum = Number(expNumStr);
        const itemNum = Number(itemNumStr);
        
        if (!isNaN(expNum) && !isNaN(itemNum) && expNum !== 0) {
          // 应对没有打点，但是存在百倍/万倍缩放的情况 (例：接口 6000000，用户期望 60000)
          const ratio = itemNum / expNum;
          if (ratio === 10 || ratio === 100 || ratio === 1000 || ratio === 10000 || 
              ratio === 0.1 || ratio === 0.01 || ratio === 0.001) {
             if (98 > maxScore) {
               maxScore = 98;
               matchType = 'fuzzy';
             }
          }

          const delta = Math.abs(itemNum - expNum) / Math.abs(expNum);
          if (delta <= 0.03) {
            const score = 99 - (delta * 100);
            if (score > maxScore) {
              maxScore = score;
              matchType = 'fuzzy';
            }
          }
        }

        // 智能应对用户偷懒未输小数位/分厘的场景（如：期望 "38893"，接口返回 "3889343" 乘以了100倍的值）
        // 得分控制在 [92, 94] 之间，置于 3% 差值匹配（[96, 99]）之后，无匹配（0）之前
        const expClean = expected.replace(/[^0-9]/g, '');
        const itemClean = item.value.replace(/[^0-9]/g, '');
        if (expClean !== '' && itemClean !== '') {
          if (itemClean.startsWith(expClean)) {
            const extraLen = itemClean.length - expClean.length;
            if (extraLen > 0 && extraLen <= 3) {
              const score = 95 - extraLen;
              if (score > maxScore) {
                maxScore = score;
                matchType = 'fuzzy';
              }
            }
          }
        }
      }
      return { ...item, score: maxScore, matchType };
    });
    scoredData.sort((a, b) => {
      if (b.score !== a.score) {
        return (b.score || 0) - (a.score || 0);
      }
      return a.value.localeCompare(b.value, 'zh-CN', { numeric: true });
    });

    // 强制截断，只返回前 300 条渲染到 DOM 中，防止万条数据导致 React 瘫痪卡死
    return scoredData.slice(0, 300);
  }, [sniffedData, debouncedSearchQuery, expectedValues]);

  if (currentStep.type !== 'network_request_variable') return null;

  const config = currentStep.networkRequestConfig || { urlKeyword: '', capsules: [] };

  const handleSniff = async () => {
    if (!sniffUrl) {
      modal.toast('请输入要加载的目标 URL');
      return;
    }
    setSniffStatus('sniffing');
    setSniffCountdown(20);
    setSniffedData([]);
    let currentConfig = { ...config, sniffTargetUrl: sniffUrl };
    updateCurrentStep({ networkRequestConfig: currentConfig });

    try {
      // @ts-ignore
      const res = await window.electronAPI.sniffNetwork(sniffUrl);
      if (res && res.success) {
        if (res.data && res.data.length > 0) {

          // === 智能高频去重算法 ===
          const valueCounts = new Map<string, number>();
          res.data.forEach((item: any) => {
            valueCounts.set(item.value, (valueCounts.get(item.value) || 0) + 1);
          });

          const addedValues = new Map<string, number>();
          const optimizedData = res.data.filter((item: any) => {
            const totalCount = valueCounts.get(item.value) || 0;
            if (totalCount > 5) {
              // 对于出现超过 5 次的高频无意义值，仅保留首个样本供点击
              const seen = addedValues.get(item.value) || 0;
              if (seen === 0) {
                addedValues.set(item.value, 1);
                return true;
              }
              return false;
            }
            return true; // 出现 <= 5 次的低频独特值，全部保留（防止误杀不同节点的同值属性）
          });

          if (res.data.length > optimizedData.length) {
            modal.toast(`原始 ${res.data.length} 条数据，高频去重后剩余 ${optimizedData.length} 条`);
          } else {
            modal.toast(`成功嗅探到 ${res.data.length} 个请求响应数据`);
          }

          setSniffedData(optimizedData);

          if (currentConfig.capsules.length === 0 && !currentConfig.urlKeyword && optimizedData.length > 0) {
            currentConfig = { ...currentConfig, urlKeyword: optimizedData[0].url };
            updateCurrentStep({ networkRequestConfig: currentConfig });
          }
        } else {
          modal.toast('未捕获到任何 JSON 响应，请检查页面是否有网络请求');
        }
      } else {
        if (res?.error !== 'User cancelled') {
          modal.toast('嗅探失败: ' + (res?.error || '未知错误'));
        }
      }
    } catch (e: any) {
      modal.toast('嗅探出错: ' + e.message);
    } finally {
      setSniffStatus(prev => prev === 'sniffing' ? 'finished' : prev);
      setSniffCountdown(0);
    }
  };

  const handleCancelSniff = async () => {
    // @ts-ignore
    await window.electronAPI.cancelSniffNetwork();
    setSniffStatus('idle');
    setSniffCountdown(0);
  };

  const handleReset = () => {
    setSniffStatus('idle');
    setSniffedData([]);
    setExpectedValues(['']);
    setSearchQuery('');
    setDebouncedSearchQuery('');
  };

  const handleUseCurrentUrl = () => {
    setSniffUrl(task.targetUrl || '');
  };

  const addFromSniffed = (item: { url: string, value: string, jsonPath: string }) => {
    const newCapsules = [...config.capsules, {
      value: item.value,
      url: item.url,
      jsonPath: item.jsonPath,
      hintName: '',
      variableName: ''
    }];
    updateCurrentStep({ networkRequestConfig: { ...config, urlKeyword: config.urlKeyword || item.url, capsules: newCapsules } });
    setSniffedData(sniffedData.filter(d => d !== item)); // Remove from pending list
  };

  const updateCapsule = (index: number, field: string, value: string) => {
    const newCapsules = [...config.capsules];
    newCapsules[index] = { ...newCapsules[index], [field]: value };
    updateCurrentStep({ networkRequestConfig: { ...config, capsules: newCapsules } });
  };

  const removeCapsule = (index: number) => {
    const newCapsules = config.capsules.filter((_: any, i: number) => i !== index);
    updateCurrentStep({ networkRequestConfig: { ...config, capsules: newCapsules } });
  };

  const addCapsule = () => {
    const newCapsules = [...config.capsules, { value: '', url: '', jsonPath: '', hintName: '', variableName: '' }];
    updateCurrentStep({ networkRequestConfig: { ...config, capsules: newCapsules } });
  };



  return (
    <div className="flex flex-col gap-3 p-0 mt-1 flex-1 min-h-0">
      {/* 顶部：目标 URL 嗅探区 */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center">
          <button
            onClick={handleSniff}
            disabled={sniffStatus !== 'idle'}
            className={`flex-1 px-3 py-1.5 rounded-lg text-[13px] font-bold transition-all duration-500 flex items-center justify-center gap-1.5 border ${sniffStatus !== 'idle'
                ? 'bg-black/5 dark:bg-white/5 text-gray-500 border-[var(--border)] cursor-not-allowed shadow-sm'
                : 'bg-blue-600 text-white border-blue-500 hover:bg-blue-500 hover:border-blue-400 shadow-[0_0_12px_rgba(37,99,235,0.4)] hover:shadow-[0_0_16px_rgba(59,130,246,0.6)]'
              }`}
          >
            {sniffStatus === 'sniffing' ? <Loader2 size={14} className="animate-spin shrink-0" /> : sniffStatus === 'finished' ? <Check size={14} className="shrink-0" /> : <Target size={14} className="shrink-0" />}
            <span className="transition-opacity duration-300">
              {sniffStatus === 'sniffing' ? `捕获中 (${sniffCountdown}s)...` : sniffStatus === 'finished' ? '捕获结束' : '捕获 URL 网络请求'}
            </span>
          </button>

          <div className={`transition-all duration-500 overflow-hidden flex shrink-0 ${sniffStatus !== 'idle' ? 'w-[92px] opacity-100 ml-2' : 'w-0 opacity-0 ml-0'}`}>
            <button
              onClick={sniffStatus === 'sniffing' ? handleCancelSniff : handleReset}
              className="w-[92px] px-2 py-1.5 rounded-lg text-[13px] font-bold transition-colors border shadow-sm hover:opacity-80 shrink-0 whitespace-nowrap"
              style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
            >
              <div className="relative flex items-center justify-between w-full h-[20px]">
                <div className={`absolute inset-0 flex items-center justify-between transition-opacity duration-500 ${sniffStatus === 'sniffing' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                  <X size={14} />
                  <span className="flex-1 text-center tracking-[0.2em] ml-1">取消</span>
                </div>
                <div className={`absolute inset-0 flex items-center justify-between transition-opacity duration-500 ${sniffStatus === 'finished' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                  <RotateCcw size={14} />
                  <span className="flex-1 text-center tracking-[0.2em] ml-1">重置</span>
                </div>
              </div>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 relative">
          <input
            type="text"
            className="flex-1 bg-[var(--bg-surface)] text-[12px] text-[var(--text-primary)] px-2.5 py-1.5 rounded-md outline-none border border-[var(--border)] focus:border-blue-500 transition-colors placeholder-gray-500"
            placeholder="输入或选择目标 URL..."
            value={sniffUrl}
            onChange={(e) => {
              setSniffUrl(e.target.value);
              updateCurrentStep({ networkRequestConfig: { ...config, sniffTargetUrl: e.target.value } });
            }}
            onFocus={() => setShowUrlHistory(true)}
            onBlur={() => setTimeout(() => setShowUrlHistory(false), 200)}
          />

          <button
            onClick={handleUseCurrentUrl}
            className="w-[92px] px-1.5 py-1.5 rounded-lg font-bold text-[12px] transition-all flex items-center justify-center gap-1 border hover:opacity-80 shrink-0 whitespace-nowrap"
            style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
          >
            <LinkIcon size={14} className="shrink-0" /> 当前 URL
          </button>

          {showUrlHistory && (visitedUrls || []).length > 0 && (
            <div className="absolute top-[calc(100%+4px)] left-0 right-0 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto border border-blue-500 bg-[var(--bg-panel)]">
              {(visitedUrls || []).map((url, idx) => (
                <div
                  key={idx}
                  className="px-3 py-1.5 text-[12px] cursor-pointer truncate transition-colors border-b last:border-0 hover:bg-black/5 dark:hover:bg-white/5"
                  style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-subtle)' }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setSniffUrl(url);
                    setShowUrlHistory(false);
                  }}
                  title={url}
                >
                  {url}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 期望捕获内容 (仅在捕获前显示) */}
      {sniffedData.length === 0 && (
        <div className="flex flex-col gap-1.5 px-1 mt-2">
          <label className="text-[12px] text-[var(--text-primary)] font-bold border-b border-[var(--border)] pb-1.5 flex items-center gap-1">
            <span>期望捕获内容</span>
          </label>
          <div className="flex flex-wrap gap-1.5 mb-1">
            {expectedValues.map((val, idx) => {
              const isPlaceholder = val === '' && idx === expectedValues.length - 1;
              const isEditing = editingExpectedIdx === idx;

              return (
                <div
                  key={idx}
                  onClick={() => { if (!isEditing) setEditingExpectedIdx(idx) }}
                  className={`relative flex items-center justify-center overflow-hidden transition-all duration-300 min-h-[26px] rounded-full border shadow-sm ${isEditing
                      ? 'w-[80px] bg-[var(--bg-surface)] border-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.3)]'
                      : isPlaceholder
                        ? 'w-[40px] bg-[var(--bg-elevated)] border-[var(--border)] border-dashed text-gray-400 hover:border-gray-500 hover:text-[var(--text-secondary)] cursor-pointer'
                        : 'w-auto px-2 min-w-[40px] bg-blue-500/10 border-blue-500/50 text-blue-600 dark:text-blue-300 hover:border-primary hover:text-primary cursor-pointer'
                    }`}
                >
                  {!isEditing && isPlaceholder && <Plus size={12} />}
                  {!isEditing && !isPlaceholder && <span className="text-[11px] py-1">{val}</span>}
                  {isEditing && (
                    <input
                      autoFocus
                      className="w-full h-full bg-transparent outline-none px-2 py-1 text-[11px] text-[var(--text-primary)] text-center font-sans"
                      value={val}
                      placeholder={isPlaceholder ? "输入..." : ""}
                      onChange={(e) => {
                        const newArr = [...expectedValues];
                        newArr[idx] = e.target.value;
                        setExpectedValues(newArr);
                      }}
                      onBlur={() => {
                        setEditingExpectedIdx(null);
                        const trimmed = val.trim();
                        if (trimmed !== '' && idx === expectedValues.length - 1) {
                          setExpectedValues([...expectedValues.slice(0, -1), trimmed, '']);
                        } else if (trimmed === '' && idx < expectedValues.length - 1) {
                          const newArr = [...expectedValues];
                          newArr.splice(idx, 1);
                          setExpectedValues(newArr);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') e.currentTarget.blur();
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 胶囊拾取区 */}
      {sniffedData.length > 0 && (
        <div className="flex flex-col gap-1.5 px-1 mt-1">

          <div className="flex items-center justify-between mt-1 relative shrink-0">
            <div className="flex flex-col">
              <label className="text-[12px] text-[var(--text-primary)] font-bold flex items-center gap-1">
                <MousePointer2 size={12} /> 点击选取所需内容
              </label>
              <span className="text-[10px] text-gray-500 mt-0.5">
                {sniffedData.length > 300 ? `(仅300/${sniffedData.length}，其余请搜索)` : `(${sniffedData.length})`}
              </span>
            </div>
            <div
              className="flex items-center h-[20px]"
            >
              <div
                className={`overflow-hidden transition-all ease-in-out flex items-center ${isSearchActive ? 'w-[120px] opacity-100 mr-1 duration-300' : 'w-0 opacity-0 duration-0'}`}
              >
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="搜索值..."
                  className="w-full bg-transparent border-b border-[var(--border)] text-[11px] text-[var(--text-primary)] outline-none px-1 py-0.5 placeholder-gray-500 dark:placeholder-gray-600 animate-[pulse_2s_ease-in-out_infinite] focus:animate-none font-sans"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button
                onClick={() => {
                  if (isSearchActive) {
                    setSearchQuery('');
                    setIsSearchActive(false);
                  } else {
                    setIsSearchActive(true);
                  }
                }}
                className={`p-1 rounded flex items-center justify-center transition-colors ${isSearchActive ? 'hover:bg-[var(--bg-elevated)] text-red-500 dark:text-red-400' : 'hover:bg-[var(--bg-elevated)] text-gray-500 dark:text-gray-400'
                  }`}
              >
                {isSearchActive ? <X size={14} /> : <Search size={14} />}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-[160px] overflow-y-auto medium-scrollbar p-2 bg-black/5 dark:bg-white/5 rounded-lg border border-[var(--border)] shrink-0">
            {sortedSniffedData.map((item, idx) => {
              const isMatch = item.matchType === 'exact' || item.matchType === 'fuzzy';
              const isSelected = config.capsules.some((c: any) => c.jsonPath === item.jsonPath && c.url === item.url);
              return (
                <button
                  key={idx}
                  onClick={() => !isSelected && addFromSniffed(item)}
                  className={`px-2 py-1 rounded text-[11px] font-sans transition-all cursor-pointer truncate max-w-[150px] shadow-sm ${isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-inner scale-[0.97] opacity-80 cursor-default dark:bg-blue-500/50 dark:text-white'
                      : isMatch
                        ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-blue-500 hover:bg-blue-500/10 shadow-[0_0_8px_rgba(59,130,246,0.3)]'
                        : 'bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border)] hover:border-primary hover:text-primary'
                    }`}
                  title={`URL: ${item.url}\nPath: ${item.jsonPath}${isMatch ? `\n匹配得分: ${Math.round(item.score || 0)}` : ''}`}
                >
                  {item.value}
                </button>
              );
            })}
            {sortedSniffedData.length === 0 && (
              <div className="text-gray-500 text-[11px] w-full text-center py-2">
                无匹配结果
              </div>
            )}
            {sortedSniffedData.length === 300 && (
              <div className="text-gray-500 text-[11px] w-full text-center py-1 mt-1 border-t border-dashed border-gray-600/50">
                ...仅展示前 300 条结果，请使用上方 🔍 搜索精确查找...
              </div>
            )}
          </div>
        </div>
      )}


      <div className="flex flex-col gap-2 px-1 mt-2 mb-0 flex-1 min-h-0">
        <div className="text-[12px] text-[var(--text-primary)] font-bold flex items-center justify-between border-b border-[var(--border)] pb-1.5 shrink-0">
          <span>已选请求变量</span>
          <button
            onClick={addCapsule}
            className="text-primary hover:text-blue-400 flex items-center gap-1 text-[12px] font-sans bg-primary/10 hover:bg-primary/20 px-2 py-1 rounded transition-colors cursor-pointer"
          >
            <Plus size={12} /> 手动添加
          </button>
        </div>

        <div className={`flex flex-col gap-2 flex-1 overflow-y-auto thin-scrollbar ${config.capsules.length === 0 ? 'pr-0 pb-1' : 'pr-1 pb-2'}`}>
          {config.capsules.map((cap: any, index: number) => (
            <div key={index} className="flex flex-col gap-2 bg-[var(--bg-surface)] p-2.5 rounded-lg border border-[var(--border)] hover:border-gray-500 transition-colors group shadow-sm">
              {/* 第一行：请求返回值 & JSONPath */}
              <div className="flex items-center gap-2 w-full">
                <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded px-2 py-1.5 text-[11px] text-[var(--text-secondary)] w-[80px] truncate" title={cap.value}>
                  {cap.value || '无样本值'}
                </div>
                <ArrowRight size={12} className="text-gray-500 shrink-0" />
                <input
                  type="text"
                  className="flex-1 min-w-0 bg-[var(--bg-elevated)] border border-[var(--border)] focus:border-primary text-[11px] text-[var(--text-primary)] px-2 py-1.5 rounded outline-none transition-colors"
                  placeholder="JSONPath (例如: data.user.id)"
                  value={cap.jsonPath || ''}
                  onChange={(e) => updateCapsule(index, 'jsonPath', e.target.value)}
                />
                <button
                  onClick={() => removeCapsule(index)}
                  className="text-gray-500 hover:text-red-400 p-1 opacity-50 group-hover:opacity-100 transition-opacity ml-1"
                  title="移除"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {/* 第二行：提示名称 & 存入变量名 */}
              <div className="flex items-center gap-2 w-full">
                <input
                  type="text"
                  className="flex-1 min-w-0 bg-[var(--bg-elevated)] border border-[var(--border)] focus:border-primary text-[11px] text-[var(--text-primary)] px-2 py-1.5 rounded outline-none transition-colors placeholder-gray-500"
                  placeholder="提示名称 (例如: 用户ID)"
                  value={cap.hintName || ''}
                  onChange={(e) => updateCapsule(index, 'hintName', e.target.value)}
                />
                <input
                  type="text"
                  className="flex-1 min-w-0 bg-[var(--bg-elevated)] border border-[var(--border)] focus:border-primary text-[11px] text-blue-500 dark:text-blue-300 px-2 py-1.5 rounded outline-none transition-colors placeholder-gray-500"
                  placeholder="存入变量名 (例如: userId)"
                  value={cap.variableName || ''}
                  onChange={(e) => updateCapsule(index, 'variableName', e.target.value)}
                />
              </div>
            </div>
          ))}

          {config.capsules.length === 0 && (
            <div className="flex-1 flex items-center justify-center py-4 text-gray-500 text-[11px] border border-dashed border-gray-600 rounded-lg bg-black/5 dark:bg-white/5 min-h-[100px]">
              暂无已选变量，点击上方气泡或手动添加
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
