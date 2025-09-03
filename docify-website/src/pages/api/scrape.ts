import { NextApiRequest, NextApiResponse } from 'next';
import { Functions, Client } from 'node-appwrite';

const client = new Client();

if (process.env.APPWRITE_ENDPOINT && process.env.APPWRITE_PROJECT_ID && process.env.APPWRITE_API_KEY) {
  client
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);
}

const functions = new Functions(client);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { documentId, url } = req.body;

    if (!documentId || !url) {
      return res.status(400).json({
        error: 'Missing required fields: documentId and url'
      });
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return res.status(400).json({
        error: 'Invalid URL format'
      });
    }

    console.log(`Triggering scraper for document: ${documentId}, URL: ${url}`);

    // Execute the document scraper function
    const execution = await functions.createExecution(
      'document-scraper', // Function ID
      JSON.stringify({
        documentId,
        url
      })
    );

    console.log('Scraper execution created:', execution);

    return res.status(200).json({
      success: true,
      executionId: execution.$id,
      message: 'Document scraping started successfully'
    });

  } catch (error) {
    console.error('Error triggering scraper:', error);
    return res.status(500).json({
      error: 'Failed to start document scraping',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
