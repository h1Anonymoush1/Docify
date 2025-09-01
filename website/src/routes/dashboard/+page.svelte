<script lang="ts">
  import "$lib/app.css";
  import { onMount } from 'svelte';

  let user = $state(null);
  let loading = $state(true);

  onMount(async () => {
    // Dashboard is now accessible without authentication
    loading = false;
  });
</script>

<svelte:head>
  <title>Dashboard - Docify</title>
</svelte:head>

<main class="dashboard-page">
  <div class="dashboard-container">
    {#if loading}
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    {:else}
      <div class="dashboard-header">
        <h1 class="dashboard-title">
          Welcome to Docify!
        </h1>
        <p class="dashboard-subtitle">
          Your documentation dashboard
        </p>
      </div>


    {/if}
  </div>
</main>

<style>
  .dashboard-page {
    min-height: 100vh;
    background: var(--bg-primary);
    padding: var(--spacing-8) var(--spacing-4);
  }

  .dashboard-container {
    max-width: 1200px;
    margin: 0 auto;
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    gap: var(--spacing-4);
  }

  .loading-state p {
    color: var(--text-secondary);
    font-size: var(--font-size-lg);
  }

  .dashboard-header {
    text-align: center;
    margin-bottom: var(--spacing-12);
  }

  .dashboard-title {
    font-size: var(--font-size-3xl);
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: var(--spacing-2);
  }

  .dashboard-subtitle {
    font-size: var(--font-size-lg);
    color: var(--text-secondary);
    margin: 0;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .dashboard-page {
      padding: var(--spacing-4) var(--spacing-2);
    }

    .dashboard-header {
      margin-bottom: var(--spacing-8);
    }

    .dashboard-title {
      font-size: var(--font-size-2xl);
    }
  }
</style>