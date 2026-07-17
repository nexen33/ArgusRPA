export interface ScraperTask {
  id: string;                        // nanoid 生成
  name: string;
  targetUrl: string;                 // 支持 {{paramName}} 占位符
  isLoginRequired?: boolean;
  loginPageUrl: string;
  loginSuccessUrlPrefix?: string;
  loginSuccessSelectorCheck?: string;
  sessionCookieName: string;
  steps: ScraperStep[];
  schedule?: string[];                 // 多个系统时区时间的数组，如 ["18:00", "09:30"]
  scheduleConfigured?: boolean;        // 是否在编辑页开启了定时/定频功能配置
  scheduleEnabled?: boolean;           // 该任务当前是否处于正在调度的运行状态
  scheduleType?: 'time' | 'frequency';
  scheduleFrequency?: { value: number; unit: 'hours' | 'minutes' | 'seconds'; startTime?: string; endTime?: string };
  notificationConfigId?: string;       // 关联的通知配置ID
  batchParam?: BatchParamConfig;
  createdAt: number;
  updatedAt: number;
  lastRunAt?: number;
  monitorEnabled?: boolean;
  monitorMode?: 'normal' | 'chart';
  monitorSelectedVarsNormal?: string[];
  monitorSelectedVarsChart?: string[];
  nextTaskId?: string;
  passVariablesToNext?: boolean;
  chainRunOnce?: boolean;
  timeoutSeconds?: number;
}

export interface BatchResult {
  row: Record<string, string>;
  variables: Record<string, string>;
  error?: string;
}

export interface MonitorRecord {
  id: string;
  taskId: string;
  taskName: string;
  timestamp: number;
  variables: Record<string, string>;
  primaryValue: string;
  numericValue: number | null;
  isNumeric: boolean;
  unit: string;
  mode?: 'normal' | 'chart';
  batchValues?: { alias: string; primaryValue: string; numericValue: number | null, variables?: Record<string, string> }[];
  skippedSteps?: string[];
}

export interface NotificationConfig {
  id: string;
  name: string;
  platform: ('feishuLark' | 'slack' | 'local')[]; // 支持多选，合并飞书和Lark，以及本机通知
  feishuWebhookUrl?: string;
  slackWebhookUrl?: string;
  signingSecret?: string;
  prefix: string;          // 消息前缀，如"【聚光Bot】"
  template: string;        // 模板字符串，支持 {{变量名}}
  batchMode: 'each' | 'summary'; // 批量任务时的发送模式
  summaryTemplate?: string; // batchMode=summary 时使用的汇总模板
  localTemplate?: string;   // 本机通知使用的独立精简模板
}

export interface ScraperStep {
  id: string;
  type: 'click' | 'input' | 'readText' | 'readAttr' | 'waitForSelector' | 'waitTimer' | 'downloadFile' | 'navigate' | 'condition' | 'calculate' | 'screenshot' | 'skipPopup' | 'if_else' | 'mouseMove' | 'pressKey' | 'waitForText' | 'scrollToElement' | 'scrollPage' | 'readLocalFile' | 'fileAction' | 'runPython' | 'goto';
  selector: string;
  selectorXPath?: string;
  value?: string;
  waitDuration?: number;
  attrName?: string;
  outputVariable?: string;
  downloadDir?: string;
  downloadFileName?: string; // 自定义文件名（不带后缀）
  tagName?: string;
  innerText?: string;
  description: string;
  conditionOperator?: '>=' | '<=' | '>' | '<' | '==' | '!=' | 'is_empty' | 'not_empty' | 'contains' | 'not_contains';
  conditionFailAction?: 'error' | 'skip' | 'skip_notify';
  conditionVar?: string;
  conditionValue?: string;
  ocrEnabled?: boolean;
  ocrLanguage?: string;
  savePath?: string;
  preScreenshot?: boolean;
  notifyAfterScreenshot?: boolean;
  trueBranchSteps?: ScraperStep[];
  falseBranchSteps?: ScraperStep[];
  numberLocale?: 'en' | 'de';
  takeScreenshot?: boolean;
  
  // Phase 20 fields
  smartParentClick?: boolean;
  keyToPress?: string;
  keyModifiers?: ('shift' | 'ctrl' | 'alt')[];
  scrollDirection?: 'top' | 'bottom' | 'pixels';
  scrollPixels?: number;
  scrollAlignment?: 'start' | 'center' | 'end';
  fileActionType?: 'rename' | 'move' | 'delete' | 'mkdir';
  sourceFilePath?: string;
  targetFilePath?: string;
  pythonScriptPath?: string;
  pythonCode?: string;
  fileFormat?: 'excel' | 'csv' | 'txt' | 'word';
  excelSheetName?: string;
  excelRow?: number;
  excelCol?: string;
  textReadMode?: 'full' | 'regex';
  textRegex?: string;
  gotoStepId?: string;
  waitForTimeoutSeconds?: number;
  clickMode?: 'cdp' | 'dom';
  expectedText?: string;
  autoExecuteAfterAdd?: boolean;
  validationConfig?: { enabled: boolean; expectedUrlPattern?: string; recordedMethod?: string; };
}

export interface BatchParamConfig {
  enabled: boolean;
  paramName: string;
  paramValues: { name: string; value: string }[];
}
