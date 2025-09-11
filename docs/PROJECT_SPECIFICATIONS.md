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
URL Input → Unified Orchestrator Function → 8-Step Processing → Summary Storage → Frontend Display
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
- **Primary LLM**: Google Gemini AI API
- **Models**:
  - Main: `gemini-2.5-pro` (latest model)
  - Fallback: Standard Gemini models
- **Processing**: Advanced prompt engineering for structured JSON outputs
- **Features**: AI-generated titles, content analysis, diagram generation

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

### Unified Function: Docify Orchestrator
**Trigger**: User submits URL (database event on document creation)
**Input**: `{ $id: string, url: string, user_id: string, instructions: string }`
**Process - 8-Step Linear Pipeline**:
1. **Extract Document Data** - Parse and validate request parameters
2. **Validate Environment** - Check API keys and configuration
3. **Raw Browserless Scraping** - Scrape content without modification
4. **Save Raw Content** - Store exact HTML in database
5. **Generate AI Title** - Create 2-4 word intelligent titles using Gemini
6. **Generate Analysis** - Produce comprehensive AI analysis
7. **Create Compatible Blocks** - Format blocks for frontend compatibility
8. **Final Save & Complete** - Update database and mark as completed

**Output**: `{ success: boolean, title: string, processing_time: number, analysis_blocks: json }`

### Key Improvements:
- **Single Function**: Eliminates complex inter-function orchestration
- **Raw Content Preservation**: No dangerous cleaning/modification
- **AI-Generated Titles**: Smart 2-4 word titles
- **Linear Processing**: Clear step-by-step workflow
- **Error Recovery**: Graceful failure handling with status updates

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
