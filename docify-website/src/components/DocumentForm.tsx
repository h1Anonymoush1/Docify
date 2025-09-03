'use client';

import React, { useState } from 'react';
import { databases, account, ID } from '../lib/appwrite';
import { APPWRITE_CONFIG } from '../lib/appwrite';

interface DocumentFormProps {
  onSuccess?: (documentId: string) => void;
  onError?: (error: string) => void;
}

export default function DocumentForm({ onSuccess, onError }: DocumentFormProps) {
  const [url, setUrl] = useState('');
  const [instructions, setInstructions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{url?: string; instructions?: string}>({});

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const validateForm = (): boolean => {
    const newErrors: {url?: string; instructions?: string} = {};

    if (!url.trim()) {
      newErrors.url = 'URL is required';
    } else if (!validateUrl(url)) {
      newErrors.url = 'Please enter a valid URL';
    }

    if (!instructions.trim()) {
      newErrors.instructions = 'Instructions are required';
    } else if (instructions.length < 10) {
      newErrors.instructions = 'Instructions must be at least 10 characters long';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      // Get current user
      const user = await account.get();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Create document record
      const documentData = {
        url: url.trim(),
        instructions: instructions.trim(),
        status: 'pending',
        user_id: user.$id
      };

      const document = await databases.createDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.documentsCollectionId,
        ID.unique(),
        documentData
      );

      console.log('Document created:', document);

      // The scraper function will be automatically triggered by the document creation event
      // No need to manually call the API - this is handled by Appwrite's event system
      console.log('Scraping will be automatically triggered by document creation event');

      // Reset form
      setUrl('');
      setInstructions('');

      // Call success callback
      if (onSuccess) {
        onSuccess(document.$id);
      }

    } catch (error) {
      console.error('Error creating document:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create document';

      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Document</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* URL Input */}
        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
            Document URL
          </label>
          <input
            type="url"
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/documentation"
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.url ? 'border-red-300' : 'border-gray-300'
            }`}
            disabled={isSubmitting}
          />
          {errors.url && (
            <p className="mt-1 text-sm text-red-600">{errors.url}</p>
          )}
        </div>

        {/* Instructions Textarea */}
        <div>
          <label htmlFor="instructions" className="block text-sm font-medium text-gray-700 mb-2">
            Analysis Instructions
          </label>
          <textarea
            id="instructions"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Describe how you want this document to be analyzed. For example: 'Create a visual overview of the API endpoints and their relationships'"
            rows={6}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.instructions ? 'border-red-300' : 'border-gray-300'
            }`}
            disabled={isSubmitting}
          />
          {errors.instructions && (
            <p className="mt-1 text-sm text-red-600">{errors.instructions}</p>
          )}
          <p className="mt-2 text-sm text-gray-500">
            Provide clear instructions for how the AI should analyze and present this document.
          </p>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-6 py-2 rounded-md text-white font-medium ${
              isSubmitting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            }`}
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating Document...
              </div>
            ) : (
              'Create Document'
            )}
          </button>
        </div>
      </form>

      {/* Help Text */}
      <div className="mt-6 p-4 bg-blue-50 rounded-md">
        <h3 className="text-sm font-medium text-blue-800 mb-2">What happens next?</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• The document will be scraped from the provided URL</li>
          <li>• AI will analyze the content based on your instructions</li>
          <li>• Interactive charts and summaries will be generated</li>
          <li>• You'll receive a notification when analysis is complete</li>
        </ul>
      </div>
    </div>
  );
}
