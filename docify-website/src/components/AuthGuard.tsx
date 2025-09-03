"use client";

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Column, Text, Button, Flex } from '@/once-ui/components';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  requireAuth = false
}) => {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && requireAuth && !isAuthenticated) {
      router.push('/get-started');
    }
  }, [user, loading, requireAuth, isAuthenticated, router]);

  if (loading) {
    return (
      <Column
        fillWidth
        fillHeight
        horizontal="center"
        vertical="center"
        gap="m"
      >
        <Text variant="body-default-m">Loading...</Text>
      </Column>
    );
  }

  if (requireAuth && !isAuthenticated) {
    return (
      <Column
        fillWidth
        fillHeight
        horizontal="center"
        vertical="center"
        gap="l"
        padding="l"
      >
        <Column horizontal="center" gap="m">
          <Text variant="heading-strong-l" style={{ textAlign: 'center' }}>
            Authentication Required
          </Text>
          <Text
            variant="body-default-m"
            onBackground="neutral-weak"
            style={{ textAlign: 'center', maxWidth: '400px' }}
          >
            You need to be signed in to access this page.
          </Text>
          <Flex gap="m" horizontal="center">
            <Button
              onClick={() => router.push('/get-started')}
              variant="primary"
              size="m"
            >
              Sign In
            </Button>
            <Button
              onClick={() => router.push('/')}
              variant="secondary"
              size="m"
            >
              Go Home
            </Button>
          </Flex>
        </Column>
      </Column>
    );
  }

  return <>{children}</>;
};


