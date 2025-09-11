# Docify - Appwrite Functions Specifications

## 🔧 Function Architecture Overview

Docify uses a **unified 8-step processing pipeline** implemented as a single Appwrite Function:
1. **Docify Unified Orchestrator**: Complete document processing in one streamlined function

### Key Improvements:
- **Single Function**: Eliminates complex inter-function orchestration
- **Raw Content Preservation**: No dangerous cleaning/modification
- **AI-Powered Titles**: 2-4 word intelligent titles using Gemini
- **Compatible Output**: Same JSON format as original analyzer
- **Linear Processing**: Clear 8-step workflow with proper error handling

## 🚀 Unified Function: Docify Orchestrator

### Configuration
```json
{
  "functionId": "docify-unified-orchestrator",
  "name": "Docify Unified Orchestrator v3.0",
  "runtime": "python-3.9",
  "entrypoint": "src/main.py",
  "timeout": 500,
  "memory": 1024,
  "execute": ["users"],
  "events": ["databases.docify_db.collections.documents_table.documents.*.create"],
  "schedule": "",
  "variables": {
    "GEMINI_API_KEY": "secret",
    "BROWSERLESS_API_KEY": "optional",
    "DATABASE_ID": "docify_db",
    "DOCUMENTS_COLLECTION_ID": "documents_table"
  }
}
```

### Dependencies
```json
{
  "dependencies": {
    "google-genai": "^0.8.0",
    "requests": "^2.31.0",
    "chardet": "^5.2.0",
    "beautifulsoup4": "^4.12.0",
    "appwrite": "^13.0.0"
  }
}
```

### Input Schema
```typescript
interface UnifiedInput {
  $id: string;           // Document ID (auto-generated)
  url: string;           // Target URL to scrape
  user_id: string;       // User ID for attribution
  instructions: string;  // User analysis instructions
}
```

### Output Schema
```typescript
interface UnifiedOutput {
  success: boolean;
  message: string;
  data?: {
    document_id: string;
    title: string;       // AI-generated 2-4 word title
    processing_time: number;
  };
  error?: string;
  processing_time?: number;
}
```

### Database Updates
The function updates the document record with:
- `status`: `pending` → `scraping` → `analyzing` → `completed`/`failed`
- `scraped_content`: Raw HTML content (no modification)
- `title`: AI-generated 2-4 word title
- `analysis_summary`: Readable summary (≤200 chars)
- `analysis_blocks`: JSON array (frontend compatible)
- `gemini_tools_used`: Simple tools array
- `research_context`: Context (≤5000 chars)

### 8-Step Processing Flow
```python
def main(context):
    try:
        # Step 1: Extract document data
        doc_data = extract_document_data(context)

        # Step 2: Validate environment
        validate_environment()

        # Step 3: Raw browserless scraping
        raw_content = scrape_raw_content(doc_data['url'])

        # Step 4: Save raw content
        save_raw_content(doc_data['document_id'], raw_content)

        # Step 5: Generate AI title
        ai_title = generate_ai_title(doc_data['url'], raw_content, doc_data['instructions'])

        # Step 6: Generate analysis
        analysis_result = generate_analysis(doc_data['url'], raw_content, doc_data['instructions'], ai_title)

        # Step 7: Create compatible blocks
        blocks_json = create_compatible_blocks(analysis_result)

        # Step 8: Final save and complete
        final_save_and_complete(doc_data['document_id'], ai_title, analysis_result, blocks_json)

        return {
            'success': True,
            'message': 'Document processed successfully',
            'data': {
                'document_id': doc_data['document_id'],
                'title': ai_title,
                'processing_time': processing_time
            }
        }

    except Exception as e:
        # Update status to failed
        update_document_status(doc_data['document_id'], 'failed')
        return {
            'success': False,
            'error': str(e),
            'processing_time': processing_time
        }
```

### Key Features

#### 🔒 Raw Content Preservation
- **No Dangerous Cleaning**: Saves browserless content exactly as received
- **Complete Transparency**: You can always see what was actually scraped
- **Reliable Storage**: Raw HTML preserved in `scraped_content` field

#### 🤖 AI-Powered Intelligence
- **Smart Titles**: Generates 2-4 word titles using Gemini AI
- **Readable Summaries**: Human-friendly summaries up to 200 characters
- **Compatible Blocks**: Exact same JSON format as original `llm-analyzer-python`

#### 🎯 8-Step Linear Process
1. **Extract Document Data** - Validate request parameters
2. **Validate Environment** - Check API keys and configuration
3. **Raw Browserless Scraping** - Scrape content without modification
4. **Save Raw Content** - Store exact HTML in database
5. **Generate AI Title** - Create 2-4 word intelligent titles
6. **Generate Analysis** - Produce comprehensive AI analysis
7. **Create Compatible Blocks** - Format blocks for frontend
8. **Final Save & Complete** - Update database and mark complete

#### 🛡️ Error Handling & Recovery
- **Graceful Failure**: Updates status to 'failed' with error details
- **Retry Capability**: Failed documents can be retried
- **Status Tracking**: Clear status progression throughout process

### Environment Variables
```bash
# Required
GEMINI_API_KEY=your_gemini_api_key
DATABASE_ID=docify_db
DOCUMENTS_COLLECTION_ID=documents_table

# Optional (Enhanced)
BROWSERLESS_API_KEY=your_browserless_api_key
```

### Monitoring & Logging
```python
# Structured logging for monitoring
def log_metrics(step, duration, success, metadata={}):
    log_data = {
        "function": "docify-unified-orchestrator",
        "step": step,
        "duration": duration,
        "success": success,
        "timestamp": datetime.now().isoformat(),
        **metadata
    }
    print(json.dumps(log_data))
```

---

*This unified function specification replaces the previous three-function architecture with a streamlined, reliable single-function approach that maintains all the original functionality while adding new capabilities.*