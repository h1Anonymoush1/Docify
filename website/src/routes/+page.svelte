<script lang="ts">
  import "../app.css";
  import { goto } from "$app/navigation";
  import { client, account, databases } from "$lib/appwrite";
  import { AppwriteException } from "appwrite";
  import { onMount } from "svelte";

  let url = $state("");
  let isSubmitting = $state(false);
  let error = $state("");
  let user = $state(null);

  // Check if user is logged in
  onMount(async () => {
    try {
      user = await account.get();
    } catch (err) {
      // User not logged in, that's fine
      user = null;
    }
  });

  async function handleSubmit() {
    if (!url.trim()) {
      error = "Please enter a URL";
      return;
    }

    if (!user) {
      error = "Please sign in to submit URLs";
      goto("/auth");
      return;
    }

    isSubmitting = true;
    error = "";

    try {
      // Create a new summary document
      const summaryId = `summary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const summary = await databases.createDocument(
        "docify-db", // databaseId
        "summaries", // collectionId
        summaryId, // documentId
        {
          userId: user.$id,
          title: "Processing...", // Will be updated by scraper
          originalUrl: url.trim(),
          urlHash: generateUrlHash(url.trim()),
          status: "pending",
          isPublic: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      );

      // Navigate to dashboard to see processing
      goto("/dashboard");

    } catch (err) {
      console.error("Failed to create summary:", err);
      if (err instanceof AppwriteException) {
        error = err.message;
      } else {
        error = "Failed to submit URL. Please try again.";
      }
    } finally {
      isSubmitting = false;
    }
  }

  function generateUrlHash(url: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(url).digest('hex');
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !isSubmitting) {
      handleSubmit();
    }
  }
</script>

<svelte:head>
  <title>Docify - Transform Documentation into Interactive Summaries</title>
  <meta name="description" content="Transform any online documentation into structured summaries with AI-generated diagrams, code examples, and interactive previews." />
</svelte:head>

<main class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
  <!-- Navigation -->
  <nav class="px-6 py-4 bg-white/80 backdrop-blur-sm border-b border-gray-200">
    <div class="max-w-6xl mx-auto flex justify-between items-center">
      <div class="flex items-center space-x-2">
        <div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
          <span class="text-white font-bold text-sm">D</span>
        </div>
        <h1 class="text-xl font-bold text-gray-900">Docify</h1>
      </div>

      <div class="flex items-center space-x-4">
        {#if user}
          <span class="text-sm text-gray-600">Welcome, {user.name || user.email}!</span>
          <button
            onclick={() => goto('/dashboard')}
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Dashboard
          </button>
        {:else}
          <button
            onclick={() => goto('/auth')}
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign In
          </button>
        {/if}
      </div>
    </div>
  </nav>

  <!-- Hero Section -->
  <section class="px-6 py-20">
    <div class="max-w-4xl mx-auto text-center">
      <h1 class="text-5xl font-bold text-gray-900 mb-6">
        Transform Documentation into
        <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
          Interactive Summaries
        </span>
      </h1>

      <p class="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
        Paste any documentation URL and get AI-powered analysis with diagrams, code examples,
        and structured insights in minutes.
      </p>

      <!-- URL Input Form -->
      <div class="max-w-2xl mx-auto mb-8">
        <div class="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
          <div class="mb-4">
            <label for="url" class="block text-sm font-medium text-gray-700 mb-2">
              Documentation URL
            </label>
            <input
              id="url"
              type="url"
              bind:value={url}
              onkeydown={handleKeydown}
              placeholder="https://example.com/docs/getting-started"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              disabled={isSubmitting}
            />
          </div>

          {#if error}
            <div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p class="text-red-700 text-sm">{error}</p>
            </div>
          {/if}

          <button
            onclick={handleSubmit}
            disabled={isSubmitting || !url.trim()}
            class="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
          >
            {#if isSubmitting}
              <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Processing...</span>
            {:else}
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Analyze Documentation</span>
            {/if}
          </button>
        </div>
      </div>

      <!-- Features Grid -->
      <div class="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
        <div class="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Smart Scraping</h3>
          <p class="text-gray-600">Extracts content from HTML, Markdown, and PDF documents automatically.</p>
        </div>

        <div class="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
            <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">AI Analysis</h3>
          <p class="text-gray-600">Powered by advanced language models to understand and summarize complex documentation.</p>
        </div>

        <div class="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Rich Visualizations</h3>
          <p class="text-gray-600">Generates Mermaid diagrams, code examples, and interactive HTML previews.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="bg-gray-50 border-t border-gray-200 py-8">
    <div class="max-w-6xl mx-auto px-6 text-center">
      <p class="text-gray-600">
        Built with ❤️ using SvelteKit and Appwrite
      </p>
    </div>
  </footer>
</main>
