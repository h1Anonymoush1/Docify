const { Client, Databases, Query } = require('node-appwrite');
const { HfInference } = require('@huggingface/inference');

// Appwrite configuration
const client = new Client();
client
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

// Database configuration
const DATABASE_ID = process.env.DATABASE_ID || 'docify_db';
const DOCUMENTS_COLLECTION_ID = process.env.DOCUMENTS_COLLECTION_ID || 'documents';
const ANALYSIS_COLLECTION_ID = process.env.ANALYSIS_COLLECTION_ID || 'analysis_results';

// Initialize Hugging Face client
const hf = new HfInference(process.env.HUGGINGFACE_ACCESS_TOKEN);

function createAnalysisPrompt(scrapedData, userInstructions) {
    return `You are an expert technical documentation analyzer. Analyze the following web content and create a comprehensive explanation with visual elements.

CONTENT TITLE: ${scrapedData.title || 'Untitled Document'}
CONTENT DESCRIPTION: ${scrapedData.description || 'No description available'}
USER INSTRUCTIONS: ${userInstructions}

SCRAPED CONTENT:
${scrapedData.content}

TASK: Create a structured analysis with summary and visual elements to explain this documentation. Return a JSON response with the following structure:

{
  "summary": "A comprehensive summary of the document content",
  "blocks": [
    {
      "id": "unique-id-1",
      "type": "summary|key_points|architecture|mermaid|code|api_reference|guide|comparison|best_practices|troubleshooting",
      "size": "small|medium|large",
      "title": "Block title",
      "content": "Block content (mermaid syntax for mermaid type)",
      "metadata": {
        "language": "javascript|python|etc (for code blocks)",
        "priority": "high|medium|low"
      }
    }
  ]
}

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

Ensure the response is valid JSON.`;
}

async function callHuggingFace(prompt) {
    try {
        console.log('Calling Hugging Face API...');

        const response = await hf.textGeneration({
            model: 'mistralai/Mistral-7B-Instruct-v0.2',
            inputs: prompt,
            parameters: {
                max_new_tokens: 4000,
                temperature: 0.7,
                top_p: 0.95,
                do_sample: true,
                return_full_text: false
            }
        });

        const generatedText = response.generated_text;
        console.log('Hugging Face response received');

        // Try to extract JSON from the response
        const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No JSON found in LLM response');
        }

        const jsonString = jsonMatch[0];
        const parsedResponse = JSON.parse(jsonString);

        // Validate the response structure
        if (!parsedResponse.summary || !Array.isArray(parsedResponse.blocks)) {
            throw new Error('Invalid response structure');
        }

        // Validate and clean blocks
        parsedResponse.blocks = parsedResponse.blocks
            .filter(block => block.id && block.type && block.size && block.title && block.content)
            .slice(0, 6) // Limit to 6 blocks maximum
            .map((block, index) => ({
                ...block,
                id: block.id || `block-${index}`,
                metadata: block.metadata || {}
            }));

        return parsedResponse;

    } catch (error) {
        console.error('Hugging Face API error:', error);
        throw new Error(`Failed to generate analysis: ${error.message}`);
    }
}

function validateBlockSizes(blocks) {
    // Ensure we don't exceed the grid limit
    // Small = 1, Medium = 2, Large = 3
    // Maximum total should be around 6-8 units for good layout

    const sizeValues = { small: 1, medium: 2, large: 3 };
    const totalUnits = blocks.reduce((sum, block) => sum + sizeValues[block.size], 0);

    if (totalUnits > 8) {
        // Reduce sizes if total is too high
        return blocks.map(block => {
            if (block.size === 'large' && totalUnits > 8) {
                return { ...block, size: 'medium' };
            }
            return block;
        });
    }

    return blocks;
}

async function updateDocumentStatus(documentId, status) {
    try {
        await databases.updateDocument(
            DATABASE_ID,
            DOCUMENTS_COLLECTION_ID,
            documentId,
            {
                status: status,
                updated_at: new Date().toISOString()
            }
        );
        console.log(`Document ${documentId} status updated to ${status}`);
    } catch (error) {
        console.error('Failed to update document status:', error);
        throw error;
    }
}

async function saveAnalysisResult(analysisId, documentId, analysisData, rawResponse, processingTime) {
    try {
        await databases.updateDocument(
            DATABASE_ID,
            ANALYSIS_COLLECTION_ID,
            analysisId,
            {
                document_id: documentId,
                summary: analysisData.summary,
                charts: analysisData.blocks,
                raw_response: rawResponse,
                processing_time: processingTime,
                status: 'completed'
            }
        );
        console.log(`Analysis result saved for document ${documentId}`);
    } catch (error) {
        console.error('Failed to save analysis result:', error);
        throw error;
    }
}

async function getDocumentAndAnalysis(documentId) {
    try {
        // Get the document
        const document = await databases.getDocument(
            DATABASE_ID,
            DOCUMENTS_COLLECTION_ID,
            documentId
        );

        // Get the pending analysis record
        const analysisRecords = await databases.listDocuments(
            DATABASE_ID,
            ANALYSIS_COLLECTION_ID,
            [
                Query.equal('document_id', documentId),
                Query.equal('status', 'pending'),
                Query.orderDesc('$createdAt'),
                Query.limit(1)
            ]
        );

        if (analysisRecords.documents.length === 0) {
            throw new Error('No pending analysis record found');
        }

        return {
            document: document,
            analysisId: analysisRecords.documents[0].$id,
            scrapedData: analysisRecords.documents[0].scraped_data
        };

    } catch (error) {
        console.error('Failed to get document and analysis:', error);
        throw error;
    }
}

module.exports = async ({ req, res, log, error }) => {
    const startTime = Date.now();

    try {
        log('LLM analyzer function started');

        // Validate request body
        if (!req.body || !req.body.documentId) {
            return res.json({
                success: false,
                error: 'Missing required field: documentId'
            }, 400);
        }

        const { documentId } = req.body;

        log(`Processing analysis for document: ${documentId}`);

        // Get document and analysis data
        const { document, analysisId, scrapedData } = await getDocumentAndAnalysis(documentId);

        if (!scrapedData || !scrapedData.content) {
            throw new Error('No scraped content available for analysis');
        }

        // Create analysis prompt
        const prompt = createAnalysisPrompt(scrapedData, document.instructions || 'Analyze this documentation comprehensively');

        // Call Hugging Face API
        const analysisResult = await callHuggingFace(prompt);

        // Validate and adjust block sizes
        analysisResult.blocks = validateBlockSizes(analysisResult.blocks);

        const processingTime = Date.now() - startTime;

        // Save analysis result
        await saveAnalysisResult(
            analysisId,
            documentId,
            analysisResult,
            JSON.stringify(analysisResult),
            processingTime
        );

        // Update document status to completed
        await updateDocumentStatus(documentId, 'completed');

        log(`Analysis completed for document ${documentId} in ${processingTime}ms`);

        return res.json({
            success: true,
            message: 'Document analysis completed successfully',
            data: {
                documentId: documentId,
                analysisId: analysisId,
                summary: analysisResult.summary,
                blockCount: analysisResult.blocks.length,
                processingTime: processingTime
            }
        }, 200);

    } catch (err) {
        const processingTime = Date.now() - startTime;
        error(`LLM analyzer error: ${err.message}`);

        // Try to update document status to failed
        if (req.body && req.body.documentId) {
            try {
                await updateDocumentStatus(req.body.documentId, 'failed');
            } catch (updateError) {
                error(`Failed to update document status: ${updateError.message}`);
            }
        }

        return res.json({
            success: false,
            error: err.message,
            processingTime: processingTime
        }, 500);
    }
};
