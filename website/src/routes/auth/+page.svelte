<script lang="ts">
  import { goto } from "$app/navigation";
  import { account } from "$lib/appwrite";
  import { AppwriteException } from "appwrite";
  import { onMount } from "svelte";

  let isLogin = $state(true);
  let email = $state("");
  let password = $state("");
  let name = $state("");
  let isSubmitting = $state(false);
  let error = $state("");
  let success = $state("");

  // Check if user is already logged in
  onMount(async () => {
    try {
      await account.get();
      goto("/dashboard");
    } catch (err) {
      // User not logged in, show auth form
    }
  });

  async function handleSubmit() {
    if (!email.trim() || !password.trim() || (!isLogin && !name.trim())) {
      error = "Please fill in all fields";
      return;
    }

    if (!isLogin && password.length < 8) {
      error = "Password must be at least 8 characters";
      return;
    }

    isSubmitting = true;
    error = "";
    success = "";

    try {
      if (isLogin) {
        // Login
        await account.createEmailPasswordSession(email.trim(), password);
        success = "Login successful!";
        setTimeout(() => goto("/dashboard"), 1000);
      } else {
        // Sign up
        const user = await account.create('unique()', email.trim(), password, name.trim());
        success = "Account created successfully! You can now log in.";
        isLogin = true;
        password = "";
      }
    } catch (err) {
      if (err instanceof AppwriteException) {
        switch (err.code) {
          case 400:
            error = "Invalid email or password format";
            break;
          case 401:
            error = "Invalid credentials";
            break;
          case 409:
            error = "An account with this email already exists";
            break;
          default:
            error = err.message;
        }
      } else {
        error = "An unexpected error occurred";
      }
    } finally {
      isSubmitting = false;
    }
  }

  function toggleMode() {
    isLogin = !isLogin;
    error = "";
    success = "";
    password = "";
    name = "";
  }
</script>

<svelte:head>
  <title>{isLogin ? 'Sign In' : 'Sign Up'} - Docify</title>
</svelte:head>

<main class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
  <div class="max-w-md w-full">
    <!-- Logo -->
    <div class="text-center mb-8">
      <div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <span class="text-white font-bold text-2xl">D</span>
      </div>
      <h1 class="text-3xl font-bold text-gray-900">Welcome to Docify</h1>
      <p class="text-gray-600 mt-2">
        {isLogin ? 'Sign in to your account' : 'Create your account to get started'}
      </p>
    </div>

    <!-- Auth Form -->
    <div class="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
      <form onsubmit={handleSubmit} class="space-y-6">
        {#if !isLogin}
          <div>
            <label for="name" class="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              bind:value={name}
              placeholder="Enter your full name"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              disabled={isSubmitting}
              required
            />
          </div>
        {/if}

        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            bind:value={email}
            placeholder="Enter your email"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            disabled={isSubmitting}
            required
          />
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <input
            id="password"
            type="password"
            bind:value={password}
            placeholder={isLogin ? "Enter your password" : "Create a password (min 8 chars)"}
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            disabled={isSubmitting}
            required
          />
        </div>

        {#if error}
          <div class="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p class="text-red-700 text-sm">{error}</p>
          </div>
        {/if}

        {#if success}
          <div class="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p class="text-green-700 text-sm">{success}</p>
          </div>
        {/if}

        <button
          type="submit"
          disabled={isSubmitting}
          class="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
        >
          {#if isSubmitting}
            <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span>{isLogin ? 'Signing in...' : 'Creating account...'}</span>
          {:else}
            <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
          {/if}
        </button>
      </form>

      <!-- Toggle between login/signup -->
      <div class="mt-6 text-center">
        <button
          onclick={toggleMode}
          class="text-blue-600 hover:text-blue-700 text-sm font-medium"
          disabled={isSubmitting}
        >
          {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>

    <!-- Back to home -->
    <div class="text-center mt-6">
      <button
        onclick={() => goto('/')}
        class="text-gray-600 hover:text-gray-800 text-sm"
      >
        ← Back to home
      </button>
    </div>
  </div>
</main>
