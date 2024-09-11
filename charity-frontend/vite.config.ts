import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // HMR is enabled by default, but you can customize it if needed
    hmr: {
      protocol: 'ws', // Uses WebSocket by default
    },
  },
})
