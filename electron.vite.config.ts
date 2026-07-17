import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  main: {
    resolve: {
      alias: {
        'bufferutil': resolve(__dirname, 'src/main/dummy.js'),
        'utf-8-validate': resolve(__dirname, 'src/main/dummy.js')
      }
    },
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/preload/index.ts'),
          viewPreload: resolve(__dirname, 'src/preload/viewPreload.ts'),
          activationPreload: resolve(__dirname, 'src/preload/activationPreload.ts')
        }
      }
    }
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [react()]
  }
})
