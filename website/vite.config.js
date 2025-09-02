import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [sveltekit()],
  build: {
    // Additional build options for Safari compatibility
    minify: false, // Disable minification to avoid syntax issues
    sourcemap: true, // Enable sourcemaps for better debugging
    rollupOptions: {
      output: {
        // Ensure proper ES module format
        format: 'es',
        // Disable code splitting to avoid potential issues
        manualChunks: undefined
      }
    }
  },
  // Environment variables are handled by SvelteKit automatically
  // No need to manually define them here
  // Optimize dependencies to avoid issues
  optimizeDeps: {
    include: ['appwrite']
  }
});
