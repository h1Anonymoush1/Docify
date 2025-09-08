# Deploying Python LLM Analyzer to Appwrite

## 🚀 Deployment Steps

### 1. Update Appwrite Function
Replace the existing JavaScript LLM analyzer with the Python version:

```bash
# Delete existing function (if needed)
appwrite functions delete --functionId llm-analyzer

# Create new Python function
appwrite functions create \
  --functionId llm-analyzer-python \
  --name "LLM Analyzer Python" \
  --runtime python-3.9 \
  --entrypoint "src/main.py" \
  --events "databases.docify_db.collections.analysis_results.documents.*.create"
```

### 2. Deploy Function Code
```bash
cd functions/llm-analyzer-python
appwrite functions deploy --functionId llm-analyzer-python
```

### 3. Set Environment Variables
```bash
# Required environment variables
appwrite functions variables create \
  --functionId llm-analyzer-python \
  --key HUGGINGFACE_ACCESS_TOKEN \
  --value your_huggingface_token_here

appwrite functions variables create \
  --functionId llm-analyzer-python \
  --key DATABASE_ID \
  --value docify_db

appwrite functions variables create \
  --functionId llm-analyzer-python \
  --key DOCUMENTS_COLLECTION_ID \
  --value documents_table

appwrite functions variables create \
  --functionId llm-analyzer-python \
  --key ANALYSIS_COLLECTION_ID \
  --value analysis_results
```

### 4. Verify Deployment
```bash
# Test function execution
curl -X POST https://your-appwrite-endpoint/functions/llm-analyzer-python/executions \
  -H "Content-Type: application/json" \
  -H "x-appwrite-key: YOUR_API_KEY" \
  -d '{"documentId": "test-doc-id"}'

# Check function logs
appwrite functions logs --functionId llm-analyzer-python
```

## 🔧 Configuration

### Memory and Timeout Settings
Update function configuration for optimal performance:

```bash
appwrite functions update \
  --functionId llm-analyzer-python \
  --execute '["any"]' \
  --timeout 300 \
  --memory 1024
```

### Environment Variables Reference
| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `HUGGINGFACE_ACCESS_TOKEN` | Hugging Face API token | ✅ | - |
| `DATABASE_ID` | Appwrite database ID | ❌ | `docify_db` |
| `DOCUMENTS_COLLECTION_ID` | Documents collection ID | ❌ | `documents_table` |
| `ANALYSIS_COLLECTION_ID` | Analysis collection ID | ❌ | `analysis_results` |
| `APPWRITE_FUNCTION_API_ENDPOINT` | Appwrite API endpoint | ✅ | - |
| `APPWRITE_FUNCTION_PROJECT_ID` | Appwrite project ID | ✅ | - |
| `APPWRITE_API_KEY` | Appwrite API key | ✅ | - |

## 🧪 Testing Production Deployment

### Manual Testing
```bash
# 1. Create a test document
curl -X POST https://your-appwrite-endpoint/databases/docify_db/collections/documents_table/documents \
  -H "Content-Type: application/json" \
  -H "X-Appwrite-Key: YOUR_API_KEY" \
  -d '{
    "documentId": "test-doc-123",
    "data": {
      "title": "Test API Documentation",
      "url": "https://example.com/api-docs",
      "instructions": "Analyze the API endpoints",
      "status": "completed",
      "scraped_content": "REST API documentation for user management..."
    }
  }'

# 2. Create analysis record to trigger LLM analyzer
curl -X POST https://your-appwrite-endpoint/databases/docify_db/collections/analysis_results/documents \
  -H "Content-Type: application/json" \
  -H "X-Appwrite-Key: YOUR_API_KEY" \
  -d '{
    "documentId": "test-doc-123",
    "data": {
      "document_id": "test-doc-123",
      "summary": "Analysis in progress...",
      "charts": [],
      "raw_response": null,
      "processing_time": 0,
      "status": "pending"
    }
  }'

# 3. Check analysis results
curl https://your-appwrite-endpoint/databases/docify_db/collections/analysis_results/documents \
  -H "X-Appwrite-Key: YOUR_API_KEY"
```

### Automated Testing
```bash
# Run local tests before deployment
cd functions/llm-analyzer-python
python3 test_simple.py

# Install dependencies locally
pip install -r requirements.txt

# Test with mock data
python3 -c "
from src.main import create_analysis_prompt, detect_content_type
print('✅ Local testing successful')
"
```

## 🔍 Monitoring and Debugging

### Function Logs
```bash
# View recent logs
appwrite functions logs --functionId llm-analyzer-python --limit 50

# Stream logs in real-time
appwrite functions logs --functionId llm-analyzer-python --follow
```

### Performance Monitoring
```bash
# Check function execution statistics
appwrite functions get --functionId llm-analyzer-python

# Monitor function health
curl https://your-appwrite-endpoint/functions/llm-analyzer-python/health
```

### Common Issues

#### 1. Import Errors
```
Error: No module named 'transformers'
```
**Solution**: Ensure all dependencies are installed in the function environment.

#### 2. Memory Issues
```
Error: CUDA out of memory
```
**Solution**: Reduce model size or use CPU inference for free tier.

#### 3. API Rate Limits
```
Error: 429 Too Many Requests
```
**Solution**: Implement exponential backoff (already built-in) or upgrade Hugging Face plan.

#### 4. Database Connection Issues
```
Error: Database connection failed
```
**Solution**: Verify Appwrite credentials and network connectivity.

## 📈 Performance Optimization

### Model Optimization
```python
# Use smaller model for faster inference
MODEL_NAME = "microsoft/DialoGPT-small"  # Instead of Mistral-7B

# Use CPU if GPU memory is limited
device_map = "cpu"
```

### Content Processing
```python
# Adjust content limits based on your needs
MAX_CONTENT_LENGTH = 25000  # Reduce for faster processing
MAX_BLOCKS = 4              # Reduce number of blocks
```

### Caching Strategies
```python
# Implement response caching for similar content
import hashlib

def get_cache_key(content, instructions):
    key = hashlib.md5(f"{content[:1000]}{instructions}".encode()).hexdigest()
    return f"analysis_{key}"
```

## 🔄 Migration from JavaScript Version

### Data Compatibility
The Python version maintains full compatibility with existing data structures:
- ✅ Same database schema
- ✅ Same API response format
- ✅ Same block types and sizes
- ✅ Same error handling structure

### Gradual Rollout
```bash
# 1. Deploy Python version alongside JavaScript
appwrite functions create \
  --functionId llm-analyzer-python \
  --name "LLM Analyzer Python (New)"

# 2. Test with subset of traffic
# Update your application to use Python version for new documents

# 3. Full migration
# Delete old JavaScript function
appwrite functions delete --functionId llm-analyzer

# Rename Python function
appwrite functions update \
  --functionId llm-analyzer-python \
  --name "LLM Analyzer"
```

## 🎯 Success Metrics

Monitor these metrics to ensure successful deployment:

- **Function Success Rate**: >95% successful executions
- **Average Processing Time**: <30 seconds for typical documents
- **Error Rate**: <5% overall error rate
- **User Satisfaction**: Monitor analysis quality feedback

## 📞 Support

For deployment issues:
1. Check function logs for detailed error messages
2. Verify all environment variables are set correctly
3. Test with minimal data to isolate issues
4. Review Hugging Face API usage and limits

---

*This deployment guide ensures smooth transition from JavaScript to Python LLM analyzer with minimal downtime and full feature compatibility.*
