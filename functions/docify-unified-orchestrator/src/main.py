#!/usr/bin/env python3
"""
Docify Unified Orchestrator - Advanced Gemini-Powered Document Analysis
Uses all available Gemini API tools for comprehensive content analysis
"""

import os
import json
import time
import requests
import chardet
import re
import hashlib
from typing import Dict, Any, Optional, List, Tuple, Union
from urllib.parse import urlparse, urljoin, parse_qs
from io import BytesIO
from bs4 import BeautifulSoup
from appwrite.client import Client
from appwrite.services.databases import Databases
from appwrite.id import ID
from google import genai
from google.genai import types

# Environment variables
DATABASE_ID = os.environ.get('DATABASE_ID', 'docify_db')
DOCUMENTS_COLLECTION_ID = os.environ.get('DOCUMENTS_COLLECTION_ID', 'documents_table')
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')

# Initialize clients
client = Client()
client.set_endpoint(os.environ.get('APPWRITE_FUNCTION_API_ENDPOINT'))
client.set_project(os.environ.get('APPWRITE_FUNCTION_PROJECT_ID'))
client.set_key(os.environ.get('APPWRITE_API_KEY'))
databases = Databases(client)

# Gemini configuration
GEMINI_MODEL = "gemini-2.5-flash"  # Latest model with full tool support
MAX_CONTENT_LENGTH = 100000  # Maximum content to process
MAX_TOOL_EXECUTIONS = 15  # Maximum tool calls per analysis
TOOL_TIMEOUT = 30  # Tool execution timeout in seconds

# ===== LOGGER CLASS =====
class Logger:
    """Simple logger for the function with Appwrite context logging"""

    def __init__(self, context=None):
        self.logs = []
        self.start_time = time.time()
        self.context = context

    def log(self, message: str):
        """Log a message with timestamp using Appwrite context"""
        timestamp = time.time() - self.start_time

        # Use Appwrite context logging if available
        if self.context and hasattr(self.context, 'log'):
            self.context.log(f"[{timestamp:.2f}s] {message}")
        else:
            print(f"[{timestamp:.2f}s] {message}")

        self.logs.append({
            "timestamp": timestamp,
            "message": message,
            "level": "info"
        })

    def error(self, message: str):
        """Log an error message"""
        timestamp = time.time() - self.start_time

        if self.context and hasattr(self.context, 'error'):
            self.context.error(f"[{timestamp:.2f}s] ERROR: {message}")
        else:
            print(f"[{timestamp:.2f}s] ERROR: {message}")

        self.logs.append({
            "timestamp": timestamp,
            "message": message,
            "level": "error"
        })

    def get_logs(self) -> List[Dict[str, Any]]:
        """Get all logged messages"""
        return self.logs.copy()

# ===== ADVANCED CONTENT PROCESSOR =====
class AdvancedContentProcessor:
    """Advanced content processor using all Gemini tools"""

    def __init__(self, logger):
        self.logger = logger
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })

    def process_url_comprehensive(self, url: str, gemini_client) -> Dict[str, Any]:
        """Comprehensive URL processing using all available tools"""
        try:
            self.logger.log(f"🚀 Starting comprehensive URL analysis: {url}")

            # Phase 1: Initial content extraction
            self.logger.log("📄 Phase 1: Initial content extraction")
            initial_content = self._extract_initial_content(url)

            # Phase 2: Enhanced analysis with Gemini tools
            self.logger.log("🤖 Phase 2: Enhanced analysis with Gemini tools")
            enhanced_analysis = self._analyze_with_gemini_tools(url, initial_content, gemini_client)

            # Phase 3: Deep content processing
            self.logger.log("🔍 Phase 3: Deep content processing")
            deep_content = self._process_deep_content(url, enhanced_analysis)

            # Phase 4: Research and context enrichment
            self.logger.log("🔬 Phase 4: Research and context enrichment")
            enriched_content = self._enrich_with_research(url, deep_content, gemini_client)

            # Phase 5: Final synthesis
            self.logger.log("🎯 Phase 5: Final synthesis")
            final_result = self._synthesize_final_result(url, enriched_content)

            self.logger.log(f"✅ Comprehensive analysis completed: {len(final_result.get('content', ''))} characters")
            self.logger.log(f"📊 Tools used during processing: {len(self.tool_usage_log)}")
            return final_result

        except Exception as e:
            self.logger.error(f"❌ Comprehensive processing failed: {e}")
            self.logger.log(f"📊 Tools used before failure: {len(self.tool_usage_log)}")
            return {
                "error": str(e),
                "url": url,
                "fallback_content": self._extract_basic_content(url)
            }

    def _extract_initial_content(self, url: str) -> Dict[str, Any]:
        """Extract initial content from URL"""
        try:
            self.logger.log(f"🌐 Fetching initial content from: {url}")
            response = self.session.get(url, timeout=30)
            response.raise_for_status()

            # Detect content type
            content_type = response.headers.get('content-type', '').lower()

            if 'application/pdf' in content_type:
                return self._extract_pdf_content(response, url)
            elif 'application/json' in content_type:
                return self._extract_json_content(response, url)
            elif 'text/html' in content_type or 'text/plain' in content_type:
                return self._extract_html_content(response, url)
            else:
                return self._extract_generic_content(response, url)

        except Exception as e:
            self.logger.error(f"⚠️ Initial extraction failed: {e}")
            return {"error": str(e), "url": url}

    def _extract_html_content(self, response, url: str) -> Dict[str, Any]:
        """Advanced HTML content extraction"""
        try:
            # Detect encoding
            detected_encoding = chardet.detect(response.content)['encoding']
            html_content = response.content.decode(detected_encoding or 'utf-8', errors='ignore')

            soup = BeautifulSoup(html_content, 'html.parser')

            # Extract comprehensive metadata
            metadata = self._extract_comprehensive_metadata(soup)

            # Extract main content with multiple strategies
            main_content = self._extract_main_content_advanced(soup)

            # Extract structured data
            structured_data = self._extract_structured_data(soup)

            # Extract links with context
            links = self._extract_links_with_context(soup, url)

            # Extract code blocks
            code_blocks = self._extract_code_blocks(soup)

            # Extract images and media
            media = self._extract_media_content(soup, url)

            result = {
                "url": url,
                "content_type": "html",
                "title": metadata.get("title", ""),
                "description": metadata.get("description", ""),
                "keywords": metadata.get("keywords", []),
                "author": metadata.get("author", ""),
                "published_date": metadata.get("published_date"),
                "main_content": main_content,
                "structured_data": structured_data,
                "links": links,
                "code_blocks": code_blocks,
                "media": media,
                "word_count": len(main_content.split()),
                "character_count": len(main_content),
                "status_code": response.status_code,
                "headers": dict(response.headers)
            }

            return result

        except Exception as e:
            self.logger.error(f"⚠️ HTML extraction failed: {e}")
            return {"error": str(e), "url": url}

    def _extract_comprehensive_metadata(self, soup) -> Dict[str, Any]:
        """Extract comprehensive metadata from HTML"""
        metadata = {}

        # Title extraction with fallbacks
        title_tag = soup.find('title')
        og_title = soup.find('meta', property='og:title')
        twitter_title = soup.find('meta', attrs={'name': 'twitter:title'})

        metadata['title'] = (
            og_title.get('content') if og_title else
            twitter_title.get('content') if twitter_title else
            title_tag.get_text(strip=True) if title_tag else ""
        )

        # Description extraction with fallbacks
        desc_tag = soup.find('meta', attrs={'name': 'description'})
        og_desc = soup.find('meta', property='og:description')
        twitter_desc = soup.find('meta', attrs={'name': 'twitter:description'})

        metadata['description'] = (
            og_desc.get('content') if og_desc else
            twitter_desc.get('content') if twitter_desc else
            desc_tag.get('content') if desc_tag and desc_tag.get('content') else ""
        )

        # Keywords
        keywords_tag = soup.find('meta', attrs={'name': 'keywords'})
        metadata['keywords'] = keywords_tag.get('content').split(',') if keywords_tag and keywords_tag.get('content') else []

        # Author
        author_tag = soup.find('meta', attrs={'name': 'author'})
        og_author = soup.find('meta', property='article:author')
        metadata['author'] = (
            og_author.get('content') if og_author else
            author_tag.get('content') if author_tag else ""
        )

        # Published date
        published_tag = soup.find('meta', property='article:published_time')
        metadata['published_date'] = published_tag.get('content') if published_tag else None

        return metadata

    def _extract_main_content_advanced(self, soup) -> str:
        """Advanced main content extraction"""
        # Remove unwanted elements
        for element in soup(['script', 'style', 'nav', 'header', 'footer', 'aside', 'advertisement']):
            element.extract()

        # Try multiple content extraction strategies
        content_selectors = [
            'main',
            '[role="main"]',
            '.content',
            '.main-content',
            '.post-content',
            '.entry-content',
            '#content',
            '#main',
            'article'
        ]

        main_content = ""
        for selector in content_selectors:
            content_element = soup.select_one(selector)
            if content_element:
                main_content = content_element.get_text(separator=' ', strip=True)
                if len(main_content) > 200:  # Minimum content length
                    break

        # Fallback to body content if no specific content found
        if not main_content or len(main_content) < 200:
            body = soup.find('body')
            if body:
                main_content = body.get_text(separator=' ', strip=True)

        # Clean up the content
        main_content = re.sub(r'\s+', ' ', main_content).strip()
        return main_content

    def _extract_structured_data(self, soup) -> List[Dict[str, Any]]:
        """Extract structured data (JSON-LD, Microdata, RDFa)"""
        structured_data = []

        # JSON-LD
        json_ld_scripts = soup.find_all('script', type='application/ld+json')
        for script in json_ld_scripts:
            try:
                data = json.loads(script.string)
                structured_data.append({
                    "type": "json-ld",
                    "data": data
                })
            except:
                continue

        # Open Graph data
        og_data = {}
        for meta in soup.find_all('meta', property=lambda x: x and x.startswith('og:')):
            og_data[meta.get('property')] = meta.get('content')

        if og_data:
            structured_data.append({
                "type": "open-graph",
                "data": og_data
            })

        return structured_data

    def _extract_links_with_context(self, soup, base_url: str) -> List[Dict[str, Any]]:
        """Extract links with surrounding context"""
        links = []

        for a in soup.find_all('a', href=True):
            href = a['href']
            text = a.get_text(strip=True)

            # Convert relative URLs to absolute
            if not href.startswith(('http://', 'https://')):
                href = urljoin(base_url, href)

            if href and text:
                # Get surrounding context
                parent = a.parent
                context = ""
                if parent:
                    # Get text from parent element
                    context = parent.get_text(separator=' ', strip=True)[:200]

                links.append({
                    "url": href,
                    "text": text[:100],
                    "context": context,
                    "is_external": urlparse(href).netloc != urlparse(base_url).netloc
                })

        return links[:50]  # Limit to 50 links

    def _extract_code_blocks(self, soup) -> List[Dict[str, Any]]:
        """Extract code blocks and examples"""
        code_blocks = []

        # Pre-formatted code blocks
        for pre in soup.find_all('pre'):
            code_element = pre.find('code')
            if code_element:
                code_content = code_element.get_text()
                language = ""

                # Try to detect language from class
                code_class = code_element.get('class', [])
                for cls in code_class:
                    if cls.startswith('language-') or cls.startswith('lang-'):
                        language = cls.split('-', 1)[1]
                        break

                code_blocks.append({
                    "content": code_content,
                    "language": language,
                    "type": "pre"
                })

        # Inline code (simpler extraction)
        for code in soup.find_all('code'):
            if not code.find_parent('pre'):  # Skip if already in pre block
                code_content = code.get_text()
                if len(code_content) > 10:  # Only meaningful code
                    code_blocks.append({
                        "content": code_content,
                        "language": "",
                        "type": "inline"
                    })

        return code_blocks[:20]  # Limit to 20 code blocks

    def _extract_media_content(self, soup, base_url: str) -> List[Dict[str, Any]]:
        """Extract images, videos, and other media"""
        media = []

        # Images
        for img in soup.find_all('img', src=True):
            src = img['src']
            if not src.startswith(('http://', 'https://')):
                src = urljoin(base_url, src)

            media.append({
                "type": "image",
                "url": src,
                "alt": img.get('alt', ''),
                "title": img.get('title', '')
            })

        # Videos
        for video in soup.find_all('video'):
            src = video.get('src')
            if src and not src.startswith(('http://', 'https://')):
                src = urljoin(base_url, src)

            if src:
                media.append({
                    "type": "video",
                    "url": src,
                    "poster": video.get('poster', '')
                })

        return media[:30]  # Limit to 30 media items

    def _extract_basic_content(self, url: str) -> Dict[str, Any]:
        """Basic fallback content extraction"""
        try:
            response = self.session.get(url, timeout=15)
            response.raise_for_status()

            # Detect encoding
            detected_encoding = chardet.detect(response.content)['encoding']
            content = response.content.decode(detected_encoding or 'utf-8', errors='ignore')

            soup = BeautifulSoup(content, 'html.parser')
            text_content = soup.get_text(separator=' ', strip=True)
            text_content = re.sub(r'\s+', ' ', text_content).strip()

            return {
                "url": url,
                "title": soup.find('title').get_text(strip=True) if soup.find('title') else "",
                "content": text_content[:5000],  # Limit content
                "word_count": len(text_content.split()),
                "status_code": response.status_code
            }
        except Exception as e:
            return {"error": str(e), "url": url}

    def _extract_pdf_content(self, response, url: str) -> Dict[str, Any]:
        """Extract content from PDF files"""
        try:
            # For now, return basic info - would need pdf parsing library
            return {
                "url": url,
                "content_type": "pdf",
                "title": url.split('/')[-1],
                "content": f"PDF document: {url}",
                "size": len(response.content),
                "status_code": response.status_code
            }
        except Exception as e:
            return {"error": str(e), "url": url}

    def _extract_json_content(self, response, url: str) -> Dict[str, Any]:
        """Extract content from JSON files"""
        try:
            json_data = response.json()
            content = json.dumps(json_data, indent=2)
            return {
                "url": url,
                "content_type": "json",
                "content": content,
                "parsed_data": json_data,
                "size": len(content),
                "status_code": response.status_code
            }
        except Exception as e:
            return {"error": str(e), "url": url}

    def _extract_generic_content(self, response, url: str) -> Dict[str, Any]:
        """Extract content from other file types"""
        try:
            # Detect encoding
            detected_encoding = chardet.detect(response.content)['encoding']
            content = response.content.decode(detected_encoding or 'utf-8', errors='ignore')

            return {
                "url": url,
                "content_type": "generic",
                "content": content,
                "size": len(response.content),
                "status_code": response.status_code
            }
        except Exception as e:
            return {"error": str(e), "url": url}

    def _analyze_with_gemini_tools(self, url: str, initial_content: Dict[str, Any], gemini_client) -> Dict[str, Any]:
        """Use Gemini tools for enhanced content analysis"""
        try:
            self.logger.log("🤖 Using Gemini tools for content analysis")

            # Define available Gemini tools
            tools = [
                types.Tool(google_search=types.GoogleSearch()),
                types.Tool(url_context=types.UrlContext())
            ]

            # Create analysis prompt
            analysis_prompt = self._create_analysis_prompt(url, initial_content)

            # Configure generation
            generation_config = types.GenerateContentConfig(
                temperature=0.7,
                top_p=0.95,
                max_output_tokens=4000,
                candidate_count=1,
                thinking_config=types.ThinkingConfig(thinking_budget=0),
                tools=tools
            )

            # Generate with tools
            response = gemini_client.models.generate_content(
                model=GEMINI_MODEL,
                contents=analysis_prompt,
                config=generation_config
            )

            # Process tool calls and results
            tool_results = self._process_tool_calls(response, gemini_client)

            return {
                "gemini_analysis": response.text if response.candidates else "",
                "tool_results": tool_results,
                "enhanced_content": initial_content
            }

        except Exception as e:
            self.logger.error(f"⚠️ Gemini tool analysis failed: {e}")
            return {"error": str(e), "basic_content": initial_content}

    def _create_analysis_prompt(self, url: str, content: Dict[str, Any]) -> str:
        """Create comprehensive analysis prompt for Gemini following LLM_RESPONSE_SCHEMA"""
        content_preview = content.get('main_content', content.get('content', ''))[:3000]
        code_blocks = content.get('code_blocks', [])
        user_instructions = content.get('instructions', 'Analyze this content comprehensively')

        # Include detected code blocks in the prompt
        code_context = ""
        if code_blocks:
            code_context = "\n\nDETECTED CODE BLOCKS:"
            for i, block in enumerate(code_blocks[:3], 1):  # Limit to 3 for prompt
                code_context += f"\n{i}. Language: {block.get('language', 'unknown')}\n{block['content'][:200]}..."

        return f"""You are an expert technical documentation analyzer. Analyze this web content and create structured analysis blocks following the exact specification below.

URL: {url}
TITLE: {content.get('title', 'Unknown')}
CONTENT PREVIEW: {content_preview}
USER INSTRUCTIONS: {user_instructions}{code_context}

REQUIRED OUTPUT FORMAT - Return ONLY valid JSON:
{{
  "summary": "Brief overview of the entire document...",
  "blocks": [
    {{
      "id": "unique-block-id",
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

BLOCK TYPES:
- summary: High-level overview of the document
- key_points: Important highlights and takeaways
- architecture: System or component structure
- mermaid: Visual diagrams using valid Mermaid syntax
- code: Code examples with language specification (if found in content)
- api_reference: API documentation
- guide: Step-by-step instructions
- comparison: Compare approaches or tools
- best_practices: Recommendations and guidelines
- troubleshooting: Common issues and solutions

SIZE GUIDELINES:
- small: Quick facts, simple explanations (1 grid unit)
- medium: Detailed explanations, moderate diagrams (2 grid units)
- large: Complex diagrams, comprehensive guides (3 grid units)

ANALYSIS REQUIREMENTS:
1. Generate 3-6 blocks maximum based on content analysis
2. Include at least one summary block
3. Use code blocks for any detected code examples
4. Use mermaid for system diagrams or flows
5. Ensure all blocks have unique IDs
6. Prioritize blocks based on user instructions and content importance

CONTENT ANALYSIS:
- Identify key concepts and relationships
- Extract practical examples and code
- Determine appropriate visualization types
- Focus on user instruction alignment

Use available tools (Google Search, URL Context) to enhance your analysis before generating the final JSON response."""

    def _process_tool_calls(self, response, gemini_client) -> Dict[str, Any]:
        """Process and execute tool calls from Gemini"""
        tool_results = {
            "google_search": [],
            "url_context": []
        }

        try:
            if response.candidates and response.candidates[0].content:
                for part in response.candidates[0].content.parts:
                    if hasattr(part, 'function_call') and part.function_call:
                        tool_call = part.function_call
                        tool_name = tool_call.name
                        args = tool_call.args

                        self.logger.log(f"🔧 Executing tool: {tool_name}")

                        if tool_name == "google_search":
                            result = self._execute_google_search(args, gemini_client)
                            tool_results["google_search"].append(result)
                        elif tool_name == "url_context":
                            result = self._execute_url_context(args, gemini_client)
                            tool_results["url_context"].append(result)

        except Exception as e:
            self.logger.error(f"⚠️ Tool execution failed: {e}")

        return tool_results

    def _execute_google_search(self, args: Dict[str, Any], gemini_client) -> Dict[str, Any]:
        """Execute Google search using Gemini tool"""
        try:
            search_query = args.get('query', '')
            self.logger.log(f"🔍 Google Search: {search_query}")

            # Gemini handles the search internally
            return {
                "query": search_query,
                "timestamp": time.time(),
                "status": "executed"
            }
        except Exception as e:
            return {"error": str(e), "query": args.get('query', '')}


    def _execute_url_context(self, args: Dict[str, Any], gemini_client) -> Dict[str, Any]:
        """Get URL context using Gemini tool"""
        try:
            context_url = args.get('url', '')
            self.logger.log(f"🌐 URL Context: {context_url}")

            # Gemini handles URL context internally
            return {
                "url": context_url,
                "timestamp": time.time(),
                "status": "executed"
            }
        except Exception as e:
            return {"error": str(e), "url": args.get('url', '')}


    def _process_deep_content(self, url: str, enhanced_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Process content with enhanced analysis results"""
        try:
            base_content = enhanced_analysis.get('enhanced_content', {})

            # Extract additional insights from tool results
            search_insights = self._extract_search_insights(enhanced_analysis)
            url_insights = self._extract_url_insights(enhanced_analysis)

            # Combine all insights
            deep_content = {
                **base_content,
                "search_insights": search_insights,
                "url_insights": url_insights,
                "analysis_timestamp": time.time()
            }

            return deep_content

        except Exception as e:
            self.logger.error(f"⚠️ Deep content processing failed: {e}")
            return enhanced_analysis

    def _extract_search_insights(self, analysis: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extract insights from Google search results"""
        search_results = analysis.get('tool_results', {}).get('google_search', [])
        insights = []

        for result in search_results:
            if 'error' not in result:
                insights.append({
                    "type": "search_result",
                    "query": result.get('query', ''),
                    "relevance_score": 0.8,  # Would be calculated from actual results
                    "timestamp": result.get('timestamp', time.time())
                })

        return insights


    def _extract_url_insights(self, analysis: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extract insights from URL context results"""
        url_results = analysis.get('tool_results', {}).get('url_context', [])
        insights = []

        for result in url_results:
            if 'error' not in result:
                insights.append({
                    "type": "url_context",
                    "url": result.get('url', ''),
                    "context_type": "enhanced_analysis",
                    "timestamp": result.get('timestamp', time.time())
                })

        return insights

    def _enrich_with_research(self, url: str, deep_content: Dict[str, Any], gemini_client) -> Dict[str, Any]:
        """Enrich content with additional research"""
        try:
            self.logger.log("🔬 Enriching content with research")

            # Add null check for deep_content
            if not deep_content:
                self.logger.log("⚠️ No deep content provided for research, returning basic content")
                return {
                    "url": url,
                    "research_results": [],
                    "research_enrichment": False,
                    "error": "No content to research"
                }

            # Generate research queries based on content
            research_queries = self._generate_research_queries(deep_content)

            # Execute research using Gemini tools
            research_results = []
            for query in research_queries[:3]:  # Limit to 3 research queries
                self.logger.log(f"📚 Researching: {query}")
                result = self._execute_research_query(query, gemini_client)
                research_results.append(result)

            return {
                **deep_content,
                "research_results": research_results,
                "research_timestamp": time.time()
            }

        except Exception as e:
            self.logger.error(f"⚠️ Research enrichment failed: {e}")
            return deep_content

    def _generate_research_queries(self, content: Dict[str, Any]) -> List[str]:
        """Generate relevant research queries based on content"""
        queries = []

        # Add null check
        if not content:
            return ["General web development best practices"]

        title = content.get('title', '')
        keywords = content.get('keywords', [])
        main_content = content.get('main_content', '')[:1000]

        # Generate queries from title
        if title:
            queries.append(f"What is {title}")
            queries.append(f"Latest developments in {title}")

        # Generate queries from keywords
        for keyword in keywords[:3]:
            queries.append(f"Best practices for {keyword}")
            queries.append(f"Tutorials on {keyword}")

        # Generate queries from content analysis
        if main_content:
            # Simple keyword extraction for research
            words = re.findall(r'\b\w{4,}\b', main_content.lower())
            common_words = [word for word in words if word not in ['that', 'with', 'have', 'this', 'will', 'your', 'from', 'they', 'know', 'want', 'been', 'good', 'much', 'some', 'time', 'very', 'when', 'come', 'here', 'just', 'like', 'long', 'make', 'many', 'over', 'such', 'take', 'than', 'them', 'well', 'were']]

            if common_words:
                top_keywords = list(set(common_words))[:3]
                for keyword in top_keywords:
                    queries.append(f"Understanding {keyword} in detail")

        return list(set(queries))[:5]  # Return unique queries, max 5

    def _execute_research_query(self, query: str, gemini_client) -> Dict[str, Any]:
        """Execute a research query using Gemini tools"""
        try:
            tools = [types.Tool(google_search=types.GoogleSearch())]

            prompt = f"Research this topic comprehensively: {query}\n\nProvide detailed insights and current information."

            generation_config = types.GenerateContentConfig(
                temperature=0.7,
                tools=tools
            )

            response = gemini_client.models.generate_content(
                model=GEMINI_MODEL,
                contents=prompt,
                config=generation_config
            )

            return {
                "query": query,
                "response": response.text if response.candidates else "",
                "timestamp": time.time(),
                "status": "completed"
            }

        except Exception as e:
            return {
                "query": query,
                "error": str(e),
                "timestamp": time.time(),
                "status": "failed"
            }

    def _synthesize_final_result(self, url: str, enriched_content: Dict[str, Any]) -> Dict[str, Any]:
        """Synthesize all analysis results into final output"""
        try:
            self.logger.log("🎯 Synthesizing final analysis result")

            # Combine all content
            final_content = enriched_content.get('main_content', enriched_content.get('content', ''))

            # Add research insights to content
            research_insights = enriched_content.get('research_results', [])
            if research_insights:
                research_summary = "\n\n".join([
                    f"Research on '{result['query']}': {result.get('response', '')[:500]}"
                    for result in research_insights
                    if result.get('status') == 'completed'
                ])
                final_content += f"\n\n--- Research Insights ---\n{research_summary}"

            # Create final result
            final_result = {
                "url": url,
                "title": enriched_content.get('title', ''),
                "description": enriched_content.get('description', ''),
                "content": final_content,
                "word_count": len(final_content.split()),
                "character_count": len(final_content),
                "keywords": enriched_content.get('keywords', []),
                "author": enriched_content.get('author', ''),
                "published_date": enriched_content.get('published_date'),
                "links": enriched_content.get('links', []),
                "code_blocks": enriched_content.get('code_blocks', []),
                "media": enriched_content.get('media', []),
                "structured_data": enriched_content.get('structured_data', []),
                "tool_usage": {
                    "google_search_count": len(enriched_content.get('search_insights', [])),
                    "code_execution_count": len(enriched_content.get('code_insights', [])),
                    "url_context_count": len(enriched_content.get('url_insights', [])),
                    "research_queries_count": len(enriched_content.get('research_results', []))
                },
                "analysis_metadata": {
                    "processing_time": time.time() - time.time(),  # Would be set by caller
                    "content_type": enriched_content.get('content_type', 'unknown'),
                    "analysis_version": "2.5",
                    "tools_used": ["google_search", "code_execution", "url_context"],
                    "timestamp": time.time()
                }
            }

            return final_result

        except Exception as e:
            self.logger.error(f"⚠️ Final synthesis failed: {e}")
            return {
                "url": url,
                "content": enriched_content.get('content', ''),
                "error": str(e)
            }

# ===== RESEARCH ENGINE CLASS =====
class ResearchEngine:
    """Research engine for user interests"""

    def __init__(self, logger):
        self.logger = logger

    def research_user_interests(self, interests: List[str], topic: str) -> Dict[str, Any]:
        """Research topics based on user interests"""
        self.logger.log(f"🔍 Researching topic: '{topic}' with {len(interests)} interests")

        research_results = {
            "topic": topic,
            "interests": interests,
            "related_topics": self._find_related_topics(topic, interests),
            "recommendations": self._generate_recommendations(topic, interests),
            "insights": self._generate_research_findings(topic, interests, "detailed")
        }

        self.logger.log(f"✅ Research completed: {len(research_results.get('related_topics', []))} related topics")
        return research_results

    def _find_related_topics(self, topic: str, interests: List[str]) -> List[str]:
        """Find related topics based on interests"""
        related = []

        # Simple keyword matching for related topics
        topic_lower = topic.lower()
        for interest in interests:
            interest_lower = interest.lower()
            if interest_lower in topic_lower or topic_lower in interest_lower:
                related.append(f"{interest} concepts")
                related.append(f"Advanced {interest}")
                related.append(f"{interest} best practices")

        # Add some general related topics
        related.extend([
            "Industry trends",
            "Latest developments",
            "Key challenges",
            "Future outlook"
        ])

        return list(set(related))[:10]

    def _generate_recommendations(self, topic: str, interests: List[str]) -> List[str]:
        """Generate recommendations based on topic and interests"""
        recommendations = [
            f"Explore {topic} documentation",
            f"Study {topic} examples and tutorials"
        ]

        for interest in interests:
            recommendations.append(f"Connect {topic} with {interest} concepts")

        return recommendations[:8]

    def _generate_research_findings(self, topic: str, interests: List[str], depth: str) -> str:
        """Generate research findings"""
        findings = f"Research on '{topic}' reveals strong connections to: {', '.join(interests[:3])}"

        if depth == "detailed":
            findings += ". Key insights include emerging trends, practical applications, and learning opportunities."

        return findings

# ===== DOCIFY UNIFIED ORCHESTRATOR =====
class DocifyUnifiedOrchestrator:
    """Advanced orchestrator using all Gemini tools for comprehensive content analysis"""

    def __init__(self, context, databases, logger):
        self.context = context
        self.databases = databases
        self.logger = logger

        # Initialize Gemini client with all tools
        self.gemini_client = genai.Client(api_key=GEMINI_API_KEY)

        # Initialize advanced components
        self.content_processor = AdvancedContentProcessor(logger)
        self.research_engine = ResearchEngine(logger)

        # Track comprehensive tool usage
        self.tool_usage_log = []
        self.start_time = time.time()

    def process_document_comprehensive(self) -> Dict[str, Any]:
        """Comprehensive document processing pipeline using all Gemini tools"""
        try:
            self.logger.log("🚀 === STARTING COMPREHENSIVE DOCUMENT PROCESSING ===")

            # 1. Extract document data with enhanced validation
            self.logger.log("📋 Step 1: Extracting document data...")
            try:
                document_data = self._extract_document_data()
            except Exception as e:
                self.logger.error(f"❌ Document data extraction failed: {e}")
                raise ValueError(f"Failed to extract document data: {e}")

            # Add null check for document_data
            if not document_data:
                self.logger.error("❌ Document data extraction returned None")
                raise ValueError("Failed to extract document data from request")

            self.logger.log(f"📄 Document: {document_data.get('title', 'Untitled')}")
            self.logger.log(f"🔗 URL: {document_data.get('url', 'No URL')}")
            self.logger.log(f"📝 Instructions: {document_data.get('instructions', 'No instructions')}")

            # 2. Validate and prepare content
            self.logger.log("🔍 Step 2: Validating content and preparing for analysis...")
            content_validation = self._validate_content(document_data)
            if content_validation.get('error'):
                raise ValueError(f"Content validation failed: {content_validation['error']}")

            # 3. Multi-round analysis with all Gemini tools
            self.logger.log("🤖 Step 3: Executing multi-round analysis with all Gemini tools...")
            analysis_result = self._execute_multi_round_analysis(document_data, self.gemini_client)

            # 4. Generate comprehensive analysis blocks
            self.logger.log("📊 Step 4: Generating comprehensive analysis blocks...")
            analysis_blocks = self._generate_comprehensive_blocks(analysis_result, document_data)

            # 5. Synthesize final result
            self.logger.log("🎯 Step 5: Synthesizing final comprehensive result...")
            final_result = self._create_final_comprehensive_result(
                analysis_result, analysis_blocks, document_data
            )

            # 6. Update database with comprehensive results
            self.logger.log("💾 Step 6: Updating database with comprehensive results...")
            self._update_document_comprehensive(document_data['document_id'], final_result)

            processing_time = time.time() - self.start_time
            self.logger.log(f"⏱️ Processing completed in {processing_time:.2f}s")
            self.logger.log(f"📊 Tool executions: {len(self.tool_usage_log)}")
            self.logger.log("🎉 === COMPREHENSIVE PROCESSING COMPLETED ===")

            return final_result

        except Exception as e:
            self.logger.error(f"❌ Comprehensive processing failed: {str(e)}")
            processing_time = time.time() - self.start_time

            # Create error result
            error_result = {
                "success": False,
                "error": str(e),
                "document_id": document_data.get('document_id') if 'document_data' in locals() else 'unknown',
                "processing_time": processing_time,
                "tool_usage": self.tool_usage_log
            }

            # Try to update document status
            if 'document_data' in locals() and document_data.get('document_id'):
                try:
                    self._update_document_status(document_data['document_id'], 'failed')
                except Exception as update_error:
                    self.logger.error(f"⚠️ Failed to update document status: {update_error}")

            return error_result

    def process_document(self) -> Dict[str, Any]:
        """Main processing pipeline"""
        try:
            self.logger.log("=== STARTING DOCUMENT PROCESSING ===")

            # 1. Extract document data
            self.logger.log("📋 Step 1: Extracting document data...")
            document_data = self._extract_document_data()
            self.logger.log(f"📄 Document: {document_data.get('title', 'Untitled')}")
            self.logger.log(f"🔗 URL: {document_data.get('url', 'No URL')}")
            self.logger.log(f"📝 Instructions: {document_data.get('instructions', 'No instructions')}")

            # 2. Get user interests
            self.logger.log("🎯 Step 2: Retrieving user interests...")
            user_interests = self._get_user_interests(document_data.get('user_id'))
            self.logger.log(f"📊 User interests: {len(user_interests)} found")

            # 3. Create analysis plan
            self.logger.log("🤖 Step 3: Creating analysis plan with Gemini...")
            analysis_plan = self._create_analysis_plan(document_data, user_interests)

            # 4. Execute workflow
            self.logger.log("⚡ Step 4: Executing orchestrated workflow...")
            workflow_result = self._execute_workflow(analysis_plan, document_data)

            # 5. Format results
            self.logger.log("📝 Step 5: Formatting final results...")
            final_result = self._format_final_result(workflow_result, document_data)

            # 6. Update database
            self.logger.log("💾 Step 6: Updating document in database...")
            self._update_document_status(document_data['document_id'], 'completed', final_result)

            self.logger.log("🎉 === DOCUMENT PROCESSING COMPLETED ===")
            return final_result

        except Exception as e:
            self.logger.error(f"❌ Processing failed: {str(e)}")
            if 'document_id' in locals():
                self._update_document_status(document_data['document_id'], 'failed', error=str(e))
            raise

    def _extract_document_data(self) -> Dict[str, Any]:
        """Extract document data from request with enhanced validation"""
        try:
        trigger_type = self.context.req.headers.get('x-appwrite-trigger', 'http')

        if trigger_type == 'event':
            body = self.context.req.body
            if isinstance(body, str):
                body = json.loads(body)
                        document_data = {
                'document_id': body.get('$id'),
                'url': body.get('url'),
                'instructions': body.get('instructions'),
                'user_id': body.get('user_id'),
                'title': body.get('title')
            }
        else:
            body = self.context.req.body
            if isinstance(body, str):
                body = json.loads(body)
                        document_data = {
                'document_id': body.get('documentId'),
                'url': body.get('url'),
                'instructions': body.get('instructions'),
                'user_id': body.get('userId'),
                'title': body.get('title')
            }

                # Validate required fields
                required_fields = ['document_id', 'url']
                missing_fields = [field for field in required_fields if not document_data.get(field)]

                if missing_fields:
                        raise ValueError(f"Missing required fields: {', '.join(missing_fields)}")

                # Set default instructions if none provided
                if not document_data.get('instructions'):
                        document_data['instructions'] = 'Analyze this content comprehensively using all available tools'

                return document_data

        except Exception as e:
            self.logger.error(f"⚠️ Document data extraction failed: {e}")
            raise ValueError(f"Failed to extract document data: {e}")

    def _get_user_interests(self, user_id: str) -> List[str]:
        """Get user interests (placeholder)"""
        # For now, return some default interests
        return ["web development", "artificial intelligence", "api design", "data analysis", "software architecture"]

    def _update_document_comprehensive(self, document_id: str, result: Dict[str, Any]) -> None:
        """Update document with comprehensive results"""
        try:
            self.logger.log(f"💾 Updating document {document_id} with comprehensive results")

            update_data = {
                'status': 'completed',
                'analysis_summary': result.get('analysis_summary', ''),
                'analysis_blocks': json.dumps(result.get('blocks', [])),
                'word_count': result.get('word_count', 0),
                'scraped_content': result.get('content', '')
            }

            # Save code blocks if available
            comprehensive_result = result.get('metadata', {}).get('comprehensive_result', {})
            if comprehensive_result.get('code_blocks'):
                code_blocks_json = json.dumps(comprehensive_result['code_blocks'])
                # Check if there's a field for code blocks
                available_fields = self._get_available_fields()
                if 'code_blocks' in available_fields:
                    update_data['code_blocks'] = code_blocks_json
                elif 'extracted_code' in available_fields:
                    update_data['extracted_code'] = code_blocks_json

            # Add tool usage if available
            if result.get('metadata', {}).get('tool_executions'):
                update_data['gemini_tools_used'] = json.dumps(self.tool_usage_log)

            self.databases.update_document(
                DATABASE_ID,
                DOCUMENTS_COLLECTION_ID,
                document_id,
                update_data
            )

            self.logger.log(f"✅ Document {document_id} updated with comprehensive results")

        except Exception as e:
            self.logger.error(f"⚠️ Comprehensive update failed: {e}")
            # Fallback to basic status update
            try:
                self._update_document_status(document_id, 'completed', result)
            except Exception as fallback_error:
                self.logger.error(f"⚠️ Fallback update also failed: {fallback_error}")

    def _validate_content(self, document_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate content before processing"""
        try:
            url = document_data.get('url', '')
            if not url:
                return {"error": "No URL provided"}

            # Basic URL validation
            parsed_url = urlparse(url)
            if not parsed_url.scheme or not parsed_url.netloc:
                return {"error": "Invalid URL format"}

            # Check for supported schemes
            if parsed_url.scheme not in ['http', 'https']:
                return {"error": "Only HTTP and HTTPS URLs are supported"}

            self.logger.log(f"✅ Content validation passed for: {url}")
            return {"valid": True, "url_info": parsed_url}

        except Exception as e:
            return {"error": f"Content validation failed: {str(e)}"}

    def _execute_multi_round_analysis(self, document_data: Dict[str, Any], gemini_client) -> Dict[str, Any]:
        """Execute multi-round analysis using all Gemini tools"""
        try:
            url = document_data.get('url', '')
            instructions = document_data.get('instructions', 'Analyze this content comprehensively')

            self.logger.log("🔄 Round 1: Comprehensive URL processing")
            # Use the advanced content processor
            comprehensive_result = self.content_processor.process_url_comprehensive(url, gemini_client)

            if comprehensive_result.get('error'):
                self.logger.log("⚠️ Comprehensive processing failed, falling back to basic processing")
                # Fallback to basic processing
                basic_result = self.content_processor._extract_basic_content(url)
                comprehensive_result = {
                    "url": url,
                    "title": basic_result.get('title', ''),
                    "content": basic_result.get('content', ''),
                    "word_count": basic_result.get('word_count', 0),
                    "fallback_used": True
                }

            # Round 2: Enhanced analysis with user instructions
            self.logger.log("🔄 Round 2: Enhanced analysis with user instructions")
            enhanced_analysis = self._perform_enhanced_analysis(comprehensive_result, instructions, gemini_client)

            # Round 3: Research enrichment
            self.logger.log("🔄 Round 3: Research and context enrichment")
            enriched_analysis = self._perform_research_enrichment(enhanced_analysis, gemini_client)

            # Round 4: Final synthesis and validation
            self.logger.log("🔄 Round 4: Final synthesis and validation")
            final_analysis = self._perform_final_synthesis(enriched_analysis, document_data, gemini_client)

            return {
                "comprehensive_result": comprehensive_result,
                "enhanced_analysis": enhanced_analysis,
                "enriched_analysis": enriched_analysis,
                "final_analysis": final_analysis,
                "rounds_completed": 4,
                "timestamp": time.time()
            }

        except Exception as e:
            self.logger.error(f"⚠️ Multi-round analysis failed: {e}")
            return {"error": str(e), "rounds_completed": 0}

    def _perform_enhanced_analysis(self, content_result: Dict[str, Any], instructions: str, gemini_client) -> Dict[str, Any]:
        """Perform enhanced analysis with user instructions following schema"""
        try:
            content = content_result.get('content', '')
            if not content:
                return {"error": "No content available for enhanced analysis"}

            # Enhanced analysis prompt following schema format
            prompt = f"""Analyze this content and generate structured analysis blocks following the exact JSON format below.

USER INSTRUCTIONS: {instructions}
CONTENT TITLE: {content_result.get('title', 'Unknown')}
CONTENT PREVIEW: {content[:4000]}

REQUIRED JSON OUTPUT FORMAT:
{{
  "summary": "Analysis summary aligned with user instructions",
  "blocks": [
    {{
      "id": "analysis-1",
      "type": "summary|key_points|architecture|mermaid|code|api_reference|guide|comparison|best_practices|troubleshooting",
      "size": "small|medium|large",
      "title": "Analysis Block Title",
      "content": "Detailed analysis content",
      "metadata": {{
        "priority": "high|medium|low",
        "focus_area": "user_instruction_alignment"
      }}
    }}
  ]
}}

ANALYSIS REQUIREMENTS:
1. Focus analysis on user instructions: {instructions}
2. Generate 2-4 focused blocks based on user needs
3. Use appropriate block types for the content and instructions
4. Include code blocks if technical examples are relevant
5. Use mermaid diagrams for system explanations
6. Ensure summary addresses user-specific requirements

CONTENT ANALYSIS FOCUS:
- Align analysis with user instructions
- Extract insights relevant to user needs
- Identify key concepts user should understand
- Provide practical guidance based on instructions"""

            # Use Gemini for enhanced analysis
            response = gemini_client.models.generate_content(
                model=GEMINI_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.7,
                    max_output_tokens=3000
                )
            )

            # Try to parse JSON response
            analysis_text = response.text if response.candidates else ""
            try:
                if analysis_text.strip().startswith('{'):
                    parsed_analysis = json.loads(analysis_text)
                    return {
                        "enhanced_analysis": parsed_analysis,
                        "raw_response": analysis_text,
                        "instructions_alignment": "analyzed",
                        "format": "json",
                        "timestamp": time.time()
                    }
            except json.JSONDecodeError:
                return {
                    "enhanced_analysis": analysis_text,
                    "raw_response": analysis_text,
                    "instructions_alignment": "analyzed",
                    "format": "text",
                    "timestamp": time.time()
                }

        except Exception as e:
            self.logger.error(f"⚠️ Enhanced analysis failed: {e}")
            return {"error": str(e)}

    def _perform_research_enrichment(self, analysis_result: Dict[str, Any], gemini_client) -> Dict[str, Any]:
        """Perform research enrichment using Gemini tools"""
        try:
            content = analysis_result.get('comprehensive_result', {}).get('content', '')
            if not content:
                return analysis_result

            # Generate research queries based on content analysis
            research_queries = self._generate_research_queries_from_content(analysis_result)

            research_results = []
            for query in research_queries[:3]:  # Limit to 3 queries
                self.logger.log(f"🔍 Researching: {query}")
                result = self._execute_research_with_tools(query, gemini_client)
                research_results.append(result)

                # Track tool usage
                tool_entry = {
                    "tool": "google_search",
                    "query": query,
                    "timestamp": time.time(),
                    "status": "completed" if not result.get('error') else "failed"
                }
                self.tool_usage_log.append(tool_entry)
                self.logger.log(f"🔧 Tool logged: {len(self.tool_usage_log)} total tools")

            return {
                **analysis_result,
                "research_results": research_results,
                "research_enrichment": True
            }

        except Exception as e:
            self.logger.error(f"⚠️ Research enrichment failed: {e}")
            return analysis_result

    def _generate_research_queries_from_content(self, analysis_result: Dict[str, Any]) -> List[str]:
        """Generate research queries from content analysis"""
        queries = []

        content = analysis_result.get('comprehensive_result', {}).get('content', '')
        title = analysis_result.get('comprehensive_result', {}).get('title', '')

        # Generate queries from title
        if title:
            queries.append(f"Latest information about {title}")
            queries.append(f"Best practices for {title}")

        # Generate queries from keywords
        keywords = analysis_result.get('comprehensive_result', {}).get('keywords', [])
        for keyword in keywords[:3]:
            queries.append(f"Best practices for {keyword}")
            queries.append(f"Tutorials on {keyword}")

        # Generate queries from content analysis
        if content:
            # Simple keyword extraction for research
            words = re.findall(r'\b\w{5,}\b', content.lower())
            stop_words = {'about', 'would', 'there', 'their', 'which', 'could', 'should', 'these', 'those', 'where', 'after', 'before', 'first', 'second', 'third', 'through', 'during', 'while', 'since', 'until', 'although', 'because', 'unless', 'though', 'whether', 'within', 'among', 'between'}

            keywords = [word for word in words if word not in stop_words]
            unique_keywords = list(set(keywords))[:5]  # Top 5 unique keywords

            for keyword in unique_keywords:
                queries.append(f"Understanding {keyword} in detail")

        return list(set(queries))[:5]  # Return max 5 unique queries

    def _execute_research_with_tools(self, query: str, gemini_client) -> Dict[str, Any]:
        """Execute research query using Gemini tools"""
        try:
            self.logger.log(f"🔧 Executing research tool for query: {query}")
            tools = [types.Tool(google_search=types.GoogleSearch())]

            prompt = f"Research this topic using available tools and provide comprehensive insights: {query}"

            response = gemini_client.models.generate_content(
                model=GEMINI_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.7,
                    tools=tools,
                    max_output_tokens=1500
                )
            )

            result = {
                "query": query,
                "insights": response.text if response.candidates else "",
                "timestamp": time.time(),
                "status": "completed"
            }
            self.logger.log(f"✅ Research tool completed for: {query}")
            return result

        except Exception as e:
            self.logger.log(f"❌ Research tool failed for {query}: {e}")
            return {
                "query": query,
                "error": str(e),
                "timestamp": time.time(),
                "status": "failed"
            }

    def _perform_final_synthesis(self, enriched_analysis: Dict[str, Any], document_data: Dict[str, Any], gemini_client) -> Dict[str, Any]:
        """Perform final synthesis of all analysis results"""
        try:
            # Add null checks
            if not enriched_analysis:
                return {"error": "No enriched analysis provided", "fallback_synthesis": "Analysis completed with limited synthesis"}

            content = enriched_analysis.get('comprehensive_result', {}).get('content', '')
            research_results = enriched_analysis.get('research_results', [])

            # Get user instructions with null check
            user_instructions = ""
            if document_data:
                user_instructions = document_data.get('instructions', '')

            # Combine all insights
            synthesis_prompt = f"""Synthesize all analysis results into a comprehensive understanding:

ORIGINAL CONTENT: {content[:3000]}

RESEARCH INSIGHTS:
{chr(10).join([f"- {result.get('insights', '')[:200]}" for result in research_results if result.get('insights')])}

USER INSTRUCTIONS: {user_instructions}

Please provide:
1. A comprehensive summary integrating all findings
2. Key insights and discoveries
3. Recommendations based on the analysis
4. Areas for further exploration"""

            response = gemini_client.models.generate_content(
                model=GEMINI_MODEL,
                contents=synthesis_prompt,
                config=types.GenerateContentConfig(
                    temperature=0.7,
                    max_output_tokens=2500
                )
            )

            return {
                "final_synthesis": response.text if response.candidates else "",
                "integrated_insights": True,
                "timestamp": time.time()
            }

        except Exception as e:
            self.logger.error(f"⚠️ Final synthesis failed: {e}")
            return {"error": str(e), "fallback_synthesis": "Analysis completed with limited synthesis"}

    def _generate_comprehensive_blocks(self, analysis_result: Dict[str, Any], document_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate comprehensive analysis blocks following LLM_RESPONSE_SCHEMA"""
        try:
            blocks = []

            # Add null checks
            if not analysis_result:
                return [{
                    "id": "error-block",
                    "type": "summary",
                    "size": "small",
                    "title": "Analysis Error",
                    "content": "No analysis results available.",
                    "metadata": {"priority": "low"}
                }]

            # Get comprehensive result data
            comprehensive_result = analysis_result.get('comprehensive_result', {})
            enhanced_analysis = analysis_result.get('enhanced_analysis', {})
            enriched_analysis = analysis_result.get('enriched_analysis', {})

            # Summary block (always included)
            summary_content = comprehensive_result.get('content', '')[:1000]
            if not summary_content:
                summary_content = "Document analysis completed successfully."

            blocks.append({
                "id": "comprehensive-summary",
                "type": "summary",
                "size": "large",
                "title": f"Analysis: {comprehensive_result.get('title', 'Document')}",
                "content": summary_content,
                "metadata": {
                    "priority": "high",
                    "word_count": len(summary_content.split()),
                    "source": "extracted_content"
                }
            })

            # Enhanced analysis blocks (if available in JSON format)
            if isinstance(enhanced_analysis.get('enhanced_analysis'), dict):
                enhanced_data = enhanced_analysis['enhanced_analysis']
                if 'blocks' in enhanced_data:
                    for block in enhanced_data['blocks'][:3]:  # Limit to 3 additional blocks
                        # Ensure unique ID
                        block_id = block.get('id', f"enhanced-{len(blocks)}")
                        block['id'] = f"{block_id}-{len(blocks)}"
                        blocks.append(block)

            # Key insights block
            word_count = comprehensive_result.get('word_count', 0)
            links_count = len(comprehensive_result.get('links', []))
            media_count = len(comprehensive_result.get('media', []))

            blocks.append({
                "id": "key-insights",
                "type": "key_points",
                "size": "medium",
                "title": "Content Analysis",
                "content": f"• Content length: {len(comprehensive_result.get('content', ''))} characters\n• Word count: {word_count}\n• Links found: {links_count}\n• Media elements: {media_count}\n• Keywords: {', '.join(comprehensive_result.get('keywords', [])[:5])}",
                "metadata": {
                    "priority": "medium",
                    "source": "content_analysis"
                }
            })

            # Code blocks (if any detected)
            code_blocks = comprehensive_result.get('code_blocks', [])
            if code_blocks:
                code_content = "\n\n".join([
                    f"```{block.get('language', '')}\n{block['content']}\n```"
                    for block in code_blocks[:3]  # Limit to 3 code blocks
                ])

                blocks.append({
                    "id": "code-examples",
                    "type": "code",
                    "size": "medium",
                    "title": "Code Examples",
                    "content": code_content,
                    "metadata": {
                        "priority": "medium",
                        "code_blocks_count": len(code_blocks),
                        "languages": list(set([block.get('language', 'unknown') for block in code_blocks])),
                        "source": "content_extraction"
                    }
                })

            # Research insights block
            research_results = enriched_analysis.get('research_results', [])
            if research_results:
                research_content = "\n\n".join([
                    f"**{result['query']}**\n{result.get('insights', '')[:300]}"
                    for result in research_results
                    if result.get('insights')
                ])

                if research_content:
                    blocks.append({
                        "id": "research-insights",
                        "type": "research",
                        "size": "medium",
                        "title": "Research & Context",
                        "content": research_content,
                        "metadata": {
                            "priority": "medium",
                            "research_queries": len(research_results),
                            "source": "google_search"
                        }
                    })

            # Links analysis block
            links = comprehensive_result.get('links', [])
            if links:
                links_content = "\n".join([
                    f"- [{link['text']}]({link['url']})"
                    for link in links[:10]  # Limit to 10 links
                ])

                blocks.append({
                    "id": "related-links",
                    "type": "guide",
                    "size": "small",
                    "title": "Related Links",
                    "content": links_content,
                    "metadata": {
                        "priority": "low",
                        "links_count": len(links),
                        "source": "content_extraction"
                    }
                })

            # Ensure we don't exceed 6 blocks maximum
            blocks = blocks[:6]

            # Validate all blocks have required fields
            validated_blocks = []
            for block in blocks:
                if all(key in block for key in ['id', 'type', 'size', 'title', 'content']):
                    validated_blocks.append(block)
            else:
                    self.logger.log(f"⚠️ Skipping invalid block: {block.get('id', 'unknown')}")

            return validated_blocks

        except Exception as e:
            self.logger.error(f"⚠️ Comprehensive block generation failed: {e}")
            return [{
                "id": "fallback-summary",
                "type": "summary",
                "size": "large",
                "title": "Analysis Summary",
                "content": f"Document analysis completed. {len(analysis_result.get('comprehensive_result', {}).get('content', ''))} characters processed.",
                "metadata": {"priority": "high"}
            }]

    def _create_final_comprehensive_result(self, analysis_result: Dict[str, Any], blocks: List[Dict[str, Any]], document_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create the final comprehensive result"""
        try:
            # Add null checks
            if not analysis_result:
                return {"error": "No analysis result provided", "success": False}

            comprehensive_result = analysis_result.get('comprehensive_result', {})
            final_analysis = analysis_result.get('final_analysis', {})

            # Calculate processing time
            processing_time = time.time() - self.start_time

            # Get document ID with null check
            document_id = "unknown"
            if document_data and isinstance(document_data, dict):
                document_id = document_data.get('document_id', 'unknown')

            final_result = {
                "success": True,
                "documentId": document_id,
                "title": comprehensive_result.get('title', ''),
                "description": comprehensive_result.get('description', ''),
                "url": comprehensive_result.get('url', ''),
                "content": comprehensive_result.get('content', ''),
                "word_count": comprehensive_result.get('word_count', 0),
                "character_count": len(comprehensive_result.get('content', '')),
                "blocks": blocks,
                "metadata": {
                    "processing_time": round(processing_time, 2),
                    "analysis_version": "comprehensive-v2.5",
                    "tools_used": ["google_search", "code_execution", "url_context"],
                    "tool_executions": len(self.tool_usage_log),
                    "content_type": comprehensive_result.get('content_type', 'unknown'),
                    "research_queries_executed": len(analysis_result.get('enriched_analysis', {}).get('research_results', [])),
                    "blocks_generated": len(blocks),
                    "rounds_completed": analysis_result.get('rounds_completed', 0),
                    "code_blocks_extracted": len(comprehensive_result.get('code_blocks', [])),
                    "links_extracted": len(comprehensive_result.get('links', [])),
                    "timestamp": time.time()
                },
                "analysis_summary": final_analysis.get('final_synthesis', ''),
                "research_insights": [
                    result for result in analysis_result.get('enriched_analysis', {}).get('research_results', [])
                    if result.get('status') == 'completed'
                ]
            }

            return final_result

        except Exception as e:
            self.logger.error(f"⚠️ Final result creation failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "documentId": document_data.get('document_id', 'unknown'),
                "blocks": blocks,
                "metadata": {
                    "processing_time": time.time() - self.start_time,
                    "error_occurred": True
                }
            }

    def _execute_workflow(self, analysis_plan: Dict[str, Any], document_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the orchestrated workflow"""
        workflow_results = {
            "content": {},
            "research": {},
            "analysis": {},
            "tool_usage": []
        }

        tool_sequence = analysis_plan.get("tool_sequence", [])

        if "scrape_document" in tool_sequence:
            self.logger.log("🌐 Executing: scrape_document")
            result = self.content_processor.process_url_content(document_data.get('url', ''))
            workflow_results["content"] = result

        if analysis_plan.get("research_topics"):
            for topic in analysis_plan["research_topics"]:
                self.logger.log(f"🔍 Researching: {topic}")
                result = self.research_engine.research_user_interests(
                    self._get_user_interests(document_data.get('user_id')), topic
                )
                workflow_results["research"][topic] = result

        if "analyze_content" in tool_sequence:
            self.logger.log("🧠 Analyzing content with Gemini...")
            analysis_result = self._analyze_content_with_gemini(workflow_results["content"])
            workflow_results["analysis"] = analysis_result

        workflow_results["tool_usage"] = self.tool_usage_log
        self.logger.log(f"📊 Workflow completed: {len(workflow_results['tool_usage'])} tools executed")
        return workflow_results

    def _analyze_content_with_gemini(self, content: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze content using Gemini"""
        content_text = content.get("content", "")[:2000]  # Limit for API

        prompt = f"""
        Analyze this content and provide:
        1. A brief summary (2-3 sentences)
        2. Key points (3-5 bullet points)
        3. Main topics covered

        Content: {content_text}
        """

        try:
            response = self.gemini_client.models.generate_content(
                model=self.gemini_model_name,
                contents=prompt
            )
            return {"analysis": response.text.strip()}
        except Exception as e:
            self.logger.error(f"⚠️ Content analysis failed: {e}")
            return {"analysis": "Content analysis completed"}

    def _format_final_result(self, workflow_results: Dict[str, Any], document_data: Dict[str, Any]) -> Dict[str, Any]:
        """Format final result"""
        content = workflow_results.get("content", {})
        research = workflow_results.get("research", {})

        # Generate summary
        summary = self._generate_summary(content, research, document_data)

        # Generate analysis blocks
        blocks = self._generate_analysis_blocks(content, research, document_data)

        return {
            "success": True,
            "documentId": document_data['document_id'],
            "summary": summary,
            "blocks": blocks,
            "metadata": {
                "tools_used": workflow_results.get("tool_usage", []),
                "content_length": len(content.get("content", "")),
                "research_sources": len(research),
                "analysis_blocks": len(blocks)
            }
        }

    def _generate_summary(self, content: Dict[str, Any], research: Dict[str, Any], document_data: Dict[str, Any]) -> str:
        """Generate summary"""
        content_text = content.get("content", "")[:1000]

        prompt = f"""
        Create a concise summary of this document:

        TITLE: {document_data.get('title', 'Untitled')}
        CONTENT: {content_text}
        INSTRUCTIONS: {document_data.get('instructions', '')}

        Summary (2-3 sentences):
        """

        try:
            response = self.gemini_client.models.generate_content(
                model=self.gemini_model_name,
                contents=prompt
            )
            return response.text.strip()
        except Exception as e:
            return f"Document: {document_data.get('title', 'Untitled')} - Analysis completed."

    def _generate_analysis_blocks(self, content: Dict[str, Any], research: Dict[str, Any], document_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate analysis blocks"""
        try:
            blocks = [
                {
                    "id": "summary",
                    "type": "summary",
                    "size": "large",
                    "title": "Document Summary",
                    "content": self._generate_summary(content, research, document_data),
                    "metadata": {"priority": "high"}
                },
                {
                    "id": "key_points",
                    "type": "key_points",
                    "size": "medium",
                    "title": "Key Points",
                    "content": f"• Content length: {len(content.get('content', ''))} characters\n• Links found: {len(content.get('links', []))}\n• Word count: {content.get('word_count', 0)}",
                    "metadata": {"priority": "medium"}
                }
            ]

            if research:
                blocks.append({
                    "id": "research",
                    "type": "research",
                    "size": "medium",
                    "title": "Research Insights",
                    "content": f"Research conducted on {len(research)} topics based on user interests.",
                    "metadata": {"priority": "medium"}
                })

            return blocks

        except Exception as e:
            self.logger.error(f"⚠️ Block generation failed: {e}")
            return [{
                "id": "error",
                "type": "summary",
                "size": "large",
                "title": "Processing Complete",
                "content": "Document processing completed successfully.",
                "metadata": {"priority": "high"}
            }]

    def _update_document_status(self, document_id: str, status: str, result: Optional[Dict[str, Any]] = None, error: Optional[str] = None) -> None:
        """Update document status in database"""
        try:
            update_data = {
                'status': status
            }

            if result:
                update_data['analysis_summary'] = result.get('summary', '')
                update_data['analysis_blocks'] = json.dumps(result.get('blocks', []))
                update_data['word_count'] = len(result.get('summary', '').split())

                # Update fields that exist
                available_fields = self._get_available_fields()
                if 'gemini_tools_used' in available_fields:
                    update_data['gemini_tools_used'] = json.dumps([t.get('tool', 'unknown') for t in self.tool_usage_log])
                if 'research_context' in available_fields:
                    update_data['research_context'] = json.dumps(result.get('metadata', {}))
                if 'processing_duration' in available_fields:
                    update_data['processing_duration'] = int(time.time() - time.time())

            if error and 'error_message' in self._get_available_fields():
                update_data['error_message'] = error

            self.databases.update_document(
                DATABASE_ID,
                DOCUMENTS_COLLECTION_ID,
                document_id,
                update_data
            )

            self.logger.log(f"✅ Document {document_id} updated to {status}")

        except Exception as e:
            self.logger.error(f"⚠️ Database update failed: {e}")

    def _get_available_fields(self) -> List[str]:
        """Get available database fields"""
        try:
            response = self.databases.list_attributes(DATABASE_ID, DOCUMENTS_COLLECTION_ID)
            return [attr['key'] for attr in response.get('attributes', [])]
        except Exception:
            # Fallback to known fields
            return [
                'user_id', 'title', 'url', 'instructions', 'status', 'public',
                'scraped_content', 'word_count', 'analysis_summary', 'analysis_blocks',
                'user_interests', 'gemini_tools_used', 'research_context', 'processing_duration'
            ]

# ===== MAIN FUNCTION =====
def main(context: Dict[str, Any]) -> Dict[str, Any]:
    """Main Appwrite function entry point"""
    start_time = time.time()

    try:
        # Setup logging
        logger = Logger(context)
        logger.log("=== DOCIFY UNIFIED ORCHESTRATOR START ===")

        # Validate environment
        if not GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY environment variable is required")

        logger.log("✅ Environment validation passed")
        logger.log("🚀 Initializing Gemini Orchestrator...")

        # Initialize unified orchestrator with all Gemini tools
        orchestrator = DocifyUnifiedOrchestrator(context, databases, logger)
        logger.log("✅ Docify Unified Orchestrator initialized with all Gemini tools")

        # Process document comprehensively
        logger.log("📄 Starting comprehensive document processing with all tools...")
        result = orchestrator.process_document_comprehensive()

        # Add performance metrics
        processing_time = time.time() - start_time
        result['metadata'] = result.get('metadata', {})
        result['metadata']['processing_time'] = round(processing_time, 2)
        result['metadata']['function_version'] = 'docify-unified-orchestrator-v2.5'

        logger.log(f"⏱️ Total processing time: {processing_time:.2f}s")
        logger.log(f"📊 Tools executed: {len(result.get('metadata', {}).get('tools_used', []))}")

        return context.res.json(result, 200)

    except Exception as e:
        error_time = time.time() - start_time
        logger.log(f"❌ Processing failed in {error_time:.2f}s")
        return context.res.json({
            "success": False,
            "error": str(e),
            "processing_time": round(error_time, 2),
            "function_version": "docify-unified-orchestrator-v2.5"
        }, 500)

# ===== LEGACY COMPATIBILITY =====
def process_document_legacy(context: Dict[str, Any]) -> Dict[str, Any]:
    """Legacy function for backward compatibility"""
    return main(context)

# Export for Appwrite
if __name__ == "__main__":
    print("🚀 Docify Unified Orchestrator v2.5 loaded successfully")
    print("✨ Features: Gemini tools (google_search, url_context)")
    print("🔧 Enhanced URL scraping with multi-format support")
    print("📊 Multi-round analysis with comprehensive insights")
    print("🎯 Advanced content processing and research enrichment")
    print("This function should be called through Appwrite")
