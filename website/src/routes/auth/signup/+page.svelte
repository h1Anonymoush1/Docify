<script>
  import SignupForm from '$lib/components/auth/SignupForm.svelte';
</script>

<svelte:head>
  <title>Sign Up - Docify</title>
  <meta name="description" content="Create your Docify account" />
</svelte:head>

<div class="auth-page">
  <div class="auth-container">
    <div class="auth-content">
      <div class="auth-header">
        <h1>Join Docify</h1>
        <p>Create your account to get started</p>
      </div>
      
      <SignupForm />
      
      <div class="auth-footer">
        <p>Already have an account? <a href="/auth/login">Sign in</a></p>
      </div>
    </div>
  </div>
</div>

<style>
  .auth-page {
    min-height: calc(100vh - 80px); /* Account for navbar height */
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
  
  .auth-footer {
    text-align: center;
    margin-top: var(--spacing-6);
    padding-top: var(--spacing-6);
    border-top: 1px solid var(--border-color);
  }
  
  .auth-footer p {
    color: var(--text-secondary);
    margin: 0;
  }
  
  .auth-footer a {
    color: var(--color-teal);
    text-decoration: none;
    font-weight: 500;
  }
  
  .auth-footer a:hover {
    text-decoration: underline;
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