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
from bs4 import BeautifulSoup
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
GEMINI_MODEL = "gemini-2.5-flash"  # Using Flash for better availability and speed


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
        user_id = req_body.get('userId') or req_body.get('user_id')
    elif isinstance(req_body, str):
        try:
            body_data = json.loads(req_body)
            document_id = body_data.get('$id') or body_data.get('documentId')
            url = body_data.get('url')
            instructions = body_data.get('instructions')
            user_id = body_data.get('userId') or body_data.get('user_id')
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
    print(f"✅ User ID: {user_id}")

    return {
        'document_id': document_id,
        'url': url,
        'instructions': instructions,
        'user_id': user_id
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
    """Generate a 2-4 word AI title using Gemini with retry logic and HTML title fallback"""
    print("🏷️ Step 5: Generating AI title...")

    # Extract some context from the raw content for better title generation
    # Take first 2000 chars to avoid token limits
    content_preview = raw_content[:2000] if raw_content else ""

    title_prompt = f"""Based on this URL and content preview, generate a concise title (2-4 words only):

URL: {url}
Instructions: {instructions}
Content Preview: {content_preview[:1000]}...

Generate a title with exactly 2-4 words that captures the essence of this content."""

    # Retry logic for Gemini API overload
    max_retries = 3
    for attempt in range(max_retries):
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
                print(f"⚠️ No title generated (attempt {attempt + 1}/{max_retries}), using HTML fallback")
                return extract_title_from_html(raw_content, url)

        except Exception as e:
            error_msg = str(e)
            if "503" in error_msg or "UNAVAILABLE" in error_msg or "overloaded" in error_msg.lower():
                if attempt < max_retries - 1:
                    wait_time = (attempt + 1) * 5  # Exponential backoff: 5s, 10s, 15s
                    print(f"⚠️ Gemini overloaded (attempt {attempt + 1}/{max_retries}), waiting {wait_time}s...")
                    time.sleep(wait_time)
                    continue
                else:
                    print(f"❌ Gemini still overloaded after {max_retries} attempts, using HTML fallback")
                    return extract_title_from_html(raw_content, url)
            else:
                print(f"⚠️ Title generation failed: {e}, using HTML fallback")
                return extract_title_from_html(raw_content, url)


def extract_title_from_html(raw_content: str, url: str) -> str:
    """Extract title from HTML content as fallback, similar to document-scraper-python"""
    print("🔍 Extracting title from HTML content...")

    try:
        if not raw_content:
            return extract_title_from_url_fallback(url)

        # Parse HTML with BeautifulSoup
        soup = BeautifulSoup(raw_content, 'lxml')

        # Try various title selectors (similar to document-scraper-python)
        title_selectors = [
            'title',
            'h1',
            'h1 a',
            '[property="og:title"]',
            'meta[name="title"]',
            '[property="twitter:title"]',
            'h2',
            '.page-title',
            '.entry-title',
            '.post-title'
        ]

        for selector in title_selectors:
            try:
                if selector == 'title':
                    element = soup.title
                    if element and element.string:
                        title = element.string.strip()
                        if title and len(title) > 3:  # Minimum length check
                            print(f"✅ HTML title extracted: '{title[:50]}...'")
                            return clean_title(title)
                elif selector.startswith('h1') or selector.startswith('h2'):
                    element = soup.select_one(selector)
                    if element:
                        title = element.get_text().strip()
                        if title and len(title) > 3:
                            print(f"✅ Heading title extracted: '{title[:50]}...'")
                            return clean_title(title)
                else:
                    element = soup.select_one(selector)
                    if element:
                        if 'property' in selector or 'name' in selector:
                            title = element.get('content', '').strip()
                        else:
                            title = element.get_text().strip()

                        if title and len(title) > 3:
                            print(f"✅ Meta title extracted: '{title[:50]}...'")
                            return clean_title(title)
            except:
                continue

        # Try to extract from URL structure
        return extract_title_from_url_fallback(url)

    except Exception as e:
        print(f"⚠️ HTML title extraction failed: {e}")
        return extract_title_from_url_fallback(url)


def extract_title_from_url_fallback(url: str) -> str:
    """Extract title from URL path as final fallback"""
    try:
        path = urlparse(url).path
        filename = path.split('/')[-1]

        if '.' in filename:
            filename = filename.split('.')[0]

        # Clean up the filename
        title = filename.replace('-', ' ').replace('_', ' ').strip()

        if title:
            # Capitalize properly
            title = ' '.join(word.capitalize() for word in title.split() if word)
            if len(title.split()) <= 4:  # Ensure reasonable length
                print(f"✅ URL-based title: '{title}'")
                return title
    except:
        pass

    return "Document Overview"


def clean_title(title: str) -> str:
    """Clean and format the extracted title"""
    if not title:
        return "Document Overview"

    # Remove extra whitespace
    title = re.sub(r'\s+', ' ', title).strip()

    # Remove common prefixes/suffixes
    title = re.sub(r'^(Page|Document|Article|Post|Blog):\s*', '', title, flags=re.IGNORECASE)
    title = re.sub(r'\s*-\s*(Apple|Google|Microsoft|Amazon|Facebook|Twitter|GitHub|Stack Overflow|MDN)$', '', title, flags=re.IGNORECASE)

    # Limit length
    if len(title) > 80:
        title = title[:77] + "..."

    # Ensure it's not empty after cleaning
    if not title or len(title) < 3:
        return "Document Overview"

    # Capitalize properly
    words = title.split()
    if len(words) <= 6:  # Only capitalize if reasonable length
        title = ' '.join(word.capitalize() for word in words)

    return title


# ===== STEP 6: GENERATE ANALYSIS =====
def generate_analysis(url: str, raw_content: str, instructions: str, ai_title: str) -> Dict[str, Any]:
    """Generate analysis using Gemini with exact same format as llm-analyzer-python and retry logic"""
    print("📈 Step 6: Generating analysis with Gemini...")

    # Use exact same prompt format as llm-analyzer-python
    analysis_prompt = f"""You are an expert technical documentation analyzer. Analyze the following web content and create a comprehensive explanation with visual elements.

CONTENT TITLE: {ai_title}
CONTENT DESCRIPTION: {instructions}
USER INSTRUCTIONS: {instructions}

SCRAPED CONTENT:
{raw_content[:50000]}  # Limit content to avoid token limits

TASK: Create a structured analysis with summary and visual elements to explain this documentation. Focus specifically on the user's instructions and provide a detailed, comprehensive summary that directly addresses their request.

For key_points blocks, use this exact format:
**Key Point Title** ***Detailed explanation of the key point***

Each key point should have a clear title in **bold** and the explanation in ***italics***.

Return a JSON response with the following structure:

{{
  "summary": "A comprehensive, detailed summary (300-2000 words) that directly addresses the user's instructions and explains the key aspects of this documentation. Include specific details, examples, and insights relevant to the user's request.",
  "blocks": [
    {{
      "id": "unique-id-1",
      "type": "summary|key_points|architecture|mermaid|code|api_reference|guide|comparison|best_practices|troubleshooting",
      "size": "small|medium|large",
      "title": "Block title",
      "content": "Block content (mermaid syntax for mermaid type)",
      "metadata": {{
        "language": "javascript|python|etc (for code blocks - REQUIRED)",
        "highlight": "1,3-5 (optional line highlighting for code blocks)",
        "priority": "high|medium|low"
      }}
    }}
  ]
}}

CONTENT BLOCK TYPES:
- key_points: Important highlights (format: **Title** ***Key point content***)
- architecture: System/component structure (format: **Title** ***Architecture content***)
- mermaid: Visual diagrams using mermaid syntax
- code: Code examples with language specification
- api_reference: API documentation (format: **Title** ***API reference content***)
- guide: Step-by-step instructions (format: **Title** ***Guide content***)
- comparison: Compare different approaches (format: ****Side 1 Heading** ***Point 1*** ***Point 2*** **** ****Side 2 Heading** ***Point 1*** ***Point 2*** ****)
- best_practices: Best practices and recommendations (format: **Title** ***Best practice content***)
- troubleshooting: Common issues and solutions (format: **Title** ***Troubleshooting content***)

GRID LAYOUT: 2 rows vertical × 3 columns horizontal = 6 total grid cells

SIZE GUIDELINES (all blocks are 1 row tall):
- small: Single cell (1×1) - fits anywhere
- medium: Two cells wide (2×1) - spans 2 columns, fits in 1 row
- large: Full width (3×2) - spans all 3 columns and 2 rows

CONSTRAINTS:
- Maximum 2 medium blocks (since each takes 2 columns, max 4 columns available)
- Maximum 6 small blocks (6 cells total)
- Large block fills entire grid (3×2 = 6 cells, use only if really needed)
- Stay within 2 rows maximum unless absolutely necessary
- Total blocks: 1-6 blocks maximum

BLOCK PLACEMENT RULES:
- Large blocks use the entire 2×3 grid
- Medium blocks can be placed side by side (2×1 + 2×1 = 4 columns)
- Small blocks can fill remaining spaces
- Don't exceed grid capacity

IMPORTANT SYNTAX REQUIREMENTS:

MERMAID DIAGRAM REQUIREMENTS:
- Use valid Mermaid.js syntax with proper diagram declarations
- Flowcharts: Start with "graph TD" or "flowchart TD", use [Node Name] for nodes, --> for links
- Sequence Diagrams: Start with "sequenceDiagram", define participants, use ->> for messages
- Examples:
  * Flowchart: graph TD\\n    A[Start] --> B[Process]\\n    B --> C[End]
  * Sequence: sequenceDiagram\\n    Alice->>Bob: Hello\\n    Bob-->>Alice: Hi
  * Class: classDiagram\\n    class Animal\\n    Animal : +makeSound()
- Avoid complex styling or unsupported features
- Keep diagrams simple and readable

CODE BLOCK REQUIREMENTS:
- Always specify programming language in metadata (javascript, python, typescript, java, csharp, php, ruby, go, rust, swift, kotlin, scala, html, css, sql, bash, yaml, json, xml, etc.)
- Include optional line highlighting in metadata as "highlight": "1,3-5" for lines 1 and 3-5

STRUCTURED CONTENT REQUIREMENTS:
- For key_points, best_practices, troubleshooting, guide, architecture, and api_reference blocks: Each item title should start and end with **, each item content should start and end with ***
- For comparison blocks: Use side-by-side format with **** for each side, ** for side headings, and *** for points
- All block content must be properly formatted and syntactically correct
- Use appropriate escaping for special characters in JSON

GRID CONSTRAINTS REMINDER:
- 2×3 grid layout (2 rows, 3 columns)
- Respect size limits and placement rules
- Large blocks fill entire grid
- Maximum 2 medium blocks
- Maximum 6 small blocks

Ensure the response is valid JSON."""

    # Retry logic for Gemini API overload
    max_retries = 3
    for attempt in range(max_retries):
        try:
            gemini_client = genai.Client(api_key=GEMINI_API_KEY)

            response = gemini_client.models.generate_content(
                model=GEMINI_MODEL,
                contents=analysis_prompt,
                config=genai.types.GenerateContentConfig(
                    temperature=0.7,
                    max_output_tokens=8000,  # Increased for more comprehensive summaries
                    candidate_count=1
                )
            )

            if response.candidates and response.candidates[0].content:
                generated_text = response.candidates[0].content.parts[0].text

                # Extract JSON from response
                json_match = re.search(r'\{[\s\S]*\}', generated_text)
                if json_match:
                    json_string = json_match.group(0)

                    # Debug: Log JSON string length and a sample if parsing fails
                    print(f"   📄 Extracted JSON length: {len(json_string)} chars")

                    try:
                        parsed_response = json.loads(json_string)
                    except json.JSONDecodeError as json_error:
                        print(f"   ❌ JSON parsing error details:")
                        print(f"   Error: {json_error}")
                        print(f"   Position: {json_error.pos}")
                        print(f"   Line: {json_error.lineno}, Column: {json_error.colno}")

                        # Show context around the error
                        start = max(0, json_error.pos - 50)
                        end = min(len(json_string), json_error.pos + 50)
                        context = json_string[start:end]
                        print(f"   Context around error: ...{context}...")

                        # Try to fix common issues
                        if "Expecting ',' delimiter" in str(json_error):
                            print("   🔧 Attempting to fix trailing comma issues...")
                            # Remove trailing commas before closing braces/brackets
                            fixed_json = re.sub(r',(\s*[}\]])', r'\1', json_string)
                            try:
                                parsed_response = json.loads(fixed_json)
                                print("   ✅ Fixed trailing comma issue")
                            except:
                                raise json_error
                        elif "Expecting ',' delimiter" in str(json_error) or "Expecting ':' delimiter" in str(json_error):
                            print("   🔧 Attempting to fix other delimiter issues...")
                            # Try to clean up the JSON by removing problematic characters
                            # Remove any trailing commas and fix common issues
                            cleaned_json = re.sub(r',\s*}', '}', json_string)  # Remove trailing commas before }
                            cleaned_json = re.sub(r',\s*]', ']', cleaned_json)  # Remove trailing commas before ]
                            cleaned_json = re.sub(r'([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:', r'\1"\2":', cleaned_json)  # Quote unquoted keys
                            try:
                                parsed_response = json.loads(cleaned_json)
                                print("   ✅ Fixed delimiter issues")
                            except:
                                raise json_error
                        else:
                            raise json_error

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
            error_msg = str(e)
            if "503" in error_msg or "UNAVAILABLE" in error_msg or "overloaded" in error_msg.lower():
                if attempt < max_retries - 1:
                    wait_time = (attempt + 1) * 10  # Exponential backoff: 10s, 20s, 30s (longer for analysis)
                    print(f"⚠️ Gemini overloaded (attempt {attempt + 1}/{max_retries}), waiting {wait_time}s...")
                    time.sleep(wait_time)
                    continue
                else:
                    print(f"❌ Gemini still overloaded after {max_retries} attempts")
                    raise ValueError(f"Gemini API unavailable after {max_retries} attempts: {e}")
            else:
                print(f"❌ Analysis generation failed: {e}")
                raise


# ===== STEP 7: CREATE COMPATIBLE BLOCKS =====
def validate_block_syntax(block: Dict[str, Any]) -> bool:
    """Validate that block content has proper syntax"""
    block_type = block.get('type', '')
    content = block.get('content', '')

    try:
        if block_type == 'mermaid':
            # Enhanced mermaid syntax validation
            if not content.strip():
                return False

            content_lines = content.strip().split('\n')
            if not content_lines[0].strip():
                return False

            # Check for proper diagram declarations
            first_line = content_lines[0].strip().lower()
            valid_starts = [
                'graph ', 'flowchart ', 'sequencediagram',
                'classdiagram', 'statediagram', 'erdiagram',
                'journey', 'gantt', 'pie ', 'gitgraph'
            ]

            # Check if first line starts with valid diagram type
            if not any(first_line.startswith(start) for start in valid_starts):
                print(f"   ⚠️ Invalid Mermaid diagram start: {first_line}")
                print(f"   📝 Valid starts: {', '.join(valid_starts)}")
                return False

            # Additional validation for common syntax issues
            if 'graph' in first_line or 'flowchart' in first_line:
                # Check for basic node/link structure
                has_nodes = False
                has_links = False
                for line in content_lines[1:]:  # Skip first line
                    line = line.strip()
                    if line and not line.startswith('%%'):  # Skip comments
                        if '[' in line and ']' in line:  # Node definition
                            has_nodes = True
                        if '-->' in line or '->' in line or '-' in line:  # Link definition
                            has_links = True

                if not has_nodes:
                    print(f"   ⚠️ Flowchart missing node definitions (use [Node Name] format)")
                    return False
                if not has_links:
                    print(f"   ⚠️ Flowchart missing link definitions (use --> or ->)")
                    return False

            elif 'sequencediagram' in first_line:
                # Check for sequence diagram structure
                has_participants = False
                has_messages = False
                for line in content_lines[1:]:
                    line = line.strip()
                    if line and not line.startswith('%%'):
                        if 'participant' in line.lower():
                            has_participants = True
                        if '->>' in line or '-x' in line or '->' in line:
                            has_messages = True

                if not has_participants:
                    print(f"   ⚠️ Sequence diagram missing participants")
                    return False
                if not has_messages:
                    print(f"   ⚠️ Sequence diagram missing messages")
                    return False

            print(f"   ✅ Valid Mermaid diagram: {first_line}")
            return True

        elif block_type == 'code':
            # Ensure language is specified in metadata (required for syntax highlighting)
            metadata = block.get('metadata', {})
            if not metadata.get('language'):
                print(f"   ⚠️ Code block '{block.get('title', '')}' missing language in metadata - REQUIRED for syntax highlighting")
                # Try to auto-detect language from content or set to 'text'
                content = block.get('content', '').strip()
                if 'function' in content or 'console.log' in content or 'const ' in content or 'let ' in content:
                    block['metadata']['language'] = 'javascript'
                    print(f"   ✅ Auto-detected JavaScript for code block")
                elif 'def ' in content or 'import ' in content or 'print(' in content:
                    block['metadata']['language'] = 'python'
                    print(f"   ✅ Auto-detected Python for code block")
                elif 'public class' in content or 'System.out' in content:
                    block['metadata']['language'] = 'java'
                    print(f"   ✅ Auto-detected Java for code block")
                elif '<?php' in content or 'echo ' in content:
                    block['metadata']['language'] = 'php'
                    print(f"   ✅ Auto-detected PHP for code block")
                elif '<html>' in content or '<div>' in content:
                    block['metadata']['language'] = 'html'
                    print(f"   ✅ Auto-detected HTML for code block")
                elif 'SELECT' in content.upper() or 'FROM' in content.upper():
                    block['metadata']['language'] = 'sql'
                    print(f"   ✅ Auto-detected SQL for code block")
                elif '#!/bin/bash' in content or 'echo ' in content:
                    block['metadata']['language'] = 'bash'
                    print(f"   ✅ Auto-detected Bash for code block")
                else:
                    block['metadata']['language'] = 'text'
                    print(f"   ⚠️ Could not auto-detect language, defaulting to 'text'")

        elif block_type == 'key_points':
            # Validate key_points formatting: **Title** ***Key point content***
            lines = content.split('\n')
            valid_format = True

            for line in lines:
                line = line.strip()
                if line:  # Skip empty lines
                    # Check if line contains both **title** and ***content***
                    if not ('**' in line and '***' in line):
                        valid_format = False
                        break

                    # More specific validation: should have **title** followed by ***content***
                    # Look for pattern: **something** ***something***
                    title_match = '**' in line[:line.find('***')] if '***' in line else False
                    if not title_match:
                        valid_format = False
                        break

            if not valid_format:
                print(f"   ⚠️ Key points block '{block.get('title', '')}' has invalid formatting - should use **Title** ***Key point content*** format")
                return False

        elif block_type == 'best_practices':
            # Validate best_practices formatting: **Title** ***Best practice content***
            lines = content.split('\n')
            valid_format = True

            for line in lines:
                line = line.strip()
                if line:  # Skip empty lines
                    # Check if line contains both **title** and ***content***
                    if not ('**' in line and '***' in line):
                        valid_format = False
                        break

                    # More specific validation: should have **title** followed by ***content***
                    title_match = '**' in line[:line.find('***')] if '***' in line else False
                    if not title_match:
                        valid_format = False
                        break

            if not valid_format:
                print(f"   ⚠️ Best practices block '{block.get('title', '')}' has invalid formatting - should use **Title** ***Best practice content*** format")
                return False

        elif block_type == 'troubleshooting':
            # Validate troubleshooting formatting: **Title** ***Troubleshooting content***
            lines = content.split('\n')
            valid_format = True

            for line in lines:
                line = line.strip()
                if line:  # Skip empty lines
                    # Check if line contains both **title** and ***content***
                    if not ('**' in line and '***' in line):
                        valid_format = False
                        break

                    # More specific validation: should have **title** followed by ***content***
                    title_match = '**' in line[:line.find('***')] if '***' in line else False
                    if not title_match:
                        valid_format = False
                        break

            if not valid_format:
                print(f"   ⚠️ Troubleshooting block '{block.get('title', '')}' has invalid formatting - should use **Title** ***Troubleshooting content*** format")
                return False

        elif block_type == 'guide':
            # Validate guide formatting: **Title** ***Guide content***
            lines = content.split('\n')
            valid_format = True

            for line in lines:
                line = line.strip()
                if line:  # Skip empty lines
                    # Check if line contains both **title** and ***content***
                    if not ('**' in line and '***' in line):
                        valid_format = False
                        break

                    # More specific validation: should have **title** followed by ***content***
                    title_match = '**' in line[:line.find('***')] if '***' in line else False
                    if not title_match:
                        valid_format = False
                        break

            if not valid_format:
                print(f"   ⚠️ Guide block '{block.get('title', '')}' has invalid formatting - should use **Title** ***Guide content*** format")
                return False

        elif block_type == 'architecture':
            # Validate architecture formatting: **Title** ***Architecture content***
            lines = content.split('\n')
            valid_format = True

            for line in lines:
                line = line.strip()
                if line:  # Skip empty lines
                    # Check if line contains both **title** and ***content***
                    if not ('**' in line and '***' in line):
                        valid_format = False
                        break

                    # More specific validation: should have **title** followed by ***content***
                    title_match = '**' in line[:line.find('***')] if '***' in line else False
                    if not title_match:
                        valid_format = False
                        break

            if not valid_format:
                print(f"   ⚠️ Architecture block '{block.get('title', '')}' has invalid formatting - should use **Title** ***Architecture content*** format")
                return False

        elif block_type == 'api_reference':
            # Validate api_reference formatting: **Title** ***API reference content***
            lines = content.split('\n')
            valid_format = True

            for line in lines:
                line = line.strip()
                if line:  # Skip empty lines
                    # Check if line contains both **title** and ***content***
                    if not ('**' in line and '***' in line):
                        valid_format = False
                        break

                    # More specific validation: should have **title** followed by ***content***
                    title_match = '**' in line[:line.find('***')] if '***' in line else False
                    if not title_match:
                        valid_format = False
                        break

            if not valid_format:
                print(f"   ⚠️ API reference block '{block.get('title', '')}' has invalid formatting - should use **Title** ***API reference content*** format")
                return False

        elif block_type == 'comparison':
            # Validate comparison formatting: ****Side Heading** ***Point*** ****
            content = block.get('content', '')
            lines = content.split('\n')
            valid_format = True

            # Check for proper side structure with **** delimiters
            sides = content.split('****')
            if len(sides) < 3:  # Should have at least 2 sides + empty strings
                valid_format = False
                print(f"   ⚠️ Comparison block '{block.get('title', '')}' missing proper side delimiters (****)")
            else:
                # Validate each side has proper structure
                for i, side in enumerate(sides):
                    if i % 2 == 1:  # Odd indices should be side content
                        side_lines = side.strip().split('\n')
                        if not side_lines[0].strip():  # First line should have heading
                            valid_format = False
                            print(f"   ⚠️ Comparison block '{block.get('title', '')}' side {int((i+1)/2)} missing heading")
                            break

                        # Check if first line starts with ** (heading)
                        if not side_lines[0].strip().startswith('**'):
                            valid_format = False
                            print(f"   ⚠️ Comparison block '{block.get('title', '')}' side {int((i+1)/2)} heading should start with **")
                            break

                        # Check other lines for proper point formatting
                        for j, line in enumerate(side_lines[1:], 1):
                            line = line.strip()
                            if line and not (line.startswith('***') and line.endswith('***')):
                                valid_format = False
                                print(f"   ⚠️ Comparison block '{block.get('title', '')}' side {int((i+1)/2)} point {j} should use ***format***")
                                break

            if not valid_format:
                print(f"   ⚠️ Comparison block '{block.get('title', '')}' has invalid formatting - should use ****Side Heading** ***Point 1*** ***Point 2*** **** format")
                return False

        # Check for basic content validity
        if not content.strip():
            return False

        # Check for unescaped quotes that could break JSON
        if '"' in content and not content.replace('\\"', '').replace('\\\\', ''):
            # This is a basic check - in practice, the JSON parsing will catch issues
            pass

        return True

    except Exception as e:
        print(f"   ⚠️ Syntax validation failed for block '{block.get('title', '')}': {e}")
        return False


def create_compatible_blocks(analysis_result: Dict[str, Any]) -> str:
    """Create analysis blocks in exact same JSON format as llm-analyzer-python"""
    print("🧩 Step 7: Creating compatible blocks...")

    # Validate blocks according to 2×3 grid layout constraints
    blocks = analysis_result.get('blocks', [])

    # Validate and clean blocks
    valid_block_types = [
        'key_points', 'architecture', 'mermaid', 'code',
        'api_reference', 'guide', 'comparison', 'best_practices', 'troubleshooting'
    ]

    valid_sizes = ['small', 'medium', 'large']

    cleaned_blocks = []
    grid_cells_used = 0
    medium_count = 0

    for i, block in enumerate(blocks[:6]):  # Maximum 6 blocks
        if (block.get('id') and block.get('type') and block.get('size') and
            block.get('title') and block.get('content') and
            block['type'] in valid_block_types and
            block['size'] in valid_sizes):

            # Ensure metadata exists
            if 'metadata' not in block:
                block['metadata'] = {}

            # Validate block syntax first
            if not validate_block_syntax(block):
                print(f"   ⚠️ Skipping block {i+1} - syntax validation failed")
                continue

            # Validate grid constraints
            block_size = block['size']
            if block_size == 'large':
                # Large blocks take entire grid (6 cells)
                if grid_cells_used > 0:
                    print(f"   ⚠️ Skipping large block {i+1} - grid not empty")
                    continue
                if len(cleaned_blocks) > 0:
                    print(f"   ⚠️ Skipping large block {i+1} - large must be only block")
                    continue
                grid_cells_used = 6
            elif block_size == 'medium':
                # Medium blocks take 2 cells (2×1)
                if medium_count >= 2:
                    print(f"   ⚠️ Skipping medium block {i+1} - max 2 medium blocks")
                    continue
                if grid_cells_used + 2 > 6:
                    print(f"   ⚠️ Skipping medium block {i+1} - not enough space")
                    continue
                grid_cells_used += 2
                medium_count += 1
            elif block_size == 'small':
                # Small blocks take 1 cell
                if grid_cells_used + 1 > 6:
                    print(f"   ⚠️ Skipping small block {i+1} - grid full")
                    continue
                grid_cells_used += 1

            cleaned_blocks.append(block)
            print(f"   ✅ Block {i+1}: {block['type']} ({block['size']}) - {block['title'][:30]}... - Grid used: {grid_cells_used}/6")

    # Final validation - ensure we don't exceed grid
    if grid_cells_used > 6:
        print(f"   ⚠️ Grid overflow detected ({grid_cells_used}/6), truncating blocks")
        # Remove blocks until we're within grid limits
        while grid_cells_used > 6 and cleaned_blocks:
            removed = cleaned_blocks.pop()
            if removed['size'] == 'large':
                grid_cells_used -= 6
            elif removed['size'] == 'medium':
                grid_cells_used -= 2
                medium_count -= 1
            else:  # small
                grid_cells_used -= 1
            print(f"   Removed {removed['type']} ({removed['size']}) to fit grid")

    # Convert to JSON string (exactly like llm-analyzer-python)
    blocks_json = json.dumps(cleaned_blocks)

    print(f"✅ Compatible blocks created: {len(cleaned_blocks)} blocks, Grid used: {grid_cells_used}/6")
    return blocks_json




# ===== STEP 8: FINAL SAVE AND COMPLETE =====
def final_save_and_complete(document_id: str, ai_title: str, analysis_result: Dict[str, Any], blocks_json: str) -> None:
    """Save all final results and mark as completed"""
    print("✅ Step 8: Final save and complete...")

    # Create comprehensive readable summary (up to 5000 chars)
    full_summary = analysis_result.get('summary', '')

    # Use up to 5000 characters for a comprehensive summary
    max_summary_length = 5000
    if len(full_summary) <= max_summary_length:
        readable_summary = full_summary
    else:
        # Try to cut at a sentence or paragraph boundary if possible
        truncated = full_summary[:max_summary_length]

        # Look for sentence endings near the end
        last_period = truncated.rfind('.')
        last_exclamation = truncated.rfind('!')
        last_question = truncated.rfind('?')

        # Find the best cutoff point
        best_cutoff = max(last_period, last_exclamation, last_question)

        if best_cutoff > max_summary_length * 0.8:  # If we can keep 80% of the content
            readable_summary = full_summary[:best_cutoff + 1]
        else:
            readable_summary = truncated.rstrip() + '...'

    # Ensure the summary is not empty
    if not readable_summary.strip():
        readable_summary = f"Analysis of {ai_title or 'document'} completed successfully."

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
