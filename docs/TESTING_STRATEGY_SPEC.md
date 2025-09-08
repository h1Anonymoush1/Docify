# Docify Testing Strategy Specification

## Overview
Comprehensive testing ensures system reliability, performance, and user experience. The testing strategy covers all components from frontend to backend functions.

## Testing Pyramid

### Unit Tests (Bottom Layer - 70% of tests)
**Purpose**: Test individual functions and components in isolation
**Scope**: Functions, classes, utilities
**Tools**: Jest (frontend), pytest (Python functions)

#### Frontend Unit Tests
```typescript
// Component testing
describe('DocumentList', () => {
  it('renders loading state correctly', () => {
    render(<DocumentList loading={true} documents={[]} />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('displays documents in grid view', () => {
    const mockDocuments = [createMockDocument()];
    render(<DocumentList documents={mockDocuments} view="grid" />);
    expect(screen.getByText(mockDocuments[0].title)).toBeInTheDocument();
  });
});

// Utility function testing
describe('validateDocumentInput', () => {
  it('validates required fields', () => {
    const result = validateDocumentInput({});
    expect(result).toContainEqual(
      expect.objectContaining({ field: 'title' })
    );
  });

  it('validates URL format', () => {
    const result = validateDocumentInput({
      title: 'Test',
      url: 'invalid-url'
    });
    expect(result).toContainEqual(
      expect.objectContaining({ field: 'url' })
    );
  });
});
```

#### Backend Unit Tests
```python
# Function testing
def test_scrape_website_success():
    # Mock requests
    with patch('requests.get') as mock_get:
        mock_get.return_value.status_code = 200
        mock_get.return_value.text = '<html><body>Test content</body></html>'

        result = scrape_website('https://example.com')

        assert result['title'] == 'Test content'
        assert 'Test content' in result['content']

def test_llm_analysis_validation():
    # Test block validation
    valid_blocks = [
        {
            'id': 'test-1',
            'type': 'summary',
            'size': 'large',
            'title': 'Test',
            'content': 'Test content'
        }
    ]

    result = validate_analysis_blocks(valid_blocks)
    assert result is True
```

### Integration Tests (Middle Layer - 20% of tests)
**Purpose**: Test component interactions and API integrations
**Scope**: API endpoints, database operations, external services

#### API Integration Tests
```typescript
describe('Document API', () => {
  it('creates document successfully', async () => {
    const documentData = {
      title: 'Test Document',
      url: 'https://example.com',
      instructions: 'Analyze this document'
    };

    const response = await api.createDocument(documentData);

    expect(response.success).toBe(true);
    expect(response.data.document.title).toBe(documentData.title);
  });

  it('handles validation errors', async () => {
    const invalidData = { title: '', url: 'invalid' };

    await expect(api.createDocument(invalidData))
      .rejects.toThrow('ValidationError');
  });
});
```

#### Database Integration Tests
```typescript
describe('Database Operations', () => {
  it('saves document with correct user isolation', async () => {
    const userId = 'user123';
    const documentData = createMockDocument({ user_id: userId });

    await saveDocument(documentData);

    const savedDoc = await getDocument(documentData.id);
    expect(savedDoc.user_id).toBe(userId);

    // Verify other users can't access
    await expect(getDocument(documentData.id, 'otherUser'))
      .rejects.toThrow('Unauthorized');
  });
});
```

### End-to-End Tests (Top Layer - 10% of tests)
**Purpose**: Test complete user workflows
**Scope**: Full application flow from user interaction to result
**Tools**: Playwright or Cypress

#### User Workflow Tests
```typescript
describe('Document Analysis Flow', () => {
  it('completes full document analysis workflow', async () => {
    // 1. User registration and login
    await page.goto('/signup');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'TestPass123');
    await page.click('[data-testid="signup-button"]');

    // 2. Create document
    await page.goto('/documents/new');
    await page.fill('[data-testid="title"]', 'Test Document');
    await page.fill('[data-testid="url"]', 'https://example.com');
    await page.fill('[data-testid="instructions"]', 'Analyze this page');
    await page.click('[data-testid="create-button"]');

    // 3. Wait for processing
    await page.waitForSelector('[data-testid="processing-complete"]');

    // 4. Verify analysis results
    await expect(page.locator('[data-testid="analysis-summary"]'))
      .toBeVisible();

    // 5. Check grid layout
    const blocks = page.locator('[data-testid="analysis-block"]');
    await expect(blocks).toHaveCount(6); // Summary + 5 analysis blocks
  });
});
```

## Component-Specific Testing

### LLM Analyzer Testing

#### Mock Testing
```python
def test_llm_analysis_with_mock():
    # Mock Hugging Face API
    with patch('huggingface_hub.InferenceApi') as mock_api:
        mock_api.return_value.text_generation.return_value = {
            'generated_text': '{"summary": "Test summary", "blocks": []}'
        }

        result = analyze_document(mock_document)

        assert result['summary'] == 'Test summary'
        mock_api.assert_called_once()
```

#### Error Scenario Testing
```python
def test_llm_analysis_error_handling():
    # Test API failure
    with patch('huggingface_hub.InferenceApi') as mock_api:
        mock_api.return_value.text_generation.side_effect = Exception('API Error')

        with pytest.raises(AnalysisError):
            analyze_document(mock_document)
```

### Document Scraper Testing

#### Content Extraction Testing
```python
def test_html_content_extraction():
    html_content = '''
    <html>
        <head><title>Test Page</title></head>
        <body>
            <h1>Main Heading</h1>
            <p>This is test content.</p>
        </body>
    </html>
    '''

    result = extract_html_content(html_content, 'https://example.com')

    assert result['title'] == 'Test Page'
    assert 'Main Heading' in result['content']
    assert 'test content' in result['content']
```

#### Network Error Testing
```python
def test_network_error_handling():
    with patch('requests.get') as mock_get:
        mock_get.side_effect = requests.exceptions.Timeout()

        with pytest.raises(ScrapingError):
            scrape_website('https://example.com')
```

## Performance Testing

### Load Testing
```typescript
describe('Performance Tests', () => {
  it('handles concurrent document creation', async () => {
    const promises = Array(10).fill().map(() =>
      api.createDocument(createMockDocument())
    );

    const startTime = Date.now();
    const results = await Promise.all(promises);
    const endTime = Date.now();

    expect(endTime - startTime).toBeLessThan(5000); // Under 5 seconds
    results.forEach(result => {
      expect(result.success).toBe(true);
    });
  });
});
```

### Memory Leak Testing
```typescript
describe('Memory Usage', () => {
  it('does not leak memory during repeated operations', async () => {
    const initialMemory = process.memoryUsage().heapUsed;

    for (let i = 0; i < 100; i++) {
      await performOperation();
    }

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;

    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB
  });
});
```

## Test Data Management

### Test Data Factory
```typescript
const createMockDocument = (overrides = {}) => ({
  id: 'doc_' + Math.random().toString(36).substr(2, 9),
  title: 'Test Document',
  url: 'https://example.com',
  instructions: 'Analyze this document',
  status: 'pending',
  user_id: 'user123',
  created_at: new Date().toISOString(),
  ...overrides
});

const createMockAnalysis = (overrides = {}) => ({
  id: 'analysis_' + Math.random().toString(36).substr(2, 9),
  document_id: 'doc123',
  summary: 'Test analysis summary',
  blocks: [
    {
      id: 'block1',
      type: 'summary',
      size: 'large',
      title: 'Summary',
      content: 'Test content'
    }
  ],
  processing_time: 1000,
  status: 'completed',
  ...overrides
});
```

### Database Test Isolation
```typescript
describe('Database Tests', () => {
  let testDb: TestDatabase;

  beforeEach(async () => {
    testDb = await createTestDatabase();
  });

  afterEach(async () => {
    await testDb.cleanup();
  });

  it('saves document correctly', async () => {
    const document = createMockDocument();

    await testDb.saveDocument(document);
    const saved = await testDb.getDocument(document.id);

    expect(saved.title).toBe(document.title);
  });
});
```

## Test Automation

### CI/CD Integration
```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run unit tests
        run: npm run test:unit
      - name: Run integration tests
        run: npm run test:integration
      - name: Run e2e tests
        run: npm run test:e2e
```

### Test Reporting
```typescript
// Generate test reports
const generateTestReport = (results) => {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: results.numTotalTests,
      passed: results.numPassedTests,
      failed: results.numFailedTests,
      duration: results.testResults[0].perfStats.runtime
    },
    details: results.testResults.map(result => ({
      file: result.testFilePath,
      tests: result.testResults.map(test => ({
        name: test.title,
        status: test.status,
        duration: test.duration,
        error: test.failureMessages?.[0]
      }))
    }))
  };

  // Send to reporting service
  sendTestReport(report);
};
```

## Code Coverage

### Coverage Goals
- **Frontend**: 80% statement coverage, 70% branch coverage
- **Backend Functions**: 75% statement coverage
- **Critical Paths**: 90% coverage for user-facing features

### Coverage Configuration
```javascript
// jest.config.js
module.exports = {
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.tsx'
  ],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 70,
      functions: 75,
      lines: 80
    }
  },
  coverageReporters: ['text', 'lcov', 'html']
};
```

## Test Environment Management

### Environment Setup
```bash
# Test database setup
createdb docify_test
psql docify_test < schema.sql

# Environment variables
cp .env.test.example .env.test
export NODE_ENV=test
export DATABASE_URL=postgresql://localhost/docify_test
```

### Test Cleanup
```typescript
const cleanupTestData = async () => {
  // Clean database
  await db.query('DELETE FROM analysis_results');
  await db.query('DELETE FROM documents');

  // Clean file system
  await fs.rmdir('test-uploads', { recursive: true });

  // Reset mocks
  jest.clearAllMocks();
};
```

## Accessibility Testing

### Component Accessibility
```typescript
describe('Accessibility', () => {
  it('has proper ARIA labels', () => {
    render(<DocumentList documents={mockDocuments} />);

    const grid = screen.getByRole('grid');
    expect(grid).toHaveAttribute('aria-label', 'Document list');
  });

  it('supports keyboard navigation', async () => {
    const { user } = render(<DocumentList documents={mockDocuments} />);

    await user.tab();
    expect(screen.getByRole('button', { name: /create document/i }))
      .toHaveFocus();
  });
});
```

## Security Testing

### Authentication Testing
```typescript
describe('Security', () => {
  it('prevents unauthorized access', async () => {
    const response = await api.getDocuments({
      headers: { Authorization: 'Bearer invalid-token' }
    });

    expect(response.status).toBe(401);
  });

  it('validates input sanitization', () => {
    const maliciousInput = '<script>alert("xss")</script>';

    expect(() => validateDocumentInput({ title: maliciousInput }))
      .toThrow('Invalid input');
  });
});
```

---

*This testing strategy ensures comprehensive coverage of all system components with automated testing at every level of the testing pyramid.*
