<script lang="ts">
  import { goto } from "$app/navigation";
  import { account, databases } from "$lib/appwrite";
  import { AppwriteException } from "appwrite";
  import { onMount } from "svelte";

  let user = $state(null);
  let summaries = $state([]);
  let credits = $state(0);
  let isLoading = $state(true);
  let error = $state("");

  onMount(async () => {
    try {
      // Check authentication
      user = await account.get();
      if (!user) {
        goto("/auth");
        return;
      }

      // Load user credits and summaries
      await loadUserData();
    } catch (err) {
      console.error("Failed to load dashboard:", err);
      goto("/auth");
    } finally {
      isLoading = false;
    }
  });

  async function loadUserData() {
    try {
      // Get user profile and credits
      const userDoc = await databases.getDocument(
        "docify-db",
        "users",
        user.$id
      );
      credits = userDoc.credits || 0;

      // Get user's summaries
      const summariesResponse = await databases.listDocuments(
        "docify-db",
        "summaries",
        [
          `userId.equal("${user.$id}")`,
          "orderDesc(\"createdAt\")",
          "limit(50)"
        ]
      );
      summaries = summariesResponse.documents;

    } catch (err) {
      console.error("Failed to load user data:", err);
      error = "Failed to load your data. Please refresh the page.";
    }
  }

  async function handleLogout() {
    try {
      await account.deleteSession('current');
      goto("/");
    } catch (err) {
      console.error("Logout failed:", err);
    }
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

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
</script>

<svelte:head>
  <title>Dashboard - Docify</title>
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
          <span class="text-gray-600">Dashboard</span>
        </div>

        <div class="flex items-center space-x-4">
          <!-- Credits Display -->
          <div class="flex items-center space-x-2 bg-blue-50 px-3 py-2 rounded-lg">
            <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            <span class="text-sm font-medium text-blue-700">{credits} credits</span>
          </div>

          <button
            onclick={() => goto('/')}
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            New Summary
          </button>

          <button
            onclick={handleLogout}
            class="px-4 py-2 text-gray-600 hover:text-gray-900"
          >
            Logout
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
      <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <p class="text-red-700">{error}</p>
      </div>
    {:else}
      <!-- Welcome Section -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.name || user?.email}!
        </h1>
        <p class="text-gray-600">
          You have {credits} credits remaining. Each analysis costs 1 credit.
        </p>
      </div>

      <!-- Summaries Section -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-xl font-semibold text-gray-900">Your Summaries</h2>
          <p class="text-gray-600 text-sm mt-1">
            {summaries.length} total summaries
          </p>
        </div>

        {#if summaries.length === 0}
          <div class="px-6 py-12 text-center">
            <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 class="text-lg font-medium text-gray-900 mb-2">No summaries yet</h3>
            <p class="text-gray-600 mb-6">Get started by analyzing your first documentation URL.</p>
            <button
              onclick={() => goto('/')}
              class="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors"
            >
              Create Your First Summary
            </button>
          </div>
        {:else}
          <div class="divide-y divide-gray-200">
            {#each summaries as summary}
              <div class="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div class="flex items-start justify-between">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center space-x-3 mb-2">
                      <h3 class="text-lg font-medium text-gray-900 truncate">
                        {summary.title || 'Processing...'}
                      </h3>
                      <span class={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(summary.status)}`}>
                        {summary.status}
                      </span>
                    </div>

                    <p class="text-sm text-gray-600 truncate mb-2">
                      {summary.originalUrl}
                    </p>

                    <div class="flex items-center space-x-4 text-sm text-gray-500">
                      <span>Created {formatDate(summary.createdAt)}</span>
                      {#if summary.processingTime}
                        <span>• {summary.processingTime}s processing time</span>
                      {/if}
                    </div>
                  </div>

                  <div class="flex items-center space-x-2 ml-4">
                    {#if summary.status === 'completed'}
                      <button
                        onclick={() => goto(`/summary/${summary.$id}`)}
                        class="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                      >
                        View Summary
                      </button>
                    {:else if summary.status === 'failed'}
                      <button
                        onclick={() => goto(`/summary/${summary.$id}`)}
                        class="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                      >
                        View Error
                      </button>
                    {:else}
                      <div class="flex items-center space-x-2 text-sm text-gray-600">
                        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span>Processing...</span>
                      </div>
                    {/if}
                  </div>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {/if}
  </div>
</main>
