<script lang="ts">
  import { user, auth } from '$lib/stores/auth.js';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';

  let name = '';
  let email = '';
  let isUpdating = false;
  let updateMessage = '';
  let updateError = '';
  let activeSection = $state('profile');

  onMount(() => {
    if ($user && typeof $user === 'object') {
      name = ($user as any).name || '';
      email = ($user as any).email || '';
    }
  });

  async function updateProfile() {
    if (!name.trim()) {
      updateError = 'Name cannot be empty';
      return;
    }

    try {
      isUpdating = true;
      updateError = '';
      updateMessage = '';

      // Update the user's name
      await auth.updateName(name);

      updateMessage = 'Profile updated successfully!';

      // Clear message after 3 seconds
      setTimeout(() => {
        updateMessage = '';
      }, 3000);

    } catch (err) {
      console.error('Failed to update profile:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      updateError = errorMessage;
    } finally {
      isUpdating = false;
    }
  }

  function setActiveSection(section: string) {
    activeSection = section;
  }
</script>

<svelte:head>
  <title>Settings - Docify</title>
  <meta name="description" content="Manage your Docify settings" />
</svelte:head>

<div class="settings-container">


  <div class="settings-layout">
    <!-- Sidebar Navigation -->
    <div class="settings-sidebar">
      <nav class="sidebar-nav">
        <button 
          class="sidebar-item" 
          class:active={activeSection === 'profile'}
          on:click={() => setActiveSection('profile')}
        >
          <svg class="sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          Profile
        </button>
        
        <button 
          class="sidebar-item" 
          class:active={activeSection === 'api-keys'}
          on:click={() => setActiveSection('api-keys')}
        >
          <svg class="sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M15 7h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-3"/>
            <path d="M10 17V7a2 2 0 0 1 2-2h3"/>
            <path d="M10 7H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3"/>
            <path d="M10 7v10"/>
          </svg>
          API Keys
        </button>
        
        <button 
          class="sidebar-item" 
          class:active={activeSection === 'collections'}
          on:click={() => setActiveSection('collections')}
        >
          <svg class="sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 3h18v18H3z"/>
            <path d="M3 9h18"/>
            <path d="M9 21V9"/>
          </svg>
          Collections
        </button>
      </nav>
    </div>

    <!-- Main Content Area -->
    <div class="settings-main">
      {#if activeSection === 'profile'}
        <!-- Profile Section -->
        <div class="settings-section">

          <div class="settings-card">
            <h3>Personal Information</h3>
            <form on:submit|preventDefault={updateProfile}>
              <div class="form-group">
                <label for="name">Display Name</label>
                <input
                  id="name"
                  type="text"
                  bind:value={name}
                  placeholder="Enter your display name"
                  required
                  disabled={isUpdating}
                />
              </div>

              <div class="form-group">
                <label for="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  placeholder="Your email address"
                  disabled
                />
                <small>Email address cannot be changed</small>
              </div>

              {#if updateMessage}
                <div class="success-message">
                  {updateMessage}
                </div>
              {/if}

              {#if updateError}
                <div class="error-message">
                  {updateError}
                </div>
              {/if}

              <button type="submit" class="btn btn-primary" disabled={isUpdating}>
                {#if isUpdating}
                  <span class="spinner"></span>
                  Saving...
                {:else}
                  Save Changes
                {/if}
              </button>
            </form>
          </div>

          <div class="settings-card">
            <h3>Account Actions</h3>
            <p>Manage your account and security</p>
            
            <div class="account-actions">
              <button class="btn btn-danger" on:click={() => auth.signOut()}>
                <svg class="btn-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clip-rule="evenodd" />
                </svg>
                Sign Out
              </button>
            </div>
          </div>
        </div>

      {:else if activeSection === 'api-keys'}
        <!-- API Keys Section -->
        <div class="settings-section">

          <div class="settings-card">
            <div class="coming-soon">
              <div class="coming-soon-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <h3>API Keys Coming Soon</h3>
              <p>We're working on API key management features. You'll be able to create, manage, and revoke API keys for programmatic access to your data.</p>
            </div>
          </div>
        </div>

      {:else if activeSection === 'collections'}
        <!-- Collections Section -->
        <div class="settings-section">

          <div class="settings-card">
            <div class="coming-soon">
              <div class="coming-soon-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <h3>Collections Coming Soon</h3>
              <p>We're building collection management features. You'll be able to organize your documents into collections, set permissions, and manage access controls.</p>
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .settings-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: var(--spacing-8) var(--spacing-4);
  }



  .settings-layout {
    display: grid;
    grid-template-columns: 250px 1fr;
    gap: var(--spacing-8);
    min-height: 600px;
    align-items: start;
  }

  .settings-main {
    min-width: 0;
    max-width: 600px;
  }

  /* Sidebar Styles */
  .settings-sidebar {
    background: var(--bg-primary);
    border: 1px solid var(--color-gray-200);
    border-radius: var(--radius-xl);
    padding: var(--spacing-4);
    box-shadow: var(--shadow-md);
    position: sticky;
    top: var(--spacing-8);
    height: fit-content;
  }

  .sidebar-nav {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
  }

  .sidebar-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-3);
    padding: var(--spacing-3) var(--spacing-4);
    border: none;
    background: none;
    border-radius: var(--radius-lg);
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease-in-out;
    text-align: left;
    width: 100%;
  }

  .sidebar-item:hover {
    background: var(--color-teal-50);
    color: var(--text-primary);
  }

  .sidebar-item.active {
    background: var(--color-teal);
    color: white;
  }

  .sidebar-icon {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
  }



  .settings-section {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-6);
  }



  .settings-card {
    background: var(--bg-primary);
    border: 1px solid var(--color-gray-200);
    border-radius: var(--radius-xl);
    padding: var(--spacing-6);
    box-shadow: var(--shadow-md);
    transition: all 0.2s ease-in-out;
  }

  .settings-card:hover {
    box-shadow: var(--shadow-lg);
    transform: translateY(-2px);
  }

  .settings-card h3 {
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 var(--spacing-2) 0;
  }

  .settings-card p {
    color: var(--text-secondary);
    margin: 0 0 var(--spacing-6) 0;
    font-size: var(--font-size-sm);
  }

  .settings-form {
    width: 100%;
  }

  .account-actions {
    display: flex;
    gap: var(--spacing-4);
    flex-wrap: wrap;
  }

  .btn-danger {
    background: #dc2626;
    color: white;
  }

  .btn-danger:hover:not(:disabled) {
    background: #b91c1c;
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }

  .btn-icon {
    width: 16px;
    height: 16px;
  }

  .form-group {
    margin-bottom: var(--spacing-4);
  }

  label {
    display: block;
    margin-bottom: var(--spacing-2);
    color: var(--text-primary);
    font-weight: 500;
    font-size: var(--font-size-sm);
  }

  input {
    width: 100%;
    padding: var(--spacing-3) var(--spacing-4);
    border: 1px solid var(--color-gray-300);
    border-radius: var(--radius-lg);
    font-size: var(--font-size-base);
    background-color: var(--bg-primary);
    color: var(--text-primary);
    transition: border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  }

  input:focus {
    outline: none;
    border-color: var(--color-teal);
    box-shadow: 0 0 0 3px rgb(20 184 166 / 0.1);
  }

  input:disabled {
    background-color: var(--color-gray-50);
    cursor: not-allowed;
  }

  small {
    color: var(--text-secondary);
    font-size: var(--font-size-xs);
    margin-top: var(--spacing-1);
    display: block;
  }

  .success-message {
    background: var(--color-teal-50);
    border: 1px solid var(--color-teal-100);
    color: var(--color-teal-900);
    padding: var(--spacing-3);
    border-radius: var(--radius-lg);
    margin-bottom: var(--spacing-4);
    font-size: var(--font-size-sm);
  }

  .error-message {
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #dc2626;
    padding: var(--spacing-3);
    border-radius: var(--radius-lg);
    margin-bottom: var(--spacing-4);
    font-size: var(--font-size-sm);
  }

  .form-actions {
    margin-top: 1.5rem;
  }

  .btn {
    padding: var(--spacing-3) var(--spacing-6);
    border: none;
    border-radius: var(--radius-lg);
    font-size: var(--font-size-base);
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease-in-out;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-2);
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-primary {
    background: var(--color-teal);
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background: var(--color-teal-dark);
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }

  .btn-secondary {
    background: var(--bg-primary);
    color: var(--text-primary);
    border: 1px solid var(--color-gray-200);
  }

  .btn-secondary:hover:not(:disabled) {
    background: var(--color-gray-50);
    border-color: var(--color-gray-300);
  }



  .spinner {
    width: 20px;
    height: 20px;
    border: 2px solid var(--color-gray-200);
    border-top: 2px solid var(--color-teal);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* Coming Soon Styles */
  .coming-soon {
    text-align: center;
    padding: var(--spacing-12) var(--spacing-8);
  }

  .coming-soon-icon {
    width: 64px;
    height: 64px;
    margin: 0 auto var(--spacing-6);
    color: #fbbf24;
  }

  .coming-soon-icon svg {
    width: 100%;
    height: 100%;
  }

  .coming-soon h3 {
    font-size: var(--font-size-xl);
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 var(--spacing-4) 0;
  }

  .coming-soon p {
    color: var(--text-secondary);
    margin: 0;
    font-size: var(--font-size-sm);
    line-height: 1.5;
    max-width: 400px;
    margin: 0 auto;
  }

  /* Responsive Design */
  @media (max-width: 1024px) {
    .settings-main {
      max-width: 100%;
    }
  }

  @media (max-width: 768px) {
    .settings-container {
      padding: var(--spacing-4) var(--spacing-2);
    }

    .settings-layout {
      grid-template-columns: 1fr;
      gap: var(--spacing-4);
    }

    .settings-sidebar {
      order: 2;
    }

    .settings-main {
      order: 1;
      max-width: 100%;
    }

    .sidebar-nav {
      flex-direction: row;
      overflow-x: auto;
      padding-bottom: var(--spacing-2);
    }

    .sidebar-item {
      white-space: nowrap;
      min-width: fit-content;
    }

    .settings-card {
      padding: var(--spacing-4);
    }
  }
</style>