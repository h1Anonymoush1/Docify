# Docify Frontend Components Specification

## Overview
The frontend is built with Next.js 14+ and React 18+, using a custom once-ui design system. The core feature is a 3x3 grid layout that displays document analysis results with various block types.

## Component Architecture

### Main Layout Structure
```
App Layout
├── Header (Auth, Navigation)
├── Dashboard Page
│   ├── Document List/Grid
│   └── Document Detail View
│       ├── Document Header (3 columns)
│       │   ├── URL Display
│       │   ├── Title Display
│       │   └── Status/Info Display
│       └── Analysis Grid (3x2)
│           ├── Summary Block (dedicated, position 1)
│           ├── Dynamic Block 2
│           ├── Dynamic Block 3
│           ├── Dynamic Block 4
│           ├── Dynamic Block 5
│           └── Dynamic Block 6
```

## Core Components

### 1. DocumentList Component
**Purpose**: Display user's documents in a grid/list view
**Location**: `/src/components/DocumentList.tsx`

#### Props
```typescript
interface DocumentListProps {
  documents: Document[];
  loading?: boolean;
  onDocumentSelect: (document: Document) => void;
  onDocumentDelete: (documentId: string) => void;
  onDocumentRetry: (documentId: string) => void;
}
```

#### Features
- Grid and list view toggle
- Status-based filtering (pending, scraping, analyzing, completed, failed)
- Sort by creation date, title, status
- Search functionality
- Pagination for large document lists

#### State Management
```typescript
interface DocumentListState {
  view: 'grid' | 'list';
  filter: 'all' | 'pending' | 'scraping' | 'analyzing' | 'completed' | 'failed';
  search: string;
  sortBy: 'created_at' | 'title' | 'status';
  sortOrder: 'asc' | 'desc';
  currentPage: number;
}
```

### 2. DocumentDetail Component
**Purpose**: Display detailed document view with analysis grid
**Location**: `/src/components/DocumentDetail.tsx`

#### Props
```typescript
interface DocumentDetailProps {
  document: Document;
  analysis?: AnalysisResult;
  loading?: boolean;
  onRetry: () => void;
  onUpdateInstructions: (instructions: string) => void;
}
```

#### Grid Layout System
```typescript
interface GridConfig {
  columns: 3;
  rows: 3;
  headerRows: 1;  // Top row reserved for document info
  contentRows: 2;  // Bottom 2 rows for analysis blocks
  totalCells: 9;
  headerCells: 3;  // 3 cells for document header
  contentCells: 6; // 6 cells for analysis blocks
}
```

### 3. AnalysisBlockRenderer Component
**Purpose**: Render individual analysis blocks with proper sizing and content
**Location**: `/src/components/AnalysisBlockRenderer.tsx`

#### Props
```typescript
interface AnalysisBlockRendererProps {
  block: AnalysisBlock;
  size: 'small' | 'medium' | 'large';
  position: number;
  onBlockExpand?: (block: AnalysisBlock) => void;
}
```

#### Block Type Components

#### 3.1 SummaryBlock Component
```typescript
interface SummaryBlockProps {
  content: string;
  size: 'small' | 'medium' | 'large';
}

const SummaryBlock: React.FC<SummaryBlockProps> = ({ content, size }) => {
  return (
    <div className={`summary-block ${size}`}>
      <h3>Document Summary</h3>
      <div className="content">
        {content}
      </div>
    </div>
  );
};
```

#### 3.2 KeyPointsBlock Component
```typescript
interface KeyPointsBlockProps {
  content: string;
  size: 'small' | 'medium' | 'large';
}

const KeyPointsBlock: React.FC<KeyPointsBlockProps> = ({ content, size }) => {
  const points = content.split('\n').filter(point => point.trim());

  return (
    <div className={`key-points-block ${size}`}>
      <h4>Key Points</h4>
      <ul>
        {points.map((point, index) => (
          <li key={index}>{point}</li>
        ))}
      </ul>
    </div>
  );
};
```

#### 3.3 MermaidBlock Component
```typescript
interface MermaidBlockProps {
  content: string;
  size: 'small' | 'medium' | 'large';
}

const MermaidBlock: React.FC<MermaidBlockProps> = ({ content, size }) => {
  const [svg, setSvg] = useState<string>('');

  useEffect(() => {
    const renderDiagram = async () => {
      try {
        const { svg } = await mermaid.render('mermaid-diagram', content);
        setSvg(svg);
      } catch (error) {
        console.error('Mermaid rendering error:', error);
        setSvg('<div className="error">Diagram rendering failed</div>');
      }
    };

    renderDiagram();
  }, [content]);

  return (
    <div className={`mermaid-block ${size}`}>
      <h4>Mermaid Diagram</h4>
      <div dangerouslySetInnerHTML={{ __html: svg }} />
    </div>
  );
};
```

#### 3.4 CodeBlock Component
```typescript
interface CodeBlockProps {
  content: string;
  language?: string;
  size: 'small' | 'medium' | 'large';
}

const CodeBlock: React.FC<CodeBlockProps> = ({ content, language, size }) => {
  return (
    <div className={`code-block ${size}`}>
      <h4>Code Example {language && `(${language})`}</h4>
      <SyntaxHighlighter
        language={language || 'javascript'}
        style={vs2015}
        showLineNumbers={true}
      >
        {content}
      </SyntaxHighlighter>
    </div>
  );
};
```

#### 3.5 ApiReferenceBlock Component
```typescript
interface ApiReferenceBlockProps {
  content: string;
  size: 'small' | 'medium' | 'large';
}

const ApiReferenceBlock: React.FC<ApiReferenceBlockProps> = ({ content, size }) => {
  // Parse API reference format
  const endpoints = parseApiEndpoints(content);

  return (
    <div className={`api-reference-block ${size}`}>
      <h4>API Reference</h4>
      {endpoints.map((endpoint, index) => (
        <div key={index} className="endpoint">
          <div className="method">{endpoint.method}</div>
          <div className="path">{endpoint.path}</div>
          <div className="description">{endpoint.description}</div>
        </div>
      ))}
    </div>
  );
};
```

#### 3.6 GuideBlock Component
```typescript
interface GuideBlockProps {
  content: string;
  size: 'small' | 'medium' | 'large';
}

const GuideBlock: React.FC<GuideBlockProps> = ({ content, size }) => {
  const steps = content.split('\n').filter(step => step.trim());

  return (
    <div className={`guide-block ${size}`}>
      <h4>Step-by-Step Guide</h4>
      <ol>
        {steps.map((step, index) => (
          <li key={index}>{step}</li>
        ))}
      </ol>
    </div>
  );
};
```

## Grid Layout System

### Grid Calculation Logic
```typescript
interface GridPosition {
  row: number;
  col: number;
  width: number;  // Grid units (1, 2, or 3)
  height: number; // Usually 1, but could be more for large content
}

function calculateGridPositions(blocks: AnalysisBlock[]): GridPosition[] {
  const positions: GridPosition[] = [];
  let currentRow = 1; // Start after header row
  let currentCol = 0;

  // Header takes first row
  currentRow = 2; // Start content from row 2

  blocks.forEach((block, index) => {
    const size = block.size;
    let width = 1; // default small

    if (size === 'medium') width = 2;
    if (size === 'large') width = 3;

    // Check if block fits in current row
    if (currentCol + width > 3) {
      // Move to next row
      currentRow++;
      currentCol = 0;
    }

    positions.push({
      row: currentRow,
      col: currentCol,
      width: width,
      height: 1
    });

    currentCol += width;

    // Wrap to next row if needed
    if (currentCol >= 3) {
      currentRow++;
      currentCol = 0;
    }
  });

  return positions;
}
```

### CSS Grid Implementation
```scss
.analysis-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: auto auto auto; // Header + 2 content rows
  gap: 1rem;
  min-height: 600px;

  .document-header {
    grid-column: 1 / -1; // Span all columns
    grid-row: 1;
    display: grid;
    grid-template-columns: 1fr 2fr 1fr;
    gap: 1rem;
  }

  .analysis-blocks {
    grid-column: 1 / -1;
    grid-row: 2 / -1;
    display: grid;
    grid-template-columns: subgrid;
    grid-template-rows: subgrid;
  }
}

.block-small {
  grid-column: span 1;
}

.block-medium {
  grid-column: span 2;
}

.block-large {
  grid-column: span 3;
}
```

## State Management

### Global State (Zustand/Redux)
```typescript
interface AppState {
  user: User | null;
  documents: Document[];
  currentDocument: Document | null;
  analysisResults: Record<string, AnalysisResult>;
  ui: {
    theme: 'light' | 'dark';
    sidebarOpen: boolean;
    loadingStates: Record<string, boolean>;
  };
}

interface DocumentState {
  id: string;
  title: string;
  url: string;
  instructions: string;
  status: DocumentStatus;
  created_at: string;
  updated_at: string;
  scraped_content?: string;
  word_count?: number;
  pages_crawled?: number;
}

interface AnalysisResult {
  id: string;
  document_id: string;
  summary: string;
  blocks: AnalysisBlock[];
  processing_time: number;
  status: 'completed' | 'failed';
}

interface AnalysisBlock {
  id: string;
  type: BlockType;
  size: 'small' | 'medium' | 'large';
  title: string;
  content: string;
  metadata?: {
    language?: string;
    priority?: 'high' | 'medium' | 'low';
    position?: number;
  };
}
```

### API Integration Hooks
```typescript
// Document hooks
const useDocuments = () => {
  const { documents, loading } = useAppStore();

  const createDocument = useMutation({
    mutationFn: (data: CreateDocumentData) => api.createDocument(data),
    onSuccess: (newDoc) => {
      // Update store
      addDocument(newDoc);
    }
  });

  return { documents, loading, createDocument };
};

// Analysis hooks
const useDocumentAnalysis = (documentId: string) => {
  const analysis = useAppStore(state =>
    state.analysisResults[documentId]
  );

  const { refetch, isLoading } = useQuery({
    queryKey: ['analysis', documentId],
    queryFn: () => api.getDocumentAnalysis(documentId),
    enabled: !!documentId
  });

  return { analysis, refetch, isLoading };
};
```

## Error Handling

### Error Boundaries
```typescript
class AnalysisBlockErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Analysis block error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-block">
          <h4>Error Loading Block</h4>
          <p>This block could not be rendered properly.</p>
          <button onClick={() => this.setState({ hasError: false })}>
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Loading States
```typescript
const AnalysisGridSkeleton: React.FC = () => (
  <div className="analysis-grid">
    <div className="document-header">
      <Skeleton width="100%" height={40} />
      <Skeleton width="100%" height={40} />
      <Skeleton width="100%" height={40} />
    </div>
    <div className="analysis-blocks">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} width="100%" height={200} />
      ))}
    </div>
  </div>
);
```

## Performance Optimization

### Code Splitting
```typescript
// Lazy load block components
const MermaidBlock = lazy(() => import('./blocks/MermaidBlock'));
const CodeBlock = lazy(() => import('./blocks/CodeBlock'));

// Load on demand
<Suspense fallback={<BlockSkeleton />}>
  <MermaidBlock {...props} />
</Suspense>
```

### Memoization
```typescript
const AnalysisBlockRenderer = memo<AnalysisBlockRendererProps>(({
  block,
  size,
  position
}) => {
  // Component logic
});
```

### Virtualization (Future)
```typescript
// For very large analysis results
const VirtualizedGrid = () => (
  <FixedSizeGrid
    columnCount={3}
    rowCount={Math.ceil(blocks.length / 3)}
    columnWidth={300}
    rowHeight={200}
  >
    {({ columnIndex, rowIndex, style }) => {
      const blockIndex = rowIndex * 3 + columnIndex;
      const block = blocks[blockIndex];
      return (
        <div style={style}>
          <AnalysisBlockRenderer block={block} />
        </div>
      );
    }}
  </FixedSizeGrid>
);
```

## Accessibility

### ARIA Labels
```typescript
<div
  role="grid"
  aria-label="Document analysis results"
  className="analysis-grid"
>
  <div role="row" className="document-header">
    <div role="gridcell" aria-label="Document URL">
      {document.url}
    </div>
    <div role="gridcell" aria-label="Document title">
      {document.title}
    </div>
    <div role="gridcell" aria-label="Document status">
      {document.status}
    </div>
  </div>
</div>
```

### Keyboard Navigation
```typescript
const useKeyboardNavigation = (blocks: AnalysisBlock[]) => {
  const [focusedIndex, setFocusedIndex] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
          setFocusedIndex(prev => Math.min(prev + 1, blocks.length - 1));
          break;
        case 'ArrowLeft':
          setFocusedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'ArrowDown':
          setFocusedIndex(prev => Math.min(prev + 3, blocks.length - 1));
          break;
        case 'ArrowUp':
          setFocusedIndex(prev => Math.max(prev - 3, 0));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [blocks.length]);

  return focusedIndex;
};
```

## Testing Strategy

### Unit Tests
```typescript
describe('AnalysisBlockRenderer', () => {
  it('renders summary block correctly', () => {
    const block: AnalysisBlock = {
      id: 'summary-1',
      type: 'summary',
      size: 'large',
      title: 'Document Summary',
      content: 'This is a summary...'
    };

    render(<AnalysisBlockRenderer block={block} />);
    expect(screen.getByText('Document Summary')).toBeInTheDocument();
  });
});
```

### Integration Tests
```typescript
describe('DocumentDetail', () => {
  it('displays analysis grid correctly', async () => {
    const mockDocument = { /* document data */ };
    const mockAnalysis = { /* analysis data */ };

    render(
      <DocumentDetail
        document={mockDocument}
        analysis={mockAnalysis}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Document Summary')).toBeInTheDocument();
    });
  });
});
```

### Visual Regression Tests
```typescript
describe('Analysis Grid Layout', () => {
  it('matches expected layout', () => {
    // Use Playwright or similar for visual testing
    const component = render(<AnalysisGrid blocks={mockBlocks} />);
    expect(component).toMatchSnapshot();
  });
});
```

---

*This specification provides the blueprint for implementing the frontend components. Focus on the 3x3 grid layout and proper block rendering for the initial implementation.*
