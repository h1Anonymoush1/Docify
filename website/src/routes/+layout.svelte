<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { user, isAuthenticated, isLoading, auth } from '$lib/stores/auth.js';
  import UserProfile from '$lib/components/auth/UserProfile.svelte';
  import Navbar from '$lib/components/Navbar.svelte';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import '../app.css';
  
         // Protected routes that require authentication
       const protectedRoutes = ['/dashboard', '/settings'];
  
  // Check if current route is protected
  $: isProtectedRoute = protectedRoutes.some(route => $page.url.pathname.startsWith(route));
  
        // Redirect to auth if accessing protected route without authentication
      $: if (browser && !$isLoading && isProtectedRoute && !$isAuthenticated) {
        goto('/auth');
      }
</script>

<svelte:head>
  <title>Docify</title>
  <meta name="description" content="Document management and collaboration platform" />
</svelte:head>

<div class="app">
        <!-- Navigation Header -->
      <Navbar />
  
        <!-- Main Content -->
      <main class="main with-header">
        <slot />
      </main>
  
  <!-- Loading Overlay -->
  {#if $isLoading && isProtectedRoute}
    <div class="loading-overlay">
      <div class="loading-spinner">
        <div class="spinner"></div>
        <p>Loading...</p>
      </div>
    </div>
  {/if}
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background-color: #f9fafb;
  }
  
  .app {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }
  

  
  .main {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  
  .main.with-header {
    padding-top: 0;
  }
  
  .loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 50;
  }
  
  .loading-spinner {
    text-align: center;
  }
  
  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid #e5e7eb;
    border-top: 3px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
  }
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  
  .loading-spinner p {
    margin: 0;
    color: #6b7280;
    font-size: 0.875rem;
  }
</style>