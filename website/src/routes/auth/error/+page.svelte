<script>
  import { goto } from '$app/navigation';
</script>

<svelte:head>
  <title>Authentication Error - Docify</title>
</svelte:head>

<div class="auth-container">
  <div class="auth-card">
    <div class="error-icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
    </div>
    
    <h2>Authentication Failed</h2>
    <p class="auth-subtitle">
      There was an error during the authentication process. This could be due to:
    </p>
    
    <ul class="error-list">
      <li>You cancelled the authentication</li>
      <li>The authentication provider returned an error</li>
      <li>There was a network connectivity issue</li>
    </ul>
    
    <div class="error-actions">
      <button class="btn btn-primary" on:click={() => goto('/auth/login')}>
        Try Again
      </button>
      <button class="btn btn-secondary" on:click={() => goto('/')}>
        Go Home
      </button>
    </div>
    
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
  
  .error-icon {
    width: 64px;
    height: 64px;
    margin: 0 auto 1.5rem;
    color: #ef4444;
  }
  
  .error-icon svg {
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
    margin-bottom: 1.5rem;
    line-height: 1.5;
  }
  
  .error-list {
    text-align: left;
    color: #6b7280;
    margin-bottom: 2rem;
    padding-left: 1rem;
  }
  
  .error-list li {
    margin-bottom: 0.5rem;
  }
  
  .error-actions {
    display: flex;
    gap: 1rem;
    margin-bottom: 2rem;
  }
  
  .btn {
    flex: 1;
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
  
  .btn-secondary {
    background: #f3f4f6;
    color: #374151;
    border: 1px solid #d1d5db;
  }
  
  .btn-secondary:hover {
    background: #e5e7eb;
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