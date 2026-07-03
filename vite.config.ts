import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const projectRoot = path.resolve(__dirname, '..')

export default defineConfig({
  root: projectRoot,
  plugins: [react()],
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
      '@utils': path.resolve(projectRoot, './src/utils'),
    },
  },
})
