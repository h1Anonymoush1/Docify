"use client";

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Heading, Text, Column, Button, Flex } from '@/once-ui/components';
import { AuthGuard } from '@/components/AuthGuard';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <AuthGuard requireAuth={true}>
      <Column
        fillWidth
        fillHeight
        horizontal="center"
        vertical="center"
        gap="l"
        padding="l"
      >
        <Column horizontal="center" gap="m">
          <Heading variant="display-strong-l">
            Welcome to Docify, {user?.name}!
          </Heading>

        <Text
          variant="body-default-l"
          onBackground="neutral-weak"
          style={{ textAlign: 'center', maxWidth: '600px' }}
        >
          You're successfully authenticated! This is your dashboard where you can manage your documentation projects.
        </Text>

        {user && (
          <div style={{
            backgroundColor: 'var(--surface-background)',
            borderRadius: 'var(--radius-l)',
            padding: 'var(--space-l)',
            marginTop: 'var(--space-l)',
            border: '1px solid var(--border-neutral-medium)',
            maxWidth: '400px',
            width: '100%'
          }}>
            <Heading variant="heading-strong-m" style={{ marginBottom: 'var(--space-m)' }}>
              User Information
            </Heading>
            <Flex direction="column" gap="s">
              <Text variant="body-default-s">
                <strong>Name:</strong> {user.name}
              </Text>
              <Text variant="body-default-s">
                <strong>Email:</strong> {user.email}
              </Text>
              <Text variant="body-default-s">
                <strong>Email Verified:</strong> {user.emailVerification ? 'Yes' : 'No'}
              </Text>
              <Text variant="body-default-s">
                <strong>User ID:</strong> {user.$id}
              </Text>
            </Flex>
          </div>
        )}

        <Flex gap="m" horizontal="center" mobileDirection="column">
          <Button
            onClick={handleLogout}
            variant="secondary"
            size="m"
          >
            Logout
          </Button>

          <Button
            onClick={() => router.push('/')}
            variant="primary"
            size="m"
          >
            Go to Home
          </Button>
        </Flex>
      </Column>
    </Column>
    </AuthGuard>
  );
}
