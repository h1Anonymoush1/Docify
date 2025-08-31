import { Client, Databases, Storage } from 'node-appwrite';

export default async ({ req, res, log, error }) => {
  const startTime = Date.now();

  try {
    // Initialize Appwrite clients
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);

    const databases = new Databases(client);
    const storage = new Storage(client);

    // Parse input
    const { summaryId, userId, scrapedDataId } = JSON.parse(req.payload);

    log(`Starting LLM analysis for summaryId: ${summaryId}`);

    // Update summary status to analyzing
    await databases.updateDocument(
      process.env.DATABASE_ID,
      'summaries',
      summaryId,
      {
        status: 'analyzing',
        updatedAt: new Date().toISOString()
      }
    );

    // Load and prepare content
    const content = await loadScrapedContent(scrapedDataId);
    const preparedPrompt = await prepareAnalysisPrompt(content);

    log(`Content loaded, length: ${content.text.length} characters`);

    // Generate analysis with LLM
    const analysis = await generateAnalysis(preparedPrompt);

    log(`LLM analysis completed, processing results`);

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

    // Update database with complete analysis
    await databases.updateDocument(
      process.env.DATABASE_ID,
      'summaries',
      summaryId,
      {
        status: 'completed',
        analysisData: JSON.stringify(analysisData),
        mermaidDiagrams: mermaidDiagrams.map(d => d.code),
        htmlPreview: htmlPreview,
        markdownSummary: markdownSummary,
        tags: structuredAnalysis.tags,
        updatedAt: new Date().toISOString()
      }
    );

    // Deduct user credit
    await deductUserCredit(databases, userId);

    log(`LLM analysis completed successfully for summaryId: ${summaryId}`);

    return res.json({
      success: true,
      summaryId,
      analysis: analysisData
    });

  } catch (err) {
    error(`Analysis failed: ${err.message}`);

    // Update database with error
    try {
      const { summaryId } = JSON.parse(req.payload);
      await databases.updateDocument(
        process.env.DATABASE_ID,
        'summaries',
        summaryId,
        {
          status: 'failed',
          errorMessage: err.message,
          updatedAt: new Date().toISOString()
        }
      );
    } catch (dbErr) {
      error(`Failed to update database with error: ${dbErr.message}`);
    }

    return res.json({
      success: false,
      summaryId: JSON.parse(req.payload).summaryId,
      error: { code: 'ANALYSIS_ERROR', message: err.message }
    }, 500);
  }
};

// Helper Functions

async function loadScrapedContent(scrapedDataId) {
  try {
    // In production, load from Appwrite Storage
    // const file = await storage.getFileView(process.env.STORAGE_BUCKET_ID, scrapedDataId);
    // const content = await file.text();
    // return JSON.parse(content);

    // Placeholder for development
    return {
      title: "Sample Technical Documentation",
      content: `# Getting Started

This is a comprehensive guide for developers looking to build amazing applications.

## Installation

First, install the required dependencies:

\`\`\`bash
npm install package-name
\`\`\`

## Basic Usage

Here's a simple example:

\`\`\`javascript
const app = new Application();
app.start();
\`\`\`

## Advanced Features

The library supports various advanced features including authentication, database integration, and real-time updates.`,
      text: "Getting Started This is a comprehensive guide for developers looking to build amazing applications. Installation First, install the required dependencies: npm install package-name Basic Usage Here's a simple example: const app = new Application(); app.start(); Advanced Features The library supports various advanced features including authentication, database integration, and real-time updates.",
      wordCount: 89,
      url: "https://example.com/docs"
    };
  } catch (err) {
    throw new Error(`Failed to load scraped content: ${err.message}`);
  }
}

function prepareAnalysisPrompt(content) {
  const maxLength = parseInt(process.env.MAX_TOKENS || '4000');
  const truncatedContent = content.text.substring(0, maxLength);

  return `You are a documentation analysis expert. Analyze the following content and provide a structured response in JSON format.

Content to analyze:
Title: ${content.title}
Content: ${truncatedContent}

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
      "title": "Basic Implementation",
      "code": "const app = new Application();"
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

Respond only with valid JSON, no additional text.`;
}

async function generateAnalysis(prompt) {
  try {
    // In production, this would call Hugging Face API
    // For now, return a mock response
    const mockResponse = {
      overview: "This documentation provides a comprehensive guide for developers looking to build applications using the framework. It covers installation, basic usage, and advanced features including authentication, database integration, and real-time updates.",
      keyPoints: [
        "Simple installation process with npm",
        "Supports basic application creation",
        "Advanced features for enterprise applications",
        "Real-time capabilities built-in"
      ],
      diagrams: [
        {
          type: "flowchart",
          title: "Application Lifecycle",
          mermaid: "graph TD\\n    A[Install Dependencies] --> B[Create App Instance]\\n    B --> C[Configure Settings]\\n    C --> D[Start Application]"
        }
      ],
      codeExamples: [
        {
          language: "javascript",
          title: "Basic Setup",
          code: "const app = new Application({\\n  port: 3000,\\n  debug: true\\n});\\n\\napp.start();"
        }
      ],
      tags: ["javascript", "framework", "documentation", "api", "tutorial"],
      confidence: 0.85
    };

    return {
      ...mockResponse,
      usage: { total_tokens: 450 }
    };

  } catch (err) {
    throw new Error(`LLM API call failed: ${err.message}`);
  }
}

async function structureAnalysisResults(analysis) {
  try {
    // Parse and validate the analysis results
    const structured = {
      overview: analysis.overview || "No overview available",
      keyPoints: Array.isArray(analysis.keyPoints) ? analysis.keyPoints : [],
      diagrams: Array.isArray(analysis.diagrams) ? analysis.diagrams : [],
      codeExamples: Array.isArray(analysis.codeExamples) ? analysis.codeExamples : [],
      tags: Array.isArray(analysis.tags) ? analysis.tags : [],
      confidence: typeof analysis.confidence === 'number' ? analysis.confidence : 0.8
    };

    // Validate and clean up the structured data
    structured.keyPoints = structured.keyPoints.filter(point =>
      typeof point === 'string' && point.trim().length > 0
    );

    structured.tags = structured.tags.filter(tag =>
      typeof tag === 'string' && tag.trim().length > 0
    );

    return structured;

  } catch (err) {
    throw new Error(`Failed to structure analysis results: ${err.message}`);
  }
}

async function generateMermaidDiagrams(analysis) {
  const diagrams = [];

  // Process each diagram from the analysis
  for (const diagramData of analysis.diagrams || []) {
    try {
      // Validate Mermaid syntax (basic validation)
      const validatedMermaid = validateMermaidSyntax(diagramData.mermaid);

      diagrams.push({
        type: diagramData.type || 'flowchart',
        title: diagramData.title || 'Diagram',
        code: validatedMermaid,
        svg: await renderMermaidToSvg(validatedMermaid)
      });
    } catch (err) {
      console.error(`Failed to process diagram: ${err.message}`);
    }
  }

  // If no diagrams were generated, create a default one
  if (diagrams.length === 0) {
    try {
      const defaultDiagram = `graph TD
        A[Content Analysis] --> B[Processing Complete]
        B --> C[Results Available]`;

      diagrams.push({
        type: 'flowchart',
        title: 'Analysis Overview',
        code: defaultDiagram,
        svg: await renderMermaidToSvg(defaultDiagram)
      });
    } catch (err) {
      console.error(`Failed to create default diagram: ${err.message}`);
    }
  }

  return diagrams;
}

async function generateHtmlPreview(analysis) {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Documentation Preview</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #2c3e50;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
        }
        h2 {
            color: #34495e;
            margin-top: 30px;
        }
        .key-points {
            background: #ecf0f1;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
        }
        .key-points ul {
            margin: 0;
            padding-left: 20px;
        }
        .code-example {
            background: #2c3e50;
            color: #ecf0f1;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
            font-family: 'Courier New', monospace;
            overflow-x: auto;
        }
        .tags {
            margin-top: 20px;
        }
        .tag {
            display: inline-block;
            background: #3498db;
            color: white;
            padding: 5px 10px;
            border-radius: 15px;
            margin: 5px 5px 0 0;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Documentation Analysis</h1>

        <div class="overview">
            <p>${(analysis.overview || '').replace(/\n/g, '</p><p>')}</p>
        </div>

        ${analysis.keyPoints && analysis.keyPoints.length > 0 ? `
        <h2>Key Points</h2>
        <div class="key-points">
            <ul>
                ${analysis.keyPoints.map(point => `<li>${point}</li>`).join('')}
            </ul>
        </div>
        ` : ''}

        ${analysis.codeExamples && analysis.codeExamples.length > 0 ? `
        <h2>Code Examples</h2>
        ${analysis.codeExamples.map(example => `
        <div class="code-example">
            <strong>${example.title}</strong>
            <pre><code>${example.code}</code></pre>
        </div>
        `).join('')}
        ` : ''}

        ${analysis.tags && analysis.tags.length > 0 ? `
        <div class="tags">
            <h3>Tags</h3>
            ${analysis.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
        </div>
        ` : ''}
    </div>
</body>
</html>`;

  return html;
}

async function generateMarkdownSummary(analysis) {
  let markdown = `# Documentation Analysis\n\n`;

  if (analysis.overview) {
    markdown += `${analysis.overview}\n\n`;
  }

  if (analysis.keyPoints && analysis.keyPoints.length > 0) {
    markdown += `## Key Points\n\n`;
    analysis.keyPoints.forEach(point => {
      markdown += `- ${point}\n`;
    });
    markdown += `\n`;
  }

  if (analysis.diagrams && analysis.diagrams.length > 0) {
    markdown += `## Diagrams\n\n`;
    analysis.diagrams.forEach(diagram => {
      markdown += `### ${diagram.title}\n\n`;
      markdown += `\`\`\`mermaid\n${diagram.mermaid}\n\`\`\`\n\n`;
    });
  }

  if (analysis.codeExamples && analysis.codeExamples.length > 0) {
    markdown += `## Code Examples\n\n`;
    analysis.codeExamples.forEach(example => {
      markdown += `### ${example.title}\n\n`;
      markdown += `\`\`\`${example.language || 'javascript'}\n${example.code}\n\`\`\`\n\n`;
    });
  }

  if (analysis.tags && analysis.tags.length > 0) {
    markdown += `## Tags\n\n`;
    markdown += analysis.tags.map(tag => `\`${tag}\``).join(' ') + '\n\n';
  }

  return markdown;
}

function validateMermaidSyntax(mermaidCode) {
  // Basic validation - ensure it starts with a valid diagram type
  const validStarts = ['graph', 'flowchart', 'sequenceDiagram', 'classDiagram', 'stateDiagram', 'erDiagram', 'journey', 'gantt', 'pie', 'gitgraph', 'mindmap', 'timeline', 'sankey'];

  const firstLine = mermaidCode.trim().split('\n')[0].toLowerCase();

  const isValid = validStarts.some(start => firstLine.includes(start));

  if (!isValid) {
    throw new Error(`Invalid Mermaid syntax: must start with a valid diagram type`);
  }

  return mermaidCode;
}

async function renderMermaidToSvg(mermaidCode) {
  try {
    // In production, this would use a Mermaid rendering service
    // For now, return a placeholder SVG
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200">
      <rect width="400" height="200" fill="#f0f0f0"/>
      <text x="200" y="100" text-anchor="middle" font-family="Arial" font-size="16" fill="#333">
        Diagram: ${mermaidCode.split('\n')[1] || 'Generated Diagram'}
      </text>
    </svg>`;
  } catch (err) {
    console.error(`Failed to render Mermaid to SVG: ${err.message}`);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200">
      <rect width="400" height="200" fill="#ffebee"/>
      <text x="200" y="100" text-anchor="middle" font-family="Arial" font-size="14" fill="#c62828">
        Diagram rendering failed
      </text>
    </svg>`;
  }
}

async function deductUserCredit(databases, userId) {
  try {
    // Get current user
    const user = await databases.getDocument(
      process.env.DATABASE_ID,
      'users',
      userId
    );

    // Deduct one credit
    const newCredits = Math.max(0, user.credits - 1);

    // Update user credits
    await databases.updateDocument(
      process.env.DATABASE_ID,
      'users',
      userId,
      {
        credits: newCredits,
        totalSummaries: user.totalSummaries + 1,
        lastActive: new Date().toISOString()
      }
    );

  } catch (err) {
    error(`Failed to deduct user credit: ${err.message}`);
    // Don't throw here - we don't want to fail the entire process
  }
}
