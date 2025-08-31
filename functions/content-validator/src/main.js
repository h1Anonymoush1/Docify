import { Client, Databases, Functions } from 'node-appwrite';

export default async ({ req, res, log, error }) => {
  try {
    // Initialize Appwrite clients
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);

    const databases = new Databases(client);
    const functions = new Functions(client);

    // Parse input
    const { summaryId, userId, scrapedDataId } = JSON.parse(req.payload);

    log(`Starting content validation for summaryId: ${summaryId}`);

    // Update summary status to validating
    await databases.updateDocument(
      process.env.DATABASE_ID,
      'summaries',
      summaryId,
      {
        status: 'validating',
        updatedAt: new Date().toISOString()
      }
    );

    // Load scraped content from storage
    const scrapedData = await loadScrapedContent(scrapedDataId);

    // Run validation checks
    const validation = await validateContent(scrapedData);

    log(`Content validation completed with confidence: ${validation.confidence}`);

    // Update database with validation results
    await databases.updateDocument(
      process.env.DATABASE_ID,
      'summaries',
      summaryId,
      {
        status: validation.isValid ? 'validated' : 'validation_failed',
        updatedAt: new Date().toISOString()
      }
    );

    // Trigger LLM analyzer if validation passes
    if (validation.isValid && validation.confidence > 0.7) {
      log(`Validation passed, triggering LLM analyzer for summaryId: ${summaryId}`);

      await functions.createExecution(
        'llm-analyzer',
        JSON.stringify({
          summaryId,
          userId,
          scrapedDataId
        }),
        false
      );
    } else {
      log(`Validation failed or confidence too low (${validation.confidence}) for summaryId: ${summaryId}`);

      // Update with validation failure
      await databases.updateDocument(
        process.env.DATABASE_ID,
        'summaries',
        summaryId,
        {
          status: 'failed',
          errorMessage: `Content validation failed: ${validation.issues.join(', ')}`,
          updatedAt: new Date().toISOString()
        }
      );
    }

    return res.json({
      success: true,
      summaryId,
      validation
    });

  } catch (err) {
    error(`Validation failed: ${err.message}`);

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
      error: { code: 'VALIDATION_ERROR', message: err.message }
    }, 500);
  }
};

// Helper Functions

async function loadScrapedContent(scrapedDataId) {
  try {
    // This would typically load from Appwrite Storage
    // For now, we'll simulate this with a placeholder
    // In production, you'd use:
    // const storage = new Storage(client);
    // const file = await storage.getFileView(process.env.STORAGE_BUCKET_ID, scrapedDataId);

    // Placeholder for development - in production, load actual file
    return {
      title: "Sample Document",
      content: "This is sample content for validation...",
      text: "This is sample content for validation...",
      wordCount: 150,
      url: "https://example.com"
    };
  } catch (err) {
    throw new Error(`Failed to load scraped content: ${err.message}`);
  }
}

async function validateContent(content) {
  const startTime = Date.now();

  // Basic structure validation
  const structureScore = calculateStructureScore(content);
  const readabilityScore = calculateReadabilityScore(content);
  const completenessScore = calculateCompletenessScore(content);

  // Content quality checks
  const qualityIssues = [];

  // Check minimum content length
  const minLength = parseInt(process.env.MIN_CONTENT_LENGTH || '100');
  if (content.text.length < minLength) {
    qualityIssues.push(`Content too short (${content.text.length} chars, minimum ${minLength})`);
  }

  // Check maximum content length
  const maxLength = parseInt(process.env.MAX_CONTENT_LENGTH || '50000');
  if (content.text.length > maxLength) {
    qualityIssues.push(`Content too long (${content.text.length} chars, maximum ${maxLength})`);
  }

  // Check for meaningful content
  if (!hasMeaningfulContent(content.text)) {
    qualityIssues.push('Content appears to be mostly boilerplate or navigation');
  }

  // Check language (basic English detection)
  if (!isEnglishContent(content.text)) {
    qualityIssues.push('Content does not appear to be in English');
  }

  // Calculate overall confidence
  const overallConfidence = (structureScore + readabilityScore + completenessScore) / 3;

  // Adjust confidence based on issues
  const issuePenalty = qualityIssues.length * 0.1;
  const finalConfidence = Math.max(0, overallConfidence - issuePenalty);

  const processingTime = Date.now() - startTime;

  return {
    isValid: finalConfidence > 0.6 && qualityIssues.length === 0,
    confidence: finalConfidence,
    issues: qualityIssues,
    metrics: {
      contentLength: content.text.length,
      structureScore,
      readabilityScore,
      completenessScore,
      processingTime
    }
  };
}

function calculateStructureScore(content) {
  let score = 0.5; // Base score

  const text = content.text.toLowerCase();

  // Check for headings/structure indicators
  if (text.includes('#') || text.includes('chapter') || text.includes('section')) {
    score += 0.2;
  }

  // Check for lists
  if (text.includes('•') || text.includes('- ') || text.includes('1.') || text.includes('2.')) {
    score += 0.15;
  }

  // Check for paragraphs (multiple line breaks)
  const paragraphs = text.split(/\n\s*\n/).length;
  if (paragraphs > 3) {
    score += 0.15;
  }

  // Check for code-like content
  if (text.includes('function') || text.includes('const') || text.includes('var') || text.includes('```')) {
    score += 0.1;
  }

  return Math.min(1.0, score);
}

function calculateReadabilityScore(content) {
  const text = content.text;

  // Simple readability metrics
  const words = text.split(/\s+/);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

  if (words.length === 0 || sentences.length === 0) return 0;

  const avgWordsPerSentence = words.length / sentences.length;
  const avgCharsPerWord = text.length / words.length;

  // Ideal readability ranges
  let score = 0.5;

  // Sentence length score (ideal: 15-20 words)
  if (avgWordsPerSentence >= 10 && avgWordsPerSentence <= 25) {
    score += 0.25;
  } else if (avgWordsPerSentence >= 5 && avgWordsPerSentence <= 35) {
    score += 0.15;
  }

  // Word length score (ideal: 4-6 characters)
  if (avgCharsPerWord >= 4 && avgCharsPerWord <= 7) {
    score += 0.25;
  } else if (avgCharsPerWord >= 3 && avgCharsPerWord <= 8) {
    score += 0.15;
  }

  return Math.min(1.0, score);
}

function calculateCompletenessScore(content) {
  let score = 0.5; // Base score
  const text = content.text.toLowerCase();

  // Check for introduction/conclusion indicators
  if (text.includes('introduction') || text.includes('overview') || text.includes('summary')) {
    score += 0.15;
  }

  if (text.includes('conclusion') || text.includes('summary') || text.includes('next steps')) {
    score += 0.15;
  }

  // Check for examples or code
  if (text.includes('example') || text.includes('code') || text.includes('```') || text.includes('function')) {
    score += 0.1;
  }

  // Check for explanations
  if (text.includes('because') || text.includes('therefore') || text.includes('however')) {
    score += 0.1;
  }

  // Length appropriateness (not too short, not too long)
  const wordCount = content.wordCount || text.split(/\s+/).length;
  if (wordCount >= 100 && wordCount <= 2000) {
    score += 0.1;
  }

  return Math.min(1.0, score);
}

function hasMeaningfulContent(text) {
  const words = text.split(/\s+/);

  // Remove common stop words and check meaningful content ratio
  const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those'];

  const meaningfulWords = words.filter(word =>
    word.length > 2 &&
    !stopWords.includes(word.toLowerCase()) &&
    !/^\d+$/.test(word) // Not just numbers
  );

  const meaningfulRatio = meaningfulWords.length / words.length;

  // At least 30% meaningful content
  return meaningfulRatio > 0.3;
}

function isEnglishContent(text) {
  // Simple English detection based on common English words and patterns
  const englishWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'what', 'when', 'where', 'how', 'why', 'who', 'which'];

  const words = text.toLowerCase().split(/\s+/);
  const englishWordCount = words.filter(word => englishWords.includes(word)).length;

  const englishRatio = englishWordCount / words.length;

  // At least 20% common English words
  return englishRatio > 0.2 || words.length < 50; // Small texts get benefit of doubt
}
