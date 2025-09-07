# Universal Document Scraper Python Function

This Appwrite function scrapes web content from URLs and their subpaths using Scrapy, with support for **every type of data format**. It can intelligently detect and extract content from multiple file types and data formats.

## 🚀 Features

### **Universal Data Type Support**
- **📄 Documents**: PDF, Word (.doc, .docx), Excel (.xls, .xlsx), CSV, TXT, Markdown
- **🌐 Web Content**: HTML, XML, RSS/Atom feeds, JSON APIs
- **📊 Structured Data**: JSON, XML, CSV spreadsheets
- **📝 Text Files**: Plain text, Markdown, configuration files

### **Advanced Capabilities**
- **Multi-page crawling**: Automatically discovers and scrapes linked pages within the same domain
- **Content type auto-detection**: Intelligently identifies file types from headers and extensions
- **Intelligent extraction**: Uses format-specific parsers for optimal content extraction
- **Metadata preservation**: Maintains file information, encoding details, and structure
- **Configurable depth**: Control how many pages/items to crawl (default: 10 pages)
- **Content organization**: Groups content by type with clear section headers
- **Encoding detection**: Automatically handles different text encodings (UTF-8, ISO-8859, etc.)
- **Fallback mechanism**: Graceful degradation to single-page scraping if needed
- **Respectful crawling**: Includes delays and respects robots.txt

### **Supported File Types**
| Type | Extensions | Parser | Features |
|------|------------|--------|----------|
| **PDF** | .pdf | PyPDF2 | Text extraction, page count, file size |
| **Word** | .doc, .docx | python-docx | Paragraph extraction, formatting |
| **Excel** | .xls, .xlsx | pandas | Data preview, row/column count |
| **CSV** | .csv | pandas | Row preview, encoding detection |
| **JSON** | .json | json | Structured data, pretty printing |
| **XML** | .xml | xml.etree | Tree structure, RSS/Atom support |
| **RSS/Atom** | .rss, .atom | feedparser | Feed metadata, entry extraction |
| **Text** | .txt, .md | chardet | Encoding detection, full content |
| **HTML** | .html, .htm | Scrapy + BS4 | Content extraction, metadata |

## Configuration

### Environment Variables

- `MAX_PAGES_TO_CRAWL`: Maximum number of pages to crawl (default: 20)
- `DATABASE_ID`: Appwrite database ID
- `DOCUMENTS_COLLECTION_ID`: Collection ID for documents
- `ANALYSIS_COLLECTION_ID`: Collection ID for analysis results
- `APPWRITE_FUNCTION_API_ENDPOINT`: Appwrite API endpoint
- `APPWRITE_FUNCTION_PROJECT_ID`: Appwrite project ID

### Scrapy Settings

The function uses these Scrapy settings for respectful crawling:
- User Agent: `DocifyBot/1.0`
- Respects robots.txt
- 1-second delay between requests
- Maximum 2 concurrent requests per domain
- Retry middleware enabled

## How It Works

1. **Initialization**: Parses the input URL and extracts the domain
2. **Spider Creation**: Creates a custom Scrapy spider configured for the domain
3. **Crawling**: Follows links within the same domain up to the maximum page limit
4. **Content Extraction**: For each page, extracts:
   - Page title
   - Meta description
   - Main content using various CSS selectors
5. **Content Aggregation**: Combines content from all crawled pages
6. **Database Update**: Updates the document with scraped content and triggers analysis

## Output Format

The function returns structured data including:
- Title and description of the main page
- Combined content from all crawled pages
- Total word count
- Number of pages crawled
- List of subpages with their titles and word counts

## Dependencies

- `scrapy>=2.11.0`: Web scraping framework
- `lxml>=4.6.0`: XML/HTML parser
- `appwrite>=1.0.0`: Appwrite SDK

## Error Handling

- Falls back to single-page scraping using requests/BeautifulSoup if Scrapy fails
- Graceful error handling with status updates in the database
- Detailed logging for debugging

## 📊 Example Output

When scraping a site with mixed content types, you'll get organized results like:

```
==================================================
HTML CONTENT (5 files)
==================================================

--- Homepage (https://example.com/) ---
Welcome to our documentation site...

--- API Docs (https://example.com/api) ---
REST API documentation...

==================================================
PDF CONTENT (2 files)
==================================================

--- User Guide (https://example.com/guide.pdf) [Metadata: {'pages': 25, 'file_size': 2048576}] ---
Chapter 1: Getting Started
This guide will help you...

==================================================
JSON CONTENT (1 files)
==================================================

--- API Schema (https://example.com/schema.json) [Metadata: {'encoding': 'utf-8', 'file_size': 1536}] ---
JSON Structure:
{
  "api": {
    "version": "1.0",
    "endpoints": [...]
  }
}
```

## 🧪 Testing Examples

### **Mixed Content Site (Recommended for Testing)**
```bash
# Test with a site that has multiple file types
curl -X POST https://your-appwrite-endpoint/functions/document-scraper-python/executions \
  -H "Content-Type: application/json" \
  -H "x-appwrite-key: YOUR_API_KEY" \
  -d '{
    "documentId": "test-mixed-content",
    "url": "https://httpbin.org/"
  }'
```

### **Document-Heavy Site**
```bash
# Test with JSONPlaceholder API
curl -X POST https://your-appwrite-endpoint/functions/document-scraper-python/executions \
  -H "Content-Type: application/json" \
  -H "x-appwrite-key: YOUR_API_KEY" \
  -d '{
    "documentId": "test-json-api",
    "url": "https://jsonplaceholder.typicode.com/"
  }'
```

### **Traditional Website**
```bash
# Test with regular HTML content
curl -X POST https://your-appwrite-endpoint/functions/document-scraper-python/executions \
  -H "Content-Type: application/json" \
  -H "x-appwrite-key: YOUR_API_KEY" \
  -d '{
    "documentId": "test-website",
    "url": "https://example.com/"
  }'
```

## Usage

The function is triggered automatically when new documents are created in the documents collection. It can also be called via HTTP requests with the required parameters.

### **Response Format**
```json
{
  "success": true,
  "data": {
    "documentId": "test-doc-1",
    "wordCount": 1250,
    "title": "Multi-Type Content",
    "url": "https://example.com/",
    "pagesCrawled": 8,
    "contentTypes": {
      "html": 5,
      "pdf": 2,
      "json": 1
    },
    "subpages": [
      {
        "url": "https://example.com/docs.pdf",
        "title": "Documentation",
        "wordCount": 450,
        "contentType": "pdf"
      }
    ]
  }
}
```
