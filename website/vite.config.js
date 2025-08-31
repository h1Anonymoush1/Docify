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
  // Ensure environment variables are properly loaded
  define: {
    // This ensures that environment variables are available at build time
    __APPWRITE_ENDPOINT__: JSON.stringify(process.env.PUBLIC_APPWRITE_ENDPOINT),
    __APPWRITE_PROJECT_ID__: JSON.stringify(process.env.PUBLIC_APPWRITE_PROJECT_ID)
  },
  // Optimize dependencies to avoid issues
  optimizeDeps: {
    include: ['appwrite']
  }
});
