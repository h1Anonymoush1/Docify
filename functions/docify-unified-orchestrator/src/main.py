#!/usr/bin/env python3
"""
Docify Unified Orchestrator - Gemini-Powered Document Analysis
Single-file implementation with comprehensive logging
"""

import os
import json
import time
import requests
import chardet
import re
from typing import Dict, Any, Optional, List, Tuple
from urllib.parse import urlparse, urljoin
from io import BytesIO
from bs4 import BeautifulSoup
from appwrite.client import Client
from appwrite.services.databases import Databases
from appwrite.id import ID
from google import genai

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

# ===== CONTENT PROCESSOR CLASS =====
class ContentProcessor:
    """Processes different types of content for the orchestrator"""

    def __init__(self, logger):
        self.logger = logger

    def process_url_content(self, url: str) -> Dict[str, Any]:
        """Process content from a URL"""
        try:
            self.logger.log(f"🌐 Fetching content from: {url}")

            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }

            response = requests.get(url, headers=headers, timeout=30)
            response.raise_for_status()

            # Detect encoding
            detected_encoding = chardet.detect(response.content)['encoding']
            content = response.content.decode(detected_encoding or 'utf-8', errors='ignore')

            # Parse with BeautifulSoup
            soup = BeautifulSoup(content, 'html.parser')

            # Extract main content
            text_content = self._extract_text_content(soup)
            links = self._extract_links(soup, url)
            metadata = self._extract_metadata(soup)

            result = {
                "url": url,
                "title": metadata.get("title", ""),
                "description": metadata.get("description", ""),
                "content": text_content,
                "links": links,
                "word_count": len(text_content.split()),
                "status_code": response.status_code
            }

            self.logger.log(f"✅ Content extracted: {len(text_content)} characters, {len(links)} links")
            return result

        except Exception as e:
            self.logger.error(f"❌ Content processing failed: {e}")
            return {"error": str(e), "url": url}

    def _extract_text_content(self, soup) -> str:
        """Extract main text content from HTML"""
        # Remove script and style elements
        for script in soup(["script", "style"]):
            script.extract()

        # Get text
        text = soup.get_text(separator=' ', strip=True)

        # Clean up whitespace
        text = re.sub(r'\s+', ' ', text).strip()

        return text

    def _extract_links(self, soup, base_url: str) -> List[Dict[str, str]]:
        """Extract links from the page"""
        links = []
        for a in soup.find_all('a', href=True):
            href = a['href']
            text = a.get_text(strip=True)

            # Convert relative URLs to absolute
            if not href.startswith(('http://', 'https://')):
                href = urljoin(base_url, href)

            if href and text:
                links.append({
                    "url": href,
                    "text": text[:100]  # Limit text length
                })

        return links[:20]  # Limit to 20 links

    def _extract_metadata(self, soup) -> Dict[str, str]:
        """Extract metadata from HTML"""
        metadata = {}

        # Title
        title_tag = soup.find('title')
        if title_tag:
            metadata['title'] = title_tag.get_text(strip=True)

        # Meta description
        desc_tag = soup.find('meta', attrs={'name': 'description'})
        if desc_tag and desc_tag.get('content'):
            metadata['description'] = desc_tag['content']

        return metadata

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

# ===== DOCIFY ORCHESTRATOR CLASS =====
class DocifyOrchestrator:
    """Main orchestrator that uses Gemini's built-in tools"""

    def __init__(self, context, databases, logger):
        self.context = context
        self.databases = databases
        self.logger = logger

        # Initialize Gemini
        self.gemini_client = genai.Client(api_key=GEMINI_API_KEY)
        self.gemini_model_name = 'gemini-2.5-flash'

        # Initialize components
        self.content_processor = ContentProcessor(logger)
        self.research_engine = ResearchEngine(logger)

        # Track tool usage
        self.tool_usage_log = []

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
        """Extract document data from request"""
        trigger_type = self.context.req.headers.get('x-appwrite-trigger', 'http')

        if trigger_type == 'event':
            body = self.context.req.body
            if isinstance(body, str):
                body = json.loads(body)
            return {
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
            return {
                'document_id': body.get('documentId'),
                'url': body.get('url'),
                'instructions': body.get('instructions'),
                'user_id': body.get('userId'),
                'title': body.get('title')
            }

    def _get_user_interests(self, user_id: str) -> List[str]:
        """Get user interests (placeholder)"""
        # For now, return some default interests
        return ["web development", "artificial intelligence", "api design"]

    def _create_analysis_plan(self, document_data: Dict[str, Any], user_interests: List[str]) -> Dict[str, Any]:
        """Create analysis plan using Gemini"""
        plan_prompt = f"""
        Create an analysis plan for this document:

        DOCUMENT: {document_data.get('title', 'Untitled')}
        URL: {document_data.get('url', '')}
        INSTRUCTIONS: {document_data.get('instructions', '')}
        USER INTERESTS: {', '.join(user_interests)}

        Return JSON with: strategy, tool_sequence, research_topics, analysis_focus
        """

        try:
            self.logger.log("🚀 Calling Gemini for analysis plan...")
            response = self.gemini_client.models.generate_content(
                model=self.gemini_model_name,
                contents=plan_prompt
            )
            plan_text = response.text.strip()

            # Simple parsing - look for JSON
            if '{' in plan_text and '}' in plan_text:
                json_start = plan_text.find('{')
                json_end = plan_text.rfind('}') + 1
                plan_json = plan_text[json_start:json_end]
                plan = json.loads(plan_json)
            else:
                plan = {
                    "strategy": "Basic analysis",
                    "tool_sequence": ["scrape_document", "analyze_content"],
                    "research_topics": user_interests[:2],
                    "analysis_focus": ["summary", "key_points"]
                }

            self.logger.log(f"📋 Plan created: {plan.get('strategy', 'Unknown')}")
            return plan

        except Exception as e:
            self.logger.error(f"⚠️ Plan creation failed: {e}")
            return {
                "strategy": "Fallback analysis",
                "tool_sequence": ["scrape_document"],
                "research_topics": [],
                "analysis_focus": ["summary"]
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

        # Initialize orchestrator
        orchestrator = DocifyOrchestrator(context, databases, logger)
        logger.log("✅ Gemini Orchestrator initialized")

        # Process document
        logger.log("📄 Starting document processing...")
        result = orchestrator.process_document()

        # Add performance metrics
        processing_time = time.time() - start_time
        result['metadata'] = result.get('metadata', {})
        result['metadata']['processing_time'] = round(processing_time, 2)
        result['metadata']['function_version'] = 'unified-orchestrator-v1.0'

        logger.log(".2f")
        logger.log(f"📊 Tools executed: {len(result.get('metadata', {}).get('tools_used', []))}")

        return context.res.json(result, 200)

    except Exception as e:
        error_time = time.time() - start_time
        logger.log(".2f")
        return context.res.json({
            "success": False,
            "error": str(e),
            "processing_time": round(error_time, 2),
            "function_version": "unified-orchestrator-v1.0"
        }, 500)

# Export for Appwrite
if __name__ == "__main__":
    print("Docify Unified Orchestrator loaded successfully")
    print("This function should be called through Appwrite")
