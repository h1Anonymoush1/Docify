const { Readability } = require('@mozilla/readability');
const TurndownService = require('turndown');
const { JSDOM } = require('jsdom');
const { decode: decodeHtmlEntities } = require('html-entities');

module.exports = async ({ req, res, log, error }) => {
    try {
        log('URL to Markdown converter started');

        // Validate input - accept both GET and POST
        let url = req.query?.url;

        if (!url && req.body?.url) {
            url = req.body.url;
        }

        if (!url) {
            return res.json({
                success: false,
                error: 'Missing required parameter: url'
            }, 400);
        }

        // Basic URL validation
        try {
            new URL(url);
        } catch (e) {
            return res.json({
                success: false,
                error: 'Invalid URL format'
            }, 400);
        }

        log(`Converting URL: ${url}`);

        // Smart HTTP fetching with multiple techniques
        let html;
        let fetchMethod = 'basic';

        // Try different fetching strategies
        const fetchStrategies = [
            // Strategy 1: Modern browser headers
            {
                name: 'modern-browser',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'DNT': '1',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1',
                    'Sec-Fetch-Dest': 'document',
                    'Sec-Fetch-Mode': 'navigate',
                    'Sec-Fetch-Site': 'none',
                    'Cache-Control': 'max-age=0'
                }
            },
            // Strategy 2: Mobile user agent (sometimes servers serve different content)
            {
                name: 'mobile',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept-Encoding': 'gzip, deflate, br'
                }
            },
            // Strategy 3: Bot-like headers (for sites that block bots but serve content)
            {
                name: 'bot-friendly',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; URLToMarkdown/1.0; +https://github.com/macsplit/urltomarkdown)',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9'
                }
            }
        ];

        for (const strategy of fetchStrategies) {
            try {
                log(`Trying fetch strategy: ${strategy.name}`);
                const response = await fetch(url, {
                    headers: strategy.headers,
                    timeout: 15000 // 15 second timeout
                });

                if (response.ok) {
                    html = await response.text();
                    fetchMethod = strategy.name;
                    log(`Successfully fetched ${html.length} characters using ${strategy.name} strategy`);

                    // Check if content seems too small (likely JS-dependent)
                    if (html.length < 10000) {
                        log(`Content seems small (${html.length} chars), might be JS-dependent. Will try rendering services.`);
                        // Don't break here, continue to try rendering services
                        continue;
                    }
                    break;
                } else {
                    log(`${strategy.name} failed with status: ${response.status}`);
                }
            } catch (strategyError) {
                log(`${strategy.name} failed: ${strategyError.message}`);
            }
        }

        // Try JS rendering services if content seems small or if all strategies failed
        let triedRenderingServices = false;
        if (!html || html.length < 10000) {
            triedRenderingServices = true;
            log('Content seems small or no content fetched, trying JS rendering services...');

            // Try Browserless.io first (user has API key from environment)
            const BROWSERLESS_API_KEY = process.env.BROWSERLESS_API_KEY || '2T0bvQyY97vLwVR9e727f50122638fea1e65a05d04246810c';

            try {
                log('Trying Browserless.io...');
                // Try the correct Browserless.io API format
                const browserlessUrl = `https://production-sfo.browserless.io/content?token=${BROWSERLESS_API_KEY}`;
                const response = await fetch(browserlessUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        url: url,
                        gotoOptions: {
                            waitUntil: 'networkidle2',
                            timeout: 30000
                        }
                    })
                });

                if (response.ok) {
                    const renderedHtml = await response.text();
                    if (renderedHtml.length > (html?.length || 0)) {
                        html = renderedHtml;
                        fetchMethod = 'browserless-io';
                        log(`Successfully rendered ${html.length} characters using Browserless.io (improvement: +${renderedHtml.length - (html?.length || 0)} chars)`);
                    } else {
                        log(`Browserless.io returned same or smaller content (${renderedHtml.length} chars vs ${(html?.length || 0)})`);
                    }
                } else {
                    const errorText = await response.text();
                    log(`Browserless.io failed with status: ${response.status} - ${errorText}`);
                }
            } catch (browserlessError) {
                log(`Browserless.io error: ${browserlessError.message}`);
            }

            // Fallback to free services if Browserless.io didn't help
            if (!html || html.length < 10000) {
                const freeServices = [
                    {
                        name: 'rendertron-free',
                        url: `https://render-tron.appspot.com/render/${encodeURIComponent(url)}`,
                        type: 'direct'
                    }
                ];

                for (const service of freeServices) {
                    try {
                        log(`Trying fallback ${service.name}...`);
                        const response = await fetch(service.url, {
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (compatible; URLToMarkdown/1.0)'
                            }
                        });

                        if (response.ok) {
                            const renderedHtml = await response.text();
                            if (renderedHtml.length > (html?.length || 0)) {
                                html = renderedHtml;
                                fetchMethod = service.name;
                                log(`Successfully rendered ${html.length} characters using ${service.name} (improvement: +${renderedHtml.length - (html?.length || 0)} chars)`);
                                break;
                            } else {
                                log(`${service.name} returned same or smaller content (${renderedHtml.length} chars)`);
                            }
                        }
                    } catch (serviceError) {
                        log(`${service.name} failed: ${serviceError.message}`);
                    }
                }
            }
        }

        // If still no HTML, return helpful error
        if (!html) {
            return res.json({
                success: false,
                error: 'Failed to fetch content from all sources including Browserless.io rendering service.',
                tried_rendering: triedRenderingServices,
                current_strategy: 'Browserless.io API + fallback services',
                tips: [
                    'Check if the website blocks automated access',
                    'Some sites require specific authentication',
                    'Very heavy JavaScript sites may need more advanced scraping'
                ],
                free_options: [
                    'Browserless.io (API key configured)',
                    'https://render-tron.appspot.com/render/[URL] (Google service)',
                    'Deploy Puppeteer on free hosting (Render, Railway, Fly.io)'
                ],
                paid_options: [
                    'Browserless.io Pro ($29/month)',
                    'ScrapingBee ($49/month)',
                    'ScrapFly ($30/month)'
                ]
            }, 400);
        }

        // Parse with JSDOM
        const dom = new JSDOM(html, { url });
        const document = dom.window.document;

        // First try Readability for article-style content
        const reader = new Readability(document);
        const article = reader.parse();

        let htmlContent;

        if (article && article.content) {
            log('Using Readability extracted content');
            htmlContent = article.content;
        } else {
            log('Readability failed, falling back to body content');

            // Fallback: try to find main content areas
            const body = document.body;
            if (!body) {
                return res.json({
                    success: false,
                    error: 'Could not find page content'
                }, 400);
            }

            // Remove common non-content elements
            const elementsToRemove = body.querySelectorAll('script, style, nav, header, footer, aside, .sidebar, .navigation, .menu, .advertisement, .ads');
            elementsToRemove.forEach(el => el.remove());

            // Try to find main content container
            const mainSelectors = ['main', '[role="main"]', '.main-content', '.content', '.documentation', '.docs-content', '#content', '#main', '.container'];
            let mainContent = null;

            for (const selector of mainSelectors) {
                mainContent = body.querySelector(selector);
                if (mainContent && mainContent.textContent.trim().length > 100) {
                    log(`Found content using selector: ${selector}`);
                    break;
                }
            }

            // If no main content found, use the entire body
            if (!mainContent || mainContent.textContent.trim().length < 100) {
                log('Using entire body content');
                mainContent = body;
            }

            htmlContent = mainContent.outerHTML;
        }

        // Convert HTML to Markdown using Turndown
        const turndownService = new TurndownService({
            headingStyle: 'atx',
            codeBlockStyle: 'fenced'
        });

        // Custom rules for better formatting
        turndownService.addRule('strikethrough', {
            filter: ['del', 's', 'strike'],
            replacement: (content) => `~~${content}~~`
        });

        turndownService.addRule('highlight', {
            filter: ['mark'],
            replacement: (content) => `==${content}==`
        });

        // Convert the content
        let markdown = turndownService.turndown(htmlContent);

        // Clean up the markdown
        markdown = markdown
            // Remove excessive blank lines
            .replace(/\n{3,}/g, '\n\n')
            // Decode HTML entities
            .replace(/&[a-zA-Z0-9#]+;/g, (entity) => {
                try {
                    return decodeHtmlEntities(entity);
                } catch {
                    return entity;
                }
            })
            // Trim whitespace
            .trim();

        // Add title if available (check both article.title and document.title)
        let pageTitle = null;
        if (article && article.title) {
            pageTitle = article.title;
        } else if (document && document.title) {
            pageTitle = document.title;
        } else {
            // Try to find title in various ways
            try {
                const titleElement = document.querySelector('title');
                if (titleElement && titleElement.textContent) {
                    pageTitle = titleElement.textContent.trim();
                }
            } catch (e) {
                log('Error accessing title element:', e.message);
            }

            if (!pageTitle) {
                // Fallback: extract from URL or use generic title
                const urlParts = url.split('/');
                pageTitle = urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2] || 'Document';
                pageTitle = pageTitle.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            }
        }

        // Add title to markdown if available
        if (pageTitle) {
            markdown = `# ${pageTitle}\n\n${markdown}`;
        }

        log(`Conversion completed. Output length: ${markdown.length} characters`);
        log(`Fetch method used: ${fetchMethod}`);
        log(`Full Markdown Output: ${markdown}`);

        return res.json({
            success: true,
            data: {
                url: url,
                title: pageTitle || null,
                markdown: markdown,
                excerpt: (article && article.excerpt) || null,
                length: markdown.length
            }
        }, 200);

    } catch (err) {
        error(`URL to Markdown converter error: ${err.message}`);

        return res.json({
            success: false,
            error: err.message || 'Internal server error'
        }, 500);
    }
};
