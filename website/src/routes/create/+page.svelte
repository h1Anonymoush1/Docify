<script lang="ts">
  // Create new document page
</script>

<main class="create-page">
  <div class="container">
    <div class="create-header">
      <h1>Create New Document</h1>
      <p class="create-description">Start creating your new document by choosing a template or starting from scratch.</p>
    </div>

    <div class="create-options">
      <div class="option-card">
        <div class="option-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" fill="currentColor"/>
            <path d="M14 8V2L20 8H14Z" fill="currentColor"/>
          </svg>
        </div>
        <h3>Blank Document</h3>
        <p>Start with a clean slate and build your document from scratch.</p>
        <button class="btn btn-primary">Create Blank</button>
      </div>

      <div class="option-card">
        <div class="option-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor"/>
            <path d="M2 17L12 22L22 17" fill="currentColor"/>
            <path d="M2 12L12 17L22 12" fill="currentColor"/>
          </svg>
        </div>
        <h3>From Template</h3>
        <p>Choose from pre-made templates to get started quickly.</p>
        <button class="btn btn-secondary">Browse Templates</button>
      </div>
    </div>
  </div>
</main>

<style>
  .create-page {
    min-height: 100vh;
    padding: var(--spacing-8) var(--spacing-4);
    background: var(--bg-primary);
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
  }

  .create-header {
    text-align: center;
    margin-bottom: var(--spacing-12);
  }

  .create-header h1 {
    font-size: var(--font-size-4xl);
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: var(--spacing-4);
  }

  .create-description {
    font-size: var(--font-size-lg);
    color: var(--text-secondary);
    max-width: 600px;
    margin: 0 auto;
  }

  .create-options {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: var(--spacing-8);
    max-width: 800px;
    margin: 0 auto;
  }

  .option-card {
    background: var(--bg-primary);
    border: 1px solid var(--color-teal-200);
    border-radius: var(--radius-lg);
    padding: var(--spacing-8);
    text-align: center;
    transition: all 0.2s ease-in-out;
    box-shadow: 0 2px 8px rgba(20, 184, 166, 0.1);
  }

  .option-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(20, 184, 166, 0.15);
    border-color: var(--color-teal);
  }

  .option-icon {
    color: var(--color-teal);
    margin-bottom: var(--spacing-4);
  }

  .option-card h3 {
    font-size: var(--font-size-xl);
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: var(--spacing-2);
  }

  .option-card p {
    color: var(--text-secondary);
    margin-bottom: var(--spacing-6);
    line-height: 1.5;
  }

  .btn {
    padding: var(--spacing-3) var(--spacing-6);
    border-radius: var(--radius-lg);
    font-weight: 600;
    font-size: var(--font-size-sm);
    cursor: pointer;
    transition: all 0.2s ease-in-out;
    border: none;
  }

  .btn-primary {
    background: var(--color-teal);
    color: white;
  }

  .btn-primary:hover {
    background: var(--color-teal-dark);
    transform: translateY(-1px);
  }

  .btn-secondary {
    background: var(--bg-primary);
    color: var(--color-teal);
    border: 1px solid var(--color-teal);
  }

  .btn-secondary:hover {
    background: var(--color-teal-50);
  }
</style>
