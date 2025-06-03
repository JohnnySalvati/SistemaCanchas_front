import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: true,
    allowedHosts: ['belgranotenis.insoft.ar'], 
  },
  plugins: [react()],
})
