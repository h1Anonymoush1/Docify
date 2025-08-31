<script>
  import { onMount } from 'svelte';
  import { auth } from '$lib/stores/auth.js';
  import { account } from '$lib/appwrite.js';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  
            onMount(async () => {
        try {
           
                     // Check for hash-based parameters (common with OAuth)
          if ($page.url.hash) {
            const hashParams = new URLSearchParams($page.url.hash.substring(1));

            // Check for error in hash
            const error = hashParams.get('error');
            if (error) {
              alert('OAuth authentication failed. Please try again.');
              goto('/auth');
              return;
            }
          }
      
                      // Check for OAuth token callback parameters
          const token = $page.url.searchParams.get('token');
          const userId = $page.url.searchParams.get('userId');

          if (token && userId) {
            try {
              // Create session from the OAuth token
              const session = await account.createSession(userId, token);

              // Get the current user
              const currentUser = await auth.getCurrentUser();

              if (currentUser) {
                goto('/dashboard');
                return;
              }
            } catch (err) {
              // Continue to fallback
            }
          }
      
                // Also check for traditional OAuth callback parameters
          const secret = $page.url.searchParams.get('secret');
          if (secret && userId) {
            try {
              // Create session from the OAuth callback parameters
              const session = await account.createSession(userId, secret);

              // Get the current user
              const currentUser = await auth.getCurrentUser();

              if (currentUser) {
                goto('/dashboard');
                return;
              }
            } catch (err) {
              // Continue to fallback
            }
          }
      
      // Fallback: try to get current user (for session-based OAuth)
      let currentUser = null;
      let attempts = 0;
      const maxAttempts = 5;
      
      while (!currentUser && attempts < maxAttempts) {
        attempts++;
        
        try {
          currentUser = await auth.getCurrentUser();
          if (currentUser) {
            break;
          }
        } catch (err) {
          // Continue to next attempt
        }
        
        // Wait between attempts
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
                if (currentUser) {
            goto('/dashboard');
          } else {
            alert('OAuth authentication failed. Please try again or contact support.');
            goto('/auth');
          }
    } catch (err) {
      goto('/auth');
    }
  });
</script>

<svelte:head>
  <title>Authentication Successful - Docify</title>
</svelte:head>

<main class="success-page">
  <div class="success-container">
    <div class="success-card">
      <div class="success-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 12l2 2 4-4"/>
          <circle cx="12" cy="12" r="10"/>
        </svg>
      </div>
      
      <h2>Authentication Successful</h2>
      <p class="success-subtitle">Redirecting you to your dashboard...</p>
      
      <div class="verification-status">
        <div class="spinner large"></div>
        <p>Setting up your account...</p>
      </div>
    </div>
  </div>
</main>

<style>
  .success-page {
    min-height: 100vh;
    background: var(--bg-secondary);
    padding: var(--spacing-8) var(--spacing-4);
  }
  
  .success-container {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: calc(100vh - 4rem);
  }
  
  .success-card {
    background: var(--bg-primary);
    border-radius: var(--radius-xl);
    padding: var(--spacing-8);
    box-shadow: var(--shadow-lg);
    border: 1px solid var(--color-gray-200);
    width: 100%;
    max-width: 400px;
    text-align: center;
    transition: all 0.2s ease-in-out;
  }
  
  .success-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }
  
  .success-icon {
    width: 64px;
    height: 64px;
    margin: 0 auto var(--spacing-6);
    color: var(--color-teal);
  }
  
  .success-icon svg {
    width: 100%;
    height: 100%;
  }
  
  h2 {
    margin-bottom: var(--spacing-2);
    color: var(--text-primary);
    font-size: var(--font-size-3xl);
    font-weight: 700;
  }
  
  .success-subtitle {
    color: var(--text-secondary);
    margin-bottom: var(--spacing-8);
    line-height: 1.5;
    font-size: var(--font-size-lg);
  }
  
  .verification-status {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-4);
    margin: var(--spacing-8) 0;
  }
  
  .verification-status p {
    color: var(--text-secondary);
    font-size: var(--font-size-base);
  }
  
  .spinner {
    width: 24px;
    height: 24px;
    border: 2px solid var(--color-gray-200);
    border-top: 2px solid var(--color-teal);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  .spinner.large {
    width: 32px;
    height: 32px;
    border-width: 3px;
    color: var(--color-teal);
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  /* Responsive Design */
  @media (max-width: 768px) {
    .success-page {
      padding: var(--spacing-4) var(--spacing-2);
    }
    
    .success-card {
      padding: var(--spacing-6);
    }
    
    h2 {
      font-size: var(--font-size-2xl);
    }
  }
</style>