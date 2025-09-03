# Database Schema for Docify

## Collections

### 1. Documents Collection
Stores the original document information and user instructions.

**Collection ID:** `documents`

**Attributes:**
- `url` (string, required) - The URL of the document to scrape
- `instructions` (string, required) - User instructions for analysis
- `title` (string, optional) - Document title
- `status` (enum: 'pending', 'scraping', 'analyzing', 'completed', 'failed') - Processing status
- `scraped_content` (string, optional) - Raw scraped content
- `user_id` (string, required) - ID of the user who created the document
- `$createdAt` (datetime, auto) - Creation timestamp (Appwrite automatic field)
- `$updatedAt` (datetime, auto) - Last update timestamp (Appwrite automatic field)

**Permissions:**
- Create: Any authenticated user
- Read: Document owner only
- Update: Document owner only
- Delete: Document owner only

### 2. Analysis Results Collection
Stores the LLM analysis results with chart data.

**Collection ID:** `analysis_results`

**Attributes:**
- `document_id` (string, required) - Reference to the document
- `summary` (string, required) - Summary text from LLM
- `charts` (array of objects, required) - Chart data with the following structure:
  ```json
  [
    {
      "size": "small|medium|large",
      "type": "mermaid",
      "content": "MERMAID_CODE_HERE"
    }
  ]
  ```
- `raw_response` (string, optional) - Raw LLM response for debugging
- `processing_time` (number, optional) - Time taken for analysis in seconds
- `$createdAt` (datetime, auto) - Creation timestamp (Appwrite automatic field)

**Permissions:**
- Create: Server only (functions)
- Read: Document owner only
- Update: Server only
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

### Analysis Results Collection Indexes:
- `document_id_index` - For linking to documents
- `analysis_results_created_at_index` - For sorting results ($createdAt)

## Relationships

- `analysis_results.document_id` → `documents.$id` (one-to-many)

## Security Rules

- All collections require authentication
- Users can only access their own documents and analysis results
- Functions have elevated permissions for creating/updating analysis results
