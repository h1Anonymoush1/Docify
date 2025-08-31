<script lang="ts">
  import "../app.css";
  import { client } from "$lib/appwrite";
  import { AppwriteException } from "appwrite";
  import { onMount } from 'svelte';
  import { auth } from '$lib/stores/auth.js';
  import {
    PUBLIC_APPWRITE_ENDPOINT,
    PUBLIC_APPWRITE_PROJECT_ID,
    PUBLIC_APPWRITE_PROJECT_NAME,
  } from "$env/static/public";

  type LogEntry = {
    date: Date;
    method: string;
    path: string;
    response: string;
    status: number;
  };

  let logs = $state<Array<LogEntry>>([]);
  let status = $state<"idle" | "loading" | "success" | "error">("idle");
  let showLogs = $state(false);

  onMount(async () => {
    console.log('🏠 Home page loaded');
  });

  async function sendPing() {
    if (status === "loading") return;
    status = "loading";
    try {
      /* @ts-ignore */
      const result = await client.ping();
      const log = {
        date: new Date(),
        method: "GET",
        path: "/v1/ping",
        status: 200,
        response: JSON.stringify(result),
      };
      logs = [log, ...logs];
      status = "success";
    } catch (err) {
      const log = {
        date: new Date(),
        method: "GET",
        path: "/v1/ping",
        status: err instanceof AppwriteException ? err.code : 500,
        response:
          err instanceof AppwriteException
            ? err.message
            : "Something went wrong",
      };
      logs = [log, ...logs];
      status = "error";
    } finally {
      showLogs = true;
    }
  }

  async function testAuth() {
    try {
      console.log('Testing authentication...');
      const currentUser = await auth.getCurrentUser();
      console.log('Auth test result:', currentUser);
      
      if (currentUser) {
        alert('Authentication successful! User: ' + currentUser.email);
      } else {
        alert('No authenticated user found');
      }
    } catch (err) {
      console.error('Auth test failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      alert('Authentication test failed: ' + errorMessage);
    }
  }

  async function testOAuth() {
    try {
      console.log('Testing OAuth configuration...');
      console.log('Current origin:', window.location.origin);
      console.log('Success URL:', `${window.location.origin}/auth/success`);
      console.log('Failure URL:', `${window.location.origin}/auth/error`);
      
      // Test if we can create an OAuth token
      const token = await auth.signInWithGitHub();
      console.log('OAuth token result:', token);
      
      if (token) {
        alert('OAuth token created successfully! Check console for details.');
      }
    } catch (err) {
      console.error('OAuth test failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      alert('OAuth test failed: ' + errorMessage);
    }
  }
</script>

<svelte:head>
  <title>Docify - Modern Documentation Platform</title>
  <meta name="description" content="A modern documentation platform built with SvelteKit and Appwrite" />
</svelte:head>

<!-- Main Content -->
<main class="main-content">
  <div class="container">
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">
          Welcome to <span class="text-teal">Docify</span>
        </h1>
        <p class="hero-subtitle">
          A modern documentation platform built for the Appwrite Sites Hackathon 2025.
          Create, manage, and share your documentation with ease.
        </p>
        <div class="hero-actions">
          <button class="btn btn-primary" onclick={sendPing}>
            {#if status === "loading"}
              <div class="spinner"></div>
              Testing Connection...
            {:else}
              Test Appwrite Connection
            {/if}
          </button>
          
          <button class="btn btn-secondary" onclick={testAuth}>
            Test Authentication
          </button>
          
          <button class="btn btn-secondary" onclick={testOAuth}>
            Test OAuth Config
          </button>
      </div>

        {#if status === "success"}
          <div class="status-message success">
            <div class="status-icon">✓</div>
            <span>Successfully connected to Appwrite!</span>
    </div>
        {:else if status === "error"}
          <div class="status-message error">
            <div class="status-icon">✕</div>
            <span>Connection failed. Please check your configuration.</span>
    </div>
        {/if}
      </div>
    </section>

    <!-- Features Grid -->
    <section class="features-section">
      <h2 class="section-title">Get Started</h2>
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" fill="var(--color-teal)"/>
              <path d="M14 8V2L20 8H14Z" fill="var(--color-teal-600)"/>
              <path d="M16 13H8V15H16V13Z" fill="white"/>
              <path d="M16 17H8V19H16V17Z" fill="white"/>
              <path d="M14 9H8V11H14V9Z" fill="white"/>
            </svg>
    </div>
          <h3 class="feature-title">Create Documents</h3>
          <p class="feature-description">
            Start building your documentation with our intuitive editor and modern interface.
          </p>
  </div>

        <a href="https://cloud.appwrite.io" target="_blank" rel="noopener noreferrer" class="feature-card feature-link">
          <div class="feature-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="var(--color-teal)"/>
              <path d="M2 17L12 22L22 17" fill="var(--color-teal-600)"/>
              <path d="M2 12L12 17L22 12" fill="var(--color-teal-600)"/>
            </svg>
          </div>
          <h3 class="feature-title">Appwrite Console</h3>
          <p class="feature-description">
            Manage your Appwrite services, databases, and configurations from the cloud console.
          </p>
        </a>

        <a href="https://appwrite.io/docs" target="_blank" rel="noopener noreferrer" class="feature-card feature-link">
          <div class="feature-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" fill="var(--color-teal)"/>
              <path d="M13 7H11V11H7V13H11V17H13V13H17V11H13V7Z" fill="white"/>
          </svg>
        </div>
          <h3 class="feature-title">Explore Docs</h3>
          <p class="feature-description">
            Discover the full power of Appwrite by diving into our comprehensive documentation.
          </p>
        </a>
      </div>
    </section>

    <!-- Duplicate Hero Section for Scroll -->
    <section class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">
          Build <span class="text-teal">Documentation</span> Effortlessly
      </h1>
        <p class="hero-subtitle">
          Transform any documentation into structured, interactive summaries with AI-powered analysis.
          Share your knowledge with the world through our modern platform.
        </p>
        <div class="hero-actions">
          <button class="btn btn-secondary" onclick={sendPing}>
            {#if status === "loading"}
              <div class="spinner"></div>
              Testing Connection...
    {:else}
              Learn More
    {/if}
          </button>
        </div>

      {#if status === "success"}
          <div class="status-message success">
            <div class="status-icon">✓</div>
            <span>Ready to get started!</span>
          </div>
        {:else if status === "error"}
          <div class="status-message error">
            <div class="status-icon">✕</div>
            <span>Something went wrong. Please try again.</span>
          </div>
      {/if}
      </div>
  </section>

    <!-- Duplicate Features Section -->
    <section class="features-section">
      <h2 class="section-title">Why Choose Docify?</h2>
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 12L11 14L15 10" stroke="var(--color-teal)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="12" cy="12" r="9" stroke="var(--color-teal)" stroke-width="2"/>
            </svg>
          </div>
          <h3 class="feature-title">AI-Powered Analysis</h3>
          <p class="feature-description">
            Advanced AI algorithms analyze your documentation and generate comprehensive summaries.
      </p>
    </div>

        <div class="feature-card">
          <div class="feature-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="var(--color-teal)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="var(--color-teal)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="var(--color-teal)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M16 3.13C16.8604 3.3503 17.623 3.8507 18.1676 4.5523C18.7122 5.2539 19.0078 6.1168 19.0078 7.005C19.0078 7.8932 18.7122 8.7561 18.1676 9.4577C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="var(--color-teal)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h3 class="feature-title">Team Collaboration</h3>
          <p class="feature-description">
            Work together with your team to create and maintain comprehensive documentation.
          </p>
        </div>

        <div class="feature-card">
          <div class="feature-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="var(--color-teal)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M2 12H22" stroke="var(--color-teal)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M12 2C14.5013 4.73835 15.9228 8.29203 16 12C15.9228 15.708 14.5013 19.2616 12 22C9.49872 19.2616 8.07725 15.708 8 12C8.07725 8.29203 9.49872 4.73835 12 2Z" stroke="var(--color-teal)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h3 class="feature-title">Global Access</h3>
          <p class="feature-description">
            Access your documentation from anywhere in the world with our cloud-based platform.
          </p>
        </div>
      </div>
    </section>

    <!-- Stats Section -->
    <section class="stats-section">
      <div class="stats-container">
        <h2 class="section-title">Trusted by Developers Worldwide</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-number">10K+</div>
            <div class="stat-label">Documents Created</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">5K+</div>
            <div class="stat-label">Active Users</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">50+</div>
            <div class="stat-label">Countries</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">99.9%</div>
            <div class="stat-label">Uptime</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Testimonials Section -->
    <section class="testimonials-section">
      <h2 class="section-title">What Our Users Say</h2>
      <div class="testimonials-grid">
        <div class="testimonial-card">
          <div class="testimonial-quote">
            "Docify has revolutionized how we document our APIs. The AI-powered analysis is incredibly accurate and saves us hours of work."
          </div>
          <div class="testimonial-author">
            <div class="author-name">Sarah Chen</div>
            <div class="author-role">Lead Developer, TechCorp</div>
          </div>
        </div>
        <div class="testimonial-card">
          <div class="testimonial-quote">
            "The collaboration features make it easy for our team to work together. Best documentation platform we've used."
          </div>
          <div class="testimonial-author">
            <div class="author-name">Mike Johnson</div>
            <div class="author-role">Product Manager, StartupXYZ</div>
          </div>
        </div>
        <div class="testimonial-card">
          <div class="testimonial-quote">
            "From setup to deployment, Docify made everything so simple. The frosted glass design is beautiful too!"
          </div>
          <div class="testimonial-author">
            <div class="author-name">Alex Rodriguez</div>
            <div class="author-role">Full Stack Developer</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Another Features Section -->
    <section class="features-section">
      <h2 class="section-title">Advanced Features</h2>
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 19V6L21 3V16" stroke="var(--color-teal)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M9 6L3 9V20L9 19" stroke="var(--color-teal)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M3 9L9 6L21 3L15 6" stroke="var(--color-teal)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h3 class="feature-title">Version Control</h3>
          <p class="feature-description">
            Keep track of changes and maintain multiple versions of your documentation.
          </p>
        </div>

        <div class="feature-card">
          <div class="feature-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="var(--color-teal)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M17 9L12 4L7 9" stroke="var(--color-teal)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M12 4V15" stroke="var(--color-teal)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h3 class="feature-title">Export Options</h3>
          <p class="feature-description">
            Export your documentation in multiple formats including PDF, Markdown, and HTML.
          </p>
        </div>

        <div class="feature-card">
          <div class="feature-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="var(--color-teal)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="var(--color-teal)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="var(--color-teal)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h3 class="feature-title">Real-time Sync</h3>
          <p class="feature-description">
            Your changes are automatically saved and synced across all your devices in real-time.
          </p>
        </div>
      </div>
    </section>

    <!-- Final Call to Action Section -->
    <section class="cta-section">
      <div class="cta-content">
        <h2 class="cta-title">Ready to Transform Your Documentation?</h2>
        <p class="cta-subtitle">
          Join thousands of developers who are already using Docify to create amazing documentation.
        </p>
        <div class="cta-actions">
          <button class="btn btn-primary" onclick={sendPing}>
            Get Started Today
          </button>
          <button class="btn btn-secondary">
            View Demo
          </button>
        </div>
      </div>
    </section>

    <!-- Logs Section -->
    {#if showLogs}
      <section class="logs-section">
        <div class="logs-header">
          <h3 class="logs-title">Connection Logs</h3>
          {#if logs.length > 0}
            <span class="logs-count">{logs.length}</span>
          {/if}
        </div>

        <div class="logs-content">
          <div class="logs-sidebar">
            <h4 class="logs-sidebar-title">Project Configuration</h4>
            <div class="logs-config">
              <div class="config-item">
                <span class="config-label">Endpoint</span>
                <span class="config-value">{PUBLIC_APPWRITE_ENDPOINT}</span>
        </div>
              <div class="config-item">
                <span class="config-label">Project ID</span>
                <span class="config-value">{PUBLIC_APPWRITE_PROJECT_ID}</span>
          </div>
              <div class="config-item">
                <span class="config-label">Project Name</span>
                <span class="config-value">{PUBLIC_APPWRITE_PROJECT_NAME}</span>
            </div>
            </div>
          </div>

          <div class="logs-table-container">
            <table class="logs-table">
            <thead>
                <tr>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Method</th>
                  <th>Path</th>
                  <th>Response</th>
              </tr>
            </thead>
            <tbody>
                {#each logs as log}
                  <tr>
                    <td class="log-date">
                      {log.date.toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td>
                      <span class="status-badge" class:success={log.status < 400} class:error={log.status >= 400}>
                          {log.status}
                      </span>
                    </td>
                    <td class="log-method">{log.method}</td>
                    <td class="log-path">{log.path}</td>
                    <td class="log-response">{log.response}</td>
                  </tr>
                {:else}
                  <tr>
                    <td colspan="5" class="no-logs">No logs to show</td>
                  </tr>
                {/each}
            </tbody>
          </table>
        </div>
      </div>
      </section>
    {/if}
  </div>
</main>

<style>
  .main-content {
    min-height: 100vh;
    background-color: var(--bg-secondary);
  }

  .hero-section {
    padding: var(--spacing-16) 0 var(--spacing-12) 0;
    text-align: center;
  }

  .hero-content {
    max-width: 600px;
    margin: 0 auto;
  }

  .hero-title {
    font-size: var(--font-size-3xl);
    font-weight: 300;
    color: var(--text-primary);
    margin-bottom: var(--spacing-4);
    line-height: 1.2;
  }

  .text-teal {
    color: var(--color-teal);
    font-weight: 600;
  }

  .hero-subtitle {
    font-size: var(--font-size-lg);
    color: var(--text-secondary);
    line-height: 1.6;
    margin-bottom: var(--spacing-8);
  }

  .hero-actions {
    margin-bottom: var(--spacing-6);
  }

  .status-message {
    display: flex;
    align-items: center;
    gap: var(--spacing-3);
    padding: var(--spacing-4);
    border-radius: var(--radius-lg);
    font-weight: 500;
  }

  .status-message.success {
    background-color: var(--color-teal-50);
    color: var(--color-teal-900);
    border: 1px solid var(--color-teal-200);
  }

  .status-message.error {
    background-color: #fef2f2;
    color: #991b1b;
    border: 1px solid #fecaca;
  }

  .status-icon {
    font-size: var(--font-size-lg);
    font-weight: bold;
  }

  .features-section {
    padding: var(--spacing-12) 0;
  }

  .section-title {
    font-size: var(--font-size-2xl);
    font-weight: 300;
    color: var(--text-primary);
    text-align: center;
    margin-bottom: var(--spacing-8);
  }

  .features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: var(--spacing-6);
    margin-top: var(--spacing-8);
  }

  .feature-card {
    background-color: var(--bg-primary);
    border-radius: var(--radius-xl);
    border: 1px solid var(--color-gray-200);
    padding: var(--spacing-6);
    box-shadow: var(--shadow-sm);
    transition: all 0.2s ease-in-out;
    text-decoration: none;
    color: inherit;
  }

  .feature-card:hover {
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
  }

  .feature-link:hover {
    color: inherit;
  }

  .feature-icon {
    width: 48px;
    height: 48px;
    background-color: var(--color-teal-50);
    border-radius: var(--radius-lg);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: var(--spacing-4);
  }

  .feature-title {
    font-size: var(--font-size-xl);
    font-weight: 500;
    color: var(--text-primary);
    margin-bottom: var(--spacing-2);
  }

  .feature-description {
    color: var(--text-secondary);
    line-height: 1.5;
  }

  .logs-section {
    padding: var(--spacing-12) 0;
    border-top: 1px solid var(--color-gray-200);
  }

  .logs-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--spacing-6);
  }

  .logs-title {
    font-size: var(--font-size-xl);
    font-weight: 500;
    color: var(--text-primary);
  }

  .logs-count {
    background-color: var(--color-gray-100);
    color: var(--text-primary);
    padding: var(--spacing-1) var(--spacing-3);
    border-radius: var(--radius-md);
    font-size: var(--font-size-sm);
    font-weight: 600;
  }

  .logs-content {
    background-color: var(--bg-primary);
    border-radius: var(--radius-xl);
    border: 1px solid var(--color-gray-200);
    overflow: hidden;
  }

  .logs-sidebar {
    background-color: var(--bg-secondary);
    padding: var(--spacing-6);
    border-right: 1px solid var(--color-gray-200);
  }

  .logs-sidebar-title {
    font-size: var(--font-size-base);
    font-weight: 600;
    color: var(--text-secondary);
    margin-bottom: var(--spacing-4);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .logs-config {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-4);
  }

  .config-item {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-1);
  }

  .config-label {
    font-size: var(--font-size-sm);
    color: var(--text-muted);
    font-weight: 500;
  }

  .config-value {
    font-size: var(--font-size-sm);
    color: var(--text-primary);
    font-family: 'Fira Code', monospace;
    word-break: break-all;
  }

  .logs-table-container {
    overflow-x: auto;
  }

  .logs-table {
    width: 100%;
    border-collapse: collapse;
  }

  .logs-table th,
  .logs-table td {
    padding: var(--spacing-3) var(--spacing-4);
    text-align: left;
    border-bottom: 1px solid var(--color-gray-200);
  }

  .logs-table th {
    background-color: var(--bg-secondary);
    font-weight: 600;
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .log-date {
    font-family: 'Fira Code', monospace;
    font-size: var(--font-size-sm);
  }

  .status-badge {
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-xs);
    font-weight: 600;
    text-align: center;
    min-width: 40px;
    display: inline-block;
  }

  .status-badge.success {
    background-color: rgba(16, 185, 129, 0.1);
    color: #065f46;
  }

  .status-badge.error {
    background-color: rgba(239, 68, 68, 0.1);
    color: #b91c1c;
  }

  .log-method {
    font-weight: 600;
    color: var(--color-teal);
  }

  .log-path,
  .log-response {
    font-family: 'Fira Code', monospace;
    font-size: var(--font-size-sm);
  }

  .no-logs {
    text-align: center;
    color: var(--text-muted);
    font-style: italic;
    padding: var(--spacing-8);
  }

  /* Stats Section */
  .stats-section {
    padding: var(--spacing-16) 0;
    background: linear-gradient(135deg, var(--color-teal-50) 0%, var(--bg-accent) 100%);
  }

  .stats-container {
    max-width: 1000px;
    margin: 0 auto;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--spacing-8);
    margin-top: var(--spacing-12);
  }

  .stat-card {
    background-color: var(--bg-primary);
    border-radius: var(--radius-xl);
    padding: var(--spacing-8);
    text-align: center;
    box-shadow: var(--shadow-lg);
    border: 1px solid var(--color-gray-200);
    transition: transform 0.2s ease-in-out;
  }

  .stat-card:hover {
    transform: translateY(-4px);
  }

  .stat-number {
    font-size: var(--font-size-3xl);
    font-weight: 700;
    color: var(--color-teal);
    margin-bottom: var(--spacing-2);
  }

  .stat-label {
    font-size: var(--font-size-base);
    color: var(--text-secondary);
    font-weight: 500;
  }

  /* Testimonials Section */
  .testimonials-section {
    padding: var(--spacing-16) 0;
    background-color: var(--bg-secondary);
  }

  .testimonials-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: var(--spacing-8);
    margin-top: var(--spacing-12);
  }

  .testimonial-card {
    background-color: var(--bg-primary);
    border-radius: var(--radius-xl);
    padding: var(--spacing-8);
    box-shadow: var(--shadow-md);
    border: 1px solid var(--color-gray-200);
    transition: all 0.2s ease-in-out;
  }

  .testimonial-card:hover {
    box-shadow: var(--shadow-lg);
    transform: translateY(-2px);
  }

  .testimonial-quote {
    font-size: var(--font-size-lg);
    line-height: 1.6;
    color: var(--text-primary);
    font-style: italic;
    margin-bottom: var(--spacing-6);
    position: relative;
  }

  .testimonial-quote::before {
    content: '"';
    font-size: var(--font-size-3xl);
    color: var(--color-teal);
    position: absolute;
    top: -10px;
    left: -15px;
    font-family: serif;
  }

  .testimonial-author {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-1);
  }

  .author-name {
    font-weight: 600;
    color: var(--text-primary);
    font-size: var(--font-size-base);
  }

  .author-role {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
  }

  /* CTA Section */
  .cta-section {
    padding: var(--spacing-16) 0;
    background: linear-gradient(135deg, var(--color-teal) 0%, var(--color-teal-600) 100%);
    color: white;
  }

  .cta-content {
    max-width: 600px;
    margin: 0 auto;
    text-align: center;
  }

  .cta-title {
    font-size: var(--font-size-3xl);
    font-weight: 300;
    margin-bottom: var(--spacing-4);
    line-height: 1.2;
  }

  .cta-subtitle {
    font-size: var(--font-size-lg);
    line-height: 1.6;
    margin-bottom: var(--spacing-8);
    opacity: 0.9;
  }

  .cta-actions {
    display: flex;
    gap: var(--spacing-4);
    justify-content: center;
    flex-wrap: wrap;
  }

  .cta-actions .btn {
    background-color: white;
    color: var(--color-teal);
    border: 2px solid white;
  }

  .cta-actions .btn:hover {
    background-color: transparent;
    color: white;
  }

  .cta-actions .btn-secondary {
    background-color: transparent;
    color: white;
    border: 2px solid white;
  }

  .cta-actions .btn-secondary:hover {
    background-color: white;
    color: var(--color-teal);
  }

  @media (max-width: 768px) {
    .hero-section {
      padding: var(--spacing-12) 0 var(--spacing-8) 0;
    }

    .hero-title {
      font-size: var(--font-size-2xl);
    }

    .features-grid {
      grid-template-columns: 1fr;
      gap: var(--spacing-4);
    }

    .stats-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: var(--spacing-4);
    }

    .testimonials-grid {
      grid-template-columns: 1fr;
      gap: var(--spacing-6);
    }

    .cta-title {
      font-size: var(--font-size-2xl);
    }

    .cta-actions {
      flex-direction: column;
      align-items: center;
    }

    .cta-actions .btn {
      width: 100%;
      max-width: 300px;
    }

    .logs-content {
      display: flex;
      flex-direction: column;
    }

    .logs-sidebar {
      border-right: none;
      border-bottom: 1px solid var(--color-gray-200);
    }

    .logs-table th:nth-child(4),
    .logs-table th:nth-child(5),
    .logs-table td:nth-child(4),
    .logs-table td:nth-child(5) {
      display: none;
    }
  }

  @media (max-width: 480px) {
    .stats-grid {
      grid-template-columns: 1fr;
    }

    .stat-number {
      font-size: var(--font-size-2xl);
    }
  }
</style>
