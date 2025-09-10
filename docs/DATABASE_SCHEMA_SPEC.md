# Docify Database Schema Specification

## Database Overview
**Database ID**: `docify_db`
**Platform**: Appwrite Database
**Collections**: 1 consolidated collection (documents_table)
**Architecture**: Single-table design with all document data, scraped content, and analysis results
**Current Attributes**: 15/17 (at Appwrite limit)

## Collections Schema

### Consolidated Documents Collection
**Collection ID**: `documents_table`
**Purpose**: Single consolidated table storing documents, scraped content, and analysis results

#### Current Attributes (15/17)

| Attribute | Type | Required | Default | Size/Format | Description |
|-----------|------|----------|---------|-------------|-------------|
| `instructions` | `string` | ✅ | - | 1000 | User prompt for what to focus on/understand |
| `title` | `string` | ❌ | - | 255 | Document title provided by user |
| `status` | `string` | ✅ | - | enum | Processing status (pending/scraping/analyzing/completed/failed) |
| `user_id` | `string` | ✅ | - | 36 | Appwrite user ID (for user isolation) |
| `scraped_content` | `string` | ❌ | - | 70000 | Full scraped content (large text) |
| `url` | `string` | ✅ | - | URL format | URL to be scraped and analyzed |
| `word_count` | `integer` | ❌ | `0` | - | Total words in scraped content |
| `analysis_summary` | `string` | ❌ | - | 2000 | LLM-generated summary |
| `analysis_blocks` | `string` | ❌ | - | 99999 | JSON array of analysis blocks |
| `public` | `boolean` | ❌ | `false` | - | Whether document is publicly accessible |
| `imported` | `boolean` | ❌ | `false` | - | Whether document was imported (custom field) |
| `user_interests` | `string` | ❌ | - | 2000 | JSON array of user's interests for personalized research |
| `gemini_tools_used` | `string` | ❌ | - | 1000 | JSON array tracking which Gemini tools were used |
| `research_context` | `string` | ❌ | - | 5000 | Research results from user interests analysis |
| `processing_duration` | `integer` | ❌ | `0` | - | Total processing time in seconds |
| `created_at` | `datetime` | ✅ | `auto` | - | Document creation timestamp |
| `updated_at` | `datetime` | ✅ | `auto` | - | Last update timestamp |

#### Status Enum Values
- `"pending"`: Document created, waiting for processing
- `"scraping"`: Currently scraping the URL
- `"analyzing"`: Scraping complete, analyzing with Gemini
- `"completed"`: Analysis complete, ready for display
- `"failed"`: Processing failed (error handling managed by function)

#### New Field Structures (Version 2.1)

##### User Interests Structure
User interests are stored as JSON array for personalized research:

```json
["artificial intelligence", "machine learning", "web development", "API design", "documentation"]
```

##### Gemini Tools Tracking Structure
Tracks which Gemini tools were used during processing:

```json
["search", "function_calling", "code_execution", "url_context", "scrape_document"]
```

##### Tool Execution Log Structure
Detailed log of tool execution steps:

```json
[
  {
    "timestamp": 1703123456.789,
    "tool": "search",
    "action": "research_user_interests",
    "query": "artificial intelligence frameworks",
    "results_count": 5,
    "duration": 2.34
  },
  {
    "timestamp": 1703123460.123,
    "tool": "url_context",
    "action": "analyze_content",
    "url": "https://example.com",
    "content_length": 15432,
    "duration": 1.56
  }
]
```

##### Enhanced Metadata Structure
Additional metadata from Gemini tools:

```json
{
  "search_results": [
    {
      "query": "AI documentation tools",
      "results": [
        {"title": "Best AI Documentation Tools", "url": "https://example.com", "snippet": "..."},
        {"title": "AI-Powered Documentation", "url": "https://example2.com", "snippet": "..."}
      ]
    }
  ],
  "code_execution_results": [
    {
      "language": "python",
      "code": "print('Hello from Gemini')",
      "output": "Hello from Gemini",
      "execution_time": 0.05
    }
  ],
  "research_insights": {
    "related_topics": ["LLM integration", "API documentation", "User experience"],
    "recommended_resources": ["https://example.com/guide", "https://example2.com/tutorial"]
  }
}
```

#### Analysis Block Structure
Analysis blocks are stored as JSON in the `analysis_blocks` field:

```json
[
  {
    "id": "unique-block-id",
    "type": "summary|key_points|architecture|mermaid|code|api_reference|guide|comparison|best_practices|troubleshooting",
    "size": "small|medium|large",
    "title": "Block title",
    "content": "Block content (mermaid syntax for mermaid type)",
    "metadata": {
      "language": "javascript|python|etc (for code blocks)",
      "priority": "high|medium|low"
    }
  }
]
```

#### Indexes
1. **User Documents Index**
   - Attributes: `user_id`, `created_at`
   - Order: Descending on `created_at`
   - Purpose: User's document list sorted by creation date

2. **Status Index**
   - Attributes: `status`, `created_at`
   - Order: Descending on `created_at`
   - Purpose: Find documents by processing status

3. **User Status Index**
   - Attributes: `user_id`, `status`, `created_at`
   - Order: Descending on `created_at`
   - Purpose: User's documents filtered by status

## Relationships

### Consolidated Schema
- **Single Table Design**: All document data, scraped content, and analysis results stored in one `documents_table`
- **No Cross-Table Relationships**: Eliminates JOINs and simplifies queries
- **Atomic Operations**: Document creation, scraping, and analysis are all handled within one record

## Data Constraints

### Current Document Constraints (Updated for 15/17 attributes)
1. `url` must be a valid HTTP/HTTPS URL (enforced by URL format validation)
2. `instructions` cannot exceed 1000 characters
3. `title` cannot exceed 255 characters (optional)
4. Only users can access their own documents (`user_id` filter)
5. Maximum 6 blocks in `analysis_blocks` JSON array
6. Block IDs must be unique within each document
7. Block sizes must follow: small=1, medium=2, large=3 units
8. Total grid units cannot exceed 8 (for 3x3 grid layout)
9. `analysis_blocks` stored as JSON string, parsed on client-side
10. `scraped_content` cannot exceed 70000 characters
11. `analysis_summary` cannot exceed 2000 characters
12. `user_interests` cannot exceed 2000 characters (JSON array)
13. `gemini_tools_used` cannot exceed 1000 characters (JSON array)
14. `research_context` cannot exceed 5000 characters (JSON object)
15. `imported` field tracks import status (custom boolean field)

## Data Validation Rules

### Consolidated Validation
```javascript
// URL format validation
const urlPattern = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;

// Content length limits (current database limits)
title: maxLength(255) // optional
instructions: maxLength(1000) // required
scraped_content: maxLength(70000) // optional
analysis_summary: maxLength(2000) // optional
analysis_blocks: maxLength(99999) // optional, JSON array
user_interests: maxLength(2000) // optional, JSON array
gemini_tools_used: maxLength(1000) // optional, JSON array
research_context: maxLength(5000) // optional, JSON object
processing_duration: integerDefault(0) // optional

// JSON validation for analysis_blocks
try {
  const blocks = JSON.parse(analysis_blocks);
  validateAnalysisBlocks(blocks);
} catch (error) {
  throw new Error('Invalid analysis_blocks JSON format');
}

// Block validation function
function validateAnalysisBlocks(blocks) {
  if (!Array.isArray(blocks)) throw new Error('analysis_blocks must be an array');

  blocks.forEach((block, index) => {
    // Required block properties
    if (!block.id || !block.type || !block.size || !block.title || !block.content) {
      throw new Error(`Block ${index} missing required properties`);
    }

    // Validate block types
    const validTypes = ['summary', 'key_points', 'architecture', 'mermaid', 'code', 'api_reference', 'guide', 'comparison', 'best_practices', 'troubleshooting'];
    if (!validTypes.includes(block.type)) {
      throw new Error(`Block ${index} has invalid type: ${block.type}`);
    }

    // Validate block sizes
    const validSizes = ['small', 'medium', 'large'];
    if (!validSizes.includes(block.size)) {
      throw new Error(`Block ${index} has invalid size: ${block.size}`);
    }
  });

  // Grid constraint validation
  const sizeValues = { small: 1, medium: 2, large: 3 };
  const totalUnits = blocks.reduce((sum, block) => sum + sizeValues[block.size], 0);
  if (totalUnits > 8) throw new Error('Total grid units exceed limit of 8');

  // Maximum blocks constraint
  if (blocks.length > 6) throw new Error('Maximum 6 analysis blocks allowed');
}

// User interests validation
function validateUserInterests(interests) {
  if (!Array.isArray(interests)) throw new Error('user_interests must be an array');
  if (interests.length > 20) throw new Error('Maximum 20 user interests allowed');

  interests.forEach((interest, index) => {
    if (typeof interest !== 'string') throw new Error(`Interest ${index} must be a string`);
    if (interest.length > 100) throw new Error(`Interest ${index} exceeds 100 character limit`);
  });
}

// Gemini tools validation
function validateGeminiTools(tools) {
  if (!Array.isArray(tools)) throw new Error('gemini_tools_used must be an array');

  const validTools = ['search', 'function_calling', 'code_execution', 'url_context', 'scrape_document', 'research_interests'];
  tools.forEach((tool, index) => {
    if (typeof tool !== 'string') throw new Error(`Tool ${index} must be a string`);
    if (!validTools.includes(tool)) throw new Error(`Tool ${index} '${tool}' is not a valid Gemini tool`);
  });
}

// Tool execution log validation
function validateToolExecutionLog(log) {
  if (!Array.isArray(log)) throw new Error('tool_execution_log must be an array');

  log.forEach((entry, index) => {
    if (!entry.timestamp || !entry.tool || !entry.action) {
      throw new Error(`Log entry ${index} missing required properties`);
    }
  });
}
```

## Database Permissions

### Consolidated Collection Permissions
```javascript
// Single documents_table collection
read: ["user:$userId"]  // Users can only read their own documents
write: ["user:$userId", "role:apps"] // Users + functions can write to documents
delete: ["user:$userId"] // Users can only delete their own documents

// Function permissions for automated processing:
- Unified orchestrator: Updates document with scraped content, analysis results, and tool tracking
- Function automatically adapts to available database fields
- Uses Gemini AI tools for enhanced processing and research
- Writes to consolidated document record with graceful field handling
```

## Implementation Strategy

### Version 2.1 Unified Function with Gemini Tools
- **Unified Function**: Single `docify-unified-orchestrator` function replaces separate scraper and analyzer
- **Gemini Orchestrator**: Uses Gemini AI as central orchestrator with built-in tools
- **Enhanced Capabilities**: Function calling, code execution, Google search, URL context
- **User Interests Integration**: Personalized research based on user interests
- **Tool Tracking**: Comprehensive logging of Gemini tool usage and execution

### Version 2.0 Consolidated Schema
- **Single Table Design**: All data consolidated into `documents_table`
- **No Migration Needed**: Fresh implementation with consolidated approach
- **Simplified Architecture**: Eliminates cross-table relationships
- **Atomic Operations**: Document lifecycle managed in one record

### Current Features in 2.1 (15/17 attributes active)
- **User Interests Field**: JSON array for personalized research (`user_interests`, 2000 chars)
- **Gemini Tools Tracking**: Track which tools were used (`gemini_tools_used`, 1000 chars)
- **Research Context**: Store research results from user interests (`research_context`, 5000 chars)
- **Processing Duration**: Track total processing time (`processing_duration`, integer)
- **Imported Flag**: Custom boolean field for import tracking (`imported`)
- **Enhanced Content Limits**: `scraped_content` (70000 chars), `analysis_blocks` (99999 chars)
- **Missing Fields**: `tool_execution_log` and `enhanced_metadata` (would exceed 17 attribute limit)
- **Graceful Degradation**: Function adapts to available database fields automatically

### Current Status & Future Enhancements
- ✅ **Document Sharing**: `public` boolean field already implemented
- ✅ **User Interests**: Basic implementation with `user_interests` field
- ✅ **Tool Analytics**: `gemini_tools_used` and `processing_duration` tracking
- ⚠️ **Enhanced Analytics**: Limited by 17 attribute database constraint
- 🔄 **Future Plans**:
  - Add document categories/tags (requires database schema expansion)
  - Add user preferences for analysis types (requires database schema expansion)
  - Add document templates (requires database schema expansion)
  - Add collaborative features (requires database schema expansion)
  - Enhanced analytics dashboard (blocked by attribute limit)
  - Machine learning model for analysis recommendations
- 🚧 **Database Constraints**: Appwrite 17-attribute limit affects expansion plans

## Backup and Recovery

### Backup Strategy
- Daily automated backups via Appwrite
- User data export capability
- Analysis results archival (after 30 days)

### Recovery Procedures
- Point-in-time recovery for accidental deletions
- Document re-analysis capability
- Failed analysis retry mechanism

## Performance Optimization

### Query Optimization
- Use compound indexes for common query patterns
- Implement pagination for document lists
- Cache frequently accessed analysis results

### Storage Optimization
- Compress large scraped content
- Archive old analysis results
- Implement data retention policies

---

*This schema specification should be reviewed and approved before implementation. Any changes require database migration planning.*
