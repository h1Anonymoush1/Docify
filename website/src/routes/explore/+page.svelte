<script lang="ts">
  import { goto } from "$app/navigation";
  import { databases } from "$lib/appwrite";
  import { onMount } from "svelte";

  let summaries = $state([]);
  let isLoading = $state(true);
  let error = $state("");
  let searchQuery = $state("");
  let selectedTag = $state("");

  onMount(async () => {
    await loadPublicSummaries();
  });

  async function loadPublicSummaries() {
    try {
      isLoading = true;
      const queries = [
        "isPublic.equal(true)",
        "status.equal(\"completed\")",
        "orderDesc(\"createdAt\")",
        "limit(50)"
      ];

      if (searchQuery.trim()) {
        queries.push(`title.search("${searchQuery.trim()}")`);
      }

      const response = await databases.listDocuments(
        "docify-db",
        "summaries",
        queries
      );

      summaries = response.documents;
    } catch (err) {
      console.error("Failed to load public summaries:", err);
      error = "Failed to load summaries. Please try again.";
    } finally {
      isLoading = false;
    }
  }

  function handleSearch() {
    loadPublicSummaries();
  }

  function getAllTags() {
    const tagSet = new Set<string>();
    summaries.forEach(summary => {
      if (summary.tags) {
        summary.tags.forEach((tag: string) => tagSet.add(tag));
      }
    });
    return Array.from(tagSet).sort();
  }

  function filterByTag(tag: string) {
    selectedTag = tag;
    // In a real implementation, you'd filter on the backend
    // For now, we'll filter client-side
  }

  function clearFilters() {
    selectedTag = "";
    searchQuery = "";
    loadPublicSummaries();
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
</script>

<svelte:head>
  <title>Explore Public Summaries - Docify</title>
  <meta name="description" content="Browse and discover AI-generated documentation summaries from the Docify community." />
</svelte:head>

<main class="min-h-screen bg-gray-50">
  <!-- Navigation -->
  <nav class="bg-white shadow-sm border-b border-gray-200">
    <div class="max-w-6xl mx-auto px-6 py-4">
      <div class="flex justify-between items-center">
        <div class="flex items-center space-x-4">
          <button
            onclick={() => goto('/')}
            class="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
          >
            <div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span class="text-white font-bold text-sm">D</span>
            </div>
            <span class="font-semibold">Docify</span>
          </button>
          <span class="text-gray-500">|</span>
          <span class="text-gray-600">Explore</span>
        </div>

        <div class="flex items-center space-x-4">
          <button
            onclick={() => goto('/dashboard')}
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Your Dashboard
          </button>
        </div>
      </div>
    </div>
  </nav>

  <div class="max-w-6xl mx-auto px-6 py-8">
    <!-- Header -->
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-4">
        Explore Documentation Summaries
      </h1>
      <p class="text-gray-600 max-w-2xl mx-auto">
        Discover AI-generated summaries from the Docify community.
        Browse by topic, find inspiration, and learn from others' documentation.
      </p>
    </div>

    <!-- Search and Filters -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
      <div class="flex flex-col md:flex-row gap-4">
        <!-- Search -->
        <div class="flex-1">
          <div class="relative">
            <input
              type="text"
              bind:value={searchQuery}
              onkeydown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search summaries..."
              class="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <svg class="absolute left-4 top-3.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <!-- Search Button -->
        <button
          onclick={handleSearch}
          class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Search
        </button>

        <!-- Clear Filters -->
        {#if searchQuery || selectedTag}
          <button
            onclick={clearFilters}
            class="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Clear
          </button>
        {/if}
      </div>

      <!-- Tags Filter -->
      {#if getAllTags().length > 0}
        <div class="mt-4">
          <p class="text-sm text-gray-600 mb-2">Filter by tags:</p>
          <div class="flex flex-wrap gap-2">
            {#each getAllTags() as tag}
              <button
                onclick={() => filterByTag(tag)}
                class={`px-3 py-1 text-sm rounded-full transition-colors ${
                  selectedTag === tag
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tag}
              </button>
            {/each}
          </div>
        </div>
      {/if}
    </div>

    <!-- Loading State -->
    {#if isLoading}
      <div class="flex justify-center items-center py-20">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    {:else if error}
      <div class="bg-red-50 border border-red-200 rounded-lg p-6">
        <p class="text-red-700">{error}</p>
      </div>
    {:else}
      <!-- Summaries Grid -->
      {#if summaries.length === 0}
        <div class="text-center py-20">
          <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 class="text-lg font-medium text-gray-900 mb-2">No summaries found</h3>
          <p class="text-gray-600 mb-6">
            {searchQuery ? 'Try adjusting your search terms.' : 'Be the first to create and share a summary!'}
          </p>
          <button
            onclick={() => goto('/')}
            class="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors"
          >
            Create Your First Summary
          </button>
        </div>
      {:else}
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {#each summaries.filter(summary => !selectedTag || (summary.tags && summary.tags.includes(selectedTag))) as summary}
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div class="p-6">
                <div class="flex items-start justify-between mb-3">
                  <h3 class="text-lg font-semibold text-gray-900 line-clamp-2">
                    {summary.title || 'Untitled Summary'}
                  </h3>
                </div>

                <p class="text-sm text-gray-600 mb-3 line-clamp-3">
                  {summary.originalUrl}
                </p>

                <div class="flex items-center text-xs text-gray-500 mb-3">
                  <span>{formatDate(summary.createdAt)}</span>
                  {#if summary.viewCount}
                    <span class="ml-2">• {summary.viewCount} views</span>
                  {/if}
                </div>

                {#if summary.tags && summary.tags.length > 0}
                  <div class="flex flex-wrap gap-1 mb-4">
                    {#each summary.tags.slice(0, 3) as tag}
                      <span class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                        {tag}
                      </span>
                    {/each}
                    {#if summary.tags.length > 3}
                      <span class="text-xs text-gray-500">+{summary.tags.length - 3} more</span>
                    {/if}
                  </div>
                {/if}

                <button
                  onclick={() => goto(`/summary/${summary.$id}`)}
                  class="w-full px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                >
                  View Summary
                </button>
              </div>
            </div>
          {/each}
        </div>

        <!-- Load More (placeholder for pagination) -->
        {#if summaries.length >= 50}
          <div class="text-center mt-8">
            <button
              onclick={() => {/* Load more logic */}}
              class="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Load More Summaries
            </button>
          </div>
        {/if}
      {/if}
    {/if}
  </div>
</main>

<style>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
