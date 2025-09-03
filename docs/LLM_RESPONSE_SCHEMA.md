# LLM Response Schema for Document Analysis

## Overview
The LLM can return multiple content blocks to comprehensively explain documentation. Each block has a specific type and size for optimal display.

## Content Block Types

### 1. Summary Block
**Purpose:** High-level overview of the document
**Type:** `summary`
**Content:** Plain text explanation
**Sizes:** `small`, `medium`, `large`

### 2. Chart/Diagram Block
**Purpose:** Visual representation of concepts, flows, or relationships
**Type:** `mermaid`
**Content:** Valid Mermaid syntax
**Sizes:** `small`, `medium`, `large`

### 3. Code Example Block
**Purpose:** Practical code implementations
**Type:** `code`
**Content:** Code with language specification
**Sizes:** `small`, `medium`, `large`
**Additional Fields:**
- `language`: Programming language (javascript, python, etc.)
- `title`: Brief description of the code

### 4. Key Points Block
**Purpose:** Important highlights and takeaways
**Type:** `key_points`
**Content:** Bullet points or numbered list
**Sizes:** `small`, `medium`, `large`

### 5. Architecture Block
**Purpose:** System or component architecture explanation
**Type:** `architecture`
**Content:** Text description with optional diagram
**Sizes:** `small`, `medium`, `large`

### 6. API Reference Block
**Purpose:** API endpoints, methods, and parameters
**Type:** `api_reference`
**Content:** Structured API documentation
**Sizes:** `small`, `medium`, `large`

### 7. Step-by-Step Guide Block
**Purpose:** Procedural instructions or tutorials
**Type:** `guide`
**Content:** Numbered steps with explanations
**Sizes:** `small`, `medium`, `large`

### 8. Comparison Block
**Purpose:** Compare different approaches, tools, or concepts
**Type:** `comparison`
**Content:** Side-by-side or tabular comparison
**Sizes:** `small`, `medium`, `large`

### 9. Best Practices Block
**Purpose:** Recommendations and guidelines
**Type:** `best_practices`
**Content:** List of recommendations
**Sizes:** `small`, `medium`, `large`

### 10. Troubleshooting Block
**Purpose:** Common issues and solutions
**Type:** `troubleshooting`
**Content:** Problem-solution pairs
**Sizes:** `small`, `medium`, `large`

## Response Format

```json
{
  "summary": "Brief overview of the entire document...",
  "blocks": [
    {
      "id": "unique-block-id",
      "type": "summary",
      "size": "medium",
      "title": "Document Overview",
      "content": "Detailed explanation here...",
      "metadata": {
        "language": "javascript", // for code blocks
        "priority": "high" // optional priority level
      }
    },
    {
      "id": "chart-1",
      "type": "mermaid",
      "size": "large",
      "title": "System Architecture",
      "content": "graph TD\\n  A[Client] --> B[API]\\n  B --> C[Database]",
      "metadata": {}
    },
    {
      "id": "code-1",
      "type": "code",
      "size": "medium",
      "title": "Usage Example",
      "content": "const client = new Appwrite.Client();",
      "metadata": {
        "language": "javascript"
      }
    }
  ]
}
```

## Size Guidelines

- **Small (1 unit):** Quick facts, short explanations, simple diagrams
- **Medium (2 units):** Detailed explanations, moderately complex diagrams, multi-step processes
- **Large (3 units):** Complex diagrams, comprehensive guides, detailed code examples

## LLM Prompt Guidelines

The LLM should decide which blocks to include based on:
1. Document type and complexity
2. Key concepts that need visual representation
3. Practical examples that would help understanding
4. Important information that needs emphasis
5. Step-by-step processes in the documentation

## Frontend Display Rules

- Maximum 6 blocks total (1 large + 1 medium + 4 small, or other combinations)
- Blocks are displayed in a responsive grid
- Size determines grid allocation (small=1, medium=2, large=3 columns)
- Order should be logical for document understanding
