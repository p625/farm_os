import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const projectRoot = __dirname

export default defineConfig({
  root: projectRoot,
  publicDir: path.resolve(projectRoot, 'public'),
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5174,
    strictPort: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(projectRoot, './src'),
      '@core': path.resolve(projectRoot, './src/core'),
      '@rendering': path.resolve(projectRoot, './src/rendering'),
      '@game': path.resolve(projectRoot, './src/game'),
      '@systems': path.resolve(projectRoot, './src/systems'),
      '@entities': path.resolve(projectRoot, './src/entities'),
      '@ui': path.resolve(projectRoot, './src/ui'),
      '@assets': path.resolve(projectRoot, './src/assets'),
      '@audio': path.resolve(projectRoot, './src/audio'),
      '@types': path.resolve(projectRoot, './src/types'),
      '@utils': path.resolve(projectRoot, './src/utils'),
    },
  },
})
