# Docify Python LLM Analyzer

This Appwrite function analyzes web content using Hugging Face transformers and generates structured visual analysis blocks for the Docify platform.

## 🚀 Features

### Core Analysis Capabilities
- **Intelligent Content Analysis**: Automatically detects content type (API docs, tutorials, architecture, etc.)
- **Structured Block Generation**: Creates up to 6 analysis blocks with different visualization types
- **Smart Prioritization**: Prioritizes blocks based on content analysis and user instructions
- **Grid-Optimized Sizing**: Automatically sizes blocks for optimal 3x3 grid layout

### Analysis Block Types
- **Summary**: Comprehensive document overview
- **Key Points**: Important highlights and takeaways
- **Architecture**: System/component structure explanation
- **Mermaid**: Visual diagrams and flowcharts
- **Code**: Code examples with syntax highlighting
- **API Reference**: API documentation structure
- **Guide**: Step-by-step instructions
- **Comparison**: Feature or approach comparisons
- **Best Practices**: Recommendations and guidelines
- **Troubleshooting**: Common issues and solutions

### Advanced Features
- **Content Optimization**: Intelligently truncates and prioritizes important content sections
- **Error Recovery**: Automatic retries with exponential backoff
- **Fallback Handling**: Graceful degradation when analysis fails
- **Performance Monitoring**: Processing time tracking and optimization

## 📋 Prerequisites

### Environment Variables
```bash
# Appwrite Configuration
APPWRITE_FUNCTION_API_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_FUNCTION_PROJECT_ID=your_project_id
APPWRITE_API_KEY=your_api_key

# Database Configuration
DATABASE_ID=docify_db
DOCUMENTS_COLLECTION_ID=documents_table
ANALYSIS_COLLECTION_ID=analysis_results

# Hugging Face Configuration
HUGGINGFACE_ACCESS_TOKEN=your_huggingface_token
```

### Hugging Face Token
1. Sign up at [Hugging Face](https://huggingface.co/)
2. Go to Settings → Access Tokens
3. Create a new token with "Read" permissions
4. Set the `HUGGINGFACE_ACCESS_TOKEN` environment variable

## 🛠️ Installation

### 1. Install Dependencies
```bash
cd functions/llm-analyzer-python
pip install -r requirements.txt
```

### 2. Deploy to Appwrite
```bash
# Using Appwrite CLI
appwrite functions create \
  --functionId llm-analyzer-python \
  --name "LLM Analyzer Python" \
  --runtime python-3.9 \
  --entrypoint "src/main.py" \
  --events "databases.docify_db.collections.analysis_results.documents.*.create"

# Deploy function code
appwrite functions deploy --functionId llm-analyzer-python
```

### 3. Set Environment Variables
```bash
appwrite functions variables create \
  --functionId llm-analyzer-python \
  --key HUGGINGFACE_ACCESS_TOKEN \
  --value your_token_here
```

## 🔧 Configuration

### Model Configuration
The function uses Mistral-7B-Instruct-v0.2 by default. To use a different model:

```python
# In main.py, modify the model_name parameter
model_name = "microsoft/DialoGPT-medium"  # Example alternative
```

### Processing Limits
```python
# Adjust these constants in main.py
MAX_CONTENT_LENGTH = 50000  # Characters
MAX_BLOCKS = 6              # Maximum analysis blocks
MAX_RETRIES = 3             # API retry attempts
```

## 📊 Usage

### Automatic Trigger
The function automatically triggers when a new analysis record is created:

```javascript
// This triggers the LLM analyzer
await databases.createDocument(
  'docify_db',
  'analysis_results',
  'unique-id',
  {
    document_id: 'document-id',
    summary: 'Analysis in progress...',
    charts: [],
    raw_response: null,
    processing_time: 0
  }
);
```

### Manual Testing
```bash
# Test locally
cd functions/llm-analyzer-python
python src/main.py

# Test with specific document
curl -X POST https://your-appwrite-endpoint/functions/llm-analyzer-python/executions \
  -H "Content-Type: application/json" \
  -H "x-appwrite-key: YOUR_API_KEY" \
  -d '{"documentId": "your-document-id"}'
```

## 🎯 Analysis Output

### Response Format
```json
{
  "success": true,
  "data": {
    "documentId": "doc-123",
    "analysisId": "analysis-456",
    "summary": "Comprehensive document summary...",
    "blockCount": 5,
    "processingTime": 12.34
  }
}
```

### Analysis Blocks Structure
```json
{
  "summary": "Document overview text...",
  "blocks": [
    {
      "id": "summary-block-1",
      "type": "summary",
      "size": "large",
      "title": "Document Overview",
      "content": "Detailed summary content...",
      "metadata": {
        "priority": "high"
      }
    },
    {
      "id": "key-points-1",
      "type": "key_points",
      "size": "medium",
      "title": "Key Features",
      "content": "- Feature 1\\n- Feature 2\\n- Feature 3",
      "metadata": {
        "priority": "medium"
      }
    }
  ]
}
```

## 🔍 Content Analysis Algorithm

### 1. Content Type Detection
```python
def detect_content_type(content, instructions):
    # Analyzes content patterns and user instructions
    # Returns prioritized block types for the content
```

### 2. Block Prioritization
```python
def prioritize_blocks(content_types, user_instructions):
    # Scores block types based on content analysis
    # Adjusts scores based on user instructions
    # Returns top 5 block types for generation
```

### 3. Content Optimization
```python
def optimize_content_for_analysis(content):
    # Truncates content to manageable size
    # Prioritizes important sections
    # Returns optimized content for LLM processing
```

## 🚨 Error Handling

### Error Categories
- **Rate Limiting**: Automatic retry with exponential backoff
- **Network Issues**: Connection timeout and retry logic
- **Content Missing**: Clear error message for missing scraped content
- **API Failures**: Structured error responses with recovery suggestions

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "ANALYSIS_FAILED",
    "message": "User-friendly error message",
    "details": {
      "originalError": "Technical error details",
      "isRetryable": true,
      "suggestedAction": "retry_later",
      "documentId": "doc-123",
      "processingTime": 5.67
    }
  }
}
```

## 📈 Performance Optimization

### Memory Management
- Content chunking for large documents
- Model caching to reduce loading time
- Automatic cleanup of temporary data

### API Optimization
- Request batching where possible
- Intelligent retry logic with backoff
- Connection pooling and keep-alive

### Monitoring
```python
# Built-in performance tracking
processing_time = time.time() - start_time
print(f"Analysis completed in {processing_time:.2f}s")
```

## 🧪 Testing

### Unit Tests
```bash
# Run tests
python -m pytest tests/ -v

# Run with coverage
python -m pytest tests/ --cov=src --cov-report=html
```

### Integration Tests
```python
# Test full analysis pipeline
from src.main import main

test_context = {
    'req': {'body': {'documentId': 'test-doc'}},
    'log': print,
    'error': print
}

result = main(test_context)
assert result['success'] == True
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Model Loading Errors
```
Error: Model mistralai/Mistral-7B-Instruct-v0.2 not found
```
**Solution**: Check Hugging Face token permissions and model availability

#### 2. Memory Issues
```
Error: CUDA out of memory
```
**Solution**: Reduce model size or use CPU inference

#### 3. API Rate Limits
```
Error: 429 Client Error: Too Many Requests
```
**Solution**: Increase retry delays or upgrade Hugging Face plan

### Debug Mode
Enable detailed logging:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## 📚 API Reference

### Main Function
```python
def main(context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Appwrite function entry point

    Args:
        context: Appwrite function context with req, res, log, error

    Returns:
        Dict containing success status and analysis results
    """
```

### Utility Functions
- `create_analysis_prompt()`: Generates LLM prompt
- `detect_content_type()`: Analyzes content patterns
- `prioritize_blocks()`: Scores and ranks block types
- `optimize_content_for_analysis()`: Prepares content for processing
- `call_hugging_face_api()`: Handles API communication with retries

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section above
2. Review Appwrite function logs
3. Open an issue with detailed error information
4. Include your environment configuration (without sensitive data)
