import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [react()],
  define: {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify('https://wtclpsjmbokwgwzsenxz.supabase.co'),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0Y2xwc2ptYmt3Z3d3enNlbnh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyMzc5MTIsImV4cCI6MjA3NTgxMzkxMn0.JGYTbCVSJXrpCMCYZREy_dpvJ5pYJAIk9nRtI7DxEZs')
  }
})
