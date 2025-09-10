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
from google import genai

# Environment variables
DATABASE_ID = os.environ.get('DATABASE_ID', 'docify_db')
DOCUMENTS_COLLECTION_ID = os.environ.get('DOCUMENTS_COLLECTION_ID', 'documents_table')
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')

# Initialize Appwrite client
client = Client()
client.set_endpoint(os.environ.get('APPWRITE_FUNCTION_API_ENDPOINT'))
client.set_project(os.environ.get('APPWRITE_FUNCTION_PROJECT_ID'))
client.set_key(os.environ.get('APPWRITE_API_KEY'))

databases = Databases(client)

# Google Gemini API configuration
GEMINI_MODEL = "gemini-2.5-flash"  # Latest Gemini model with thinking capabilities


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


def call_gemini_api(prompt: str, retry_count: int = 0) -> Dict[str, Any]:
    """
    Call Google Gemini API with retry logic and comprehensive logging
    """
    max_retries = 3
    base_delay = 1  # 1 second

    try:
        print(f"🤖 API CALL ATTEMPT {retry_count + 1}/{max_retries + 1}")
        print(f"   Prompt length: {len(prompt)} characters")
        print(f"   Model: {GEMINI_MODEL}")
        print("   Using Google Gemini 2.5 Flash")

        if not GEMINI_API_KEY:
            print("❌ FAIL: GEMINI_API_KEY not configured")
            raise ValueError("GEMINI_API_KEY not configured")

        print("✓ API key validated")

        # Initialize Gemini client
        print("🔧 Initializing Gemini client...")
        client = genai.Client()

        print("📤 Sending request to Gemini API...")
        print(f"   Model: {GEMINI_MODEL}")
        print(f"   Timeout: 60s")
        print(f"   Max tokens: 4000 (Gemini default)")

        start_api_call = time.time()

        # Configure generation parameters
        generation_config = genai.types.GenerateContentConfig(
            temperature=0.7,
            top_p=0.95,
            max_output_tokens=4000,
            candidate_count=1,
            thinking_config=genai.types.ThinkingConfig(thinking_budget=0),  # Disable thinking for faster responses
        )

        print("⚙️ Generation config:")
        print(f"   Temperature: {generation_config.temperature}")
        print(f"   Top P: {generation_config.top_p}")
        print(f"   Max tokens: {generation_config.max_output_tokens}")

        # Generate content
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
            config=generation_config
        )

        api_call_time = time.time() - start_api_call
        print(f"📥 Response received in {api_call_time:.2f}s")

        # Extract the response text
        if not response.candidates or not response.candidates[0].content:
            print("❌ FAIL: No candidates in response")
            raise ValueError('Empty response from Gemini API')

        generated_text = response.candidates[0].content.parts[0].text

        # Handle case where text might be None
        if not generated_text:
            print("❌ FAIL: Empty text in response")
            raise ValueError('Empty text in Gemini API response')

        print(f"✓ Generated text length: {len(generated_text)} characters")

        print("✓ Generated text extracted")
        print(f"   Preview: {generated_text[:200]}...")

        # Try to extract JSON from the response
        print("🧩 Extracting JSON from response...")
        json_match = re.search(r'\{[\s\S]*\}', generated_text)
        if not json_match:
            print("❌ FAIL: No JSON pattern found in response")
            print(f"   Full response: {generated_text[:1000]}...")
            raise ValueError('No JSON found in Gemini response')

        json_string = json_match.group(0)
        print(f"✓ JSON extracted: {len(json_string)} characters")

        try:
            print("📋 Parsing JSON...")
            parsed_response = json.loads(json_string)
            print("✓ JSON parsing successful")
        except json.JSONDecodeError as parse_error:
            print(f"❌ FAIL: JSON parsing error: {parse_error}")
            print(f"   JSON string: {json_string[:500]}...")
            raise ValueError(f"Invalid JSON in Gemini response: {parse_error}")

        # Validate the response structure
        print("🔎 Validating response structure...")
        if not parsed_response.get('summary'):
            print("❌ FAIL: Missing summary in response")
            raise ValueError('Invalid response structure: missing summary')

        if not isinstance(parsed_response.get('blocks'), list):
            print("❌ FAIL: Invalid blocks format")
            raise ValueError('Invalid response structure: blocks must be an array')

        print("✓ Response structure validated")
        print(f"   Summary length: {len(parsed_response.get('summary', ''))} characters")
        print(f"   Raw blocks count: {len(parsed_response.get('blocks', []))}")

        # Validate and clean blocks
        print("🧹 Validating and cleaning blocks...")
        valid_block_types = [
            'summary', 'key_points', 'architecture', 'mermaid', 'code',
            'api_reference', 'guide', 'comparison', 'best_practices', 'troubleshooting'
        ]

        valid_sizes = ['small', 'medium', 'large']

        original_blocks_count = len(parsed_response['blocks'])
        parsed_response['blocks'] = [
            block for block in parsed_response['blocks']
            if block.get('id') and block.get('type') and block.get('size') and
               block.get('title') and block.get('content') and
               block['type'] in valid_block_types and
               block['size'] in valid_sizes
        ][:6]  # Limit to 6 blocks maximum

        filtered_blocks_count = len(parsed_response['blocks'])
        print(f"✓ Block validation completed")
        print(f"   Original blocks: {original_blocks_count}")
        print(f"   Valid blocks: {filtered_blocks_count}")
        print(f"   Filtered out: {original_blocks_count - filtered_blocks_count}")

        # Add default metadata
        for i, block in enumerate(parsed_response['blocks']):
            if 'metadata' not in block:
                block['metadata'] = {}
            print(f"   Block {i+1}: {block.get('type', 'unknown')} ({block.get('size', 'unknown')})")

        # Ensure we have at least a summary block
        if not parsed_response['blocks']:
            print("⚠️ No valid blocks found, creating fallback summary")
            parsed_response['blocks'] = [{
                'id': 'fallback-summary',
                'type': 'summary',
                'size': 'large',
                'title': 'Document Summary',
                'content': parsed_response.get('summary', 'Analysis could not be generated in the expected format.'),
                'metadata': {'priority': 'high'}
            }]

        total_processing_time = time.time() - start_api_call
        print(f"✅ API CALL COMPLETED SUCCESSFULLY")
        print(f"   Total time: {total_processing_time:.2f}s")
        print(f"   Final blocks: {len(parsed_response['blocks'])}")

        return parsed_response

    except Exception as error:
        print(f"❌ API CALL ERROR (attempt {retry_count + 1}): {error}")

        # Check if this is a retryable error
        error_str = str(error).lower()
        print(f"   Analyzing error for retry: '{error_str}'")

        is_retryable = any(keyword in error_str for keyword in
                          ['rate limit', 'timeout', 'network', 'server error', '429', '500', '502', '503', '504',
                           'resource exhausted', 'quota exceeded', 'temporarily unavailable', 'unavailable',
                           'connection', 'dns', 'ssl'])

        print(f"   Is retryable: {is_retryable}")

        if is_retryable and retry_count < max_retries:
            delay = base_delay * (2 ** retry_count)  # Exponential backoff
            print(f"⏳ RETRYING in {delay}s... (attempt {retry_count + 2}/{max_retries + 1})")
            time.sleep(delay)
            return call_gemini_api(prompt, retry_count + 1)

        print("❌ MAX RETRIES EXCEEDED or NON-RETRYABLE ERROR")
        raise ValueError(f"Failed to generate analysis: {error}")


def update_document_status(document_id: str, status: str) -> None:
    """
    Update document status in database with detailed logging
    """
    try:
        print(f"📝 Updating document status...")
        print(f"   Document ID: {document_id}")
        print(f"   New status: {status}")

        update_data = {
            'status': status,
            'updated_at': time.time()
        }

        print("   Sending update request...")
        databases.update_document(
            DATABASE_ID,
            DOCUMENTS_COLLECTION_ID,
            document_id,
            update_data
        )

        print(f"✓ Document status updated to {status}")
        print(f"   Database: {DATABASE_ID}")
        print(f"   Collection: {DOCUMENTS_COLLECTION_ID}")

    except Exception as error:
        print(f"❌ STATUS UPDATE ERROR: {error}")
        print(f"   Document ID: {document_id}")
        print(f"   Target status: {status}")
        raise error


def save_analysis_result(analysis_id: str, document_id: str, analysis_data: Dict[str, Any],
                        raw_response: str, processing_time: float) -> None:
    """
    Save analysis result to database with detailed logging
    """
    import json  # Ensure json is available in this function scope

    try:
        print("💾 Saving analysis results to database...")
        print(f"   Analysis ID: {analysis_id}")
        print(f"   Document ID: {document_id}")
        print(f"   Processing time: {processing_time:.2f}s")
        print(f"   Summary length: {len(analysis_data.get('summary', ''))} characters")
        print(f"   Blocks count: {len(analysis_data.get('blocks', []))}")
        print(f"   Raw response length: {len(raw_response)} characters")

        # Prepare update data for consolidated schema
        update_data = {
            'status': 'completed',  # Mark as completed
            'analysis_summary': analysis_data['summary'],
            'analysis_blocks': json.dumps(analysis_data['blocks']),  # Convert blocks array to JSON string
            'error_message': None  # Clear any previous errors
        }

        print("   Updating document with analysis results...")
        databases.update_document(
            DATABASE_ID,
            DOCUMENTS_COLLECTION_ID,
            analysis_id,  # analysis_id is the same as document_id in consolidated schema
            update_data
        )

        print("✓ Analysis results saved successfully")
        print(f"   Database: {DATABASE_ID}")
        print(f"   Collection: {DOCUMENTS_COLLECTION_ID}")
        print(f"   Document updated: {analysis_id}")

    except Exception as error:
        print(f"❌ DATABASE SAVE ERROR: {error}")
        print(f"   Analysis ID: {analysis_id}")
        print(f"   Document ID: {document_id}")
        raise error


def get_document_and_analysis(document_id: str) -> Tuple[Dict[str, Any], str, Dict[str, Any]]:
    """
    Get document and analysis data with detailed logging
    """
    try:
        print("🔍 Retrieving document data...")
        print(f"   Document ID: {document_id}")

        # Get the document (scraped content is stored here)
        print("   Fetching document record...")
        document = databases.get_document(
            DATABASE_ID,
            DOCUMENTS_COLLECTION_ID,
            document_id
        )
        print("✓ Document retrieved successfully")
        print(f"   Title: {document.get('title', 'N/A')}")
        print(f"   URL: {document.get('url', 'N/A')}")
        print(f"   Status: {document.get('status', 'N/A')}")
        print(f"   Word count: {document.get('word_count', 'N/A')}")
        print(f"   Content length: {len(document.get('scraped_content', ''))} characters")

        # Check if document has been scraped (consolidated schema)
        if not document.get('scraped_content'):
            print("❌ FAIL: Document has not been scraped yet")
            raise ValueError('Document has not been scraped yet')

        # Use document ID as analysis ID (consolidated schema)
        analysis_id = document_id
        print("✓ Using consolidated document for analysis")
        print(f"   Analysis ID: {analysis_id}")

        # Prepare scraped data from document record
        print("   Preparing scraped data...")
        scraped_data = {
            'title': document.get('title', 'Untitled Document'),
            'description': '',  # Not used in consolidated schema
            'content': document.get('scraped_content', ''),
            'url': document.get('url', ''),
            'word_count': document.get('word_count', 0)
        }

        print("✓ Scraped data prepared")
        print(f"   Content preview: {scraped_data['content'][:100]}..." if scraped_data['content'] else "   No content")

        return document, analysis_id, scraped_data

    except Exception as error:
        print(f"❌ DATABASE QUERY ERROR: {error}")
        print(f"   Document ID: {document_id}")
        raise error


def main(context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Main function handler for Appwrite with comprehensive logging
    """
    import json  # Ensure json is available in this function scope

    start_time = time.time()
    log = getattr(context, 'log', print)
    error = getattr(context, 'error', print)

    log("=== LLM ANALYZER FUNCTION STARTED ===")
    log(f"Timestamp: {time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(start_time))}")
    log("Environment check:")
    log(f"  - Database ID: {DATABASE_ID}")
    log(f"  - Documents Collection: {DOCUMENTS_COLLECTION_ID}")
    log(f"  - Gemini API Key: {'✓ Configured' if GEMINI_API_KEY else '✗ Missing'}")

    # Check trigger type and filter events
    trigger_type = getattr(context.req.headers, 'get', lambda x: None)('x-appwrite-trigger')
    log(f"Trigger type: {trigger_type}")

    if trigger_type == 'event':
        collection_id = getattr(context.req.headers, 'get', lambda x: None)('x-appwrite-collection')
        event_type = getattr(context.req.headers, 'get', lambda x: None)('x-appwrite-event')
        log(f"Event collection: {collection_id}")
        log(f"Event type: {event_type}")

        # Extract collection name from event string if collection header is empty
        if not collection_id and event_type and 'collections.' in event_type:
            # Parse collection from event: databases.db.collections.collection_name.documents.doc_id.create
            try:
                parts = event_type.split('.')
                if len(parts) >= 4 and parts[2] == 'collections':
                    collection_id = parts[3]  # collection_name
                    log(f'Extracted collection from event: {collection_id}')
            except Exception as e:
                log(f'Could not extract collection from event: {e}')

        # Only process document UPDATE events from documents_table
        if collection_id != DOCUMENTS_COLLECTION_ID:
            log(f"❌ SKIP: Event from {collection_id}, not from documents collection")
            return {
                'success': True,
                'message': 'Skipped: Not a document event',
                'statusCode': 200
            }

        # With tables.*.rows.*.create trigger, check if this is actually an UPDATE operation
        # We need to check the event payload to determine if it's a create or update
        is_update_operation = False

        if hasattr(context.req, 'body') and context.req.body:
            if isinstance(context.req.body, dict):
                # For updates, we typically see status changes or other field updates
                # Check if this has status field (indicating an update operation)
                if 'status' in context.req.body:
                    is_update_operation = True
                    log('Detected UPDATE operation based on request body (has status field)')
                else:
                    log('Request body missing status field - likely a creation event')

            elif isinstance(context.req.body, str):
                import json
                try:
                    body_data = json.loads(context.req.body)
                    if 'status' in body_data:
                        is_update_operation = True
                        log('Detected UPDATE operation from JSON body (has status field)')
                    else:
                        log('JSON body missing status field - likely a creation event')
                except:
                    log("⚠️ Could not parse JSON body for operation type")

        if not is_update_operation:
            log("❌ SKIP: Not a document update operation")
            return {
                'success': True,
                'message': 'Skipped: Not a document update event',
                'statusCode': 200
            }

        # Check if status changed to 'analyzing'
        if hasattr(context.req, 'body') and context.req.body:
            if isinstance(context.req.body, dict):
                new_status = context.req.body.get('status')
                log(f"Document status in update: {new_status}")

                if new_status != 'analyzing':
                    log(f"❌ SKIP: Status is {new_status}, not 'analyzing'")
                    return {
                        'success': True,
                        'message': 'Skipped: Document status is not analyzing',
                        'statusCode': 200
                    }
            elif isinstance(context.req.body, str):
                import json
                try:
                    body_data = json.loads(context.req.body)
                    new_status = body_data.get('status')
                    log(f"Document status in update (JSON): {new_status}")

                    if new_status != 'analyzing':
                        log(f"❌ SKIP: Status is {new_status}, not 'analyzing'")
                        return {
                            'success': True,
                            'message': 'Skipped: Document status is not analyzing',
                            'statusCode': 200
                        }
                except:
                    log("⚠️ Could not parse status from JSON body")

    try:
        log("\n--- STEP 1: REQUEST VALIDATION ---")
        log("Validating incoming request...")

        # Validate request body - Appwrite Context uses attributes, not dict access
        if not hasattr(context, 'req') or not context.req:
            log("❌ FAIL: Context missing 'req' attribute")
            return {
                'success': False,
                'error': 'Invalid context: missing req attribute',
                'statusCode': 400
            }

        log("✓ Context has 'req' attribute")

        if not hasattr(context.req, 'body') or not context.req.body:
            log("❌ FAIL: Request missing body")
            return {
                'success': False,
                'error': 'Missing request body',
                'statusCode': 400
            }

        log("✓ Request has body")

        # Access documentId from request body
        log("Extracting documentId from request body...")

        # Log body type for debugging
        log(f"Request body type: {type(context.req.body)}")
        if isinstance(context.req.body, str):
            log(f"Body content preview: {context.req.body[:100]}...")
        elif isinstance(context.req.body, dict):
            log(f"Body keys: {list(context.req.body.keys()) if context.req.body else 'Empty dict'}")
            if context.req.body:
                for key, value in context.req.body.items():
                    if key == 'documentId' or key == 'document_id' or key == '$id':
                        log(f"  {key}: {value}")
                    elif isinstance(value, str) and len(value) > 50:
                        log(f"  {key}: {value[:50]}...")
                    else:
                        log(f"  {key}: {value}")
        else:
            log(f"Body content: {str(context.req.body)[:100]}...")

        document_id = None

        if isinstance(context.req.body, dict):
            # Try multiple possible field names for documentId
            document_id = (context.req.body.get('documentId') or
                          context.req.body.get('document_id') or
                          context.req.body.get('$id'))

            if document_id:
                log(f"✓ Found documentId in dict: {document_id}")
            else:
                log("❌ FAIL: No documentId field found in dict")
                # Check if this is an event trigger with the created document
                if 'document_id' in context.req.body:
                    document_id = context.req.body['document_id']
                    log(f"✓ Found document_id (event trigger): {document_id}")

        elif isinstance(context.req.body, str):
            # Handle string JSON body
            import json
            try:
                log("Parsing JSON string body...")
                body_data = json.loads(context.req.body)
                document_id = (body_data.get('documentId') or
                              body_data.get('document_id') or
                              body_data.get('$id'))
                log(f"✓ JSON parsed, documentId: {document_id}")
            except Exception as json_error:
                log(f"❌ FAIL: JSON parsing error: {json_error}")
        else:
            # Try generic get method (fallback)
            try:
                document_id = context.req.body.get('documentId')
                log(f"✓ Generic get method, documentId: {document_id}")
            except:
                log("❌ FAIL: Cannot extract documentId from body")

        if not document_id:
            log("❌ FAIL: Missing required field: documentId")
            return {
                'success': False,
                'error': 'Missing required field: documentId',
                'statusCode': 400
            }

        log(f"✓ Document ID validated: {document_id}")
        log(f"✓ Request validation completed in {(time.time() - start_time):.3f}s")

        log("\n--- STEP 2: DATABASE QUERY ---")
        log(f"Retrieving document and analysis data for: {document_id}")

        try:
            document, analysis_id, scraped_data = get_document_and_analysis(document_id)
            log("✓ Document retrieved successfully")
            log(f"  - Title: {scraped_data.get('title', 'N/A')}")
            log(f"  - URL: {scraped_data.get('url', 'N/A')}")
            log(f"  - Analysis ID: {analysis_id}")
            log(f"  - Original content length: {len(scraped_data.get('content', ''))} characters")

            # Check if document is imported - skip analysis if true
            log("Checking if document is imported...")
            if document.get('imported') == True:
                log(f"Document {document_id} is imported - skipping analysis")
                return {
                    'success': True,
                    'message': 'Skipped: Document is imported',
                    'data': {
                        'documentId': document_id,
                        'analysisId': analysis_id
                    },
                    'statusCode': 200
                }
            log("Document is not imported - proceeding with analysis")

        except Exception as db_error:
            log(f"❌ FAIL: Database query error: {db_error}")
            raise ValueError(f"Failed to retrieve document data: {db_error}")

        log(f"✓ Database query completed in {(time.time() - start_time):.3f}s")

        log("\n--- STEP 3: CONTENT VALIDATION ---")
        if not scraped_data or not scraped_data.get('content'):
            log("❌ FAIL: No scraped content available for analysis")
            raise ValueError('No scraped content available for analysis')

        content_length = len(scraped_data['content'])
        log(f"✓ Content validation passed: {content_length} characters")

        log("\n--- STEP 4: CONTENT OPTIMIZATION ---")
        log("Optimizing content for LLM processing...")
        original_length = len(scraped_data['content'])

        scraped_data['content'] = optimize_content_for_analysis(scraped_data['content'])
        optimized_length = len(scraped_data['content'])

        log(f"✓ Content optimization completed")
        log(f"  - Original: {original_length} characters")
        log(f"  - Optimized: {optimized_length} characters")
        log(f"  - Reduction: {original_length - optimized_length} characters ({((original_length - optimized_length) / original_length * 100):.1f}%)")

        log("\n--- STEP 5: PROMPT GENERATION ---")
        user_instructions = document.get('instructions', 'Analyze this documentation comprehensively')
        log(f"User instructions: {user_instructions}")

        prompt = create_analysis_prompt(scraped_data, user_instructions)
        prompt_length = len(prompt)
        log(f"✓ Analysis prompt created: {prompt_length} characters")
        log(f"✓ Prompt generation completed in {(time.time() - start_time):.3f}s")

        log("\n--- STEP 6: LLM API CALL ---")
        log("Initiating Gemini API call...")

        analysis_result = call_gemini_api(prompt)

        log("✓ LLM API call completed successfully")
        log(f"  - Summary length: {len(analysis_result.get('summary', ''))} characters")
        log(f"  - Blocks generated: {len(analysis_result.get('blocks', []))}")

        log("\n--- STEP 7: RESPONSE VALIDATION ---")
        log("Validating LLM response structure...")

        if not analysis_result.get('summary'):
            log("❌ FAIL: Missing summary in LLM response")
            raise ValueError('Invalid LLM response: missing summary')

        if not isinstance(analysis_result.get('blocks'), list):
            log("❌ FAIL: Invalid blocks format in LLM response")
            raise ValueError('Invalid LLM response: blocks must be an array')

        log("✓ Response structure validation passed")

        log("\n--- STEP 8: BLOCK OPTIMIZATION ---")
        log("Optimizing block sizes for grid layout...")

        original_block_count = len(analysis_result['blocks'])
        analysis_result['blocks'] = optimize_block_sizes(analysis_result['blocks'])

        # Calculate total grid units
        size_values = {'small': 1, 'medium': 2, 'large': 3}
        total_units = sum(size_values.get(block.get('size', 'medium'), 2) for block in analysis_result['blocks'])

        log("✓ Block optimization completed")
        log(f"  - Blocks: {len(analysis_result['blocks'])}")
        log(f"  - Total grid units: {total_units}")

        # Log detailed block information
        for i, block in enumerate(analysis_result['blocks'], 1):
            log(f"  Block {i}: {block.get('type', 'unknown')} ({block.get('size', 'medium')}) - {block.get('title', 'No title')}")

        processing_time = time.time() - start_time
        log(f"✓ Analysis processing completed in {processing_time:.2f}s")

        log("\n--- STEP 9: DATABASE SAVE ---")
        log("Saving analysis results to database...")

        try:
            save_analysis_result(
                analysis_id,
                document_id,
                analysis_result,
                json.dumps(analysis_result),
                processing_time
            )
            log("✓ Analysis results saved successfully")
        except Exception as save_error:
            log(f"❌ FAIL: Failed to save analysis results: {save_error}")
            raise ValueError(f"Database save failed: {save_error}")

        log("\n--- STEP 10: STATUS UPDATE ---")
        log("Analysis completed successfully - no status update needed")

        log("✓ Analysis process completed")

        log("\n=== ANALYSIS COMPLETED SUCCESSFULLY ===")
        log(f"Document: {document_id}")
        log(f"Analysis: {analysis_id}")
        log(f"Processing Time: {processing_time:.2f}s")
        log(f"Blocks Generated: {len(analysis_result['blocks'])}")
        log("=" * 50)

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
        error = getattr(context, 'error', print)

        log("\n!!! ERROR OCCURRED DURING ANALYSIS !!!")
        log(f"Error timestamp: {time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(time.time()))}")
        log(f"Processing time before error: {processing_time:.2f}s")
        log(f"Error type: {type(err).__name__}")
        log(f"Error message: {str(err)}")

        # Safely extract document_id from context
        log("Extracting document_id for error handling...")
        document_id = None
        try:
            if hasattr(context, 'req') and context.req and hasattr(context.req, 'body') and context.req.body:
                if hasattr(context.req.body, 'get'):
                    document_id = context.req.body.get('documentId')
                    log(f"✓ Document ID extracted from body.get(): {document_id}")
                elif isinstance(context.req.body, dict):
                    document_id = context.req.body.get('documentId')
                    log(f"✓ Document ID extracted from dict: {document_id}")
                else:
                    import json
                    body_data = json.loads(context.req.body)
                    document_id = body_data.get('documentId')
                    log(f"✓ Document ID extracted from JSON string: {document_id}")
            else:
                log("❌ Could not extract document_id from context")
        except Exception as extract_error:
            log(f"❌ Error extracting document_id: {extract_error}")

        error(f"LLM analyzer error for document {document_id or 'unknown'}: {err}")

        log("\n--- ERROR CATEGORIZATION ---")
        # Categorize the error for better user messaging
        user_message = 'Analysis failed. Please try again.'
        is_retryable = True
        suggested_action = 'retry'

        error_str = str(err).lower()
        log(f"Analyzing error string: '{error_str}'")

        if 'rate limit' in error_str or 'quota' in error_str:
            log("✓ Error category: Rate limit/Quota exceeded")
            user_message = 'Analysis service is busy. Please try again in a few minutes.'
            is_retryable = True
            suggested_action = 'retry_later'
        elif 'timeout' in error_str or 'network' in error_str:
            log("✓ Error category: Network/Timeout issue")
            user_message = 'Connection issue occurred. The analysis may still complete.'
            is_retryable = True
            suggested_action = 'check_later'
        elif 'no scraped content' in error_str:
            log("✓ Error category: Missing content")
            user_message = 'Document content is not available. Please check the URL and try scraping again.'
            is_retryable = False
            suggested_action = 'rescrape'
        elif 'json' in error_str or 'invalid response' in error_str:
            log("✓ Error category: Response format issue")
            user_message = 'Analysis format issue. We\'ll retry with a different approach.'
            is_retryable = True
            suggested_action = 'retry'
        elif 'document with the requested id could not be found' in error_str:
            log("✓ Error category: Document not found")
            user_message = 'Document not found. Please check the document ID and try again.'
            is_retryable = False
            suggested_action = 'check_document'
        else:
            log("✓ Error category: General/Unknown")

        log(f"User message: {user_message}")
        log(f"Is retryable: {is_retryable}")
        log(f"Suggested action: {suggested_action}")

        # Try to update document status to failed
        if document_id:
            log(f"\n--- STATUS UPDATE ATTEMPT ---")
            log(f"Attempting to update document {document_id} status to 'failed'")
            try:
                update_document_status(document_id, 'failed')
                log("✓ Document status updated to 'failed'")
            except Exception as update_error:
                log(f"❌ Failed to update document status: {update_error}")
                error(f"Failed to update document status for {document_id}: {update_error}")
        else:
            log("⚠️ Skipping status update: no document_id available")

        log("\n=== ERROR HANDLING COMPLETED ===")
        log(f"Final processing time: {processing_time:.2f}s")
        log("=" * 50)

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
                    'processingTime': processing_time,
                    'errorType': type(err).__name__
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
