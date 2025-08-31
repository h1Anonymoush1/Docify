<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { user, isAuthenticated } from '$lib/stores/auth.js';
  import UserProfile from '$lib/components/auth/UserProfile.svelte';

  let isMenuOpen = $state(false);
  let isSearchOpen = $state(false);
  let searchQuery = $state('');

  // Dynamic navigation items based on authentication
  let navItems = $derived([
    { href: '/', label: 'Home', active: true },
    ...($isAuthenticated ? [
      { href: '/dashboard', label: 'Dashboard' },
      { href: '/explore', label: 'Explore' }
    ] : [])
  ]);



  function toggleMenu() {
    isMenuOpen = !isMenuOpen;
  }

  function closeMenu() {
    isMenuOpen = false;
  }



  function toggleSearch() {
    isSearchOpen = !isSearchOpen;
    if (isSearchOpen) {
      // Focus search input after a short delay to allow popup to render
      setTimeout(() => {
        const searchInput = document.querySelector('.search-input') as HTMLInputElement;
        if (searchInput) searchInput.focus();
      }, 100);
    }
  }

  function closeSearch() {
    isSearchOpen = false;
    searchQuery = '';
  }

  function handleSearchKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      closeSearch();
    }
  }

  function handleGlobalKeydown(event: KeyboardEvent) {
    // Cmd+K on Mac, Ctrl+K on Windows/Linux
    if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
      event.preventDefault(); // Prevent default browser behavior
      toggleSearch();
    }
  }

  // Set up global keyboard shortcut
  onMount(() => {
    document.addEventListener('keydown', handleGlobalKeydown);

    return () => {
      document.removeEventListener('keydown', handleGlobalKeydown);
    };
  });
</script>

<nav class="navbar">
  <div class="container">
    <div class="navbar-content">
      <!-- Logo/Brand -->
      <div class="navbar-brand">
        <a href="/" class="brand-link">
          <div class="brand-icon">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="32" rx="8" fill="var(--color-teal)"/>
              <path d="M8 12h16v2H8v-2zm0 4h16v2H8v-2zm0 4h12v2H8v-2z" fill="white"/>
            </svg>
          </div>
          <span class="brand-text">Docify</span>
        </a>
      </div>

      <!-- Desktop Navigation -->
      <div class="navbar-menu">
        {#each navItems as item}
          <a
            href={item.href}
            class="nav-link"
            class:active={$page.url.pathname === item.href}
            onclick={closeMenu}
          >
            {item.label}
          </a>
        {/each}


      </div>

      <!-- Search Button -->
      <button
        class="search-btn"
        onclick={toggleSearch}
        aria-label="Search (Cmd+K)"
        title="Search (Cmd+K)"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 21L16.5 16.5M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>

      <!-- User Profile (if authenticated) -->
      {#if $isAuthenticated}
        <div class="user-profile">
          <UserProfile />
        </div>
                 {:else}
             <!-- Auth Links (if not authenticated) -->
             <div class="auth-links">
               <a href="/auth" class="auth-link auth-link-primary">Get Started</a>
             </div>
           {/if}

      <!-- Mobile Menu Button -->
      <button
        class="mobile-menu-btn"
        onclick={toggleMenu}
        aria-label="Toggle menu"
      >
        <span class="hamburger-line" class:open={isMenuOpen}></span>
        <span class="hamburger-line" class:open={isMenuOpen}></span>
        <span class="hamburger-line" class:open={isMenuOpen}></span>
      </button>
    </div>

    <!-- Mobile Navigation Menu -->
    {#if isMenuOpen}
      <div class="mobile-menu">
        {#each navItems as item}
          <a
            href={item.href}
            class="mobile-nav-link"
            class:active={$page.url.pathname === item.href}
            onclick={closeMenu}
          >
            {item.label}
          </a>
        {/each}

                       {#if !$isAuthenticated}
                 <div class="mobile-auth-links">
                   <a href="/auth" class="mobile-nav-link mobile-auth-primary" onclick={closeMenu}>
                     Get Started
                   </a>
                 </div>
               {/if}
      </div>
    {/if}
  </div>

  <!-- Search Overlay -->
  {#if isSearchOpen}
    <div class="search-overlay" onclick={closeSearch} onkeydown={(e) => { if (e.key === 'Escape') closeSearch(); }} role="dialog" aria-label="Search" aria-modal="true" tabindex="-1">
      <div class="search-popup" role="document">
        <div class="search-header">
          <div class="search-input-container">
            <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 21L16.5 16.5M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <input
              type="text"
              class="search-input"
              placeholder="Search documentation..."
              bind:value={searchQuery}
              onkeydown={handleSearchKeydown}
            />
            <div class="search-shortcut">
              {#if navigator.platform.includes('Mac')}
                ⌘K
              {:else}
                Ctrl+K
              {/if}
            </div>
          </div>
          <button class="search-close-btn" onclick={closeSearch} aria-label="Close search">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>

        <div class="search-results">
          {#if searchQuery.trim() === ''}
            <div class="search-placeholder">
              <h3 class="placeholder-title">Quick Actions</h3>
              <div class="placeholder-actions">
                <div class="action-item">
                  <div class="action-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" fill="currentColor"/>
                      <path d="M14 8V2L20 8H14Z" fill="currentColor"/>
                    </svg>
                  </div>
                  <span>Search documentation</span>
                </div>
                <div class="action-item">
                  <div class="action-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor"/>
                      <path d="M2 17L12 22L22 17" fill="currentColor"/>
                      <path d="M2 12L12 17L22 12" fill="currentColor"/>
                    </svg>
                  </div>
                  <span>Browse categories</span>
                </div>
                <div class="action-item">
                  <div class="action-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" fill="currentColor"/>
                      <path d="M13 7H11V11H7V13H11V17H13V13H17V11H13V7Z" fill="white"/>
                    </svg>
                  </div>
                  <span>Create new document</span>
                </div>
              </div>
            </div>
          {:else}
            <div class="search-results-content">
              <div class="results-section">
                <h4 class="results-title">Recent Searches</h4>
                <div class="result-item">
                  <span>Getting started with Appwrite</span>
                  <span class="result-type">Documentation</span>
                </div>
                <div class="result-item">
                  <span>Database relationships</span>
                  <span class="result-type">Guide</span>
                </div>
                <div class="result-item">
                  <span>Getting started guide</span>
                  <span class="result-type">Tutorial</span>
                </div>
              </div>

              <div class="results-section">
                <h4 class="results-title">Suggested Results</h4>
                <div class="result-item">
                  <span>API documentation</span>
                  <span class="result-type">Reference</span>
                </div>
                <div class="result-item">
                  <span>Deployment guide</span>
                  <span class="result-type">Tutorial</span>
                </div>
                <div class="result-item">
                  <span>Best practices</span>
                  <span class="result-type">Article</span>
                </div>
              </div>
            </div>
          {/if}
        </div>
      </div>
    </div>
  {/if}
</nav>

<style>
  .navbar {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border-bottom: 1px solid rgba(0, 0, 0, .1);
    position: sticky;
    top: 0;
    z-index: 50;
  }

  .navbar-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-4) 0;
    min-height: 64px;
  }

  .navbar-brand {
    display: flex;
    align-items: center;
  }

  .brand-link {
    display: flex;
    align-items: center;
    gap: var(--spacing-3);
    text-decoration: none;
    color: rgba(17, 24, 39, 0.9);
    font-weight: 600;
    font-size: var(--font-size-lg);
    transition: color 0.2s ease-in-out;
  }

  .brand-link:hover {
    color: var(--color-teal);
  }

  .brand-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: var(--radius-lg);
    background-color: var(--bg-accent);
    transition: background-color 0.2s ease-in-out;
  }

  .brand-link:hover .brand-icon {
    background-color: var(--color-teal-100);
  }

  .brand-text {
    font-weight: 700;
    color: var(--color-teal);
  }

  .navbar-menu {
    display: flex;
    align-items: center;
    gap: var(--spacing-8);
  }

  .nav-link {
    color: rgba(107, 114, 128, 0.8);
    text-decoration: none;
    font-weight: 500;
    font-size: var(--font-size-base);
    padding: var(--spacing-2) var(--spacing-3);
    border-radius: var(--radius-md);
    transition: all 0.2s ease-in-out;
    position: relative;
  }

  .nav-link:hover {
    color: var(--color-teal);
    background-color: var(--color-teal-50);
  }



  .nav-link.active {
    color: var(--color-teal);
    background-color: var(--color-teal-50);
    font-weight: 600;
  }

  .nav-link.active::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 50%;
    transform: translateX(-50%);
    width: 20px;
    height: 2px;
    background-color: var(--color-teal);
    border-radius: 1px;
  }

  /* Mobile Menu Button */
  .mobile-menu-btn {
    display: none;
    flex-direction: column;
    justify-content: center;
    gap: 4px;
    width: 32px;
    height: 32px;
    background: none;
    border: none;
    cursor: pointer;
    padding: var(--spacing-2);
    border-radius: var(--radius-md);
    transition: background-color 0.2s ease-in-out;
  }

  .mobile-menu-btn:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }

  .hamburger-line {
    width: 20px;
    height: 2px;
    background-color: rgba(107, 114, 128, 0.8);
    border-radius: 1px;
    transition: all 0.3s ease-in-out;
    transform-origin: center;
  }

  .hamburger-line.open:nth-child(1) {
    transform: rotate(45deg) translate(6px, 6px);
  }

  .hamburger-line.open:nth-child(2) {
    opacity: 0;
  }

  .hamburger-line.open:nth-child(3) {
    transform: rotate(-45deg) translate(6px, -6px);
  }

  /* Search Button */
  .search-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: none;
    border: none;
    border-radius: var(--radius-lg);
    color: rgba(107, 114, 128, 0.8);
    cursor: pointer;
    transition: all 0.2s ease-in-out;
    margin-left: var(--spacing-4);
  }

  .search-btn:hover {
    background-color: rgba(255, 255, 255, 0.2);
    color: rgba(17, 24, 39, 0.9);
  }

  /* User Profile */
  .user-profile {
    display: flex;
    align-items: center;
    margin-left: var(--spacing-4);
  }

  /* Auth Links */
  .auth-links {
    display: flex;
    align-items: center;
    gap: var(--spacing-3);
    margin-left: var(--spacing-4);
  }

  .auth-link {
    text-decoration: none;
    font-weight: 500;
    font-size: var(--font-size-sm);
    padding: var(--spacing-2) var(--spacing-3);
    border-radius: var(--radius-md);
    transition: all 0.2s ease-in-out;
    color: var(--text-secondary);
  }

  .auth-link:hover {
    color: var(--text-primary);
    background-color: rgba(255, 255, 255, 0.1);
  }

  .auth-link-primary {
    background: var(--color-teal);
    color: white;
    border: 1px solid var(--color-teal);
  }

  .auth-link-primary:hover {
    background: var(--color-teal-dark);
    border-color: var(--color-teal-dark);
    color: white;
  }

  /* Search Overlay */
  .search-overlay {
    position: fixed;
    top: 40px; /* Start below navbar height */
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 999; /* Lower than navbar */
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding-top: var(--spacing-8);
    animation: fadeIn 0.2s ease-out;
  }

  /* Search Popup */
  .search-popup {
    background: var(--bg-primary);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-lg);
    border: 1px solid rgba(0, 0, 0, 0.1);
    width: 100%;
    max-width: 600px;
    margin: 0 var(--spacing-4);
    overflow: hidden;
    animation: slideDown 0.3s ease-out;
  }

  /* Search Header */
  .search-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-3);
    padding: var(--spacing-6);
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  }

  .search-input-container {
    flex: 1;
    display: flex;
    align-items: center;
    gap: var(--spacing-3);
    background: rgba(0, 0, 0, 0.05);
    border-radius: var(--radius-lg);
    padding: var(--spacing-3) var(--spacing-4);
    border: 1px solid rgba(0, 0, 0, 0.1);
    transition: border-color 0.2s ease-in-out;
  }

  .search-input-container:focus-within {
    border-color: var(--color-teal);
  }

  .search-icon {
    color: rgba(107, 114, 128, 0.6);
    flex-shrink: 0;
  }

  .search-input {
    flex: 1;
    border: none;
    background: none;
    font-size: var(--font-size-base);
    color: var(--text-primary);
    outline: none;
    min-width: 0;
  }

  .search-input::placeholder {
    color: rgba(107, 114, 128, 0.5);
  }

  .search-shortcut {
    color: rgba(107, 114, 128, 0.6);
    font-size: var(--font-size-xs);
    font-weight: 500;
    background: rgba(0, 0, 0, 0.05);
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-sm);
    border: 1px solid rgba(0, 0, 0, 0.1);
    user-select: none;
    pointer-events: none;
    flex-shrink: 0;
  }

  .search-close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: none;
    border: none;
    border-radius: var(--radius-lg);
    color: rgba(107, 114, 128, 0.6);
    cursor: pointer;
    transition: all 0.2s ease-in-out;
    flex-shrink: 0;
  }

  .search-close-btn:hover {
    background-color: rgba(0, 0, 0, 0.05);
    color: var(--text-primary);
  }

  /* Search Results */
  .search-results {
    max-height: 400px;
    overflow-y: auto;
  }

  .search-placeholder {
    padding: var(--spacing-8) var(--spacing-6);
    text-align: center;
  }

  .placeholder-title {
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: var(--spacing-6);
  }

  .placeholder-actions {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--spacing-4);
  }

  .action-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-3);
    padding: var(--spacing-4);
    border-radius: var(--radius-lg);
    background: rgba(0, 0, 0, 0.02);
    border: 1px solid rgba(0, 0, 0, 0.05);
    transition: all 0.2s ease-in-out;
    cursor: pointer;
  }

  .action-item:hover {
    background: rgba(20, 184, 166, 0.05);
    border-color: var(--color-teal);
  }

  .action-icon {
    color: var(--color-teal);
    flex-shrink: 0;
  }

  .action-item span {
    font-weight: 500;
    color: var(--text-primary);
  }

  .search-results-content {
    padding: var(--spacing-6);
  }

  .results-section {
    margin-bottom: var(--spacing-8);
  }

  .results-section:last-child {
    margin-bottom: 0;
  }

  .results-title {
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: rgba(107, 114, 128, 0.8);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: var(--spacing-4);
  }

  .result-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-3) var(--spacing-4);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: background-color 0.2s ease-in-out;
  }

  .result-item:hover {
    background-color: rgba(0, 0, 0, 0.02);
  }

  .result-item span:first-child {
    font-weight: 500;
    color: var(--text-primary);
  }

  .result-type {
    font-size: var(--font-size-sm);
    color: rgba(107, 114, 128, 0.6);
    background: rgba(0, 0, 0, 0.05);
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-sm);
    font-weight: 500;
  }

  /* Animations */
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Mobile responsive for search */
  @media (max-width: 768px) {
    .search-popup {
      margin: 0 var(--spacing-2);
      max-width: none;
    }

    .search-header {
      padding: var(--spacing-4);
    }

    .search-results {
      max-height: 300px;
    }

    .search-placeholder {
      padding: var(--spacing-6) var(--spacing-4);
    }

    .placeholder-actions {
      grid-template-columns: 1fr;
    }
  }

  .hamburger-line.open:nth-child(1) {
    transform: rotate(45deg) translate(6px, 6px);
  }

  .hamburger-line.open:nth-child(2) {
    opacity: 0;
  }

  .hamburger-line.open:nth-child(3) {
    transform: rotate(-45deg) translate(6px, -6px);
  }

  /* Mobile Menu */
  .mobile-menu {
    display: none;
    flex-direction: column;
    gap: var(--spacing-2);
    padding: var(--spacing-4) 0;
    border-top: 1px solid rgba(0, 0, 0, 1);
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
  }

  .mobile-nav-link {
    color: rgba(107, 114, 128, 0.8);
    text-decoration: none;
    font-weight: 500;
    font-size: var(--font-size-base);
    padding: var(--spacing-3) var(--spacing-4);
    border-radius: var(--radius-md);
    transition: all 0.2s ease-in-out;
    margin: 0 var(--spacing-4);
  }

  .mobile-nav-link:hover,
  .mobile-nav-link.active {
    color: var(--color-teal);
    background-color: var(--color-teal-50);
  }

  .mobile-auth-links {
    border-top: 1px solid rgba(0, 0, 0, 0.1);
    padding-top: var(--spacing-2);
    margin-top: var(--spacing-2);
  }

  .mobile-auth-primary {
    background: var(--color-teal);
    color: white !important;
    margin: 0 var(--spacing-4);
    text-align: center;
  }

  .mobile-auth-primary:hover {
    background: var(--color-teal-dark) !important;
  }

  /* Mobile responsive */
  @media (max-width: 768px) {
    .navbar-menu {
      display: none;
    }

    .mobile-menu-btn {
      display: flex;
    }

    .mobile-menu {
      display: flex;
    }

    .navbar-content {
      padding: var(--spacing-3) 0;
    }

    .brand-text {
      font-size: var(--font-size-base);
    }
  }

  .hamburger-line.open:nth-child(1) {
    transform: rotate(45deg) translate(6px, 6px);
  }

  .hamburger-line.open:nth-child(2) {
    opacity: 0;
  }

  .hamburger-line.open:nth-child(3) {
    transform: rotate(-45deg) translate(6px, -6px);
  }

  /* Mobile Menu */
  .mobile-menu {
    display: none;
    flex-direction: column;
    gap: var(--spacing-2);
    padding: var(--spacing-4) 0;
    border-top: 1px solid rgba(0, 0, 0, 1);
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
  }

  .mobile-nav-link {
    color: rgba(107, 114, 128, 0.8);
    text-decoration: none;
    font-weight: 500;
    font-size: var(--font-size-base);
    padding: var(--spacing-3) var(--spacing-4);
    border-radius: var(--radius-md);
    transition: all 0.2s ease-in-out;
    margin: 0 var(--spacing-4);
  }

  .mobile-nav-link:hover,
  .mobile-nav-link.active {
    color: var(--color-teal);
    background-color: var(--color-teal-50);
  }

  /* Mobile responsive */
  @media (max-width: 768px) {
    .navbar-menu {
      display: none;
    }

    .mobile-menu-btn {
      display: flex;
    }

    .mobile-menu {
      display: flex;
    }

    .navbar-content {
      padding: var(--spacing-3) 0;
    }

    .brand-text {
      font-size: var(--font-size-base);
    }
  }
</style>