# Docify - Appwrite Functions Specifications

## 🔧 Function Architecture Overview

Docify uses a three-stage processing pipeline implemented as separate Appwrite Functions:
1. **Document Scraper**: Extracts content from URLs
2. **Content Validator**: Validates scraped content quality
3. **LLM Analyzer**: Generates AI-powered summaries and visualizations

## 📝 Function 1: Document Scraper

### Configuration
```json
{
  "functionId": "document-scraper",
  "name": "Document Scraper",
  "runtime": "node-18.0",
  "entrypoint": "src/main.js",
  "timeout": 300,
  "memory": 512,
  "execute": ["users"],
  "events": [],
  "schedule": "",
  "variables": {
    "MAX_CONTENT_SIZE": "10485760",
    "TIMEOUT_SECONDS": "30",
    "USER_AGENT": "Docify-Bot/1.0"
  }
}
```

### Dependencies
```json
{
  "dependencies": {
    "node-appwrite": "^13.0.0",
    "puppeteer": "^21.0.0",
    "cheerio": "^1.0.0-rc.12",
    "pdf-parse": "^1.1.1",
    "turndown": "^7.1.2",
    "mime-types": "^2.1.35",
    "url-parse": "^1.5.10",
    "crypto": "^1.0.1"
  }
}
```

### Input Schema
```typescript
interface ScraperInput {
  url: string;           // Target URL to scrape
  userId: string;        // User ID for attribution
  summaryId: string;     // Summary document ID
  options?: {
    maxSize?: number;    // Max content size in bytes
    timeout?: number;    // Request timeout in seconds
    format?: 'auto' | 'html' | 'markdown' | 'pdf';
  };
}
```

### Output Schema
```typescript
interface ScraperOutput {
  success: boolean;
  summaryId: string;
  data?: {
    title: string;
    content: string;
    contentType: string;
    wordCount: number;
    metadata: {
      url: string;
      domain: string;
      extractedAt: string;
      processingTime: number;
      contentLength: number;
    };
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
```

### Core Logic Flow
```javascript
export default async ({ req, res, log, error }) => {
  try {
    // 1. Parse and validate input
    const { url, userId, summaryId, options = {} } = JSON.parse(req.payload);
    
    // 2. Initialize Appwrite clients
    const { databases, storage } = initializeAppwrite();
    
    // 3. Validate URL accessibility
    const urlInfo = await validateUrl(url);
    
    // 4. Detect content type and choose scraping method
    const contentType = await detectContentType(url);
    
    // 5. Scrape content based on type
    let scrapedData;
    switch (contentType) {
      case 'text/html':
        scrapedData = await scrapeHtml(url, options);
        break;
      case 'text/markdown':
        scrapedData = await scrapeMarkdown(url, options);
        break;
      case 'application/pdf':
        scrapedData = await scrapePdf(url, options);
        break;
      default:
        scrapedData = await scrapeGeneric(url, options);
    }
    
    // 6. Clean and structure content
    const cleanedData = await cleanContent(scrapedData);
    
    // 7. Save to Appwrite Storage
    const storageFileId = await saveToStorage(storage, summaryId, cleanedData);
    
    // 8. Update database
    await updateSummaryDocument(databases, summaryId, {
      status: 'scraped',
      scrapedDataId: storageFileId,
      contentType: contentType,
      title: cleanedData.title,
      updatedAt: new Date().toISOString()
    });
    
    // 9. Trigger validation function
    await triggerFunction('content-validator', {
      summaryId,
      userId,
      scrapedDataId: storageFileId
    });
    
    return res.json({
      success: true,
      summaryId,
      data: {
        title: cleanedData.title,
        contentType,
        wordCount: cleanedData.wordCount,
        metadata: cleanedData.metadata
      }
    });
    
  } catch (err) {
    error(`Scraping failed: ${err.message}`);
    
    // Update database with error
    await updateSummaryDocument(databases, summaryId, {
      status: 'failed',
      errorMessage: err.message,
      updatedAt: new Date().toISOString()
    });
    
    return res.json({
      success: false,
      summaryId,
      error: {
        code: err.code || 'SCRAPING_ERROR',
        message: err.message
      }
    }, 500);
  }
};
```

### Key Helper Functions
```javascript
// HTML scraping with Puppeteer
async function scrapeHtml(url, options) {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setUserAgent(process.env.USER_AGENT);
  await page.goto(url, { waitUntil: 'networkidle0', timeout: options.timeout * 1000 });
  
  const content = await page.evaluate(() => {
    // Remove script, style, and nav elements
    const elementsToRemove = document.querySelectorAll('script, style, nav, header, footer');
    elementsToRemove.forEach(el => el.remove());
    
    // Extract main content
    const main = document.querySelector('main, article, .content, #content') || document.body;
    return {
      title: document.title,
      html: main.innerHTML,
      text: main.innerText
    };
  });
  
  await browser.close();
  return content;
}

// PDF processing
async function scrapePdf(url, options) {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  const data = await pdfParse(buffer);
  
  return {
    title: extractTitleFromPdf(data.text),
    content: data.text,
    text: data.text,
    metadata: {
      pages: data.numpages,
      info: data.info
    }
  };
}
```

## 🔍 Function 2: Content Validator

### Configuration
```json
{
  "functionId": "content-validator",
  "name": "Content Validator",
  "runtime": "node-18.0",
  "entrypoint": "src/main.js",
  "timeout": 120,
  "memory": 256,
  "execute": ["users"],
  "variables": {
    "HUGGING_FACE_API_KEY": "secret",
    "VALIDATION_MODEL": "distilbert-base-uncased",
    "MIN_CONTENT_LENGTH": "100",
    "MAX_CONTENT_LENGTH": "50000"
  }
}
```

### Input Schema
```typescript
interface ValidatorInput {
  summaryId: string;
  userId: string;
  scrapedDataId: string;
}
```

### Output Schema
```typescript
interface ValidatorOutput {
  success: boolean;
  summaryId: string;
  validation: {
    isValid: boolean;
    confidence: number;     // 0-1 score
    issues: string[];
    metrics: {
      contentLength: number;
      structureScore: number;
      readabilityScore: number;
      completenessScore: number;
    };
  };
  error?: {
    code: string;
    message: string;
  };
}
```

### Core Logic
```javascript
export default async ({ req, res, log, error }) => {
  try {
    const { summaryId, userId, scrapedDataId } = JSON.parse(req.payload);
    
    // Load scraped content from storage
    const content = await loadScrapedContent(scrapedDataId);
    
    // Run validation checks
    const validation = await validateContent(content);
    
    // Update database with validation results
    await updateSummaryDocument(databases, summaryId, {
      status: validation.isValid ? 'validated' : 'validation_failed',
      validationData: JSON.stringify(validation),
      updatedAt: new Date().toISOString()
    });
    
    // Trigger LLM analyzer if validation passes
    if (validation.isValid && validation.confidence > 0.7) {
      await triggerFunction('llm-analyzer', {
        summaryId,
        userId,
        scrapedDataId
      });
    }
    
    return res.json({
      success: true,
      summaryId,
      validation
    });
    
  } catch (err) {
    error(`Validation failed: ${err.message}`);
    return res.json({
      success: false,
      summaryId,
      error: { code: 'VALIDATION_ERROR', message: err.message }
    }, 500);
  }
};

async function validateContent(content) {
  // Basic structure validation
  const structureScore = calculateStructureScore(content);
  const readabilityScore = calculateReadabilityScore(content);
  const completenessScore = calculateCompletenessScore(content);
  
  // LLM-based validation
  const llmValidation = await validateWithLLM(content);
  
  const overallConfidence = (structureScore + readabilityScore + completenessScore + llmValidation.score) / 4;
  
  return {
    isValid: overallConfidence > 0.6,
    confidence: overallConfidence,
    issues: llmValidation.issues,
    metrics: {
      contentLength: content.text.length,
      structureScore,
      readabilityScore,
      completenessScore
    }
  };
}
```

## 🤖 Function 3: LLM Analyzer

### Configuration
```json
{
  "functionId": "llm-analyzer",
  "name": "LLM Analyzer",
  "runtime": "node-18.0",
  "entrypoint": "src/main.js",
  "timeout": 600,
  "memory": 1024,
  "execute": ["users"],
  "variables": {
    "HUGGING_FACE_API_KEY": "secret",
    "PRIMARY_MODEL": "microsoft/DialoGPT-large",
    "MAX_TOKENS": "4000",
    "TEMPERATURE": "0.7"
  }
}
```

### Input Schema
```typescript
interface AnalyzerInput {
  summaryId: string;
  userId: string;
  scrapedDataId: string;
}
```

### Output Schema
```typescript
interface AnalyzerOutput {
  success: boolean;
  summaryId: string;
  analysis: {
    overview: string;
    keyPoints: string[];
    mermaidDiagrams: string[];
    htmlPreview: string;
    markdownSummary: string;
    tags: string[];
    metadata: {
      processingTime: number;
      tokensUsed: number;
      confidence: number;
    };
  };
  error?: {
    code: string;
    message: string;
  };
}
```

### Core Analysis Logic
```javascript
export default async ({ req, res, log, error }) => {
  try {
    const { summaryId, userId, scrapedDataId } = JSON.parse(req.payload);
    
    // Load and prepare content
    const content = await loadScrapedContent(scrapedDataId);
    const preparedPrompt = await prepareAnalysisPrompt(content);
    
    // Generate analysis with LLM
    const analysis = await generateAnalysis(preparedPrompt);
    
    // Process and structure the results
    const structuredAnalysis = await structureAnalysisResults(analysis);
    
    // Generate additional content
    const mermaidDiagrams = await generateMermaidDiagrams(structuredAnalysis);
    const htmlPreview = await generateHtmlPreview(structuredAnalysis);
    const markdownSummary = await generateMarkdownSummary(structuredAnalysis);
    
    // Save complete analysis
    const analysisData = {
      overview: structuredAnalysis.overview,
      keyPoints: structuredAnalysis.keyPoints,
      mermaidDiagrams,
      htmlPreview,
      markdownSummary,
      tags: structuredAnalysis.tags,
      metadata: {
        processingTime: Date.now() - startTime,
        tokensUsed: analysis.usage?.total_tokens || 0,
        confidence: structuredAnalysis.confidence || 0.8
      }
    };
    
    // Update database
    await updateSummaryDocument(databases, summaryId, {
      status: 'completed',
      analysisData: JSON.stringify(analysisData),
      mermaidDiagrams: mermaidDiagrams,
      htmlPreview: htmlPreview,
      markdownSummary: markdownSummary,
      tags: structuredAnalysis.tags,
      updatedAt: new Date().toISOString()
    });
    
    // Deduct user credit
    await deductUserCredit(databases, userId);
    
    return res.json({
      success: true,
      summaryId,
      analysis: analysisData
    });
    
  } catch (err) {
    error(`Analysis failed: ${err.message}`);
    
    await updateSummaryDocument(databases, summaryId, {
      status: 'failed',
      errorMessage: err.message,
      updatedAt: new Date().toISOString()
    });
    
    return res.json({
      success: false,
      summaryId,
      error: { code: 'ANALYSIS_ERROR', message: err.message }
    }, 500);
  }
};
```

### Prompt Engineering
```javascript
function prepareAnalysisPrompt(content) {
  return `
You are a documentation analysis expert. Analyze the following content and provide a structured response in JSON format.

Content to analyze:
Title: ${content.title}
Content: ${content.text.substring(0, 3000)}...

Please provide your analysis in this exact JSON structure:
{
  "overview": "A comprehensive 2-3 paragraph overview of the documentation",
  "keyPoints": ["array", "of", "key", "points", "from", "the", "content"],
  "diagrams": [
    {
      "type": "flowchart",
      "title": "Process Flow",
      "mermaid": "graph TD\\n    A[Start] --> B[Process]\\n    B --> C[End]"
    }
  ],
  "codeExamples": [
    {
      "language": "javascript",
      "title": "Example Implementation",
      "code": "// Example code here"
    }
  ],
  "tags": ["relevant", "tags", "for", "categorization"],
  "confidence": 0.85
}

Focus on:
1. Creating accurate Mermaid diagrams that represent workflows, architectures, or processes
2. Extracting practical code examples with proper syntax highlighting
3. Identifying key concepts and technical details
4. Generating relevant tags for categorization
5. Providing actionable insights

Respond only with valid JSON, no additional text.
`;
}
```

### Mermaid Diagram Generation
```javascript
async function generateMermaidDiagrams(analysis) {
  const diagrams = [];
  
  // Process each diagram from the analysis
  for (const diagramData of analysis.diagrams || []) {
    try {
      // Validate Mermaid syntax
      const validatedMermaid = await validateMermaidSyntax(diagramData.mermaid);
      
      diagrams.push({
        type: diagramData.type,
        title: diagramData.title,
        code: validatedMermaid,
        svg: await renderMermaidToSvg(validatedMermaid)
      });
    } catch (err) {
      log(`Failed to process diagram: ${err.message}`);
    }
  }
  
  return diagrams;
}
```

## 🔄 Function Orchestration

### Trigger Chain
```javascript
// Function 1 triggers Function 2
await triggerFunction('content-validator', payload);

// Function 2 triggers Function 3 (if validation passes)
await triggerFunction('llm-analyzer', payload);

// Helper function for triggering
async function triggerFunction(functionId, payload) {
  const functions = new Functions(client);
  return await functions.createExecution(
    functionId,
    JSON.stringify(payload),
    false, // not async
    '/',   // path
    'POST', // method
    {}     // headers
  );
}
```

### Error Handling & Retries
```javascript
async function executeWithRetry(operation, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

### Monitoring & Logging
```javascript
// Structured logging for monitoring
function logMetrics(functionName, operation, duration, success, metadata = {}) {
  const logData = {
    function: functionName,
    operation,
    duration,
    success,
    timestamp: new Date().toISOString(),
    ...metadata
  };
  
  console.log(JSON.stringify(logData));
}
```

---

*These function specifications provide detailed implementation guidance for building Docify's serverless processing pipeline with Appwrite Functions.*
