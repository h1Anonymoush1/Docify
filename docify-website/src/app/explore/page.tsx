"use client";

import React, { useState, useEffect } from "react";

import { Heading, Flex, Text, RevealFx, Column, Card, Grid, SmartImage, Button } from "@/once-ui/components";
import { baseURL } from "@/app/resources";
import { databases, APPWRITE_CONFIG } from "@/lib/appwrite";
import { Query } from "appwrite";
import { useRouter } from "next/navigation";

function ExploreContent() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchExploreDocuments();
  }, []);

  const fetchExploreDocuments = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Fetching explore documents...');

      // Query for documents that are public and completed
      const publicDocuments = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.documentsCollectionId,
        [
          Query.equal('public', true),
          Query.equal('status', 'completed'),
          Query.orderDesc('$createdAt'),
          Query.limit(20) // Limit to 20 most recent public documents
        ]
      );

      console.log('✅ Found', publicDocuments.documents.length, 'public documents');
      setDocuments(publicDocuments.documents);
    } catch (error: any) {
      console.error('❌ Error fetching explore documents:', error);

      // Provide more specific error messages
      let errorMessage = 'Failed to load documents. Please try again later.';

      if (error.message?.includes('permission')) {
        errorMessage = 'Database permissions issue. Please ensure read permissions are set to "users" and "any".';
      } else if (error.message?.includes('not found')) {
        errorMessage = 'Database or collection not found. Please check your Appwrite configuration.';
      } else if (error.message?.includes('Unauthorized') || error.message?.includes('401')) {
        errorMessage = 'Authentication issue. Please check your Appwrite API keys and environment variables.';
      } else if (error.message?.includes('Invalid query')) {
        errorMessage = 'Database query error. Please check your collection schema and indexes.';
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentClick = (document: any) => {
    // For now, we'll use the public view or redirect to a public document viewer
    // Since we don't have a public document viewer yet, we'll show an alert
    alert(`Document: ${document.title || document.url}\n\nPublic document viewing will be available soon!`);
  };

  return (
    <Column fillWidth fillHeight horizontal="center" gap="xl" padding="l">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Explore - Docify",
            description: "Explore and discover amazing content with Docify",
            url: `${baseURL}/explore`,
          }),
        }}
      />

      <RevealFx translateY="4" fillWidth horizontal="center" paddingBottom="m">
        <Column maxWidth="s" horizontal="center">
          <Heading wrap="balance" variant="display-strong-l" style={{ textAlign: 'center' }}>
            Explore <span className="text-teal">Docify</span>
          </Heading>
          <Text variant="body-default-l" onBackground="neutral-weak" style={{ textAlign: 'center', marginTop: '16px' }}>
            Discover amazing content and features shared by our community
          </Text>
        </Column>
      </RevealFx>

      {/* Loading State */}
      {loading && (
        <RevealFx translateY="8" delay={0.2}>
          <Flex fillWidth fillHeight horizontal="center" vertical="center" gap="m">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <Text variant="body-default-m">Loading public documents...</Text>
          </Flex>
        </RevealFx>
      )}

      {/* Error State */}
      {error && (
        <RevealFx translateY="8" delay={0.2}>
          <Card
            background="surface"
            border="neutral-medium"
            radius="l"
            padding="32"
            maxWidth="m"
          >
            <Flex vertical="center" horizontal="center" gap="m">
              <div style={{
                width: "60px",
                height: "60px",
                backgroundColor: "var(--error-background-weak)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "30px"
              }}>
                ⚠️
              </div>
              <Heading as="h3" variant="heading-strong-m">
                Something went wrong
              </Heading>
              <Text variant="body-default-m" onBackground="neutral-weak" style={{ textAlign: 'center' }}>
                {error}
              </Text>
              {(error.includes('Permission denied') || error.includes('Database permissions')) && (
                <Flex direction="column" gap="s" style={{ marginTop: '16px' }}>
                  <Text variant="body-default-s" onBackground="neutral-weak" style={{ textAlign: 'center' }}>
                    <strong>To fix permissions:</strong>
                  </Text>
                  <Text variant="body-default-xs" onBackground="neutral-weak" style={{ textAlign: 'center' }}>
                    Go to Appwrite Console → Database → documents_table → Permissions
                  </Text>
                  <Text variant="body-default-xs" onBackground="neutral-weak" style={{ textAlign: 'center' }}>
                    Set Read permissions to: ["users", "any"]
                  </Text>
                </Flex>
              )}

              {(error.includes('Authentication issue') || error.includes('Unauthorized')) && (
                <Flex direction="column" gap="s" style={{ marginTop: '16px' }}>
                  <Text variant="body-default-s" onBackground="neutral-weak" style={{ textAlign: 'center' }}>
                    <strong>To fix authentication:</strong>
                  </Text>
                  <Text variant="body-default-xs" onBackground="neutral-weak" style={{ textAlign: 'center' }}>
                    Create .env.local file with your Appwrite configuration
                  </Text>
                  <Text variant="body-default-xs" onBackground="neutral-weak" style={{ textAlign: 'center' }}>
                    Check your API keys in Appwrite Console → Project Settings
                  </Text>
                </Flex>
              )}

              {(error.includes('Database query error') || error.includes('Invalid query')) && (
                <Flex direction="column" gap="s" style={{ marginTop: '16px' }}>
                  <Text variant="body-default-s" onBackground="neutral-weak" style={{ textAlign: 'center' }}>
                    <strong>To fix query issues:</strong>
                  </Text>
                  <Text variant="body-default-xs" onBackground="neutral-weak" style={{ textAlign: 'center' }}>
                    Ensure the 'public' boolean field exists in your collection
                  </Text>
                  <Text variant="body-default-xs" onBackground="neutral-weak" style={{ textAlign: 'center' }}>
                    Check indexes on 'public' and 'status' fields
                  </Text>
                </Flex>
              )}
              <Button
                variant="primary"
                onClick={fetchExploreDocuments}
                size="m"
              >
                Try Again
              </Button>
            </Flex>
          </Card>
        </RevealFx>
      )}

      {/* No Documents State */}
      {!loading && !error && documents.length === 0 && (
        <RevealFx translateY="8" delay={0.2}>
          <Card
            background="surface"
            border="neutral-medium"
            radius="l"
            padding="32"
            maxWidth="m"
          >
            <Flex vertical="center" horizontal="center" gap="m">
              <div style={{
                width: "60px",
                height: "60px",
                backgroundColor: "var(--neutral-background-weak)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "30px"
              }}>
                📄
              </div>
              <Heading as="h3" variant="heading-strong-m">
                No Public Documents Yet
              </Heading>
              <Text variant="body-default-m" onBackground="neutral-weak" style={{ textAlign: 'center' }}>
                No public documents found. Be the first to share content by creating documents and marking them as public in your dashboard.
              </Text>
              <Button
                variant="primary"
                onClick={() => router.push('/get-started')}
                size="m"
              >
                Get Started
              </Button>
            </Flex>
          </Card>
        </RevealFx>
      )}

      {/* Documents Grid */}
      {!loading && !error && documents.length > 0 && (
        <RevealFx translateY="8" delay={0.2}>
          <Column gap="l" fillWidth>
            <Flex horizontal="center" paddingBottom="m">
              <Text variant="body-default-s" onBackground="neutral-weak">
                {documents.length} public document{documents.length !== 1 ? 's' : ''} available
              </Text>
            </Flex>

            <Grid columns="1" tabletcolumns="2" desktopcolumns="3" gap="l" fillWidth>
              {documents.map((document) => (
                <Card
                  key={document.$id}
                  background="surface"
                  border="neutral-medium"
                  radius="l"
                  padding="24"
                  gap="m"
                  style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                  onClick={() => handleDocumentClick(document)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-l)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <Flex direction="column" gap="s" fillWidth>
                    <Flex horizontal="space-between" vertical="center" gap="s">
                      <Text variant="body-strong-m" onBackground="neutral-strong" style={{ flex: 1 }}>
                        {document.title || document.url?.substring(0, 40) + '...' || 'Untitled Document'}
                      </Text>
                      <div style={{
                        width: "8px",
                        height: "8px",
                        backgroundColor: "var(--success-strong)",
                        borderRadius: "50%"
                      }} />
                    </Flex>

                    <Text variant="body-default-xs" onBackground="neutral-weak" style={{ wordBreak: 'break-all' }}>
                      {document.url}
                    </Text>

                    <Flex horizontal="space-between" vertical="center" gap="s" paddingTop="s">
                      <Text variant="body-default-xs" onBackground="neutral-weak">
                        {document.word_count ? `${document.word_count.toLocaleString()} words` : 'Content scraped'}
                      </Text>
                      <Text variant="body-default-xs" onBackground="neutral-weak">
                        {new Date(document.$createdAt).toLocaleDateString()}
                      </Text>
                    </Flex>

                    {document.analysis_summary && (
                      <Text
                        variant="body-default-s"
                        onBackground="neutral-weak"
                        style={{
                          lineHeight: '1.4',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {document.analysis_summary}
                      </Text>
                    )}
                  </Flex>
                </Card>
              ))}
            </Grid>
          </Column>
        </RevealFx>
      )}
    </Column>
  );
}

export default function Explore() {
  return <ExploreContent />;
}
