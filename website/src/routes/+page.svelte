<script lang="ts">
  import "../app.css";
  import CreditsBanner from '$lib/components/CreditsBanner.svelte';
</script>

<svelte:head>
  <title>Docify - Modern Documentation Platform</title>
  <meta name="description" content="A modern documentation platform built with SvelteKit and Appwrite" />
</svelte:head>

<!-- Main Content -->
<main class="main-content">
  <CreditsBanner />
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
          <a href="/auth" class="btn btn-primary">
            Get Started
          </a>
          <a href="#features" class="btn btn-secondary">
            Learn More
          </a>
          </div>
      </div>
    </section>

    <!-- Features Grid -->
    <section id="features" class="features-section">
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





    <!-- Final Call to Action Section -->
    <section class="cta-section">
      <div class="cta-content">
        <h2 class="cta-title">Ready to Transform Your Documentation?</h2>
        <p class="cta-subtitle">
          Join thousands of developers who are already using Docify to create amazing documentation.
        </p>
        <div class="cta-actions">
          <a href="/auth" class="btn btn-primary">
            Get Started Today
          </a>
          <a href="#features" class="btn btn-secondary">
            View Features
          </a>
        </div>
      </div>
    </section>


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
