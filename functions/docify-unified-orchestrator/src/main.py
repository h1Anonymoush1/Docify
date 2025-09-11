#!/usr/bin/env python3
"""
Docify Unified Orchestrator - Simplified Safe Approach
Preserves raw content, generates AI titles, maintains compatibility
"""

import os
import json
import time
import requests
import chardet
import re
from typing import Dict, Any, Optional, List
from urllib.parse import urlparse
from appwrite.client import Client
from appwrite.services.databases import Databases
from appwrite.id import ID
from google import genai

# ===== ENVIRONMENT VARIABLES =====
DATABASE_ID = os.environ.get('DATABASE_ID', 'docify_db')
DOCUMENTS_COLLECTION_ID = os.environ.get('DOCUMENTS_COLLECTION_ID', 'documents_table')
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')
BROWSERLESS_API_KEY = os.environ.get('BROWSERLESS_API_KEY', '')

# Initialize Appwrite client
client = Client()
client.set_endpoint(os.environ.get('APPWRITE_FUNCTION_API_ENDPOINT'))
client.set_project(os.environ.get('APPWRITE_FUNCTION_PROJECT_ID'))
client.set_key(os.environ.get('APPWRITE_API_KEY'))
databases = Databases(client)

# Gemini configuration
GEMINI_MODEL = "gemini-2.5-pro"


# ===== STEP 1: EXTRACT DOCUMENT DATA =====
def extract_document_data(context: Dict[str, Any]) -> Dict[str, Any]:
    """Extract document data from the trigger context"""
    print("📋 Step 1: Extracting document data...")

    if not hasattr(context, 'req') or not context.req:
        raise ValueError("Missing request context")

    req_body = context.req.body if hasattr(context.req, 'body') else None

    # Handle different body formats
    if isinstance(req_body, dict):
        document_id = req_body.get('$id') or req_body.get('documentId')
        url = req_body.get('url')
        instructions = req_body.get('instructions')
    elif isinstance(req_body, str):
        try:
            body_data = json.loads(req_body)
            document_id = body_data.get('$id') or body_data.get('documentId')
            url = body_data.get('url')
            instructions = body_data.get('instructions')
        except:
            raise ValueError("Invalid request body format")
    else:
        raise ValueError("Missing or invalid request body")

    if not document_id:
        raise ValueError("Missing document ID")
    if not url:
        raise ValueError("Missing URL")
    if not instructions:
        raise ValueError("Missing instructions")

    print(f"✅ Document ID: {document_id}")
    print(f"✅ URL: {url}")
    print(f"✅ Instructions: {instructions[:100]}...")

    return {
        'document_id': document_id,
        'url': url,
        'instructions': instructions
    }


# ===== STEP 2: VALIDATE ENVIRONMENT =====
def validate_environment() -> None:
    """Validate that all required environment variables are set"""
    print("📝 Step 2: Validating environment...")

    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY environment variable is required")

    print("✅ Environment validation passed")


# ===== STEP 3: RAW BROWSERLESS SCRAPING =====
def scrape_raw_content(url: str) -> str:
    """Scrape raw content using browserless approach (no cleaning/modification)"""
    print("🌐 Step 3: Scraping raw content with browserless...")

    # Multiple fetch strategies (from document-scraper-python)
    fetch_strategies = [
        {
            'name': 'modern-browser',
            'headers': {
                'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Cache-Control': 'max-age=0'
            }
        },
        {
            'name': 'mobile',
            'headers': {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br'
            }
        }
    ]

    html_content = None

    # Try basic strategies first
    for strategy in fetch_strategies:
        try:
            print(f"   Trying {strategy['name']} strategy...")
            response = requests.get(url, headers=strategy['headers'], timeout=15)

            if response.status_code == 200:
                html_content = response.text
                print(f"   ✅ Basic fetch successful: {len(html_content)} characters")
                break
            else:
                print(f"   ❌ {strategy['name']} failed with status: {response.status_code}")
        except Exception as e:
            print(f"   ❌ {strategy['name']} failed: {e}")

    # Try browserless if content is small or no content fetched
    if not html_content or len(html_content) < 10000:
        print("   Content seems small, trying browserless...")

        if BROWSERLESS_API_KEY:
            try:
                print("   Trying Browserless.io...")
                browserless_url = f"https://production-sfo.browserless.io/content?token={BROWSERLESS_API_KEY}"
                response = requests.post(browserless_url, json={
                    'url': url,
                    'gotoOptions': {
                        'waitUntil': 'networkidle2',
                        'timeout': 30000
                    }
                }, timeout=30)

                if response.status_code == 200:
                    rendered_html = response.text
                    if len(rendered_html) > len(html_content or ''):
                        html_content = rendered_html
                        print(f"   ✅ Browserless successful: {len(html_content)} characters")
                    else:
                        print(f"   ⚠️ Browserless returned same/smaller content")
                else:
                    print(f"   ❌ Browserless failed: {response.status_code}")
    except Exception as e:
                print(f"   ❌ Browserless error: {e}")
        else:
            print("   ⚠️ No BROWSERLESS_API_KEY provided")

                if not html_content:
        raise ValueError("Failed to scrape content from URL")

    print(f"✅ Raw content scraped: {len(html_content)} characters")
    return html_content


# ===== STEP 4: SAVE RAW CONTENT =====
def save_raw_content(document_id: str, raw_content: str) -> None:
    """Save raw scraped content to database (no modification)"""
    print("💾 Step 4: Saving raw content to database...")

    update_data = {
        'status': 'analyzing',
        'scraped_content': raw_content
    }

    databases.update_document(
        DATABASE_ID,
        DOCUMENTS_COLLECTION_ID,
        document_id,
        update_data
    )

    print("✅ Raw content saved successfully")


# ===== STEP 5: GENERATE AI TITLE =====
def generate_ai_title(url: str, raw_content: str, instructions: str) -> str:
    """Generate a 2-4 word AI title using Gemini"""
    print("🏷️ Step 5: Generating AI title...")

    # Extract some context from the raw content for better title generation
    # Take first 2000 chars to avoid token limits
    content_preview = raw_content[:2000] if raw_content else ""

    title_prompt = f"""Based on this URL and content preview, generate a concise title (2-4 words only):

URL: {url}
Instructions: {instructions}
Content Preview: {content_preview[:1000]}...

Generate a title with exactly 2-4 words that captures the essence of this content."""

    try:
        gemini_client = genai.Client(api_key=GEMINI_API_KEY)

            response = gemini_client.models.generate_content(
                model=GEMINI_MODEL,
            contents=title_prompt,
            config=genai.types.GenerateContentConfig(
                temperature=0.7,
                max_output_tokens=50,
                candidate_count=1
            )
        )

        if response.candidates and response.candidates[0].content:
            title = response.candidates[0].content.parts[0].text.strip()

            # Clean up the title (remove quotes, extra spaces, etc.)
            title = re.sub(r'^["\']|["\']$', '', title)  # Remove surrounding quotes
            title = re.sub(r'\s+', ' ', title).strip()  # Normalize spaces

            # Ensure it's 2-4 words
            words = title.split()
            if len(words) < 2:
                title = f"{words[0]} Overview" if words else "Document Overview"
            elif len(words) > 4:
                title = ' '.join(words[:4])

            # Capitalize properly
            title = ' '.join(word.capitalize() for word in title.split())

            print(f"✅ AI-generated title: '{title}'")
            return title
        else:
            print("⚠️ No title generated, using fallback")
            return "Document Overview"

    except Exception as e:
        print(f"⚠️ Title generation failed: {e}, using fallback")
        return "Document Overview"


# ===== STEP 6: GENERATE ANALYSIS =====
def generate_analysis(url: str, raw_content: str, instructions: str, ai_title: str) -> Dict[str, Any]:
    """Generate analysis using Gemini with exact same format as llm-analyzer-python"""
    print("📈 Step 6: Generating analysis with Gemini...")

    # Use exact same prompt format as llm-analyzer-python
    analysis_prompt = f"""You are an expert technical documentation analyzer. Analyze the following web content and create a comprehensive explanation with visual elements.

CONTENT TITLE: {ai_title}
CONTENT DESCRIPTION: {instructions}
USER INSTRUCTIONS: {instructions}

SCRAPED CONTENT:
{raw_content[:50000]}  # Limit content to avoid token limits

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

Ensure the response is valid JSON."""

    try:
        gemini_client = genai.Client(api_key=GEMINI_API_KEY)

            response = gemini_client.models.generate_content(
                model=GEMINI_MODEL,
            contents=analysis_prompt,
            config=genai.types.GenerateContentConfig(
                temperature=0.7,
                max_output_tokens=4000,
                candidate_count=1
            )
        )

        if response.candidates and response.candidates[0].content:
            generated_text = response.candidates[0].content.parts[0].text

            # Extract JSON from response
            json_match = re.search(r'\{[\s\S]*\}', generated_text)
            if json_match:
                json_string = json_match.group(0)
                parsed_response = json.loads(json_string)

                # Validate the response structure
                if not parsed_response.get('summary'):
                    raise ValueError('Invalid response: missing summary')

                if not isinstance(parsed_response.get('blocks'), list):
                    raise ValueError('Invalid response: blocks must be an array')

                print("✅ Analysis generated successfully")
                print(f"   Summary: {len(parsed_response['summary'])} chars")
                print(f"   Blocks: {len(parsed_response['blocks'])}")

                return parsed_response
                else:
                raise ValueError('No JSON found in response')
            else:
            raise ValueError('No response from Gemini')

        except Exception as e:
        print(f"❌ Analysis generation failed: {e}")
        raise


# ===== STEP 7: CREATE COMPATIBLE BLOCKS =====
def create_compatible_blocks(analysis_result: Dict[str, Any]) -> str:
    """Create analysis blocks in exact same JSON format as llm-analyzer-python"""
    print("🧩 Step 7: Creating compatible blocks...")

    # The analysis_result is already in the correct format from generate_analysis
    # Just validate and ensure it matches the expected structure

    blocks = analysis_result.get('blocks', [])

    # Validate and clean blocks
    valid_block_types = [
        'summary', 'key_points', 'architecture', 'mermaid', 'code',
        'api_reference', 'guide', 'comparison', 'best_practices', 'troubleshooting'
    ]

    valid_sizes = ['small', 'medium', 'large']

    cleaned_blocks = []
    for i, block in enumerate(blocks[:6]):  # Maximum 6 blocks
        if (block.get('id') and block.get('type') and block.get('size') and
            block.get('title') and block.get('content') and
            block['type'] in valid_block_types and
            block['size'] in valid_sizes):

            # Ensure metadata exists
            if 'metadata' not in block:
                block['metadata'] = {}

            cleaned_blocks.append(block)
            print(f"   Block {i+1}: {block['type']} ({block['size']}) - {block['title'][:30]}...")

    # Convert to JSON string (exactly like llm-analyzer-python)
    blocks_json = json.dumps(cleaned_blocks)

    print(f"✅ Compatible blocks created: {len(cleaned_blocks)} blocks")
    return blocks_json


# ===== STEP 8: FINAL SAVE AND COMPLETE =====
def final_save_and_complete(document_id: str, ai_title: str, analysis_result: Dict[str, Any], blocks_json: str) -> None:
    """Save all final results and mark as completed"""
    print("✅ Step 8: Final save and complete...")

    # Create readable summary (up to 200 chars)
    full_summary = analysis_result.get('summary', '')
    readable_summary = full_summary[:200]  # Truncate to 200 chars
    if len(full_summary) > 200:
        readable_summary = readable_summary.rstrip() + '...'

    # Simple tools tracking
    tools_used = json.dumps(["gemini_analysis"])

    # Research context (for now, just a portion of the summary)
    research_context = full_summary[:5000] if full_summary else ""

            update_data = {
                'status': 'completed',
        'title': ai_title,
        'analysis_summary': readable_summary,
        'analysis_blocks': blocks_json,
        'gemini_tools_used': tools_used,
        'research_context': research_context
    }

    databases.update_document(
                DATABASE_ID,
                DOCUMENTS_COLLECTION_ID,
                document_id,
                update_data
            )

    print("✅ Final save completed successfully")
    print(f"   Title: '{ai_title}'")
    print(f"   Summary: {len(readable_summary)} chars")
    print(f"   Blocks: {len(json.loads(blocks_json))} blocks")


# ===== MAIN FUNCTION =====
def main(context: Dict[str, Any]) -> Dict[str, Any]:
    """Main Appwrite function entry point"""
    start_time = time.time()

    try:
        print("=== DOCIFY UNIFIED ORCHESTRATOR STARTED ===")

        # Step 1: Extract document data
        document_data = extract_document_data(context)

        # Step 2: Validate environment
        validate_environment()

        # Step 3: Raw browserless scraping
        raw_content = scrape_raw_content(document_data['url'])

        # Step 4: Save raw content
        save_raw_content(document_data['document_id'], raw_content)

        # Step 5: Generate AI title
        ai_title = generate_ai_title(
            document_data['url'],
            raw_content,
            document_data['instructions']
        )

        # Step 6: Generate analysis
        analysis_result = generate_analysis(
            document_data['url'],
            raw_content,
            document_data['instructions'],
            ai_title
        )

        # Step 7: Create compatible blocks
        blocks_json = create_compatible_blocks(analysis_result)

        # Step 8: Final save and complete
        final_save_and_complete(
            document_data['document_id'],
            ai_title,
            analysis_result,
            blocks_json
        )

        processing_time = time.time() - start_time
        print(f"⏱️ Total processing time: {processing_time:.2f}s")
        print("🎉 === DOCIFY UNIFIED ORCHESTRATOR COMPLETED ===")

            return {
            'success': True,
            'message': 'Document processed successfully',
            'data': {
                'document_id': document_data['document_id'],
                'title': ai_title,
                'processing_time': round(processing_time, 2)
            }
        }

        except Exception as e:
        processing_time = time.time() - start_time
        print(f"❌ Processing failed in {processing_time:.2f}s: {e}")

        # Try to update document status to failed
        try:
            if 'document_data' in locals() and document_data.get('document_id'):
                databases.update_document(
                    DATABASE_ID,
                    DOCUMENTS_COLLECTION_ID,
                    document_data['document_id'],
                    {'status': 'failed'}
                )
        except:
                pass

            return {
            'success': False,
            'error': str(e),
            'processing_time': round(processing_time, 2)
        }


# ===== LEGACY COMPATIBILITY =====
def process_document_legacy(context: Dict[str, Any]) -> Dict[str, Any]:
    """Legacy function for backward compatibility"""
    return main(context)


# Export for Appwrite
if __name__ == "__main__":
    print("🚀 Docify Unified Orchestrator v3.0 loaded successfully")
    print("✨ Features: Raw content preservation, AI titles, compatible blocks")
    print("🔒 Safe approach: No content cleaning/modification")
    print("🤖 AI-powered: 2-4 word titles, readable summaries")
    print("🔗 Compatible: Same JSON format as existing analyzer")
    print("This function should be called through Appwrite")
