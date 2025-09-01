<script lang="ts">
  import { onMount } from 'svelte';
  import { credits, claimCredits, hasClaimedCredits, initializeCredits } from '$lib/stores/credits.js';
  import { auth } from '$lib/stores/auth.js';
  import { goto } from '$app/navigation';

  let claimStatus: "idle" | "loading" | "success" | "error" = $state("idle");
  let claimMessage = $state("");
  let hasClaimed = $state(false);
  let showBanner = $state(true);

  onMount(async () => {
    try {
      const currentUser = await auth.getCurrentUser();
      if (currentUser) {
        await initializeCredits();
        hasClaimed = await hasClaimedCredits();
      }
    } catch (err) {
      console.log('Credits banner initialization failed');
    }
  });

  async function handleClaimCredits() {
    if (claimStatus === "loading") return;

    try {
      // Check if user is authenticated
      const currentUser = await auth.getCurrentUser();
      if (!currentUser) {
        // Redirect to auth page if not logged in
        goto('/auth');
        return;
      }

      claimStatus = "loading";
      claimMessage = "";

      const result = await claimCredits();
      claimStatus = "success";
      claimMessage = `🎉 Successfully claimed 5 credits! You now have ${result.newCredits} credits.`;
      hasClaimed = true;

      // Auto-hide banner after 5 seconds
      setTimeout(() => {
        showBanner = false;
      }, 5000);

    } catch (err: any) {
      claimStatus = "error";
      claimMessage = err.message || 'Failed to claim credits';
    }
  }


</script>

{#if showBanner && !hasClaimed}
  <div class="credits-banner">
    <div class="banner-content">
      <div class="banner-text">
        <span class="banner-message">
          {#if claimStatus === "success"}
            {claimMessage}
          {:else}
            Welcome! Claim your 5 free credits to get started with Docify
          {/if}
        </span>
      </div>

      <div class="banner-actions">
        {#if claimStatus === "loading"}
          <div class="spinner small"></div>
          <span>Claiming...</span>
        {:else if claimStatus === "success"}
          <span class="success-text">Credits claimed!</span>
        {:else}
          <button class="btn btn-claim" onclick={handleClaimCredits}>
            Claim 5 Credits
          </button>
        {/if}
      </div>


    </div>

    {#if claimStatus === "error"}
      <div class="banner-error">
        {claimMessage}
      </div>
    {/if}
  </div>
{/if}

<style>
  .credits-banner {
    background: linear-gradient(135deg, var(--color-teal-50) 0%, var(--color-teal-100) 100%);
    color: var(--text-primary);
    padding: var(--spacing-3) var(--spacing-4);
    position: relative;
    box-shadow: 0 2px 8px rgba(20, 184, 166, 0.15);
    border-bottom: 1px solid var(--color-teal-200);
    z-index: 10;
    border-radius: 0;
  }

  .banner-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-4);
    max-width: 1200px;
    margin: 0 auto;
  }

  .banner-text {
    display: flex;
    align-items: center;
    flex: 1;
  }

  .banner-message {
    font-weight: 500;
    font-size: var(--font-size-base);
    line-height: 1.4;
    color: var(--text-primary);
  }

  .banner-actions {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    flex-shrink: 0;
  }

  .btn {
    padding: var(--spacing-2) var(--spacing-4);
    border: none;
    border-radius: var(--radius-md);
    font-size: var(--font-size-sm);
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease-in-out;
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-2);
  }

  .btn-claim {
    background: var(--color-teal);
    color: white;
    border: 2px solid var(--color-teal);
  }

  .btn-claim:hover {
    background: var(--color-teal-dark);
    border-color: var(--color-teal-dark);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(20, 184, 166, 0.3);
  }



  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid transparent;
    border-top: 2px solid var(--color-teal);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .spinner.small {
    width: 14px;
    height: 14px;
    border-width: 1.5px;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .success-text {
    color: var(--color-teal);
    font-weight: 600;
    font-size: var(--font-size-sm);
  }

  .banner-error {
    background: rgba(239, 68, 68, 0.1);
    color: var(--color-red-700, #b91c1c);
    padding: var(--spacing-2) var(--spacing-4);
    border-radius: var(--radius-md);
    margin-top: var(--spacing-2);
    font-size: var(--font-size-sm);
    font-weight: 500;
    text-align: center;
    border: 1px solid rgba(239, 68, 68, 0.2);
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .credits-banner {
      padding: var(--spacing-3) var(--spacing-2);
    }

    .banner-content {
      flex-direction: column;
      gap: var(--spacing-3);
      text-align: center;
    }

    .banner-text {
      justify-content: center;
    }

    .banner-actions {
      justify-content: center;
    }

    .banner-message {
      font-size: var(--font-size-sm);
    }
  }

  @media (max-width: 480px) {
    .banner-content {
      gap: var(--spacing-2);
    }

    .banner-message {
      font-size: var(--font-size-sm);
      line-height: 1.3;
    }

    .btn-claim {
      padding: var(--spacing-2) var(--spacing-3);
      font-size: var(--font-size-xs);
    }
  }
</style>
