# Docify Error Handling Specification

## Overview
Comprehensive error handling ensures system reliability, user experience, and debugging capabilities. Errors are categorized, logged, and communicated appropriately to users and developers.

## Error Categories

### 1. User Input Errors
**Scope**: Invalid data from users
**Examples**: Invalid URL, malformed instructions, missing fields
**Handling**: Immediate validation with clear messages

```typescript
interface ValidationError {
  field: string;
  message: string;
  code: 'VALIDATION_ERROR';
}

const validateDocumentInput = (data: CreateDocumentData): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!data.title?.trim()) {
    errors.push({
      field: 'title',
      message: 'Document title is required',
      code: 'VALIDATION_ERROR'
    });
  }

  if (!data.url?.trim()) {
    errors.push({
      field: 'url',
      message: 'URL is required',
      code: 'VALIDATION_ERROR'
    });
  } else if (!isValidUrl(data.url)) {
    errors.push({
      field: 'url',
      message: 'Please enter a valid URL',
      code: 'VALIDATION_ERROR'
    });
  }

  return errors;
};
```

### 2. Authentication Errors
**Scope**: Login, registration, session issues
**Examples**: Invalid credentials, expired sessions, unauthorized access

```typescript
const AUTH_ERRORS = {
  INVALID_CREDENTIALS: 'Invalid email or password',
  ACCOUNT_NOT_VERIFIED: 'Please verify your email before logging in',
  SESSION_EXPIRED: 'Your session has expired. Please log in again',
  RATE_LIMITED: 'Too many login attempts. Please try again later',
  ACCOUNT_BLOCKED: 'Account is temporarily blocked'
};
```

### 3. System Processing Errors
**Scope**: Scraping and analysis failures
**Examples**: Network timeouts, parsing errors, LLM failures

```typescript
interface ProcessingError {
  stage: 'scraping' | 'analyzing';
  reason: string;
  retryable: boolean;
  userMessage: string;
}

const PROCESSING_ERRORS = {
  NETWORK_TIMEOUT: {
    stage: 'scraping',
    reason: 'Network request timed out',
    retryable: true,
    userMessage: 'Connection timed out. We\'ll retry automatically.'
  },
  INVALID_CONTENT: {
    stage: 'scraping',
    reason: 'Content could not be parsed',
    retryable: false,
    userMessage: 'Unable to process this content. Please try a different URL.'
  },
  LLM_QUOTA_EXCEEDED: {
    stage: 'analyzing',
    reason: 'Hugging Face API quota exceeded',
    retryable: true,
    userMessage: 'Analysis service is busy. We\'ll retry shortly.'
  }
};
```

### 4. Infrastructure Errors
**Scope**: Database, API, server issues
**Examples**: Connection failures, service outages, rate limits

## Error Response Format

### API Error Response
```typescript
interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: {
      field?: string;
      retryAfter?: number;
      correlationId?: string;
    };
  };
}

// Example error responses
const errorResponses = {
  validation: {
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Invalid input data',
      details: {
        field: 'url',
        correlationId: 'req_123456'
      }
    }
  },

  processing: {
    success: false,
    error: {
      code: 'PROCESSING_FAILED',
      message: 'Document analysis failed',
      details: {
        retryAfter: 300,
        correlationId: 'proc_789012'
      }
    }
  }
};
```

## Error Handling Strategies

### 1. Retry Mechanisms

#### Exponential Backoff
```typescript
class RetryHandler {
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        if (!this.isRetryable(error) || attempt === maxRetries) {
          throw error;
        }

        const delay = baseDelay * Math.pow(2, attempt);
        await this.delay(delay);
      }
    }

    throw lastError;
  }

  private isRetryable(error: any): boolean {
    // Network errors, timeouts, rate limits
    return error.code === 'NETWORK_ERROR' ||
           error.code === 'TIMEOUT' ||
           error.status === 429;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

#### Circuit Breaker Pattern
```typescript
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'closed';
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.failureThreshold) {
      this.state = 'open';
    }
  }
}
```

### 2. Graceful Degradation

#### Fallback Content
```typescript
const getAnalysisWithFallback = async (documentId: string) => {
  try {
    return await performLLMAnalysis(documentId);
  } catch (error) {
    console.error('LLM analysis failed:', error);

    // Fallback to basic analysis
    return generateBasicAnalysis(documentId);
  }
};

const generateBasicAnalysis = (documentId: string) => {
  return {
    summary: 'Basic content summary (LLM unavailable)',
    blocks: [
      {
        id: 'fallback-summary',
        type: 'summary',
        size: 'large',
        title: 'Basic Summary',
        content: 'Content analysis temporarily unavailable. Please try again later.'
      }
    ]
  };
};
```

### 3. User Communication

#### Error Messages by Context
```typescript
const getUserFriendlyMessage = (error: AppError): string => {
  switch (error.code) {
    case 'SCRAPING_FAILED':
      return 'We couldn\'t access the webpage. Please check the URL and try again.';

    case 'ANALYSIS_TIMEOUT':
      return 'Analysis is taking longer than expected. We\'ll notify you when it\'s ready.';

    case 'QUOTA_EXCEEDED':
      return 'Our analysis service is busy. Please try again in a few minutes.';

    case 'INVALID_URL':
      return 'Please provide a valid URL starting with http:// or https://';

    default:
      return 'Something went wrong. Please try again or contact support.';
  }
};
```

#### Progressive Error Disclosure
```typescript
interface ErrorDisplay {
  title: string;
  message: string;
  action?: {
    label: string;
    handler: () => void;
  };
  details?: string; // For advanced users
}

const getErrorDisplay = (error: AppError): ErrorDisplay => {
  const baseDisplay = {
    title: 'Something went wrong',
    message: getUserFriendlyMessage(error)
  };

  if (error.retryable) {
    return {
      ...baseDisplay,
      action: {
        label: 'Try Again',
        handler: () => retryOperation(error.context)
      }
    };
  }

  if (process.env.NODE_ENV === 'development') {
    return {
      ...baseDisplay,
      details: JSON.stringify(error, null, 2)
    };
  }

  return baseDisplay;
};
```

## Error Logging and Monitoring

### Structured Logging
```typescript
interface ErrorLog {
  timestamp: string;
  level: 'error' | 'warn' | 'info';
  code: string;
  message: string;
  stack?: string;
  context: {
    userId?: string;
    documentId?: string;
    url?: string;
    userAgent?: string;
    correlationId: string;
  };
  metadata?: Record<string, any>;
}

const logError = (error: AppError, context: any) => {
  const logEntry: ErrorLog = {
    timestamp: new Date().toISOString(),
    level: 'error',
    code: error.code,
    message: error.message,
    stack: error.stack,
    context: {
      ...context,
      correlationId: generateCorrelationId()
    }
  };

  // Send to logging service
  if (typeof window !== 'undefined') {
    // Client-side logging
    console.error(logEntry);
  } else {
    // Server-side logging
    errorLogger.log(logEntry);
  }
};
```

### Error Aggregation
```typescript
class ErrorAggregator {
  private errors: ErrorLog[] = [];
  private batchSize = 10;
  private flushInterval = 30000; // 30 seconds

  constructor() {
    setInterval(() => this.flush(), this.flushInterval);
  }

  add(error: ErrorLog) {
    this.errors.push(error);

    if (this.errors.length >= this.batchSize) {
      this.flush();
    }
  }

  private flush() {
    if (this.errors.length === 0) return;

    // Send batch to monitoring service
    monitoringService.sendErrors(this.errors);
    this.errors = [];
  }
}
```

## Recovery Mechanisms

### Automatic Recovery
```typescript
const handleProcessingError = async (error: ProcessingError, documentId: string) => {
  if (error.retryable) {
    // Schedule retry with exponential backoff
    await scheduleRetry(documentId, error.stage, {
      delay: calculateRetryDelay(error.attemptCount),
      maxRetries: 3
    });
  } else {
    // Mark as failed
    await updateDocumentStatus(documentId, 'failed', error.message);

    // Notify user
    await sendErrorNotification(documentId, error);
  }
};
```

### Manual Recovery
```typescript
const retryDocument = async (documentId: string) => {
  try {
    // Reset document status
    await updateDocumentStatus(documentId, 'pending');

    // Clear any cached error state
    await clearDocumentCache(documentId);

    // Trigger processing pipeline
    await triggerDocumentProcessing(documentId);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to retry document processing'
    };
  }
};
```

## Error Boundaries (Frontend)

### React Error Boundary
```typescript
class AppErrorBoundary extends React.Component {
  state = { hasError: false, error: null, errorInfo: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ error, errorInfo });

    // Log error
    logError({
      code: 'REACT_ERROR',
      message: error.message,
      stack: error.stack,
      context: { componentStack: errorInfo.componentStack }
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <p>Please refresh the page and try again.</p>
          <button onClick={() => window.location.reload()}>
            Refresh Page
          </button>
          {process.env.NODE_ENV === 'development' && (
            <details>
              <summary>Error Details</summary>
              <pre>{this.state.error?.stack}</pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
```

## Testing Error Scenarios

### Error Simulation
```typescript
// Test utilities for error scenarios
const simulateNetworkError = () => {
  // Mock fetch to throw network error
  global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));
};

const simulateLLMFailure = () => {
  // Mock Hugging Face API to return error
  mockHuggingFaceResponse({
    status: 500,
    body: { error: 'Internal server error' }
  });
};

const simulateDatabaseError = () => {
  // Mock database operations to fail
  mockDatabaseOperation('updateDocument', () => {
    throw new Error('Database connection failed');
  });
};
```

### Error Recovery Testing
```typescript
describe('Error Recovery', () => {
  it('retries failed scraping operations', async () => {
    simulateNetworkError();

    const result = await processDocument(testDocument);

    // Should eventually succeed after retries
    expect(result.status).toBe('completed');
  });

  it('provides user-friendly error messages', () => {
    const error = new ProcessingError('INVALID_URL');

    const display = getErrorDisplay(error);

    expect(display.message).toContain('valid URL');
    expect(display.action?.label).toBe('Try Again');
  });
});
```

## Monitoring and Alerting

### Error Metrics
- Error rate by component (scraping, analysis, frontend)
- Error rate by error type
- Recovery success rate
- Mean time to recovery

### Alerting Rules
```typescript
const ALERT_RULES = {
  highErrorRate: {
    condition: 'errorRate > 5%',
    duration: '5 minutes',
    severity: 'critical',
    message: 'High error rate detected'
  },

  scrapingFailures: {
    condition: 'scrapingErrors > 10',
    duration: '10 minutes',
    severity: 'warning',
    message: 'Multiple scraping failures'
  },

  llmQuotaExceeded: {
    condition: 'llmQuotaErrors > 5',
    duration: '1 minute',
    severity: 'info',
    message: 'LLM quota exceeded, using fallback'
  }
};
```

---

*This error handling specification ensures robust system operation and good user experience. All errors are properly categorized, logged, and handled with appropriate recovery mechanisms.*
