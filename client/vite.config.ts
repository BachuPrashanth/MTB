// import { defineConfig } from 'vite';
// import react from '@vitejs/plugin-react';

// export default defineConfig({
//   plugins: [react()],
//   server: {
//     port: 5173,
//     proxy: {
//       '/api': 'http://localhost:3001'
//     }
//   }
// });




import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => ({
  plugins: [react()],

  // Local development: http://localhost:5173/
  // Production deployment: https://server-name/mtb/
  base: command === 'build' ? '/mtb/' : '/',

  server: {
    port: 5173,

    // Used only during local development
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
}));