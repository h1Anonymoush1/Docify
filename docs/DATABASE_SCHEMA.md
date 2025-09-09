# Database Schema for Docify

## Consolidated Collection

### Documents Collection
Single consolidated table storing all document data, scraped content, and analysis results.

**Collection ID:** `documents_table`

**Attributes:**
- `user_id` (string, required) - Appwrite user ID for isolation
- `title` (string, optional) - User-provided document title
- `url` (string, required) - URL to be scraped and analyzed
- `instructions` (string, required) - User analysis instructions
- `status` (enum: 'pending', 'scraping', 'analyzing', 'completed', 'failed') - Processing state
- `public` (boolean, optional) - Whether document is publicly accessible
- `scraped_content` (string, optional) - Full scraped text content
- `word_count` (integer, optional) - Total words scraped
- `analysis_summary` (string, optional) - LLM-generated summary
- `analysis_blocks` (string, optional) - JSON array of analysis blocks
- `error_message` (string, optional) - Error details if processing failed
- `$createdAt` (datetime, auto) - Creation timestamp
- `$updatedAt` (datetime, auto) - Last update timestamp

**Analysis Blocks Structure:**
```json
[
  {
    "id": "unique-block-id",
    "type": "summary|key_points|architecture|mermaid|code|api_reference|guide|comparison|best_practices|troubleshooting",
    "size": "small|medium|large",
    "title": "Block title",
    "content": "Block content (mermaid syntax for diagrams)",
    "metadata": {
      "language": "javascript|python|etc",
      "priority": "high|medium|low"
    }
  }
]
```

**Permissions:**
- Create: Any authenticated user
- Read: Document owner only (or public if `public` = true)
- Update: Document owner + Server functions
- Delete: Document owner only

## Database Configuration

**Database ID:** `docify_db`

**Database Name:** Docify Database

## Indexes

### Documents Collection Indexes:
- `status_index` - For filtering by processing status
- `user_id_index` - For querying user's documents
- `documents_created_at_index` - For sorting by creation date ($createdAt)
- `documents_updated_at_index` - For sorting by update date ($updatedAt)
- `user_status_index` - For user's documents filtered by status

## Relationships

- **Consolidated Design**: No cross-table relationships required
- **Single Record**: Each document contains all its data and analysis results
- **Atomic Operations**: Document creation, scraping, and analysis all happen within one record

## Security Rules

- Single collection requires authentication
- Users can only access their own documents (`user_id` filter)
- Functions have write permissions for automated processing
- Public documents can be accessed by anyone when `public` = true
- All analysis data is stored within the document record
