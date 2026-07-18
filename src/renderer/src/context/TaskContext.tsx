import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ScraperTask, ScraperStep } from '../../../shared/types';

interface TaskContextType {
  task: Partial<ScraperTask>;
  updateTask: (updates: Partial<ScraperTask> | ((prev: Partial<ScraperTask>) => Partial<ScraperTask>)) => void;
  loadTask: (task: ScraperTask) => void;
  resetTask: (taskType?: 'desktop' | 'web') => void;
  isPickerMode: boolean;
  setIsPickerMode: (val: boolean) => void;
  activeStepId: string | null;
  setActiveStepId: (id: string | null) => void;
  removeStep: (id: string) => void;
  isDebugMode: boolean;
  setIsDebugMode: (val: boolean) => void;
  visitedUrls: string[];
  addVisitedUrl: (url: string) => void;
  pendingStep: any;
  setPendingStep: (step: any) => void;
  activeDropzone: { parentId: string, branch: 'true' | 'false' } | null;
  setActiveDropzone: (val: { parentId: string, branch: 'true' | 'false' } | null) => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export function TaskProvider({ children }: { children: ReactNode }) {
  const [task, setTask] = useState<Partial<ScraperTask>>({
    id: Math.random().toString(36).substring(2, 10),
    name: '',
    targetUrl: '',
    createdAt: Date.now(),
    steps: []
  });
  const [isPickerMode, setIsPickerMode] = useState(false);
  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [visitedUrls, setVisitedUrls] = useState<string[]>([]);
  const [pendingStep, setPendingStep] = useState<any>(null);
  const [activeDropzone, setActiveDropzone] = useState<{ parentId: string, branch: 'true' | 'false' } | null>(null);

  const addVisitedUrl = (url: string) => {
    setVisitedUrls(prev => {
      if (prev.includes(url)) return prev;
      return [url, ...prev].slice(0, 50); // Keep last 50 unique URLs
    });
  };

  const updateTask = (updates: Partial<ScraperTask> | ((prev: Partial<ScraperTask>) => Partial<ScraperTask>)) => {
    setTask(prev => {
      const resolved = typeof updates === 'function' ? updates(prev) : updates;
      return { ...prev, ...resolved };
    });
  };

  const removeStep = (id: string) => {
    setTask(prev => {
      const recursiveRemove = (steps: ScraperStep[]): ScraperStep[] => {
        return steps.filter(s => s.id !== id).map(s => {
          if (s.type === 'if_else') {
            return {
              ...s,
              trueBranchSteps: s.trueBranchSteps ? recursiveRemove(s.trueBranchSteps) : [],
              falseBranchSteps: s.falseBranchSteps ? recursiveRemove(s.falseBranchSteps) : []
            };
          }
          return s;
        });
      };
      return { ...prev, steps: recursiveRemove(prev.steps || []) };
    });
  };

  const loadTask = (t: ScraperTask) => {
    setTask(t);
    setVisitedUrls([]);
    setIsPickerMode(false);
    setActiveStepId(null);
    setPendingStep(null);
    setActiveDropzone(null);
    
    // @ts-ignore
    if (window.electronAPI && window.electronAPI.navigateBrowser) {
      if (t.targetUrl) {
        // @ts-ignore
        window.electronAPI.navigateBrowser(t.targetUrl.startsWith('http') ? t.targetUrl : 'https://' + t.targetUrl);
      } else {
        // @ts-ignore
        window.electronAPI.navigateBrowser('about:blank');
      }
    }
  };

  const resetTask = (taskType?: 'desktop' | 'web') => {
    setTask({
      id: Math.random().toString(36).substring(2, 10),
      name: '',
      targetUrl: '',
      createdAt: Date.now(),
      taskType: taskType,
      steps: []
    });
    setIsPickerMode(false);
    setActiveStepId(null);
    setIsDebugMode(false);
    setVisitedUrls([]);
    setPendingStep(null);
    setActiveDropzone(null);
    
    // @ts-ignore
    if (window.electronAPI && window.electronAPI.navigateBrowser) {
      // @ts-ignore
      window.electronAPI.navigateBrowser('about:blank');
    }
  };

  return (
    <TaskContext.Provider value={{ 
      task, updateTask, loadTask, resetTask,
      isPickerMode, setIsPickerMode,
      activeStepId, setActiveStepId,
      removeStep,
      isDebugMode, setIsDebugMode,
      visitedUrls, addVisitedUrl,
      pendingStep, setPendingStep,
      activeDropzone, setActiveDropzone
    }}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTask() {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTask must be used within a TaskProvider');
  }
  return context;
}
