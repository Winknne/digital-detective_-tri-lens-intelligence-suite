import path from 'path';
import { fileURLToPath } from 'url'; // 1. 引入这个模块
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// 2. 在 ESM 模式下手动定义 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      // 3. 添加 base 配置，解决 GitHub Pages 路径问题
      // 如果您的仓库名是 digital-detective，这里也可以填 '/digital-detective/'
      // 使用 './' 是最安全的通用写法
      base: '/digital-detective_-tri-lens-intelligence-suite/', 

      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'), // 这里使用了 __dirname，现在修复后可以正常工作
        }
      }
    };
});