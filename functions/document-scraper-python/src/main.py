import os
import requests
from bs4 import BeautifulSoup
from appwrite.client import Client
from appwrite.services.databases import Databases
from appwrite.id import ID
import re
from urllib.parse import urlparse

# Appwrite configuration helper
def get_env_var(name, default=None):
    """Get environment variable with error handling."""
    value = os.environ.get(name, default)
    if value is None:
        raise ValueError(f"Required environment variable {name} is not set")
    return value

def init_appwrite_client(req):
    """Initialize Appwrite client using dynamic API key from headers."""
    try:
        client = Client()
        client.set_endpoint(get_env_var('APPWRITE_FUNCTION_API_ENDPOINT'))
        client.set_project(get_env_var('APPWRITE_FUNCTION_PROJECT_ID'))

        # Get dynamic API key from headers (x-appwrite-key)
        api_key = req.headers.get('x-appwrite-key')
        if not api_key:
            raise ValueError("Dynamic API key not found in x-appwrite-key header")

        client.set_key(api_key)
        print("Appwrite client initialized successfully with dynamic API key")
        return client
    except Exception as e:
        print(f"Error initializing Appwrite client: {e}")
        raise

# Database configuration
DATABASE_ID = os.environ.get('DATABASE_ID', 'docify_db')
DOCUMENTS_COLLECTION_ID = os.environ.get('DOCUMENTS_COLLECTION_ID', 'documents_table')
ANALYSIS_COLLECTION_ID = os.environ.get('ANALYSIS_COLLECTION_ID', 'analysis_results')


def scrape_website(url):
    """Scrape content from a website URL."""
    try:
        print(f"Starting to scrape: {url}")

        # Set up headers to mimic a real browser
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }

        # Make the request
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()

        # Parse the HTML
        soup = BeautifulSoup(response.content, 'lxml')

        # Extract title
        title = soup.title.string if soup.title else ''

        # Extract meta description
        meta_desc = soup.find('meta', attrs={'name': 'description'})
        description = meta_desc.get('content', '') if meta_desc else ''

        # Try to find main content areas
        content_selectors = [
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
        ]

        main_content = ''

        # Try selectors in order
        for selector in content_selectors:
            try:
                element = soup.select_one(selector)
                if element and len(element.get_text().strip()) > 100:
                    main_content = element.get_text().strip()
                    break
            except:
                continue

        # Fallback to body content
        if not main_content or len(main_content) < 100:
            main_content = soup.body.get_text().strip() if soup.body else ''

        # Clean the content
        cleaned_content = clean_content(main_content)

        return {
            'title': title,
            'description': description,
            'content': cleaned_content,
            'url': url,
            'word_count': len(cleaned_content.split()),
            'scraped_at': 'now'  # Appwrite will handle timestamp
        }

    except Exception as error:
        print(f'Scraping error: {error}')
        raise Exception(f'Failed to scrape website: {str(error)}')


def clean_content(content):
    """Clean and process scraped content."""
    # Remove excessive whitespace
    content = re.sub(r'\s+', ' ', content)

    # Remove navigation and footer content
    content = re.sub(r'\b(home|menu|navigation|footer|copyright|privacy|terms)\b', '', content, flags=re.IGNORECASE)

    # Remove emails, URLs, and phone numbers
    content = re.sub(r'\S+@\S+\.\S+', '[EMAIL]', content)
    content = re.sub(r'https?://[^\s]+', '[URL]', content)
    content = re.sub(r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b', '[PHONE]', content)

    return content.strip()


def update_document_status(databases, document_id, status, scraped_content=None):
    """Update document status in database."""
    try:
        update_data = {'status': status}

        # Only include scraped content and title if provided
        if scraped_content:
            update_data['scraped_content'] = scraped_content['content']
            update_data['title'] = scraped_content['title']

        databases.update_document(
            DATABASE_ID,
            DOCUMENTS_COLLECTION_ID,
            document_id,
            update_data
        )

        print(f'Document {document_id} status updated to {status}')
    except Exception as error:
        print(f'Failed to update document status: {error}')
        raise error


def trigger_llm_analysis(databases, document_id, scraped_data):
    """Trigger LLM analysis by creating analysis record."""
    try:
        databases.create_document(
            DATABASE_ID,
            ANALYSIS_COLLECTION_ID,
            ID.unique(),
            {
                'document_id': document_id,
                'summary': 'Analysis in progress...',  # Placeholder
                'charts': '[]',  # Empty array placeholder
                'raw_response': None,
                'processing_time': 0
            }
        )

        print(f'LLM analysis triggered for document {document_id}')
    except Exception as error:
        print(f'Failed to trigger LLM analysis: {error}')
        raise error


def main(context):
    """Main function handler."""
    document_id = None
    url = None

    try:
        print('=== DOCUMENT SCRAPER STARTED ===')

        # Initialize Appwrite client with dynamic API key
        client = init_appwrite_client(context.req)
        databases = Databases(client)

        # Determine trigger type
        trigger_type = context.req.headers.get('x-appwrite-trigger', 'unknown')
        print(f'Trigger type: {trigger_type}')

        # Extract data based on trigger type
        if trigger_type == 'event':
            print('Processing event trigger')
            if context.req.body and context.req.body.get('$id') and context.req.body.get('url'):
                document_id = context.req.body['$id']
                url = context.req.body['url']
                print(f'Event data extracted - ID: {document_id}, URL: {url}')
            else:
                raise Exception('Event data missing required fields ($id or url)')
        elif trigger_type == 'http':
            print('Processing HTTP trigger')
            if context.req.body and context.req.body.get('documentId') and context.req.body.get('url'):
                document_id = context.req.body['documentId']
                url = context.req.body['url']
                print(f'API data extracted - ID: {document_id}, URL: {url}')
            else:
                raise Exception('API request missing required fields (documentId or url)')
        else:
            print('Processing unknown trigger type, attempting both extraction methods')
            if context.req.body:
                if context.req.body.get('$id') and context.req.body.get('url'):
                    document_id = context.req.body['$id']
                    url = context.req.body['url']
                    print(f'Extracted using event format - ID: {document_id}, URL: {url}')
                elif context.req.body.get('documentId') and context.req.body.get('url'):
                    document_id = context.req.body['documentId']
                    url = context.req.body['url']
                    print(f'Extracted using API format - ID: {document_id}, URL: {url}')
                else:
                    print(f'Request body structure: {context.req.body}')
                    raise Exception('Unable to extract documentId and url from request')
            else:
                raise Exception('No request body found')

        # Validate extracted data
        if not document_id or not url:
            raise Exception(f'Missing required data - documentId: {bool(document_id)}, url: {bool(url)}')

        print(f'Final data - Document ID: {document_id}, URL: {url}')

        # Validate URL format
        print(f'Validating URL: {url}')
        try:
            parsed = urlparse(url)
            if not parsed.scheme or not parsed.netloc:
                raise Exception('Invalid URL format')
            print('URL validation passed')
        except Exception as url_error:
            print(f'URL validation failed: {url_error}')
            raise Exception(f'Invalid URL format: {str(url_error)}')

        # Update document status to scraping
        print('Updating document status to scraping...')
        update_document_status(databases, document_id, 'scraping')

        # Scrape the website
        print(f'Starting website scraping for: {url}')
        scraped_data = scrape_website(url)

        print(f'Scraping completed - {scraped_data["word_count"]} words scraped')

        # Update document with scraped content
        print('Updating document with scraped content...')
        update_document_status(databases, document_id, 'analyzing', scraped_data)

        # Trigger LLM analysis
        print('Triggering LLM analysis...')
        trigger_llm_analysis(databases, document_id, scraped_data)

        print('=== DOCUMENT SCRAPER COMPLETED SUCCESSFULLY ===')

        return context.res.json({
            'success': True,
            'message': 'Document scraped and analysis triggered successfully',
            'data': {
                'documentId': document_id,
                'wordCount': scraped_data['word_count'],
                'title': scraped_data['title'],
                'url': url
            }
        }, 200)

    except Exception as err:
        print(f'Document scraper failed: {err}')

        # Try to update document status to failed if we have a documentId
        if document_id:
            try:
                print(f'Updating document {document_id} status to failed')
                update_document_status(databases, document_id, 'failed')
            except Exception as update_error:
                print(f'Failed to update document status: {update_error}')

        print('=== DOCUMENT SCRAPER FAILED ===')

        return context.res.json({
            'success': False,
            'error': str(err),
            'documentId': document_id,
            'url': url
        }, 500)
