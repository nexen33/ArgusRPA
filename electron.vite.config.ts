import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import fs from 'fs'
import { execSync } from 'child_process'

const compileCSharp = () => {
  return {
    name: 'compile-csharp',
    closeBundle() {
      const projPath = resolve(__dirname, 'src/main/uia/DesktopAutomationRunner.csproj');
      const outDir = resolve(__dirname, 'out/main/uia');
      const isDev = process.env.NODE_ENV === 'development';
      
      try {
        if (isDev) {
          console.log('⚡ [DEV MODE] Fast building C# Runner (JIT)...');
          execSync(`dotnet build "${projPath}" -c Debug -o "${outDir}"`, { stdio: 'inherit' });
        } else {
          console.log('🚀 [PROD MODE] Publishing C# Runner (JIT Self-Contained)...');
          execSync(`dotnet publish "${projPath}" -c Release -r win-x64 -o "${outDir}"`, { stdio: 'inherit' });
        }
      } catch (err) {
        console.error('Failed to build C# Runner:', err);
      }
    }
  }
}

export default defineConfig({
  main: {
    resolve: {
      alias: {
        'bufferutil': resolve(__dirname, 'src/main/dummy.js'),
        'utf-8-validate': resolve(__dirname, 'src/main/dummy.js')
      }
    },
    plugins: [externalizeDepsPlugin(), compileCSharp()]
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
