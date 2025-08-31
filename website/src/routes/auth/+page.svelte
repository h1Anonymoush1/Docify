<script>
  import { auth, error, isLoading } from '$lib/stores/auth.js';
  import { goto } from '$app/navigation';
  
  async function handleGitHubAuth() {
    try {
      await auth.signInWithGitHub();
    } catch (err) {
      console.error('GitHub authentication failed:', err);
    }
  }
  
  async function handleGoogleAuth() {
    try {
      await auth.signInWithGoogle();
    } catch (err) {
      console.error('Google authentication failed:', err);
    }
  }
</script>

<svelte:head>
  <title>Get Started - Docify</title>
  <meta name="description" content="Sign in to your Docify account or create a new one" />
</svelte:head>

<div class="auth-page">
  <div class="auth-container">
    <div class="auth-content">
      <div class="auth-header">
        <h1>Welcome to Docify</h1>
        <p>Sign in to your account or create a new one to get started</p>
      </div>

      <div class="auth-form">
        {#if $error}
          <div class="error-message">
            {$error}
          </div>
        {/if}

        <!-- OAuth Buttons -->
        <div class="oauth-buttons">
          <button type="button" class="btn btn-github" on:click={handleGitHubAuth} disabled={$isLoading}>
            <svg class="github-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            Continue with GitHub
          </button>
          
          <button type="button" class="btn btn-google" on:click={handleGoogleAuth} disabled={$isLoading}>
            <svg class="google-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
        </div>

        <div class="auth-footer">
          <p>By continuing, you agree to our Terms of Service and Privacy Policy</p>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .auth-page {
    min-height: calc(100vh - 80px);
    background: var(--bg-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-4);
  }

  .auth-container {
    width: 100%;
    max-width: 400px;
  }

  .auth-content {
    background: var(--bg-card);
    border-radius: var(--radius-xl);
    padding: var(--spacing-8);
    box-shadow: var(--shadow-lg);
    border: 1px solid var(--border-color);
  }

  .auth-header {
    text-align: center;
    margin-bottom: var(--spacing-8);
  }

  .auth-header h1 {
    font-size: var(--font-size-2xl);
    font-weight: 700;
    color: var(--text-primary);
    margin: 0 0 var(--spacing-2) 0;
  }

  .auth-header p {
    color: var(--text-secondary);
    margin: 0;
    font-size: var(--font-size-base);
  }

  .auth-form {
    width: 100%;
  }

  .error-message {
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #dc2626;
    padding: 0.75rem;
    border-radius: 6px;
    margin-bottom: 1rem;
    font-size: 0.875rem;
  }

  .oauth-buttons {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
  }

  .btn {
    width: 100%;
    padding: 0.75rem;
    border: none;
    border-radius: 6px;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-github {
    background: #24292e;
    color: white;
  }

  .btn-github:hover:not(:disabled) {
    background: #1a1e22;
  }

  .btn-google {
    background: white;
    color: #374151;
    border: 1px solid #d1d5db;
  }

  .btn-google:hover:not(:disabled) {
    background: #f9fafb;
    border-color: #9ca3af;
  }

  .github-icon,
  .google-icon {
    width: 20px;
    height: 20px;
  }

  .auth-footer {
    text-align: center;
    margin-top: var(--spacing-6);
    padding-top: var(--spacing-6);
    border-top: 1px solid var(--border-color);
  }

  .auth-footer p {
    color: var(--text-secondary);
    margin: 0;
    font-size: 0.75rem;
    line-height: 1.4;
  }

  @media (max-width: 768px) {
    .auth-content {
      padding: var(--spacing-6);
    }

    .auth-header h1 {
      font-size: var(--font-size-xl);
    }
  }
</style>
