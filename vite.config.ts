import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig(({ command }) => ({
  base: './',
  envPrefix: command === 'serve' ? ['VITE_', 'apiUrl', 'idInstance', 'apiTokenInstance'] : 'VITE_',
  plugins: [react(), tailwindcss()],
}))
