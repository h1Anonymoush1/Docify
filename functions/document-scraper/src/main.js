const { Client, Databases, ID } = require('node-appwrite');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

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

async function scrapeWebsite(url) {
    let browser = null;
    try {
        console.log(`Starting to scrape: ${url}`);

        // Launch browser with minimal configuration for server environment
        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process',
                '--disable-gpu'
            ]
        });

        const page = await browser.newPage();

        // Set user agent to avoid blocking
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

        // Set timeout and wait for page to load
        await page.setDefaultTimeout(30000);

        // Navigate to the URL
        const response = await page.goto(url, {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        if (!response.ok()) {
            throw new Error(`Failed to load page: ${response.status()} ${response.statusText()}`);
        }

        // Wait for content to load
        await page.waitForFunction(() => {
            return document.readyState === 'complete';
        }, { timeout: 10000 });

        // Extract content using multiple strategies
        const content = await page.evaluate(() => {
            // Try to find main content areas
            const selectors = [
                'main',
                '[role="main"]',
                '.content',
                '.main-content',
                '#content',
                '#main',
                'article',
                '.article-content',
                '.post-content',
                '.entry-content'
            ];

            let mainContent = '';

            // Try selectors in order
            for (const selector of selectors) {
                const element = document.querySelector(selector);
                if (element && element.textContent.trim().length > 100) {
                    mainContent = element.textContent.trim();
                    break;
                }
            }

            // Fallback to body content if no main content found
            if (!mainContent || mainContent.length < 100) {
                mainContent = document.body.textContent.trim();
            }

            // Get page title
            const title = document.title || '';

            // Get meta description
            const metaDesc = document.querySelector('meta[name="description"]');
            const description = metaDesc ? metaDesc.getAttribute('content') : '';

            return {
                title: title,
                description: description,
                content: mainContent,
                url: window.location.href
            };
        });

        // Clean and process the content
        const cleanedContent = cleanContent(content.content);

        return {
            ...content,
            content: cleanedContent,
            wordCount: cleanedContent.split(/\s+/).length,
            scrapedAt: new Date().toISOString()
        };

    } catch (error) {
        console.error('Scraping error:', error);
        throw new Error(`Failed to scrape website: ${error.message}`);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

function cleanContent(content) {
    return content
        // Remove excessive whitespace
        .replace(/\s+/g, ' ')
        // Remove navigation and footer content (common patterns)
        .replace(/\b(home|menu|navigation|footer|copyright|privacy|terms)\b/gi, '')
        // Remove email addresses
        .replace(/\S+@\S+\.\S+/g, '[EMAIL]')
        // Remove URLs
        .replace(/https?:\/\/[^\s]+/g, '[URL]')
        // Remove phone numbers
        .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE]')
        // Trim and clean up
        .trim();
}

async function updateDocumentStatus(documentId, status, scrapedContent = null, url = null) {
    try {
        const updateData = {
            status: status
        };

        // Only include scraped content and title if provided
        if (scrapedContent) {
            updateData.scraped_content = scrapedContent.content;
            updateData.title = scrapedContent.title;
        }

        await databases.updateDocument(
            DATABASE_ID,
            DOCUMENTS_COLLECTION_ID,
            documentId,
            updateData
        );

        console.log(`Document ${documentId} status updated to ${status}`);
    } catch (error) {
        console.error('Failed to update document status:', error);
        throw error;
    }
}

async function triggerLLMAnalysis(documentId, scrapedData) {
    try {
        // Create analysis result record to trigger the LLM function
        await databases.createDocument(
            DATABASE_ID,
            ANALYSIS_COLLECTION_ID,
            ID.unique(),
            {
                document_id: documentId,
                status: 'pending',
                scraped_data: scrapedData
            }
        );

        console.log(`LLM analysis triggered for document ${documentId}`);
    } catch (error) {
        console.error('Failed to trigger LLM analysis:', error);
        throw error;
    }
}

module.exports = async ({ req, res, log, error }) => {
    let documentId = null;
    let url = null;

    try {
        log('=== DOCUMENT SCRAPER STARTED ===');

        // Determine trigger type
        const triggerType = req.headers['x-appwrite-trigger'] || 'unknown';
        log(`Trigger type: ${triggerType}`);

        // Extract data based on trigger type
        if (triggerType === 'event') {
            // Event trigger - document data is in req.body
            log('Processing event trigger');
            if (req.body && req.body.$id && req.body.url) {
                documentId = req.body.$id;
                url = req.body.url;
                log(`Event data extracted - ID: ${documentId}, URL: ${url}`);
            } else {
                throw new Error('Event data missing required fields ($id or url)');
            }
        } else if (triggerType === 'http') {
            // Manual API trigger
            log('Processing HTTP trigger');
            if (req.body && req.body.documentId && req.body.url) {
                documentId = req.body.documentId;
                url = req.body.url;
                log(`API data extracted - ID: ${documentId}, URL: ${url}`);
            } else {
                throw new Error('API request missing required fields (documentId or url)');
            }
        } else {
            // Unknown trigger - try both approaches
            log('Processing unknown trigger type, attempting both extraction methods');
            if (req.body) {
                // Try event format first
                if (req.body.$id && req.body.url) {
                    documentId = req.body.$id;
                    url = req.body.url;
                    log(`Extracted using event format - ID: ${documentId}, URL: ${url}`);
                }
                // Try API format
                else if (req.body.documentId && req.body.url) {
                    documentId = req.body.documentId;
                    url = req.body.url;
                    log(`Extracted using API format - ID: ${documentId}, URL: ${url}`);
                } else {
                    log('Request body structure:', JSON.stringify(req.body, null, 2));
                    throw new Error('Unable to extract documentId and url from request');
                }
            } else {
                throw new Error('No request body found');
            }
        }

        // Validate extracted data
        if (!documentId || !url) {
            throw new Error(`Missing required data - documentId: ${!!documentId}, url: ${!!url}`);
        }

        // Log extracted data
        log(`Final data - Document ID: ${documentId}, URL: ${url}`);

        // Validate URL format with detailed error handling
        log(`Validating URL: ${url}`);
        if (!url || typeof url !== 'string') {
            throw new Error('URL is not a valid string');
        }

        const trimmedUrl = url.trim();
        if (!trimmedUrl) {
            throw new Error('URL is empty after trimming');
        }

        try {
            new URL(trimmedUrl);
            log('URL validation passed');
        } catch (urlError) {
            log(`URL validation failed: ${urlError.message}`);
            throw new Error(`Invalid URL format: ${urlError.message}`);
        }

        // Update document status to scraping
        log('Updating document status to scraping...');
        await updateDocumentStatus(documentId, 'scraping', null, trimmedUrl);

        // Scrape the website
        log(`Starting website scraping for: ${trimmedUrl}`);
        const scrapedData = await scrapeWebsite(trimmedUrl);

        log(`Scraping completed - ${scrapedData.wordCount} words scraped`);

        // Update document with scraped content
        log('Updating document with scraped content...');
        await updateDocumentStatus(documentId, 'scraped', scrapedData, trimmedUrl);

        // Trigger LLM analysis
        log('Triggering LLM analysis...');
        await triggerLLMAnalysis(documentId, scrapedData);

        // Update document status to analyzing
        log('Updating document status to analyzing...');
        await updateDocumentStatus(documentId, 'analyzing', null, trimmedUrl);

        log('=== DOCUMENT SCRAPER COMPLETED SUCCESSFULLY ===');

        return res.json({
            success: true,
            message: 'Document scraped and analysis triggered successfully',
            data: {
                documentId: documentId,
                wordCount: scrapedData.wordCount,
                title: scrapedData.title,
                url: trimmedUrl
            }
        }, 200);

    } catch (err) {
        error(`Document scraper failed: ${err.message}`);

        // Try to update document status to failed if we have a documentId
        if (documentId) {
            try {
                log(`Updating document ${documentId} status to failed`);
                await updateDocumentStatus(documentId, 'failed', null, url);
            } catch (updateError) {
                error(`Failed to update document status: ${updateError.message}`);
            }
        }

        log('=== DOCUMENT SCRAPER FAILED ===');

        return res.json({
            success: false,
            error: err.message,
            documentId: documentId,
            url: url
        }, 500);
    }
};

