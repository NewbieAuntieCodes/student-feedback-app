import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// 1. 导入插件
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    // 2. 配置插件
    AutoImport({
      resolvers: [ElementPlusResolver()],
      // 可以选择性地为 Element Plus 的 API (如 ElMessage) 自动生成类型声明文件
      // dts: 'src/auto-imports.d.ts', // <--- 如果你使用 TypeScript，或者想在 JS 项目中也有类型提示，可以启用
    }),
    Components({
      resolvers: [ElementPlusResolver()],
      // 可以选择性地为 Element Plus 的组件自动生成类型声明文件
      // dts: 'src/components.d.ts', // <--- 如果你使用 TypeScript，或者想在 JS 项目中也有类型提示，可以启用
    }),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
