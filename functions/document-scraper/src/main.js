import { Client, Databases, Storage, Functions } from 'node-appwrite';
import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import pdfParse from 'pdf-parse';
import TurndownService from 'turndown';
import crypto from 'crypto';
import { URL } from 'url';

export default async ({ req, res, log, error }) => {
  try {
    // Initialize Appwrite clients
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);

    const databases = new Databases(client);
    const storage = new Storage(client);
    const functions = new Functions(client);

    // Parse input
    const { url, userId, summaryId, options = {} } = JSON.parse(req.payload);

    log(`Starting document scraping for URL: ${url}, summaryId: ${summaryId}`);

    // Validate URL
    const urlInfo = await validateUrl(url);
    if (!urlInfo.isValid) {
      throw new Error(`Invalid URL: ${urlInfo.error}`);
    }

    // Update summary status to scraping
    await databases.updateDocument(
      process.env.DATABASE_ID,
      'summaries',
      summaryId,
      {
        status: 'scraping',
        updatedAt: new Date().toISOString()
      }
    );

    // Detect content type
    const contentType = await detectContentType(url);
    log(`Detected content type: ${contentType}`);

    // Scrape content based on type
    let scrapedData;
    const startTime = Date.now();

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

    const processingTime = Date.now() - startTime;

    // Clean and structure the content
    const cleanedData = await cleanContent(scrapedData);

    // Save to Appwrite Storage
    const storageFileId = await saveToStorage(storage, summaryId, cleanedData);

    // Update database with scraping results
    await databases.updateDocument(
      process.env.DATABASE_ID,
      'summaries',
      summaryId,
      {
        status: 'scraped',
        scrapedDataId: storageFileId,
        contentType: contentType,
        title: cleanedData.title,
        updatedAt: new Date().toISOString()
      }
    );

    // Trigger content validator function
    await functions.createExecution(
      'content-validator',
      JSON.stringify({
        summaryId,
        userId,
        scrapedDataId: storageFileId
      }),
      false
    );

    log(`Document scraping completed successfully for summaryId: ${summaryId}`);

    return res.json({
      success: true,
      summaryId,
      data: {
        title: cleanedData.title,
        contentType,
        wordCount: cleanedData.wordCount,
        metadata: {
          url: url,
          domain: urlInfo.domain,
          extractedAt: new Date().toISOString(),
          processingTime,
          contentLength: cleanedData.content.length
        }
      }
    });

  } catch (err) {
    error(`Scraping failed: ${err.message}`);

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
      error: {
        code: err.code || 'SCRAPING_ERROR',
        message: err.message
      }
    }, 500);
  }
};

// Helper Functions

async function validateUrl(url) {
  try {
    const urlObj = new URL(url);

    // Check if it's a valid HTTP/HTTPS URL
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { isValid: false, error: 'URL must use HTTP or HTTPS protocol' };
    }

    // Check for localhost/private IPs (security)
    const hostname = urlObj.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1' ||
        hostname.startsWith('192.168.') || hostname.startsWith('10.') ||
        hostname.startsWith('172.')) {
      return { isValid: false, error: 'Private/localhost URLs are not allowed' };
    }

    return {
      isValid: true,
      domain: hostname,
      url: urlObj.href
    };
  } catch (err) {
    return { isValid: false, error: 'Invalid URL format' };
  }
}

async function detectContentType(url) {
  try {
    // Try to fetch headers first to detect content type
    const response = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': process.env.USER_AGENT || 'Docify-Bot/1.0'
      }
    });

    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('text/html')) {
      return 'text/html';
    } else if (contentType.includes('text/markdown') || url.endsWith('.md')) {
      return 'text/markdown';
    } else if (contentType.includes('application/pdf') || url.endsWith('.pdf')) {
      return 'application/pdf';
    } else {
      return 'text/plain';
    }
  } catch (err) {
    // Fallback: check file extension
    if (url.endsWith('.pdf')) return 'application/pdf';
    if (url.endsWith('.md')) return 'text/markdown';
    return 'text/html'; // Default assumption
  }
}

async function scrapeHtml(url, options) {
  const browser = await puppeteer.launch({
    headless: true,
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

  try {
    const page = await browser.newPage();
    await page.setUserAgent(process.env.USER_AGENT || 'Docify-Bot/1.0');

    // Set reasonable timeouts
    const timeout = (options.timeout || 30) * 1000;
    await page.setDefaultTimeout(timeout);
    await page.setDefaultNavigationTimeout(timeout);

    await page.goto(url, {
      waitUntil: 'networkidle0',
      timeout: timeout
    });

    // Extract content
    const content = await page.evaluate(() => {
      // Remove unwanted elements
      const elementsToRemove = document.querySelectorAll(
        'script, style, nav, header, footer, .advertisement, .ads, .sidebar, aside'
      );
      elementsToRemove.forEach(el => el.remove());

      // Try to find main content
      const mainSelectors = [
        'main',
        'article',
        '[role="main"]',
        '.content',
        '#content',
        '.post-content',
        '.entry-content',
        'body'
      ];

      let mainElement = null;
      for (const selector of mainSelectors) {
        mainElement = document.querySelector(selector);
        if (mainElement && mainElement.textContent.trim().length > 100) {
          break;
        }
      }

      if (!mainElement) {
        mainElement = document.body;
      }

      return {
        title: document.title || 'Untitled Document',
        html: mainElement.innerHTML,
        text: mainElement.textContent || mainElement.innerText || '',
        url: window.location.href
      };
    });

    return content;
  } finally {
    await browser.close();
  }
}

async function scrapeMarkdown(url, options) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': process.env.USER_AGENT || 'Docify-Bot/1.0'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch markdown: ${response.status}`);
  }

  const text = await response.text();

  return {
    title: extractTitleFromMarkdown(text) || 'Markdown Document',
    content: text,
    text: text,
    url: url
  };
}

async function scrapePdf(url, options) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': process.env.USER_AGENT || 'Docify-Bot/1.0'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch PDF: ${response.status}`);
  }

  const buffer = await response.arrayBuffer();
  const data = await pdfParse(Buffer.from(buffer));

  return {
    title: extractTitleFromPdf(data.text) || 'PDF Document',
    content: data.text,
    text: data.text,
    url: url,
    metadata: {
      pages: data.numpages,
      info: data.info
    }
  };
}

async function scrapeGeneric(url, options) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': process.env.USER_AGENT || 'Docify-Bot/1.0'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch content: ${response.status}`);
  }

  const text = await response.text();

  return {
    title: 'Document',
    content: text,
    text: text,
    url: url
  };
}

async function cleanContent(scrapedData) {
  let { title, content, text } = scrapedData;

  // Clean title
  title = title.trim().replace(/\s+/g, ' ').substring(0, 255);

  // Clean text content
  text = text
    .replace(/\s+/g, ' ')  // Normalize whitespace
    .replace(/\n\s*\n/g, '\n\n')  // Clean up line breaks
    .trim();

  // Convert HTML to markdown if needed
  if (scrapedData.html && !text.includes('#')) {
    const turndown = new TurndownService();
    content = turndown.turndown(scrapedData.html);
  } else {
    content = text;
  }

  // Calculate word count
  const wordCount = text.split(/\s+/).length;

  return {
    title,
    content,
    text,
    wordCount,
    url: scrapedData.url
  };
}

async function saveToStorage(storage, summaryId, cleanedData) {
  const fileName = `scraped-${summaryId}-${Date.now()}.json`;

  // Create file content
  const fileContent = JSON.stringify({
    title: cleanedData.title,
    content: cleanedData.content,
    text: cleanedData.text,
    wordCount: cleanedData.wordCount,
    url: cleanedData.url,
    scrapedAt: new Date().toISOString()
  }, null, 2);

  // Upload to storage
  const file = await storage.createFile(
    process.env.STORAGE_BUCKET_ID,
    'unique()',
    new File([fileContent], fileName, { type: 'application/json' })
  );

  return file.$id;
}

function extractTitleFromMarkdown(text) {
  const lines = text.split('\n');
  for (const line of lines.slice(0, 10)) {
    const trimmed = line.trim();
    if (trimmed.startsWith('# ')) {
      return trimmed.substring(2).trim();
    }
  }
  return null;
}

function extractTitleFromPdf(text) {
  const lines = text.split('\n').slice(0, 5);
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length > 10 && trimmed.length < 100) {
      return trimmed;
    }
  }
  return null;
}
