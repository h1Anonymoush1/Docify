# Docify Unified Orchestrator

A revolutionary document analysis function that leverages Google's Gemini AI as the central orchestrator, utilizing built-in tools for comprehensive web scraping, research, and content analysis.

## 🎯 **Core Innovation**

Unlike traditional document processors, this function uses **Gemini as the central AI orchestrator** that:
- **Analyzes requests** and decides what tools to use
- **Orchestrates workflows** by calling appropriate tools
- **Synthesizes results** from multiple tools into coherent analysis
- **Learns from user interests** to provide personalized research

## 🏗️ **Architecture**

### **Multi-File Structure**
```
docify-unified-orchestrator/
├── src/
│   ├── main.py                    # Entry point - Appwrite calls this
│   ├── gemini_orchestrator.py     # Core Gemini orchestration logic
│   ├── custom_tools.py            # Custom tools Gemini can call
│   ├── content_processor.py       # Multi-format content processing
│   ├── research_engine.py         # User interests & research
│   └── utils.py                   # Shared utilities & helpers
├── requirements.txt
├── package.json
└── README.md
```

### **Tool Ecosystem**

#### **Built-in Gemini Tools (Always Available)**
- 🔍 **Google Search**: Research related topics and find additional context
- 💻 **Code Execution**: Test and validate code examples found in documents
- 🌐 **URL Context**: Enhanced content analysis with web context

#### **Custom Tools (Gemini Orchestrates)**
- 📄 **Document Scraper**: Extract content from various file types (PDF, Word, Excel, etc.)
- 🔬 **Content Analyzer**: Analyze content structure and suggest visualizations
- 🎯 **Interest Researcher**: Research topics based on user interests
- 💾 **Code Extractor**: Extract and categorize code examples

## 🚀 **Key Features**

### **Intelligent Orchestration**
- **Smart Tool Selection**: Gemini analyzes content and user interests to choose optimal tools
- **Workflow Optimization**: Tools are called in the most efficient sequence
- **Context Awareness**: Each tool call includes relevant context from previous operations

### **Comprehensive Content Support**
- **📄 Documents**: PDF, Word (.doc, .docx), Excel (.xls, .xlsx), CSV, TXT, Markdown
- **🌐 Web Content**: HTML, XML, RSS/Atom feeds, JSON APIs
- **📊 Structured Data**: JSON, XML, CSV spreadsheets
- **📝 Text Files**: Plain text, Markdown, configuration files

### **User Interest Integration**
- **Personalized Research**: Automatically researches topics based on user interests
- **Context Enhancement**: Research results are integrated into final analysis
- **Relevance Scoring**: Content is scored based on user interest alignment

### **Advanced Analysis Capabilities**
- **Multi-Block Generation**: Creates 3-6 analysis blocks with different visualization types
- **Smart Prioritization**: Prioritizes blocks based on content analysis and user instructions
- **Grid Optimization**: Automatically sizes blocks for optimal 3x3 grid layout

## 🔧 **Setup & Installation**

### **1. Environment Variables**
```bash
# Required
GEMINI_API_KEY=your_gemini_api_key
DATABASE_ID=docify_db
DOCUMENTS_COLLECTION_ID=documents_table
APPWRITE_FUNCTION_API_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_FUNCTION_PROJECT_ID=your_project_id

# Optional
ANALYSIS_COLLECTION_ID=analysis_results
MAX_CONTENT_LENGTH=50000
MAX_TOOL_EXECUTIONS=10
```

### **2. Install Dependencies**
```bash
cd functions/docify-unified-orchestrator
pip install -r requirements.txt
```

### **3. Deploy to Appwrite**
```bash
# Using Appwrite CLI
appwrite functions create \
  --functionId docify-unified-orchestrator \
  --name "Docify Unified Orchestrator" \
  --runtime python-3.9 \
  --entrypoint "src/main.py" \
  --events "databases.docify_db.collections.documents_table.documents.*.create"

# Deploy function code
appwrite functions deploy --functionId docify-unified-orchestrator
```

## 🎭 **How Gemini Orchestration Works**

### **Phase 1: Analysis Planning**
```python
# Gemini analyzes the request and creates a plan
analysis_plan = {
    "strategy": "comprehensive_analysis",
    "tool_sequence": ["url_context", "scrape_document", "research_interests"],
    "research_topics": ["react best practices", "api design patterns"],
    "analysis_focus": ["summary", "code_examples", "architecture"],
    "visualization_types": ["summary", "code", "mermaid"]
}
```

### **Phase 2: Tool Execution**
Gemini calls tools in optimal sequence:
1. **URL Context** → Understand document context
2. **Scrape Document** → Extract content from various formats
3. **Research Interests** → Research related topics
4. **Code Execution** → Test code examples
5. **Content Analysis** → Structure analysis and visualization planning

### **Phase 3: Synthesis**
```python
# Gemini synthesizes all tool results
final_analysis = {
    "summary": "Comprehensive document overview...",
    "blocks": [
        {
            "id": "summary-1",
            "type": "summary",
            "size": "large",
            "title": "Document Overview",
            "content": "..."
        },
        {
            "id": "code-1",
            "type": "code",
            "size": "medium",
            "title": "Implementation Examples",
            "content": "```javascript\n// Code example\n```"
        }
    ],
    "metadata": {
        "tools_used": ["google_search", "code_execution", "scrape_document"],
        "processing_time": 12.34,
        "research_sources": 3
    }
}
```

## 📊 **Analysis Block Types**

| Type | Description | Use Case |
|------|-------------|----------|
| **summary** | Comprehensive overview | Main document summary |
| **key_points** | Important highlights | Critical information |
| **architecture** | System structure | Technical architecture |
| **mermaid** | Visual diagrams | Flowcharts, system diagrams |
| **code** | Code examples | Implementation examples |
| **api_reference** | API documentation | API specifications |
| **guide** | Step-by-step instructions | Tutorials, guides |
| **comparison** | Feature comparisons | Alternative approaches |
| **best_practices** | Recommendations | Guidelines, tips |
| **troubleshooting** | Common issues | Problem solutions |

## 🎯 **User Interest Examples**

### **Frontend Developer Interests**
```json
["react", "typescript", "css", "performance"]
```
**Result**: Gemini researches latest React patterns, TypeScript best practices, and performance optimization techniques.

### **API Developer Interests**
```json
["rest-api", "graphql", "authentication", "testing"]
```
**Result**: Gemini researches API design patterns, GraphQL implementations, authentication methods, and testing strategies.

### **Data Scientist Interests**
```json
["machine-learning", "python", "data-visualization", "statistics"]
```
**Result**: Gemini researches ML algorithms, Python libraries, visualization techniques, and statistical methods.

## 🔍 **Tool Usage Examples**

### **Example 1: API Documentation Analysis**
```
User Request: "Analyze this REST API documentation"
User Interests: ["authentication", "testing", "security"]

Gemini Tool Calls:
1. url_context → Understand API structure
2. scrape_document → Extract API endpoints and examples
3. research_interests → Research OAuth2, JWT, API testing tools
4. google_search → Find latest security best practices
5. code_execution → Test API examples

Result: Comprehensive API analysis with security recommendations
```

### **Example 2: Framework Documentation**
```
User Request: "Analyze React component library"
User Interests: ["typescript", "performance", "accessibility"]

Gemini Tool Calls:
1. scrape_document → Extract component documentation
2. research_interests → Research TypeScript integration patterns
3. google_search → Find performance benchmarks
4. code_execution → Test component examples

Result: Framework analysis with TypeScript integration and performance insights
```

## 📈 **Performance & Monitoring**

### **Tool Usage Tracking**
```python
tool_usage_log = [
    {
        "tool": "google_search",
        "args": {"query": "react best practices"},
        "duration": 2.34,
        "success": true
    },
    {
        "tool": "code_execution",
        "args": {"code": "console.log('test')"},
        "duration": 0.12,
        "success": true
    }
]
```

### **Performance Metrics**
- **Processing Time**: End-to-end analysis time
- **Tool Efficiency**: Success rate and execution times
- **Content Quality**: Analysis depth and relevance
- **User Satisfaction**: Based on analysis comprehensiveness

## 🛠️ **Development & Testing**

### **Local Development**
```bash
# Install dependencies
pip install -r requirements.txt

# Run tests
python -m pytest tests/ -v

# Local testing
python src/main.py
```

### **Testing Tools**
```python
# Test individual components
from src.custom_tools import CustomTools
from src.gemini_orchestrator import DocifyOrchestrator

# Test tool integrations
tools = CustomTools(logger)
result = tools.execute_scrape_document({"url": "https://example.com"})
```

### **Integration Testing**
```python
# Test full orchestration
orchestrator = DocifyOrchestrator(context, databases, logger)
result = orchestrator.process_document()

# Validate results
assert result["success"] == True
assert len(result["blocks"]) >= 3
assert result["metadata"]["tools_used"] > 0
```

## 🚨 **Error Handling & Recovery**

### **Tool Failure Recovery**
```python
# Automatic fallback mechanisms
try:
    result = gemini_orchestrator.execute_tool_with_gemini(model, tool_name, args)
except ToolTimeoutError:
    result = fallback_tool_execution(tool_name, args)
except ToolFailureError:
    result = cached_or_simplified_result(tool_name, args)
```

### **Content Processing Fallbacks**
- **Network failures** → Cached content or simplified extraction
- **Parsing errors** → Raw text processing
- **Encoding issues** → Auto-detection and conversion
- **Large content** → Intelligent chunking and summarization

## 🔧 **Configuration Options**

### **Content Processing Limits**
```python
MAX_CONTENT_LENGTH = 50000      # Characters
MAX_PAGES_TO_CRAWL = 10         # Web pages
MAX_TOOL_EXECUTIONS = 5         # Tool calls per analysis
TOOL_TIMEOUT_SECONDS = 30       # Individual tool timeout
```

### **Analysis Customization**
```python
ANALYSIS_BLOCK_TYPES = [
    "summary", "key_points", "architecture",
    "mermaid", "code", "api_reference",
    "guide", "comparison", "best_practices", "troubleshooting"
]

GRID_SIZE_LIMIT = 8  # Maximum grid units
MAX_BLOCKS = 6       # Maximum analysis blocks
```

## 🎉 **Expected Outcomes**

### **Enhanced Analysis Quality**
- **🎯 Personalized**: Based on user interests and context
- **🔍 Comprehensive**: Multiple research sources integrated
- **💻 Validated**: Code examples tested and verified
- **📊 Visual**: Rich diagrams and structured presentations

### **Improved User Experience**
- **⚡ Faster**: Intelligent tool selection reduces unnecessary operations
- **🎨 Richer**: Multiple visualization types and formats
- **📱 Responsive**: Optimized for different content types
- **🔄 Adaptive**: Learns from user preferences over time

### **Technical Advantages**
- **🧠 Intelligent**: Gemini's reasoning capabilities
- **🔧 Modular**: Clean separation of concerns
- **📈 Scalable**: Efficient resource utilization
- **🛡️ Reliable**: Comprehensive error handling and fallbacks

## 🎯 **Next Steps**

1. **Deploy to Appwrite** with proper environment configuration
2. **Test with real documents** and various content types
3. **Monitor tool usage** and performance metrics
4. **Iterate based on results** and user feedback
5. **Expand tool ecosystem** with additional capabilities

---

## 📞 **Support & Development**

### **Key Files to Understand**
- `src/main.py`: Entry point and orchestration flow
- `src/gemini_orchestrator.py`: Core Gemini integration
- `src/custom_tools.py`: Tool implementations
- `src/content_processor.py`: Multi-format content handling

### **Debugging**
```bash
# View function logs
appwrite functions logs --functionId docify-unified-orchestrator

# Test specific tools
python -c "from src.custom_tools import CustomTools; print('Tools loaded')"
```

### **Contributing**
1. Test new tools thoroughly before integration
2. Ensure all tools have proper error handling
3. Document tool capabilities and limitations
4. Add comprehensive test cases

---

**This unified orchestrator represents the next evolution in AI-powered document analysis, leveraging Gemini's full capabilities for intelligent, context-aware processing.** 🚀
