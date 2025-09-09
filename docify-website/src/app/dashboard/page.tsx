"use client";

import { useEffect, useState } from 'react';
import { Flex, Button, Text, Heading, Switch } from '@/once-ui/components';
import { AuthGuard } from '@/components/AuthGuard';
import { databases, account, APPWRITE_CONFIG } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { SmallDashboardCard, MediumDashboardCard, LargeDashboardCard, ContentBlockCard } from '@/components/dashboard';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Dynamically import chart components
const MermaidChart = dynamic(() => import('@/components/MermaidChart'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[200px] space-y-2">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      <div className="text-gray-500 text-sm">Loading chart...</div>
    </div>
  )
});

export default function Dashboard() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [documentAnalysis, setDocumentAnalysis] = useState<any>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [zoomedBlocks, setZoomedBlocks] = useState<Set<string>>(new Set());
  const [isPublic, setIsPublic] = useState(false);
  const [updatingPublic, setUpdatingPublic] = useState(false);
  const [wordCount, setWordCount] = useState<number>(0);
  const [documentStatus, setDocumentStatus] = useState<string>('unknown');

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        console.log('🔍 Fetching current user...');
        const currentUser = await account.get();
        console.log('✅ User authenticated:', currentUser.$id);
        setUser(currentUser);

        console.log('📄 Fetching user documents...');
        console.log('Database ID:', APPWRITE_CONFIG.databaseId);
        console.log('Collection ID:', APPWRITE_CONFIG.documentsCollectionId);

        const userDocuments = await databases.listDocuments(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.documentsCollectionId,
          [
            Query.equal('user_id', currentUser.$id),
            Query.orderDesc('$createdAt')
          ]
        );

        console.log('✅ Documents fetched:', userDocuments.documents.length);
        setDocuments(userDocuments.documents);
      } catch (error: any) {
        console.error('❌ Error fetching documents:', error);
        console.error('Error details:', {
          message: error?.message,
          code: error?.code,
          type: error?.type,
          response: error?.response
        });

        // If it's an authentication error, show a more specific message
        if (error?.message?.includes('unauthorized') || error?.code === 401) {
          console.error('🔐 Authentication issue detected');
        }

        // If it's a permission error, show a more specific message
        if (error?.message?.includes('permission') || error?.code === 403) {
          console.error('🚫 Permission issue detected');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  const handleDocumentSelect = async (document: any) => {
    console.log('📄 Selecting document:', document.$id);
    setSelectedDocument(document);
    setAnalysisLoading(true);
    setAnalysisError(null);
    setDocumentAnalysis(null);

    try {
      // First, validate that we have an authenticated user and valid session
      console.log('🔍 Validating authentication...');
      const currentUser = await account.get();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
      console.log('✅ User authenticated for document access');

      // Fetch the complete document data including analysis
      console.log('📥 Fetching document data...');
      const docData = await databases.getDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.documentsCollectionId,
        document.$id
      );

      console.log('📄 Document data received:', {
        id: docData.$id,
        user_id: docData.user_id,
        hasAnalysisBlocks: !!docData.analysis_blocks,
        hasAnalysisSummary: !!docData.analysis_summary
      });

      // Validate that the document belongs to the current user
      if (docData.user_id !== currentUser.$id) {
        console.error('🚫 Permission denied - document belongs to different user');
        throw new Error('You do not have permission to access this document');
      }

      // Extract analysis data
      if (docData.analysis_blocks) {
        try {
          console.log('🔄 Parsing analysis blocks...');
          const analysisBlocks = JSON.parse(docData.analysis_blocks);
          console.log('✅ Analysis blocks parsed:', analysisBlocks.length, 'blocks');

          setDocumentAnalysis({
            summary: docData.analysis_summary || '',
            blocks: analysisBlocks || []
          });
          console.log('✅ Document analysis set successfully');
        } catch (parseError) {
          console.error('❌ Error parsing analysis blocks:', parseError);
          setAnalysisError('Failed to parse document analysis data');
          setDocumentAnalysis({
            summary: docData.analysis_summary || '',
            blocks: []
          });
        }
      } else {
        console.log('ℹ️  No analysis blocks found, setting empty analysis');
        setDocumentAnalysis({
          summary: docData.analysis_summary || '',
          blocks: []
        });
      }

      // Set the public status, word count, and status from the document
      setIsPublic(docData.public || false);
      setWordCount(docData.word_count || 0);
      setDocumentStatus(docData.status || 'unknown');

      console.log('📊 Document word count:', docData.word_count, 'Full doc data:', {
        id: docData.$id,
        title: docData.title,
        url: docData.url,
        word_count: docData.word_count,
        public: docData.public
      });
    } catch (error: any) {
      console.error('❌ Error fetching document analysis:', error);
      console.error('Error details:', {
        message: error?.message,
        code: error?.code,
        type: error?.type,
        response: error?.response
      });

      let errorMessage = 'Failed to load document analysis';

      if (error?.message?.includes('permission') || error?.message?.includes('access') || error?.code === 403) {
        errorMessage = 'You do not have permission to access this document';
      } else if (error?.message?.includes('not authenticated') || error?.code === 401) {
        errorMessage = 'Please log in to access documents';
      } else if (error?.message?.includes('not found') || error?.code === 404) {
        errorMessage = 'Document not found';
      } else if (error?.message) {
        errorMessage = error.message;
      }

      setAnalysisError(errorMessage);
      setDocumentAnalysis(null);
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleBackToGrid = () => {
    setSelectedDocument(null);
    setDocumentAnalysis(null);
    setAnalysisError(null);
    setAnalysisLoading(false);
    setZoomedBlocks(new Set()); // Reset zoom state
    setIsPublic(false); // Reset public state
    setWordCount(0); // Reset word count
    setDocumentStatus('unknown'); // Reset document status
  };

  // Action handlers for content blocks
  const handleCopyContent = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      // You could add a toast notification here
      console.log('Content copied to clipboard');
    } catch (error) {
      console.error('Failed to copy content:', error);
    }
  };

  const handleZoomBlock = (blockId: string) => {
    setZoomedBlocks(prev => new Set([...prev, blockId]));
  };

  const handleUnzoomBlock = (blockId: string) => {
    setZoomedBlocks(prev => {
      const newSet = new Set(prev);
      newSet.delete(blockId);
      return newSet;
    });
  };

  const handlePublicToggle = async (isPublicValue: boolean) => {
    if (!selectedDocument) return;

    try {
      setUpdatingPublic(true);

      // Update the document's public status in the database
      await databases.updateDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.documentsCollectionId,
        selectedDocument.$id,
        {
          public: isPublicValue
        }
      );

      // Update local state
      setIsPublic(isPublicValue);

      console.log(`✅ Document ${isPublicValue ? 'made public' : 'made private'}`);
    } catch (error: any) {
      console.error('❌ Error updating document public status:', error);
      // Revert the toggle on error
      setIsPublic(!isPublicValue);
    } finally {
      setUpdatingPublic(false);
    }
  };

  return (
    <AuthGuard requireAuth={true}>
      <Flex
        fillWidth
        fillHeight
        padding="l"
        direction="row"
      >
        <Flex
          fillHeight
          background="neutral-weak"
          border="neutral-medium"
          leftRadius="l"
          direction="column"
          padding="l"
          gap="s"
          style={{
            width: '320px',
            minWidth: '280px',
            maxWidth: '400px',
          }}
        >
            {/* Sidebar content */}
            <Flex
              fillHeight
              direction="column"
              style={{ position: 'relative' }}
            >
              {/* Analysis Results List - Scrollable Container */}
              <Flex
                direction="column"
                gap="s"
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  maxHeight: '630px', // Fixed smaller height for more square/compact appearance
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'var(--neutral-weak) transparent'
                }}
              >

                {loading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <Text variant="body-default-s" onBackground="neutral-weak">
                    Loading documents...
                  </Text>
                  </div>
                ) : !user ? (
                  <div className="text-center py-8">
                    <Text variant="body-default-s" onBackground="neutral-weak" className="mb-2">
                      Authentication Required
                    </Text>
                    <Text variant="body-default-xs" onBackground="neutral-weak">
                      Please log in to view documents
                    </Text>
                  </div>
                ) : documents.length === 0 ? (
                  <div className="text-center py-8">
                    <Text variant="body-default-s" onBackground="neutral-weak" className="mb-2">
                    No documents found
                  </Text>
                    <Text variant="body-default-xs" onBackground="neutral-weak">
                      Create a new document to get started
                    </Text>
                  </div>
                ) : (
                  <Flex direction="column" gap="s">
                    {documents.map((document, index) => (
                      <Flex
                        key={document.$id}
                        background="surface"
                        border="neutral-weak"
                        radius="m"
                        padding="s"
                        onClick={() => handleDocumentSelect(document)}
                        style={{
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          border: selectedDocument?.$id === document.$id ? '2px solid var(--brand-medium)' : '1px solid var(--neutral-weak)',
                          backgroundColor: selectedDocument?.$id === document.$id ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255, 255, 255, 0.1)',
                          backdropFilter: 'blur(4px)'
                        }}
                      >
                        <Text
                          variant="body-default-s"
                          onBackground="neutral-strong"
                          style={{
                            flex: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {document.title || document.url?.substring(0, 35) || 'Untitled Document'}
                        </Text>
                      </Flex>
                    ))}
                  </Flex>
                )}
              </Flex>

              {/* Create button - at bottom */}
              <Flex
                paddingTop="m"
                style={{ marginTop: 'auto' }}
              >
                <Button
                  fillWidth
                  variant="primary"
                  size="m"
                  style={{
                    borderRadius: 'var(--radius-m)',
                    boxShadow: 'var(--shadow-l), 0 0 20px var(--brand-alpha-medium)',
                    backgroundColor: 'var(--brand-medium)',
                    color: 'var(--neutral-strong)',
                    border: '1px solid var(--brand-medium)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  Create
                </Button>
              </Flex>
            </Flex>
          </Flex>

          {/* Main Content */}
          <Flex
            fillWidth
            fillHeight
            direction="column"
            padding="l"
            background="surface"
            border="neutral-medium"
            rightRadius="l"
            style={{ flex: 1, minHeight: 0 }}
          >
            {selectedDocument ? (
              /* Document Chart View */
              <Flex
                fillWidth
                direction="column"
                gap="s"
                style={{ flex: 1, minHeight: 0 }}
              >
                {/* Chart Content */}
                <Flex
                  fillWidth
                  style={{
                    flex: 1,
                    minHeight: 0,
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--neutral-weak)',
                    borderRadius: 'var(--radius-l)',
                    padding: 'var(--space-xl)',
                    overflow: 'hidden'
                  }}
                >
                  {analysisLoading ? (
                    <Flex
                      fillWidth
                      fillHeight
                      horizontal="center"
                      vertical="center"
                    >
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                      <Text variant="body-default-m" onBackground="neutral-weak" style={{ marginLeft: '1rem' }}>
                        Loading analysis...
                      </Text>
                    </Flex>
                  ) : analysisError ? (
                    <Flex
                      fillWidth
                      fillHeight
                      horizontal="center"
                      vertical="center"
                      direction="column"
                      gap="s"
                    >
                      <Flex
                        background="danger-weak"
                        radius="m"
                        padding="l"
                        direction="column"
                        gap="s"
                        fillWidth
                        style={{ maxWidth: '400px' }}
                      >
                        <Heading variant="heading-strong-m" onBackground="danger-strong">
                          Analysis Error
                        </Heading>
                        <Text variant="body-default-m" onBackground="danger-strong">
                          {analysisError}
                        </Text>
                        <Button
                          variant="secondary"
                          size="s"
                          onClick={() => handleDocumentSelect(selectedDocument)}
                          style={{ alignSelf: 'flex-start' }}
                        >
                          Try Again
                        </Button>
                      </Flex>
                    </Flex>
                  ) : documentAnalysis ? (
                    <Flex
                      fillWidth
                      direction="column"
                      gap="s"
                      style={{ overflowY: 'auto' }}
                    >
                      {/* Summary */}
                      {documentAnalysis.summary && (
                        <Flex fillWidth gap="s" style={{ flexWrap: 'wrap' }}>
                          {/* Small Title/URL Card */}
                          <div style={{ flex: '0 0 300px' }}>
                            <SmallDashboardCard type="content" title="Document Info">
                              <Flex direction="column" gap="s" style={{ flex: 1, justifyContent: 'flex-start', alignItems: 'flex-start' }}>
                                <Text variant="body-strong-s" onBackground="neutral-strong">
                                  {selectedDocument.title || 'Untitled Document'}
                                </Text>
                                <Text variant="body-default-xs" onBackground="neutral-weak" style={{ wordBreak: 'break-all' }}>
                                  {selectedDocument.url}
                                </Text>

                                {/* Status */}
                                <Flex horizontal="space-between" vertical="center" gap="s" style={{ paddingTop: 'var(--space-s)' }}>
                                  <Text variant="body-default-xs" onBackground="neutral-weak">
                                    Status
                                  </Text>
                                  <Text variant="body-default-s" onBackground={
                                    documentStatus === 'completed' ? 'success-strong' :
                                    documentStatus === 'failed' ? 'danger-strong' :
                                    documentStatus === 'analyzing' || documentStatus === 'scraping' ? 'warning-strong' :
                                    'neutral-strong'
                                  }>
                                    {documentStatus.charAt(0).toUpperCase() + documentStatus.slice(1)}
                                  </Text>
                                </Flex>

                                {/* Word Count */}
                                <Flex horizontal="space-between" vertical="center" gap="s" style={{ paddingTop: 'var(--space-s)' }}>
                                  <Text variant="body-default-xs" onBackground="neutral-weak">
                                    Scraped Content
                                  </Text>
                                  <Text variant="body-default-s" onBackground="brand-strong">
                                    {wordCount > 0 ? wordCount.toLocaleString() + ' words' : 'Not available'}
                                  </Text>
                                </Flex>

                                {/* Public Toggle */}
                                <Flex horizontal="space-between" vertical="center" gap="s" style={{ marginTop: 'auto', paddingTop: 'var(--space-s)' }}>
                                  <Text variant="body-default-xs" onBackground="neutral-weak">
                                    Make Public
                                  </Text>
                                  <Flex vertical="center" gap="s">
                                    <Switch
                                      isChecked={isPublic}
                                      onToggle={() => handlePublicToggle(!isPublic)}
                                      disabled={updatingPublic}
                                      ariaLabel="Toggle document public visibility"
                                    />
                                    <Text variant="body-default-xs" onBackground="neutral-weak">
                                      {updatingPublic ? 'Updating...' : (isPublic ? 'Public' : 'Private')}
                                    </Text>
                                  </Flex>
                                </Flex>
                              </Flex>
                            </SmallDashboardCard>
                          </div>

                          {/* Medium Summary Card */}
                          <div style={{ flex: '1 1 400px', minWidth: '300px' }}>
                            <MediumDashboardCard type="content" title="Summary">
                              <Flex direction="column" gap="s" style={{ flex: 1, justifyContent: 'flex-start', alignItems: 'flex-start' }}>
                                <Text variant="body-default-m" onBackground="neutral-strong" style={{ lineHeight: '1.6' }}>
                                  {documentAnalysis.summary}
                                </Text>
                              </Flex>
                            </MediumDashboardCard>
                          </div>
                        </Flex>
                      )}

                      {/* Analysis Blocks - JSON-like Structure */}
                        {documentAnalysis.blocks && documentAnalysis.blocks.length > 0 && (
                          <Flex fillWidth direction="column" gap="s">
                            {/* Smart grid layout that fills rows efficiently */}
                            {(() => {
                              // Helper function to get column span for each block size
                              const getColumnSpan = (size: string) => {
                                switch (size) {
                                  case 'large': return 3;
                                  case 'medium': return 2;
                                  case 'small': return 1;
                                  default: return 2; // medium default
                                }
                              };

                              // Smart packing algorithm to maximize space utilization
                              const rows: any[][] = [];
                              const remainingBlocks = [...documentAnalysis.blocks];

                              while (remainingBlocks.length > 0) {
                                let currentRow: any[] = [];
                                let currentRowColumns = 0;
                                let bestFitIndex = -1;
                                let bestFitSize = 0;

                                // First, try to find a perfect fit (exactly fills remaining space)
                                for (let i = 0; i < remainingBlocks.length; i++) {
                                  const span = getColumnSpan(remainingBlocks[i].size);
                                  const remainingSpace = 3 - currentRowColumns;

                                  if (span === remainingSpace) {
                                    bestFitIndex = i;
                                    bestFitSize = span;
                                    break;
                                  }
                                }

                                // If no perfect fit, find the largest item that fits
                                if (bestFitIndex === -1) {
                                  for (let i = 0; i < remainingBlocks.length; i++) {
                                    const span = getColumnSpan(remainingBlocks[i].size);
                                    if (currentRowColumns + span <= 3 && span > bestFitSize) {
                                      bestFitIndex = i;
                                      bestFitSize = span;
                                    }
                                  }
                                }

                                // If still no fit, take the first item (will start new row)
                                if (bestFitIndex === -1) {
                                  bestFitIndex = 0;
                                  bestFitSize = getColumnSpan(remainingBlocks[0].size);
                                }

                                // Add the best fit to current row
                                const bestBlock = remainingBlocks.splice(bestFitIndex, 1)[0];
                                currentRow.push(bestBlock);
                                currentRowColumns += bestFitSize;

                                // Try to fill remaining space in this row
                                let spaceLeft = 3 - currentRowColumns;
                                while (spaceLeft > 0 && remainingBlocks.length > 0) {
                                  let foundFit = false;

                                  // Look for items that exactly fit the remaining space
                                  for (let i = 0; i < remainingBlocks.length; i++) {
                                    const span = getColumnSpan(remainingBlocks[i].size);
                                    if (span === spaceLeft) {
                                      currentRow.push(remainingBlocks.splice(i, 1)[0]);
                                      currentRowColumns += span;
                                      spaceLeft = 0;
                                      foundFit = true;
                                      break;
                                    }
                                  }

                                  // If no exact fit, look for the largest item that fits
                                  if (!foundFit) {
                                    let largestFitIndex = -1;
                                    let largestFitSize = 0;

                                    for (let i = 0; i < remainingBlocks.length; i++) {
                                      const span = getColumnSpan(remainingBlocks[i].size);
                                      if (span <= spaceLeft && span > largestFitSize) {
                                        largestFitIndex = i;
                                        largestFitSize = span;
                                      }
                                    }

                                    if (largestFitIndex !== -1) {
                                      currentRow.push(remainingBlocks.splice(largestFitIndex, 1)[0]);
                                      currentRowColumns += largestFitSize;
                                      spaceLeft -= largestFitSize;
                                    } else {
                                      // No more items fit in this row
                                      break;
                                    }
                                  }
                                }

                                // Add this row to our rows collection
                                rows.push(currentRow);
                              }

                              // Render each row as a grid
                              return rows.map((row: any[], rowIndex: number) => (
                                <Flex
                                  key={rowIndex}
                                  fillWidth
                                  style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(3, 1fr)',
                                    gap: 'var(--space-s)',
                                    alignItems: 'start'
                                  }}
                                >
                                    {row.map((block: any) => (
                                      <ContentBlockCard
                                        key={block.id}
                                        block={block}
                                        onCopy={handleCopyContent}
                                        onZoom={handleZoomBlock}
                                        onUnzoom={handleUnzoomBlock}
                                        isZoomed={zoomedBlocks.has(block.id)}
                                      />
                                    ))}
                                </Flex>
                              ));
                            })()}
                          </Flex>
                        )}
                    </Flex>
                  ) : (
                    <Flex
                      fillWidth
                      fillHeight
                      horizontal="center"
                      vertical="center"
                      direction="column"
                      gap="m"
                    >
                      <Text variant="heading-strong-m" onBackground="neutral-weak">
                        No Analysis Available
                      </Text>
                      <Text variant="body-default-m" onBackground="neutral-weak">
                        This document hasn't been analyzed yet or analysis failed.
                      </Text>
                    </Flex>
                  )}
                </Flex>
              </Flex>
            ) : (
              /* Dashboard Grid - 9 Squares */
            <Flex
              fillWidth
              direction="column"
              gap="s"
              style={{ flex: 1, minHeight: 0 }}
            >
              {/* 3x3 Grid with Spanning Components */}
              <Flex
                fillWidth
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gridTemplateRows: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: 'var(--space-s)',
                  alignItems: 'start'
                }}
              >
                {/* Large Component: Top Row (spans 3 columns) */}
                <LargeDashboardCard type="content" title="Welcome to Docify" content="Your AI-powered document analysis platform. Upload documents to get instant insights, charts, and summaries." />

                {/* Medium Component: Analytics */}
                <MediumDashboardCard type="content" title="Analytics" content="Track your document processing metrics and usage patterns." />

                {/* Small Component: Recent Activity */}
                <SmallDashboardCard type="content" title="Recent Activity" content="View your latest document uploads and analyses." />

                {/* Small Component: Templates */}
                <SmallDashboardCard type="content" title="Templates" content="Browse available analysis templates for different document types." />

                {/* Small Component: Credit Balance */}
                <MediumDashboardCard type="content" title="Credits" content="Manage your analysis credits and subscription plans." />

              </Flex>
            </Flex>
            )}
          </Flex>
        </Flex>
    </AuthGuard>
  );
}
