/// <reference types="vitest" />
/// <reference types="node" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import { sentryVitePlugin } from '@sentry/vite-plugin'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production'
  
  return {
    plugins: [
      react(),
      
      // Sentry plugin disabled for Docker build
      // TODO: Configure Sentry via environment variables
      
      // Bundle analyzer for production builds
      ...(isProduction ? [
        visualizer({
          filename: 'dist/bundle-analysis.html',
          open: false,
          gzipSize: true,
          brotliSize: true,
        })
      ] : []),
    ],
    
    // Build optimizations
    build: {
      target: 'es2020',
      sourcemap: isProduction,
      minify: 'esbuild',
      // Disable terser options for now to fix build
      // terserOptions: {
      //   compress: {
      //     drop_console: isProduction,
      //     drop_debugger: isProduction,
      //   },
      // },
      rollupOptions: {
        output: {
          // Code splitting strategy
          manualChunks: {
            // Vendor chunks
            'react-vendor': ['react', 'react-dom'],
            'state-vendor': ['zustand'],
            'ui-vendor': ['class-variance-authority', 'clsx'],
            
            // Monitoring chunk (lazy loaded)
            'monitoring': ['@sentry/react'],
          },
          
          // Optimize chunk names for caching
          chunkFileNames: () => {
            return `assets/[name]-[hash].js`
          },
          assetFileNames: 'assets/[name]-[hash].[ext]',
        },
      },
      
      // Chunk size warnings
      chunkSizeWarningLimit: 1000,
    },
    
    // Development optimizations
    server: {
      port: 3001,
      host: true,
      open: false,
    },
    
    // Preview server configuration
    preview: {
      port: 3002,
      host: true,
    },
    
    // Dependency optimization
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'zustand',
        'class-variance-authority',
        'clsx',
      ],
      exclude: ['@sentry/react'],
    },
    
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      css: true,
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        exclude: [
          'node_modules/',
          'src/test/',
          '**/*.d.ts',
          '**/*.config.*',
          'dist/',
          'coverage/',
          'src/config/environment.ts', // Environment config has fallbacks
        ],
        thresholds: {
          global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80,
          },
        },
      },
    },
  }
})
