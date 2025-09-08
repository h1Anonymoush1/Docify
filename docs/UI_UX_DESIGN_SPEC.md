# Docify UI/UX Design Specification

## Overview
Docify features a clean, modern design focused on document analysis workflows. The interface emphasizes simplicity, clarity, and efficient information consumption through a structured 3x3 grid layout.

## Design System

### Color Palette

#### Primary Colors
```scss
$primary-50: #f0f9ff;
$primary-100: #e0f2fe;
$primary-500: #0ea5e9;
$primary-600: #0284c7;
$primary-700: #0369a1;
$primary-900: #0c4a6e;
```

#### Semantic Colors
```scss
$success: #10b981;
$warning: #f59e0b;
$error: #ef4444;
$info: #3b82f6;

$text-primary: #111827;
$text-secondary: #6b7280;
$text-muted: #9ca3af;

$background: #ffffff;
$surface: #f9fafb;
$border: #e5e7eb;
```

#### Status Colors
```scss
$status-pending: #f59e0b;
$status-scraping: #3b82f6;
$status-analyzing: #8b5cf6;
$status-completed: #10b981;
$status-failed: #ef4444;
```

### Typography

#### Font Families
- **Primary**: Inter (sans-serif) - Clean, modern, highly readable
- **Monospace**: JetBrains Mono - For code blocks and technical content

#### Font Sizes
```scss
$text-xs: 0.75rem;   // 12px
$text-sm: 0.875rem;  // 14px
$text-base: 1rem;    // 16px
$text-lg: 1.125rem;  // 18px
$text-xl: 1.25rem;   // 20px
$text-2xl: 1.5rem;   // 24px
$text-3xl: 1.875rem; // 30px
$text-4xl: 2.25rem;  // 36px
```

#### Font Weights
```scss
$font-light: 300;
$font-normal: 400;
$font-medium: 500;
$font-semibold: 600;
$font-bold: 700;
```

### Spacing Scale
```scss
$space-1: 0.25rem;   // 4px
$space-2: 0.5rem;    // 8px
$space-3: 0.75rem;   // 12px
$space-4: 1rem;      // 16px
$space-6: 1.5rem;    // 24px
$space-8: 2rem;      // 32px
$space-12: 3rem;     // 48px
$space-16: 4rem;     // 64px
$space-24: 6rem;     // 96px
```

### Component Tokens

#### Buttons
```scss
.btn-primary {
  background: $primary-500;
  color: white;
  padding: $space-3 $space-6;
  border-radius: 0.5rem;
  font-weight: $font-medium;
  transition: all 0.2s ease;

  &:hover {
    background: $primary-600;
    transform: translateY(-1px);
  }

  &:active {
    background: $primary-700;
  }
}

.btn-secondary {
  background: white;
  color: $text-primary;
  border: 1px solid $border;
  // ... same padding and border-radius

  &:hover {
    background: $surface;
  }
}
```

#### Cards
```scss
.card {
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: $space-6;
  transition: box-shadow 0.2s ease;

  &:hover {
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
}
```

## Layout System

### 3x3 Grid Layout

#### Grid Structure
```
┌─────────────────┬─────────────────┬─────────────────┐
│   Document      │   Document      │   Document      │
│   Info          │   Info          │   Info          │
│   (URL, Title,  │   (Status,      │   (Actions,     │
│    Date)        │    Progress)    │    Settings)    │
├─────────────────┴─────────────────┴─────────────────┤
│                                                       │
│                 Analysis Blocks                       │
│                                                       │
│   ┌─────────────┬─────────────┬─────────────┐         │
│   │  Summary    │  Block 2    │  Block 3    │         │
│   │  (Always    │             │             │         │
│   │   Large)    │             │             │         │
│   ├─────────────┼─────────────┼─────────────┤         │
│   │  Block 4    │  Block 5    │  Block 6    │         │
│   │             │             │             │         │
│   └─────────────┴─────────────┴─────────────┘         │
│                                                       │
└───────────────────────────────────────────────────────┘
```

#### CSS Grid Implementation
```scss
.document-detail {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-template-rows: auto 1fr;
  gap: $space-6;
  min-height: 100vh;
  padding: $space-8;

  .document-header {
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: 2fr 1fr 1fr;
    gap: $space-4;
    align-items: start;
  }

  .analysis-grid {
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(2, 1fr);
    gap: $space-4;
  }
}
```

### Responsive Design

#### Breakpoints
```scss
$breakpoint-sm: 640px;
$breakpoint-md: 768px;
$breakpoint-lg: 1024px;
$breakpoint-xl: 1280px;
```

#### Mobile Layout (≤ 768px)
```
┌─────────────────┐
│   Document      │
│   Info          │
│   (Stacked)     │
├─────────────────┤
│                 │
│   Summary       │
│   (Full Width)  │
├─────────────────┤
│   Block 2       │
├─────────────────┤
│   Block 3       │
├─────────────────┤
│   Block 4       │
├─────────────────┤
│   Block 5       │
├─────────────────┤
│   Block 6       │
└─────────────────┘
```

#### Tablet Layout (768px - 1024px)
```
┌─────────┬─────────┐
│  Doc    │  Doc    │
│  Info   │  Info   │
├─────────┴─────────┤
│                   │
│     Summary       │
│   (2 columns)     │
├─────────┬─────────┤
│ Block 2 │ Block 3 │
├─────────┼─────────┤
│ Block 4 │ Block 5 │
├─────────┴─────────┤
│     Block 6      │
└───────────────────┘
```

## Component Design

### Document List

#### Grid View
```scss
.document-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: $space-6;

  .document-card {
    @extend .card;

    .document-title {
      @extend .text-lg;
      font-weight: $font-semibold;
      margin-bottom: $space-2;
    }

    .document-url {
      @extend .text-sm;
      color: $text-secondary;
      margin-bottom: $space-3;
    }

    .document-status {
      display: inline-flex;
      align-items: center;
      gap: $space-2;

      &.status-pending {
        color: $status-pending;
      }

      &.status-completed {
        color: $status-completed;
      }
    }
  }
}
```

#### List View
```scss
.document-list {
  .document-row {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 0.5fr;
    gap: $space-4;
    padding: $space-4;
    border-bottom: 1px solid $border;

    &:hover {
      background: $surface;
    }
  }
}
```

### Analysis Blocks

#### Block Container
```scss
.analysis-block {
  @extend .card;
  height: 100%;
  display: flex;
  flex-direction: column;

  &.size-small {
    // Fits 3 per row
  }

  &.size-medium {
    grid-column: span 2;
  }

  &.size-large {
    grid-column: span 3;
  }

  .block-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $space-4;

    .block-title {
      @extend .text-lg;
      font-weight: $font-semibold;
    }

    .block-type {
      @extend .text-sm;
      color: $text-secondary;
      background: $surface;
      padding: $space-1 $space-2;
      border-radius: 0.25rem;
    }
  }

  .block-content {
    flex: 1;
    overflow-y: auto;

    // Block type specific styles
    &.type-summary {
      font-size: $text-base;
      line-height: 1.6;
    }

    &.type-code {
      font-family: 'JetBrains Mono', monospace;
      background: #f8f9fa;
      padding: $space-3;
      border-radius: 0.5rem;
    }

    &.type-mermaid {
      text-align: center;
      padding: $space-4;
    }
  }
}
```

### Form Components

#### Document Creation Form
```scss
.document-form {
  @extend .card;
  max-width: 600px;

  .form-group {
    margin-bottom: $space-6;

    label {
      display: block;
      @extend .text-sm;
      font-weight: $font-medium;
      color: $text-primary;
      margin-bottom: $space-2;
    }

    input, textarea {
      width: 100%;
      padding: $space-3;
      border: 1px solid $border;
      border-radius: 0.5rem;
      font-size: $text-base;

      &:focus {
        outline: none;
        border-color: $primary-500;
        box-shadow: 0 0 0 3px rgba($primary-500, 0.1);
      }
    }

    textarea {
      min-height: 100px;
      resize: vertical;
    }
  }

  .form-actions {
    display: flex;
    gap: $space-3;
    justify-content: flex-end;
  }
}
```

## User Experience Flows

### Document Creation Flow

1. **Empty State**
   ```
   ┌─────────────────────────────────────┐
   │           No documents yet          │
   │                                     │
   │         [Create Your First]         │
   │            Document                 │
   │                                     │
   │        Drag & drop or click         │
   │          to add content             │
   └─────────────────────────────────────┘
   ```

2. **Form State**
   ```
   ┌─────────────────────────────────────┐
   │         Create New Document         │
   │                                     │
   │ Title: [_________________________]  │
   │                                     │
   │ URL: [____________________________] │
   │                                     │
   │ Instructions:                       │
   │ [_________________________________]  │
   │ [_________________________________]  │
   │                                     │
   │              [Cancel] [Create]      │
   └─────────────────────────────────────┘
   ```

3. **Processing State**
   ```
   ┌─────────────────────────────────────┐
   │           Processing...             │
   │                                     │
   │        ⭕ Scraping content          │
   │        ⭕ Analyzing with AI         │
   │        ⭕ Generating blocks         │
   │                                     │
   │     This may take a few minutes    │
   └─────────────────────────────────────┘
   ```

### Analysis Results Display

#### Loading State
```scss
.analysis-loading {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $space-4;

  .loading-block {
    @extend .card;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 200px;

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid $surface;
      border-top: 4px solid $primary-500;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

#### Error State
```scss
.analysis-error {
  @extend .card;
  text-align: center;
  padding: $space-8;

  .error-icon {
    font-size: $text-4xl;
    color: $error;
    margin-bottom: $space-4;
  }

  .error-title {
    @extend .text-xl;
    font-weight: $font-semibold;
    color: $text-primary;
    margin-bottom: $space-2;
  }

  .error-message {
    color: $text-secondary;
    margin-bottom: $space-6;
  }

  .error-actions {
    display: flex;
    gap: $space-3;
    justify-content: center;
  }
}
```

## Accessibility

### ARIA Labels
```html
<!-- Document list -->
<div role="grid" aria-label="Your documents">
  <div role="row">
    <div role="gridcell" aria-label="Document title">My Document</div>
    <div role="gridcell" aria-label="Document status">Completed</div>
  </div>
</div>

<!-- Analysis blocks -->
<section aria-label="Document analysis">
  <div role="article" aria-labelledby="summary-title">
    <h3 id="summary-title">Document Summary</h3>
    <div>Summary content...</div>
  </div>
</section>
```

### Keyboard Navigation
```scss
// Focus management
*:focus {
  outline: 2px solid $primary-500;
  outline-offset: 2px;
}

// Skip links
.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: $primary-500;
  color: white;
  padding: $space-2;
  text-decoration: none;
  border-radius: 0.25rem;

  &:focus {
    top: 6px;
  }
}
```

### Color Contrast
- **Normal text**: 4.5:1 contrast ratio
- **Large text**: 3:1 contrast ratio
- **Interactive elements**: 3:1 contrast ratio

## Animation & Micro-interactions

### Loading States
```scss
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.loading-skeleton {
  background: linear-gradient(90deg, $surface 25%, transparent 37%, $surface 63%);
  background-size: 400% 100%;
  animation: loading 1.4s ease-in-out infinite;
}

@keyframes loading {
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: -100% 0;
  }
}
```

### Hover Effects
```scss
.document-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  }
}
```

### Status Transitions
```scss
.status-indicator {
  transition: all 0.3s ease;

  &.status-pending {
    background: $status-pending;
  }

  &.status-scraping {
    background: $status-scraping;
    animation: pulse 2s infinite;
  }

  &.status-completed {
    background: $status-completed;
  }
}
```

## Dark Mode Support

### Color Scheme Toggle
```scss
[data-theme="dark"] {
  --color-background: #111827;
  --color-surface: #1f2937;
  --color-text-primary: #f9fafb;
  --color-text-secondary: #d1d5db;
  --color-border: #374151;
}
```

### Theme Implementation
```typescript
const ThemeProvider: React.FC = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') as 'light' | 'dark' || 'light';
    }
    return 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
```

---

*This UI/UX specification provides a comprehensive design system and component library for the Docify platform, ensuring consistent and accessible user experiences across all devices and interaction modes.*
