# Docify System Architecture Specification

## Overview
Docify is a web-based document analysis platform that allows users to scrape web content and generate structured visual analyses using AI. The system processes URLs, extracts content, and creates organized analysis blocks for easy consumption.

## System Components

### 1. Frontend (Next.js + React)
**Location**: `/docify-website/`
**Technology Stack**:
- Next.js 14+ (App Router)
- React 18+
- TypeScript
- Tailwind CSS (via once-ui design system)
- Component Library: Custom once-ui components

**Key Features**:
- User authentication and dashboard
- Document creation and management
- Analysis results visualization (3x3 grid layout)
- Responsive design for desktop and mobile

### 2. Backend Services (Appwrite Functions)

#### Document Scraper (`/functions/document-scraper-python/`)
**Purpose**: Scrapes web content from URLs and extracts structured data
**Language**: Python
**Trigger**: Automatic (on document creation)
**Output**: Structured content with metadata

#### LLM Analyzer (`/functions/llm-analyzer/`)
**Purpose**: Analyzes scraped content and generates visual analysis blocks
**Language**: Python (recommended)
**Trigger**: Event-based (after scraping completes)
**Output**: JSON with analysis blocks (summary + up to 5 content blocks)
**AI Service**: Hugging Face (free tier, user API key option for future)

### 3. Database (Appwrite Database)
**Database ID**: `docify_db`
**Collections**:
- `documents_table`: User documents with URLs and prompts
- `analysis_results`: LLM analysis results with blocks

### 4. Authentication (Appwrite Auth)
**Features**:
- User registration and login
- Session management
- User-specific document isolation

## Data Flow Architecture

### Document Creation Flow
```
1. User → Frontend: Create document (title, URL, prompt)
2. Frontend → Appwrite DB: Save document (status: 'pending')
3. Appwrite DB Event → Document Scraper Function
4. Document Scraper → URL: Scrape content
5. Document Scraper → Appwrite DB: Update document (status: 'analyzing', content)
6. Appwrite DB Event → LLM Analyzer Function
7. LLM Analyzer → Hugging Face API: Generate analysis
8. LLM Analyzer → Appwrite DB: Save analysis results (status: 'completed')
9. Frontend → Appwrite DB: Display results in 3x3 grid
```

### Error Handling Flow
```
Any failure → Update document status to 'failed'
User can retry → Reset status to 'pending' → Restart flow
```

## Component Architecture

### Frontend Layout Structure
```
Dashboard Page
├── Header (Auth, Navigation)
├── Document List/Grid
└── Document Detail View
    ├── Top Row (3 columns): Document Info
    │   ├── URL Display
    │   ├── Title Display
    │   └── Status/Prompt Display
    └── Bottom Grid (3x2): Analysis Blocks
        ├── Block 1: Summary (dedicated, always present)
        ├── Block 2-6: LLM-generated blocks (variable)
```

### Analysis Block Types
- **Summary**: Text overview (dedicated first block)
- **Key Points**: Bullet points of important information
- **Architecture**: System/component diagrams
- **Mermaid**: Flowcharts, sequence diagrams, etc.
- **Code**: Code examples with syntax highlighting
- **API Reference**: API documentation blocks
- **Guide**: Step-by-step instructions
- **Comparison**: Side-by-side comparisons
- **Best Practices**: Recommendations
- **Troubleshooting**: Common issues and solutions

### Block Sizing System
- **Small**: 1 grid unit (fits 3 per row)
- **Medium**: 2 grid units (fits 1.5 per row, but we'll use 2 per row)
- **Large**: 3 grid units (fits 1 per row)

## Security Architecture

### Authentication
- Appwrite Auth for user management
- JWT tokens for API access
- User isolation (users only see their own documents)

### API Security
- Appwrite Function authentication via headers
- Dynamic API keys for function calls
- Input validation and sanitization

### Data Privacy
- User data isolation
- No cross-user data sharing
- Secure storage of API keys (future feature)

## Performance Considerations

### Caching Strategy
- Document content caching
- Analysis results caching
- Static asset optimization

### Scalability
- Serverless functions for horizontal scaling
- Database query optimization
- CDN for static assets

### Rate Limiting
- API rate limiting for scraping
- User action rate limiting
- AI service quota management

## Deployment Architecture

### Appwrite Cloud
- Functions: Document scraper and LLM analyzer
- Database: User data and analysis results
- Auth: User management
- Storage: Future file uploads

### Frontend Deployment
- Vercel/Netlify for static hosting
- CDN integration
- Environment variable management

## Monitoring and Logging

### Application Monitoring
- Function execution logs
- Error tracking and alerting
- Performance metrics

### User Analytics
- Document creation metrics
- Analysis usage patterns
- User engagement tracking

## Future Extensibility

### Plugin Architecture
- Custom analysis block types
- Third-party integrations
- Custom scraping strategies

### Multi-tenant Support
- Organization accounts
- Shared document libraries
- Team collaboration features

---

*This specification will be updated as the system evolves. All changes should be documented and reviewed.*
