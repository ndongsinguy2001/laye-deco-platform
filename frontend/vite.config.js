import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          icons: ['react-icons'],
          charts: ['recharts'],
          utils: ['axios', 'jspdf', 'xlsx', 'file-saver']
        }
      }
    }
  }
})