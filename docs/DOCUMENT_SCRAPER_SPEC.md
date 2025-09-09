# Docify Document Scraper Specification

## Overview
The Document Scraper is a Python-based Appwrite function that intelligently crawls and extracts content from web URLs. It supports multiple content types and formats, providing structured data for LLM analysis.

## Core Functionality

### Input Processing
**Trigger**: Database event on document creation
**Input**: Document URL and metadata
**Processing**: Multi-format content extraction
**Output**: Structured content data + metadata

### Supported Content Types

#### 1. HTML/Web Pages
- **Detection**: Content-Type header or .html/.htm extension
- **Parser**: BeautifulSoup4 + lxml
- **Extraction**: Main content, title, meta description
- **Features**: JavaScript rendering support via Browserless.io

#### 2. PDF Documents
- **Detection**: Content-Type `application/pdf` or .pdf extension
- **Parser**: PyPDF2
- **Extraction**: Text content from all pages
- **Metadata**: Page count, file size, encoding

#### 3. Microsoft Office Documents
- **Detection**: Content-Type or .doc/.docx extensions
- **Parser**: python-docx
- **Extraction**: Paragraph text, formatting preservation
- **Metadata**: Section count, file size

#### 4. Spreadsheets
- **Detection**: Content-Type or .xls/.xlsx/.csv extensions
- **Parser**: pandas
- **Extraction**: Data preview, column headers
- **Metadata**: Row count, column count, file size

#### 5. JSON Data
- **Detection**: Content-Type `application/json` or .json extension
- **Parser**: Built-in json module
- **Extraction**: Structured data with formatting
- **Metadata**: Encoding, file size, structure info

#### 6. XML/RSS Feeds
- **Detection**: Content-Type `application/xml` or .xml/.rss/.atom extensions
- **Parser**: feedparser + xml.etree
- **Extraction**: Feed content, entry details
- **Metadata**: Entry count, feed type

#### 7. Plain Text Files
- **Detection**: Content-Type `text/plain` or .txt/.md extensions
- **Parser**: chardet for encoding detection
- **Extraction**: Full text content
- **Metadata**: Encoding, file size

## Scraping Strategy

### Multi-Strategy Fetching
The scraper uses multiple HTTP strategies to maximize content extraction:

#### 1. Modern Browser Strategy
```python
headers = {
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br'
}
```

#### 2. Mobile Browser Strategy
```python
headers = {
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9'
}
```

#### 3. Bot-Friendly Strategy
```python
headers = {
    'User-Agent': 'DocifyBot/1.0 (https://docify.app)',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9'
}
```

### JavaScript Rendering Support
For dynamic content, the scraper integrates with Browserless.io:

```python
browserless_config = {
    'url': target_url,
    'gotoOptions': {
        'waitUntil': 'networkidle2',
        'timeout': 30000
    }
}
```

### Crawling Logic

#### Domain-Scoped Crawling
```python
def should_crawl_url(url, base_domain):
    """Determine if URL should be crawled"""
    parsed = urlparse(url)
    return parsed.netloc == base_domain
```

#### Link Discovery Algorithm
1. Parse HTML content with BeautifulSoup
2. Extract all `<a>` tags with `href` attributes
3. Resolve relative URLs to absolute URLs
4. Filter URLs within the same domain
5. Skip common non-content URLs:
   - `/search`, `/login`, `/admin`
   - `/wp-admin`, `/api/`, `/feed`
   - `/tag/`, `/category/`, `/author/`

#### Content Quality Filtering
```python
def is_content_page(url):
    """Filter out navigation and utility pages"""
    skip_patterns = [
        '/search', '/login', '/admin', '/wp-admin',
        '/api/', '/feed', '/tag/', '/category/', '/author/'
    ]
    return not any(pattern in url for pattern in skip_patterns)
```

## Content Processing Pipeline

### 1. URL Validation
```python
def validate_url(url):
    """Comprehensive URL validation"""
    try:
        parsed = urlparse(url)
        if not parsed.scheme or not parsed.netloc:
            raise ValueError("Invalid URL format")

        # Domain resolution check
        socket.gethostbyname(parsed.netloc)
        return True
    except Exception as e:
        raise ValueError(f"URL validation failed: {e}")
```

### 2. Content Type Detection
```python
def detect_content_type(response, url):
    """Multi-factor content type detection"""
    # Check HTTP Content-Type header
    content_type = response.headers.get('Content-Type', '')

    # Check URL file extension
    url_path = urlparse(url).path.lower()

    # Determine content type with fallback logic
    if 'application/pdf' in content_type or url_path.endswith('.pdf'):
        return 'pdf'
    elif 'application/json' in content_type or url_path.endswith('.json'):
        return 'json'
    # ... additional type checks
```

### 3. Content Extraction
Each content type has specialized extraction logic:

#### HTML Content Extraction
```python
def extract_html_content(soup, url):
    """Extract structured content from HTML"""
    title = extract_title(soup)
    description = extract_description(soup)
    content = extract_main_content(soup)

    return {
        'url': url,
        'title': title,
        'description': description,
        'content': content,
        'word_count': len(content.split()),
        'content_type': 'html'
    }
```

#### PDF Content Extraction
```python
def extract_pdf_content(response, url):
    """Extract text from PDF documents"""
    pdf_file = BytesIO(response.content)
    pdf_reader = PyPDF2.PdfReader(pdf_file)

    content = []
    for page in pdf_reader.pages[:10]:  # Limit pages
        text = page.extract_text()
        if text.strip():
            content.append(text)

    return {
        'url': url,
        'title': extract_title_from_url(url),
        'content': '\n\n'.join(content),
        'word_count': len(content),
        'content_type': 'pdf',
        'metadata': {
            'pages': len(pdf_reader.pages),
            'file_size': len(response.content)
        }
    }
```

### 4. Content Organization
```python
def organize_content_by_type(pages):
    """Group content by type for better presentation"""
    content_by_type = defaultdict(list)

    for page in pages:
        content_type = page.get('content_type', 'unknown')
        content_by_type[content_type].append(page)

    return content_by_type
```

### 5. Combined Content Generation
```python
def generate_combined_content(content_by_type, max_length=75000):
    """Create organized combined content"""
    combined_sections = []

    for content_type, pages in content_by_type.items():
        # Add type header
        header = f"\n{'='*50}\n{content_type.upper()} CONTENT ({len(pages)} files)\n{'='*50}\n"
        combined_sections.append(header)

        for page in pages:
            if page.get('content'):
                # Include metadata for non-HTML content
                metadata = ""
                if page.get('metadata'):
                    metadata = f"\n[Metadata: {page['metadata']}]"

                page_content = f"\n--- {page['title']} ({page['url']}){metadata} ---\n{page['content']}"
                combined_sections.append(page_content)

    return '\n'.join(combined_sections)[:max_length]
```

## Configuration and Limits

### Environment Variables
```bash
MAX_PAGES_TO_CRAWL=20          # Maximum pages to crawl
DATABASE_ID=docify_db          # Appwrite database ID
DOCUMENTS_COLLECTION_ID=documents_table
# Single consolidated collection - no separate analysis collection needed
BROWSERLESS_API_KEY=           # Optional: for JS rendering
```

### Processing Limits
- **Max Pages**: 20 pages per document
- **Max Content Length**: 75,000 characters
- **Request Timeout**: 30 seconds per page
- **Total Processing Time**: 5 minutes maximum
- **Concurrent Requests**: 2 per domain

### Rate Limiting
- **Delay Between Requests**: 1 second
- **Max Concurrent Requests**: 2 per domain
- **Retry Attempts**: 3 with exponential backoff

## Error Handling

### Network Errors
1. **Connection Timeout**: Retry with different strategy
2. **DNS Resolution**: Mark as failed with clear error
3. **SSL Errors**: Attempt HTTP fallback
4. **Rate Limiting**: Implement exponential backoff

### Content Processing Errors
1. **Invalid Content Type**: Skip with warning
2. **Corrupted Files**: Skip with error logging
3. **Encoding Issues**: Use chardet for detection, fallback to UTF-8
4. **Empty Content**: Filter out pages with <50 characters

### Database Errors
1. **Connection Issues**: Retry with circuit breaker pattern
2. **Permission Errors**: Log and update document status
3. **Data Validation**: Validate before saving

## Performance Optimization

### Content Filtering
```python
def should_process_page(content, title):
    """Filter out low-quality or irrelevant pages"""
    # Skip if content too short
    if len(content.strip()) < 50:
        return False

    # Skip if title indicates navigation/utility
    skip_titles = ['menu', 'navigation', 'footer', 'sidebar', 'login']
    if any(skip in title.lower() for skip in skip_titles):
        return False

    return True
```

### Memory Management
- **Streaming Processing**: Process pages individually
- **Content Chunking**: Break large content into manageable pieces
- **Garbage Collection**: Explicit cleanup of large objects

### Caching Strategy
- **URL Validation**: Cache DNS resolution results
- **Content Type Detection**: Cache MIME type patterns
- **Processed Content**: Avoid reprocessing identical URLs

## Monitoring and Metrics

### Performance Metrics
- **Average Crawl Time**: Per document
- **Success Rate**: By content type
- **Content Volume**: Words/pages processed
- **Error Distribution**: By error type

### System Health
- **Memory Usage**: Track during processing
- **Network Latency**: Monitor request times
- **API Limits**: Track Browserless.io usage
- **Queue Depth**: Monitor pending documents

## Testing Strategy

### Unit Tests
- URL validation functions
- Content type detection
- Individual parser functions
- Error handling scenarios

### Integration Tests
- Full scraping pipeline
- Database integration
- API response validation
- Cross-domain crawling

### Content Quality Tests
- Extraction accuracy validation
- Content completeness checks
- Metadata accuracy verification

## Future Enhancements

### Advanced Features
1. **JavaScript-Heavy Sites**: Enhanced Puppeteer integration
2. **Authentication Support**: Handle login-required content
3. **API Documentation**: Specialized parsing for API docs
4. **Multi-language Support**: Enhanced encoding detection

### Performance Improvements
1. **Distributed Crawling**: Multiple instances for large sites
2. **Incremental Updates**: Only crawl changed content
3. **Content Compression**: Reduce storage and transfer size
4. **Smart Caching**: Intelligent cache invalidation

### Content Types Expansion
1. **Images and Diagrams**: OCR and image analysis
2. **Video Content**: Transcript extraction
3. **Interactive Content**: Form and interaction handling
4. **Binary Formats**: Additional document types

---

*This specification documents the current scraping implementation and provides a roadmap for future enhancements. All modifications should maintain backward compatibility.*
