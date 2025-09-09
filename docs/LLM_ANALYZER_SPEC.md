# Docify LLM Analyzer Specification

## Overview
The LLM Analyzer is a critical component that processes scraped web content and generates structured visual analysis blocks. It uses Hugging Face's free inference API to create comprehensive document analyses with multiple visualization types.

## Core Functionality

### Input Processing
**Input Source**: Database trigger from documents_table status update
**Trigger Condition**: Document status changes to 'analyzing'
**Input Data**:
- Document title and description
- Scraped content (full text)
- User instructions/prompt
- Document metadata (URL, word count, etc.)

### Output Generation
**Output Format**: JSON with structured analysis blocks
**Output Destination**: Same documents_table record (consolidated schema)
**Processing Trigger**: Automatic (database event on status change)

## AI Model Configuration

### Hugging Face Setup
**Model**: `mistralai/Mistral-7B-Instruct-v0.2`
**API**: Hugging Face Inference API (free tier)
**Authentication**: Environment variable `HUGGINGFACE_ACCESS_TOKEN`

### Model Parameters
```python
{
    "max_new_tokens": 4000,
    "temperature": 0.7,
    "top_p": 0.95,
    "do_sample": True,
    "return_full_text": False
}
```

### Future Enhancement
- User API key support for premium models
- Model selection based on content type
- Fine-tuned models for specific domains

## Analysis Block Types

### 1. Summary Block
**Type**: `summary`
**Purpose**: Overall document overview
**Content**: Concise summary (200-300 words)
**Size Priority**: Usually `large` or `medium`
**Position**: Always first block

### 2. Key Points Block
**Type**: `key_points`
**Purpose**: Important highlights and takeaways
**Content**: Bullet-point list of key information
**Size Priority**: `medium` or `small`
**Best For**: Technical specs, feature lists, requirements

### 3. Architecture Block
**Type**: `architecture`
**Purpose**: System/component structure explanation
**Content**: Text description of architecture
**Size Priority**: `medium` or `large`
**Best For**: System documentation, API architectures

### 4. Mermaid Diagram Block
**Type**: `mermaid`
**Purpose**: Visual diagrams and flowcharts
**Content**: Valid Mermaid.js syntax
**Size Priority**: `large` (needs space for diagrams)
**Supported Diagrams**:
- Flowcharts (`graph`)
- Sequence diagrams (`sequenceDiagram`)
- Gantt charts (`gantt`)
- Class diagrams (`classDiagram`)
- State diagrams (`stateDiagram`)

### 5. Code Block
**Type**: `code`
**Purpose**: Code examples and snippets
**Content**: Actual code with syntax highlighting
**Size Priority**: `medium` or `small`
**Metadata**: Programming language specification
**Supported Languages**:
- JavaScript, TypeScript
- Python
- Java, C++, C#
- Go, Rust
- PHP, Ruby
- SQL, Bash
- JSON, YAML, XML

### 6. API Reference Block
**Type**: `api_reference`
**Purpose**: API documentation structure
**Content**: Endpoint descriptions, parameters, examples
**Size Priority**: `large`
**Best For**: API documentation sites

### 7. Guide Block
**Type**: `guide`
**Purpose**: Step-by-step instructions
**Content**: Numbered/ordered instructions
**Size Priority**: `medium` or `large`
**Best For**: Tutorials, setup guides, workflows

### 8. Comparison Block
**Type**: `comparison`
**Purpose**: Compare different approaches/options
**Content**: Side-by-side or tabular comparisons
**Size Priority**: `large`
**Best For**: Feature comparisons, pros/cons analysis

### 9. Best Practices Block
**Type**: `best_practices`
**Purpose**: Recommendations and guidelines
**Content**: Do's and don'ts, tips, recommendations
**Size Priority**: `medium`
**Best For**: Development guidelines, security practices

### 10. Troubleshooting Block
**Type**: `troubleshooting`
**Purpose**: Common issues and solutions
**Content**: Problem-solution pairs
**Size Priority**: `medium` or `small`
**Best For**: Error documentation, FAQ sections

## System Prompt Engineering

### Base System Prompt
```python
SYSTEM_PROMPT = """
You are an expert technical documentation analyzer. Analyze the following web content and create a comprehensive explanation with visual elements.

CONTENT TITLE: {title}
CONTENT DESCRIPTION: {description}
USER INSTRUCTIONS: {instructions}

SCRAPED CONTENT:
{content}

TASK: Create a structured analysis with summary and visual elements to explain this documentation. Return a JSON response with the following structure:

{{
  "summary": "A comprehensive summary of the document content",
  "blocks": [
    {{
      "id": "unique-id-1",
      "type": "summary|key_points|architecture|mermaid|code|api_reference|guide|comparison|best_practices|troubleshooting",
      "size": "small|medium|large",
      "title": "Block title",
      "content": "Block content (mermaid syntax for mermaid type)",
      "metadata": {{
        "language": "javascript|python|etc (for code blocks)",
        "priority": "high|medium|low"
      }}
    }}
  ]
}}

CONTENT BLOCK TYPES:
- summary: Overview explanation
- key_points: Important highlights
- architecture: System/component structure
- mermaid: Visual diagrams using mermaid syntax
- code: Code examples with language specification
- api_reference: API documentation
- guide: Step-by-step instructions
- comparison: Compare different approaches
- best_practices: Recommendations
- troubleshooting: Common issues and solutions

SIZE GUIDELINES:
- small: Quick facts, simple explanations (1 grid unit)
- medium: Detailed explanations, moderate diagrams (2 grid units)
- large: Complex diagrams, comprehensive guides (3 grid units)

MAXIMUM 6 BLOCKS TOTAL. Choose the most appropriate content types and sizes for this specific document.

For mermaid diagrams, use proper mermaid syntax. For code blocks, specify the programming language in metadata.

Ensure the response is valid JSON.
"""
```

### Content Analysis Strategy

#### 1. Content Type Detection
```python
def detect_content_type(content, url, title):
    """Analyze content to determine the most appropriate block types"""

    # Technical documentation patterns
    if any(keyword in content.lower() for keyword in ['api', 'endpoint', 'authentication', 'oauth']):
        return ['api_reference', 'code', 'guide']

    # Tutorial/guide patterns
    if any(keyword in content.lower() for keyword in ['tutorial', 'guide', 'getting started', 'setup']):
        return ['guide', 'code', 'troubleshooting']

    # System architecture patterns
    if any(keyword in content.lower() for keyword in ['architecture', 'system', 'component', 'infrastructure']):
        return ['architecture', 'mermaid', 'key_points']

    # Default analysis types
    return ['key_points', 'summary', 'best_practices']
```

#### 2. Block Prioritization Algorithm
```python
def prioritize_blocks(content_analysis, user_instructions):
    """Determine which blocks to generate based on content and user needs"""

    priority_score = {
        'summary': 10,  # Always include summary
        'key_points': 8,
        'architecture': 6,
        'mermaid': 7,
        'code': 5,
        'api_reference': 9,  # High if API content detected
        'guide': 7,
        'comparison': 4,
        'best_practices': 6,
        'troubleshooting': 5
    }

    # Adjust scores based on user instructions
    if 'api' in user_instructions.lower():
        priority_score['api_reference'] += 3
        priority_score['code'] += 2

    if 'visual' in user_instructions.lower():
        priority_score['mermaid'] += 3

    if 'step' in user_instructions.lower():
        priority_score['guide'] += 3

    # Return top 5 block types (plus summary = max 6)
    return sorted(priority_score.items(), key=lambda x: x[1], reverse=True)[:5]
```

#### 3. Size Optimization
```python
def optimize_block_sizes(selected_blocks, content_length):
    """Assign optimal sizes based on content complexity and available space"""

    size_assignments = {
        'summary': 'large',  # Summary always large
        'architecture': 'large' if content_length > 2000 else 'medium',
        'mermaid': 'large',  # Diagrams need space
        'api_reference': 'large',
        'guide': 'large' if len(selected_blocks) <= 3 else 'medium',
        'code': 'medium',
        'key_points': 'medium',
        'best_practices': 'medium',
        'comparison': 'large',
        'troubleshooting': 'medium'
    }

    # Calculate total grid units
    size_values = {'small': 1, 'medium': 2, 'large': 3}
    total_units = sum(size_values[size_assignments.get(block, 'medium')] for block in selected_blocks)

    # Adjust if over limit
    if total_units > 8:
        # Reduce large blocks to medium
        for block in selected_blocks:
            if size_assignments[block] == 'large' and total_units > 8:
                size_assignments[block] = 'medium'
                total_units -= 1

    return size_assignments
```

## Error Handling

### LLM API Errors
1. **Rate Limiting**: Retry with exponential backoff
2. **Invalid Response**: Fallback to simplified analysis
3. **Model Timeout**: Reduce token limit and retry
4. **Authentication Error**: Log and notify admin

### Content Processing Errors
1. **Empty Content**: Return minimal summary block
2. **Invalid JSON**: Parse and extract valid parts
3. **Block Validation**: Filter invalid blocks, add defaults

### Database Errors
1. **Connection Issues**: Retry with circuit breaker
2. **Permission Errors**: Log and update status to failed
3. **Data Corruption**: Validate before saving

## Performance Optimization

### Processing Limits
- **Max Input Tokens**: 8000 (Hugging Face limit)
- **Max Output Tokens**: 4000
- **Processing Timeout**: 120 seconds
- **Retry Attempts**: 3 times with backoff

### Content Optimization
```python
def optimize_content(content):
    """Prepare content for efficient processing"""

    # Truncate if too long
    if len(content) > 50000:  # ~8000 tokens
        content = content[:50000] + "..."

    # Remove excessive whitespace
    content = re.sub(r'\s+', ' ', content)

    # Keep important sections
    sections = content.split('\n\n')
    important_sections = []

    for section in sections:
        # Prioritize sections with keywords
        if any(keyword in section.lower() for keyword in
               ['introduction', 'overview', 'getting started', 'api', 'examples']):
            important_sections.append(section)

    return '\n\n'.join(important_sections[:10])  # Top 10 important sections
```

### Caching Strategy
- **Block Templates**: Cache common block structures
- **Processed Content**: Cache analysis results for similar content
- **Model Responses**: Cache successful analyses for identical inputs

## Testing and Validation

### Unit Tests
- Prompt generation validation
- Block structure validation
- Size optimization testing
- Error handling verification

### Integration Tests
- Full pipeline testing (scraper → analyzer)
- Database integration testing
- API response validation

### Content Quality Tests
- Analysis accuracy validation
- Block relevance assessment
- Mermaid syntax validation
- Code syntax highlighting verification

## Monitoring and Metrics

### Performance Metrics
- Average processing time per document
- Success rate by content type
- Block generation distribution
- Error rate by category

### Quality Metrics
- User satisfaction scores (future)
- Block usage analytics
- Content type detection accuracy
- Analysis completeness scores

### System Health
- API rate limit monitoring
- Memory usage tracking
- Function execution success rates
- Queue depth monitoring

## Future Enhancements

### Advanced Features
1. **Multi-modal Analysis**: Support for images, PDFs with diagrams
2. **Custom Block Types**: User-defined analysis templates
3. **Collaborative Analysis**: Multiple users contributing to analysis
4. **Analysis History**: Version control for analyses

### Model Improvements
1. **Fine-tuning**: Domain-specific model training
2. **Ensemble Models**: Multiple models for different content types
3. **Context Preservation**: Better handling of long documents
4. **Interactive Analysis**: Real-time analysis refinement

### Performance Enhancements
1. **Streaming Responses**: Progressive block generation
2. **Batch Processing**: Multiple documents simultaneously
3. **Edge Caching**: CDN-level result caching
4. **Model Optimization**: Quantized models for faster inference

---

*This specification defines the core AI functionality. All changes to the analysis algorithm should be validated through comprehensive testing.*
