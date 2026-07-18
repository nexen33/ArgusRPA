export interface ScraperTask {
  id: string;                        // nanoid 生成
  name: string;
  targetUrl: string;                 // 支持 {{paramName}} 占位符
  taskType?: 'web' | 'desktop';      // 区分网页自动化和桌面自动化任务
  isLoginRequired?: boolean;
  loginPageUrl?: string;
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
  platform: ('feishuLark' | 'slack' | 'local' | 'websocket')[]; // 支持多选，合并飞书和Lark，以及本机通知
  feishuWebhookUrl?: string;
  slackWebhookUrl?: string;
  signingSecret?: string;
  prefix: string;          // 消息前缀，如"【聚光Bot】"
  template: string;        // 模板字符串，支持 {{变量名}}
  batchMode: 'each' | 'summary'; // 批量任务时的发送模式
  summaryTemplate?: string; // batchMode=summary 时使用的汇总模板
  localTemplate?: string;   // 本机通知使用的独立精简模板
  feishuChatId?: string;    // 新增：Websocket 对应的接收者ID
}

export interface ScraperStep {
  id: string;
  type: 'click' | 'input' | 'readText' | 'readAttr' | 'waitForSelector' | 'waitTimer' | 'downloadFile' | 'navigate' | 'condition' | 'calculate' | 'screenshot' | 'skipPopup' | 'if_else' | 'mouseMove' | 'pressKey' | 'waitForText' | 'scrollToElement' | 'scrollPage' | 'readLocalFile' | 'fileAction' | 'runPython' | 'goto' | 'startApp' | 'closeApp' | 'focusWindow' | 'launchApp' | 'windowControl' | 'systemSearch' | 'sendWin32Message' | 'imageMatch' | 'dragAndDrop' | 'readClipboard' | 'assignVariable' | 'network_request_variable';
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
  clickMode?: 'cdp' | 'dom' | 'rightClick' | 'doubleClick';
  expectedText?: string;
  autoExecuteAfterAdd?: boolean;
  validationConfig?: { enabled: boolean; expectedUrlPattern?: string; recordedMethod?: string; };
  
  // Phase 30 fields
  appPath?: string;
  appArgs?: string;
  processName?: string;
  
  // Phase 31.2 fields
  executablePath?: string;
  executableArgs?: string;
  waitForWindow?: boolean;
  windowTitle?: string;
  windowCommand?: 'close' | 'minimize' | 'maximize' | 'restore' | 'focus' | 'minimize_others_restore' | '';
  windowX?: number;
  windowY?: number;
  windowWidth?: number;
  windowHeight?: number;
  windowPosition?: 'fullscreen' | 'left_half' | 'right_half' | 'top_left' | 'top_right' | 'bottom_left' | 'bottom_right' | 'custom' | '';
  searchKeyword?: string;
  pressEnter?: boolean;
  win32Message?: number;
  win32WParam?: number;
  win32LParam?: number;
  templateBase64?: string;
  templatePreviewUrl?: string;
  confidenceThreshold?: number;
  actionAfterMatch?: 'click' | 'doubleClick' | 'rightClick' | 'hover';
  waitTimeout?: number;
  
  // Phase 38.0 fields
  dragOffsetX?: number;
  dragOffsetY?: number;
  dragSpeed?: 'fast' | 'normal' | 'slow';
  
  // Phase 41.0 fields
  networkRequestConfig?: {
    urlKeyword: string;
    sniffTargetUrl?: string;
    capsules: { value: string; url: string; jsonPath: string; hintName: string; variableName: string }[];
  };
}

export interface BatchParamConfig {
  enabled: boolean;
  paramName: string;
  paramValues: { name: string; value: string }[];
}

import { z } from 'zod';

export const NodeFingerprintSchema = z.object({
  controlType: z.string().nullable().optional(),
  className: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  automationId: z.string().nullable().optional(),
});

export const BoundingRectSchema = z.object({
  x: z.number().nullable().optional(),
  y: z.number().nullable().optional(),
  width: z.number().nullable().optional(),
  height: z.number().nullable().optional(),
});

export const InspectInfoSchema = z.object({
  className: z.string().nullable().optional(),
  controlType: z.string().nullable().optional(),
  processName: z.string().nullable().optional(),
  boundingRect: BoundingRectSchema.nullable().optional(),
  fallbackRequired: z.boolean().nullable().optional(),
  selector: z.string().nullable().optional(),
  ancestorFingerprints: z.array(NodeFingerprintSchema).nullable().optional(),
});

export const InspectActionSchema = z.object({
  id: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
});

export const CommandResultSchema = z.object({
  success: z.boolean(),
  method: z.string().nullable().optional(),
  processId: z.number().nullable().optional(),
  inputMethod: z.string().nullable().optional(),
  value: z.string().nullable().optional(),
  exists: z.boolean().nullable().optional(),
  base64: z.string().nullable().optional(),
  found: z.boolean().nullable().optional(),
  x: z.number().nullable().optional(),
  y: z.number().nullable().optional(),
  width: z.number().nullable().optional(),
  height: z.number().nullable().optional(),
  confidence: z.number().nullable().optional(),
  stepType: z.string().nullable().optional(),
  templateBase64: z.string().nullable().optional(),
  confidenceThreshold: z.number().nullable().optional(),
  actionAfterMatch: z.string().nullable().optional(),
  actionType: z.string().nullable().optional(),
  dragOffsetX: z.number().nullable().optional(),
  dragOffsetY: z.number().nullable().optional(),
  className: z.string().nullable().optional(),
  elementName: z.string().nullable().optional(),
  automationId: z.string().nullable().optional(),
  controlType: z.string().nullable().optional(),
  processName: z.string().nullable().optional(),
  selector: z.string().nullable().optional(),
  fallbackRequired: z.boolean().nullable().optional(),
  boundingRect: BoundingRectSchema.nullable().optional(),
  ancestorDepth: z.number().nullable().optional(),
  childIndexPath: z.array(z.number()).nullable().optional(),
  inspectInfo: InspectInfoSchema.nullable().optional(),
  actions: z.array(InspectActionSchema).nullable().optional(),
  errorCode: z.string().nullable().optional(),
  errorMessage: z.string().nullable().optional(),
});

export type CommandResultType = z.infer<typeof CommandResultSchema>;

export const ResponsePacketSchema = z.object({
  success: z.boolean(),
  errorCode: z.string().nullable().optional(),
  errorMessage: z.string().nullable().optional(),
  data: CommandResultSchema.nullable().optional()
});

export interface DesktopLogMessage {
  timestamp: string;
  runId?: string;
  taskId?: string;
  taskName?: string;
  step?: number;
  action?: string;
  durationMs?: number;
  status: 'success' | 'error' | 'info' | 'warn';
  error?: string;
  message?: string;
  variablesSnapshot?: Record<string, any>;
  currentUrl?: string;
  stepsBefore?: string[];
}
