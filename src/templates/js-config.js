/**
 * JavaScript Config File Template
 * Looks like a webpack/vite configuration file.
 */

module.exports = {
  header: `// vite.config.js
// Project build configuration
// Last updated: 2024-01-10

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

`,
  sections: [
    `const isDev = process.env.NODE_ENV === 'development';
const isProd = process.env.NODE_ENV === 'production';

// Base configuration shared across environments
const baseConfig = {
  plugins: [
    react({
      jsxRuntime: 'automatic',
      babel: {
        plugins: [
          ['@babel/plugin-proposal-decorators', { legacy: true }]
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@assets': path.resolve(__dirname, './src/assets')
    }
  }
};

`,
    `// Development-specific settings
const devConfig = {
  ...baseConfig,
  server: {
    port: 3000,
    open: true,
    cors: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  build: {
    sourcemap: true,
    minify: false
  }
};

`,
    `// Production-specific settings
const prodConfig = {
  ...baseConfig,
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@mui/material', '@emotion/react']
        }
      }
    }
  }
};

`,
    `// Export final configuration
export default defineConfig(isProd ? prodConfig : devConfig);

// Helper for CI/CD pipelines
export const getPreviewConfig = () => ({
  ...prodConfig,
  preview: {
    port: 4173,
    host: true
  }
});
`
  ],
  footer: `\n// EOF\n`,
  slots: 4
};
