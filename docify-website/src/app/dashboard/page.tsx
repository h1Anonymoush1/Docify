"use client";

import { useEffect, useState } from 'react';
import { Flex, Button, Text } from '@/once-ui/components';
import { AuthGuard } from '@/components/AuthGuard';
import { databases, account, APPWRITE_CONFIG } from '@/lib/appwrite';
import { Query } from 'appwrite';

export default function Dashboard() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const currentUser = await account.get();
        setUser(currentUser);

        const userDocuments = await databases.listDocuments(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.documentsCollectionId,
          [
            Query.equal('user_id', currentUser.$id),
            Query.orderDesc('$createdAt')
          ]
        );

        setDocuments(userDocuments.documents);
      } catch (error) {
        console.error('Error fetching documents:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

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
                  <Text variant="body-default-s" onBackground="neutral-weak">
                    Loading documents...
                  </Text>
                ) : documents.length === 0 ? (
                  <Text variant="body-default-s" onBackground="neutral-weak">
                    No documents found
                  </Text>
                ) : (
                  <Flex direction="column" gap="s">
                    {documents.map((document, index) => (
                      <Flex
                        key={document.$id}
                        background="surface"
                        border="neutral-weak"
                        radius="m"
                        padding="s"
                        style={{
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          border: '1px solid var(--neutral-weak)',
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
            {/* Dashboard Grid - 9 Squares */}
            <Flex
              fillWidth
              direction="column"
              gap="m"
              style={{ flex: 1, minHeight: 0 }}
            >
              {/* 9-Square Grid */}
              <Flex
                fillWidth
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gridTemplateRows: 'repeat(3, 1fr)',
                  gap: 'var(--space-l)',
                  minHeight: '300px',
                  overflowY: 'auto',
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'var(--neutral-weak) transparent',
                  flex: 1
                }}
              >
                {/* Square 1: Recent Documents */}
                <Flex
                  background="surface"
                  border="neutral-weak"
                  radius="m"
                  padding="s"
                  direction="column"
                  gap="m"
                  style={{
                    boxShadow: 'var(--shadow-s)',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-m)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-s)';
                  }}
                >
                  <Flex direction="column" gap="s" style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                  </Flex>
                </Flex>

                {/* Square 2: Processing Status */}
                <Flex
                  background="surface"
                  border="neutral-weak"
                  radius="m"
                  padding="s"
                  direction="column"
                  gap="m"
                  style={{
                    boxShadow: 'var(--shadow-s)',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-m)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-s)';
                  }}
                >
                  <Flex direction="column" gap="s" style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                  </Flex>
                </Flex>

                {/* Square 3: Credit Balance */}
                <Flex
                  background="surface"
                  border="neutral-weak"
                  radius="m"
                  padding="s"
                  direction="column"
                  gap="m"
                  style={{
                    boxShadow: 'var(--shadow-s)',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-m)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-s)';
                  }}
                >
                  <Flex direction="column" gap="s" style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                  </Flex>
                </Flex>

                {/* Square 4: Quick Actions */}
                <Flex
                  background="surface"
                  border="neutral-weak"
                  radius="m"
                  padding="s"
                  direction="column"
                  gap="m"
                  style={{
                    boxShadow: 'var(--shadow-s)',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-m)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-s)';
                  }}
                >
                  <Flex direction="column" gap="s" style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                  </Flex>
                </Flex>

                {/* Square 5: Analytics */}
                <Flex
                  background="surface"
                  border="neutral-weak"
                  radius="m"
                  padding="s"
                  direction="column"
                  gap="m"
                  style={{
                    boxShadow: 'var(--shadow-s)',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-m)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-s)';
                  }}
                >
                  <Flex direction="column" gap="s" style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                  </Flex>
                </Flex>

                {/* Square 6: Recent Activity */}
                <Flex
                  background="surface"
                  border="neutral-weak"
                  radius="m"
                  padding="s"
                  direction="column"
                  gap="m"
                  style={{
                    boxShadow: 'var(--shadow-s)',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-m)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-s)';
                  }}
                >
                  <Flex direction="column" gap="s" style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                  </Flex>
                </Flex>

                {/* Square 7: Public Gallery */}
                <Flex
                  background="surface"
                  border="neutral-weak"
                  radius="m"
                  padding="s"
                  direction="column"
                  gap="m"
                  style={{
                    boxShadow: 'var(--shadow-s)',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-m)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-s)';
                  }}
                >
                  <Flex direction="column" gap="s" style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                  </Flex>
                </Flex>

                {/* Square 8: Templates */}
                <Flex
                  background="surface"
                  border="neutral-weak"
                  radius="m"
                  padding="s"
                  direction="column"
                  gap="m"
                  style={{
                    boxShadow: 'var(--shadow-s)',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-m)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-s)';
                  }}
                >
                  <Flex direction="column" gap="s" style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                  </Flex>
                </Flex>

                {/* Square 9: Settings */}
                <Flex
                  background="surface"
                  border="neutral-weak"
                  radius="m"
                  padding="s"
                  direction="column"
                  gap="m"
                  style={{
                    boxShadow: 'var(--shadow-s)',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-m)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-s)';
                  }}
                >
                  <Flex direction="column" gap="s" style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                  </Flex>
                </Flex>
              </Flex>
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </AuthGuard>
  );
}
