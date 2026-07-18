import React from 'react';
import DesktopStepsList from './DesktopStepsList';
import { Target } from 'lucide-react';
import { useTask } from '../context/TaskContext';
import { useModal } from '../context/ModalContext';
import RunStatusBar from './RunStatusBar';
import DesktopParamsPanel from './DesktopParamsPanel';
import GlobalConfigPanel from './GlobalConfigPanel';
import DesktopShortcutSettingsModal from './DesktopShortcutSettingsModal';

interface DesktopTaskConfiguratorProps {
  onBack?: () => void;
}

const DesktopTaskConfigurator: React.FC<DesktopTaskConfiguratorProps> = ({ onBack }) => {
  const { task, updateTask, setPendingStep, setActiveStepId } = useTask();
  const { toast } = useModal();
  const [isInspecting, setIsInspecting] = React.useState(false);

  const handleInspectResult = (result: any) => {
    if (result && !result.error && !result.cancelled) {
      const targetInfo = {
        elementName: result.elementName || result.ElementName || '',
        automationId: result.automationId || result.AutomationId || '',
        className: result.className || result.ClassName || '',
        processName: result.processName || result.ProcessName || '',
        ancestorDepth: result.ancestorDepth || result.AncestorDepth || 0,
        childIndexPath: result.childIndexPath || result.ChildIndexPath || []
      };
      
      let mappedType = result.actionType || 'click';
      let clickMode = 'dom';
      
      if (mappedType === 'rightClick') {
        mappedType = 'click';
        clickMode = 'rightClick';
      } else if (mappedType === 'doubleClick') {
        mappedType = 'click';
        clickMode = 'doubleClick';
      } else if (mappedType === 'readProperty') {
        mappedType = 'readAttr';
      }

      const actionName = result.actionType === 'readText' || result.actionType === 'readProperty' ? '读取' : (result.actionType === 'input' ? '输入' : '操作');

      const newStep: any = {
        id: Math.random().toString(36).substring(2, 10),
        type: mappedType,
        selector: JSON.stringify(targetInfo),
        description: `${actionName}: ${result.elementName || result.ElementName || result.className || result.ClassName || '未命名'}`,
        tagName: result.controlType || result.ControlType || 'Window',
        innerText: result.elementName || result.ElementName || result.automationId || result.AutomationId || '',
        clickMode: clickMode
      };
      
      updateTask(prev => ({ steps: [...(prev.steps || []), newStep] }));
    }
  };



  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    sessionStorage.setItem('argus-task-list-tab', 'desktop');
    if (task.taskType !== 'desktop') {
      updateTask({ taskType: 'desktop' });
    }
    
    // 静默在后台加载系统应用列表
    if ((window as any).systemApps && (window as any).systemApps.length > 0) {
      return;
    }
    if ((window as any).electronAPI && (window as any).electronAPI.getSystemApps) {
      (window as any).electronAPI.getSystemApps().then((apps: any) => {
        const filteredApps = (apps || []).filter((app: any) => {
          const name = (app?.name || '').toLowerCase();
          return name && !name.includes('卸载') && !name.includes('uninstall') && !name.includes('uninst') && !name.includes('remove');
        });
        const isChinese = (str: string) => /^[\u4e00-\u9fa5]/.test(str);
        (window as any).systemApps = [...filteredApps].sort((a: any, b: any) => {
          const aName = a?.name || '';
          const bName = b?.name || '';
          const aCh = isChinese(aName);
          const bCh = isChinese(bName);
          if (aCh && !bCh) return 1;
          if (!aCh && bCh) return -1;
          return aName.localeCompare(bName, 'zh-CN');
        });
      });
    }
  }, []);

  const [showShortcutMenu, setShowShortcutMenu] = React.useState(false);
  const [screenshotConfirm, setScreenshotConfirm] = React.useState<string | null>(null);
  const [screenshotShortcut, setScreenshotShortcut] = React.useState<string>('Ctrl+S');

  React.useEffect(() => {
    // @ts-ignore
    if (window.electronAPI && window.electronAPI.getDesktopScreenshotShortcut) {
      // @ts-ignore
      window.electronAPI.getDesktopScreenshotShortcut().then(res => {
        if (res) setScreenshotShortcut(res);
      });
    }
  }, []);

  const handleInspect = async () => {
    try {
      setIsInspecting(true);
      if ((window as any).electronAPI.windowMinimize) {
        (window as any).electronAPI.windowMinimize();
      }
      
      let inspecting = true;
      while (inspecting) {
        const response = await (window as any).electronAPI.startDesktopInspect();
        
        if (response && !response.error && !response.cancelled) {
          const result = response.data || response;
          console.log('Picked Element:', result);

          if (result.stepType === 'imageMatch' || result.requestScreenshot) {
            let actualType = 'imageMatch';
            let desc = '通过截图选取: (图像识别)';
            
            if (result.actionAfterMatch === 'screenshot') {
                actualType = 'screenshot';
                desc = '操作: 区域截图';
            } else if (result.actionAfterMatch === 'dragAndDrop') {
                actualType = 'dragAndDrop';
                desc = '操作: 按住拖拽';
            }

            updateTask(prev => ({
              steps: [...(prev.steps || []), {
                id: Math.random().toString(36).substring(2, 10),
                type: actualType,
                selector: '',
                templateBase64: result.templateBase64,
                confidenceThreshold: result.confidenceThreshold || 0.85,
                actionAfterMatch: actualType === 'imageMatch' ? (result.actionAfterMatch || result.actionType || 'click') : undefined,
                description: desc,
                dragOffsetX: result.dragOffsetX,
                dragOffsetY: result.dragOffsetY
              } as any]
            }));
            // DO NOT stop inspecting to allow continuous picking
            continue;
          }
          
          if (result.fallbackRequired) {
            toast('此区域的应用未开放无障碍接口，建议改用图像识别或坐标定位');
          }

          const targetInfo = {
            elementName: result.elementName || result.ElementName || '',
            automationId: result.automationId || result.AutomationId || '',
            className: result.className || result.ClassName || '',
            processName: result.processName || result.ProcessName || '',
            ancestorDepth: result.ancestorDepth || result.AncestorDepth || 0,
            childIndexPath: result.childIndexPath || result.ChildIndexPath || []
          };
          
          let mappedType = result.actionType || 'click';
          let clickMode = 'dom';
          
          if (mappedType === 'rightClick') {
            mappedType = 'click';
            clickMode = 'rightClick';
          } else if (mappedType === 'doubleClick') {
            mappedType = 'click';
            clickMode = 'doubleClick';
          } else if (mappedType === 'readProperty') {
            mappedType = 'readAttr';
          }

          const actionName = result.actionType === 'readText' || result.actionType === 'readProperty' ? '读取' : (result.actionType === 'input' ? '输入' : '操作');

          const newStep: any = {
            id: Math.random().toString(36).substring(2, 10),
            type: mappedType,
            selector: JSON.stringify(targetInfo),
            description: `${actionName}: ${result.elementName || result.ElementName || result.className || result.ClassName || '未命名'}`,
            tagName: result.controlType || result.ControlType || 'Window',
            innerText: result.elementName || result.ElementName || result.automationId || result.AutomationId || '',
            clickMode: clickMode,
            dragOffsetX: result.dragOffsetX,
            dragOffsetY: result.dragOffsetY
          };
          
          // Append to task steps directly
          updateTask(prev => ({ steps: [...(prev.steps || []), newStep] }));
          setActiveStepId(null);
          setPendingStep(null);
          
          // DO NOT alert, DO NOT stop inspecting
        } else if (response?.cancelled) {
          inspecting = false;
        } else if (response?.error) {
          if (response.error === 'Cancelled') {
            inspecting = false;
          } else {
            console.error('Inspect Error:', response.error);
            // Ignore alert for immersion mode interruption, just log and stop
            inspecting = false;
          }
        } else {
          inspecting = false;
        }
      }
      
      if ((window as any).electronAPI.windowRestore) {
        (window as any).electronAPI.windowRestore();
      }
      setIsInspecting(false);
    } catch (error: any) {
      setIsInspecting(false);
      if ((window as any).electronAPI.windowRestore) {
        (window as any).electronAPI.windowRestore();
      }
      if (!error?.message?.includes('Cancelled') && String(error) !== 'Cancelled') {
        toast(`选取异常: ${error}`);
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative">
      <div className="px-3 pt-3 flex flex-col gap-2">
        <RunStatusBar />
      </div>

      <div className="flex-1 flex p-3 gap-2 min-h-0">
        {/* Left Column: Picker Area (Flexible Width) */}
        {/* Left Column */}
        <div className="flex-1 min-w-0 h-full flex flex-col gap-2">
          
          {/* Top 1/3: Picker Panel */}
          <div className="flex-[1] flex items-center justify-center p-5 bg-darkPanel rounded-xl border border-gray-800 overflow-hidden shadow-2xl shrink-0">
            <div className="w-full flex items-stretch gap-5 h-full">
              {/* Left side: Big Icon */}
              <div className="flex-[0.4] rounded-xl bg-primary/5 border border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center text-primary shadow-sm h-full">
                <Target className="w-16 h-16" />
              </div>
              {/* Right side: Back, Text, Button */}
              <div className="flex-[0.6] flex flex-col justify-between h-full py-1">
                <div className="flex justify-end">
                  {onBack && (
                    <button 
                      onClick={onBack}
                      className="text-xs text-gray-500 dark:text-[#b1b8c0] hover:text-black dark:hover:text-white transition-colors flex items-center gap-1 font-medium"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                      返回入口
                    </button>
                  )}
                </div>
                <p className="text-xs font-medium text-black dark:text-white leading-relaxed">
                  点击下方按钮将最小化主窗口<br />并在屏幕上选取目标应用的交互元素
                </p>
                <button 
                  onClick={handleInspect}
                  onContextMenu={(e) => { e.preventDefault(); setShowShortcutMenu(true); }}
                  disabled={isInspecting}
                  className="w-full py-2.5 bg-primary text-white border-none text-sm rounded-lg shadow-[0_0_12px_var(--accent-glow)] hover:shadow-[0_0_16px_var(--accent-glow-strong)] hover:brightness-110 transition-all duration-200 font-bold tracking-wide active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  style={{ 
                    '--accent-glow': 'color-mix(in srgb, var(--accent) 40%, transparent)',
                    '--accent-glow-strong': 'color-mix(in srgb, var(--accent) 60%, transparent)'
                  } as any}
                  title="右键点击查看快捷键设置"
                >
                  {isInspecting ? '正在选取...' : '开始选取屏幕元素'}
                </button>
              </div>
            </div>
          </div>

          {/* Bottom 2/3: Global Configs Area */}
          <div className="flex-[2] bg-darkPanel rounded-xl border border-gray-800 overflow-hidden shadow-2xl">
            <GlobalConfigPanel />
          </div>
        </div>

        {/* Middle Column: Params Panel */}
        <div className="flex-1 min-w-0 h-full bg-darkPanel rounded-xl border border-gray-800 overflow-hidden shadow-2xl p-3 transform-gpu">
          <DesktopParamsPanel />
        </div>

        {/* Right Column: Steps List */}
        <div className="flex-1 min-w-0 h-full bg-darkPanel rounded-xl border border-gray-800 overflow-hidden shadow-2xl px-3 pt-4 pb-3 transform-gpu">
          <DesktopStepsList />
        </div>
      </div>

      <DesktopShortcutSettingsModal
        isOpen={showShortcutMenu}
        onClose={() => setShowShortcutMenu(false)}
        initialScreenshotShortcut={screenshotShortcut}
        onSave={(newShortcut) => {
          setScreenshotShortcut(newShortcut);
          // @ts-ignore
          if (window.electronAPI && window.electronAPI.setDesktopScreenshotShortcut) {
            // @ts-ignore
            window.electronAPI.setDesktopScreenshotShortcut(newShortcut);
          }
        }}
      />

      {screenshotConfirm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl border border-gray-700/50 overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-gray-700/50 flex justify-between items-center bg-gray-900/50">
              <h2 className="text-[15px] font-bold text-gray-200">添加截图匹配步骤</h2>
              <button onClick={() => setScreenshotConfirm(null)} className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex p-5 gap-5 h-64">
              <div className="flex-1 rounded-lg border border-gray-700 bg-black flex items-center justify-center overflow-hidden relative">
                <img src={screenshotConfirm} className="max-w-full max-h-full object-contain" alt="Screenshot preview" />
              </div>
              <div className="w-64 flex flex-col gap-3">
                <div className="bg-gray-900/50 p-3 rounded border border-gray-700/50 flex flex-col gap-2 flex-1">
                  <h3 className="text-sm font-bold text-gray-300">快捷操作提示</h3>
                  <div className="text-xs text-gray-400 mt-2 space-y-3">
                    <p>图像匹配会在运行中尝试在屏幕内寻找与左侧一致的图像。</p>
                    <p>如果您想重新截取，请点击下方取消，然后再次按下 <kbd className="px-1 py-0.5 bg-gray-800 border border-gray-600 rounded">Ctrl+S</kbd>。</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-5 py-4 bg-gray-900/80 border-t border-gray-700/50 flex justify-end gap-3">
              <button onClick={() => setScreenshotConfirm(null)} className="px-5 py-2 text-gray-300 text-sm font-medium hover:bg-gray-700 rounded-md transition-colors">
                取消
              </button>
              <button 
                onClick={() => {
                  updateTask(prev => ({
                    steps: [...(prev.steps || []), {
                      id: Math.random().toString(36).substring(2, 10),
                      type: 'imageMatch',
                      selector: '',
                      templateBase64: screenshotConfirm,
                      confidenceThreshold: 0.85,
                      actionAfterMatch: 'click',
                      description: '通过截图选取: (图像识别)'
                    } as any]
                  }));
                  setActiveStepId(null);
                  setPendingStep(null);
                  setScreenshotConfirm(null);
                }} 
                className="px-5 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-blue-600 transition-colors shadow-sm"
              >
                添加为步骤
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DesktopTaskConfigurator;
