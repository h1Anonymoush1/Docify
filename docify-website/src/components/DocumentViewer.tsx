'use client';

import React, { useState, useEffect } from 'react';
import { databases } from '../lib/appwrite';
import { APPWRITE_CONFIG } from '../lib/appwrite';
import ContentBlockRenderer from './ContentBlockRenderer';

interface DocumentViewerProps {
  documentId: string;
}

// Analysis data is now part of the document (consolidated schema)
interface AnalysisData {
  summary: string;
  blocks: Array<{
    id: string;
    type: string;
    size: 'small' | 'medium' | 'large';
    title: string;
    content: string;
    metadata?: any;
  }>;
}

interface DocumentData {
  $id: string;
  url: string;
  title?: string;
  instructions?: string;
  status: 'pending' | 'scraping' | 'analyzing' | 'completed' | 'failed';
  word_count?: number;
  scraped_content?: string;
  analysis_summary?: string;
  analysis_blocks?: string; // JSON string of analysis blocks
  error_message?: string;
  public?: boolean;
  $createdAt: string;
  $updatedAt: string;
  [key: string]: any; // Allow additional properties from Appwrite
}

export default function DocumentViewer({ documentId }: DocumentViewerProps) {
  const [document, setDocument] = useState<DocumentData | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (documentId) {
      loadDocumentData();
      // Set up polling for status updates
      const interval = setInterval(loadDocumentData, 5000); // Poll every 5 seconds
      return () => clearInterval(interval);
    }
  }, [documentId]);

  const loadDocumentData = async () => {
    try {
      setError(null);

      // Load document (consolidated schema - analysis data is in the document)
      const docData = await databases.getDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.documentsCollectionId,
        documentId
      ) as unknown as DocumentData;

      setDocument(docData);

      // Extract analysis data from document if completed
      if (docData.status === 'completed' && docData.analysis_summary && docData.analysis_blocks) {
        try {
          const blocks = JSON.parse(docData.analysis_blocks);
          setAnalysis({
            summary: docData.analysis_summary,
            blocks: blocks || []
          });
        } catch (parseError) {
          console.error('Error parsing analysis blocks:', parseError);
          setAnalysis({
            summary: docData.analysis_summary,
            blocks: []
          });
        }
      } else {
        setAnalysis(null);
      }

    } catch (err) {
      console.error('Error loading document data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'scraping':
        return 'text-blue-600 bg-blue-100';
      case 'analyzing':
        return 'text-purple-600 bg-purple-100';
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Waiting to start';
      case 'scraping':
        return 'Scraping website content';
      case 'analyzing':
        return 'Analyzing with AI';
      case 'completed':
        return 'Analysis complete';
      case 'failed':
        return 'Analysis failed';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error Loading Document</h3>
          <p className="text-red-600 mt-1">{error || 'Document not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Document Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {document.title || 'Document Analysis'}
            </h1>
            <p className="text-gray-600 mb-4">
              <a
                href={document.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                {document.url}
              </a>
            </p>
            <div className="flex items-center space-x-4 text-sm">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(document.status)}`}>
                {getStatusText(document.status)}
              </span>
              <span className="text-gray-500">
                Created: {new Date(document.$createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Processing Status */}
      {document.status !== 'completed' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
            <div>
              <h3 className="text-blue-800 font-medium">Processing Document</h3>
              <p className="text-blue-600 mt-1">
                {document.status === 'pending' && 'Your document is queued for processing.'}
                {document.status === 'scraping' && 'Extracting content from the website...'}
                {document.status === 'analyzing' && 'AI is analyzing the content and generating insights...'}
                {document.status === 'failed' && 'Document processing failed. Please try again.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Results */}
      {document.status === 'completed' && analysis && (
        <div>
          {/* Summary */}
          {analysis.summary && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Summary</h2>
              <p className="text-gray-700 leading-relaxed">{analysis.summary}</p>
            </div>
          )}

          {/* Content Blocks Grid */}
          {analysis.blocks && analysis.blocks.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Analysis Results</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {analysis.blocks.map((block) => (
                  <ContentBlockRenderer key={block.id} block={block} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State for Failed Documents */}
      {document.status === 'failed' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-red-800 font-medium mb-2">Processing Failed</h3>
          <p className="text-red-600 mb-4">
            We encountered an error while processing your document. This could be due to:
          </p>
          <ul className="list-disc list-inside text-red-600 space-y-1 mb-4">
            <li>The website being temporarily unavailable</li>
            <li>Content blocking scraping attempts</li>
            <li>Network connectivity issues</li>
          </ul>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
