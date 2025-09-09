# Docify Database Schema Specification

## Database Overview
**Database ID**: `docify_db`
**Platform**: Appwrite Database
**Collections**: 1 consolidated collection (documents_table)
**Architecture**: Single-table design with all document data, scraped content, and analysis results

## Collections Schema

### Consolidated Documents Collection
**Collection ID**: `documents_table`
**Purpose**: Single consolidated table storing documents, scraped content, and analysis results

#### Attributes

| Attribute | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `user_id` | `string` | ✅ | - | Appwrite user ID (for user isolation) |
| `title` | `string` | ❌ | - | Document title provided by user |
| `url` | `string` | ✅ | - | URL to be scraped and analyzed |
| `instructions` | `string` | ✅ | - | User prompt for what to focus on/understand |
| `status` | `string` | ✅ | `"pending"` | Processing status enum |
| `public` | `boolean` | ❌ | `false` | Whether document is publicly accessible |
| `scraped_content` | `string` | ❌ | - | Full scraped content (large text) |
| `word_count` | `integer` | ❌ | `0` | Total words in scraped content |
| `analysis_summary` | `string` | ❌ | - | LLM-generated summary |
| `analysis_blocks` | `string` | ❌ | - | JSON array of analysis blocks |
| `error_message` | `string` | ❌ | - | Error message if processing failed |
| `created_at` | `datetime` | ✅ | `auto` | Document creation timestamp |
| `updated_at` | `datetime` | ✅ | `auto` | Last update timestamp |

#### Status Enum Values
- `"pending"`: Document created, waiting for scraping
- `"scraping"`: Currently scraping the URL
- `"analyzing"`: Scraping complete, analyzing with LLM
- `"completed"`: Analysis complete, ready for display
- `"failed"`: Processing failed, see error_message

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

### Consolidated Document Constraints
1. `url` must be a valid HTTP/HTTPS URL
2. `instructions` cannot exceed 1000 characters
3. `title` cannot exceed 200 characters (optional)
4. Only users can access their own documents (`user_id` filter)
5. Maximum 6 blocks in `analysis_blocks` JSON array
6. Block IDs must be unique within each document
7. Block sizes must follow: small=1, medium=2, large=3 units
8. Total grid units cannot exceed 8 (for 3x3 grid layout)
9. `analysis_blocks` stored as JSON string, parsed on client-side

## Data Validation Rules

### Consolidated Validation
```javascript
// URL format validation
const urlPattern = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;

// Content length limits
title: maxLength(200) // optional
instructions: maxLength(1000) // required
analysis_summary: maxLength(2000) // optional
error_message: maxLength(1000) // optional

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
```

## Database Permissions

### Consolidated Collection Permissions
```javascript
// Single documents_table collection
read: ["user:$userId"]  // Users can only read their own documents
write: ["user:$userId", "role:apps"] // Users + functions can write to documents
delete: ["user:$userId"] // Users can only delete their own documents

// Function permissions for automated processing:
- Document scraper: Updates document with scraped content
- LLM analyzer: Updates document with analysis results
- Both functions write to the same consolidated document record
```

## Implementation Strategy

### Version 2.0 Consolidated Schema
- **Single Table Design**: All data consolidated into `documents_table`
- **No Migration Needed**: Fresh implementation with consolidated approach
- **Simplified Architecture**: Eliminates cross-table relationships
- **Atomic Operations**: Document lifecycle managed in one record

### Future Enhancements
- Add document sharing based on `public` boolean field
- Add document categories/tags
- Add user preferences for analysis types
- Add document templates
- Add collaborative features

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
