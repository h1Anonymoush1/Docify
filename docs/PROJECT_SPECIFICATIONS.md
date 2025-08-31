# Docify - Project Specifications

## 🎯 Project Vision

Docify is an intelligent documentation analysis platform that transforms any online documentation into structured, interactive summaries with visual diagrams, HTML previews, and downloadable formats. Users can submit documentation URLs, and AI-powered functions will scrape, analyze, validate, and generate comprehensive summaries.

## 🚀 Core Features

### 1. Documentation Ingestion
- **URL Input**: Users submit documentation URLs
- **Multi-format Support**: Handle HTML, Markdown, PDF, and other online doc formats
- **Content Scraping**: Extract and clean documentation content
- **Data Storage**: Save scraped content as structured JSON

### 2. AI-Powered Analysis
- **LLM Processing**: Use Hugging Face models for content analysis
- **Structured Output**: Generate JSON responses with multiple content types
- **Content Validation**: Secondary LLM validates analysis accuracy

### 3. Rich Output Generation
- **Mermaid Diagrams**: Auto-generate flowcharts, sequence diagrams, etc.
- **Interactive HTML/CSS Previews**: Create live code examples
- **Plain Text Summaries**: Clean, readable documentation overviews
- **Multiple Export Formats**: Markdown, PDF, JSON downloads

### 4. User System & Credits
- **Authentication**: User accounts with Appwrite Auth
- **Credit System**: One credit per analysis
- **Personal Library**: Users can view their generated summaries
- **Public Explore**: Browse all public summaries

### 5. Social Features
- **Public Gallery**: Explore page with all generated summaries
- **Download Access**: Anyone can download public summaries
- **User Attribution**: Credit original creators

## 🏗️ System Architecture

### Frontend (SvelteKit)
- **Landing Page**: URL input and feature showcase
- **Dashboard**: User's generated summaries
- **Explore Page**: Public gallery of all summaries
- **Summary Viewer**: Rich display of generated content
- **Authentication**: Login/signup flows

### Backend (Appwrite)
- **Database**: Store users, summaries, credits, and metadata
- **Storage**: Store scraped content, generated files
- **Authentication**: User management and sessions
- **Functions**: Serverless processing pipeline

### Processing Pipeline
```
URL Input → Scraper Function → Validation Function → LLM Analysis Function → Summary Storage → Frontend Display
```

## 🔧 Technical Stack

### Frontend
- **Framework**: SvelteKit with TypeScript
- **Styling**: Custom CSS with CSS Variables
- **Components**: Custom UI components
- **State Management**: Svelte stores
- **Visualization**: Mermaid.js for diagrams

### Backend Services
- **BaaS**: Appwrite Cloud
- **Functions**: Node.js serverless functions
- **Database**: Appwrite Database
- **Storage**: Appwrite Storage
- **Auth**: Appwrite Authentication

### AI/ML Services
- **Primary LLM**: Hugging Face Inference API
- **Models**: 
  - Main: `microsoft/DialoGPT-large` or `meta-llama/Llama-2-7b-chat-hf`
  - Validation: `distilbert-base-uncased` (lighter model)
- **Processing**: Custom prompt engineering for structured outputs

### External APIs
- **Web Scraping**: Puppeteer or Cheerio for content extraction
- **Document Processing**: Libraries for PDF, HTML, MD parsing

## 📊 Data Models

### User
```json
{
  "userId": "string",
  "email": "string",
  "name": "string",
  "credits": "number",
  "createdAt": "datetime",
  "lastLogin": "datetime"
}
```

### Summary
```json
{
  "summaryId": "string",
  "userId": "string",
  "title": "string",
  "originalUrl": "string",
  "status": "processing|completed|failed",
  "scrapedContent": "object",
  "analysis": {
    "overview": "string",
    "mermaidDiagrams": ["string"],
    "htmlPreview": "string",
    "markdownSummary": "string",
    "keyPoints": ["string"],
    "tags": ["string"]
  },
  "isPublic": "boolean",
  "downloadCount": "number",
  "createdAt": "datetime",
  "processingTime": "number"
}
```

### Processing Job
```json
{
  "jobId": "string",
  "summaryId": "string",
  "stage": "scraping|validating|analyzing|completed",
  "progress": "number",
  "errors": ["string"],
  "startTime": "datetime",
  "endTime": "datetime"
}
```

## 🔄 Function Workflow

### Function 1: Document Scraper
**Trigger**: User submits URL
**Input**: `{ url: string, userId: string }`
**Process**:
1. Validate URL accessibility
2. Detect document type (HTML, MD, PDF, etc.)
3. Extract content using appropriate parser
4. Clean and structure content
5. Save as JSON to Appwrite Storage
6. Update database with scraping results
7. Trigger validation function

**Output**: `{ scrapedData: object, contentType: string, status: string }`

### Function 2: Content Validator
**Trigger**: Scraper function completion
**Input**: Scraped content reference
**Process**:
1. Load scraped content
2. Use lightweight LLM to validate content structure
3. Check for completeness and accuracy
4. Generate validation report
5. Trigger main analysis if valid

**Output**: `{ isValid: boolean, confidence: number, issues: string[] }`

### Function 3: LLM Analyzer
**Trigger**: Successful validation
**Input**: Validated scraped content
**Process**:
1. Load content and validation results
2. Send structured prompt to Hugging Face LLM
3. Parse LLM response into structured format
4. Generate Mermaid diagrams
5. Create HTML/CSS previews
6. Generate markdown summary
7. Save all outputs to database and storage
8. Deduct user credit
9. Update summary status to completed

**Output**: Complete analysis object with all generated content

## 🎨 User Interface Specifications

### Landing Page
- Hero section with URL input
- Feature showcase with examples
- Pricing/credits information
- Recent public summaries preview

### Dashboard
- User's credit balance
- List of generated summaries
- Processing status indicators
- Quick actions (regenerate, share, download)

### Summary Viewer
- Rich content display
- Tabbed interface (Overview, Diagrams, Preview, Raw)
- Download options
- Share functionality

### Explore Page
- Grid/list view of public summaries
- Search and filter capabilities
- Sorting options (recent, popular, by tag)
- Preview cards with key information

## 🔐 Security & Privacy

### Data Protection
- User authentication required for creation
- Personal summaries private by default
- Option to make summaries public
- Secure API key management for external services

### Rate Limiting
- Credit system prevents abuse
- Function execution timeouts
- Request rate limiting per user

### Content Safety
- URL validation to prevent malicious sites
- Content filtering for inappropriate material
- Error handling for failed processing

## 📈 Scalability Considerations

### Performance
- Async function execution
- Progress tracking for long-running tasks
- Caching for frequently accessed summaries
- CDN for static assets

### Storage
- Efficient JSON storage for scraped content
- File compression for large documents
- Cleanup policies for old/unused data

### Monitoring
- Function execution logs
- Error tracking and alerting
- Usage analytics and metrics
- Cost monitoring for external APIs

## 🚀 Success Metrics

### User Engagement
- Number of URLs processed
- User retention rate
- Public summary engagement
- Download counts

### Technical Performance
- Function execution time
- Success/failure rates
- API response times
- Storage usage efficiency

### Business Metrics
- Credit consumption patterns
- User acquisition cost
- Feature adoption rates
- Community growth (public summaries)

---

*This specification document will guide the development of Docify, ensuring all features are well-defined and implementable within the hackathon timeframe.*
