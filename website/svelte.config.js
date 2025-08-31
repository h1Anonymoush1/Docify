import adapter from "@sveltejs/adapter-auto";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter(),
    // Ensure proper handling of dynamic routes
    prerender: {
      // Only prerender the homepage and static pages
      entries: ['/', '/auth/error', '/auth/success']
    }
  },
};

export default config;
