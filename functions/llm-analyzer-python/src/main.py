#!/usr/bin/env python3
"""
Docify LLM Analyzer - Python Implementation
Analyzes web content using Hugging Face transformers and generates structured analysis blocks.
"""

import os
import json
import time
import re
from typing import Dict, List, Optional, Any, Tuple
from urllib.parse import urlparse

# Appwrite SDK
from appwrite.client import Client
from appwrite.services.databases import Databases
from appwrite.id import ID
from appwrite.query import Query

# Essential libraries
import requests
from bs4 import BeautifulSoup
import chardet

# Environment variables
DATABASE_ID = os.environ.get('DATABASE_ID', 'docify_db')
DOCUMENTS_COLLECTION_ID = os.environ.get('DOCUMENTS_COLLECTION_ID', 'documents_table')
ANALYSIS_COLLECTION_ID = os.environ.get('ANALYSIS_COLLECTION_ID', 'analysis_results')
HUGGINGFACE_ACCESS_TOKEN = os.environ.get('HUGGINGFACE_ACCESS_TOKEN', '')

# Initialize Appwrite client
client = Client()
client.set_endpoint(os.environ.get('APPWRITE_FUNCTION_API_ENDPOINT'))
client.set_project(os.environ.get('APPWRITE_FUNCTION_PROJECT_ID'))
client.set_key(os.environ.get('APPWRITE_API_KEY'))

databases = Databases(client)

# Hugging Face API configuration
HF_API_URL = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2"


def create_analysis_prompt(scraped_data: Dict[str, Any], user_instructions: str) -> str:
    """
    Create enhanced analysis prompt with strategy guidelines
    """
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


def detect_content_type(content: str, user_instructions: str) -> List[str]:
    """
    Analyze content to determine the most appropriate block types
    """
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


def prioritize_blocks(content_analysis: List[str], user_instructions: str) -> List[str]:
    """
    Determine which blocks to generate based on content and user needs
    """
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


def optimize_content_for_analysis(content: str) -> str:
    """
    Prepare content for efficient processing
    """
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
        if re.search(r'\b(introduction|overview|getting started|api|examples|guide|tutorial|architecture|system)\b',
                    section, re.IGNORECASE):
            important_sections.append(section)

    # If we don't have enough important sections, add regular ones
    for section in sections:
        if len(important_sections) >= max_sections:
            break
        if section not in important_sections:
            important_sections.append(section)

    return '\n\n'.join(important_sections)


def optimize_block_sizes(blocks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Ensure blocks don't exceed the grid limit
    Small = 1, Medium = 2, Large = 3
    Maximum total should be around 6-8 units for good layout
    """
    size_values = {'small': 1, 'medium': 2, 'large': 3}
    total_units = sum(size_values.get(block.get('size', 'medium'), 2) for block in blocks)

    if total_units > 8:
        # Reduce sizes if total is too high
        for block in blocks:
            if block.get('size') == 'large' and total_units > 8:
                block['size'] = 'medium'
                total_units -= 1

    return blocks


def call_hugging_face_api(prompt: str, retry_count: int = 0) -> Dict[str, Any]:
    """
    Call Hugging Face API with retry logic
    """
    max_retries = 3
    base_delay = 1  # 1 second

    try:
        print(f"Calling Hugging Face API... (attempt {retry_count + 1}/{max_retries + 1})")

        if not HUGGINGFACE_ACCESS_TOKEN:
            raise ValueError("HUGGINGFACE_ACCESS_TOKEN not configured")

        # Use the Inference API for free tier
        api_url = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2"
        headers = {
            "Authorization": f"Bearer {HUGGINGFACE_ACCESS_TOKEN}",
            "Content-Type": "application/json"
        }

        payload = {
            "inputs": prompt,
            "parameters": {
                "max_new_tokens": 4000,
                "temperature": 0.7,
                "top_p": 0.95,
                "do_sample": True,
                "return_full_text": False
            }
        }

        response = requests.post(api_url, headers=headers, json=payload, timeout=60)

        if response.status_code != 200:
            raise ValueError(f"API request failed with status {response.status_code}: {response.text}")

        result = response.json()

        if isinstance(result, list) and len(result) > 0:
            generated_text = result[0].get('generated_text', '')
        else:
            generated_text = result.get('generated_text', '')

        print("Hugging Face response received")

        # Try to extract JSON from the response
        json_match = re.search(r'\{[\s\S]*\}', generated_text)
        if not json_match:
            raise ValueError('No JSON found in LLM response')

        json_string = json_match.group(0)

        try:
            parsed_response = json.loads(json_string)
        except json.JSONDecodeError as parse_error:
            print(f"JSON parsing error: {parse_error}")
            raise ValueError(f"Invalid JSON in LLM response: {parse_error}")

        # Validate the response structure
        if not parsed_response.get('summary') or not isinstance(parsed_response.get('blocks'), list):
            raise ValueError('Invalid response structure: missing summary or blocks array')

        # Validate and clean blocks
        valid_block_types = [
            'summary', 'key_points', 'architecture', 'mermaid', 'code',
            'api_reference', 'guide', 'comparison', 'best_practices', 'troubleshooting'
        ]

        valid_sizes = ['small', 'medium', 'large']

        parsed_response['blocks'] = [
            block for block in parsed_response['blocks']
            if block.get('id') and block.get('type') and block.get('size') and
               block.get('title') and block.get('content') and
               block['type'] in valid_block_types and
               block['size'] in valid_sizes
        ][:6]  # Limit to 6 blocks maximum

        # Add default metadata
        for block in parsed_response['blocks']:
            if 'metadata' not in block:
                block['metadata'] = {}

        # Ensure we have at least a summary block
        if not parsed_response['blocks']:
            parsed_response['blocks'] = [{
                'id': 'fallback-summary',
                'type': 'summary',
                'size': 'large',
                'title': 'Document Summary',
                'content': parsed_response.get('summary', 'Analysis could not be generated in the expected format.'),
                'metadata': {'priority': 'high'}
            }]

        return parsed_response

    except Exception as error:
        print(f"Hugging Face API error (attempt {retry_count + 1}): {error}")

        # Check if this is a retryable error
        error_str = str(error).lower()
        is_retryable = any(keyword in error_str for keyword in
                          ['rate limit', 'timeout', 'network', 'server error', '429', '500', '502', '503', '504'])

        if is_retryable and retry_count < max_retries:
            delay = base_delay * (2 ** retry_count)  # Exponential backoff
            print(f"Retrying in {delay}s...")
            time.sleep(delay)
            return call_hugging_face_api(prompt, retry_count + 1)

        raise ValueError(f"Failed to generate analysis: {error}")


def update_document_status(document_id: str, status: str) -> None:
    """
    Update document status in database
    """
    try:
        databases.update_document(
            DATABASE_ID,
            DOCUMENTS_COLLECTION_ID,
            document_id,
            {
                'status': status,
                'updated_at': time.time()
            }
        )
        print(f"Document {document_id} status updated to {status}")
    except Exception as error:
        print(f"Failed to update document status: {error}")
        raise error


def save_analysis_result(analysis_id: str, document_id: str, analysis_data: Dict[str, Any],
                        raw_response: str, processing_time: float) -> None:
    """
    Save analysis result to database
    """
    try:
        databases.update_document(
            DATABASE_ID,
            ANALYSIS_COLLECTION_ID,
            analysis_id,
            {
                'document_id': document_id,
                'summary': analysis_data['summary'],
                'charts': analysis_data['blocks'],  # blocks array stored as 'charts' in database
                'raw_response': raw_response,
                'processing_time': processing_time,
                'status': 'completed'
            }
        )
        print(f"Analysis result saved for document {document_id}")
    except Exception as error:
        print(f"Failed to save analysis result: {error}")
        raise error


def get_document_and_analysis(document_id: str) -> Tuple[Dict[str, Any], str, Dict[str, Any]]:
    """
    Get document and analysis data
    """
    try:
        # Get the document (scraped content is stored here)
        document = databases.get_document(
            DATABASE_ID,
            DOCUMENTS_COLLECTION_ID,
            document_id
        )

        # Get the pending analysis record
        analysis_records = databases.list_documents(
            DATABASE_ID,
            ANALYSIS_COLLECTION_ID,
            [
                Query.equal('document_id', document_id),
                Query.equal('status', 'pending'),
                Query.order_desc('$createdAt'),
                Query.limit(1)
            ]
        )

        if len(analysis_records['documents']) == 0:
            raise ValueError('No pending analysis record found')

        # Prepare scraped data from document record
        scraped_data = {
            'title': document.get('title', 'Untitled Document'),
            'description': document.get('description', ''),
            'content': document.get('scraped_content', ''),
            'url': document.get('url', ''),
            'word_count': document.get('word_count', 0)
        }

        return document, analysis_records['documents'][0]['$id'], scraped_data

    except Exception as error:
        print(f"Failed to get document and analysis: {error}")
        raise error


def main(context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Main function handler for Appwrite
    """
    start_time = time.time()

    try:
        print('LLM analyzer function started')

        # Validate request body - Appwrite Context uses attributes, not dict access
        if not hasattr(context, 'req') or not context.req or not hasattr(context.req, 'body') or not context.req.body:
            return {
                'success': False,
                'error': 'Missing request body',
                'statusCode': 400
            }

        # Access documentId from request body
        document_id = None
        if hasattr(context.req.body, 'get'):
            document_id = context.req.body.get('documentId')
        elif isinstance(context.req.body, dict):
            document_id = context.req.body.get('documentId')
        else:
            # Handle string JSON body
            import json
            try:
                body_data = json.loads(context.req.body)
                document_id = body_data.get('documentId')
            except:
                pass

        if not document_id:
            return {
                'success': False,
                'error': 'Missing required field: documentId',
                'statusCode': 400
            }
        log = getattr(context, 'log', print)
        error = getattr(context, 'error', print)

        log(f'Processing analysis for document: {document_id}')

        # Get document and analysis data
        document, analysis_id, scraped_data = get_document_and_analysis(document_id)

        if not scraped_data or not scraped_data.get('content'):
            raise ValueError('No scraped content available for analysis')

        # Optimize content for analysis
        scraped_data['content'] = optimize_content_for_analysis(scraped_data['content'])
        log(f"Optimized content length: {len(scraped_data['content'])} characters")

        # Create analysis prompt
        prompt = create_analysis_prompt(scraped_data, document.get('instructions', 'Analyze this documentation comprehensively'))

        # Call Hugging Face API with retry logic
        analysis_result = call_hugging_face_api(prompt)

        # Validate and optimize block sizes
        analysis_result['blocks'] = optimize_block_sizes(analysis_result['blocks'])

        # Log analysis results
        log(f"Generated {len(analysis_result['blocks'])} analysis blocks")
        block_types = [block['type'] for block in analysis_result['blocks']]
        log(f"Block types: {', '.join(block_types)}")

        processing_time = time.time() - start_time

        # Save analysis result
        save_analysis_result(
            analysis_id,
            document_id,
            analysis_result,
            json.dumps(analysis_result),
            processing_time
        )

        # Update document status to completed
        update_document_status(document_id, 'completed')

        log(f"Analysis completed for document {document_id} in {processing_time:.2f}s")

        return {
            'success': True,
            'message': 'Document analysis completed successfully',
            'data': {
                'documentId': document_id,
                'analysisId': analysis_id,
                'summary': analysis_result['summary'],
                'blockCount': len(analysis_result['blocks']),
                'processingTime': processing_time
            },
            'statusCode': 200
        }

    except Exception as err:
        processing_time = time.time() - start_time

        # Safely extract document_id from context
        document_id = None
        try:
            if hasattr(context, 'req') and context.req and hasattr(context.req, 'body') and context.req.body:
                if hasattr(context.req.body, 'get'):
                    document_id = context.req.body.get('documentId')
                elif isinstance(context.req.body, dict):
                    document_id = context.req.body.get('documentId')
                else:
                    import json
                    body_data = json.loads(context.req.body)
                    document_id = body_data.get('documentId')
        except:
            pass

        error = getattr(context, 'error', print)

        error(f"LLM analyzer error: {err}")

        # Categorize the error for better user messaging
        user_message = 'Analysis failed. Please try again.'
        is_retryable = True
        suggested_action = 'retry'

        error_str = str(err).lower()
        if 'rate limit' in error_str or 'quota' in error_str:
            user_message = 'Analysis service is busy. Please try again in a few minutes.'
            is_retryable = True
            suggested_action = 'retry_later'
        elif 'timeout' in error_str or 'network' in error_str:
            user_message = 'Connection issue occurred. The analysis may still complete.'
            is_retryable = True
            suggested_action = 'check_later'
        elif 'No scraped content' in error_str:
            user_message = 'Document content is not available. Please check the URL and try scraping again.'
            is_retryable = False
            suggested_action = 'rescrape'
        elif 'JSON' in error_str or 'Invalid response' in error_str:
            user_message = 'Analysis format issue. We\'ll retry with a different approach.'
            is_retryable = True
            suggested_action = 'retry'

        # Try to update document status to failed
        if document_id:
            try:
                update_document_status(document_id, 'failed')
            except Exception as update_error:
                error(f"Failed to update document status: {update_error}")

        return {
            'success': False,
            'error': {
                'code': 'ANALYSIS_FAILED',
                'message': user_message,
                'details': {
                    'originalError': str(err),
                    'isRetryable': is_retryable,
                    'suggestedAction': suggested_action,
                    'documentId': document_id,
                    'processingTime': processing_time
                }
            },
            'statusCode': 500
        }


# For local testing
if __name__ == "__main__":
    # Test data
    test_context = {
        'req': {
            'body': {
                'documentId': 'test-doc-123'
            }
        },
        'log': print,
        'error': print
    }

    result = main(test_context)
    print("Test result:", json.dumps(result, indent=2))
