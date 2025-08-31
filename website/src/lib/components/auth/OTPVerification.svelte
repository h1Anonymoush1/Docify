<script>
  import { auth, error, isLoading } from '$lib/stores/auth.js';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  
  let userId = '';
  let secret = '';
  let isVerifying = false;
  
  // Extract userId and secret from URL parameters
  $: if ($page.url.searchParams.has('userId') && $page.url.searchParams.has('secret')) {
    userId = $page.url.searchParams.get('userId');
    secret = $page.url.searchParams.get('secret');
  }
  
  async function handleVerification() {
    if (!userId || !secret) {
      return;
    }
    
    try {
      isVerifying = true;
      await auth.verifyOTP(userId, secret);
      goto('/dashboard');
    } catch (err) {
      console.error('OTP verification failed:', err);
    } finally {
      isVerifying = false;
    }
  }
  
  // Auto-verify if parameters are present
  $: if (userId && secret && !isVerifying) {
    handleVerification();
  }
</script>

<div class="auth-container">
  <div class="auth-card">
    <div class="verification-icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M9 12l2 2 4-4"/>
        <circle cx="12" cy="12" r="10"/>
      </svg>
    </div>
    
    <h2>Verifying Your Account</h2>
    <p class="auth-subtitle">
      {#if userId && secret}
        Please wait while we verify your magic link...
      {:else}
        Invalid verification link. Please try again.
      {/if}
    </p>
    
    {#if $error}
      <div class="error-message">
        {$error}
      </div>
    {/if}
    
    {#if isVerifying || ($isLoading && userId && secret)}
      <div class="verification-status">
        <div class="spinner large"></div>
        <p>Verifying your account...</p>
      </div>
    {:else if !userId || !secret}
      <div class="error-state">
        <p>The verification link is invalid or has expired.</p>
        <button class="btn btn-primary" on:click={() => goto('/auth/login')}>
          Back to Login
        </button>
      </div>
    {/if}
    
    <div class="auth-footer">
      <p>Need help? <a href="/support">Contact Support</a></p>
    </div>
  </div>
</div>

<style>
  .auth-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 1rem;
  }
  
  .auth-card {
    background: white;
    border-radius: 12px;
    padding: 2rem;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    width: 100%;
    max-width: 400px;
    text-align: center;
  }
  
  .verification-icon {
    width: 64px;
    height: 64px;
    margin: 0 auto 1.5rem;
    color: #10b981;
  }
  
  .verification-icon svg {
    width: 100%;
    height: 100%;
  }
  
  h2 {
    margin-bottom: 0.5rem;
    color: #1f2937;
    font-size: 1.875rem;
    font-weight: 700;
  }
  
  .auth-subtitle {
    color: #6b7280;
    margin-bottom: 2rem;
    line-height: 1.5;
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
  
  .verification-status {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    margin: 2rem 0;
  }
  
  .spinner {
    width: 24px;
    height: 24px;
    border: 2px solid transparent;
    border-top: 2px solid currentColor;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  .spinner.large {
    width: 32px;
    height: 32px;
    border-width: 3px;
    color: #3b82f6;
  }
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  
  .error-state {
    margin: 2rem 0;
  }
  
  .error-state p {
    color: #6b7280;
    margin-bottom: 1.5rem;
  }
  
  .btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 6px;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }
  
  .btn-primary {
    background: #3b82f6;
    color: white;
  }
  
  .btn-primary:hover {
    background: #2563eb;
  }
  
  .auth-footer {
    text-align: center;
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid #e5e7eb;
  }
  
  .auth-footer a {
    color: #3b82f6;
    text-decoration: none;
  }
  
  .auth-footer a:hover {
    text-decoration: underline;
  }
</style>