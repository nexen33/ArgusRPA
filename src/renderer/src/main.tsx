import './index.css'
import './styles/themes.css'

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { TaskProvider } from './context/TaskContext'
import { ModalProvider } from './context/ModalContext'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ModalProvider>
      <TaskProvider>
        <App />
      </TaskProvider>
    </ModalProvider>
  </React.StrictMode>
)
