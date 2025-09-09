"use client";

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Heading, Text, Column, Button, Flex, Input, SmartImage } from '@/once-ui/components';
import { AuthGuard } from '@/components/AuthGuard';
import { updateUserPrefs } from '@/lib/appwrite';

export default function Account() {
  const { user, logout, refreshAuthStatus } = useAuth();
  const router = useRouter();

  // Handle editing state
  const [isEditingHandle, setIsEditingHandle] = useState(false);
  const [handleValue, setHandleValue] = useState('');
  const [isSavingHandle, setIsSavingHandle] = useState(false);
  const [isHoveringHandle, setIsHoveringHandle] = useState(false);
  const [isHoveringEmail, setIsHoveringEmail] = useState(false);

  // Initialize handle value when user data is available
  useEffect(() => {
    if (user?.prefs?.handle) {
      setHandleValue(user.prefs.handle);
    } else if (user?.name) {
      // Fallback to generated handle from name
      setHandleValue(user.name.toLowerCase().replace(/\s+/g, ''));
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleEditHandle = () => {
    if (user?.prefs?.handle) {
      setHandleValue(user.prefs.handle);
    } else if (user?.name) {
      setHandleValue(user.name.toLowerCase().replace(/\s+/g, ''));
    }
    setIsEditingHandle(true);
  };

  const handleSaveHandle = async () => {
    if (!handleValue.trim()) return;

    try {
      setIsSavingHandle(true);

      // Update user preferences with the new handle
      const currentPrefs = user?.prefs || {};
      const updatedPrefs = {
        ...currentPrefs,
        handle: handleValue.trim()
      };

      await updateUserPrefs(updatedPrefs);

      // Refresh the user data to get the updated preferences
      await refreshAuthStatus();

      setIsEditingHandle(false);
    } catch (error) {
      console.error('Failed to save handle:', error);
      // You might want to show a toast notification here
    } finally {
      setIsSavingHandle(false);
    }
  };

  const handleCancelEdit = () => {
    if (user?.prefs?.handle) {
      setHandleValue(user.prefs.handle);
    } else if (user?.name) {
      setHandleValue(user.name.toLowerCase().replace(/\s+/g, ''));
    }
    setIsEditingHandle(false);
  };

  return (
    <AuthGuard requireAuth={true}>
      <Column
        fillWidth
        padding="l"
        gap="xl"
        maxWidth="m"
      >

        {/* Profile Information Section */}
        <Flex fillWidth gap="xl" mobileDirection="column">
          <Column flex={1} gap="l">

            <Flex
              background="surface"
              border="neutral-medium"
              radius="l"
              padding="xl"
              direction="column"
              gap="l"
            >
              {/* User Details */}
              <Column gap="m">
                <Flex
                  gap="4"
                  vertical="center"
                  onMouseEnter={() => setIsHoveringEmail(true)}
                  onMouseLeave={() => setIsHoveringEmail(false)}
                  style={{ position: 'relative' }}
                >
                  <Column flex={1} gap="4">
                  <Input
                    id="email"
                    label="Email"
                    value={user?.email || ''}
                    placeholder="Enter your email"
                    readOnly
                    style={{
                      filter: isHoveringEmail ? 'blur(2px)' : 'none',
                      transition: 'filter 0.2s ease'
                    }}
                  />
                  </Column>
                  {isHoveringEmail && (
                    <Button
                      variant="tertiary"
                      size="s"
                      onClick={handleLogout}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        zIndex: 1
                      }}
                    >
                      Logout
                    </Button>
                  )}
                </Flex>

                <Column gap="4">
                  {isEditingHandle ? (
                    <Flex gap="4" vertical="center">
                      <Input
                        id="handle"
                        label="Handle"
                        value={handleValue}
                        onChange={(e) => setHandleValue(e.target.value)}
                        placeholder="Your handle"
                      />
                      <Button
                        variant="primary"
                        size="s"
                        onClick={handleSaveHandle}
                        disabled={isSavingHandle}
                      >
                        {isSavingHandle ? 'Saving...' : 'Save'}
                      </Button>
                      <Button
                        variant="secondary"
                        size="s"
                        onClick={handleCancelEdit}
                        disabled={isSavingHandle}
                      >
                        Cancel
                      </Button>
                    </Flex>
                  ) : (
                    <Flex
                      vertical="center"
                      gap="4"
                      onMouseEnter={() => setIsHoveringHandle(true)}
                      onMouseLeave={() => setIsHoveringHandle(false)}
                      style={{ position: 'relative' }}
                    >
                      <Input
                        id="handle"
                        label="Handle"
                        value={user?.prefs?.handle || user?.name?.toLowerCase().replace(/\s+/g, '') || ''}
                        placeholder="Your handle"
                        readOnly
                        style={{
                          filter: isHoveringHandle ? 'blur(2px)' : 'none',
                          transition: 'filter 0.2s ease'
                        }}
                      />
                      {isHoveringHandle && (
                        <Button
                          variant="tertiary"
                          size="s"
                          onClick={handleEditHandle}
                          style={{
                            position: 'absolute',
                            right: '8px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            zIndex: 1
                          }}
                        >
                          Edit
                        </Button>
                      )}
                    </Flex>
                  )}
                </Column>

                <Column gap="4">
                  <Input
                    id="credits"
                    label="Credits"
                    value={user?.prefs?.credits || '0'}
                    placeholder="Your credits"
                    readOnly
                  />
                </Column>
              </Column>
            </Flex>
          </Column>

          {/* Credits Section */}
          <Column flex={1} gap="l">
            <Flex
              background="surface"
              border="neutral-medium"
              radius="l"
              padding="xl"
              direction="column"
              gap="m"
            >
              <Heading variant="heading-strong-s">
                Credits
              </Heading>

              <Column gap="m">
                <Text variant="body-default-s" onBackground="neutral-weak">
                  Built with ❤️ using modern web technologies
                </Text>

                <Flex direction="column" gap="s">
                  <Text variant="body-default-s">
                    <strong>Framework:</strong> Next.js
                  </Text>
                  <Text variant="body-default-s">
                    <strong>Styling:</strong> Once UI
                  </Text>
                  <Text variant="body-default-s">
                    <strong>Authentication:</strong> Appwrite
                  </Text>
                  <Text variant="body-default-s">
                    <strong>Icons:</strong> Phosphor Icons
                  </Text>
                </Flex>
              </Column>
            </Flex>
          </Column>
        </Flex>
      </Column>
    </AuthGuard>
  );
}
