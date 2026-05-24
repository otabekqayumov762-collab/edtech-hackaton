import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (
              id.includes('/react/') ||
              id.includes('/react-dom/') ||
              id.includes('/react-router') ||
              id.includes('/scheduler/')
            ) {
              return 'react'
            }
            if (id.includes('/framer-motion/')) return 'motion'
            // Eslatma: recharts atayin alohida "charts" chunk-iga ajratilmadi.
            // Sababi: recharts ichida react-redux/react-is/use-sync-external-store kabi
            // ko'paytirilgan modullar bor — ularni alohida chunk-ga qo'shsak,
            // entry chunk uni static import qilib oladi va initial load-ga ~110KB gzip qo'shiladi.
            // Lazy yuklanadigan Statistics sahifasi bilan birga qolsa, faqat shu route ochilganda yuklanadi.
          }
        },
      },
    },
  },
})
