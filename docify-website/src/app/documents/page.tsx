'use client';

import React, { useState } from 'react';
import DocumentForm from '../../components/DocumentForm';
import DocumentViewer from '../../components/DocumentViewer';

export default function DocumentsPage() {
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(true);

  const handleDocumentCreated = (documentId: string) => {
    setSelectedDocumentId(documentId);
    setShowForm(false);
  };

  const handleBackToForm = () => {
    setSelectedDocumentId(null);
    setShowForm(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Document Analysis</h1>
              <p className="mt-2 text-gray-600">
                Extract insights from any website using AI-powered analysis
              </p>
            </div>
            {selectedDocumentId && (
              <button
                onClick={handleBackToForm}
                className="bg-white border border-gray-300 rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Create New Document
              </button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {showForm && !selectedDocumentId && (
            <div>
              <DocumentForm
                onSuccess={handleDocumentCreated}
                onError={(error) => {
                  console.error('Document creation error:', error);
                  // You could show a toast notification here
                }}
              />
            </div>
          )}

          {selectedDocumentId && (
            <DocumentViewer documentId={selectedDocumentId} />
          )}
        </div>

        {/* Features Section */}
        {!selectedDocumentId && (
          <div className="mt-16 bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">What You Can Analyze</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-6 border border-gray-200 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">📚 Documentation</h3>
                <p className="text-gray-600">API docs, tutorials, guides, and technical documentation</p>
              </div>
              <div className="p-6 border border-gray-200 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">📰 Articles & Blogs</h3>
                <p className="text-gray-600">News articles, blog posts, and educational content</p>
              </div>
              <div className="p-6 border border-gray-200 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">📋 Web Pages</h3>
                <p className="text-gray-600">Any website with structured content and information</p>
              </div>
              <div className="p-6 border border-gray-200 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">🎯 Custom Analysis</h3>
                <p className="text-gray-600">Provide specific instructions for tailored analysis</p>
              </div>
              <div className="p-6 border border-gray-200 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">📊 Visual Diagrams</h3>
                <p className="text-gray-600">Automatic generation of charts and visual representations</p>
              </div>
              <div className="p-6 border border-gray-200 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">💡 AI Insights</h3>
                <p className="text-gray-600">Intelligent summarization and key point extraction</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
