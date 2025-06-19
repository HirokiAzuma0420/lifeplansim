import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/lifeplansim/', // GitHub Pagesのリポジトリ名に合わせる
});
