"use client";

import { useEffect, useState } from 'react';
import { Flex, Button, Text, Heading } from '@/once-ui/components';
import { AuthGuard } from '@/components/AuthGuard';
import { databases, account, APPWRITE_CONFIG } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { SmallDashboardCard, MediumDashboardCard, LargeDashboardCard } from '@/components/dashboard';
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
  };

  return (
    <AuthGuard requireAuth={true}>
      <Flex
        fillWidth
        fillHeight
        paddingLeft="l"
        paddingRight="l"
        paddingTop="s"
        paddingBottom="xs"
        horizontal="center"
        vertical="center"
      >
        <Flex
          fillWidth
          fillHeight
          background="surface"
          border="neutral-medium"
          radius="l"
          padding="xl"
          gap="l"
          horizontal="start"
        >
          {/* Sidebar */}
          <Flex
            background="neutral-weak"
            border="neutral-medium"
            radius="m"
            direction="column"
            padding="l"
            gap="m"
            position="relative"
            style={{
              marginLeft: '-100px',
              marginTop: '-10%',
              marginBottom: '-10%',
              width: '25%',
              maxWidth: '280px',
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
                gap="m"
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

              {/* Edit button - absolutely positioned at bottom */}
              <Flex
                style={{
                  position: 'absolute',
                  bottom: '0px',
                  left: '0px',
                  right: '0px'
                }}
              >
                <Button
                  fillWidth
                  variant="primary"
                  size="m"
                  style={{
                    marginBottom: '-18%',
                    marginLeft: '-18%',
                    marginRight: '-18%',
                    width: '150%',
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
            direction="column"
            paddingLeft="l"
            paddingRight="l"
            paddingTop="s"
            paddingBottom="xs"
            style={{ flex: 1, minHeight: 0 }}
          >
            {selectedDocument ? (
              /* Document Chart View */
              <Flex
                fillWidth
                direction="column"
                gap="m"
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
                      gap="m"
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
                      gap="xl"
                      style={{ overflowY: 'auto' }}
                    >
                      {/* Summary */}
                      {documentAnalysis.summary && (
                        <Flex
                          direction="row"
                          gap="l"
                          style={{ width: 'fit-content', maxWidth: '100%' }}
                        >
                          {/* Small Title/URL Card */}
                          <SmallDashboardCard>
                            <Flex direction="column" gap="s" style={{ flex: 1, justifyContent: 'flex-start', alignItems: 'flex-start', padding: 'var(--space-m)' }}>
                              <Text variant="body-strong-s" onBackground="neutral-strong">
                                {selectedDocument.title || 'Untitled Document'}
                              </Text>
                              <Text variant="body-default-xs" onBackground="neutral-weak" style={{ wordBreak: 'break-all' }}>
                                {selectedDocument.url}
                              </Text>
                            </Flex>
                          </SmallDashboardCard>

                          {/* Medium Summary Card */}
                          <MediumDashboardCard>
                            <Flex direction="column" gap="m" style={{ flex: 1, justifyContent: 'flex-start', alignItems: 'flex-start', padding: 'var(--space-m)' }}>
                              <Heading variant="heading-strong-m">Summary</Heading>
                              <Text variant="body-default-m" onBackground="neutral-strong" style={{ lineHeight: '1.6' }}>
                                {documentAnalysis.summary}
                              </Text>
                            </Flex>
                          </MediumDashboardCard>
                        </Flex>
                      )}

                      {/* Analysis Blocks - JSON-like Structure */}
                      {documentAnalysis.blocks && documentAnalysis.blocks.length > 0 && (
                        <Flex fillWidth direction="column" gap="l">
                          <Flex
                            fillWidth
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                              gap: 'var(--space-l)',
                              alignItems: 'start'
                            }}
                          >
                            {documentAnalysis.blocks.map((block: any) => {
                              // Create JSON-like structure for different block types
                              const renderBlockContent = () => {
                                switch (block.type) {
                                  case 'mermaid':
                                    return (
                                      <Flex fillWidth style={{ flex: 1, minHeight: '300px' }}>
                                        <Suspense fallback={
                                          <div className="flex flex-col items-center justify-center w-full h-full space-y-2">
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                            <div className="text-gray-500 text-sm">Loading chart...</div>
                                          </div>
                                        }>
                                          <MermaidChart
                                            chart={block.content}
                                            className="w-full h-full"
                                          />
                                        </Suspense>
                                      </Flex>
                                    );

                                  case 'key_points':
                                    const points = block.content.split('\n').filter((point: string) => point.trim());
                                    return (
                                      <Flex fillWidth direction="column" gap="s" style={{ flex: 1 }}>
                                        {points.map((point: string, index: number) => (
                                          <Flex key={index} fillWidth gap="s" vertical="start">
                                            <Text variant="body-default-s" onBackground="brand-strong" style={{ minWidth: '20px' }}>
                                              {index + 1}.
                                            </Text>
                                            <Text variant="body-default-s" onBackground="neutral-strong">
                                              {point.replace(/^[-•*]\s*/, '')}
                                            </Text>
                                          </Flex>
                                        ))}
                                      </Flex>
                                    );

                                  case 'code':
                                    return (
                                      <Flex fillWidth direction="column" gap="s" style={{ flex: 1 }}>
                                        <Flex fillWidth horizontal="space-between" vertical="center">
                                          <Text variant="body-default-s" onBackground="neutral-weak">
                                            Language:
                                          </Text>
                                          <Text variant="body-default-s" onBackground="brand-strong">
                                            {block.metadata?.language || 'text'}
                                          </Text>
                                        </Flex>
                                        <Flex
                                          fillWidth
                                          style={{
                                            backgroundColor: 'var(--neutral-weak)',
                                            borderRadius: 'var(--radius-s)',
                                            padding: 'var(--space-m)',
                                            fontFamily: 'monospace',
                                            fontSize: '14px',
                                            overflow: 'auto',
                                            whiteSpace: 'pre-wrap'
                                          }}
                                        >
                                          <Text variant="body-default-s" onBackground="neutral-strong">
                                            {block.content}
                                          </Text>
                                        </Flex>
                                      </Flex>
                                    );

                                  default:
                                    return (
                                      <Flex fillWidth style={{ flex: 1 }}>
                                        <Text
                                          variant="body-default-m"
                                          onBackground="neutral-strong"
                                          style={{
                                            lineHeight: '1.6',
                                            whiteSpace: 'pre-wrap'
                                          }}
                                        >
                                          {block.content}
                                        </Text>
                                      </Flex>
                                    );
                                }
                              };

                              // Dynamic card sizing based on JSON size field
                              const getCardComponent = () => {
                                switch (block.size) {
                                  case 'large':
                                    return LargeDashboardCard;
                                  case 'small':
                                    return SmallDashboardCard;
                                  case 'medium':
                                  default:
                                    return MediumDashboardCard;
                                }
                              };

                              const CardComponent = getCardComponent();

                              return (
                                <CardComponent key={block.id}>
                                  <Flex direction="column" gap="m" style={{ flex: 1, justifyContent: 'flex-start', alignItems: 'flex-start', padding: 'var(--space-m)' }}>
                                    {/* Block Type Indicator */}
                                    <Flex fillWidth horizontal="space-between" vertical="center" paddingBottom="s">
                                      <Heading variant="heading-strong-s">{block.title}</Heading>
                                      <Flex
                                        background="brand-weak"
                                        radius="s"
                                        paddingX="s"
                                        paddingY="xs"
                                      >
                                        <Text variant="body-default-xs" onBackground="brand-strong">
                                          {block.type.toUpperCase()}
                                        </Text>
                                      </Flex>
                                    </Flex>

                                    {/* Block Metadata */}
                                    <Flex fillWidth direction="column" gap="xs" paddingBottom="s">
                                      <Text variant="body-default-xs" onBackground="neutral-weak">
                                        Block ID: {block.id}
                                      </Text>
                                      <Text variant="body-default-xs" onBackground="neutral-weak">
                                        Size: {block.size}
                                      </Text>
                                      {block.metadata && Object.keys(block.metadata).length > 0 && (
                                        <Text variant="body-default-xs" onBackground="neutral-weak">
                                          Metadata: {JSON.stringify(block.metadata, null, 2)}
                                        </Text>
                                      )}
                                    </Flex>

                                    {/* Block Content */}
                                    <Flex fillWidth style={{ flex: 1, overflow: 'hidden' }}>
                                      {renderBlockContent()}
                                    </Flex>
                                  </Flex>
                                </CardComponent>
                              );
                            })}
                          </Flex>
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
              gap="m"
              style={{ flex: 1, minHeight: 0 }}
            >
              {/* 3x3 Grid with Spanning Components */}
              <Flex
                fillWidth
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gridTemplateRows: 'repeat(3, 1fr)',
                  gap: 'var(--space-l)',
                  maxHeight: '500px',
                  overflowY: 'auto',
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'var(--neutral-weak) transparent',
                  flex: 1
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
      </Flex>
    </AuthGuard>
  );
}
