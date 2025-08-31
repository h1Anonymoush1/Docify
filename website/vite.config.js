import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [sveltekit()],
  build: {
    // Ensure consistent encoding
    rollupOptions: {
      output: {
        // Ensure proper character encoding in output files
        charset: 'utf8'
      }
    }
  },
  // Ensure environment variables are properly loaded
  define: {
    // This ensures that environment variables are available at build time
    __APPWRITE_ENDPOINT__: JSON.stringify(process.env.PUBLIC_APPWRITE_ENDPOINT),
    __APPWRITE_PROJECT_ID__: JSON.stringify(process.env.PUBLIC_APPWRITE_PROJECT_ID)
  }
});
