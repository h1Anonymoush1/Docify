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
        padding="l"
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
                  Edit
                </Button>
              </Flex>
            </Flex>
          </Flex>

          {/* Main Content */}
          <Flex
            fillWidth
            fillHeight
            direction="column"
          >
            {/* Main content goes here */}
          </Flex>
        </Flex>
      </Flex>
    </AuthGuard>
  );
}
