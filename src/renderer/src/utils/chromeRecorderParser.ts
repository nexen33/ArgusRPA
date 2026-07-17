import { ScraperStep } from '../../../shared/types'

export interface RecorderStep {
  type: string;
  url?: string;
  target?: string;
  selectors?: string[][];
  value?: string;
  key?: string;
  [key: string]: any;
}

export interface RecorderJSON {
  title?: string;
  steps?: RecorderStep[];
}

/**
 * 稳健解析并清洗 Chrome Recorder JSON 选择器
 */
const extractSelector = (selectors?: string[][]): { css?: string, xpath?: string } => {
  if (!selectors || !Array.isArray(selectors) || selectors.length === 0) return { css: '' };
  
  let css = '';
  let xpath = '';

  for (const group of selectors) {
    if (!Array.isArray(group) || group.length === 0) continue;
    const sel = group[0] || '';
    if (typeof sel !== 'string') continue;

    // 清洗掉常见的特殊前缀，如 'aria/' 'text/'
    if (sel.startsWith('xpath/')) {
      if (!xpath) xpath = sel.replace(/^xpath\//, '');
    } else if (sel.startsWith('pierce/')) {
      if (!css) css = sel.replace(/^pierce\//, '');
    } else if (sel.startsWith('aria/')) {
      const ariaName = sel.replace(/^aria\//, '').trim();
      if (ariaName && !xpath) xpath = `//*[@aria-label='${ariaName.replace(/'/g, "\\'")}' or contains(text(), '${ariaName.replace(/'/g, "\\'")}')]`;
    } else if (sel.startsWith('text/')) {
      const textVal = sel.replace(/^text\//, '').trim();
      if (textVal && !xpath) xpath = `//*[contains(text(), '${textVal.replace(/'/g, "\\'")}')]`;
    } else {
      if (!css) css = sel;
    }
  }

  // 如果没有 CSS 只有 xpath，也可以
  return { css, xpath };
}

/**
 * 将 Chrome DevTools Recorder 导出的 JSON 转化为 Argus 的 ScraperStep 数组
 * 采用高度容错设计，忽略无法识别或异常的步骤
 */
export function parseChromeRecorderJSON(jsonContent: string): { steps: ScraperStep[], total: number, validCount: number, targetUrl?: string } {
  let parsed: RecorderJSON;
  try {
    parsed = JSON.parse(jsonContent);
  } catch (e) {
    throw new Error('无效的 JSON 文件，无法解析。');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('非预期的 JSON 结构。');
  }

  const rawSteps = parsed.steps;
  if (!rawSteps || !Array.isArray(rawSteps) || rawSteps.length === 0) {
    throw new Error('未在文件中找到任何有效的记录步骤 (steps为空)。');
  }

  const convertedSteps: ScraperStep[] = [];
  let extractedTargetUrl: string | undefined = undefined;

  const pushStep = (newStep: ScraperStep) => {
    const lastStep = convertedSteps[convertedSteps.length - 1];
    if (lastStep) {
      if (newStep.type === 'click' && lastStep.type === 'click' && newStep.selector === lastStep.selector && newStep.selectorXPath === lastStep.selectorXPath) {
        return; // 去除连续相同点击
      }
      if (newStep.type === 'mouseMove' && lastStep.type === 'mouseMove' && newStep.selector === lastStep.selector && newStep.selectorXPath === lastStep.selectorXPath) {
        return; // 去除连续相同Hover
      }
      if (newStep.type === 'click' && lastStep.type === 'mouseMove' && newStep.selector === lastStep.selector && newStep.selectorXPath === lastStep.selectorXPath) {
        convertedSteps.pop(); // 点击前的同元素Hover是多余的，替换掉
      }
    }
    convertedSteps.push(newStep);
  };

  for (const step of rawSteps) {
    try {
      if (!step || typeof step !== 'object' || !step.type) continue;
      
      const { css, xpath } = extractSelector(step.selectors);
      const baseArgusStep: Partial<ScraperStep> = {
        id: Math.random().toString(36).substring(2, 10),
        selector: css || '',
        selectorXPath: xpath || '',
        outputVariable: '',
        value: '',
        attrName: ''
      };

      switch (step.type) {
        case 'navigate':
          if (step.url) {
            if (!extractedTargetUrl) {
              extractedTargetUrl = step.url;
            } else {
              pushStep({
                ...baseArgusStep,
                type: 'navigate',
                value: step.url,
                description: `访问网页: ${step.url}`
              } as ScraperStep);
            }
          }
          break;

        case 'click':
        case 'doubleClick':
          if (css || xpath) {
            pushStep({
              ...baseArgusStep,
              type: 'click',
              description: step.type === 'doubleClick' ? '双击元素' : '点击元素'
            } as ScraperStep);
          }
          break;

        case 'change':
          if (css || xpath) {
            pushStep({
              ...baseArgusStep,
              type: 'input',
              value: step.value || '',
              description: `输入文本: ${step.value}`
            } as ScraperStep);
          }
          break;

        case 'keyDown':
        case 'keyUp':
          if (step.type === 'keyDown' && step.key) {
            pushStep({
              ...baseArgusStep,
              type: 'pressKey',
              keyToPress: step.key,
              description: `模拟按键: ${step.key}`
            } as ScraperStep);
          }
          break;

        case 'hover':
          if (css || xpath) {
            pushStep({
              ...baseArgusStep,
              type: 'mouseMove',
              description: '移动鼠标到此处'
            } as ScraperStep);
          }
          break;

        case 'waitForElement':
          if (css || xpath) {
            pushStep({
              ...baseArgusStep,
              type: 'waitForSelector',
              description: '等待该元素出现'
            } as ScraperStep);
          }
          break;

        case 'scroll':
          // 简单映射为向下滚动
          pushStep({
            ...baseArgusStep,
            type: 'scrollPage',
            scrollDirection: 'bottom',
            description: '向下滚动页面'
          } as ScraperStep);
          break;

        case 'setViewport':
          // 通常可以忽略
          break;

        default:
          console.warn(`[Chrome Recorder Import] 无法识别的步骤类型: ${step.type}`);
      }
    } catch (e) {
      console.warn('[Chrome Recorder Import] 解析单个步骤失败:', e);
    }
  }

  return {
    steps: convertedSteps,
    total: rawSteps.length,
    validCount: convertedSteps.length + (extractedTargetUrl ? 1 : 0),
    targetUrl: extractedTargetUrl
  };
}
