import adapter from "@sveltejs/adapter-node";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter({
      // Node.js adapter configuration
      out: 'build',
      precompress: false,
      envPrefix: 'PUBLIC_'
    }),
    // Ensure proper handling of dynamic routes
    prerender: {
      // Only prerender the homepage and static pages
      entries: ['/', '/auth/error', '/auth/success']
    }
  },
};

export default config;
