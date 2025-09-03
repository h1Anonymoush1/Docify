# Docify - AI-Powered Document Analysis

Docify is a web application that allows users to analyze any website using AI-powered content extraction and visualization. Users can input a URL and instructions, and the system will scrape the content, analyze it with Hugging Face's LLM, and present the results in interactive charts and summaries.

## 🚀 Features

- **Universal Web Scraping**: Extract content from any website
- **AI-Powered Analysis**: Uses Hugging Face's Mistral model for intelligent analysis
- **Interactive Visualizations**: Automatic generation of Mermaid diagrams and charts
- **Flexible Content Types**: Supports summaries, code examples, API references, guides, and more
- **Responsive Design**: Works on all devices with adaptive grid layouts
- **Real-time Processing**: Live status updates during document processing

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Input    │    │   Web Scraper   │    │   LLM Analyzer  │
│   (Frontend)    │───▶│   (Appwrite     │───▶│   (Appwrite     │
│                 │    │   Function)     │    │   Function)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Document DB   │    │   Analysis DB   │    │   Results View  │
│   (Appwrite)    │    │   (Appwrite)    │    │   (Frontend)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- Appwrite account and project
- Hugging Face API token

## 🛠️ Setup Instructions

### 1. Appwrite Project Setup

1. Create a new project on [Appwrite Cloud](https://cloud.appwrite.io)
2. Note your Project ID and API Endpoint
3. Enable the following services:
   - Databases
   - Functions
   - Storage (optional)

### 2. Database Configuration

Create the following collections in your Appwrite database:

#### Documents Collection
```json
{
  "name": "documents",
  "permissions": ["create", "read", "update"],
  "attributes": [
    {"key": "url", "type": "string", "required": true},
    {"key": "instructions", "type": "string", "required": true},
    {"key": "title", "type": "string", "required": false},
    {"key": "status", "type": "enum", "elements": ["pending", "scraping", "analyzing", "completed", "failed"], "required": true},
    {"key": "user_id", "type": "string", "required": true},
    {"key": "scraped_content", "type": "string", "required": false}
  ]
}
```

#### Analysis Results Collection
```json
{
  "name": "analysis_results",
  "permissions": ["create", "read"],
  "attributes": [
    {"key": "document_id", "type": "string", "required": true},
    {"key": "summary", "type": "string", "required": true},
    {"key": "charts", "type": "array", "required": true},
    {"key": "raw_response", "type": "string", "required": false},
    {"key": "processing_time", "type": "integer", "required": false}
  ]
}
```

### 3. Environment Variables

Create a `.env.local` file in the `docify-website` directory:

```env
# Appwrite Configuration
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://your-region.cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your-project-id
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your-database-id
NEXT_PUBLIC_APPWRITE_DOCUMENTS_COLLECTION_ID=documents
NEXT_PUBLIC_APPWRITE_ANALYSIS_COLLECTION_ID=analysis_results

# Hugging Face API
HUGGINGFACE_ACCESS_TOKEN=your-huggingface-token

# Appwrite Server-side (for API routes)
APPWRITE_ENDPOINT=https://your-region.cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your-project-id
APPWRITE_API_KEY=your-server-api-key
DATABASE_ID=your-database-id
DOCUMENTS_COLLECTION_ID=documents
ANALYSIS_COLLECTION_ID=analysis_results
```

### 4. Deploy Functions

Deploy the Appwrite functions using the Appwrite CLI:

```bash
# Install Appwrite CLI
npm install -g appwrite-cli

# Login to Appwrite
appwrite login

# Deploy functions
appwrite deploy function
```

Or deploy manually through the Appwrite Console by uploading the function code.

### 5. Frontend Setup

```bash
cd docify-website
npm install
npm run dev
```

## 🎯 Usage

### Creating a Document

1. Navigate to `/documents` in your application
2. Enter a URL you want to analyze
3. Provide analysis instructions (e.g., "Create a visual overview of the API endpoints")
4. Click "Create Document"

### Analysis Results

The system will:
1. **Scrape** the website content
2. **Analyze** it using AI
3. **Generate** multiple content blocks including:
   - Summary of the document
   - Mermaid diagrams and charts
   - Code examples
   - Key points and highlights
   - API references
   - Step-by-step guides

### Content Block Types

- **Summary**: High-level overview
- **Mermaid**: Visual diagrams and flowcharts
- **Code**: Code examples with syntax highlighting
- **Key Points**: Important highlights and takeaways
- **API Reference**: API documentation
- **Guide**: Step-by-step instructions
- **Architecture**: System/component diagrams
- **Best Practices**: Recommendations
- **Troubleshooting**: Common issues and solutions

## 🔧 Configuration

### Function Environment Variables

#### Document Scraper Function
- `DATABASE_ID`: Your database ID
- `DOCUMENTS_COLLECTION_ID`: Documents collection ID
- `ANALYSIS_COLLECTION_ID`: Analysis results collection ID

#### LLM Analyzer Function
- `DATABASE_ID`: Your database ID
- `DOCUMENTS_COLLECTION_ID`: Documents collection ID
- `ANALYSIS_COLLECTION_ID`: Analysis results collection ID
- `HUGGINGFACE_ACCESS_TOKEN`: Your Hugging Face API token

### Customizing the LLM Prompt

Edit the `createAnalysisPrompt` function in `functions/llm-analyzer/src/main.js` to customize how the AI analyzes documents.

## 📊 API Endpoints

### POST `/api/scrape`
Triggers the document scraping process.

**Request Body:**
```json
{
  "documentId": "document-id",
  "url": "https://example.com"
}
```

**Response:**
```json
{
  "success": true,
  "executionId": "execution-id",
  "message": "Document scraping started successfully"
}
```

## 🐛 Troubleshooting

### Common Issues

1. **Scraping Fails**: Some websites block scraping. Try with different URLs or check if the site has anti-bot measures.

2. **LLM Analysis Fails**: Check your Hugging Face API token and ensure you have sufficient API credits.

3. **Database Errors**: Verify your collection permissions and database configuration.

4. **Function Timeouts**: Large documents may take longer to process. Consider increasing function timeout limits.

### Debug Mode

Enable debug logging by setting the log level in your functions:

```javascript
log('Debug information here');
```

## 🔒 Security

- All functions require proper authentication
- Database collections have user-based permissions
- API keys are stored securely as environment variables
- Web scraping respects robots.txt (when possible)

## 🚀 Deployment

### Production Deployment

1. Set up production environment variables
2. Deploy functions to Appwrite
3. Build and deploy the Next.js application
4. Configure custom domain (optional)

### Scaling Considerations

- Function execution time limits
- Database read/write limits
- API rate limits for external services
- Storage limits for large documents

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the troubleshooting section above
- Review the Appwrite documentation
- Create an issue in the repository

---

Built with ❤️ using Appwrite, Next.js, and Hugging Face