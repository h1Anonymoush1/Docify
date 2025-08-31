<script lang="ts">
  import "$lib/app.css";
  import Navbar from '$lib/components/Navbar.svelte';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  let name = $state('');
  let loading = $state(false);
  let error = $state('');

  onMount(async () => {
    // Setup page is now accessible without authentication
    console.log('Setup page loaded');
  });

  async function completeSetup() {
    if (loading || !name.trim()) return;

    loading = true;
    error = '';

    try {
      // For now, just redirect to dashboard without authentication
      goto('/dashboard');
    } catch (err: any) {
      error = err.message || 'Failed to complete setup';
    } finally {
      loading = false;
    }
  }

  async function skipSetup() {
    goto('/dashboard');
  }
</script>

<svelte:head>
  <title>Complete Your Profile - Docify</title>
</svelte:head>

<Navbar />

<main class="setup-page">
  <div class="setup-container">
    <div class="setup-card">
      <div class="setup-header">
        <div class="welcome-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </div>
        <h1 class="setup-title">Welcome to Docify!</h1>
        <p class="setup-subtitle">Let's get your profile set up so you can start documenting</p>
      </div>

      {#if error}
        <div class="error-message">
          {error}
        </div>
      {/if}

      <div class="setup-form">
        <div class="form-group">
          <label for="name" class="form-label">What's your name?</label>
          <input
            id="name"
            type="text"
            class="form-input"
            placeholder="Enter your full name"
            bind:value={name}
            disabled={loading}
            onkeydown={(e) => {
              if (e.key === 'Enter') {
                completeSetup();
              }
            }}
          />
          <p class="form-help">This will be displayed on your profile and documents</p>
        </div>

        <div class="setup-actions">
          <button
            type="button"
            class="skip-btn"
            onclick={skipSetup}
            disabled={loading}
          >
            Skip for now
          </button>

          <button
            type="button"
            class="complete-btn"
            onclick={completeSetup}
            disabled={loading || !name.trim()}
          >
            {#if loading}
              <div class="spinner"></div>
              Setting up...
            {:else}
              Complete Setup
            {/if}
          </button>
        </div>
      </div>

      <div class="setup-features">
        <h3 class="features-title">What you'll get:</h3>
        <div class="features-grid">
          <div class="feature-item">
            <div class="feature-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14,2 14,8 20,8"></polyline>
              </svg>
            </div>
            <div class="feature-content">
              <h4>Create Documents</h4>
              <p>Write and organize your documentation</p>
            </div>
          </div>

          <div class="feature-item">
            <div class="feature-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 11l-4-4m0 4l4-4m-4 4V3"></path>
              </svg>
            </div>
            <div class="feature-content">
              <h4>Collaborate</h4>
              <p>Share and work together on projects</p>
            </div>
          </div>

          <div class="feature-item">
            <div class="feature-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
            </div>
            <div class="feature-content">
              <h4>Search Everything</h4>
              <p>Find any document or content instantly</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</main>

<style>
  .setup-page {
    min-height: 100vh;
    background: var(--bg-primary);
    padding: var(--spacing-8) var(--spacing-4);
  }

  .setup-container {
    max-width: 800px;
    margin: 0 auto;
  }

  .setup-card {
    background: var(--bg-card);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-lg);
    overflow: hidden;
  }

  .setup-header {
    text-align: center;
    padding: var(--spacing-12) var(--spacing-8) var(--spacing-8);
    background: linear-gradient(135deg, var(--color-teal-50) 0%, var(--bg-card) 100%);
  }

  .welcome-icon {
    color: var(--color-teal);
    margin-bottom: var(--spacing-4);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 80px;
    height: 80px;
    background: var(--color-teal-50);
    border-radius: 50%;
    border: 2px solid var(--color-teal-100);
  }

  .setup-title {
    font-size: var(--font-size-2xl);
    font-weight: 700;
    color: var(--text-primary);
    margin: var(--spacing-4) 0 var(--spacing-2) 0;
  }

  .setup-subtitle {
    font-size: var(--font-size-lg);
    color: var(--text-secondary);
    margin: 0;
    max-width: 400px;
    margin: 0 auto;
  }

  .error-message {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.2);
    color: #dc2626;
    padding: var(--spacing-3);
    border-radius: var(--radius-lg);
    margin: var(--spacing-4);
    text-align: center;
    font-size: var(--font-size-sm);
  }

  .setup-form {
    padding: 0 var(--spacing-8) var(--spacing-8);
  }

  .form-group {
    margin-bottom: var(--spacing-6);
  }

  .form-label {
    display: block;
    font-size: var(--font-size-base);
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: var(--spacing-2);
  }

  .form-input {
    width: 100%;
    padding: var(--spacing-4);
    border: 2px solid var(--border-color);
    border-radius: var(--radius-lg);
    font-size: var(--font-size-base);
    background: var(--bg-primary);
    color: var(--text-primary);
    transition: all 0.2s ease-in-out;
  }

  .form-input:focus {
    outline: none;
    border-color: var(--color-teal);
    box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1);
  }

  .form-input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .form-help {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    margin-top: var(--spacing-2);
    margin-left: var(--spacing-1);
  }

  .setup-actions {
    display: flex;
    gap: var(--spacing-3);
    margin-top: var(--spacing-6);
  }

  .skip-btn {
    flex: 1;
    padding: var(--spacing-3) var(--spacing-4);
    background: transparent;
    border: 2px solid var(--border-color);
    border-radius: var(--radius-lg);
    color: var(--text-secondary);
    font-size: var(--font-size-base);
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease-in-out;
  }

  .skip-btn:hover:not(:disabled) {
    background: var(--bg-hover);
    border-color: var(--text-secondary);
  }

  .skip-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .complete-btn {
    flex: 2;
    padding: var(--spacing-3) var(--spacing-4);
    background: var(--color-teal);
    border: 2px solid var(--color-teal);
    border-radius: var(--radius-lg);
    color: white;
    font-size: var(--font-size-base);
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-2);
    transition: all 0.2s ease-in-out;
  }

  .complete-btn:hover:not(:disabled) {
    background: var(--color-teal-dark);
    border-color: var(--color-teal-dark);
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }

  .complete-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .setup-features {
    padding: var(--spacing-8);
    background: var(--bg-secondary);
    border-top: 1px solid var(--border-color);
  }

  .features-title {
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: var(--spacing-6);
    text-align: center;
  }

  .features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--spacing-4);
  }

  .feature-item {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-3);
    padding: var(--spacing-4);
    background: var(--bg-card);
    border-radius: var(--radius-lg);
    border: 1px solid var(--border-color);
  }

  .feature-icon {
    color: var(--color-teal);
    flex-shrink: 0;
    margin-top: var(--spacing-1);
  }

  .feature-content h4 {
    font-size: var(--font-size-base);
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 var(--spacing-1) 0;
  }

  .feature-content p {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    margin: 0;
    line-height: 1.4;
  }

  /* Responsive */
  @media (max-width: 640px) {
    .setup-page {
      padding: var(--spacing-4) var(--spacing-2);
    }

    .setup-container {
      max-width: 100%;
    }

    .setup-header {
      padding: var(--spacing-8) var(--spacing-4) var(--spacing-6);
    }

    .welcome-icon {
      width: 64px;
      height: 64px;
    }

    .welcome-icon svg {
      width: 32px;
      height: 32px;
    }

    .setup-title {
      font-size: var(--font-size-xl);
    }

    .setup-subtitle {
      font-size: var(--font-size-base);
    }

    .setup-form {
      padding: 0 var(--spacing-4) var(--spacing-6);
    }

    .setup-actions {
      flex-direction: column;
    }

    .skip-btn,
    .complete-btn {
      width: 100%;
    }

    .setup-features {
      padding: var(--spacing-6) var(--spacing-4);
    }

    .features-grid {
      grid-template-columns: 1fr;
    }

    .feature-item {
      flex-direction: column;
      text-align: center;
    }

    .feature-icon {
      margin-top: 0;
      align-self: center;
    }
  }
</style>
