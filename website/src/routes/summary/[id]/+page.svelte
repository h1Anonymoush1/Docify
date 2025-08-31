<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { account, databases } from "$lib/appwrite";
  import { AppwriteException } from "appwrite";
  import { onMount } from "svelte";

  let summary = $state(null);
  let isLoading = $state(true);
  let error = $state("");
  let activeTab = $state("overview");

  // Get the summary ID from the URL
  $: summaryId = $page.params.id;

  onMount(async () => {
    try {
      // Check authentication
      const user = await account.get();
      if (!user) {
        goto("/auth");
        return;
      }

      // Load the summary
      await loadSummary();
    } catch (err) {
      console.error("Failed to load summary:", err);
      error = "Failed to load summary. Please check if the URL is correct.";
    } finally {
      isLoading = false;
    }
  });

  async function loadSummary() {
    try {
      const summaryDoc = await databases.getDocument(
        "docify-db",
        "summaries",
        summaryId
      );

      // Check if user owns this summary or if it's public
      const user = await account.get();
      if (summaryDoc.userId !== user.$id && !summaryDoc.isPublic) {
        error = "You don't have permission to view this summary.";
        return;
      }

      summary = summaryDoc;
    } catch (err) {
      console.error("Failed to load summary:", err);
      if (err instanceof AppwriteException && err.code === 404) {
        error = "Summary not found.";
      } else {
        error = "Failed to load summary.";
      }
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'analyzing':
        return 'bg-blue-100 text-blue-800';
      case 'validating':
        return 'bg-yellow-100 text-yellow-800';
      case 'scraping':
        return 'bg-purple-100 text-purple-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
</script>

<svelte:head>
  <title>{summary?.title || 'Loading...'} - Docify</title>
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
          <span class="text-gray-600">Summary</span>
        </div>

        <div class="flex items-center space-x-4">
          <button
            onclick={() => goto('/dashboard')}
            class="px-4 py-2 text-gray-600 hover:text-gray-900"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  </nav>

  <div class="max-w-6xl mx-auto px-6 py-8">
    {#if isLoading}
      <div class="flex justify-center items-center py-20">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    {:else if error}
      <div class="bg-red-50 border border-red-200 rounded-lg p-6">
        <h2 class="text-lg font-semibold text-red-800 mb-2">Error</h2>
        <p class="text-red-700">{error}</p>
        <button
          onclick={() => goto('/dashboard')}
          class="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    {:else if summary}
      <!-- Summary Header -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div class="flex items-start justify-between mb-4">
          <div class="flex-1">
            <h1 class="text-2xl font-bold text-gray-900 mb-2">
              {summary.title || 'Untitled Summary'}
            </h1>
            <a
              href={summary.originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              class="text-blue-600 hover:text-blue-800 underline text-sm"
            >
              {summary.originalUrl}
            </a>
          </div>
          <span class={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(summary.status)}`}>
            {summary.status}
          </span>
        </div>

        <div class="flex items-center space-x-6 text-sm text-gray-600">
          <span>Created {formatDate(summary.createdAt)}</span>
          {#if summary.processingTime}
            <span>• {summary.processingTime}s processing time</span>
          {/if}
          {#if summary.contentType}
            <span>• {summary.contentType}</span>
          {/if}
        </div>
      </div>

      <!-- Processing Status -->
      {#if summary.status !== 'completed'}
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
          <div class="flex items-center space-x-3">
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-600"></div>
            <div>
              <h3 class="text-lg font-medium text-yellow-800">Processing in Progress</h3>
              <p class="text-yellow-700">
                {summary.status === 'scraping' && 'Extracting content from the URL...'}
                {summary.status === 'validating' && 'Validating content quality...'}
                {summary.status === 'analyzing' && 'Generating AI analysis and visualizations...'}
                {summary.status === 'failed' && `Processing failed: ${summary.errorMessage || 'Unknown error'}`}
              </p>
            </div>
          </div>
        </div>
      {/if}

      <!-- Error Display -->
      {#if summary.status === 'failed' && summary.errorMessage}
        <div class="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
          <h3 class="text-lg font-medium text-red-800 mb-2">Processing Error</h3>
          <p class="text-red-700">{summary.errorMessage}</p>
        </div>
      {/if}

      <!-- Content Tabs -->
      {#if summary.status === 'completed' && summary.analysisData}
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <!-- Tab Navigation -->
          <div class="border-b border-gray-200">
            <nav class="flex">
              <button
                onclick={() => activeTab = 'overview'}
                class={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Overview
              </button>
              <button
                onclick={() => activeTab = 'diagrams'}
                class={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'diagrams'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Diagrams
              </button>
              <button
                onclick={() => activeTab = 'preview'}
                class={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'preview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                HTML Preview
              </button>
              <button
                onclick={() => activeTab = 'markdown'}
                class={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'markdown'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Markdown
              </button>
            </nav>
          </div>

          <!-- Tab Content -->
          <div class="p-6">
            {#if activeTab === 'overview'}
              <div class="prose max-w-none">
                <h2 class="text-xl font-semibold text-gray-900 mb-4">Summary Overview</h2>
                {#if summary.analysisData.overview}
                  <div class="text-gray-700 leading-relaxed mb-6">
                    {@html summary.analysisData.overview.replace(/\n/g, '<br>')}
                  </div>
                {/if}

                {#if summary.analysisData.keyPoints && summary.analysisData.keyPoints.length > 0}
                  <h3 class="text-lg font-semibold text-gray-900 mb-3">Key Points</h3>
                  <ul class="space-y-2">
                    {#each summary.analysisData.keyPoints as point}
                      <li class="flex items-start space-x-2">
                        <span class="text-blue-600 mt-1">•</span>
                        <span class="text-gray-700">{point}</span>
                      </li>
                    {/each}
                  </ul>
                {/if}

                {#if summary.tags && summary.tags.length > 0}
                  <div class="mt-6">
                    <h3 class="text-lg font-semibold text-gray-900 mb-3">Tags</h3>
                    <div class="flex flex-wrap gap-2">
                      {#each summary.tags as tag}
                        <span class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                          {tag}
                        </span>
                      {/each}
                    </div>
                  </div>
                {/if}
              </div>
            {:else if activeTab === 'diagrams'}
              <div>
                <h2 class="text-xl font-semibold text-gray-900 mb-4">Visual Diagrams</h2>
                {#if summary.mermaidDiagrams && summary.mermaidDiagrams.length > 0}
                  <div class="space-y-6">
                    {#each summary.mermaidDiagrams as diagram, index}
                      <div class="border border-gray-200 rounded-lg p-4">
                        <h3 class="text-lg font-medium text-gray-900 mb-3">
                          {diagram.title || `Diagram ${index + 1}`}
                        </h3>
                        <div class="bg-gray-50 rounded-lg p-4 font-mono text-sm">
                          <pre><code>{diagram.code}</code></pre>
                        </div>
                        {#if diagram.svg}
                          <div class="mt-4 p-4 bg-white border rounded-lg">
                            {@html diagram.svg}
                          </div>
                        {/if}
                      </div>
                    {/each}
                  </div>
                {:else}
                  <p class="text-gray-600">No diagrams were generated for this summary.</p>
                {/if}
              </div>
            {:else if activeTab === 'preview'}
              <div>
                <h2 class="text-xl font-semibold text-gray-900 mb-4">HTML Preview</h2>
                {#if summary.htmlPreview}
                  <div class="border border-gray-200 rounded-lg overflow-hidden">
                    <iframe
                      srcdoc={summary.htmlPreview}
                      class="w-full h-96 border-0"
                      title="HTML Preview"
                    ></iframe>
                  </div>
                  <div class="mt-4">
                    <button
                      onclick={() => navigator.clipboard.writeText(summary.htmlPreview)}
                      class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Copy HTML
                    </button>
                  </div>
                {:else}
                  <p class="text-gray-600">No HTML preview available.</p>
                {/if}
              </div>
            {:else if activeTab === 'markdown'}
              <div>
                <h2 class="text-xl font-semibold text-gray-900 mb-4">Markdown Export</h2>
                {#if summary.markdownSummary}
                  <div class="bg-gray-50 rounded-lg p-4">
                    <pre class="whitespace-pre-wrap font-mono text-sm text-gray-800">
{summary.markdownSummary}</pre>
                  </div>
                  <div class="mt-4">
                    <button
                      onclick={() => navigator.clipboard.writeText(summary.markdownSummary)}
                      class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Copy Markdown
                    </button>
                  </div>
                {:else}
                  <p class="text-gray-600">No markdown summary available.</p>
                {/if}
              </div>
            {/if}
          </div>
        </div>
      {/if}
    {/if}
  </div>
</main>
