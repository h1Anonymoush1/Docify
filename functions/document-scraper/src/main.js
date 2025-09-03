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

// Check if this is triggered by an event (row creation)
const isEventTriggered = process.env.APPWRITE_FUNCTION_EVENT_DATA;
let eventData = null;

if (isEventTriggered) {
    try {
        eventData = JSON.parse(process.env.APPWRITE_FUNCTION_EVENT_DATA);
        console.log('Event triggered with row data:', JSON.stringify(eventData, null, 2));
        // Log the structure to understand the event data
        console.log('Event data structure:', Object.keys(eventData));

        // Check for different possible structures
        if (eventData.data) {
            console.log('Found data field:', Object.keys(eventData.data));
        }
        if (eventData.row) {
            console.log('Found row field:', Object.keys(eventData.row));
        }
    } catch (error) {
        console.error('Failed to parse event data:', error);
    }
}

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
        await page.waitForTimeout(2000);

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

async function updateDocumentStatus(documentId, status, scrapedContent = null) {
    try {
        const updateData = {
            status: status
        };

        if (scrapedContent) {
            updateData.scraped_content = scrapedContent;
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
    try {
        log('Document scraper function started');

        let documentId, url;

        // Check if triggered by event (document creation)
        if (eventData) {
            log('Function triggered by document creation event');

            // Handle different event data structures
            let rowData = eventData;

            // Check if data is nested under 'data' or 'row' field
            if (eventData.data) {
                rowData = eventData.data;
                log('Using nested data field');
            } else if (eventData.row) {
                rowData = eventData.row;
                log('Using nested row field');
            }

            documentId = rowData.$id || rowData.id;
            url = rowData.url;

            log(`Extracted documentId: ${documentId}, url: ${url}`);

            if (!documentId || !url) {
                error('Event data missing required fields. Available fields:', Object.keys(rowData));
                return res.json({
                    success: false,
                    error: 'Event data missing documentId or url'
                }, 400);
            }
        } else {
            // Manual/API trigger
            log('Function triggered manually or via API');

            // Validate request body
            if (!req.body || !req.body.documentId || !req.body.url) {
                return res.json({
                    success: false,
                    error: 'Missing required fields: documentId and url'
                }, 400);
            }

            documentId = req.body.documentId;
            url = req.body.url;
        }

        log(`Processing document: ${documentId}, URL: ${url}`);

        // Validate URL format
        try {
            new URL(url);
        } catch (e) {
            return res.json({
                success: false,
                error: 'Invalid URL format'
            }, 400);
        }

        // Update document status to scraping
        await updateDocumentStatus(documentId, 'scraping');

        // Scrape the website
        const scrapedData = await scrapeWebsite(url);

        log(`Successfully scraped ${scrapedData.wordCount} words from ${url}`);

        // Update document with scraped content
        await updateDocumentStatus(documentId, 'scraped', scrapedData);

        // Trigger LLM analysis
        await triggerLLMAnalysis(documentId, scrapedData);

        // Update document status to analyzing
        await updateDocumentStatus(documentId, 'analyzing');

        return res.json({
            success: true,
            message: 'Document scraped successfully',
            data: {
                documentId: documentId,
                wordCount: scrapedData.wordCount,
                title: scrapedData.title
            }
        }, 200);

    } catch (err) {
        error(`Document scraper error: ${err.message}`);

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
            error: err.message
        }, 500);
    }
};
