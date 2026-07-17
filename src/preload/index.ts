import { contextBridge, ipcRenderer } from 'electron'

const api = {
  // Browser Control
  updateBrowserBounds: (bounds: any) => ipcRenderer.send('update-browser-bounds', bounds),
  navigateBrowser: (url: string) => ipcRenderer.send('navigate-browser', url),
  setBrowserVisibility: (visible: boolean) => ipcRenderer.send('set-browser-visibility', visible),
  setModalOpen: (isOpen: boolean) => ipcRenderer.send('set-modal-open', isOpen),
  setPickerMode: (enabled: boolean) => ipcRenderer.send('set-picker-mode', enabled),
  getPickerShortcut: () => ipcRenderer.invoke('get-picker-shortcut'),
  setPickerShortcut: (shortcut: string) => ipcRenderer.invoke('set-picker-shortcut', shortcut),
  getPickConfirmShortcut: () => ipcRenderer.invoke('get-pick-confirm-shortcut'),
  setPickConfirmShortcut: (shortcut: string) => ipcRenderer.invoke('set-pick-confirm-shortcut', shortcut),
  syncMainViewPartition: (url: string) => ipcRenderer.send('sync-main-view-partition', url),
  setActiveTask: (taskId: string | null) => ipcRenderer.send('set-active-task', taskId),
  switchBrowserTab: (tabId: string) => ipcRenderer.send('switch-browser-tab', tabId),
  closeBrowserTab: (tabId: string) => ipcRenderer.send('close-browser-tab', tabId),
  captureActiveView: () => ipcRenderer.invoke('capture-active-view'),
  
  // Window Controls
  windowMinimize: () => ipcRenderer.send('window-minimize'),
  windowMaximize: () => ipcRenderer.send('window-maximize'),
  windowClose: (quit?: boolean) => ipcRenderer.send('window-close', quit),
  
  // Session & Login APIs
  checkSession: (url: string, cookieName: string) => ipcRenderer.invoke('check-session', { url, cookieName }),
  clearSession: (url: string) => ipcRenderer.invoke('clear-session', url),
  triggerLogin: (config: any) => ipcRenderer.invoke('trigger-login', config),
  
  // Tasks
  getAllTasks: () => ipcRenderer.invoke('get-all-tasks'),
  saveTask: (task: any) => ipcRenderer.invoke('save-task', task),
  deleteTask: (id: string) => ipcRenderer.invoke('delete-task', id),
  updateTasksOrder: (orderedIds: string[]) => ipcRenderer.invoke('update-tasks-order', orderedIds),
  exportTasks: (taskIds: string[]) => ipcRenderer.invoke('export-tasks', taskIds),
  importTasks: () => ipcRenderer.invoke('import-tasks'),
  
  // Execution Engine
  runTask: (task: any, isDebugMode: boolean, fromTaskList: boolean = false) => ipcRenderer.invoke('run-task', task, isDebugMode, fromTaskList),
  stopTask: () => ipcRenderer.invoke('stop-task'),
  forceClearActiveTask: (taskId: string) => ipcRenderer.invoke('force-clear-active-task', taskId),
  stepContinue: () => ipcRenderer.invoke('step-continue'),
  testSingleStep: (step: any, taskId?: string) => ipcRenderer.invoke('test-single-step', step, taskId),

  // Notifications (Global)
  getNotificationConfig: () => ipcRenderer.invoke('get-notification-config'),
  onRunStatusChanged: (callback: any) => ipcRenderer.on('run-status-changed', (_, data) => callback(data)),
  onValidationRecorded: (callback: any) => {
    const fn = (_: any, data: any) => callback(data);
    ipcRenderer.on('validation-recorded', fn);
    return () => ipcRenderer.removeListener('validation-recorded', fn);
  },
  saveNotificationConfig: (config: any) => ipcRenderer.invoke('save-notification-config', config),
  testSlackConnection: () => ipcRenderer.invoke('test-slack-connection'),
  testFeishuConnection: () => ipcRenderer.invoke('test-feishu-connection'),

  // Notifications (Advanced Phase 7)
  getAllNotificationConfigs: () => ipcRenderer.invoke('get-all-notification-configs'),
  saveAdvancedNotificationConfig: (config: any) => ipcRenderer.invoke('save-advanced-notification-config', config),
  deleteNotificationConfig: (id: string) => ipcRenderer.invoke('delete-notification-config', id),
  testNotification: (config: any, variables: any) => ipcRenderer.invoke('test-notification', config, variables),

  // Settings & System (Phase 9)
  getAutoLaunch: () => ipcRenderer.invoke('get-auto-launch'),
  setAutoLaunch: (enabled: boolean) => ipcRenderer.invoke('set-auto-launch', enabled),
  getTheme: () => ipcRenderer.invoke('get-theme'),
  setTheme: (theme: string) => ipcRenderer.invoke('set-theme', theme),
  getHeadlessMode: () => ipcRenderer.invoke('get-headless-mode'),
  setHeadlessMode: (enabled: boolean) => ipcRenderer.invoke('set-headless-mode', enabled),
  getHardwareAcceleration: () => ipcRenderer.invoke('get-hardware-acceleration'),
  toggleHardwareAcceleration: (enabled: boolean) => ipcRenderer.invoke('toggle-hardware-acceleration', enabled),
  resetAppData: () => ipcRenderer.invoke('reset-app-data'),
  readChangelog: () => ipcRenderer.invoke('read-changelog'),
  openReleasesPage: () => ipcRenderer.invoke('open-releases-page'),
  getVersion: () => ipcRenderer.invoke('get-version'),
  runEnvDiagnostics: () => ipcRenderer.invoke('run-env-diagnostics'),
  
  getArgusIssuePath: () => ipcRenderer.invoke('get-argus-issue-path'),
  getHasOtherDrives: () => ipcRenderer.invoke('get-has-other-drives'),
  setArgusIssueBasePath: (path: string) => ipcRenderer.invoke('set-argus-issue-base-path', path),
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  getLicenseChecked: () => ipcRenderer.invoke('get-license-checked'),
  setLicenseChecked: () => ipcRenderer.invoke('set-license-checked'),
  injectDefaultLicenseConfigs: () => ipcRenderer.invoke('inject-default-license-configs'),
  getLicenseInfo: () => ipcRenderer.invoke('get-license-info'),

  // Monitor Panel (Phase 9)
  getMonitorRecords: (taskId?: string) => ipcRenderer.invoke('get-monitor-records', taskId),
  deleteMonitorRecords: (taskId: string) => ipcRenderer.invoke('delete-monitor-records', taskId),
  exportMonitorRecords: (taskId: string, format: 'txt' | 'csv') => ipcRenderer.invoke('export-monitor-records', taskId, format),

  getActiveTasks: () => ipcRenderer.invoke('get-active-tasks'),
  getEngineStatus: (taskId: string) => ipcRenderer.invoke('get-engine-status', taskId),

  // Events
  onLoginRequired: (callback: (data: any) => void) => {
    const handler = (_event: any, data: any) => callback(data)
    ipcRenderer.on('login-required', handler)
    return () => ipcRenderer.removeListener('login-required', handler)
  },
  onLoginSuccess: (callback: () => void) => {
    const handler = () => callback()
    ipcRenderer.on('login-success', handler)
    return () => ipcRenderer.removeListener('login-success', handler)
  },
  onLoginCancelled: (callback: () => void) => {
    const handler = () => callback()
    ipcRenderer.on('login-cancelled', handler)
    return () => ipcRenderer.removeListener('login-cancelled', handler)
  },
  onElementSelected: (callback: (data: any) => void) => {
    const handler = (_event: any, data: any) => callback(data)
    ipcRenderer.on('element-selected', handler)
    return () => ipcRenderer.removeListener('element-selected', handler)
  },
  onTogglePickerModeFromMain: (callback: () => void) => {
    const handler = () => callback()
    ipcRenderer.on('toggle-picker-mode-from-main', handler)
    return () => ipcRenderer.removeListener('toggle-picker-mode-from-main', handler)
  },
  
  onNewBrowserTab: (callback: (data: any) => void) => {
    const handler = (_event: any, data: any) => callback(data)
    ipcRenderer.on('new-browser-tab', handler)
    return () => ipcRenderer.removeListener('new-browser-tab', handler)
  },
  onBrowserNavigated: (callback: (data: any) => void) => {
    const handler = (_event: any, data: any) => callback(data)
    ipcRenderer.on('browser-navigated', handler)
    return () => ipcRenderer.removeListener('browser-navigated', handler)
  },
  onBrowserTitleUpdated: (callback: (data: any) => void) => {
    const handler = (_event: any, data: any) => callback(data)
    ipcRenderer.on('browser-title-updated', handler)
    return () => ipcRenderer.removeListener('browser-title-updated', handler)
  },
  onBrowserNavigationStarted: (callback: (data: any) => void) => {
    const handler = (_event: any, data: any) => callback(data)
    ipcRenderer.on('browser-navigation-started', handler)
    return () => ipcRenderer.removeListener('browser-navigation-started', handler)
  },
  onBrowserLoadFailed: (callback: (data: any) => void) => {
    const handler = (_event: any, data: any) => callback(data)
    ipcRenderer.on('browser-load-failed', handler)
    return () => ipcRenderer.removeListener('browser-load-failed', handler)
  },
  
  // Execution Engine Events
  onTaskStarted: (callback: (data?: any) => void) => {
    const handler = (_event: any, data?: any) => callback(data)
    ipcRenderer.on('task-started', handler)
    return () => ipcRenderer.removeListener('task-started', handler)
  },
  onStepReady: (callback: (data: any) => void) => {
    const handler = (_event: any, data: any) => callback(data)
    ipcRenderer.on('step-ready', handler)
    return () => ipcRenderer.removeListener('step-ready', handler)
  },
  onStepResult: (callback: (data: any) => void) => {
    const handler = (_event: any, data: any) => callback(data)
    ipcRenderer.on('step-result', handler)
    return () => ipcRenderer.removeListener('step-result', handler)
  },
  onDownloadProgress: (callback: (data: any) => void) => {
    const handler = (_event: any, data: any) => callback(data)
    ipcRenderer.on('download-progress', handler)
    return () => ipcRenderer.removeListener('download-progress', handler)
  },
  onTaskComplete: (callback: (data: any) => void) => {
    const handler = (_event: any, data: any) => callback(data)
    ipcRenderer.on('task-complete', handler)
    return () => ipcRenderer.removeListener('task-complete', handler)
  },
  onTaskError: (callback: (err: string) => void) => {
    const handler = (_event: any, err: string) => callback(err)
    ipcRenderer.on('task-error', handler)
    return () => ipcRenderer.removeListener('task-error', handler)
  },
  onGlobalError: (callback: (err: string) => void) => {
    const handler = (_event: any, err: string) => callback(err)
    ipcRenderer.on('global-error', handler)
    return () => ipcRenderer.removeListener('global-error', handler)
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electronAPI', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electronAPI = api
}
