<script lang="ts">
  import { auth, user, isLoading } from '$lib/stores/auth.js';
  import { credits, initializeCredits } from '$lib/stores/credits.js';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  interface User {
    name?: string;
    email?: string;
    $id?: string;
  }
  
  let showDropdown = false;
  
  function toggleDropdown() {
    showDropdown = !showDropdown;
  }
  
  function closeDropdown() {
    showDropdown = false;
  }
  
  async function handleSignOut() {
    try {
      await auth.signOut();
      closeDropdown();
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  }
  
  // Initialize credits when component mounts
  onMount(async () => {
    if ($user) {
      try {
        await initializeCredits();
      } catch (err) {
        console.log('Failed to initialize credits:', err);
      }
    }
  });

</script>

{#if $user}
  <div class="user-profile" class:dropdown-open={showDropdown}>
    <button class="profile-button" on:click={toggleDropdown} disabled={$isLoading}>
      <div class="avatar">
        {#if $user.name}
          {$user.name.charAt(0).toUpperCase()}
        {:else if $user.email}
          {$user.email.charAt(0).toUpperCase()}
        {:else}
          U
        {/if}
      </div>
      <span class="user-name">
        {$user.name || $user.email || 'User'}
      </span>
      <svg class="dropdown-arrow" class:rotated={showDropdown} viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
      </svg>
    </button>
    
    {#if showDropdown}
      <div class="dropdown-menu">
        <div class="dropdown-header">
          <div class="user-info">
            <div class="avatar large">
              {#if $user.name}
                {$user.name.charAt(0).toUpperCase()}
              {:else if $user.email}
                {$user.email.charAt(0).toUpperCase()}
              {:else}
                U
              {/if}
            </div>
            <div class="user-details">
              <div class="user-name">{$user.name || 'User'}</div>
              <div class="user-email">{$user.email}</div>
              <div class="user-credits">
                <span class="credits-icon">💳</span>
                <span class="credits-amount">{$credits} credits</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="dropdown-divider"></div>
        
        <div class="dropdown-items">
          <button class="dropdown-item" on:click={() => { goto('/settings'); closeDropdown(); }}>
            <svg class="item-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
            </svg>
            Settings
          </button>
          
          <div class="dropdown-divider"></div>
          
          <button class="dropdown-item sign-out" on:click={handleSignOut}>
            <svg class="item-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clip-rule="evenodd" />
            </svg>
            Sign Out
          </button>
        </div>
      </div>
    {/if}
  </div>
{:else}
  <div class="auth-buttons">
    <a href="/auth" class="btn btn-primary">Get Started</a>
  </div>
{/if}

<!-- Click outside to close dropdown -->
{#if showDropdown}
  <div class="dropdown-overlay" on:click={closeDropdown}></div>
{/if}

<style>
  .user-profile {
    position: relative;
  }
  
  .profile-button {
    display: flex;
    align-items: center;
    gap: var(--spacing-3);
    padding: var(--spacing-2) var(--spacing-4);
    background: var(--color-teal-50);
    border: none;
    border-radius: var(--radius-lg);
    cursor: pointer;
    transition: all 0.2s ease-in-out;
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--color-teal);
    height: 40px;
  }

  .profile-button:hover {
    background: var(--color-teal-100);
    color: var(--color-teal);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(20, 184, 166, 0.15);
  }
  
  .profile-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--color-teal);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 0.875rem;
  }
  
  .avatar.large {
    width: 48px;
    height: 48px;
    font-size: 1.125rem;
  }
  
  .user-name {
    font-weight: 600;
    color: var(--color-teal);
  }
  
  .dropdown-arrow {
    width: 16px;
    height: 16px;
    color: var(--color-teal);
    transition: transform 0.2s ease-in-out;
  }
  
  .dropdown-arrow.rotated {
    transform: rotate(180deg);
  }
  
  .dropdown-menu {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: var(--spacing-2);
    background: var(--bg-primary);
    border: 1px solid var(--color-teal-200);
    border-radius: var(--radius-lg);
    box-shadow: 0 10px 15px -3px rgba(20, 184, 166, 0.1), 0 4px 6px -2px rgba(20, 184, 166, 0.05);
    min-width: 240px;
    z-index: 50;
  }
  
  .dropdown-header {
    padding: var(--spacing-4);
  }
  
  .user-info {
    display: flex;
    align-items: center;
    gap: var(--spacing-3);
  }
  
  .user-details {
    flex: 1;
  }
  
  .user-email {
    font-size: var(--font-size-xs);
    color: var(--text-secondary);
    margin-top: var(--spacing-1);
  }
  
  .user-credits {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    margin-top: 0.5rem;
    padding: 0.25rem 0.5rem;
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
    color: white;
    width: fit-content;
  }
  
  .credits-icon {
    font-size: 0.875rem;
  }
  
  .credits-amount {
    font-size: 0.75rem;
  }
  
  .dropdown-divider {
    height: 1px;
    background: var(--color-teal-200);
    margin: var(--spacing-2) 0;
  }
  
  .dropdown-items {
    padding: var(--spacing-2) 0;
  }
  
  .dropdown-item {
    width: 100%;
    display: flex;
    align-items: center;
    gap: var(--spacing-3);
    padding: var(--spacing-3) var(--spacing-4);
    background: none;
    border: none;
    text-align: left;
    cursor: pointer;
    transition: all 0.2s ease-in-out;
    font-size: var(--font-size-sm);
    color: var(--text-primary);
    font-weight: 500;
  }

  .dropdown-item:hover {
    background: var(--color-teal-50);
    color: var(--color-teal);
  }
  
  .dropdown-item.sign-out {
    color: var(--color-red-600);
  }

  .dropdown-item.sign-out:hover {
    background: var(--color-red-50);
    color: var(--color-red-700);
  }
  
  .item-icon {
    width: 16px;
    height: 16px;
  }
  
  .auth-buttons {
    display: flex;
    gap: 0.75rem;
    align-items: center;
  }
  
  .btn {
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    text-decoration: none;
    transition: all 0.2s;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  
  .btn-primary {
    background: #3b82f6;
    color: white;
    border: 1px solid #3b82f6;
  }
  
  .btn-primary:hover {
    background: #2563eb;
    border-color: #2563eb;
  }
  

  
  .dropdown-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 40;
  }
</style>