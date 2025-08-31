import { writable, derived } from 'svelte/store';
import { account, OAuthProvider } from '$lib/appwrite.js';
import { goto } from '$app/navigation';
import { browser } from '$app/environment';

// Authentication state
export const user = writable(null);
export const isLoading = writable(false);
export const error = writable(null);
export const isAuthenticated = derived(user, ($user) => !!$user);

// Initialize auth state
if (browser) {
  initializeAuth();
}

async function initializeAuth() {
  try {
    isLoading.set(true);
    const currentUser = await account.get();
    user.set(currentUser);
  } catch (err) {
    // Handle different types of authentication errors
    if (err.message && err.message.includes('\ufffd')) {
      console.warn('Authentication error: Invalid character encoding detected. This may be due to missing environment variables.');
      error.set('Authentication service is not properly configured. Please check your environment settings.');
    } else if (err.code === 401 || err.message?.includes('401')) {
      // User is not authenticated - this is expected
      user.set(null);
    } else {
      console.error('Authentication initialization error:', err);
      error.set('Failed to initialize authentication. Please try refreshing the page.');
    }
    user.set(null);
  } finally {
    isLoading.set(false);
  }
}

// Authentication methods
export const auth = {

  // OAuth Authentication
    async signInWithGitHub() {
    try {
      isLoading.set(true);
      error.set(null);

      // Check if GitHub OAuth provider is configured
      try {
        // Use createOAuth2Token to avoid cross-domain cookie issues
        const token = await account.createOAuth2Token(
          OAuthProvider.Github,
          `${window.location.origin}/auth/success`,
          `${window.location.origin}/auth/error`
        );

        return token;
      } catch (oauthErr) {
        // If OAuth token fails, try session-based OAuth
        await account.createOAuth2Session(
          OAuthProvider.Github,
          `${window.location.origin}/auth/success`,
          `${window.location.origin}/auth/error`
        );

        return null;
      }
    } catch (err) {
      error.set(err.message);
      throw err;
    } finally {
      isLoading.set(false);
    }
  },

          async signInWithGoogle() {
    try {
      isLoading.set(true);
      error.set(null);
      
      // Try token-based OAuth first (like GitHub)
      try {
        const token = await account.createOAuth2Token(
          OAuthProvider.Google,
          `${window.location.origin}/auth/success`,
          `${window.location.origin}/auth/error`
        );
        
        return token;
      } catch (oauthErr) {
        // Fall back to session-based OAuth
        await account.createOAuth2Session(
          OAuthProvider.Google,
          `${window.location.origin}/auth/success`,
          `${window.location.origin}/auth/error`
        );
        
        return null;
      }
    } catch (err) {
      error.set(err.message);
      throw err;
    } finally {
      isLoading.set(false);
    }
  },

  // Session Management
  async signOut() {
    try {
      isLoading.set(true);
      error.set(null);
      
      await account.deleteSession('current');
      user.set(null);
      
      // Redirect to home page
      goto('/');
    } catch (err) {
      error.set(err.message);
      throw err;
    } finally {
      isLoading.set(false);
    }
  },

  async getCurrentUser() {
    try {
      const currentUser = await account.get();
      user.set(currentUser);
      return currentUser;
    } catch (err) {
      user.set(null);
      return null;
    }
  },

    // Update user name
  async updateName(newName) {
    try {
      isLoading.set(true);
      error.set(null);

      const updatedUser = await account.updateName(newName);

      // Update the user store
      user.set(updatedUser);

      return updatedUser;
    } catch (err) {
      error.set(err.message);
      throw err;
    } finally {
      isLoading.set(false);
    }
  },

  // Clear error
  clearError() {
    error.set(null);
  }
};