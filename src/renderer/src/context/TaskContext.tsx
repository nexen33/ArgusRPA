import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ScraperTask } from '../../../shared/types';


interface TaskContextType {
  task: Partial<ScraperTask>;
  updateTask: (updates: Partial<ScraperTask>) => void;
  loadTask: (task: ScraperTask) => void;
  resetTask: () => void;
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
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export function TaskProvider({ children }: { children: ReactNode }) {
  const [task, setTask] = useState<Partial<ScraperTask>>({
    name: '',
    targetUrl: '',
    steps: []
  });
  const [isPickerMode, setIsPickerMode] = useState(false);
  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [visitedUrls, setVisitedUrls] = useState<string[]>([]);
  const [pendingStep, setPendingStep] = useState<any>(null);

  const addVisitedUrl = (url: string) => {
    setVisitedUrls(prev => {
      if (prev.includes(url)) return prev;
      return [url, ...prev].slice(0, 50); // Keep last 50 unique URLs
    });
  };

  const updateTask = (updates: Partial<ScraperTask>) => {
    setTask(prev => ({ ...prev, ...updates }));
  };

  const removeStep = (id: string) => {
    setTask(prev => {
      const steps = prev.steps?.filter(s => s.id !== id) || [];
      return { ...prev, steps };
    });
  };

  const loadTask = (t: ScraperTask) => {
    setTask(t);
  };

  const resetTask = () => {
    setTask({
      name: '',
      targetUrl: '',
      steps: []
    });
    setIsPickerMode(false);
    setActiveStepId(null);
    setIsDebugMode(false);
    setVisitedUrls([]);
    setPendingStep(null);
    
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
      pendingStep, setPendingStep
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
