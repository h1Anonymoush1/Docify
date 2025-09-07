# URL to Markdown Converter

A simple Appwrite function that converts any webpage URL to clean Markdown format.

## Features

- **Simple API**: Just provide a URL and get back Markdown
- **Smart Content Extraction**: Uses Mozilla Readability to extract main article content
- **Clean Markdown**: Proper heading styles, code blocks, and formatting
- **Title Detection**: Automatically includes page title when available
- **Error Handling**: Comprehensive error handling for invalid URLs and fetch failures

## API Usage

### GET Request
```bash
curl "https://your-appwrite-function.com/?url=https://example.com/article"
```

### POST Request
```bash
curl -X POST "https://your-appwrite-function.com/" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/article"}'
```

### Response Format

**Success Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://example.com/article",
    "title": "Article Title",
    "markdown": "# Article Title\n\nArticle content in markdown...",
    "excerpt": "Brief excerpt of the article...",
    "length": 1234
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message"
}
```

## Dependencies

- `@mozilla/readability`: Extracts readable content from web pages
- `turndown`: Converts HTML to Markdown
- `jsdom`: Parses HTML documents
- `html-entities`: Decodes HTML entities

## Deployment

1. Deploy this function to your Appwrite project
2. Set appropriate function permissions
3. Call the function with any valid URL

## Examples

### Convert a blog post
```bash
curl "https://your-appwrite-function.com/?url=https://example-blog.com/my-article"
```

### Convert documentation
```bash
curl "https://your-appwrite-function.com/?url=https://docs.example.com/getting-started"
```

## Notes

- The function includes basic rate limiting through Appwrite
- Large pages may take longer to process
- Some websites may block automated requests
- The function attempts to extract the main article content automatically
