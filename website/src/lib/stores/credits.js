import { writable, derived } from 'svelte/store';
import { account } from '$lib/appwrite.js';
import { user } from './auth.js';

// Credits state
export const credits = writable(0);
export const isLoading = writable(false);
export const error = writable(null);

// Initialize credits from user preferences
export async function initializeCredits() {
  try {
    isLoading.set(true);
    error.set(null);
    
    const currentUser = await account.get();
    if (currentUser && currentUser.prefs) {
      const userCredits = currentUser.prefs.credits || 0;
      credits.set(userCredits);
    } else {
      credits.set(0);
    }
  } catch (err) {
    console.error('Failed to initialize credits:', err);
    error.set('Failed to load credits');
    credits.set(0);
  } finally {
    isLoading.set(false);
  }
}

// Claim 5 credits (one-time bonus)
export async function claimCredits() {
  try {
    isLoading.set(true);
    error.set(null);
    
    const currentUser = await account.get();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    
    // Check if user has already claimed credits
    if (currentUser.prefs && currentUser.prefs.creditsClaimed === true) {
      throw new Error('You have already claimed your welcome credits!');
    }
    
    // Get current credits
    const currentCredits = currentUser.prefs?.credits || 0;
    const newCredits = currentCredits + 5;
    
    // Update user preferences with new credits and mark as claimed
    const updatedPrefs = {
      ...currentUser.prefs,
      credits: newCredits,
      creditsClaimed: true
    };
    
    await account.updatePrefs(updatedPrefs);
    
    // Update local state
    credits.set(newCredits);
    
    return { success: true, newCredits };
  } catch (err) {
    console.error('Failed to claim credits:', err);
    error.set(err.message || 'Failed to claim credits');
    throw err;
  } finally {
    isLoading.set(false);
  }
}

// Check if user has claimed credits
export async function hasClaimedCredits() {
  try {
    const currentUser = await account.get();
    return currentUser?.prefs?.creditsClaimed === true;
  } catch (err) {
    console.error('Failed to check credits claim status:', err);
    return false;
  }
}

// Spend credits
export async function spendCredits(amount) {
  try {
    isLoading.set(true);
    error.set(null);
    
    const currentUser = await account.get();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    
    const currentCredits = currentUser.prefs?.credits || 0;
    if (currentCredits < amount) {
      throw new Error('Insufficient credits');
    }
    
    const newCredits = currentCredits - amount;
    
    const updatedPrefs = {
      ...currentUser.prefs,
      credits: newCredits
    };
    
    await account.updatePrefs(updatedPrefs);
    credits.set(newCredits);
    
    return { success: true, newCredits };
  } catch (err) {
    console.error('Failed to spend credits:', err);
    error.set(err.message || 'Failed to spend credits');
    throw err;
  } finally {
    isLoading.set(false);
  }
}

// Add credits (for admin or other purposes)
export async function addCredits(amount) {
  try {
    isLoading.set(true);
    error.set(null);
    
    const currentUser = await account.get();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    
    const currentCredits = currentUser.prefs?.credits || 0;
    const newCredits = currentCredits + amount;
    
    const updatedPrefs = {
      ...currentUser.prefs,
      credits: newCredits
    };
    
    await account.updatePrefs(updatedPrefs);
    credits.set(newCredits);
    
    return { success: true, newCredits };
  } catch (err) {
    console.error('Failed to add credits:', err);
    error.set(err.message || 'Failed to add credits');
    throw err;
  } finally {
    isLoading.set(false);
  }
}

// Clear error
export function clearError() {
  error.set(null);
}