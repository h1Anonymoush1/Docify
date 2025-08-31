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

    <div class="dashboard-grid">
      <!-- Quick Actions -->
      <div class="dashboard-card">
        <div class="card-header">
          <div class="card-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14,2 14,8 20,8"></polyline>
            </svg>
          </div>
          <h3 class="card-title">Create Document</h3>
        </div>
        <p class="card-description">
          Start writing your documentation
        </p>
        <button class="card-button" disabled>
          Coming Soon
        </button>
      </div>

      <!-- Recent Documents -->
      <div class="dashboard-card">
        <div class="card-header">
          <div class="card-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14,2 14,8 20,8"></polyline>
            </svg>
          </div>
          <h3 class="card-title">Recent Documents</h3>
        </div>
        <p class="card-description">
          Access your recently edited documents
        </p>
        <div class="empty-state">
          <p>No documents yet</p>
          <small>Create your first document to get started</small>
        </div>
      </div>

      <!-- Team Collaboration -->
      <div class="dashboard-card">
        <div class="card-header">
          <div class="card-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 11l-4-4m0 4l4-4m-4 4V3"></path>
            </svg>
          </div>
          <h3 class="card-title">Team Collaboration</h3>
        </div>
        <p class="card-description">
          Work together with your team
        </p>
        <button class="card-button" disabled>
          Coming Soon
        </button>
      </div>

      <!-- Search & Explore -->
      <div class="dashboard-card">
        <div class="card-header">
          <div class="card-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
          </div>
          <h3 class="card-title">Explore</h3>
        </div>
        <p class="card-description">
          Discover public documentation
        </p>
        <a href="/explore" class="card-button">
          Browse Documents
        </a>
      </div>
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

  .dashboard-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: var(--spacing-6);
  }

  .dashboard-card {
    background: var(--bg-card);
    border-radius: var(--radius-xl);
    padding: var(--spacing-6);
    box-shadow: var(--shadow-md);
    border: 1px solid var(--border-color);
    transition: all 0.2s ease-in-out;
  }

  .dashboard-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-3);
    margin-bottom: var(--spacing-3);
  }

  .card-icon {
    width: 48px;
    height: 48px;
    background: var(--color-teal-50);
    border-radius: var(--radius-lg);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-teal);
    flex-shrink: 0;
  }

  .card-title {
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
  }

  .card-description {
    color: var(--text-secondary);
    margin: var(--spacing-2) 0 var(--spacing-4) 0;
    line-height: 1.5;
  }

  .card-button {
    width: 100%;
    padding: var(--spacing-3) var(--spacing-4);
    background: var(--color-teal);
    color: white;
    border: 2px solid var(--color-teal);
    border-radius: var(--radius-lg);
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease-in-out;
    text-decoration: none;
    display: inline-block;
    text-align: center;
  }

  .card-button:hover:not(:disabled) {
    background: var(--color-teal-dark);
    border-color: var(--color-teal-dark);
    transform: translateY(-1px);
  }

  .card-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .empty-state {
    text-align: center;
    padding: var(--spacing-6) 0;
    color: var(--text-secondary);
  }

  .empty-state p {
    margin: 0 0 var(--spacing-1) 0;
    font-weight: 500;
  }

  .empty-state small {
    font-size: var(--font-size-sm);
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

    .dashboard-grid {
      grid-template-columns: 1fr;
      gap: var(--spacing-4);
    }

    .dashboard-card {
      padding: var(--spacing-4);
    }

    .card-header {
      flex-direction: column;
      text-align: center;
      gap: var(--spacing-2);
    }

    .card-icon {
      width: 40px;
      height: 40px;
    }

    .card-icon svg {
      width: 20px;
      height: 20px;
    }
  }
</style>