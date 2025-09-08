# Docify Database Schema Specification

## Database Overview
**Database ID**: `docify_db`
**Platform**: Appwrite Database
**Collections**: 2 main collections (documents_table, analysis_results)

## Collections Schema

### 1. Documents Collection
**Collection ID**: `documents_table`
**Purpose**: Stores user-created documents with URLs and analysis prompts

#### Attributes

| Attribute | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `user_id` | `string` | ✅ | - | Appwrite user ID (for user isolation) |
| `title` | `string` | ✅ | - | Document title provided by user |
| `url` | `string` | ✅ | - | URL to be scraped and analyzed |
| `instructions` | `string` | ✅ | - | User prompt for what to focus on/understand |
| `status` | `string` | ✅ | `"pending"` | Processing status enum |
| `scraped_content` | `string` | ❌ | `null` | Full scraped content (large text) |
| `word_count` | `integer` | ❌ | `0` | Total words in scraped content |
| `pages_crawled` | `integer` | ❌ | `0` | Number of pages scraped |
| `content_types` | `object` | ❌ | `{}` | Breakdown of content types found |
| `subpages` | `array` | ❌ | `[]` | List of subpages scraped |
| `error_message` | `string` | ❌ | `null` | Error message if processing failed |
| `created_at` | `datetime` | ✅ | `auto` | Document creation timestamp |
| `updated_at` | `datetime` | ✅ | `auto` | Last update timestamp |

#### Status Enum Values
- `"pending"`: Document created, waiting for scraping
- `"scraping"`: Currently scraping the URL
- `"analyzing"`: Scraping complete, analyzing with LLM
- `"completed"`: Analysis complete, ready for display
- `"failed"`: Processing failed, see error_message

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

### 2. Analysis Results Collection
**Collection ID**: `analysis_results`
**Purpose**: Stores LLM analysis results with structured blocks

#### Attributes

| Attribute | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `document_id` | `string` | ✅ | - | Reference to documents_table.$id |
| `summary` | `string` | ✅ | - | Overall summary of the document |
| `charts` | `array` | ✅ | `[]` | Array of analysis blocks (JSON) |
| `raw_response` | `string` | ❌ | `null` | Raw LLM API response |
| `processing_time` | `integer` | ❌ | `0` | Analysis time in milliseconds |
| `status` | `string` | ✅ | `"pending"` | Analysis status |
| `error_message` | `string` | ❌ | `null` | Error message if analysis failed |
| `created_at` | `datetime` | ✅ | `auto` | Analysis creation timestamp |
| `updated_at` | `datetime` | ✅ | `auto` | Last update timestamp |

#### Analysis Status Enum Values
- `"pending"`: Analysis record created, waiting for LLM
- `"processing"`: Currently running LLM analysis
- `"completed"`: Analysis successful
- `"failed"`: Analysis failed

#### Block Structure (charts array items)
Each block in the `charts` array follows this JSON structure:

```json
{
  "id": "unique-block-id",
  "type": "summary|key_points|architecture|mermaid|code|api_reference|guide|comparison|best_practices|troubleshooting",
  "size": "small|medium|large",
  "title": "Block title",
  "content": "Block content (mermaid syntax for mermaid type)",
  "metadata": {
    "language": "javascript|python|etc (for code blocks)",
    "priority": "high|medium|low",
    "position": "1-6 (grid position)"
  }
}
```

#### Indexes
1. **Document Analysis Index**
   - Attributes: `document_id`, `created_at`
   - Order: Descending on `created_at`
   - Purpose: Get latest analysis for a document

2. **Status Index**
   - Attributes: `status`, `created_at`
   - Order: Descending on `created_at`
   - Purpose: Find analysis records by status

3. **Processing Time Index**
   - Attributes: `processing_time`
   - Order: Descending
   - Purpose: Performance monitoring

## Relationships

### One-to-Many Relationship
- **Documents** (1) → **Analysis Results** (Many)
- Each document can have multiple analysis results (for retries, different prompts, etc.)
- Only the latest analysis result should be displayed to users

## Data Constraints

### Document Constraints
1. `url` must be a valid HTTP/HTTPS URL
2. `instructions` cannot exceed 1000 characters
3. `title` cannot exceed 200 characters
4. Only users can access their own documents (`user_id` filter)

### Analysis Constraints
1. Maximum 6 blocks in `charts` array
2. Block IDs must be unique within each analysis
3. Block sizes must follow: small=1, medium=2, large=3 units
4. Total grid units cannot exceed 8 (for 3x3 grid minus summary)

## Data Validation Rules

### Document Validation
```javascript
// URL format validation
const urlPattern = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;

// Content length limits
title: maxLength(200)
instructions: maxLength(1000)
```

### Analysis Validation
```javascript
// Block validation
blocks: maxLength(6)
blockTypes: ['summary', 'key_points', 'architecture', 'mermaid', 'code', 'api_reference', 'guide', 'comparison', 'best_practices', 'troubleshooting']
blockSizes: ['small', 'medium', 'large']

// Grid constraint validation
const sizeValues = { small: 1, medium: 2, large: 3 };
const totalUnits = blocks.reduce((sum, block) => sum + sizeValues[block.size], 0);
if (totalUnits > 8) throw new Error('Total grid units exceed limit');
```

## Database Permissions

### Collection Permissions
```javascript
// Documents collection
read: ["user:$userId"]  // Users can only read their own documents
write: ["user:$userId"] // Users can only write their own documents
delete: ["user:$userId"] // Users can only delete their own documents

// Analysis Results collection
read: ["user:$userId"]  // Users can only read analysis for their documents
write: ["role:apps"]   // Only functions can write analysis results
delete: ["user:$userId"] // Users can delete their analysis results
```

## Data Migration Strategy

### Version 1.0 Initial Schema
- Basic document and analysis collections
- Simple status tracking
- Block-based analysis storage

### Future Migrations
- Add user preferences table
- Add document sharing features
- Add analysis templates
- Add document categories/tags

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
