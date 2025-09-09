# Docify API Endpoints Specification

## API Overview
Docify uses Appwrite's API-first architecture with both client-side SDK calls and server-side function invocations. All endpoints require authentication except for authentication endpoints.

## Authentication Endpoints

### POST `/auth/signup`
**Purpose**: Register a new user account

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "User Name"
}
```

**Response**:
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "User Name"
  },
  "session": {
    "token": "jwt_token",
    "expires": 1234567890
  }
}
```

**Error Responses**:
- `400`: Invalid email format or weak password
- `409`: Email already exists
- `500`: Server error

### POST `/auth/login`
**Purpose**: Authenticate existing user

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response**: Same as signup response

**Error Responses**:
- `400`: Invalid credentials
- `401`: Account not verified
- `500`: Server error

### POST `/auth/logout`
**Purpose**: End user session

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Response**:
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

## Document Management Endpoints

### GET `/documents`
**Purpose**: Get user's documents list

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Query Parameters**:
- `status` (optional): Filter by status (`pending`, `scraping`, `analyzing`, `completed`, `failed`)
- `limit` (optional): Number of documents (default: 20, max: 100)
- `offset` (optional): Pagination offset (default: 0)

**Response**:
```json
{
  "success": true,
  "data": {
    "documents": [
      {
        "id": "doc_id",
        "title": "Document Title",
        "url": "https://example.com",
        "instructions": "Analyze the API documentation",
        "status": "completed",
        "word_count": 1250,
        "created_at": "2024-01-01T10:00:00Z",
        "updated_at": "2024-01-01T10:05:00Z"
      }
    ],
    "total": 1,
    "limit": 20,
    "offset": 0
  }
}
```

### POST `/documents`
**Purpose**: Create a new document

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Request Body**:
```json
{
  "title": "My Document",
  "url": "https://example.com/docs/api",
  "instructions": "Focus on the REST API endpoints and authentication methods"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "document": {
      "id": "new_doc_id",
      "title": "My Document",
      "url": "https://example.com/docs/api",
      "instructions": "Focus on the REST API endpoints and authentication methods",
      "status": "pending",
      "created_at": "2024-01-01T10:00:00Z",
      "updated_at": "2024-01-01T10:00:00Z"
    }
  }
}
```

**Error Responses**:
- `400`: Missing required fields or invalid URL
- `401`: Unauthorized
- `500`: Server error

### GET `/documents/{documentId}`
**Purpose**: Get detailed document information including analysis

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Response**:
```json
{
  "success": true,
  "data": {
    "document": {
      "id": "doc_id",
      "title": "Document Title",
      "url": "https://example.com",
      "instructions": "Analyze the API documentation",
      "status": "completed",
      "word_count": 1250,
      "pages_crawled": 3,
      "content_types": {
        "html": 2,
        "pdf": 1
      },
      "subpages": [
        {
          "url": "https://example.com/page1",
          "title": "Page 1",
          "word_count": 500
        }
      ],
      "created_at": "2024-01-01T10:00:00Z",
      "updated_at": "2024-01-01T10:05:00Z"
    },
    "analysis_summary": "This document provides comprehensive API documentation...",
    "analysis_blocks": [
      {
        "id": "summary-block",
        "type": "summary",
        "size": "large",
        "title": "Document Overview",
        "content": "Complete summary content...",
        "metadata": {
          "priority": "high"
        }
      }
    ]
  }
}
```

### PUT `/documents/{documentId}`
**Purpose**: Update document details

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Request Body**:
```json
{
  "title": "Updated Title",
  "instructions": "Updated analysis instructions"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "document": {
      "id": "doc_id",
      "title": "Updated Title",
      "url": "https://example.com",
      "instructions": "Updated analysis instructions",
      "status": "completed",
      "updated_at": "2024-01-01T11:00:00Z"
    }
  }
}
```

### DELETE `/documents/{documentId}`
**Purpose**: Delete a document and its analysis

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Response**:
```json
{
  "success": true,
  "message": "Document deleted successfully"
}
```

### POST `/documents/{documentId}/retry`
**Purpose**: Retry failed document processing

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Response**:
```json
{
  "success": true,
  "message": "Document processing restarted",
  "data": {
    "document": {
      "id": "doc_id",
      "status": "pending",
      "updated_at": "2024-01-01T11:00:00Z"
    }
  }
}
```

## Appwrite Function Endpoints

### POST `/functions/document-scraper-python/executions`
**Purpose**: Manually trigger document scraping (admin/debug use)

**Headers**:
```
Authorization: Bearer <jwt_token>
x-appwrite-key: <dynamic_api_key>
```

**Request Body**:
```json
{
  "documentId": "doc_id",
  "url": "https://example.com"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "documentId": "doc_id",
    "wordCount": 1250,
    "title": "Scraped Title",
    "url": "https://example.com",
    "pagesCrawled": 3,
    "contentTypes": {
      "html": 2,
      "pdf": 1
    },
    "subpages": [
      {
        "url": "https://example.com/page1",
        "title": "Page 1",
        "word_count": 500
      }
    ]
  }
}
```

### POST `/functions/llm-analyzer/executions`
**Purpose**: Manually trigger LLM analysis (admin/debug use)

**Headers**:
```
Authorization: Bearer <jwt_token>
x-appwrite-key: <dynamic_api_key>
```

**Request Body**:
```json
{
  "documentId": "doc_id"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "documentId": "doc_id",
    "summary": "Analysis summary...",
    "blockCount": 5,
    "processingTime": 5000
  }
}
```

## Webhook/Event Endpoints

### Database Event Triggers
These are internal Appwrite triggers, not exposed as REST endpoints:

1. **Document Creation Trigger**
   - Event: `databases.docify_db.collections.documents_table.documents.*.create`
   - Triggers: `document-scraper-python` function
   - Payload: New document data

2. **Document Status Update Trigger**
   - Event: `databases.docify_db.collections.documents_table.documents.*.update`
   - Triggers: `llm-analyzer` function when status changes to 'analyzing'
   - Payload: Document update with status change

## Error Response Format

All endpoints return errors in this standardized format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {
      "field": "specific_field_name",
      "reason": "validation_reason"
    }
  }
}
```

### Common Error Codes
- `VALIDATION_ERROR`: Invalid input data
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `RATE_LIMITED`: Too many requests
- `INTERNAL_ERROR`: Server error

## Rate Limiting

### User Limits
- Document creation: 10 per hour
- Document updates: 50 per hour
- API calls: 1000 per hour

### Function Limits
- Document scraper: 5 concurrent executions
- LLM analyzer: 3 concurrent executions

## Pagination

For list endpoints that support pagination:

```json
{
  "success": true,
  "data": {
    "items": [...],
    "total": 100,
    "limit": 20,
    "offset": 0,
    "hasMore": true,
    "nextOffset": 20
  }
}
```

## Versioning

### API Versioning Strategy
- All endpoints are prefixed with `/v1/`
- Breaking changes require new version
- Non-breaking changes are additive

### Backward Compatibility
- Old endpoints remain functional during transition
- Deprecation warnings in response headers
- Migration guides provided

## Security Headers

All responses include these security headers:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
Strict-Transport-Security: max-age=31536000
```

## CORS Configuration

```
Access-Control-Allow-Origin: https://yourdomain.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-Appwrite-Key
Access-Control-Max-Age: 86400
```

---

*This API specification serves as the contract between frontend and backend. All changes must be documented and versioned appropriately.*
