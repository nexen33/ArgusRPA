import React, { useEffect, useRef } from 'react'
import { useTask } from '../context/TaskContext'
import throttle from 'lodash/throttle'

export default function BrowserPlaceholder() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { task, visitedUrls } = useTask()
  
  const targetUrlRef = useRef(task.targetUrl);
  const visitedUrlsRef = useRef(visitedUrls);

  useEffect(() => {
    targetUrlRef.current = task.targetUrl;
    visitedUrlsRef.current = visitedUrls;
  }, [task.targetUrl, visitedUrls]);

  useEffect(() => {
    const updateBounds = throttle((rect: DOMRect) => {
      // @ts-ignore
      if (!window.electronAPI) return;
      
      // Handle 0x0 size which happens when window is minimized or when tab is hidden via display:none
      if (rect.width === 0 && rect.height === 0) {
        // @ts-ignore
        window.electronAPI.updateBrowserBounds({ x: -9999, y: -9999, width: 0, height: 0 })
        return;
      }

      if (!targetUrlRef.current && visitedUrlsRef.current.length === 0) {
        // @ts-ignore
        window.electronAPI.updateBrowserBounds({ x: -9999, y: -9999, width: 0, height: 0 })
      } else {
        // @ts-ignore
        window.electronAPI.updateBrowserBounds({
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        })
      }
    }, 50)

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        updateBounds(entry.target.getBoundingClientRect())
      }
    })

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
      updateBounds(containerRef.current.getBoundingClientRect())
    }

    return () => {
      resizeObserver.disconnect()
      updateBounds.cancel()
      // 组件卸载时隐藏浏览器视窗
      // @ts-ignore
      if (window.electronAPI && window.electronAPI.setBrowserVisibility) {
        // @ts-ignore
        window.electronAPI.setBrowserVisibility(false)
      }
    }
  }, [])

  useEffect(() => {
    // 组件挂载时恢复可见性
    // @ts-ignore
    if (window.electronAPI && window.electronAPI.setBrowserVisibility) {
      // @ts-ignore
      window.electronAPI.setBrowserVisibility(true)
    }
  }, [])

  // Trigger a manual bounds update when targetUrl changes (e.g., from empty to non-empty)
  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      if (!targetUrlRef.current && visitedUrlsRef.current.length === 0) {
        // @ts-ignore
        window.electronAPI?.updateBrowserBounds({ x: -9999, y: -9999, width: 0, height: 0 });
      } else if (rect.width > 0 && rect.height > 0) {
        // @ts-ignore
        window.electronAPI?.updateBrowserBounds({
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        });
      }
    }
  }, [task.targetUrl, visitedUrls])

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center transition-colors" style={{ backgroundColor: 'var(--bg-main)' }}>
      <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>真实的网页将会嵌入显示在这里</span>
    </div>
  )
}
