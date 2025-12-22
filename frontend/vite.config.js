import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig(({ mode }) => {
  return {
    base: mode === 'development' ? '/dev/' : '/',
    build: {
      outDir: path.relative(__dirname, "../backend/public"),
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              return 'vendor'
            }
          },
        },
      },
    },
    plugins: [vue(), tailwindcss(), AutoImport(AutoImportOptions()), Components()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  }
})


function AutoImportOptions() {
  return {
    imports: [
      'vue',
      'vue-router',
      'pinia',
      {
        'axios': [
          ['default', 'axios']
        ],
      },
      {
        from: 'vue-router',
        imports: ['RouteLocationRaw'],
        type: true,
      }
    ],
    dirs: [
      './src/utils',
      './src/store',
    ],
    dts: true,
    vueTemplate: true
  }
}
