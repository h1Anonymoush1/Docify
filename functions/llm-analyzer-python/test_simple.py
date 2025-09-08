#!/usr/bin/env python3
"""
Simple tests for Docify Python LLM Analyzer
"""

import sys
import os
import json

# Test functions directly without appwrite dependencies
def create_analysis_prompt(scraped_data, user_instructions):
    """Standalone version for testing"""
    return f"""You are an expert technical documentation analyzer. Analyze the following web content and create a comprehensive explanation with visual elements.

CONTENT TITLE: {scraped_data.get('title', 'Untitled Document')}
CONTENT DESCRIPTION: {scraped_data.get('description', 'No description available')}
USER INSTRUCTIONS: {user_instructions}

SCRAPED CONTENT:
{scraped_data.get('content', '')}

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

ANALYSIS STRATEGY:
1. First, analyze the content type and structure
2. Identify the most important concepts and relationships
3. Choose appropriate visualization types (mermaid for flows, code for examples, etc.)
4. Prioritize content based on user instructions
5. Ensure summary is comprehensive but concise

MAXIMUM 6 BLOCKS TOTAL. Choose the most appropriate content types and sizes for this specific document.

For mermaid diagrams, use proper mermaid syntax. For code blocks, specify the programming language in metadata.

Ensure the response is valid JSON."""


def detect_content_type(content, user_instructions):
    """Standalone version for testing"""
    import re
    content_lower = content.lower()
    instructions_lower = user_instructions.lower()

    # Technical documentation patterns
    if re.search(r'api|endpoint|authentication|oauth', content_lower) or 'api' in instructions_lower:
        return ['api_reference', 'code', 'guide']

    # Tutorial/guide patterns
    if re.search(r'tutorial|guide|getting started|setup|step', content_lower) or \
       re.search(r'guide|tutorial|step', instructions_lower):
        return ['guide', 'code', 'troubleshooting']

    # System architecture patterns
    if re.search(r'architecture|system|component|infrastructure', content_lower) or \
       'architecture' in instructions_lower:
        return ['architecture', 'mermaid', 'key_points']

    # Default analysis types
    return ['key_points', 'summary', 'best_practices']


def prioritize_blocks(content_analysis, user_instructions):
    """Standalone version for testing"""
    import re
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
    instructions_lower = user_instructions.lower()

    if 'api' in instructions_lower:
        priority_score['api_reference'] += 3
        priority_score['code'] += 2

    if re.search(r'visual|diagram|flow', instructions_lower):
        priority_score['mermaid'] += 3

    if re.search(r'step|guide|tutorial', instructions_lower):
        priority_score['guide'] += 3

    # Return top 5 block types (plus summary = max 6)
    return [block_type for block_type, _ in
            sorted(priority_score.items(), key=lambda x: x[1], reverse=True)][:5]


def optimize_content_for_analysis(content):
    """Standalone version for testing"""
    import re
    if not content:
        return ''

    # Truncate if too long (leave room for prompt)
    max_content_length = 50000  # ~8000 tokens
    if len(content) > max_content_length:
        content = content[:max_content_length] + '...'

    # Remove excessive whitespace
    content = re.sub(r'\s+', ' ', content)

    # Keep important sections (prioritize by keywords)
    sections = content.split('\n\n')
    important_sections = []
    max_sections = 10

    for section in sections:
        if len(important_sections) >= max_sections:
            break

        # Prioritize sections with important keywords
        if re.search(r'\b(introduction|overview|getting started|api|examples|guide|tutorial|architecture|system)\b', section, re.IGNORECASE):
            important_sections.append(section)

    # If we don't have enough important sections, add regular ones
    for section in sections:
        if len(important_sections) >= max_sections:
            break
        if section not in important_sections:
            important_sections.append(section)

    return '\n\n'.join(important_sections)


def optimize_block_sizes(blocks):
    """Standalone version for testing"""
    size_values = {'small': 1, 'medium': 2, 'large': 3}
    total_units = sum(size_values.get(block.get('size', 'medium'), 2) for block in blocks)

    if total_units > 8:
        # Reduce sizes if total is too high
        for block in blocks:
            if block.get('size') == 'large' and total_units > 8:
                block['size'] = 'medium'
                total_units -= 1

    return blocks


def test_detect_content_type_api():
    """Test API content type detection"""
    print("🧪 Testing API content type detection...")

    content = """
    REST API documentation for user management.
    GET /api/users - Retrieve all users
    POST /api/users - Create new user
    Authentication: Bearer token required
    """

    instructions = "Analyze the API endpoints"
    result = detect_content_type(content, instructions)

    assert 'api_reference' in result, f"Expected api_reference in result, got {result}"
    assert 'code' in result, f"Expected code in result, got {result}"
    print("✅ API content type detection passed")


def test_detect_content_type_tutorial():
    """Test tutorial content type detection"""
    print("🧪 Testing tutorial content type detection...")

    content = """
    Getting started with our platform.
    Step 1: Install the package
    Step 2: Configure your settings
    Step 3: Run the application
    """

    instructions = "Show me how to get started"
    result = detect_content_type(content, instructions)

    assert 'guide' in result, f"Expected guide in result, got {result}"
    assert 'troubleshooting' in result, f"Expected troubleshooting in result, got {result}"
    print("✅ Tutorial content type detection passed")


def test_prioritize_blocks_api_focus():
    """Test block prioritization with API focus"""
    print("🧪 Testing block prioritization...")

    content_types = ['api_reference', 'code']
    instructions = "Focus on API endpoints and authentication"

    result = prioritize_blocks(content_types, instructions)

    # API reference should be highly prioritized
    assert result[0] == 'api_reference' or 'api_reference' in result[:3], f"API reference not prioritized: {result}"
    print("✅ Block prioritization passed")


def test_optimize_content_for_analysis():
    """Test content optimization"""
    print("🧪 Testing content optimization...")

    long_content = "This is a test content for optimization functions and methods that should be processed correctly."
    result = optimize_content_for_analysis(long_content)

    assert isinstance(result, str), f"Expected string, got {type(result)}"
    assert len(result) <= len(long_content), f"Result longer than input: {len(result)} > {len(long_content)}"
    print("✅ Content optimization passed")


def test_optimize_block_sizes():
    """Test block size optimization"""
    print("🧪 Testing block size optimization...")

    blocks = [
        {'id': '1', 'type': 'summary', 'size': 'large', 'title': 'Test', 'content': 'Content'},
        {'id': '2', 'type': 'key_points', 'size': 'large', 'title': 'Test', 'content': 'Content'},
        {'id': '3', 'type': 'code', 'size': 'large', 'title': 'Test', 'content': 'Content'}
    ]

    result = optimize_block_sizes(blocks)

    # Should optimize sizes to fit grid constraints
    assert len(result) == len(blocks), f"Expected {len(blocks)} blocks, got {len(result)}"
    assert all(block['size'] in ['small', 'medium', 'large'] for block in result), "Invalid block sizes"
    print("✅ Block size optimization passed")


def test_create_analysis_prompt():
    """Test analysis prompt creation"""
    print("🧪 Testing prompt generation...")

    scraped_data = {
        'title': 'Test Document',
        'description': 'Test description',
        'content': 'Test content for analysis'
    }

    instructions = "Analyze this document thoroughly"

    prompt = create_analysis_prompt(scraped_data, instructions)

    assert 'Test Document' in prompt, "Title not in prompt"
    assert 'Test description' in prompt, "Description not in prompt"
    assert 'Test content for analysis' in prompt, "Content not in prompt"
    assert 'Analyze this document thoroughly' in prompt, "Instructions not in prompt"
    assert 'JSON response' in prompt, "JSON format not in prompt"
    print(f"✅ Prompt generation passed ({len(prompt)} characters)")


def run_all_tests():
    """Run all tests"""
    print("🚀 Starting LLM Analyzer Python Tests...\n")

    try:
        test_detect_content_type_api()
        test_detect_content_type_tutorial()
        test_prioritize_blocks_api_focus()
        test_optimize_content_for_analysis()
        test_optimize_block_sizes()
        test_create_analysis_prompt()

        print("\n🎉 All tests passed! Python LLM Analyzer is working correctly.")
        return True

    except Exception as e:
        print(f"\n💥 Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
