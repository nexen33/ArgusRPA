import React from 'react'

export interface ActionEditorProps {
  currentStep: any;
  updateCurrentStep: (updates: any) => void;
  renderVarLabel: (title: string | React.ReactNode, fieldName: string, id: string, className?: string) => React.ReactNode;
  availableVars?: string[];
  task?: any;
}
