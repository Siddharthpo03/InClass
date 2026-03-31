import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig(({ command, mode }) => {
  const isBuild = command === 'build'

  return {
    plugins: [
      react({
        jsxRuntime: 'automatic',
      }),
      // Bundle analyzer: only in build mode so dev server stays fast
      ...(isBuild
        ? [
            visualizer({
              open: false,
              filename: 'dist/bundle-analysis.html',
              gzipSize: true,
              brotliSize: true,
            }),
          ]
        : []),
    ],

    resolve: {
      alias: {
        '@': '/src',
      },
    },

    build: {
      target: 'es2019',
      cssCodeSplit: true,
      sourcemap: false,
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
          passes: 2,
          pure_funcs: ['console.log', 'console.debug'],
        },
        mangle: true,
        format: {
          comments: false,
        },
      },
      chunkSizeWarningLimit: 700,
      assetsInlineLimit: 4096,
    },

    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'socket.io-client',
        '@simplewebauthn/browser',
      ],
    },

    define: {
      __BUILD_MODE__: JSON.stringify(mode),
      __DEV_SESSION_ID__: JSON.stringify(isBuild ? '' : String(Date.now())),
      'process.env.NODE_ENV': JSON.stringify(isBuild ? 'production' : 'development'),
    },
  }
})

